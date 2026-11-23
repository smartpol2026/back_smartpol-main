import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export const NOVELTY_SEVERITIES = ['critica', 'alta', 'media', 'baja'] as const;

export class CreateTableNoveltyDto {
  @ApiProperty({
    enum: NOVELTY_SEVERITIES,
    example: 'alta',
  })
  @IsString()
  @IsIn(NOVELTY_SEVERITIES)
  severity: (typeof NOVELTY_SEVERITIES)[number];

  @ApiProperty({ example: 'Falta de jurados' })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({
    example: 'La mesa inició con un jurado menos del requerido',
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
