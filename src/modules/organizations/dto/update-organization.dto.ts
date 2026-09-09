import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateOrganizationDto {
  @ApiProperty({
    description: 'Nombre de la organización',
    example: 'Mi Organización Actualizada',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descripción de la organización',
    example: 'Descripción actualizada',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}