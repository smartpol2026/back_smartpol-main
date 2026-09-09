import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsNumber, IsArray } from 'class-validator';

export class UpdateCampaignDto {
  @ApiProperty({
    description: 'Nombre de la campaña',
    example: 'Campaña 2024 Actualizada',
    required: false,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descripción de la campaña',
    example: 'Descripción actualizada',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Fecha de inicio de la campaña',
    example: '2024-01-15',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({
    description: 'Fecha de finalización de la campaña',
    example: '2024-12-31',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    description: 'Estado de la campaña',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  status?: boolean;

  @ApiProperty({
    description: 'ID de la organización',
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