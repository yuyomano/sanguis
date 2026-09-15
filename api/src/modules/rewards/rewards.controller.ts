import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole } from '@prisma/client';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RedeemPointsDto } from './dto/redeem-points.dto';

// Fidelización/canjes: lectura (redenciones/transacciones/badges de donante) abierta
// a socios (PARTNER) y administración; alta/baja de partners y badges solo admin —
// un PARTNER no debe poder crear/eliminar establecimientos o insignias ajenas.
const REWARDS_ADMIN_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.PARTNER];
const REWARDS_WRITE_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN];

@ApiTags('rewards')
@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  @Get('partners')
  @ApiOperation({ summary: 'Listar establecimientos aliados' })
  getPartners() {
    return this.rewardsService.getPartners();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_WRITE_ROLES)
  @Post('partners')
  @ApiOperation({ summary: 'Crear establecimiento aliado (admin)' })
  createPartner(@Body() body: any) {
    return this.rewardsService.createPartner(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_WRITE_ROLES)
  @Patch('partners/:id')
  @ApiOperation({ summary: 'Actualizar establecimiento aliado (admin)' })
  updatePartner(@Param('id') id: string, @Body() body: any) {
    return this.rewardsService.updatePartner(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_ADMIN_ROLES)
  @Get('redemptions')
  @ApiOperation({ summary: 'Historial de canjes (admin)' })
  getRedemptions(@Query('page') page: string, @Query('limit') limit: string) {
    return this.rewardsService.getRedemptions(page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Get('me/transactions')
  @ApiOperation({ summary: 'Historial de transacciones del donante autenticado' })
  getMyTransactions(@Request() req: any) {
    return this.rewardsService.getDonorTransactions(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Post('redeem')
  @ApiOperation({ summary: 'Canjear puntos en establecimiento aliado' })
  redeem(@Request() req: any, @Body() dto: RedeemPointsDto) {
    return this.rewardsService.redeem(req.user.id, dto.partnerId, dto.points);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_ADMIN_ROLES)
  @Get('donors/:donorId/transactions')
  @ApiOperation({ summary: 'Historial de transacciones de puntos del donante' })
  getTransactions(@Param('donorId') donorId: string) {
    return this.rewardsService.getDonorTransactions(donorId);
  }

  @Get('badges')
  @ApiOperation({ summary: 'Listar insignias de gamificación' })
  getBadges() {
    return this.rewardsService.getBadges();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_WRITE_ROLES)
  @Post('badges')
  @ApiOperation({ summary: 'Crear insignia (admin)' })
  createBadge(@Body() body: any) {
    return this.rewardsService.createBadge(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_WRITE_ROLES)
  @Delete('badges/:id')
  @ApiOperation({ summary: 'Eliminar insignia (admin)' })
  deleteBadge(@Param('id') id: string) {
    return this.rewardsService.deleteBadge(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_WRITE_ROLES)
  @Post('donors/:donorId/badges')
  @ApiOperation({ summary: 'Otorgar insignia a donante (admin)' })
  awardBadge(@Param('donorId') donorId: string, @Body() body: { badgeId: string }) {
    return this.rewardsService.awardBadge(donorId, body.badgeId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...REWARDS_ADMIN_ROLES)
  @Get('donors/:donorId/badges')
  @ApiOperation({ summary: 'Ver insignias de un donante' })
  getDonorBadges(@Param('donorId') donorId: string) {
    return this.rewardsService.getDonorBadges(donorId);
  }
}
