import { Controller, Post, Get, Body, Req, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { LoginDonorDto } from './dto/login-donor.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

// El panel admin (web) no puede guardar el refresh token en localStorage (robable
// por XSS) — viaja en cookie httpOnly y nunca toca el JS de la página. El donante
// (app móvil) no tiene cookies de navegador: sigue recibiendo ambos tokens en el
// body, como siempre, y los guarda en expo-secure-store.
const REFRESH_COOKIE = 'sanguis_refresh';
const REFRESH_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/auth',
};

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Auth endpoints use the 'auth' throttler: max 10 attempts per 5 minutes.
  // Global throttler (100/min) is also active; the auth limit is more restrictive.

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 300_000 } })
  @ApiOperation({ summary: 'Login de administrador (web panel)' })
  async loginAdmin(@Body() dto: LoginAdminDto, @Res({ passthrough: true }) res: Response) {
    const { accessToken, refreshToken } = await this.authService.loginAdmin(dto);
    res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
    return { accessToken };
  }

  @Post('donor/register')
  @Throttle({ auth: { limit: 10, ttl: 300_000 } })
  @ApiOperation({ summary: 'Registro de nuevo donante (app móvil)' })
  registerDonor(@Body() dto: RegisterDonorDto) {
    return this.authService.registerDonor(dto);
  }

  @Post('donor/login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 300_000 } })
  @ApiOperation({ summary: 'Login de donante (app móvil)' })
  loginDonor(@Body() dto: LoginDonorDto) {
    return this.authService.loginDonor(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ auth: { limit: 10, ttl: 300_000 } })
  @ApiOperation({ summary: 'Rotar access token usando refresh token (cookie para admin, body para app móvil)' })
  async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: RefreshTokenDto) {
    const fromCookie = req.cookies?.[REFRESH_COOKIE];
    const { accessToken, refreshToken } = await this.authService.refreshToken(fromCookie ?? dto.refreshToken);
    if (fromCookie) {
      res.cookie(REFRESH_COOKIE, refreshToken, REFRESH_COOKIE_OPTS);
      return { accessToken };
    }
    return { accessToken, refreshToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  @ApiOperation({ summary: 'Revocar refresh token (cierre de sesión)' })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response, @Body() dto: RefreshTokenDto) {
    const fromCookie = req.cookies?.[REFRESH_COOKIE];
    await this.authService.logout(fromCookie ?? dto.refreshToken);
    if (fromCookie) res.clearCookie(REFRESH_COOKIE, REFRESH_COOKIE_OPTS);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/status')
  @SkipThrottle()
  @ApiOperation({ summary: 'Estado de integraciones del sistema (admin)' })
  getSystemStatus() {
    return {
      whatsapp: !!(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
      sendgrid: !!process.env.SENDGRID_API_KEY,
      firebase: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      database: true,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
