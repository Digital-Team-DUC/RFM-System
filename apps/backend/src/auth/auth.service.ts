import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../common/prisma.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService
  ) {}

  async login(email: string, pass: string, ipAddress?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user || !user.isActive) {
      await this.prisma.loginEvent.create({
        data: {
          userId: user?.id || null,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Browser',
          isSuccess: false,
          failureReason: 'Invalid credentials or inactive account',
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!isMatch) {
      await this.prisma.loginEvent.create({
        data: {
          userId: user.id,
          ipAddress: ipAddress || '127.0.0.1',
          userAgent: userAgent || 'Browser',
          isSuccess: false,
          failureReason: 'Password mismatch',
        },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    // Record successful login
    await this.prisma.loginEvent.create({
      data: {
        userId: user.id,
        ipAddress: ipAddress || '127.0.0.1',
        userAgent: userAgent || 'Browser',
        isSuccess: true,
      },
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code)
        )
      )
    );

    const payload = {
      sub: user.id,
      email: user.email,
      orgId: user.organizationId,
      roles,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'rfm_enterprise_jwt_access_super_secret_key_2026_xyz!',
      expiresIn: '8h',
    });

    const refreshTokenRaw = this.jwtService.sign(
      { sub: user.id },
      {
        secret: process.env.JWT_REFRESH_SECRET || 'rfm_enterprise_jwt_refresh_super_secret_key_2026_xyz!',
        expiresIn: '7d',
      }
    );

    // Save refresh token
    const tokenHash = await bcrypt.hash(refreshTokenRaw, 8);
    const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        khmerName: user.khmerName,
        phone: user.phone,
        organization: {
          id: user.organization.id,
          name: user.organization.name,
          code: user.organization.code,
          currency: user.organization.currency,
        },
        roles,
        permissions,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        organization: true,
        userRoles: {
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
      },
    });

    if (!user) throw new UnauthorizedException('User not found');

    const roles = user.userRoles.map((ur) => ur.role.name);
    const permissions = Array.from(
      new Set(
        user.userRoles.flatMap((ur) =>
          ur.role.rolePermissions.map((rp) => rp.permission.code)
        )
      )
    );

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      khmerName: user.khmerName,
      phone: user.phone,
      organization: {
        id: user.organization.id,
        name: user.organization.name,
        code: user.organization.code,
        currency: user.organization.currency,
      },
      roles,
      permissions,
    };
  }
}
