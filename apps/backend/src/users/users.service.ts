import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        khmerName: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        userRoles: {
          include: {
            role: {
              select: { id: true, name: true, description: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getRoles(organizationId?: string) {
    const where: any = {};
    if (organizationId) where.organizationId = organizationId;

    return this.prisma.role.findMany({
      where,
      include: {
        rolePermissions: {
          include: { permission: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createUser(data: {
    email: string;
    fullName: string;
    khmerName?: string;
    phone?: string;
    password?: string;
    roleId: string;
    organizationId: string;
  }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new BadRequestException('A user with this email already exists');
    }

    const passwordHash = await bcrypt.hash(data.password || 'Welcome123!', 10);

    return this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          organizationId: data.organizationId,
          email: data.email,
          fullName: data.fullName,
          khmerName: data.khmerName,
          phone: data.phone,
          passwordHash,
          isActive: true,
        },
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: data.roleId,
        },
      });

      return user;
    });
  }

  async toggleActive(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isActive: !user.isActive },
    });
  }
}
