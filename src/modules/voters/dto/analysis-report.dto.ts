import { IsOptional, IsNumber, Min, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

export class AnalysisReportFilterDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  departmentId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  municipalityId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  votingBoothId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  votingTableId?: number;
}

export class AnalysisReportRowDto {
  departamento: string;
  municipio: string;
  puestoVotacion: string;
  totalPuesto: number;
  mesa: number | string;
  totalRegistrado: number;
  totalVotado: number;
}
