import { IsArray, ArrayNotEmpty, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '@prisma/client';

export class NotifyCandidatesDto {
  @ApiProperty({ type: [String], description: 'IDs de los donantes candidatos a notificar' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  donorIds: string[];

  @ApiProperty({ enum: NotificationType, isArray: true })
  @IsArray()
  @ArrayNotEmpty()
  @IsEnum(NotificationType, { each: true })
  channels: NotificationType[];
}
