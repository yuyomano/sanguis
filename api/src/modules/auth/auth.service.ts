import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import dayjs from 'dayjs';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { LoginAdminDto } from './dto/login-admin.dto';
import { RegisterDonorDto } from './dto/register-donor.dto';
import { LoginDonorDto } from './dto/login-donor.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private encryption: EncryptionService,
  ) {}

  // ── Admin ──────────────────────────────────────────────────────────────────

  async loginAdmin(dto: LoginAdminDto) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: dto.email } });
    if (!admin || !admin.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, admin.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.#signTokens({ sub: admin.id, email: admin.email, role: admin.role, type: 'admin' });
  }

  // ── Donor ──────────────────────────────────────────────────────────────────

  async registerDonor(dto: RegisterDonorDto) {
    if (!dto.idNumber && !dto.email) {
      throw new ConflictException('Proporciona al menos una cédula/pasaporte o un correo electrónico');
    }

    // ponytail: elegibilidad médica real (peso, signos vitales, etc.) la valida el
    // personal clínico presencialmente; esto solo bloquea el auto-registro de menores/mayores
    // fuera del rango de edad legal para donar sangre en RD.
    const age = dayjs().diff(dayjs(dto.birthDate), 'year');
    if (age < 18 || age > 65) {
      throw new BadRequestException('Debes tener entre 18 y 65 años para registrarte como donante');
    }

    if (dto.idNumber) {
      const byId = await this.prisma.donor.findUnique({ where: { idNumberHash: this.encryption.hash(dto.idNumber) } });
      if (byId) throw new ConflictException('Ya existe un donante con ese número de identificación');
    }
    if (dto.email) {
      const byEmail = await this.prisma.donor.findUnique({ where: { emailHash: this.encryption.hash(dto.email) } });
      if (byEmail) throw new ConflictException('Ya existe un donante con ese correo electrónico');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const donor = await this.prisma.donor.create({
      data: {
        name: dto.name,
        idType: dto.idType ?? null,
        idNumber: dto.idNumber ? this.encryption.encrypt(dto.idNumber) : null,
        idNumberHash: dto.idNumber ? this.encryption.hash(dto.idNumber) : null,
        phone: this.encryption.encrypt(dto.phone),
        phoneHash: this.encryption.hash(dto.phone),
        email: dto.email ? this.encryption.encrypt(dto.email) : null,
        emailHash: dto.email ? this.encryption.hash(dto.email) : null,
        bloodType: dto.bloodType,
        rhFactor: dto.rhFactor,
        passwordHash,
        birthDate: new Date(dto.birthDate),
        termsAcceptedAt: new Date(),
        city: dto.city ?? null,
        address: dto.address ? this.encryption.encrypt(dto.address) : null,
        latitude: dto.latitude != null ? this.encryption.encrypt(String(dto.latitude)) : null,
        longitude: dto.longitude != null ? this.encryption.encrypt(String(dto.longitude)) : null,
        availableTimes: dto.availableTimes,
        referredById: dto.referralCode
          ? (await this.prisma.donor.findFirst({ where: { referralCode: dto.referralCode } }))?.id
          : undefined,
      },
    });

    return this.#signTokens({ sub: donor.id, phone: dto.phone, type: 'donor' });
  }

  async loginDonor(dto: LoginDonorDto) {
    if (!dto.idNumber && !dto.email) {
      throw new UnauthorizedException('Proporciona tu cédula o correo electrónico');
    }

    const donor = dto.email
      ? await this.prisma.donor.findUnique({ where: { emailHash: this.encryption.hash(dto.email) } })
      : await this.prisma.donor.findUnique({ where: { idNumberHash: this.encryption.hash(dto.idNumber!) } });

    if (!donor || !donor.isActive) throw new UnauthorizedException('Credenciales inválidas');

    const valid = await bcrypt.compare(dto.password, donor.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales inválidas');

    return this.#signTokens({ sub: donor.id, phone: this.encryption.decrypt(donor.phone), type: 'donor' });
  }

  // ── Token rotation ─────────────────────────────────────────────────────────

  async refreshToken(refreshTokenStr: string | undefined) {
    let payload: any;
    try {
      if (!refreshTokenStr) throw new Error('missing');
      payload = this.jwt.verify(refreshTokenStr, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido');
    }

    if (!payload?.jti) throw new UnauthorizedException('Refresh token inválido');

    const stored = await this.prisma.refreshToken.findUnique({ where: { jti: payload.jti } });
    if (!stored || stored.expiresAt < new Date()) {
      // Clean up expired entry if present
      if (stored) await this.prisma.refreshToken.delete({ where: { jti: payload.jti } });
      throw new UnauthorizedException('Refresh token expirado o revocado');
    }

    // Rotate: invalidate old token immediately before issuing new one
    await this.prisma.refreshToken.delete({ where: { jti: payload.jti } });

    const { jti: _jti, exp: _exp, iat: _iat, ...cleanPayload } = payload;
    return this.#signTokens(cleanPayload);
  }

  async logout(refreshTokenStr: string | undefined): Promise<void> {
    try {
      if (!refreshTokenStr) return;
      const payload = this.jwt.verify(refreshTokenStr, {
        secret: this.config.get('JWT_REFRESH_SECRET'),
      });
      if (payload?.jti) {
        await this.prisma.refreshToken.deleteMany({ where: { jti: payload.jti } });
      }
    } catch {
      // Invalid token on logout — treat as already logged out, no error
    }
  }

  // ── Token cleanup (expired tokens) ─────────────────────────────────────────

  async cleanExpiredRefreshTokens(): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: new Date() } },
    });
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  async #signTokens(payload: Record<string, unknown>) {
    const jti = randomUUID();
    const refreshExpiresIn = this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '30d');

    const accessToken = this.jwt.sign({ ...payload, jti });
    const refreshToken = this.jwt.sign({ ...payload, jti }, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      // ponytail: @nestjs/jwt v12 tipa expiresIn como StringValue (branded), no string plano
      expiresIn: refreshExpiresIn as any,
    });

    // Store refresh token record (enables rotation and revocation)
    const days = parseInt(refreshExpiresIn.replace(/\D/g, ''), 10) || 30;
    const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);

    await this.prisma.refreshToken.create({
      data: {
        jti,
        userId: String(payload.sub),
        userType: String(payload.type),
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
