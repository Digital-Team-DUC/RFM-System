import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Projects')
@Controller('projects')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List all property projects' })
  async findAll(@Req() req: any) {
    return this.projectsService.findAll(req.user.organizationId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project details with properties and master plan' })
  async findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @Post()
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: 'Create a new project' })
  async create(@Body() body: any, @Req() req: any) {
    return this.projectsService.create(body, req.user.organizationId);
  }

  @Patch(':id')
  @RequirePermissions('projects.manage')
  @ApiOperation({ summary: 'Update project settings or budget' })
  async update(@Param('id') id: string, @Body() body: any) {
    return this.projectsService.update(id, body);
  }
}
