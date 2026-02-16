import { Body, Controller, Get, Post, Req, Res } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  private getCookieOptions() {
    const isProd = process.env.NODE_ENV === 'production';
    return {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax' as const,
    };
  }

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const response = await this.authService.login(body);
    const cookieOptions = this.getCookieOptions();

    res.cookie('accessToken', response.data.accessToken, {
      ...cookieOptions,
      path: '/',
    });
    res.cookie('refreshToken', response.data.refreshToken, {
      ...cookieOptions,
      path: '/api/auth/refresh',
    });

    return response;
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate refresh token and issue a new token pair' })
  @ApiResponse({ status: 200, description: 'Tokens refreshed successfully' })
  async refresh(
    @Body() body: RefreshTokenDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokenFromCookie = req.cookies?.refreshToken as string | undefined;
    const refreshToken = body.refresh_token ?? tokenFromCookie;
    const response = await this.authService.refresh(refreshToken);
    const cookieOptions = this.getCookieOptions();

    res.cookie('accessToken', response.data.accessToken, {
      ...cookieOptions,
      path: '/',
    });
    res.cookie('refreshToken', response.data.refreshToken, {
      ...cookieOptions,
      path: '/api/auth/refresh',
    });

    return response;
  }

  @Get('me')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Get authenticated user profile' })
  @ApiResponse({ status: 200, description: 'Profile fetched' })
  me(@CurrentUser() user: { userId: number }) {
    return this.authService.me(user.userId);
  }

  @Post('logout')
  @ApiBearerAuth('bearer')
  @ApiOperation({ summary: 'Logout current user and clear auth cookies' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  logout(@Res({ passthrough: true }) res: Response) {
    const cookieOptions = this.getCookieOptions();
    res.clearCookie('accessToken', { ...cookieOptions, path: '/' });
    res.clearCookie('refreshToken', {
      ...cookieOptions,
      path: '/api/auth/refresh',
    });
    return this.authService.logout();
  }
}
