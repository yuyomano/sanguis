import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { LoginDonorDto } from './dto/login-donor.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

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
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto);
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
  @ApiOperation({ summary: 'Rotar access token usando refresh token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @SkipThrottle()
  @ApiOperation({ summary: 'Revocar refresh token (cierre de sesión)' })
  async logout(@Body() dto: RefreshTokenDto) {
    await this.authService.logout(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/status')
  @SkipThrottle()
  @ApiOperation({ summary: 'Estado de integraciones del sistema (admin)' })
  getSystemStatus() {
    return {
      whatsapp: !!(process.env.META_WHATSAPP_TOKEN && process.env.META_PHONE_NUMBER_ID),
      sendgrid: !!process.env.SENDGRID_API_KEY,
      firebase: !!process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
      database: true,
      environment: process.env.NODE_ENV || 'development',
    };
  }
}
