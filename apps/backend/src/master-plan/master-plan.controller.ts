import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MasterPlanService } from './master-plan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Master Plan')
@Controller('master-plan')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MasterPlanController {
  constructor(private readonly masterPlanService: MasterPlanService) {}

  @Get(['project/:projectId', 'projects/:projectId'])
  @ApiOperation({ summary: 'Get primary interactive master plan SVG and plot shapes for a project' })
  async getMasterPlanByProject(@Param('projectId') projectId: string) {
    return this.masterPlanService.getMasterPlanByProject(projectId);
  }

  @Get(['project/:projectId/assets', 'projects/:projectId/assets'])
  @ApiOperation({ summary: 'List all master plan assets/phases for a project' })
  async getAssetsByProject(@Param('projectId') projectId: string) {
    return this.masterPlanService.getAssetsByProject(projectId);
  }

  @Post(['project/:projectId/assets', 'projects/:projectId/assets'])
  @ApiOperation({ summary: 'Create a new master plan asset/sheet (phase, floor, zone)' })
  async createAsset(
    @Param('projectId') projectId: string,
    @Body()
    body: {
      title: string;
      width?: number;
      height?: number;
      svgContent?: string;
      fileUrl?: string;
    },
  ) {
    return this.masterPlanService.createAsset(projectId, body);
  }

  @Get('assets/:assetId')
  @ApiOperation({ summary: 'Get specific master plan asset with its shapes and property details' })
  async getAssetById(@Param('assetId') assetId: string) {
    return this.masterPlanService.getAssetById(assetId);
  }

  @Patch('assets/:assetId')
  @ApiOperation({ summary: 'Update master plan asset metadata' })
  async updateAsset(
    @Param('assetId') assetId: string,
    @Body()
    body: {
      title?: string;
      width?: number;
      height?: number;
      svgContent?: string;
      fileUrl?: string;
    },
  ) {
    return this.masterPlanService.updateAsset(assetId, body);
  }

  @Delete('assets/:assetId')
  @ApiOperation({ summary: 'Delete a master plan asset' })
  async deleteAsset(@Param('assetId') assetId: string) {
    return this.masterPlanService.deleteAsset(assetId);
  }

  @Post('assets/:assetId/shapes')
  @ApiOperation({ summary: 'Create a new plot shape on a master plan' })
  async createShape(
    @Param('assetId') assetId: string,
    @Body()
    body: {
      propertyId?: string;
      shapeType?: string;
      coordinates: string;
      label: string;
      colorCode?: string;
      status?: string;
    },
  ) {
    return this.masterPlanService.createShape(assetId, body);
  }

  @Post('assets/:assetId/roads')
  @ApiOperation({ summary: 'Create a road infrastructure element on the master plan' })
  async createRoad(
    @Param('assetId') assetId: string,
    @Body()
    body: {
      name: string;
      roadType?: 'boulevard' | 'street' | 'alley';
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      coordinates?: string;
    },
  ) {
    return this.masterPlanService.createRoad(assetId, body);
  }

  @Post('assets/:assetId/amenities')
  @ApiOperation({ summary: 'Create a green park, water canal, or amenity space' })
  async createAmenity(
    @Param('assetId') assetId: string,
    @Body()
    body: {
      name: string;
      amenityType: 'park' | 'water' | 'clubhouse' | 'pool' | 'gate';
      coordinates?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    },
  ) {
    return this.masterPlanService.createAmenity(assetId, body);
  }

  @Patch('shapes/:id')
  @ApiOperation({ summary: 'Update master plan shape coordinates, properties, or insert info' })
  async updateShape(@Param('id') id: string, @Body() body: any) {
    return this.masterPlanService.updateShape(id, body);
  }

  @Delete('shapes/:id')
  @ApiOperation({ summary: 'Delete a master plan shape' })
  async deleteShape(@Param('id') id: string) {
    return this.masterPlanService.deleteShape(id);
  }

  @Post('shapes/batch')
  @ApiOperation({ summary: 'Batch update plot shapes' })
  async batchUpdateShapes(
    @Body() body: { shapes: Array<{ id: string; coordinates?: string; label?: string; colorCode?: string }> },
  ) {
    return this.masterPlanService.batchUpdateShapes(body.shapes);
  }

  @Get('project/:projectId/unassigned-properties')
  @ApiOperation({ summary: 'Get properties not yet placed on the master plan' })
  async getUnassignedProperties(
    @Param('projectId') projectId: string,
    @Query('assetId') assetId?: string,
  ) {
    return this.masterPlanService.getUnassignedProperties(projectId, assetId);
  }

  @Post('assets/:assetId/generate-demo')
  @ApiOperation({ summary: 'Auto-generate plot layout for unassigned properties' })
  async generateDemoLayout(@Param('assetId') assetId: string) {
    return this.masterPlanService.generateDemoLayout(assetId);
  }

  @Post('assets/:assetId/upload-svg')
  @ApiOperation({ summary: 'Save uploaded SVG blueprint string for this asset' })
  async uploadSvgPlan(
    @Param('assetId') assetId: string,
    @Body('svgContent') svgContent: string,
  ) {
    return this.masterPlanService.uploadSvgPlan(assetId, svgContent);
  }
}
