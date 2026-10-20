import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('Properties')
@Controller('properties')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Get()
  @ApiOperation({ summary: 'Filter and list property inventory' })
  @ApiQuery({ name: 'projectId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'propertyType', required: false })
  @ApiQuery({ name: 'search', required: false })
  async findAll(@Query() query: any) {
    return this.propertiesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full property detail with history and bookings' })
  async findOne(@Param('id') id: string) {
    return this.propertiesService.findOne(id);
  }

  @Post()
  @RequirePermissions('properties.create')
  @ApiOperation({ summary: 'Create new property unit' })
  async create(@Body() body: any) {
    return this.propertiesService.create(body);
  }

  @Patch(':id')
  @RequirePermissions('properties.update')
  @ApiOperation({ summary: 'Update property specifications' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.propertiesService.update(id, body);
  }

  @Patch(':id/status')
  @RequirePermissions('properties.update')
  @ApiOperation({ summary: 'Perform validated property status transition' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string; reason?: string },
    @Req() req: any
  ) {
    return this.propertiesService.updateStatus(id, body.status, body.reason, req.user.userId);
  }
}
