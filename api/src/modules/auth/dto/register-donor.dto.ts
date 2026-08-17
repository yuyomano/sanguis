import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsObject, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, IdType } from '@prisma/client';

export class RegisterDonorDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  name: string;

  @ApiProperty({ enum: IdType })
  @IsEnum(IdType)
  idType: IdType;

  @ApiProperty({ example: '001-1234567-8' })
  @IsString()
  idNumber: string;

  @ApiProperty({ example: '+1-809-555-0000' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'juan@email.com' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ enum: BloodType })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiProperty({ example: true, description: 'true = RH+, false = RH-' })
  @IsBoolean()
  rhFactor: boolean;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ description: 'Horarios disponibles para donar' })
  @IsObject()
  @IsOptional()
  availableTimes?: object;

  @ApiPropertyOptional({ description: 'Código de referido de quien lo invitó' })
  @IsString()
  @IsOptional()
  referralCode?: string;
}
