import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CarrierType, DeliveryStatus } from '@prisma/client';
import { CreateDeliveryDto } from './dto/create-delivery.dto';

@Injectable()
export class LogisticsService {
  constructor(private prisma: PrismaService) {}

  async createDelivery(dto: CreateDeliveryDto) {
    const units = await this.prisma.bloodUnit.findMany({
      where: { id: { in: dto.bloodUnitIds } },
    });

    if (units.length !== dto.bloodUnitIds.length) {
      throw new NotFoundException('Una o más unidades de sangre no encontradas');
    }

    const notStored = units.filter((u) => u.status !== 'STORED' && u.status !== 'APPROVED');
    if (notStored.length > 0) {
      throw new BadRequestException('Todas las unidades deben estar en estado STORED o APPROVED');
    }

    const delivery = await this.prisma.deliveryOrder.create({
      data: {
        destinationName: dto.destinationName,
        destinationAddress: dto.destinationAddress,
        carrierType: dto.carrierType,
        vehicleId: dto.vehicleId,
        thirdPartyCarrier: dto.thirdPartyCarrier,
        protocolId: dto.protocolId,
        baseCost: dto.baseCost || 0,
        lastMileCost: dto.lastMileCost || 0,
        chainOfCustody: [
          {
            timestamp: new Date().toISOString(),
            action: 'CREATED',
            notes: 'Orden de entrega creada',
          },
        ],
        items: {
          create: dto.bloodUnitIds.map((id) => ({ bloodUnitId: id })),
        },
      },
      include: { items: { include: { bloodUnit: true } } },
    });

    // Mark units as ALLOCATED
    await this.prisma.bloodUnit.updateMany({
      where: { id: { in: dto.bloodUnitIds } },
      data: { status: 'ALLOCATED' },
    });

    return delivery;
  }

  async findOne(id: string) {
    const order = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: {
        vehicle: true,
        protocol: true,
        items: {
          include: {
            bloodUnit: {
              include: { donor: { select: { name: true, bloodType: true } } },
            },
          },
        },
      },
    });
    if (!order) throw new NotFoundException('Orden de entrega no encontrada');
    return order;
  }

  async updateStatus(id: string, status: DeliveryStatus, notes?: string) {
    const delivery = await this.prisma.deliveryOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!delivery) throw new NotFoundException('Orden de entrega no encontrada');

    const custodyEntry = {
      timestamp: new Date().toISOString(),
      action: status,
      notes,
    };

    const updatedCustody = [...(delivery.chainOfCustody as any[]), custodyEntry];

    const data: any = { status, chainOfCustody: updatedCustody };
    if (status === DeliveryStatus.IN_TRANSIT) data.dispatchedAt = new Date();
    if (status === DeliveryStatus.DELIVERED) data.deliveredAt = new Date();

    const updated = await this.prisma.deliveryOrder.update({ where: { id }, data });

    // Entrega confirmada: las unidades asignadas quedan usadas, cierra el ciclo de vida.
    if (status === DeliveryStatus.DELIVERED) {
      await this.prisma.bloodUnit.updateMany({
        where: { id: { in: delivery.items.map((i) => i.bloodUnitId) }, status: 'ALLOCATED' },
        data: { status: 'USED', usedAt: new Date(), usedForNote: `Entregado a ${delivery.destinationName}` },
      });
    }

    return updated;
  }

  async findAll(page: any = 1, limit: any = 20) {
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 20);
    const [orders, total] = await Promise.all([
      this.prisma.deliveryOrder.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          vehicle: true,
          protocol: true,
          items: { include: { bloodUnit: { include: { donor: { select: { name: true } } } } } },
        },
      }),
      this.prisma.deliveryOrder.count(),
    ]);
    return { orders, total, page, limit };
  }

  async getVehicles() {
    return this.prisma.vehicle.findMany({ where: { isActive: true } });
  }

  async getProtocols() {
    return this.prisma.deliveryProtocol.findMany();
  }
}
