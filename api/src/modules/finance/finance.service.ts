import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { FinancialCategory, FinancialRecordType } from '@prisma/client';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import dayjs from 'dayjs';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async createRecord(dto: CreateFinancialRecordDto) {
    // dto.date llega como "YYYY-MM-DD" desde el formulario web (input type=date);
    // igual que en getSummary, se ancla a medianoche local para no correr un día
    // hacia atrás al mostrarse (new Date('YYYY-MM-DD') se interpreta como UTC).
    const date = dto.date.length === 10 ? new Date(`${dto.date}T00:00:00.000`) : new Date(dto.date);
    return this.prisma.financialRecord.create({ data: { ...dto, date } });
  }

  async getSummary(startDate?: string, endDate?: string, currency = 'DOP') {
    // Mismo cuidado que en reports.service.ts: anclar a inicio/fin de día local
    // para que "YYYY-MM-DD" no se interprete como medianoche UTC.
    const start = startDate ? new Date(`${startDate}T00:00:00.000`) : dayjs().startOf('month').toDate();
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : dayjs().endOf('month').toDate();

    const records = await this.prisma.financialRecord.findMany({
      where: { date: { gte: start, lte: end }, currency },
    });

    const totalRevenue = records
      .filter((r) => r.type === FinancialRecordType.REVENUE)
      .reduce((sum, r) => sum + r.amount, 0);

    const totalCosts = records
      .filter((r) => r.type === FinancialRecordType.COST)
      .reduce((sum, r) => sum + r.amount, 0);

    const byCategory = records.reduce((acc, r) => {
      if (!acc[r.category]) acc[r.category] = { costs: 0, revenue: 0 };
      if (r.type === FinancialRecordType.COST) acc[r.category].costs += r.amount;
      else acc[r.category].revenue += r.amount;
      return acc;
    }, {} as Record<FinancialCategory, { costs: number; revenue: number }>);

    return {
      period: { start, end },
      currency,
      totalRevenue,
      totalCosts,
      netResult: totalRevenue - totalCosts,
      byCategory,
    };
  }

  async getRecords(page: any = 1, limit: any = 50, type?: FinancialRecordType, category?: FinancialCategory) {
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 50);
    const where: any = {};
    if (type) where.type = type;
    if (category) where.category = category;

    const [records, total] = await Promise.all([
      this.prisma.financialRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { date: 'desc' },
      }),
      this.prisma.financialRecord.count({ where }),
    ]);

    return { records, total, page, limit };
  }
}
