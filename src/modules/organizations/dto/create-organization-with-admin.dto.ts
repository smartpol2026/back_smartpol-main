import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsEmail, MinLength, IsNumber } from 'class-validator';

export class CreateOrganizationWithAdminDto {
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

  @ApiProperty({
    description: 'Email del administrador',
    example: 'admin@miorganizacion.com',
  })
  @IsEmail()
  @IsNotEmpty()
  adminEmail: string;

  @ApiProperty({
    description: 'Contraseña del administrador (mínimo 6 caracteres)',
    example: 'securepassword123',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  adminPassword: string;

  @ApiProperty({
    description: 'ID del rol de administrador',
    example: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  adminRoleId: number;
}