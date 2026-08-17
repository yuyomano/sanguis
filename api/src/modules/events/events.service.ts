import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppointmentStatus, EventStatus } from '@prisma/client';
import { CreateEventDto } from './dto/create-event.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class EventsService {
  constructor(private prisma: PrismaService) {}

  async createEvent(dto: CreateEventDto) {
    return this.prisma.donationEvent.create({ data: dto });
  }

  async findOne(id: string) {
    const event = await this.prisma.donationEvent.findUnique({
      where: { id },
      include: {
        appointments: {
          include: { donor: { select: { id: true, name: true, bloodType: true, phone: true } } },
          orderBy: { scheduledTime: 'asc' },
        },
        _count: { select: { appointments: true } },
      },
    });
    if (!event) throw new NotFoundException('Evento no encontrado');
    return event;
  }

  async findUpcoming() {
    return this.prisma.donationEvent.findMany({
      where: {
        status: { in: [EventStatus.SCHEDULED, EventStatus.ACTIVE] },
        startDatetime: { gte: new Date() },
      },
      orderBy: { startDatetime: 'asc' },
      include: { _count: { select: { appointments: true } } },
    });
  }

  async findAll(page: any = 1, limit: any = 20) {
    const p = Math.max(1, parseInt(page, 10) || 1);
    const l = Math.max(1, parseInt(limit, 10) || 20);
    const [events, total] = await Promise.all([
      this.prisma.donationEvent.findMany({
        skip: (p - 1) * l,
        take: l,
        orderBy: { startDatetime: 'desc' },
        include: { _count: { select: { appointments: true } } },
      }),
      this.prisma.donationEvent.count(),
    ]);
    return { events, total, page: p, limit: l };
  }

  async bookAppointment(dto: CreateAppointmentDto) {
    const event = await this.prisma.donationEvent.findUnique({ where: { id: dto.eventId } });
    if (!event) throw new NotFoundException('Evento no encontrado');
    if (event.registeredCount >= event.capacity) {
      throw new BadRequestException('El evento está lleno');
    }

    const existing = await this.prisma.appointment.findFirst({
      where: {
        donorId: dto.donorId,
        eventId: dto.eventId,
        status: { notIn: [AppointmentStatus.CANCELLED] },
      },
    });
    if (existing) throw new ConflictException('El donante ya tiene una cita para este evento');

    const qrCode = uuidv4();
    const [appointment] = await this.prisma.$transaction([
      this.prisma.appointment.create({
        data: {
          donorId: dto.donorId,
          eventId: dto.eventId,
          scheduledTime: new Date(dto.scheduledTime),
          qrCode,
        },
      }),
      this.prisma.donationEvent.update({
        where: { id: dto.eventId },
        data: { registeredCount: { increment: 1 } },
      }),
    ]);

    const qrDataUrl = await QRCode.toDataURL(qrCode);
    return { ...appointment, qrDataUrl };
  }

  async checkIn(qrCode: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { qrCode },
      include: { donor: true, event: true },
    });
    if (!appointment) throw new NotFoundException('QR no válido');
    if (appointment.status !== AppointmentStatus.SCHEDULED) {
      throw new BadRequestException(`Cita en estado: ${appointment.status}`);
    }

    return this.prisma.appointment.update({
      where: { qrCode },
      data: { status: AppointmentStatus.CHECKED_IN, checkedInAt: new Date() },
    });
  }

  async cancelAppointment(id: string) {
    const appointment = await this.prisma.appointment.findUnique({ where: { id } });
    if (!appointment) throw new NotFoundException('Cita no encontrada');

    await this.prisma.$transaction([
      this.prisma.appointment.update({
        where: { id },
        data: { status: AppointmentStatus.CANCELLED },
      }),
      this.prisma.donationEvent.update({
        where: { id: appointment.eventId },
        data: { registeredCount: { decrement: 1 } },
      }),
    ]);
  }
}
