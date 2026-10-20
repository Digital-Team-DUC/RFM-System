import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CommissionsService } from './commissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Commissions')
@Controller('commissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CommissionsController {
  constructor(private readonly commissionsService: CommissionsService) {}

  @Get('agents')
  @ApiOperation({ summary: 'List sales agents with performance summaries' })
  async getAgents(@Req() req: any) {
    return this.commissionsService.getAgents(req.user.organizationId);
  }

  @Get('policies')
  @ApiOperation({ summary: 'List commission calculation policies' })
  async getPolicies(@Req() req: any) {
    return this.commissionsService.getPolicies(req.user.organizationId);
  }

  @Get('calculations')
  @ApiOperation({ summary: 'List commission calculations and payout statuses' })
  async getCalculations(@Query() query: any) {
    return this.commissionsService.getCalculations(query);
  }

  @Patch('calculations/:id/approve')
  @RequirePermissions('commissions.approve')
  @ApiOperation({ summary: 'Approve agent commission for payout' })
  async approveCommission(
    @Param('id') id: string,
    @Body('approvedAmount') amount: number,
    @Req() req: any
  ) {
    return this.commissionsService.approveCommission(id, req.user.userId, amount);
  }

  @Post('calculations/:id/payout')
  @RequirePermissions('commissions.approve')
  @ApiOperation({ summary: 'Disburse commission payout to sales agent' })
  async recordPayout(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.commissionsService.recordPayout(id, body, req.user.userId);
  }
}
