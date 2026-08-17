import { IsObject, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitResultsDto {
  @ApiProperty({
    description: 'Resultados del test. Ej: { HBsAg: "negative", HIV: "negative", HCV: "negative", Syphilis: "negative", Hemoglobin: 14.2 }',
    example: {
      HBsAg: 'negative',
      'HIV-1/2': 'negative',
      HCV: 'negative',
      'HTLV-I/II': 'negative',
      Syphilis: 'negative',
      Chagas: 'negative',
      Hemoglobin: 14.2,
      Hematocrit: 42,
    },
  })
  @IsObject()
  results: Record<string, any>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  technicianId?: string;
}
