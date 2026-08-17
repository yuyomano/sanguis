import { IsEnum, IsNumber, IsPositive, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FinancialCategory, FinancialRecordType } from '@prisma/client';

export class CreateFinancialRecordDto {
  @ApiProperty({ enum: FinancialRecordType })
  @IsEnum(FinancialRecordType)
  type: FinancialRecordType;

  @ApiProperty({ enum: FinancialCategory })
  @IsEnum(FinancialCategory)
  category: FinancialCategory;

  @ApiProperty({ example: 2500.0 })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ example: 'DOP', default: 'DOP' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty()
  @IsDateString()
  date: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  bloodUnitId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  deliveryId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  notes?: string;
}
