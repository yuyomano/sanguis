import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole, DeliveryStatus } from '@prisma/client';
import { LogisticsService } from './logistics.service';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus }) @IsEnum(DeliveryStatus) status: DeliveryStatus;
  @ApiPropertyOptional() @IsString() @IsOptional() notes?: string;
}

// Última milla: logística y administración.
@ApiTags('logistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.LOGISTICS)
@Controller('logistics')
export class LogisticsController {
  constructor(private readonly logisticsService: LogisticsService) {}

  @Post('deliveries')
  @ApiOperation({ summary: 'Crear orden de entrega con unidades de sangre' })
  create(@Body() dto: CreateDeliveryDto) {
    return this.logisticsService.createDelivery(dto);
  }

  @Get('deliveries')
  @ApiOperation({ summary: 'Listar órdenes de entrega' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.logisticsService.findAll(page, limit);
  }

  @Get('deliveries/:id')
  @ApiOperation({ summary: 'Obtener detalle de orden de entrega' })
  findOne(@Param('id') id: string) {
    return this.logisticsService.findOne(id);
  }

  @Patch('deliveries/:id/status')
  @ApiOperation({ summary: 'Actualizar estado de entrega con entrada en cadena de custodia' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateDeliveryStatusDto) {
    return this.logisticsService.updateStatus(id, dto.status, dto.notes);
  }

  @Get('vehicles')
  @ApiOperation({ summary: 'Listar flota de vehículos propios' })
  getVehicles() {
    return this.logisticsService.getVehicles();
  }

  @Get('protocols')
  @ApiOperation({ summary: 'Listar protocolos de entrega' })
  getProtocols() {
    return this.logisticsService.getProtocols();
  }
}
