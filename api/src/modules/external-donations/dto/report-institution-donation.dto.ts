import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

// Reporte hecho por el usuario de una institución (hospital/banco externo) sobre
// un donante suyo. Se marca VERIFICADA de inmediato: viene de un tercero confiable.
// El donante debe existir ya en Sanguis (buscado por cédula/pasaporte).
export class ReportInstitutionDonationDto {
  @ApiProperty({ description: 'Cédula o pasaporte del donante, ya registrado en Sanguis' })
  @IsString()
  donorIdNumber: string;

  @ApiProperty()
  @IsDateString()
  donationDate: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
