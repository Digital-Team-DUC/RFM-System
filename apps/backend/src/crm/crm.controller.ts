import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { CrmService } from './crm.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('CRM & Leads')
@Controller('crm')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class CrmController {
  constructor(private readonly crmService: CrmService) {}

  @Get('customers')
  @RequirePermissions('crm.read')
  @ApiOperation({ summary: 'List and search customers' })
  async getCustomers(@Query() query: any, @Req() req: any) {
    return this.crmService.getCustomers({
      ...query,
      organizationId: req.user.organizationId,
    });
  }

  @Get('customers/:id')
  @RequirePermissions('crm.read')
  @ApiOperation({ summary: 'Get full customer detail with transaction history' })
  async getCustomer(@Param('id') id: string) {
    return this.crmService.getCustomer(id);
  }

  @Post('customers')
  @RequirePermissions('crm.manage')
  @ApiOperation({ summary: 'Create a new customer profile' })
  async createCustomer(@Body() body: any, @Req() req: any) {
    return this.crmService.createCustomer(body, req.user.organizationId);
  }

  @Get('leads')
  @RequirePermissions('crm.read')
  @ApiOperation({ summary: 'Get leads pipeline' })
  async getLeads(@Query('stage') stage: string, @Req() req: any) {
    return this.crmService.getLeads(req.user.organizationId, stage);
  }

  @Post('leads')
  @RequirePermissions('crm.manage')
  @ApiOperation({ summary: 'Create new lead' })
  async createLead(@Body() body: any, @Req() req: any) {
    return this.crmService.createLead(body, req.user.organizationId);
  }

  @Patch('leads/:id/stage')
  @RequirePermissions('crm.manage')
  @ApiOperation({ summary: 'Advance or change lead stage in pipeline' })
  async updateLeadStage(
    @Param('id') id: string,
    @Body() body: { stage: string; lostReason?: string }
  ) {
    return this.crmService.updateLeadStage(id, body.stage, body.lostReason);
  }

  @Post('leads/:id/activities')
  @RequirePermissions('crm.manage')
  @ApiOperation({ summary: 'Log follow-up call, meeting, or note for lead' })
  async addLeadActivity(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.crmService.addLeadActivity(leadIdParam(id), body, req.user.userId);
  }

  @Get('viewings')
  @RequirePermissions('crm.read')
  @ApiOperation({ summary: 'List property viewing appointments' })
  async getViewings(@Query('customerId') custId: string, @Query('propertyId') propId: string) {
    return this.crmService.getViewings(custId, propId);
  }

  @Post('viewings')
  @RequirePermissions('crm.manage')
  @ApiOperation({ summary: 'Schedule new property viewing' })
  async scheduleViewing(@Body() body: any) {
    return this.crmService.scheduleViewing(body);
  }
}

function leadIdParam(id: string) {
  return id;
}
