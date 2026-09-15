import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole, FinancialCategory, FinancialRecordType } from '@prisma/client';
import { FinanceService } from './finance.service';
import { CreateFinancialRecordDto } from './dto/create-financial-record.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Datos financieros: solo administración, ningún otro rol (LAB_TECH, LOGISTICS,
// PARTNER, INSTITUTION) debe poder ver ni registrar movimientos de dinero.
@ApiTags('finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Post('records')
  @ApiOperation({ summary: 'Registrar movimiento financiero' })
  create(@Body() dto: CreateFinancialRecordDto) {
    return this.financeService.createRecord(dto);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen P&L por período' })
  getSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('currency') currency?: string,
  ) {
    return this.financeService.getSummary(startDate, endDate, currency);
  }

  @Get('records')
  @ApiOperation({ summary: 'Listar movimientos financieros' })
  getRecords(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: FinancialRecordType,
    @Query('category') category?: FinancialCategory,
  ) {
    return this.financeService.getRecords(page, limit, type, category);
  }
}
