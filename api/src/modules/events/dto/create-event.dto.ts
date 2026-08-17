import { IsString, IsEnum, IsInt, IsOptional, IsDateString, IsNumber, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventType } from '@prisma/client';

export class CreateEventDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ enum: EventType })
  @IsEnum(EventType)
  type: EventType;

  @ApiProperty()
  @IsString()
  locationAddress: string;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  latitude?: number;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  longitude?: number;

  @ApiProperty()
  @IsDateString()
  startDatetime: string;

  @ApiProperty()
  @IsDateString()
  endDatetime: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  capacity: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  description?: string;
}
