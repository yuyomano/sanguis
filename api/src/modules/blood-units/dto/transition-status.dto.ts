import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodUnitStatus } from '@prisma/client';

export class TransitionStatusDto {
  @ApiProperty({ enum: BloodUnitStatus })
  @IsEnum(BloodUnitStatus)
  status: BloodUnitStatus;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
