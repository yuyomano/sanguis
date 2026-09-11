import { Controller, Get, Post, Delete, Param, Body, Query, Request, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { AdminRole } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

// Gestión de eventos de donación: logística y administración.
const EVENT_ADMIN_ROLES = [AdminRole.SUPER_ADMIN, AdminRole.ADMIN, AdminRole.LOGISTICS];

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('upcoming')
  @ApiOperation({ summary: 'Eventos próximos (público para app móvil)' })
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @Get('public/:id')
  @ApiOperation({ summary: 'Detalle de evento sin datos de otros donantes (público para app móvil)' })
  findOnePublic(@Param('id') id: string) {
    return this.eventsService.findOnePublic(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EVENT_ADMIN_ROLES)
  @Post()
  @ApiOperation({ summary: 'Crear evento de donación' })
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EVENT_ADMIN_ROLES)
  @Get()
  @ApiOperation({ summary: 'Listar todos los eventos (admin)' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.eventsService.findAll(page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(...EVENT_ADMIN_ROLES)
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de evento con lista de citas' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Post('appointments')
  @ApiOperation({ summary: 'Reservar cita en evento' })
  bookAppointment(@Request() req: any, @Body() dto: CreateAppointmentDto) {
    return this.eventsService.bookAppointment(req.user.id, dto);
  }

  @Post('checkin/:qrCode')
  @ApiOperation({ summary: 'Check-in con QR code en evento' })
  checkIn(@Param('qrCode') qrCode: string) {
    return this.eventsService.checkIn(qrCode);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Delete('appointments/:id')
  @ApiOperation({ summary: 'Cancelar cita' })
  cancel(@Request() req: any, @Param('id') id: string) {
    return this.eventsService.cancelAppointment(id, req.user.id);
  }
}
