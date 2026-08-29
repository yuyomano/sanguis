import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { LoginDonorDto } from './dto/login-donor.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}

  async loginAdmin(dto: LoginAdminDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin || !admin.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.signTokens({ sub: admin.id, email: admin.email, role: admin.role, type: 'admin' });
  }

  async registerDonor(dto: RegisterDonorDto) {
    if (!dto.idNumber && !dto.email) {
      throw new ConflictException('Proporciona al menos una cédula/pasaporte o un correo electrónico');
    }

    if (dto.idNumber) {
      const byId = await this.prisma.donor.findUnique({ where: { idNumber: dto.idNumber } });
      if (byId) throw new ConflictException('Ya existe un donante con ese número de identificación');
    }
    if (dto.email) {
      const byEmail = await this.prisma.donor.findUnique({ where: { email: dto.email } });
      if (byEmail) throw new ConflictException('Ya existe un donante con ese correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const donor = await this.prisma.donor.create({
      data: {
        name: dto.name,
        idType: dto.idType ?? null,
        idNumber: dto.idNumber ?? null,
        phone: dto.phone,
        email: dto.email,
        bloodType: dto.bloodType,
        rhFactor: dto.rhFactor,
        passwordHash,
        availableTimes: dto.availableTimes,
        referredById: dto.referralCode
          ? (await this.prisma.donor.findFirst({ where: { referralCode: dto.referralCode } }))?.id
          : undefined,
      },
    });

    return this.signTokens({ sub: donor.id, phone: donor.phone, type: 'donor' });
  }

  async loginDonor(dto: LoginDonorDto) {
    if (!dto.idNumber && !dto.email) {
      throw new UnauthorizedException('Proporciona tu cédula o correo electrónico');
    }

    const donor = dto.email
      ? await this.prisma.donor.findUnique({ where: { email: dto.email } })
      : await this.prisma.donor.findUnique({ where: { idNumber: dto.idNumber } });

    if (!donor || !donor.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, donor.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.signTokens({ sub: donor.id, phone: donor.phone, type: 'donor' });
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwt.verify(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      return this.signTokens(payload);
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }
  }

  private signTokens(payload: Record<string, any>) {
    const accessToken = this.jwt.sign(payload);
    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN', '30d'),
    });
    return { accessToken, refreshToken };
  }
}
