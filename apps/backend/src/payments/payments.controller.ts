import { Controller, Get, Post, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Payments & Installments')
@Controller('payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermissions('payments.receive')
  @ApiOperation({ summary: 'List customer payments and receipts' })
  async findAll(@Query() query: any) {
    return this.paymentsService.findAllPayments(query);
  }

  @Post()
  @RequirePermissions('payments.receive')
  @ApiOperation({ summary: 'Record customer payment and allocate across installments' })
  async recordPayment(@Body() body: any, @Req() req: any) {
    return this.paymentsService.recordPayment({
      ...body,
      receivedById: req.user.userId,
    });
  }

  @Post('plans/:contractId')
  @RequirePermissions('contracts.manage')
  @ApiOperation({ summary: 'Configure payment plan and generate installment schedule' })
  async createPaymentPlan(
    @Param('contractId') contractId: string,
    @Body() body: any
  ) {
    return this.paymentsService.createPaymentPlan(contractId, body);
  }

  @Get('contract/:contractId/installments')
  @RequirePermissions('payments.receive')
  @ApiOperation({ summary: 'Get installment schedule with real-time penalty calculations' })
  async getContractInstallments(@Param('contractId') contractId: string) {
    return this.paymentsService.getContractInstallments(contractId);
  }

  @Post('installments/:id/waive-penalty')
  @RequirePermissions('payments.receive')
  @ApiOperation({ summary: 'Waive overdue installment penalty with authorization' })
  async waivePenalty(
    @Param('id') id: string,
    @Body() body: { amount: number; reason: string }
  ) {
    return this.paymentsService.waivePenalty(id, body.amount, body.reason);
  }
}
