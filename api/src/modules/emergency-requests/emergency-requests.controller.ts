import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmergencyRequestsService } from './emergency-requests.service';
import { CreateEmergencyRequestDto } from './dto/create-emergency-request.dto';
import { UpdateEmergencyRequestStatusDto } from './dto/update-status.dto';
import { NotifyCandidatesDto } from './dto/notify.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('emergency-requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('emergency-requests')
export class EmergencyRequestsController {
  constructor(private readonly service: EmergencyRequestsService) {}

  @Post()
  @ApiOperation({ summary: 'Registrar solicitud de sangre de un hospital/centro' })
  create(@Body() dto: CreateEmergencyRequestDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar solicitudes de emergencia' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalle de una solicitud (incluye notificaciones enviadas)' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado de la solicitud (Atendida / Cancelada / Abierta)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateEmergencyRequestStatusDto) {
    return this.service.updateStatus(id, dto.status);
  }

  @Get(':id/candidates')
  @ApiOperation({ summary: 'Donantes candidatos: compatibles, elegibles, filtrables por ciudad/cercanía' })
  findCandidates(
    @Param('id') id: string,
    @Query('city') city?: string,
    @Query('maxDistanceKm') maxDistanceKm?: number,
  ) {
    return this.service.findCandidates(id, city, maxDistanceKm != null ? +maxDistanceKm : undefined);
  }

  @Post(':id/notify')
  @ApiOperation({ summary: 'Notificar (push/WhatsApp/email) a los donantes candidatos seleccionados' })
  notify(@Param('id') id: string, @Body() dto: NotifyCandidatesDto) {
    return this.service.notify(id, dto);
  }
}
