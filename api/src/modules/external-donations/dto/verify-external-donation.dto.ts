import { IsBoolean, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VerifyExternalDonationDto {
  @ApiProperty({ description: 'true = aprobar (VERIFIED), false = rechazar (REJECTED)' })
  @IsBoolean()
  approve: boolean;

  @ApiPropertyOptional({ description: 'Motivo, sobre todo útil si se rechaza' })
  @IsString()
  @IsOptional()
  notes?: string;
}
