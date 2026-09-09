import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VoterReportFilterDto {
  @ApiProperty({ required: false, example: 'M' })
  @IsOptional()
  @IsString()
  gender?: string;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  leaderId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  candidateId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  corporationId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  departmentId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  municipalityId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  votingBoothId?: number;

  @ApiProperty({ required: false, example: 'Mesa 1' })
  @IsOptional()
  @IsString()
  votingTableId?: string;

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

export class VotingBoothDto {
  id: number;
  name: string;
  code: string;
}

export class VotingTableDto {
  id: number;
  tableNumber: number;
}

export class VoterReportDto {
  id: number;
  firstName: string;
  lastName: string;
  identification: string;
  gender: string;
  phone: string;
  email: string;
  departmentId: number;
  department?: {
    id: number;
    name: string;
  };
  municipalityId: number;
  municipality?: {
    id: number;
    name: string;
  };
  neighborhood: string;
  votingBoothId?: number;
  votingBooth?: VotingBoothDto;
  votingTableId?: string;
  votingTable?: VotingTableDto;
  candidates?: Array<{
    id: number;
    name: string;
    party: string;
    number: number;
    corporation?: {
      id: number;
      name: string;
    };
  }>;
  leaders?: Array<{
    id: number;
    name: string;
  }>;
}
