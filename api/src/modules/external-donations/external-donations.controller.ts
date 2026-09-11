import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole, ExternalDonationStatus, ProductType } from '@prisma/client';
import { ExternalDonationsService } from './external-donations.service';
import { CreateExternalDonationDto } from './dto/create-external-donation.dto';
import { ReportInstitutionDonationDto } from './dto/report-institution-donation.dto';
import { VerifyExternalDonationDto } from './dto/verify-external-donation.dto';
import { CreateInstitutionDto } from './dto/create-institution.dto';
import { CreateInstitutionUserDto } from './dto/create-institution-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Devuelve el institutionId del usuario institucional autenticado, o lanza si el
// usuario tiene role INSTITUTION pero no quedó atado a ninguna institución.
function institutionIdOf(req: any): string {
  if (!req.user.institutionId) throw new ForbiddenException('Usuario institucional sin institución asignada');
  return req.user.institutionId;
}

@ApiTags('external-donations')
@Controller('external-donations')
export class ExternalDonationsController {
  constructor(private readonly service: ExternalDonationsService) {}

  // ── Donante (app móvil) ─────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Post('me')
  @ApiOperation({ summary: 'Reportar una donación hecha fuera de Sanguis (queda pendiente de verificación)' })
  createSelfReport(@Request() req: any, @Body() dto: CreateExternalDonationDto) {
    return this.service.createSelfReport(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Historial de donaciones externas reportadas por el donante autenticado' })
  findMine(@Request() req: any) {
    return this.service.findForDonor(req.user.id);
  }

  // ── Institución (hospital / otro banco) ──────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.INSTITUTION)
  @Post('institution-report')
  @ApiOperation({ summary: 'Registrar (auto-verificada) una donación de un donante propio [institución]' })
  createInstitutionReport(@Request() req: any, @Body() dto: ReportInstitutionDonationDto) {
    return this.service.createInstitutionReport(institutionIdOf(req), dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.INSTITUTION)
  @Get('eligibility')
  @ApiOperation({ summary: 'Consultar elegibilidad de un donante por cédula/pasaporte [institución, requiere consentimiento del donante]' })
  checkEligibility(@Query('idNumber') idNumber: string, @Query('productType') productType?: ProductType) {
    return this.service.checkEligibilityByIdNumber(idNumber, productType);
  }

  // ── Admin ─────────────────────────────────────────────────────────────────

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Listar reportes de donación externa (admin)' })
  findAll(@Query('status') status?: ExternalDonationStatus) {
    return this.service.findAll(status);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id/verify')
  @ApiOperation({ summary: 'Aprobar o rechazar un auto-reporte de donante (admin)' })
  verify(@Request() req: any, @Param('id') id: string, @Body() dto: VerifyExternalDonationDto) {
    return this.service.verify(id, req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @Post('institutions')
  @ApiOperation({ summary: 'Crear institución externa (hospital/banco) [admin]' })
  createInstitution(@Body() dto: CreateInstitutionDto) {
    return this.service.createInstitution(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('institutions')
  @ApiOperation({ summary: 'Listar instituciones externas [admin]' })
  listInstitutions() {
    return this.service.listInstitutions();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(AdminRole.SUPER_ADMIN, AdminRole.ADMIN)
  @Post('institutions/:id/users')
  @ApiOperation({ summary: 'Crear el usuario de acceso de una institución externa [admin]' })
  createInstitutionUser(@Param('id') id: string, @Body() dto: CreateInstitutionUserDto) {
    return this.service.createInstitutionUser(id, dto);
  }
}
