import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PartyReportFilterDto {
  @ApiProperty({
    required: false,
    example: 'Partido Liberal',
    description: 'Filter by political party (partial, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  party?: string;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'Filter by corporation ID (e.g. Cámara, Senado)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  corporationId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  campaignId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiProperty({ required: false, example: 20, minimum: 1, maximum: 500 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(500)
  limit?: number;
}

export class PartyReportDto {
  party: string;
  inscritos: number;
  reportados: number;
  pendientes: number;
}
