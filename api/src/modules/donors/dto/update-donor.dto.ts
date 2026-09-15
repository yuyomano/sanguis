import { IsString, IsEmail, IsOptional, IsObject, IsBoolean, IsNumber, IsEnum, IsDateString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IdType, MedicalExclusion } from '@prisma/client';

export class UpdateDonorDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ enum: IdType, description: 'Requerido junto con idNumber' })
  @IsEnum(IdType)
  @IsOptional()
  idType?: IdType;

  @ApiPropertyOptional({ description: 'Cédula/DNI/pasaporte. Requerido junto con idType' })
  @IsString()
  @IsOptional()
  idNumber?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional()
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

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  availableTimes?: object;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fcmToken?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  adminNotes?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Autoriza a instituciones externas (hospitales/otros bancos) a consultar su elegibilidad/historial' })
  @IsBoolean()
  @IsOptional()
  shareHistoryWithInstitutions?: boolean;

  @ApiPropertyOptional({ description: 'Recibir notificaciones no críticas (broadcast de eventos). Las alertas de emergencia siempre se envían.' })
  @IsBoolean()
  @IsOptional()
  notificationsEnabled?: boolean;

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
