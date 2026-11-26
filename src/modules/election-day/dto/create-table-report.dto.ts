import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
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
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return undefined;
    }
    return Number(value);
  })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100)
  estimatedParticipation?: number;

  @ApiPropertyOptional({ example: 'Sin novedades relevantes' })
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsString()
  @MaxLength(2000)
  observations?: string;
}
