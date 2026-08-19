import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';
import { RedeemPointsDto } from './dto/redeem-points.dto';

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
  @UseGuards(JwtAuthGuard)
  @Post('partners')
  @ApiOperation({ summary: 'Crear establecimiento aliado (admin)' })
  createPartner(@Body() body: any) {
    return this.rewardsService.createPartner(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('partners/:id')
  @ApiOperation({ summary: 'Actualizar establecimiento aliado (admin)' })
  updatePartner(@Param('id') id: string, @Body() body: any) {
    return this.rewardsService.updatePartner(id, body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
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
  @UseGuards(JwtAuthGuard)
  @Post('badges')
  @ApiOperation({ summary: 'Crear insignia (admin)' })
  createBadge(@Body() body: any) {
    return this.rewardsService.createBadge(body);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('badges/:id')
  @ApiOperation({ summary: 'Eliminar insignia (admin)' })
  deleteBadge(@Param('id') id: string) {
    return this.rewardsService.deleteBadge(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('donors/:donorId/badges')
  @ApiOperation({ summary: 'Otorgar insignia a donante (admin)' })
  awardBadge(@Param('donorId') donorId: string, @Body() body: { badgeId: string }) {
    return this.rewardsService.awardBadge(donorId, body.badgeId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('donors/:donorId/badges')
  @ApiOperation({ summary: 'Ver insignias de un donante' })
  getDonorBadges(@Param('donorId') donorId: string) {
    return this.rewardsService.getDonorBadges(donorId);
  }
}
