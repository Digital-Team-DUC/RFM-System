import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsGateway } from '../events/events.gateway';

const VALID_TRANSITIONS: Record<string, string[]> = {
  AVAILABLE: ['RESERVED', 'BLOCKED', 'UNDER_DEVELOPMENT'],
  RESERVED: ['AVAILABLE', 'DEPOSIT_PENDING', 'BOOKING_PENDING', 'CONTRACT_PENDING', 'CANCELLED'],
  BOOKING_PENDING: ['RESERVED', 'DEPOSIT_PENDING', 'AVAILABLE', 'CANCELLED'],
  DEPOSIT_PENDING: ['RESERVED', 'CONTRACT_PENDING', 'AVAILABLE', 'CANCELLED'],
  CONTRACT_PENDING: ['INSTALLMENT', 'SOLD', 'AVAILABLE', 'CANCELLED'],
  INSTALLMENT: ['SOLD', 'TRANSFERRED', 'CANCELLED'],
  SOLD: ['TRANSFERRED', 'CANCELLED'],
  TRANSFERRED: [],
  CANCELLED: ['AVAILABLE'],
  BLOCKED: ['AVAILABLE'],
  UNDER_DEVELOPMENT: ['AVAILABLE'],
};

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway
  ) {}

  async findAll(query: {
    projectId?: string;
    status?: string;
    propertyType?: string;
    search?: string;
    minPrice?: number;
    maxPrice?: number;
    bedrooms?: number;
  }) {
    const where: any = {};
    if (query.projectId) where.projectId = query.projectId;
    if (query.status) where.status = query.status;
    if (query.propertyType) where.propertyType = query.propertyType;
    if (query.bedrooms) where.bedrooms = Number(query.bedrooms);

    if (query.minPrice || query.maxPrice) {
      where.sellingPrice = {};
      if (query.minPrice) where.sellingPrice.gte = Number(query.minPrice);
      if (query.maxPrice) where.sellingPrice.lte = Number(query.maxPrice);
    }

    if (query.search) {
      where.OR = [
        { code: { contains: query.search, mode: 'insensitive' } },
        { title: { contains: query.search, mode: 'insensitive' } },
        { unitNumber: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.property.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        project: true,
        masterPlanShapes: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        bookings: {
          include: {
            customer: true,
            deposits: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        contracts: {
          include: {
            customer: true,
            installments: {
              orderBy: { installmentNumber: 'asc' },
            },
          },
        },
        documents: true,
        images: true,
      },
    });

    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async create(data: any) {
    const existing = await this.prisma.property.findUnique({
      where: { code: data.code },
    });
    if (existing) {
      throw new BadRequestException(`Property with code ${data.code} already exists`);
    }

    return this.prisma.property.create({
      data,
    });
  }

  async update(id: string, data: any) {
    return this.prisma.property.update({
      where: { id },
      data,
    });
  }

  async updateStatus(id: string, newStatus: string, reason?: string, userId?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id },
    });
    if (!property) throw new NotFoundException('Property not found');

    const allowed = VALID_TRANSITIONS[property.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${property.status} to ${newStatus}. Allowed: [${allowed.join(', ')}]`
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const p = await tx.property.update({
        where: { id },
        data: { status: newStatus },
      });

      await tx.propertyStatusHistory.create({
        data: {
          propertyId: id,
          fromStatus: property.status,
          toStatus: newStatus,
          reason,
          changedBy: userId,
        },
      });

      // Also update master plan shape color/status if linked
      await tx.masterPlanShape.updateMany({
        where: { propertyId: id },
        data: {
          status: newStatus,
          colorCode:
            newStatus === 'AVAILABLE'
              ? '#10b981'
              : newStatus === 'RESERVED'
              ? '#f59e0b'
              : newStatus === 'INSTALLMENT'
              ? '#3b82f6'
              : '#ef4444',
        },
      });

      return p;
    });

    // Real-time broadcast
    this.eventsGateway.emitPropertyStatusChanged({
      propertyId: id,
      status: newStatus,
      code: property.code,
      projectId: property.projectId,
    });

    return updated;
  }
}
