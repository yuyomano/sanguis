import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EmergencyRequestStatus } from '@prisma/client';

export class UpdateEmergencyRequestStatusDto {
  @ApiProperty({ enum: EmergencyRequestStatus })
  @IsEnum(EmergencyRequestStatus)
  status: EmergencyRequestStatus;
}
