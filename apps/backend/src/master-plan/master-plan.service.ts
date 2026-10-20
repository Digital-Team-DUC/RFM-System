import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class MasterPlanService {
  constructor(private readonly prisma: PrismaService) {}

  async getMasterPlanByProject(projectId: string) {
    let asset = await this.prisma.masterPlanAsset.findFirst({
      where: { projectId },
      include: {
        shapes: {
          include: {
            property: {
              select: {
                id: true,
                code: true,
                title: true,
                unitNumber: true,
                status: true,
                propertyType: true,
                sellingPrice: true,
                landArea: true,
                buildingArea: true,
                bedrooms: true,
                bathrooms: true,
              },
            },
          },
        },
      },
    });

    if (!asset) {
      // Create a default master plan asset if not yet present
      asset = await this.prisma.masterPlanAsset.create({
        data: {
          projectId,
          title: 'Project Master Plan & Plot Layout',
          width: 1000,
          height: 600,
        },
        include: {
          shapes: {
            include: { property: true },
          },
        },
      });
    }

    return asset;
  }

  async updateShape(id: string, data: any) {
    return this.prisma.masterPlanShape.update({
      where: { id },
      data,
    });
  }
}
