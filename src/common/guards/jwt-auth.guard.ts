import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { RequestUser } from '../interfaces/request-user.interface';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      cookies?: { accessToken?: string };
      user?: RequestUser;
    }>();
    const authHeader = request.headers.authorization;
    const tokenFromHeader = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : authHeader;
    const tokenFromCookie = request.cookies?.accessToken;
    const token = tokenFromHeader || tokenFromCookie;

    if (!token) {
      throw new UnauthorizedException('No token received');
    }

    const secret = this.configService.get<string>('JWT_ACCESS_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    const payload = jwt.verify(token, secret) as JwtPayload & RequestUser;

    if (payload.isDeleted) {
      throw new UnauthorizedException('User is deleted');
    }

    if (
      payload.isActive &&
      ['INACTIVE', 'BLOCKED'].includes(payload.isActive)
    ) {
      throw new UnauthorizedException(`User is ${payload.isActive}`);
    }

    request.user = payload;
    return true;
  }
}
