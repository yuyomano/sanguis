import { IsString, IsEmail, IsOptional, IsEnum, IsBoolean, IsObject, IsNumber, IsDateString, Equals, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, IdType } from '@prisma/client';

export class RegisterDonorDto {
  @ApiProperty({ example: 'Juan Pérez' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ enum: IdType, description: 'Requerido si se proporciona idNumber' })
  @IsEnum(IdType)
  @IsOptional()
  idType?: IdType;

  @ApiPropertyOptional({ example: '001-1234567-8', description: 'Cédula o pasaporte — opcional si se proporciona email' })
  @IsString()
  @IsOptional()
  idNumber?: string;

  @ApiProperty({ example: '+1-809-555-0000' })
  @IsString()
  phone: string;

  @ApiPropertyOptional({ example: 'juan@email.com', description: 'Correo — opcional si se proporciona idNumber' })
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

  @ApiProperty({ example: '1998-05-14', description: 'Fecha de nacimiento (ISO 8601). La elegibilidad médica real (18-65) la confirma el personal clínico al donar; esto solo bloquea el auto-registro de menores.' })
  @IsDateString()
  birthDate: string;

  @ApiProperty({ example: true, description: 'Debe ser true: confirma que el donante aceptó los Términos de Servicio y la Política de Privacidad' })
  @IsBoolean()
  @Equals(true, { message: 'Debes aceptar los Términos de Servicio y la Política de Privacidad' })
  termsAccepted: boolean;

  @ApiPropertyOptional({ description: 'Horarios disponibles para donar' })
  @IsObject()
  @IsOptional()
  availableTimes?: object;

  @ApiPropertyOptional({ description: 'Código de referido de quien lo invitó' })
  @IsString()
  @IsOptional()
  referralCode?: string;

  @ApiPropertyOptional({ example: 'Santiago' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;
}
