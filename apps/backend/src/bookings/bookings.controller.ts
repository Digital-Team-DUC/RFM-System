import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Bookings & Reservations')
@Controller('bookings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get()
  @RequirePermissions('sales.create')
  @ApiOperation({ summary: 'List customer bookings and reservations' })
  async findAll(@Query() query: any) {
    return this.bookingsService.findAll(query);
  }

  @Get(':id')
  @RequirePermissions('sales.create')
  @ApiOperation({ summary: 'Get booking detail by ID' })
  async findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Post()
  @RequirePermissions('sales.create')
  @ApiOperation({ summary: 'Reserve an available property unit' })
  async create(@Body() body: any, @Req() req: any) {
    return this.bookingsService.create({
      ...body,
      agentId: req.user.userId,
    });
  }

  @Patch(':id/approve')
  @RequirePermissions('bookings.approve')
  @ApiOperation({ summary: 'Approve property reservation' })
  async approve(@Param('id') id: string, @Req() req: any) {
    return this.bookingsService.approve(id, req.user.userId);
  }

  @Patch(':id/cancel')
  @RequirePermissions('bookings.cancel')
  @ApiOperation({ summary: 'Cancel reservation and release property back to inventory' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @Req() req: any
  ) {
    return this.bookingsService.cancel(id, reason || 'Cancelled by manager', req.user.userId);
  }

  @Post(':id/deposits')
  @RequirePermissions('payments.receive')
  @ApiOperation({ summary: 'Record deposit for a booking' })
  async addDeposit(@Param('id') id: string, @Body() body: any, @Req() req: any) {
    return this.bookingsService.addDeposit(id, body, req.user.userId);
  }
}
