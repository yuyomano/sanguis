import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, IdType } from '@prisma/client';

export class CreateDonorDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: IdType })
  @IsEnum(IdType)
  idType: IdType;

  @ApiProperty()
  @IsString()
  idNumber: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty({ enum: BloodType })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiProperty()
  @IsBoolean()
  rhFactor: boolean;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  password?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  referredById?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  photoUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  adminNotes?: string;
}
