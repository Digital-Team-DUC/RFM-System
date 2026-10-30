import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { EventsGateway } from '../events/events.gateway';

const STATUS_COLOR_MAP: Record<string, string> = {
  AVAILABLE: '#10b981',
  RESERVED: '#f59e0b',
  INSTALLMENT: '#3b82f6',
  SOLD: '#ef4444',
  BLOCKED: '#64748b',
  UNDER_DEVELOPMENT: '#8b5cf6',
  INFRASTRUCTURE: '#334155',
  ROAD: '#1e293b',
  AMENITY: '#059669',
  PARK: '#065f46',
  WATER: '#0284c7',
};

@Injectable()
export class MasterPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsGateway: EventsGateway,
  ) {}

  /**
   * Helper to resolve status color
   */
  private getColorForStatus(status: string): string {
    return STATUS_COLOR_MAP[status] || '#10b981';
  }

  /**
   * Get all master plan assets for a given project
   */
  async getAssetsByProject(projectId: string) {
    let assets = await this.prisma.masterPlanAsset.findMany({
      where: { projectId },
      include: {
        _count: {
          select: { shapes: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (assets.length === 0) {
      // Auto-create initial master plan asset
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
      });
      const initialAsset = await this.prisma.masterPlanAsset.create({
        data: {
          projectId,
          title: `${project?.name || 'Project'} - Master Site Plan`,
          width: 1000,
          height: 600,
        },
        include: {
          _count: {
            select: { shapes: true },
          },
        },
      });

      // Auto-generate plots if project already has properties
      await this.generateDemoLayout(initialAsset.id);

      assets = await this.prisma.masterPlanAsset.findMany({
        where: { projectId },
        include: {
          _count: {
            select: { shapes: true },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return assets;
  }

  /**
   * Get primary master plan for backward compatibility
   */
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
                facingDirection: true,
                block: true,
                zone: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (!asset) {
      const assets = await this.getAssetsByProject(projectId);
      if (assets.length > 0) {
        return this.getAssetById(assets[0].id);
      }
    }

    return asset;
  }

  /**
   * Get specific master plan asset by ID with shapes and properties
   */
  async getAssetById(assetId: string) {
    const asset = await this.prisma.masterPlanAsset.findUnique({
      where: { id: assetId },
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
                facingDirection: true,
                block: true,
                zone: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!asset) {
      throw new NotFoundException(`Master plan asset ${assetId} not found`);
    }

    return asset;
  }

  /**
   * Create a new Master Plan Asset
   */
  async createAsset(
    projectId: string,
    data: {
      title: string;
      width?: number;
      height?: number;
      svgContent?: string;
      fileUrl?: string;
    },
  ) {
    const asset = await this.prisma.masterPlanAsset.create({
      data: {
        projectId,
        title: data.title,
        width: data.width || 1000,
        height: data.height || 600,
        svgContent: data.svgContent,
        fileUrl: data.fileUrl,
      },
    });
    return asset;
  }

  /**
   * Update Master Plan Asset metadata
   */
  async updateAsset(
    assetId: string,
    data: {
      title?: string;
      width?: number;
      height?: number;
      svgContent?: string;
      fileUrl?: string;
    },
  ) {
    const asset = await this.prisma.masterPlanAsset.update({
      where: { id: assetId },
      data,
    });
    return asset;
  }

  /**
   * Delete Master Plan Asset
   */
  async deleteAsset(assetId: string) {
    return this.prisma.masterPlanAsset.delete({
      where: { id: assetId },
    });
  }

  /**
   * Create a plot or infrastructure shape
   */
  async createShape(
    assetId: string,
    data: {
      propertyId?: string;
      shapeType?: string;
      coordinates: string;
      label: string;
      colorCode?: string;
      status?: string;
    },
  ) {
    let status = data.status || 'AVAILABLE';
    let label = data.label;
    const shapeType = data.shapeType || 'path';

    if (shapeType === 'road' || shapeType === 'boulevard' || shapeType === 'street') {
      status = 'INFRASTRUCTURE';
    } else if (shapeType === 'park' || shapeType === 'water' || shapeType === 'amenity') {
      status = 'AMENITY';
    } else if (data.propertyId) {
      const prop = await this.prisma.property.findUnique({
        where: { id: data.propertyId },
      });
      if (prop) {
        status = prop.status;
        if (!label) label = prop.unitNumber || prop.code;
      }
    }

    const colorCode =
      data.colorCode ||
      (shapeType === 'road' || shapeType === 'boulevard'
        ? '#1e293b'
        : shapeType === 'street'
        ? '#334155'
        : shapeType === 'park'
        ? '#065f46'
        : shapeType === 'water'
        ? '#0284c7'
        : this.getColorForStatus(status));

    return this.prisma.masterPlanShape.create({
      data: {
        assetId,
        propertyId: data.propertyId || null,
        shapeType,
        coordinates: data.coordinates,
        label: label || (shapeType === 'road' ? 'New Street' : 'Plot'),
        status,
        colorCode,
      },
      include: {
        property: true,
      },
    });
  }

  /**
   * Create Road helper
   */
  async createRoad(
    assetId: string,
    data: {
      name: string;
      roadType?: 'boulevard' | 'street' | 'alley';
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      coordinates?: string;
    },
  ) {
    const asset = await this.prisma.masterPlanAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    const canvasWidth = asset.width || 1000;
    const roadType = data.roadType || 'boulevard';
    const thickness = roadType === 'boulevard' ? 36 : roadType === 'street' ? 22 : 14;

    let coords = data.coordinates;
    if (!coords) {
      const y = data.y !== undefined ? data.y : Math.round((asset.height || 600) / 2);
      coords = `M 20 ${y} L ${canvasWidth - 20} ${y} L ${canvasWidth - 20} ${y + thickness} L 20 ${y + thickness} Z`;
    }

    return this.prisma.masterPlanShape.create({
      data: {
        assetId,
        shapeType: roadType,
        coordinates: coords,
        label: data.name || (roadType === 'boulevard' ? 'Main Boulevard' : 'Street'),
        status: 'INFRASTRUCTURE',
        colorCode: roadType === 'boulevard' ? '#1e293b' : '#334155',
      },
      include: { property: true },
    });
  }

  /**
   * Create Amenity / Landscape helper
   */
  async createAmenity(
    assetId: string,
    data: {
      name: string;
      amenityType: 'park' | 'water' | 'clubhouse' | 'pool' | 'gate';
      coordinates?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    },
  ) {
    const asset = await this.prisma.masterPlanAsset.findUnique({ where: { id: assetId } });
    if (!asset) throw new NotFoundException('Asset not found');

    let coords = data.coordinates;
    const x = data.x !== undefined ? data.x : 400;
    const y = data.y !== undefined ? data.y : 200;
    const w = data.width || 140;
    const h = data.height || 90;

    if (!coords) {
      coords = `M ${x} ${y} L ${x + w} ${y} L ${x + w} ${y + h} L ${x} ${y + h} Z`;
    }

    const colorCode =
      data.amenityType === 'park'
        ? '#065f46'
        : data.amenityType === 'water'
        ? '#0284c7'
        : data.amenityType === 'pool'
        ? '#0ea5e9'
        : '#475569';

    return this.prisma.masterPlanShape.create({
      data: {
        assetId,
        shapeType: data.amenityType,
        coordinates: coords,
        label: data.name || 'Amenity Space',
        status: 'AMENITY',
        colorCode,
      },
      include: { property: true },
    });
  }

  /**
   * Update plot shape and optionally insert/update linked property info
   */
  async updateShape(id: string, data: any) {
    const currentShape = await this.prisma.masterPlanShape.findUnique({
      where: { id },
      include: { asset: true, property: true },
    });

    if (!currentShape) {
      throw new NotFoundException(`Shape ${id} not found`);
    }

    const updateData: any = {};
    if (data.coordinates !== undefined) updateData.coordinates = data.coordinates;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.shapeType !== undefined) updateData.shapeType = data.shapeType;
    if (data.colorCode !== undefined) updateData.colorCode = data.colorCode;
    if (data.status !== undefined) updateData.status = data.status;

    // Handle Property linking and "Insert Info"
    let targetPropertyId = data.propertyId !== undefined ? data.propertyId : currentShape.propertyId;

    if (data.propertyInfo) {
      const pInfo = data.propertyInfo;

      // Safely parse numbers
      const safeSellingPrice = Number(pInfo.sellingPrice) > 0 ? Number(pInfo.sellingPrice) : 0;
      const safeLandArea = Number(pInfo.landArea) > 0 ? Number(pInfo.landArea) : 0;
      const safeBuildingArea = Number(pInfo.buildingArea) > 0 ? Number(pInfo.buildingArea) : 0;
      const safeBedrooms = Number(pInfo.bedrooms) >= 0 ? Number(pInfo.bedrooms) : 0;
      const safeBathrooms = Number(pInfo.bathrooms) >= 0 ? Number(pInfo.bathrooms) : 0;

      let existingProp: any = null;
      if (targetPropertyId) {
        existingProp = await this.prisma.property.findUnique({ where: { id: targetPropertyId } });
      }

      if (existingProp) {
        // Update existing property record
        await this.prisma.property.update({
          where: { id: targetPropertyId },
          data: {
            ...(pInfo.title && { title: pInfo.title }),
            ...(pInfo.unitNumber && { unitNumber: pInfo.unitNumber }),
            ...(pInfo.propertyType && { propertyType: pInfo.propertyType }),
            ...(pInfo.status && { status: pInfo.status }),
            sellingPrice: safeSellingPrice,
            listingPrice: safeSellingPrice,
            landArea: safeLandArea,
            buildingArea: safeBuildingArea,
            bedrooms: safeBedrooms,
            bathrooms: safeBathrooms,
            ...(pInfo.facingDirection && { facingDirection: pInfo.facingDirection }),
            ...(pInfo.block && { block: pInfo.block }),
            ...(pInfo.zone && { zone: pInfo.zone }),
          },
        });
      } else if (pInfo) {
        // Resolve project ID safely
        let projectId: string | undefined = currentShape.asset?.projectId;
        if (!projectId && currentShape.assetId) {
          const ast = await this.prisma.masterPlanAsset.findUnique({ where: { id: currentShape.assetId } });
          projectId = ast?.projectId;
        }

        if (projectId) {
          const project = await this.prisma.project.findUnique({
            where: { id: projectId },
            select: { code: true },
          });
          const prefix = project?.code ? `${project.code}-` : 'PROP-';
          const unitNum = pInfo.unitNumber || data.label || 'U-1';
          const sanitizedUnit = unitNum.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

          // Ensure collision-free unique code across database
          let candidateCode = `${prefix}${sanitizedUnit || 'PLOT'}`;
          let suffix = 1;
          while (await this.prisma.property.findUnique({ where: { code: candidateCode } })) {
            candidateCode = `${prefix}${sanitizedUnit || 'PLOT'}-${suffix}`;
            suffix++;
          }

          const createdProp = await this.prisma.property.create({
            data: {
              projectId: projectId as string,
              code: candidateCode,
              title: pInfo.title || `Plot ${unitNum}`,
              unitNumber: unitNum,
              propertyType: pInfo.propertyType || 'VILLA',
              status: data.status || 'AVAILABLE',
              sellingPrice: safeSellingPrice,
              listingPrice: safeSellingPrice,
              landArea: safeLandArea || 120,
              buildingArea: safeBuildingArea || 0,
              bedrooms: safeBedrooms,
              bathrooms: safeBathrooms,
              facingDirection: pInfo.facingDirection || 'NORTH',
              block: pInfo.block || 'Block A',
              zone: pInfo.zone || 'Zone 1',
            },
          });

          targetPropertyId = createdProp.id;
        }
      }
    }

    if (targetPropertyId !== undefined) {
      updateData.propertyId = targetPropertyId;

      if (targetPropertyId) {
        const prop = await this.prisma.property.findUnique({
          where: { id: targetPropertyId },
        });
        if (prop) {
          if (!data.status) updateData.status = prop.status;
          if (!data.colorCode) updateData.colorCode = this.getColorForStatus(prop.status);
          if (!data.label) updateData.label = prop.unitNumber || prop.code;
        }
      }
    } else if (data.status && !data.colorCode) {
      updateData.colorCode = this.getColorForStatus(data.status);
    }

    return this.prisma.masterPlanShape.update({
      where: { id },
      data: updateData,
      include: {
        property: true,
      },
    });
  }

  /**
   * Delete a shape
   */
  async deleteShape(id: string) {
    return this.prisma.masterPlanShape.delete({
      where: { id },
    });
  }

  /**
   * Batch update multiple shapes
   */
  async batchUpdateShapes(shapes: Array<{ id: string; coordinates?: string; label?: string; colorCode?: string }>) {
    const updates = shapes.map((s) =>
      this.prisma.masterPlanShape.update({
        where: { id: s.id },
        data: {
          ...(s.coordinates && { coordinates: s.coordinates }),
          ...(s.label && { label: s.label }),
          ...(s.colorCode && { colorCode: s.colorCode }),
        },
      }),
    );
    return this.prisma.$transaction(updates);
  }

  /**
   * Get unassigned properties for a project in this asset
   */
  async getUnassignedProperties(projectId: string, assetId?: string) {
    const existingShapes = await this.prisma.masterPlanShape.findMany({
      where: {
        ...(assetId ? { assetId } : {}),
        propertyId: { not: null },
      },
      select: { propertyId: true },
    });

    const mappedPropertyIds = existingShapes
      .map((s) => s.propertyId)
      .filter((id): id is string => Boolean(id));

    return this.prisma.property.findMany({
      where: {
        projectId,
        id: { notIn: mappedPropertyIds },
      },
      orderBy: [{ block: 'asc' }, { unitNumber: 'asc' }],
    });
  }

  /**
   * Auto-generate a realistic plot layout on the master plan canvas
   * for unassigned properties
   */
  async generateDemoLayout(assetId: string) {
    const asset = await this.prisma.masterPlanAsset.findUnique({
      where: { id: assetId },
    });
    if (!asset) throw new NotFoundException('Master plan asset not found');

    // Get unplaced properties in this project
    const placedShapes = await this.prisma.masterPlanShape.findMany({
      where: { assetId, propertyId: { not: null } },
      select: { propertyId: true },
    });
    const placedIds = placedShapes.map((s) => s.propertyId).filter(Boolean);

    const properties = await this.prisma.property.findMany({
      where: {
        projectId: asset.projectId,
        id: { notIn: placedIds as string[] },
      },
      orderBy: [{ block: 'asc' }, { unitNumber: 'asc' }],
    });

    if (properties.length === 0) {
      return { message: 'All project properties are already placed on this site plan', count: 0 };
    }

    // Grid layout generator:
    const plotWidth = 85;
    const plotHeight = 75;
    const gapX = 14;
    const gapY = 28;
    const startX = 60;
    const startY = 70;
    const columnsPerRow = 8;

    const shapesToCreate: any[] = [];

    properties.forEach((prop, idx) => {
      const row = Math.floor(idx / columnsPerRow);
      const col = idx % columnsPerRow;

      const boulevardExtraY = row >= 2 ? 60 : 0;
      const avenueExtraX = col >= 4 ? 40 : 0;

      const x = startX + col * (plotWidth + gapX) + avenueExtraX;
      const y = startY + row * (plotHeight + gapY) + boulevardExtraY;

      const coordinates = `M ${x} ${y} L ${x + plotWidth} ${y} L ${x + plotWidth} ${y + plotHeight} L ${x} ${y + plotHeight} Z`;

      shapesToCreate.push({
        assetId,
        propertyId: prop.id,
        shapeType: 'path',
        coordinates,
        label: prop.unitNumber || prop.code,
        status: prop.status,
        colorCode: this.getColorForStatus(prop.status),
      });
    });

    await this.prisma.masterPlanShape.createMany({
      data: shapesToCreate,
    });

    return {
      message: `Successfully generated ${shapesToCreate.length} interactive plot shapes`,
      count: shapesToCreate.length,
    };
  }

  /**
   * Save uploaded SVG content or vector blueprint
   */
  async uploadSvgPlan(assetId: string, svgContent: string) {
    return this.prisma.masterPlanAsset.update({
      where: { id: assetId },
      data: { svgContent },
    });
  }
}
