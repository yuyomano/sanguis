import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDonorDto {
  @ApiProperty({ example: '001-1234567-8' })
  @IsString()
  idNumber: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
