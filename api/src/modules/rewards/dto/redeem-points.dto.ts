import { IsString, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemPointsDto {
  @ApiProperty()
  @IsString()
  partnerId: string;

  @ApiProperty({ example: 500 })
  @IsInt()
  @Min(1)
  points: number;
}
