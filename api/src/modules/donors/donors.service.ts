import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { BloodType, DonorCategory, ExternalDonationStatus, ProductType } from '@prisma/client';
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

  // Descifra campos sensibles y quita passwordHash / *Hash (índice ciego interno)
  // antes de devolver un donante.
  private sanitize(donor: any): any {
    if (!donor) return donor;
    const { passwordHash: _passwordHash, idNumberHash: _idNumberHash, emailHash: _emailHash, phoneHash: _phoneHash, ...rest } = donor;
    return {
      ...rest,
      idNumber: donor.idNumber ? this.encryption.decrypt(donor.idNumber) : donor.idNumber,
      phone: donor.phone ? this.encryption.decrypt(donor.phone) : donor.phone,
      email: donor.email ? this.encryption.decrypt(donor.email) : donor.email,
      address: donor.address ? this.encryption.decrypt(donor.address) : donor.address,
      latitude: donor.latitude != null ? parseFloat(this.encryption.decrypt(donor.latitude)) : donor.latitude,
      longitude: donor.longitude != null ? parseFloat(this.encryption.decrypt(donor.longitude)) : donor.longitude,
      adminNotes: donor.adminNotes ? this.encryption.decrypt(donor.adminNotes) : donor.adminNotes,
      fcmToken: donor.fcmToken ? this.encryption.decrypt(donor.fcmToken) : donor.fcmToken,
    };
  }

  async create(dto: CreateDonorDto) {
    const idNumberHash = this.encryption.hash(dto.idNumber);
    const exists = await this.prisma.donor.findUnique({ where: { idNumberHash } });
    if (exists) throw new ConflictException('Ya existe un donante con ese número de identificación');

    // ponytail: sin contraseña explícita, genera una temporal aleatoria en vez de
    // reusar la cédula (dato conocible, no un secreto). Se devuelve una sola vez
    // en la respuesta para que el staff se la entregue al donante.
    const generatedPassword = dto.password ? null : crypto.randomBytes(8).toString('base64url');
    const passwordHash = await bcrypt.hash(dto.password || generatedPassword!, 12);

    const donor = await this.prisma.donor.create({
      data: {
        name: dto.name,
        idType: dto.idType,
        idNumber: this.encryption.encrypt(dto.idNumber),
        idNumberHash,
        phone: this.encryption.encrypt(dto.phone),
        phoneHash: this.encryption.hash(dto.phone),
        email: dto.email ? this.encryption.encrypt(dto.email) : null,
        emailHash: dto.email ? this.encryption.hash(dto.email) : null,
        bloodType: dto.bloodType,
        rhFactor: dto.rhFactor,
        passwordHash,
        referredById: dto.referredById || null,
        photoUrl: dto.photoUrl || null,
        adminNotes: dto.adminNotes ? this.encryption.encrypt(dto.adminNotes) : null,
      },
    });
    return { ...this.sanitize(donor), ...(generatedPassword ? { generatedPassword } : {}) };
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
      // idNumber/phone están cifrados en reposo: la búsqueda por substring ya no
      // es posible sobre ellos, degrada a coincidencia exacta vía índice ciego.
      const searchHash = this.encryption.hash(search);
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { idNumberHash: searchHash },
        { phoneHash: searchHash },
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

    return { donors: donors.map((d) => this.sanitize(d)), total, page, limit };
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
    return this.sanitize(donor);
  }

  async update(id: string, dto: UpdateDonorDto) {
    await this.findOne(id);
    const { adminNotes, fcmToken, phone, email, address, latitude, longitude, ...rest } = dto;
    const data: Record<string, unknown> = { ...rest };
    if (adminNotes !== undefined) data.adminNotes = adminNotes ? this.encryption.encrypt(adminNotes) : null;
    if (fcmToken !== undefined) data.fcmToken = fcmToken ? this.encryption.encrypt(fcmToken) : null;
    if (phone !== undefined) {
      data.phone = this.encryption.encrypt(phone);
      data.phoneHash = this.encryption.hash(phone);
    }
    if (email !== undefined) {
      data.email = email ? this.encryption.encrypt(email) : null;
      data.emailHash = email ? this.encryption.hash(email) : null;
    }
    if (address !== undefined) data.address = address ? this.encryption.encrypt(address) : null;
    if (latitude !== undefined) data.latitude = latitude != null ? this.encryption.encrypt(String(latitude)) : null;
    if (longitude !== undefined) data.longitude = longitude != null ? this.encryption.encrypt(String(longitude)) : null;
    const donor = await this.prisma.donor.update({ where: { id }, data });
    return this.sanitize(donor);
  }

  async setCategory(id: string, category: DonorCategory) {
    await this.findOne(id);
    const donor = await this.prisma.donor.update({ where: { id }, data: { category } });
    return this.sanitize(donor);
  }

  async setPriority(id: string, isPriority: boolean) {
    await this.findOne(id);
    const donor = await this.prisma.donor.update({ where: { id }, data: { isPriorityDonor: isPriority } });
    return this.sanitize(donor);
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
    const [ownDonations, externalDonations] = await Promise.all([
      this.prisma.bloodUnit.count({
        where: { donorId, collectionDate: { gte: yearStart } },
      }),
      this.prisma.externalDonation.count({
        where: { donorId, status: ExternalDonationStatus.VERIFIED, donationDate: { gte: yearStart } },
      }),
    ]);
    const donationsThisYear = ownDonations + externalDonations;

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
