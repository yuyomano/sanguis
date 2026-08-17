import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TestLabType } from '@prisma/client';

export class CreateTestResultDto {
  @ApiProperty()
  @IsString()
  bloodUnitId: string;

  @ApiProperty({ enum: TestLabType })
  @IsEnum(TestLabType)
  labType: TestLabType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  externalLabId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  technicianId?: string;
}
