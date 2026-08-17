import { IsString, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty()
  @IsString()
  donorId: string;

  @ApiProperty()
  @IsString()
  eventId: string;

  @ApiProperty()
  @IsDateString()
  scheduledTime: string;
}
