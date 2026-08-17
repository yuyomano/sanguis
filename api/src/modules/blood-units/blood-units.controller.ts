import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BloodType, BloodUnitStatus, ProductType } from '@prisma/client';
import { BloodUnitsService } from './blood-units.service';
import { CreateBloodUnitDto } from './dto/create-blood-unit.dto';
import { TransitionStatusDto } from './dto/transition-status.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';

@ApiTags('blood-units')
@Controller('blood-units')
export class BloodUnitsController {
  constructor(private readonly bloodUnitsService: BloodUnitsService) {}

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Get('mine')
  @ApiOperation({ summary: 'Unidades de sangre del donante autenticado (app móvil)' })
  getMyUnits(@Request() req: any) {
    return this.bloodUnitsService.findByDonor(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Registrar nueva unidad de sangre recolectada' })
  create(@Body() dto: CreateBloodUnitDto) {
    return this.bloodUnitsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Listar unidades de sangre con filtros' })
  findAll(
    @Query('bloodType') bloodType?: BloodType,
    @Query('productType') productType?: ProductType,
    @Query('status') status?: BloodUnitStatus,
    @Query('storageLocationId') storageLocationId?: string,
    @Query('expiringInDays') expiringInDays?: number,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.bloodUnitsService.findAll({
      bloodType, productType, status, storageLocationId, expiringInDays, page, limit,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('inventory')
  @ApiOperation({ summary: 'Resumen de inventario por tipo de sangre y producto' })
  getInventorySummary() {
    return this.bloodUnitsService.getInventorySummary();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('locations')
  @ApiOperation({ summary: 'Listar ubicaciones de almacenamiento activas' })
  getLocations() {
    return this.bloodUnitsService.getStorageLocations();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una unidad con historial completo' })
  findOne(@Param('id') id: string) {
    return this.bloodUnitsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Transicionar estado de unidad (COLLECTED→TESTING→...→USED)' })
  transition(@Param('id') id: string, @Body() dto: TransitionStatusDto) {
    return this.bloodUnitsService.transition(id, dto.status, dto.notes);
  }
}
