import { IsString, IsEmail, IsOptional } from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class LoginDonorDto {
  @ApiPropertyOptional({ example: '001-1234567-8', description: 'Cédula o pasaporte (alternativa al correo)' })
  @IsString()
  @IsOptional()
  idNumber?: string;

  @ApiPropertyOptional({ example: 'juan@email.com', description: 'Correo electrónico (alternativa a la cédula)' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
