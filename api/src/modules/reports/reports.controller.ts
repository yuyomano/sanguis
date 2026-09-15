import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ReportsService } from './reports.service';

class LogTemperatureDto {
  @ApiProperty() @IsNumber() @Min(-50) @Max(100) tempCelsius: number;
  @ApiPropertyOptional() @IsString() @IsOptional() locationId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() deliveryId?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() recordedBy?: string;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Reporte regulatorio: solo administración (operativo — temperatura/inventario
  // sigue abierto a cualquier admin autenticado, lo necesita el staff de campo).
  @UseGuards(RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @Get('sespas')
  @ApiOperation({ summary: 'Reporte SESPAS — resumen del período' })
  getSespas(@Query('from') from?: string, @Query('to') to?: string) {
    return this.reportsService.getSespasReport(from, to);
  }

  @Get('inventory')
  @ApiOperation({ summary: 'Snapshot actual del inventario' })
  getInventory() {
    return this.reportsService.getInventorySnapshot();
  }

  @Get('temperature')
  @ApiOperation({ summary: 'Historial de temperaturas (cold chain)' })
  getTemperature(
    @Query('locationId') locationId?: string,
    @Query('deliveryId') deliveryId?: string,
    @Query('limit') limit?: number,
  ) {
    return this.reportsService.getTemperatureLogs(locationId, deliveryId, limit ? +limit : 50);
  }

  @Post('temperature')
  @ApiOperation({ summary: 'Registrar lectura de temperatura' })
  logTemperature(@Body() dto: LogTemperatureDto) {
    return this.reportsService.logTemperature(dto);
  }
}
