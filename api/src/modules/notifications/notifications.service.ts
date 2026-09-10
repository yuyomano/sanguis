import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { WhatsappService } from './whatsapp.service';
import { EmailService } from './email.service';
import { FcmService } from './fcm.service';
import { NotificationStatus, NotificationType, BloodType, ProductType } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private whatsapp: WhatsappService,
    private email: EmailService,
    private fcm: FcmService,
  ) {}

  async broadcastEvent(eventId: string) {
    const event = await this.prisma.donationEvent.findUnique({ where: { id: eventId } });
    if (!event) return;

    const donors = await this.prisma.donor.findMany({
      where: { isActive: true },
      select: { id: true, name: true, phone: true, email: true, referralCode: true, fcmToken: true },
    });

    const results = { sent: 0, failed: 0 };
    const formattedDate = dayjs(event.startDatetime).format('DD/MM/YYYY [a las] HH:mm');

    // Push FCM a todos los donantes con token registrado
    const tokens = donors.map((d) => d.fcmToken).filter(Boolean) as string[];
    await this.fcm.sendToTokens(tokens, {
      title: `🩸 Nuevo evento: ${event.name}`,
      body: `${formattedDate} — ${event.locationAddress}`,
      data: { type: 'event', id: eventId },
    });

    for (const donor of donors) {
      try {
        await this.whatsapp.sendTextMessage(
          donor.phone,
          `🩸 *Sanguis* — Evento de donación\n\n*${event.name}*\n📅 ${formattedDate}\n📍 ${event.locationAddress}\n\nTu donación puede salvar hasta 3 vidas. Reserva tu cita en la app Sanguis.\n\n¿Conoces a alguien? Comparte tu código: ${donor.referralCode}`,
        );
        if (donor.email) {
          await this.email.sendEmail(
            donor.email,
            `Evento de Donación: ${event.name}`,
            this.email.buildEventNotificationHtml(
              event.name,
              formattedDate,
              event.locationAddress,
              donor.referralCode,
            ),
          );
        }
        await this.prisma.notification.create({
          data: {
            donorId: donor.id,
            type: NotificationType.WHATSAPP,
            recipient: donor.phone,
            body: `Evento: ${event.name}`,
            status: NotificationStatus.SENT,
            sentAt: new Date(),
          },
        });
        results.sent++;
      } catch {
        results.failed++;
      }
    }

    return results;
  }

  async previewEmergencyAlert(bloodType: BloodType, productType: ProductType) {
    const compatibleTypes = this.getCompatibleDonors(bloodType, productType);
    const donorCount = await this.prisma.donor.count({
      where: { bloodType: { in: compatibleTypes }, isActive: true },
    });
    return { compatibleTypes, donorCount };
  }

  async sendEmergencyAlert(bloodType: BloodType, productType: ProductType, message: string, urgencyLevel = 1) {
    const compatibleTypes = this.getCompatibleDonors(bloodType, productType);
    const donors = await this.prisma.donor.findMany({
      where: { bloodType: { in: compatibleTypes }, isActive: true },
      select: { id: true, name: true, phone: true, fcmToken: true },
    });

    const alert = await this.prisma.emergencyAlert.create({
      data: { bloodType, productType, message, targetReachedCount: donors.length },
    });

    const title = urgencyLevel >= 3 ? '🚨 ALERTA CRÍTICA — Sanguis' : urgencyLevel === 2 ? '⚠️ Alerta urgente — Sanguis' : '🔔 Convocatoria — Sanguis';

    // FCM push (alta prioridad)
    const tokens = donors.map((d) => d.fcmToken).filter(Boolean) as string[];
    await this.fcm.sendToTokens(tokens, {
      title,
      body: message,
      data: { type: 'emergency', urgencyLevel: String(urgencyLevel) },
    });

    // WhatsApp como canal de respaldo
    for (const donor of donors) {
      await this.whatsapp
        .sendTextMessage(donor.phone, `${title}\n\n${message}\n\nTu tipo de sangre es compatible. ¿Puedes donar hoy?`)
        .catch(() => {});
    }

    return { alertId: alert.id, notified: donors.length, compatibleTypes };
  }

  async findAll(page = 1, limit = 50) {
    const skip = (+page - 1) * +limit;
    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
        include: { donor: { select: { name: true } } },
      }),
      this.prisma.notification.count(),
    ]);
    return { notifications, total };
  }

  async findByDonor(donorId: string, limit = 30) {
    const notifications = await this.prisma.notification.findMany({
      where: { donorId },
      orderBy: { createdAt: 'desc' },
      take: +limit,
    });
    return { notifications };
  }

  private getCompatibleDonors(patientType: BloodType, productType?: ProductType): BloodType[] {
    if (productType === ProductType.PLASMA) {
      const plasma: Record<BloodType, BloodType[]> = {
        O_NEGATIVE:  [BloodType.O_NEGATIVE, BloodType.O_POSITIVE],
        O_POSITIVE:  [BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
        A_NEGATIVE:  [BloodType.A_NEGATIVE, BloodType.A_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
        A_POSITIVE:  [BloodType.A_POSITIVE, BloodType.A_NEGATIVE, BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE],
        B_NEGATIVE:  [BloodType.B_NEGATIVE, BloodType.B_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
        B_POSITIVE:  [BloodType.B_POSITIVE, BloodType.B_NEGATIVE, BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE],
        AB_NEGATIVE: [BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
        AB_POSITIVE: [BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE],
      };
      return plasma[patientType] || [];
    }
    // GR / WHOLE_BLOOD / PLATELETS — reglas ABO+Rh estándar
    const gr: Record<BloodType, BloodType[]> = {
      O_NEGATIVE:  [BloodType.O_NEGATIVE],
      O_POSITIVE:  [BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
      A_NEGATIVE:  [BloodType.A_NEGATIVE, BloodType.O_NEGATIVE],
      A_POSITIVE:  [BloodType.A_POSITIVE, BloodType.A_NEGATIVE, BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
      B_NEGATIVE:  [BloodType.B_NEGATIVE, BloodType.O_NEGATIVE],
      B_POSITIVE:  [BloodType.B_POSITIVE, BloodType.B_NEGATIVE, BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
      AB_NEGATIVE: [BloodType.AB_NEGATIVE, BloodType.A_NEGATIVE, BloodType.B_NEGATIVE, BloodType.O_NEGATIVE],
      AB_POSITIVE: Object.values(BloodType) as BloodType[],
    };
    return gr[patientType] || [];
  }
}
