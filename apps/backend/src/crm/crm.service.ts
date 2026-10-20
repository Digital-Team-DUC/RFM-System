import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  // Customers
  async getCustomers(query: { organizationId?: string; search?: string; type?: string }) {
    const where: any = {};
    if (query.organizationId) where.organizationId = query.organizationId;
    if (query.type) where.customerType = query.type;
    if (query.search) {
      where.OR = [
        { fullName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: {
        assignedAgent: { select: { id: true, fullName: true, phone: true } },
        bookings: { select: { id: true, status: true } },
        contracts: { select: { id: true, status: true, sellingPrice: true, balanceRemaining: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map((c) => ({
      ...c,
      totalBookings: c.bookings.length,
      totalContracts: c.contracts.length,
      activeContracts: c.contracts.filter((ctr) => ctr.status === 'ACTIVE').length,
    }));
  }

  async getCustomer(id: string) {
    const customer = await this.prisma.customer.findUnique({
      where: { id },
      include: {
        assignedAgent: true,
        documents: true,
        bookings: {
          include: {
            property: true,
            deposits: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        contracts: {
          include: {
            property: true,
            installments: { orderBy: { installmentNumber: 'asc' } },
            payments: { orderBy: { paymentDate: 'desc' } },
          },
        },
        viewings: {
          include: { property: true },
          orderBy: { scheduledTime: 'desc' },
        },
        leads: {
          include: { activities: true },
        },
      },
    });

    if (!customer) throw new NotFoundException('Customer not found');
    return customer;
  }

  async createCustomer(data: any, organizationId: string) {
    return this.prisma.customer.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  // Leads
  async getLeads(organizationId?: string, stage?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;
    if (stage) where.stage = stage;

    return this.prisma.lead.findMany({
      where,
      include: {
        customer: true,
        assignedAgent: { select: { id: true, fullName: true } },
        activities: { orderBy: { createdAt: 'desc' } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createLead(data: any, organizationId: string) {
    return this.prisma.lead.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async updateLeadStage(id: string, stage: string, lostReason?: string) {
    return this.prisma.lead.update({
      where: { id },
      data: {
        stage,
        lostReason: stage === 'LOST' ? lostReason : null,
      },
    });
  }

  async addLeadActivity(leadId: string, data: any, userId?: string) {
    return this.prisma.leadActivity.create({
      data: {
        leadId,
        ...data,
        performedById: userId,
      },
    });
  }

  // Viewings
  async getViewings(customerId?: string, propertyId?: string) {
    const where: any = {};
    if (customerId) where.customerId = customerId;
    if (propertyId) where.propertyId = propertyId;

    return this.prisma.propertyViewing.findMany({
      where,
      include: {
        customer: true,
        property: true,
      },
      orderBy: { scheduledTime: 'desc' },
    });
  }

  async scheduleViewing(data: any) {
    return this.prisma.propertyViewing.create({
      data,
    });
  }
}
