import { Controller, Get, Post, Patch, Param, Body, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/permissions.guard';
import { RequirePermissions } from '../auth/permissions.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('User & Role Management')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'List system users with assigned roles' })
  async findAll(@Req() req: any) {
    return this.usersService.findAll(req.user.organizationId);
  }

  @Get('roles')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'List roles and permission matrices' })
  async getRoles(@Req() req: any) {
    return this.usersService.getRoles(req.user.organizationId);
  }

  @Post()
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Create or invite new staff user' })
  async createUser(@Body() body: any, @Req() req: any) {
    return this.usersService.createUser({
      ...body,
      organizationId: req.user.organizationId,
    });
  }

  @Patch(':id/toggle-active')
  @RequirePermissions('users.manage')
  @ApiOperation({ summary: 'Activate or deactivate a user account' })
  async toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }
}
