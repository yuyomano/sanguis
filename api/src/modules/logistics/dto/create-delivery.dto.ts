import { IsString, IsEnum, IsArray, IsOptional, IsNumber, IsPositive } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CarrierType } from '@prisma/client';

export class CreateDeliveryDto {
  @ApiProperty()
  @IsString()
  destinationName: string;

  @ApiProperty()
  @IsString()
  destinationAddress: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  bloodUnitIds: string[];

  @ApiProperty({ enum: CarrierType })
  @IsEnum(CarrierType)
  carrierType: CarrierType;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  vehicleId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  thirdPartyCarrier?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  protocolId?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  baseCost?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsPositive()
  @IsOptional()
  lastMileCost?: number;
}
