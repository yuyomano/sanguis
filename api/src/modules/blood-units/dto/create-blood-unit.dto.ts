import { IsString, IsEnum, IsBoolean, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BloodType, ProductType } from '@prisma/client';

export class CreateBloodUnitDto {
  @ApiProperty()
  @IsString()
  bagNumber: string;

  @ApiProperty()
  @IsString()
  donorId: string;

  @ApiProperty({ enum: BloodType })
  @IsEnum(BloodType)
  bloodType: BloodType;

  @ApiProperty({ example: true })
  @IsBoolean()
  rhFactor: boolean;

  @ApiProperty({ enum: ProductType })
  @IsEnum(ProductType)
  productType: ProductType;

  @ApiProperty({ example: 450 })
  @IsInt()
  @Min(100)
  volumeMl: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  collectionDate?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageLocationId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  storageShelf?: string;
}
