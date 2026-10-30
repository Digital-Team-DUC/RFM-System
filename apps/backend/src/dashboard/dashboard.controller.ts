import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Executive Dashboard & Analytics')
@Controller('dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get executive KPI summary and analytics charts' })
  async getSummary(@Req() req: any) {
    return this.dashboardService.getSummary(req.user.organizationId);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get executive performance metrics, plots sold, expenses, net profit and custom range reports' })
  async getPerformanceReport(
    @Query('period') period?: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'all' | 'custom',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('projectId') projectId?: string,
    @Req() req?: any,
  ) {
    return this.dashboardService.getPerformanceReport(req.user.organizationId, {
      period,
      startDate,
      endDate,
      projectId,
    });
  }
}
