import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BloodType, ProductType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class EmergencyAlertDto {
  @ApiProperty({ enum: BloodType }) @IsEnum(BloodType) bloodType: BloodType;
  @ApiProperty({ enum: ProductType }) @IsEnum(ProductType) productType: ProductType;
  @ApiProperty() @IsString() message: string;
  @ApiProperty({ required: false }) urgencyLevel?: number;
}

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('events/:eventId/broadcast')
  @ApiOperation({ summary: 'Enviar notificación de evento a todos los donantes (WhatsApp + Email)' })
  broadcastEvent(@Param('eventId') eventId: string) {
    return this.notificationsService.broadcastEvent(eventId);
  }

  @Get('emergency/preview')
  @ApiOperation({ summary: 'Previsualizar alcance de alerta de emergencia (sin enviar)' })
  previewEmergency(
    @Query('bloodType') bloodType: BloodType,
    @Query('productType') productType: ProductType,
  ) {
    return this.notificationsService.previewEmergencyAlert(bloodType, productType);
  }

  @Post('emergency')
  @ApiOperation({ summary: 'Enviar alerta de emergencia a donantes compatibles' })
  sendEmergency(@Body() dto: EmergencyAlertDto) {
    return this.notificationsService.sendEmergencyAlert(dto.bloodType, dto.productType, dto.message, dto.urgencyLevel);
  }

  @Get()
  @ApiOperation({ summary: 'Historial de notificaciones enviadas (admin)' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.notificationsService.findAll(page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Notificaciones del donante autenticado (app móvil)' })
  getMyNotifications(
    @Request() req: any,
    @Query('limit') limit?: number,
  ) {
    return this.notificationsService.findByDonor(req.user.id, limit);
  }
}
