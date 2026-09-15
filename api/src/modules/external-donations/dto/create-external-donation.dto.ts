import { IsString, IsEnum, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InstitutionType, ProductType } from '@prisma/client';

// Auto-reporte del donante: una donación hecha fuera de Sanguis, pendiente de
// verificación por un admin antes de contar para puntos/categoría.
export class CreateExternalDonationDto {
  @ApiProperty()
  @IsDateString()
  donationDate: string;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty({ enum: InstitutionType })
  @IsEnum(InstitutionType)
  sourceType: InstitutionType;

  @ApiProperty({ description: 'Nombre del hospital/banco/evento donde donó' })
  @IsString()
  sourceName: string;

  @ApiPropertyOptional({ description: 'URL de la foto del carnet/certificado de donación' })
  @IsString()
  @IsOptional()
  proofUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
