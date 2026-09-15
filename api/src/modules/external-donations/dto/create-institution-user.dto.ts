import { IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

// Crea el login de una institución (rol INSTITUTION) atado a un PartnerInstitution.
export class CreateInstitutionUserDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;

  @ApiProperty()
  @IsString()
  name: string;
}
