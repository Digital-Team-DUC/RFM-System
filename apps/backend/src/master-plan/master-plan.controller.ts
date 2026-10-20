import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { MasterPlanService } from './master-plan.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Master Plan')
@Controller('master-plan')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MasterPlanController {
  constructor(private readonly masterPlanService: MasterPlanService) {}

  @Get('project/:projectId')
  @ApiOperation({ summary: 'Get interactive master plan SVG and plot shapes for a project' })
  async getMasterPlanByProject(@Param('projectId') projectId: string) {
    return this.masterPlanService.getMasterPlanByProject(projectId);
  }

  @Patch('shapes/:id')
  @ApiOperation({ summary: 'Update master plan shape coordinates or properties' })
  async updateShape(@Param('id') id: string, @Body() body: any) {
    return this.masterPlanService.updateShape(id, body);
  }
}
