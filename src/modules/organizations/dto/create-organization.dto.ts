import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Nombre de la organización',
    example: 'Mi Organización',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descripción de la organización',
    example: 'Descripción de la organización',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}