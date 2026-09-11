import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { WhatsappService } from '../notifications/whatsapp.service';
import { EmailService } from '../notifications/email.service';
import { FcmService } from '../notifications/fcm.service';
import { ELIGIBILITY_DAYS } from '../donors/donors.service';
import { BloodType, ProductType, NotificationType, NotificationStatus } from '@prisma/client';
import { CreateEmergencyRequestDto } from './dto/create-emergency-request.dto';
import { NotifyCandidatesDto } from './dto/notify.dto';
import dayjs from 'dayjs';

const BLOOD_LABELS: Record<BloodType, string> = {
  A_POSITIVE: 'A+', A_NEGATIVE: 'A-', B_POSITIVE: 'B+', B_NEGATIVE: 'B-',
  AB_POSITIVE: 'AB+', AB_NEGATIVE: 'AB-', O_POSITIVE: 'O+', O_NEGATIVE: 'O-',
};

const PRODUCT_LABELS: Record<ProductType, string> = {
  WHOLE_BLOOD: 'Sangre Entera',
  PLATELETS: 'Plaquetas',
  PLASMA: 'Plasma',
};

// Compatibilidad ABO+Rh — glóbulos rojos/plaquetas estricta, plasma invertida
function getCompatibleDonorTypes(patientType: BloodType, productType: ProductType): BloodType[] {
  if (productType === ProductType.PLASMA) {
    const plasma: Record<BloodType, BloodType[]> = {
      O_NEGATIVE: [BloodType.O_NEGATIVE, BloodType.O_POSITIVE],
      O_POSITIVE: [BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
      A_NEGATIVE: [BloodType.A_NEGATIVE, BloodType.A_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
      A_POSITIVE: [BloodType.A_POSITIVE, BloodType.A_NEGATIVE, BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE],
      B_NEGATIVE: [BloodType.B_NEGATIVE, BloodType.B_POSITIVE, BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
      B_POSITIVE: [BloodType.B_POSITIVE, BloodType.B_NEGATIVE, BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE],
      AB_NEGATIVE: [BloodType.AB_NEGATIVE, BloodType.AB_POSITIVE],
      AB_POSITIVE: [BloodType.AB_POSITIVE, BloodType.AB_NEGATIVE],
    };
    return plasma[patientType] || [];
  }
  const gr: Record<BloodType, BloodType[]> = {
    O_NEGATIVE: [BloodType.O_NEGATIVE],
    O_POSITIVE: [BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
    A_NEGATIVE: [BloodType.A_NEGATIVE, BloodType.O_NEGATIVE],
    A_POSITIVE: [BloodType.A_POSITIVE, BloodType.A_NEGATIVE, BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
    B_NEGATIVE: [BloodType.B_NEGATIVE, BloodType.O_NEGATIVE],
    B_POSITIVE: [BloodType.B_POSITIVE, BloodType.B_NEGATIVE, BloodType.O_POSITIVE, BloodType.O_NEGATIVE],
    AB_NEGATIVE: [BloodType.AB_NEGATIVE, BloodType.A_NEGATIVE, BloodType.B_NEGATIVE, BloodType.O_NEGATIVE],
    AB_POSITIVE: Object.values(BloodType) as BloodType[],
  };
  return gr[patientType] || [];
}

// Distancia entre dos coordenadas (km) — fórmula de Haversine
function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const CATEGORY_RANK: Record<string, number> = { VIP: 0, RECURRENT: 1, CASUAL: 2 };

@Injectable()
export class EmergencyRequestsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
    private whatsapp: WhatsappService,
    private email: EmailService,
    private fcm: FcmService,
  ) {}

  async create(dto: CreateEmergencyRequestDto) {
    return this.prisma.emergencyRequest.create({ data: dto });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (+page - 1) * +limit;
    const [requests, total] = await Promise.all([
      this.prisma.emergencyRequest.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: +limit,
      }),
      this.prisma.emergencyRequest.count(),
    ]);
    return { requests, total };
  }

  async findOne(id: string) {
    const request = await this.prisma.emergencyRequest.findUnique({
      where: { id },
      include: { notifications: { include: { donor: { select: { name: true } } } } },
    });
    if (!request) throw new NotFoundException('Solicitud de emergencia no encontrada');
    return request;
  }

  async updateStatus(id: string, status: string) {
    await this.findOne(id);
    return this.prisma.emergencyRequest.update({
      where: { id },
      data: { status: status as any, resolvedAt: status === 'OPEN' ? null : new Date() },
    });
  }

  async findCandidates(id: string, city?: string, maxDistanceKm?: number) {
    const request = await this.findOne(id);
    const compatibleTypes = getCompatibleDonorTypes(request.bloodType, request.productType);
    const requiredDays = ELIGIBILITY_DAYS[request.productType];

    const donors = await this.prisma.donor.findMany({
      where: { bloodType: { in: compatibleTypes }, isActive: true },
      select: {
        id: true, name: true, phone: true, email: true, bloodType: true, category: true,
        city: true, address: true, latitude: true, longitude: true, lastDonationDate: true,
      },
    });

    const cityFilter = city?.trim().toLowerCase();
    const hasRequestCoords = request.latitude != null && request.longitude != null;

    const candidates = donors
      .filter((d) => !d.lastDonationDate || dayjs().diff(dayjs(d.lastDonationDate), 'day') >= requiredDays)
      .map((d) => {
        const distance = hasRequestCoords && d.latitude != null && d.longitude != null
          ? distanceKm(request.latitude!, request.longitude!, d.latitude, d.longitude)
          : null;
        return { ...d, distanceKm: distance != null ? +distance.toFixed(1) : null };
      })
      .filter((d) => !cityFilter || d.city?.toLowerCase().includes(cityFilter))
      .filter((d) => maxDistanceKm == null || d.distanceKm == null || d.distanceKm <= maxDistanceKm)
      .sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
        if (a.distanceKm != null) return -1;
        if (b.distanceKm != null) return 1;
        return (CATEGORY_RANK[a.category] ?? 3) - (CATEGORY_RANK[b.category] ?? 3);
      });

    return { compatibleTypes, requiredDays, candidates };
  }

  async notify(id: string, dto: NotifyCandidatesDto) {
    const request = await this.findOne(id);
    const donors = await this.prisma.donor.findMany({
      where: { id: { in: dto.donorIds } },
      select: { id: true, name: true, phone: true, email: true, fcmToken: true },
    });

    const title = request.urgencyLevel >= 3 ? '🚨 ALERTA CRÍTICA — Sanguis' : request.urgencyLevel === 2 ? '⚠️ Alerta urgente — Sanguis' : '🔔 Convocatoria — Sanguis';
    const bodyText = `Se necesitan ${request.unitsNeeded} unidad(es) de ${PRODUCT_LABELS[request.productType]} tipo ${BLOOD_LABELS[request.bloodType]} en ${request.hospitalName}, ${request.city}.${request.notes ? ` ${request.notes}` : ''} Tu tipo de sangre es compatible. ¿Puedes donar hoy?`;

    let sent = 0;
    let failed = 0;

    for (const donor of donors) {
      for (const channel of dto.channels) {
        try {
          if (channel === NotificationType.PUSH) {
            if (!donor.fcmToken) throw new Error('Sin token FCM');
            await this.fcm.sendToTokens([this.encryption.decrypt(donor.fcmToken)], { title, body: bodyText, data: { type: 'emergency', emergencyRequestId: id } });
          } else if (channel === NotificationType.WHATSAPP) {
            await this.whatsapp.sendTextMessage(donor.phone, `${title}\n\n${bodyText}`);
          } else if (channel === NotificationType.EMAIL) {
            if (!donor.email) throw new Error('Sin email');
            await this.email.sendEmail(donor.email, title, this.email.buildEmergencyRequestHtml(request.hospitalName, request.city, BLOOD_LABELS[request.bloodType], PRODUCT_LABELS[request.productType], request.unitsNeeded));
          }
          await this.prisma.notification.create({
            data: {
              donorId: donor.id, emergencyRequestId: id, type: channel,
              recipient: channel === NotificationType.EMAIL ? donor.email! : donor.phone,
              body: bodyText, status: NotificationStatus.SENT, sentAt: new Date(),
            },
          });
          sent++;
        } catch (error: any) {
          await this.prisma.notification.create({
            data: {
              donorId: donor.id, emergencyRequestId: id, type: channel,
              recipient: donor.phone, body: bodyText, status: NotificationStatus.FAILED,
              error: error.message,
            },
          });
          failed++;
        }
      }
    }

    await this.prisma.emergencyRequest.update({
      where: { id },
      data: { targetReachedCount: { increment: donors.length } },
    });

    return { notifiedDonors: donors.length, sent, failed };
  }
}
