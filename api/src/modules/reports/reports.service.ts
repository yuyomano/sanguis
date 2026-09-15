import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import dayjs from 'dayjs';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getSespasReport(fromDate?: string, toDate?: string) {
    // fromDate/toDate llegan como "YYYY-MM-DD" (input type=date, sin zona horaria).
    // new Date('YYYY-MM-DD') se interpreta como medianoche UTC, lo que corre el
    // período un día hacia atrás al mostrarlo en hora local y excluye todo el
    // día "hasta" — por eso se ancla explícitamente a inicio/fin de día local.
    const from = fromDate ? new Date(`${fromDate}T00:00:00.000`) : dayjs().startOf('month').toDate();
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : dayjs().endOf('month').toDate();

    const [bloodUnits, testResults, newDonors, totalDonors, deliveries, alerts] =
      await Promise.all([
        this.prisma.bloodUnit.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { bloodType: true, productType: true, status: true },
        }),
        this.prisma.testResult.findMany({
          where: { createdAt: { gte: from, lte: to } },
          select: { isViable: true, labType: true },
        }),
        this.prisma.donor.count({
          where: { createdAt: { gte: from, lte: to }, isActive: true },
        }),
        this.prisma.donor.count({ where: { isActive: true } }),
        this.prisma.deliveryOrder.count({
          where: { updatedAt: { gte: from, lte: to }, status: 'DELIVERED' },
        }),
        this.prisma.emergencyRequest.count({ where: { createdAt: { gte: from, lte: to } } }),
      ]);

    const byBloodType: Record<string, number> = {};
    const byProductType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const u of bloodUnits) {
      byBloodType[u.bloodType] = (byBloodType[u.bloodType] || 0) + 1;
      byProductType[u.productType] = (byProductType[u.productType] || 0) + 1;
      byStatus[u.status] = (byStatus[u.status] || 0) + 1;
    }

    const totalTests = testResults.length;
    const viableTests = testResults.filter((t) => t.isViable === true).length;
    const rejectedTests = testResults.filter((t) => t.isViable === false).length;

    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      summary: {
        totalUnitsCollected: bloodUnits.length,
        totalTests,
        viableTests,
        rejectedTests,
        viabilityRate: totalTests > 0 ? +((viableTests / totalTests) * 100).toFixed(1) : null,
        newDonors,
        totalActiveDonors: totalDonors,
        deliveriesCompleted: deliveries,
        emergencyAlerts: alerts,
      },
      byBloodType,
      byProductType,
      byStatus,
    };
  }

  async getInventorySnapshot() {
    const groups = await this.prisma.bloodUnit.groupBy({
      by: ['bloodType', 'productType', 'status'],
      _count: { id: true },
    });

    const expiringSoon = await this.prisma.bloodUnit.count({
      where: {
        status: { in: ['STORED', 'APPROVED'] },
        expirationDate: {
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          gte: new Date(),
        },
      },
    });

    return { groups, expiringSoon };
  }

  async getTemperatureLogs(locationId?: string, deliveryId?: string, limit = 50) {
    return this.prisma.temperatureLog.findMany({
      where: {
        ...(locationId && { storageLocationId: locationId }),
        ...(deliveryId && { deliveryOrderId: deliveryId }),
      },
      orderBy: { recordedAt: 'desc' },
      take: limit,
    });
  }

  async logTemperature(data: {
    tempCelsius: number;
    locationId?: string;
    deliveryId?: string;
    recordedBy?: string;
    notes?: string;
  }) {
    return this.prisma.temperatureLog.create({
      data: {
        tempCelsius: data.tempCelsius,
        storageLocationId: data.locationId ?? null,
        deliveryOrderId: data.deliveryId ?? null,
        recordedBy: data.recordedBy ?? null,
        notes: data.notes ?? null,
      },
    });
  }
}
