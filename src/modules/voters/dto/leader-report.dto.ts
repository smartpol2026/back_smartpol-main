import { IsOptional, IsNumber, IsString, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class LeaderReportFilterDto {
  @ApiProperty({ required: false, example: 'Juan' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  campaignId?: number;

  @ApiProperty({
    required: false,
    example: 1,
    description:
      'Filter by municipality master ID (matched against leaders.municipality string by name)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  municipalityId?: number;

  @ApiProperty({
    required: false,
    example: 1,
    description:
      'Filter by department ID (leaders whose municipality string matches a municipality in that department)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departmentId?: number;

  @ApiProperty({
    required: false,
    example: 'OVEJAS',
    description: 'Partial match against leaders.municipality string',
  })
  @IsOptional()
  @IsString()
  municipality?: string;

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

export class LeaderReportDto {
  id: number;
  name: string;
  municipality: string;
  inscritos: number;
  reportados: number;
  pendientes: number;
}
