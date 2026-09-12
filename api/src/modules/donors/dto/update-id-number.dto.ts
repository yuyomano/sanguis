import { IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IdType } from '@prisma/client';

export class UpdateIdNumberDto {
  @ApiProperty({ enum: IdType })
  @IsEnum(IdType)
  idType: IdType;

  @ApiProperty({ description: 'Cédula, DNI o pasaporte' })
  @IsString()
  idNumber: string;
}
