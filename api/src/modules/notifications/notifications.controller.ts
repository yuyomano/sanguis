import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';

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
