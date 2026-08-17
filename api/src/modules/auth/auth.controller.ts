import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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

  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de administrador (web panel)' })
  loginAdmin(@Body() dto: LoginAdminDto) {
    return this.authService.loginAdmin(dto);
  }

  @Post('donor/register')
  @ApiOperation({ summary: 'Registro de nuevo donante (app móvil)' })
  registerDonor(@Body() dto: RegisterDonorDto) {
    return this.authService.registerDonor(dto);
  }

  @Post('donor/login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login de donante (app móvil)' })
  loginDonor(@Body() dto: LoginDonorDto) {
    return this.authService.loginDonor(dto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Renovar access token' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto.refreshToken);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('admin/status')
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
