import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import dayjs from 'dayjs';
import { AdminRole, DonationReporter, ExternalDonationStatus, ProductType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DonorsService, ELIGIBILITY_DAYS } from '../donors/donors.service';
import { RewardsService } from '../rewards/rewards.service';
import { CreateExternalDonationDto } from './dto/create-external-donation.dto';
import { ReportInstitutionDonationDto } from './dto/report-institution-donation.dto';
import { VerifyExternalDonationDto } from './dto/verify-external-donation.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { CreateInstitutionUserDto } from './dto/create-institution-user.dto';

@Injectable()
export class ExternalDonationsService {
  constructor(
    private prisma: PrismaService,
    private donorsService: DonorsService,
    private rewardsService: RewardsService,
  ) {}

  // ── Reporte del donante (pendiente de verificación) ─────────────────────────

  async createSelfReport(donorId: string, dto: CreateExternalDonationDto) {
    return this.prisma.externalDonation.create({
      data: {
        donorId,
        donationDate: new Date(dto.donationDate),
        productType: dto.productType,
        sourceType: dto.sourceType,
        sourceName: dto.sourceName,
        proofUrl: dto.proofUrl,
        notes: dto.notes,
        reportedBy: DonationReporter.DONOR_SELF,
        status: ExternalDonationStatus.PENDING,
      },
    });
  }

  async findForDonor(donorId: string) {
    return this.prisma.externalDonation.findMany({
      where: { donorId },
      orderBy: { donationDate: 'desc' },
    });
  }

  // ── Reporte de una institución (auto-verificado) ─────────────────────────────

  async createInstitutionReport(institutionId: string, dto: ReportInstitutionDonationDto) {
    const [institution, donor] = await Promise.all([
      this.prisma.partnerInstitution.findUnique({ where: { id: institutionId } }),
      this.prisma.donor.findUnique({ where: { idNumber: dto.donorIdNumber } }),
    ]);
    if (!institution || !institution.isActive) throw new NotFoundException('Institución no encontrada');
    if (!donor) throw new NotFoundException('No hay un donante registrado en Sanguis con esa cédula/pasaporte');

    const donation = await this.prisma.externalDonation.create({
      data: {
        donorId: donor.id,
        donationDate: new Date(dto.donationDate),
        productType: dto.productType,
        sourceType: institution.type,
        sourceName: institution.name,
        institutionId,
        notes: dto.notes,
        reportedBy: DonationReporter.INSTITUTION,
        status: ExternalDonationStatus.VERIFIED,
        verifiedAt: new Date(),
      },
    });

    await this.applyVerifiedEffects(donation.id, donor.id, donation.donationDate);
    return donation;
  }

  // ── Verificación por admin de un auto-reporte ────────────────────────────────

  async verify(id: string, adminId: string, dto: VerifyExternalDonationDto) {
    const donation = await this.prisma.externalDonation.findUnique({ where: { id } });
    if (!donation) throw new NotFoundException('Reporte no encontrado');
    if (donation.status !== ExternalDonationStatus.PENDING) {
      throw new ConflictException('Este reporte ya fue procesado');
    }

    if (!dto.approve) {
      return this.prisma.externalDonation.update({
        where: { id },
        data: {
          status: ExternalDonationStatus.REJECTED,
          verifiedById: adminId,
          verifiedAt: new Date(),
          notes: dto.notes ?? donation.notes,
        },
      });
    }

    const updated = await this.prisma.externalDonation.update({
      where: { id },
      data: {
        status: ExternalDonationStatus.VERIFIED,
        verifiedById: adminId,
        verifiedAt: new Date(),
        notes: dto.notes ?? donation.notes,
      },
    });
    await this.applyVerifiedEffects(updated.id, updated.donorId, updated.donationDate);
    return updated;
  }

  // Efectos de una donación externa verificada: puntos, stats del donante, categoría.
  private async applyVerifiedEffects(externalDonationId: string, donorId: string, donationDate: Date) {
    const donor = await this.prisma.donor.findUnique({ where: { id: donorId } });
    if (!donor) return;

    const { pointsAwarded } = await this.rewardsService.awardExternalDonationPoints(donorId, externalDonationId);
    await this.prisma.externalDonation.update({ where: { id: externalDonationId }, data: { pointsAwarded } });

    // No pisar lastDonationDate con un reporte atrasado si ya hay una fecha más reciente
    const isNewer = !donor.lastDonationDate || donationDate > donor.lastDonationDate;
    await this.prisma.donor.update({
      where: { id: donorId },
      data: {
        totalDonations: { increment: 1 },
        ...(isNewer ? { lastDonationDate: donationDate } : {}),
      },
    });

    await this.donorsService.recalculateCategory(donorId);
  }

  // ── Admin: listado / revisión ────────────────────────────────────────────────

  async findAll(status?: ExternalDonationStatus) {
    return this.prisma.externalDonation.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        donor: { select: { id: true, name: true, idNumber: true, bloodType: true, rhFactor: true } },
        institution: { select: { id: true, name: true } },
      },
    });
  }

  // ── Consulta de elegibilidad para instituciones (requiere consentimiento) ───

  async checkEligibilityByIdNumber(idNumber: string, productType: ProductType = ProductType.WHOLE_BLOOD) {
    if (!idNumber) throw new BadRequestException('idNumber es requerido');
    const donor = await this.prisma.donor.findUnique({ where: { idNumber } });
    if (!donor) throw new NotFoundException('Donante no encontrado');
    if (!donor.shareHistoryWithInstitutions) {
      throw new ForbiddenException('El donante no ha autorizado compartir su historial con instituciones externas');
    }

    const eligibility = await this.donorsService.checkEligibility(donor.id, productType);
    return {
      name: donor.name,
      bloodType: donor.bloodType,
      rhFactor: donor.rhFactor,
      lastDonationDate: donor.lastDonationDate,
      requiredDaysBetweenDonations: ELIGIBILITY_DAYS[productType],
      ...eligibility,
    };
  }

  // ── Instituciones (admin) ─────────────────────────────────────────────────

  async createInstitution(dto: CreateInstitutionDto) {
    return this.prisma.partnerInstitution.create({ data: dto });
  }

  async listInstitutions() {
    return this.prisma.partnerInstitution.findMany({ orderBy: { name: 'asc' } });
  }

  async createInstitutionUser(institutionId: string, dto: CreateInstitutionUserDto) {
    const institution = await this.prisma.partnerInstitution.findUnique({ where: { id: institutionId } });
    if (!institution) throw new NotFoundException('Institución no encontrada');

    const exists = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Ya existe un usuario con ese correo');

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.adminUser.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        role: AdminRole.INSTITUTION,
        institutionId,
      },
    });
  }
}
