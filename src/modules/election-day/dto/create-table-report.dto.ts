import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export const TABLE_REPORT_STATUSES = [
  'apertura',
  'en_operacion',
  'cierre',
  'operativo',
  'sin_novedad',
] as const;

export class CreateTableReportDto {
  @ApiProperty({
    enum: TABLE_REPORT_STATUSES,
    example: 'en_operacion',
  })
  @IsString()
  @IsIn(TABLE_REPORT_STATUSES)
  status: (typeof TABLE_REPORT_STATUSES)[number];

  @ApiPropertyOptional({ example: 68.5 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  estimatedParticipation?: number;

  @ApiPropertyOptional({ example: 'Sin novedades relevantes' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observations?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/evidencia.jpg' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  evidenceUrl?: string;
}
