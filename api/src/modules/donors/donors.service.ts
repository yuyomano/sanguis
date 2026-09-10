import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { BloodType, DonorCategory, ProductType } from '@prisma/client';
import { CreateDonorDto } from './dto/create-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';
import dayjs from 'dayjs';

// Minimum days between donations by product type
export const ELIGIBILITY_DAYS: Record<ProductType, number> = {
  WHOLE_BLOOD: 56,
  PLATELETS: 2,
  PLASMA: 7,
};

@Injectable()
export class DonorsService {
  constructor(
    private prisma: PrismaService,
    private encryption: EncryptionService,
  ) {}

  // Decrypt sensitive fields before returning a donor to callers
  private decrypt(donor: any): any {
    if (!donor) return donor;
    return {
      ...donor,
      adminNotes: donor.adminNotes ? this.encryption.decrypt(donor.adminNotes) : donor.adminNotes,
      fcmToken: donor.fcmToken ? this.encryption.decrypt(donor.fcmToken) : donor.fcmToken,
    };
  }

  async create(dto: CreateDonorDto) {
    const exists = await this.prisma.donor.findUnique({ where: { idNumber: dto.idNumber } });
    if (exists) throw new ConflictException('Ya existe un donante con ese número de identificación');

    const passwordHash = await bcrypt.hash(dto.password || dto.idNumber, 12);

    const donor = await this.prisma.donor.create({
      data: {
        name: dto.name,
        idType: dto.idType,
        idNumber: dto.idNumber,
        phone: dto.phone,
        email: dto.email,
        bloodType: dto.bloodType,
        rhFactor: dto.rhFactor,
        passwordHash,
        referredById: dto.referredById || null,
        photoUrl: dto.photoUrl || null,
        adminNotes: dto.adminNotes ? this.encryption.encrypt(dto.adminNotes) : null,
      },
    });
    return this.decrypt(donor);
  }

  async findAll(query: {
    search?: string;
    bloodType?: BloodType;
    category?: DonorCategory;
    page?: number;
    limit?: number;
  }) {
    const { search, bloodType, category, page: pageRaw, limit: limitRaw } = query;
    const page = Math.max(1, parseInt(String(pageRaw ?? 1), 10) || 1);
    const limit = Math.max(1, parseInt(String(limitRaw ?? 20), 10) || 20);
    const where: any = { isActive: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { idNumber: { contains: search } },
        { phone: { contains: search } },
      ];
    }
    if (bloodType) where.bloodType = bloodType;
    if (category) where.category = category;

    const [donors, total] = await Promise.all([
      this.prisma.donor.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { _count: { select: { bloodUnits: true } } },
      }),
      this.prisma.donor.count({ where }),
    ]);

    return { donors, total, page, limit };
  }

  async findOne(id: string) {
    const donor = await this.prisma.donor.findUnique({
      where: { id },
      include: {
        bloodUnits: {
          orderBy: { collectionDate: 'desc' },
          take: 10,
          include: { testResults: true, storageLocation: true },
        },
        pointTransactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        appointments: { orderBy: { scheduledTime: 'desc' }, take: 5, include: { event: true } },
        _count: { select: { bloodUnits: true, referrals: true } },
      },
    });
    if (!donor) throw new NotFoundException('Donante no encontrado');
    return this.decrypt(donor);
  }

  async update(id: string, dto: UpdateDonorDto) {
    await this.findOne(id);
    const { adminNotes, fcmToken, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (adminNotes !== undefined) data.adminNotes = adminNotes ? this.encryption.encrypt(adminNotes) : null;
    if (fcmToken !== undefined) data.fcmToken = fcmToken ? this.encryption.encrypt(fcmToken) : null;
    const donor = await this.prisma.donor.update({ where: { id }, data });
    return this.decrypt(donor);
  }

  async setCategory(id: string, category: DonorCategory) {
    await this.findOne(id);
    return this.prisma.donor.update({ where: { id }, data: { category } });
  }

  async setPriority(id: string, isPriority: boolean) {
    await this.findOne(id);
    return this.prisma.donor.update({ where: { id }, data: { isPriorityDonor: isPriority } });
  }

  async checkEligibility(id: string, productType: ProductType = ProductType.WHOLE_BLOOD) {
    const donor = await this.findOne(id);
    if (!donor.lastDonationDate) return { eligible: true, nextEligibleDate: null };

    const daysSinceLast = dayjs().diff(dayjs(donor.lastDonationDate), 'day');
    const required = ELIGIBILITY_DAYS[productType];
    const eligible = daysSinceLast >= required;
    const nextEligibleDate = eligible
      ? null
      : dayjs(donor.lastDonationDate).add(required, 'day').toDate();

    return { eligible, daysSinceLast, requiredDays: required, nextEligibleDate };
  }

  async recalculateCategory(donorId: string) {
    const yearStart = dayjs().startOf('year').toDate();
    const donationsThisYear = await this.prisma.bloodUnit.count({
      where: { donorId, collectionDate: { gte: yearStart } },
    });

    let category: DonorCategory = DonorCategory.CASUAL;
    if (donationsThisYear >= 6) category = DonorCategory.VIP;
    else if (donationsThisYear >= 3) category = DonorCategory.RECURRENT;

    await this.prisma.donor.update({ where: { id: donorId }, data: { category } });
    return category;
  }

  async getStats() {
    const [total, byCategory, byBloodType, newThisMonth] = await Promise.all([
      this.prisma.donor.count({ where: { isActive: true } }),
      this.prisma.donor.groupBy({ by: ['category'], _count: true }),
      this.prisma.donor.groupBy({ by: ['bloodType'], _count: true }),
      this.prisma.donor.count({
        where: { createdAt: { gte: dayjs().startOf('month').toDate() } },
      }),
    ]);

    return { total, byCategory, byBloodType, newThisMonth };
  }
}
