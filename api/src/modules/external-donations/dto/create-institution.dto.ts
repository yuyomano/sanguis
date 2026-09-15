import { IsString, IsEnum, IsEmail, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionType } from '@prisma/client';

export class CreateInstitutionDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: InstitutionType })
  @IsEnum(InstitutionType)
  type: InstitutionType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;
}
