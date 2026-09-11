import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { WhatsappService } from './whatsapp.service';
import { EmailService } from './email.service';
import { FcmService } from './fcm.service';
import { NotificationStatus, NotificationType } from '@prisma/client';
import dayjs from 'dayjs';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private whatsapp: WhatsappService,
    private email: EmailService,
    private fcm: FcmService,
  ) {}

  async broadcastEvent(eventId: string) {
    const event = await this.prisma.donationEvent.findUnique({ where: { id: eventId } });
    if (!event) return;

    const rawDonors = await this.prisma.donor.findMany({
      where: { isActive: true },
      select: { id: true, name: true, phone: true, email: true, referralCode: true, fcmToken: true },
    });
    const donors = rawDonors.map((d) => ({
      ...d,
      phone: this.encryption.decrypt(d.phone),
      email: d.email ? this.encryption.decrypt(d.email) : d.email,
    }));

    const results = { sent: 0, failed: 0 };
    const formattedDate = dayjs(event.startDatetime).format('DD/MM/YYYY [a las] HH:mm');

    // Push FCM a todos los donantes con token registrado (fcmToken se guarda cifrado)
    const tokens = donors
      .map((d) => (d.fcmToken ? this.encryption.decrypt(d.fcmToken) : d.fcmToken))
      .filter(Boolean) as string[];
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

}
