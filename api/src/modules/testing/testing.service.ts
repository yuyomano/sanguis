import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BloodUnitStatus, TestLabType } from '@prisma/client';
import { CreateTestResultDto } from './dto/create-test-result.dto';

@Injectable()
export class TestingService {
  constructor(private prisma: PrismaService) {}

  async findTest(id: string) {
    const test = await this.prisma.testResult.findUnique({
      where: { id },
      include: {
        bloodUnit: {
          include: {
            donor: { select: { id: true, name: true, bloodType: true } },
            storageLocation: true,
          },
        },
        externalLab: true,
      },
    });
    if (!test) throw new NotFoundException('Test no encontrado');
    return test;
  }

  async createTest(dto: CreateTestResultDto) {
    const unit = await this.prisma.bloodUnit.findUnique({ where: { id: dto.bloodUnitId } });
    if (!unit) throw new NotFoundException('Unidad no encontrada');

    // Move unit to TESTING status
    await this.prisma.bloodUnit.update({
      where: { id: dto.bloodUnitId },
      data: { status: BloodUnitStatus.TESTING },
    });

    return this.prisma.testResult.create({
      data: {
        bloodUnitId: dto.bloodUnitId,
        labType: dto.labType,
        externalLabId: dto.externalLabId,
        technicianId: dto.technicianId,
      },
    });
  }

  async submitResults(testId: string, results: Record<string, any>, technicianId?: string) {
    const test = await this.prisma.testResult.findUnique({
      where: { id: testId },
      include: { bloodUnit: { include: { donor: true } } },
    });
    if (!test) throw new NotFoundException('Test no encontrado');

    // Determine viability: all mandatory markers must be negative
    const mandatoryNegative = ['HBsAg', 'HIV', 'HCV', 'Syphilis'];
    const isViable = mandatoryNegative.every(
      (marker) => results[marker]?.toLowerCase() === 'negative' || results[marker] === false,
    );

    const updatedTest = await this.prisma.testResult.update({
      where: { id: testId },
      data: {
        results,
        isViable,
        resultDate: new Date(),
        technicianId: technicianId || test.technicianId,
      },
    });

    // Move blood unit to QUARANTINE (awaiting admin approval) or REJECTED
    await this.prisma.bloodUnit.update({
      where: { id: test.bloodUnitId },
      data: { status: isViable ? BloodUnitStatus.QUARANTINE : BloodUnitStatus.REJECTED },
    });

    return updatedTest;
  }

  async shareWithDonor(testId: string) {
    const test = await this.prisma.testResult.findUnique({ where: { id: testId } });
    if (!test) throw new NotFoundException('Test no encontrado');

    return this.prisma.testResult.update({
      where: { id: testId },
      data: { sharedWithDonor: true, sharedAt: new Date() },
    });
  }

  async getPendingTests() {
    return this.prisma.testResult.findMany({
      where: { resultDate: null },
      include: {
        bloodUnit: {
          include: { donor: { select: { name: true, bloodType: true } }, storageLocation: true },
        },
        externalLab: true,
      },
      orderBy: { testDate: 'asc' },
    });
  }

  async getDonorTestHistory(donorId: string) {
    return this.prisma.testResult.findMany({
      where: { bloodUnit: { donorId } },
      select: {
        id: true,
        testDate: true,
        resultDate: true,
        isViable: true,
        sharedWithDonor: true,
        results: true,
        bloodUnit: { select: { productType: true, collectionDate: true } },
      },
      orderBy: { testDate: 'desc' },
    });
  }
}
