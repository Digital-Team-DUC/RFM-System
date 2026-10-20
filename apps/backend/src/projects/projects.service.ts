import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId?: string) {
    const projects = await this.prisma.project.findMany({
      where: organizationId ? { organizationId } : undefined,
      include: {
        properties: {
          select: {
            id: true,
            status: true,
            sellingPrice: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return projects.map((p) => {
      const totalUnits = p.properties.length;
      const availableUnits = p.properties.filter((u) => u.status === 'AVAILABLE').length;
      const reservedUnits = p.properties.filter((u) => u.status === 'RESERVED').length;
      const soldUnits = p.properties.filter((u) => ['SOLD', 'INSTALLMENT', 'TRANSFERRED'].includes(u.status)).length;
      const totalRevenue = p.properties
        .filter((u) => ['SOLD', 'INSTALLMENT', 'TRANSFERRED'].includes(u.status))
        .reduce((acc, curr) => acc + Number(curr.sellingPrice), 0);

      const { properties, ...projectData } = p;
      return {
        ...projectData,
        totalUnits,
        availableUnits,
        reservedUnits,
        soldUnits,
        totalRevenue,
      };
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        properties: {
          orderBy: { code: 'asc' },
        },
        masterPlanAssets: {
          include: {
            shapes: true,
          },
        },
        expenses: {
          take: 5,
          orderBy: { expenseDate: 'desc' },
        },
      },
    });

    if (!project) throw new NotFoundException('Project not found');

    const totalUnits = project.properties.length;
    const availableUnits = project.properties.filter((u) => u.status === 'AVAILABLE').length;
    const reservedUnits = project.properties.filter((u) => u.status === 'RESERVED').length;
    const soldUnits = project.properties.filter((u) => ['SOLD', 'INSTALLMENT', 'TRANSFERRED'].includes(u.status)).length;

    return {
      ...project,
      totalUnits,
      availableUnits,
      reservedUnits,
      soldUnits,
    };
  }

  async create(data: any, organizationId: string) {
    return this.prisma.project.create({
      data: {
        ...data,
        organizationId,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }
}
