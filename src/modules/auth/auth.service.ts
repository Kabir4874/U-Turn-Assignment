import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async register(payload: RegisterDto) {
    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: payload.email }, { phone: payload.phone }],
      },
    });

    if (existing) {
      throw new ConflictException(
        'User with this email or phone already exists',
      );
    }

    const saltRounds =
      this.configService.get<number>('BCRYPT_SALT_ROUND') ?? 10;
    const password = await bcrypt.hash(payload.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        password,
        role: UserRole.USER,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return {
      message: 'Registration successful',
      data: user,
    };
  }

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const validPassword = await bcrypt.compare(payload.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = this.generateTokenPair({
      userId: user.id,
      role: user.role,
    });

    return {
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
    };
  }

  async me(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User does not exist');
    }

    return {
      message: 'Profile fetched',
      data: user,
    };
  }

  async refresh(refreshToken?: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required');
    }

    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    if (!refreshSecret) {
      throw new UnauthorizedException('JWT refresh secret not configured');
    }

    let payload: { userId: number; role: UserRole };
    try {
      payload = jwt.verify(refreshToken, refreshSecret) as {
        userId: number;
        role: UserRole;
      };
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = this.generateTokenPair({ userId: user.id, role: user.role });

    return {
      message: 'Tokens refreshed successfully',
      data: tokens,
    };
  }

  logout() {
    return {
      message: 'Logout successful',
      data: null,
    };
  }

  private generateTokenPair(payload: { userId: number; role: UserRole }) {
    const accessSecret = this.configService.get<string>('JWT_ACCESS_SECRET');
    const accessExpiresIn =
      this.configService.get<string>('JWT_ACCESS_EXPIRES');
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET');
    const refreshExpiresIn = this.configService.get<string>(
      'JWT_REFRESH_EXPIRES',
    );

    if (
      !accessSecret ||
      !accessExpiresIn ||
      !refreshSecret ||
      !refreshExpiresIn
    ) {
      throw new UnauthorizedException('JWT configuration missing');
    }

    const accessToken = jwt.sign(payload, accessSecret, {
      expiresIn: accessExpiresIn,
    } as jwt.SignOptions);

    const refreshToken = jwt.sign(payload, refreshSecret, {
      expiresIn: refreshExpiresIn,
    } as jwt.SignOptions);

    return { accessToken, refreshToken };
  }
}
