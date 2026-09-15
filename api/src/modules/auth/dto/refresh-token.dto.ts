import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  // Opcional: el panel admin (web) no manda body, el refresh token le llega por
  // cookie httpOnly (ver auth.controller.ts). La app móvil sí lo manda aquí.
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  refreshToken?: string;
}
