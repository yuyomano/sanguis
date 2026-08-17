import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DonorJwtAuthGuard } from '../../common/guards/donor-jwt-auth.guard';

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get('upcoming')
  @ApiOperation({ summary: 'Eventos próximos (público para app móvil)' })
  findUpcoming() {
    return this.eventsService.findUpcoming();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Crear evento de donación' })
  createEvent(@Body() dto: CreateEventDto) {
    return this.eventsService.createEvent(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Listar todos los eventos (admin)' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.eventsService.findAll(page, limit);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Detalle de evento con lista de citas' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(DonorJwtAuthGuard)
  @Post('appointments')
  @ApiOperation({ summary: 'Reservar cita en evento' })
  bookAppointment(@Body() dto: CreateAppointmentDto) {
    return this.eventsService.bookAppointment(dto);
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
  cancel(@Param('id') id: string) {
    return this.eventsService.cancelAppointment(id);
  }
}
