import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Envío masivo (WhatsApp/email) e historial: solo administración, para evitar que
// un rol operativo dispare una campaña a todos los donantes por error.
// ponytail: guards por método (no a nivel de clase) porque 'me' usa DonorJwtAuthGuard
// — un @UseGuards de clase se ACUMULA con el del método (ambos deben pasar), así que
// JwtAuthGuard a nivel de clase bloqueaba 'me' para cualquier token de donante.
const ADMIN_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN];

@ApiTags('notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
  @Post('events/:eventId/broadcast')
  @ApiOperation({ summary: 'Enviar notificación de evento a todos los donantes (WhatsApp + Email)' })
  broadcastEvent(@Param('eventId') eventId: string) {
    return this.notificationsService.broadcastEvent(eventId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...ADMIN_ROLES)
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
