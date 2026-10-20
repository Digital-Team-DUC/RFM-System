import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Double-Entry Accounting & Financial Statements')
@Controller('accounting')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('chart-of-accounts')
  @RequirePermissions('accounting.read')
  @ApiOperation({ summary: 'Get Chart of Accounts with current balances' })
  async getChartOfAccounts(@Req() req: any) {
    return this.accountingService.getChartOfAccounts(req.user.organizationId);
  }

  @Post('chart-of-accounts')
  @RequirePermissions('accounting.post')
  @ApiOperation({ summary: 'Create a new general ledger account' })
  async createAccount(@Body() body: any, @Req() req: any) {
    return this.accountingService.createAccount({
      ...body,
      organizationId: req.user.organizationId,
    });
  }

  @Get('journal-entries')
  @RequirePermissions('accounting.read')
  @ApiOperation({ summary: 'List posted journal entries with debits and credits' })
  async getJournalEntries(@Req() req: any) {
    return this.accountingService.getJournalEntries(req.user.organizationId);
  }

  @Post('journal-entries')
  @RequirePermissions('accounting.post')
  @ApiOperation({ summary: 'Post balanced journal entry (Enforces Total Debits == Total Credits)' })
  async createJournalEntry(@Body() body: any, @Req() req: any) {
    return this.accountingService.createJournalEntry({
      ...body,
      organizationId: req.user.organizationId,
      createdById: req.user.userId,
    });
  }

  @Get('trial-balance')
  @RequirePermissions('accounting.read')
  @ApiOperation({ summary: 'Generate balanced Trial Balance report' })
  async getTrialBalance(@Req() req: any) {
    return this.accountingService.getTrialBalance(req.user.organizationId);
  }

  @Get('profit-and-loss')
  @RequirePermissions('accounting.read')
  @ApiOperation({ summary: 'Generate Profit and Loss Statement (Income Statement)' })
  async getProfitAndLoss(@Req() req: any) {
    return this.accountingService.getProfitAndLoss(req.user.organizationId);
  }

  @Get('balance-sheet')
  @RequirePermissions('accounting.read')
  @ApiOperation({ summary: 'Generate Balance Sheet (Assets = Liabilities + Equity)' })
  async getBalanceSheet(@Req() req: any) {
    return this.accountingService.getBalanceSheet(req.user.organizationId);
  }

  @Get('ar-aging')
  @RequirePermissions('accounting.read')
  @ApiOperation({ summary: 'Generate Accounts Receivable aging report by delinquency buckets' })
  async getArAging() {
    return this.accountingService.getArAging();
  }
}
