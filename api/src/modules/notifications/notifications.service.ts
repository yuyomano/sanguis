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

  async sendEmergencyAlert(bloodType: BloodType, productType: ProductType, message: string) {
    const compatibleTypes = this.getCompatibleDonors(bloodType);
    const donors = await this.prisma.donor.findMany({
      where: { bloodType: { in: compatibleTypes }, isActive: true },
      select: { id: true, name: true, phone: true, fcmToken: true },
    });

    const alert = await this.prisma.emergencyAlert.create({
      data: { bloodType, productType, message, targetReachedCount: donors.length },
    });

    // FCM push (alta prioridad)
    const tokens = donors.map((d) => d.fcmToken).filter(Boolean) as string[];
    await this.fcm.sendToTokens(tokens, {
      title: '🚨 Alerta Urgente — Sanguis',
      body: message,
      data: { type: 'emergency' },
    });

    // WhatsApp como canal de respaldo
    for (const donor of donors) {
      await this.whatsapp
        .sendTextMessage(donor.phone, `🚨 *ALERTA URGENTE — Sanguis*\n\n${message}\n\nTu tipo de sangre es compatible. ¿Puedes donar hoy?`)
        .catch(() => {});
    }

    return { alertId: alert.id, notified: donors.length };
  }

  private getCompatibleDonors(requestedType: BloodType): BloodType[] {
    const compatibility: Record<BloodType, BloodType[]> = {
      O_NEGATIVE: [BloodType.O_NEGATIVE],
      O_POSITIVE: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE],
      A_NEGATIVE: [BloodType.A_NEGATIVE, BloodType.O_NEGATIVE],
      A_POSITIVE: [BloodType.A_POSITIVE, BloodType.A_NEGATIVE, BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
      B_NEGATIVE: [BloodType.B_NEGATIVE, BloodType.O_NEGATIVE],
      B_POSITIVE: [BloodType.B_POSITIVE, BloodType.B_NEGATIVE, BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
      AB_NEGATIVE: [BloodType.A_NEGATIVE, BloodType.B_NEGATIVE, BloodType.AB_NEGATIVE, BloodType.O_NEGATIVE],
      AB_POSITIVE: Object.values(BloodType),
    };
    return compatibility[requestedType] || [];
  }
}
