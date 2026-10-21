import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Sales Contracts')
@Controller('contracts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @RequirePermissions('contracts.manage')
  @ApiOperation({ summary: 'List customer sales contracts' })
  async findAll(@Query() query: any) {
    return this.contractsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('contracts.manage')
  @ApiOperation({ summary: 'Get full contract detail with payment plans and installment rows' })
  async findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post('from-booking/:bookingId')
  @RequirePermissions('contracts.manage')
  @ApiOperation({ summary: 'Generate sales contract from an approved reservation booking' })
  async createFromBooking(@Param('bookingId') bookingId: string, @Body('notes') notes: string) {
    return this.contractsService.createFromBooking(bookingId, notes);
  }
}
