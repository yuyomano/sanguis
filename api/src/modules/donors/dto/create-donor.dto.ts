import { IsString, IsEmail, IsOptional, IsBoolean, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, IdType, MedicalExclusion } from '@prisma/client';

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

  @ApiPropertyOptional({ description: 'Fecha de nacimiento (AAAA-MM-DD)' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiPropertyOptional({ type: [String], description: 'Alergias reportadas por el donante' })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  allergies?: string[];

  @ApiPropertyOptional({ enum: MedicalExclusion, isArray: true })
  @IsArray()
  @IsEnum(MedicalExclusion, { each: true })
  @IsOptional()
  medicalExclusions?: MedicalExclusion[];
}
