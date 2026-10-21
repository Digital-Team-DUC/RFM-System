import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Finance & Operating Expenses')
@Controller('finance')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  @Get('expenses')
  @RequirePermissions('expenses.create')
  @ApiOperation({ summary: 'List operating expenses' })
  async getExpenses(@Query() query: any) {
    return this.financeService.getExpenses(query);
  }

  @Post('expenses')
  @RequirePermissions('expenses.create')
  @ApiOperation({ summary: 'Submit new operating expense voucher' })
  async createExpense(@Body() body: any, @Req() req: any) {
    return this.financeService.createExpense({
      ...body,
      requestedById: req.user.userId,
    });
  }

  @Patch('expenses/:id/approve')
  @RequirePermissions('expenses.approve')
  @ApiOperation({ summary: 'Approve expense requisition' })
  async approveExpense(@Param('id') id: string, @Req() req: any) {
    return this.financeService.approveExpense(id, req.user.userId);
  }

  @Post('expenses/:id/pay')
  @RequirePermissions('payments.receive')
  @ApiOperation({ summary: 'Disburse expense payment from financial account and post double-entry journal' })
  async payExpense(
    @Param('id') id: string,
    @Body('bankAccountId') bankAccountId: string,
    @Body('paidDate') paidDate: string
  ) {
    return this.financeService.payExpense(id, bankAccountId, paidDate);
  }

  @Get('accounts')
  @RequirePermissions('accounting.read')
  @ApiOperation({ summary: 'List bank and cash accounts' })
  async getAccounts(@Req() req: any) {
    return this.financeService.getAccounts(req.user.organizationId);
  }

  @Post('accounts')
  @RequirePermissions('accounting.post')
  @ApiOperation({ summary: 'Add a new bank or cash vault account' })
  async createAccount(@Body() body: any, @Req() req: any) {
    return this.financeService.createAccount(body, req.user.organizationId);
  }

  @Post('accounts/transfer')
  @RequirePermissions('payments.receive')
  @ApiOperation({ summary: 'Execute internal transfer between bank/cash accounts' })
  async transferFunds(@Body() body: any) {
    return this.financeService.transferFunds(body);
  }

  @Get('income')
  @ApiOperation({ summary: 'List company income records' })
  async getIncomeRecords(@Query() query: any) {
    return this.financeService.getIncomeRecords(query);
  }
}
