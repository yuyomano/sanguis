import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AdminRole, BloodType, DonorCategory, ProductType } from '@prisma/client';
import { DonorsService } from './donors.service';
import { CreateDonorDto } from './dto/create-donor.dto';
import { UpdateDonorDto } from './dto/update-donor.dto';
import { UpdateDonorLocationDto } from './dto/update-donor-location.dto';
import { UpdateIdNumberDto } from './dto/update-id-number.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Crear/editar donantes: solo administración. Lectura (listado, ficha, elegibilidad)
// sigue abierta a cualquier admin autenticado — lo necesitan LAB_TECH/LOGISTICS/PARTNER
// para su trabajo operativo, solo se les quita la capacidad de editar.
const DONOR_WRITE_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN];

@ApiTags('donors')
@Controller('donors')
export class DonorsController {
  constructor(private readonly donorsService: DonorsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...DONOR_WRITE_ROLES)
  @Post()
  @ApiOperation({ summary: 'Crear nuevo donante (admin)' })
  create(@Body() dto: CreateDonorDto) {
    return this.donorsService.create(dto);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Perfil del donante autenticado (app móvil)' })
  getMe(@Request() req: any) {
    return this.donorsService.findOne(req.user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Listar donantes (con filtros y paginación)' })
  findAll(
    @Query('search') search?: string,
    @Query('bloodType') bloodType?: BloodType,
    @Query('category') category?: DonorCategory,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.donorsService.findAll({ search, bloodType, category, page, limit });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @ApiOperation({ summary: 'Estadísticas generales de donantes' })
  getStats() {
    return this.donorsService.getStats();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtener perfil completo de donante' })
  findOne(@Param('id') id: string) {
    return this.donorsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/eligibility')
  @ApiOperation({ summary: 'Verificar elegibilidad para donar' })
  checkEligibility(
    @Param('id') id: string,
    @Query('productType') productType?: ProductType,
  ) {
    return this.donorsService.checkEligibility(id, productType);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Patch('me/consent')
  @ApiOperation({ summary: 'Autorizar/revocar que instituciones externas consulten su elegibilidad e historial' })
  updateConsent(@Request() req: any, @Body('shareHistoryWithInstitutions') shareHistoryWithInstitutions: boolean) {
    return this.donorsService.update(req.user.id, { shareHistoryWithInstitutions });
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Patch('me/notifications')
  @ApiOperation({ summary: 'Activar/desactivar notificaciones no críticas (broadcast de eventos) del donante autenticado. Las alertas de emergencia siempre se envían.' })
  updateNotificationPreference(@Request() req: any, @Body('notificationsEnabled') notificationsEnabled: boolean) {
    return this.donorsService.update(req.user.id, { notificationsEnabled });
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Patch('me/id-number')
  @ApiOperation({ summary: 'Corregir/completar cédula, DNI o pasaporte del donante autenticado (app móvil). Necesario para ganar y canjear puntos.' })
  updateMyIdNumber(@Request() req: any, @Body() dto: UpdateIdNumberDto) {
    return this.donorsService.update(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Patch('me/fcm-token')
  @ApiOperation({ summary: 'Actualizar FCM token del donante autenticado (app móvil)' })
  updateFcmToken(@Request() req: any, @Body('fcmToken') fcmToken: string) {
    return this.donorsService.update(req.user.id, { fcmToken });
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Patch('me/location')
  @ApiOperation({ summary: 'Actualizar ciudad/dirección/coordenadas del donante autenticado (app móvil)' })
  updateMyLocation(@Request() req: any, @Body() dto: UpdateDonorLocationDto) {
    return this.donorsService.update(req.user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...DONOR_WRITE_ROLES)
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar datos del donante' })
  update(@Param('id') id: string, @Body() dto: UpdateDonorDto) {
    return this.donorsService.update(id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...DONOR_WRITE_ROLES)
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar donante (solo si no tiene historial: sin donaciones, citas, puntos, canjes, notificaciones ni referidos)' })
  remove(@Param('id') id: string) {
    return this.donorsService.remove(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...DONOR_WRITE_ROLES)
  @Patch(':id/category')
  @ApiOperation({ summary: 'Asignar categoría manualmente (admin)' })
  setCategory(@Param('id') id: string, @Body('category') category: DonorCategory) {
    return this.donorsService.setCategory(id, category);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...DONOR_WRITE_ROLES)
  @Patch(':id/priority')
  @ApiOperation({ summary: 'Marcar/desmarcar como donante prioritario' })
  setPriority(@Param('id') id: string, @Body('isPriority') isPriority: boolean) {
    return this.donorsService.setPriority(id, isPriority);
  }
}
