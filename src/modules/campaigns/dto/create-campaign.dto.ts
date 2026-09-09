import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, IsDateString, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Nombre de la campaña',
    example: 'Campaña 2024',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descripción de la campaña',
    example: 'Descripción de la campaña',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Fecha de inicio de la campaña',
    example: '2024-01-15',
  })
  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    description: 'Fecha de finalización de la campaña',
    example: '2024-12-31',
  })
  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @ApiProperty({
    description: 'Estado de la campaña (activa o inactiva)',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({
    description: 'ID de la organización a la que pertenece. Para admins de organización, se asigna automáticamente (opcional).',
    example: 1,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  organizationId?: number;

  @ApiProperty({
    description: 'IDs de usuarios asignados a la campaña',
    example: [1, 2, 3],
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  userIds?: number[];
}