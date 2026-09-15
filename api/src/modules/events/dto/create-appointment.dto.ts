import { IsString, IsDateString, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ProductType } from '@prisma/client';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  eventId: string;

  @ApiProperty()
  @IsDateString()
  scheduledTime: string;

  @ApiProperty({ enum: ProductType, required: false, default: ProductType.WHOLE_BLOOD })
  @IsOptional()
  @IsEnum(ProductType)
  productType?: ProductType;
}
