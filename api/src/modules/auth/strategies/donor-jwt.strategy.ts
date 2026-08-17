import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../common/prisma/prisma.service';

@Injectable()
export class DonorJwtStrategy extends PassportStrategy(Strategy, 'donor-jwt') {
  constructor(config: ConfigService, private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    if (payload.type !== 'donor') throw new UnauthorizedException();
    const donor = await this.prisma.donor.findUnique({ where: { id: payload.sub } });
    if (!donor || !donor.isActive) throw new UnauthorizedException();
    return donor;
  }
}
