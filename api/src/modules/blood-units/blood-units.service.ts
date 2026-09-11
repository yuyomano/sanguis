import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BloodType, BloodUnitStatus, ProductType } from '@prisma/client';
import { CreateBloodUnitDto } from './dto/create-blood-unit.dto';
import dayjs from 'dayjs';

// Expiration days by product type (AABB standards)
const EXPIRATION_DAYS: Record<ProductType, number> = {
  WHOLE_BLOOD: 35,
  PLATELETS: 5,
  PLASMA: 365,
};

// Valid status transitions
const VALID_TRANSITIONS: Partial<Record<BloodUnitStatus, BloodUnitStatus[]>> = {
  COLLECTED: [BloodUnitStatus.TESTING],
  TESTING: [BloodUnitStatus.QUARANTINE],
  QUARANTINE: [BloodUnitStatus.APPROVED, BloodUnitStatus.REJECTED],
  APPROVED: [BloodUnitStatus.STORED],
  STORED: [BloodUnitStatus.ALLOCATED, BloodUnitStatus.DISCARDED],
  ALLOCATED: [BloodUnitStatus.USED, BloodUnitStatus.STORED],
};

@Injectable()
export class BloodUnitsService {
  constructor(private prisma: PrismaService) {}

  async getStorageLocations() {
    return this.prisma.storageLocation.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(dto: CreateBloodUnitDto) {
    const donor = await this.prisma.donor.findUnique({ where: { id: dto.donorId } });
    if (!donor) throw new NotFoundException('Donante no encontrado');

    const expirationDate = dayjs()
      .add(EXPIRATION_DAYS[dto.productType], 'day')
      .toDate();

    const unit = await this.prisma.bloodUnit.create({
      data: {
        donorId: dto.donorId,
        bagNumber: dto.bagNumber,
        bloodType: dto.bloodType,
        rhFactor: dto.rhFactor,
        productType: dto.productType,
        volumeMl: dto.volumeMl,
        collectionDate: dto.collectionDate ? new Date(dto.collectionDate) : new Date(),
        expirationDate,
        storageLocationId: dto.storageLocationId,
        storageShelf: dto.storageShelf,
      },
    });

    // Update donor stats
    await this.prisma.donor.update({
      where: { id: dto.donorId },
      data: {
        totalDonations: { increment: 1 },
        lastDonationDate: new Date(),
      },
    });

    return unit;
  }

  async findAll(query: {
    bloodType?: BloodType;
    productType?: ProductType;
    status?: BloodUnitStatus;
    storageLocationId?: string;
    expiringInDays?: number;
    page?: number;
    limit?: number;
  }) {
    const { bloodType, productType, status, storageLocationId, expiringInDays, page: pageRaw, limit: limitRaw } = query;
    const page = Math.max(1, parseInt(String(pageRaw ?? 1), 10) || 1);
    const limit = Math.max(1, parseInt(String(limitRaw ?? 20), 10) || 20);
    const where: any = {};

    if (bloodType) where.bloodType = bloodType;
    if (productType) where.productType = productType;
    if (status) where.status = status;
    if (storageLocationId) where.storageLocationId = storageLocationId;
    if (expiringInDays) {
      where.expirationDate = { lte: dayjs().add(expiringInDays, 'day').toDate() };
      where.status = { notIn: [BloodUnitStatus.USED, BloodUnitStatus.DISCARDED, BloodUnitStatus.REJECTED] };
    }

    const [units, total] = await Promise.all([
      this.prisma.bloodUnit.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { expirationDate: 'asc' },
        include: {
          donor: { select: { name: true, bloodType: true, rhFactor: true } },
          storageLocation: true,
          testResults: { orderBy: { createdAt: 'desc' }, take: 1 },
        },
      }),
      this.prisma.bloodUnit.count({ where }),
    ]);

    return { units, total, page, limit };
  }

  async findByDonor(donorId: string) {
    return this.prisma.bloodUnit.findMany({
      where: { donorId },
      orderBy: { collectionDate: 'desc' },
      include: {
        storageLocation: { select: { name: true } },
        testResults: { orderBy: { createdAt: 'desc' }, take: 1, select: { isViable: true, createdAt: true } },
        deliveryItems: { include: { deliveryOrder: { select: { status: true, deliveredAt: true, destinationName: true } } }, take: 1 },
      },
    });
  }

  async findOne(id: string) {
    const unit = await this.prisma.bloodUnit.findUnique({
      where: { id },
      include: {
        donor: { select: { id: true, name: true, idNumber: true, phone: true, bloodType: true, rhFactor: true } },
        storageLocation: true,
        testResults: { include: { externalLab: true } },
        deliveryItems: { include: { deliveryOrder: true } },
      },
    });
    if (!unit) throw new NotFoundException('Unidad de sangre no encontrada');
    return unit;
  }

  async transition(id: string, newStatus: BloodUnitStatus, notes?: string) {
    const unit = await this.findOne(id);
    const allowed = VALID_TRANSITIONS[unit.status] || [];

    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `No se puede pasar de ${unit.status} a ${newStatus}`,
      );
    }

    const data: any = { status: newStatus };
    if (newStatus === BloodUnitStatus.USED) data.usedAt = new Date();
    if (notes) data.usedForNote = notes;

    return this.prisma.bloodUnit.update({ where: { id }, data });
  }

  async getInventorySummary() {
    const active = [
      BloodUnitStatus.STORED,
      BloodUnitStatus.APPROVED,
      BloodUnitStatus.QUARANTINE,
    ];

    const [byTypeAndProduct, expiringSoon, total] = await Promise.all([
      this.prisma.bloodUnit.groupBy({
        by: ['bloodType', 'productType', 'status'],
        where: { status: { in: active } },
        _count: true,
      }),
      this.prisma.bloodUnit.count({
        where: {
          status: { in: active },
          expirationDate: { lte: dayjs().add(7, 'day').toDate() },
        },
      }),
      this.prisma.bloodUnit.count({ where: { status: { in: active } } }),
    ]);

    return { byTypeAndProduct, expiringSoon, total };
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async checkExpirations() {
    const soon = dayjs().add(7, 'day').toDate();
    const expired = new Date();

    await this.prisma.bloodUnit.updateMany({
      where: {
        expirationDate: { lt: expired },
        status: { in: [BloodUnitStatus.STORED, BloodUnitStatus.APPROVED] },
      },
      data: { status: BloodUnitStatus.DISCARDED },
    });
  }
}
