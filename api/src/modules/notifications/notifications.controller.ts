import { Controller, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BloodType, ProductType } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { IsEnum, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

class EmergencyAlertDto {
  @ApiProperty({ enum: BloodType }) @IsEnum(BloodType) bloodType: BloodType;
  @ApiProperty({ enum: ProductType }) @IsEnum(ProductType) productType: ProductType;
  @ApiProperty() @IsString() message: string;
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

  @Post('emergency')
  @ApiOperation({ summary: 'Enviar alerta de emergencia a donantes compatibles' })
  sendEmergency(@Body() dto: EmergencyAlertDto) {
    return this.notificationsService.sendEmergencyAlert(dto.bloodType, dto.productType, dto.message);
  }
}
