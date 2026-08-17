import { Controller, Get, Post, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
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
}
