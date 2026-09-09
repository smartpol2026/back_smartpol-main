import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateMunicipalityDto {
  @ApiProperty({
    description: 'Municipality name',
    example: 'Ovejas',
    required: false
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    description: 'Municipality code',
    example: '70001',
    required: false
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({
    description: 'Department ID',
    example: 1,
    required: false
  })
  @IsOptional()
  @IsNumber()
  departmentId?: number;
}
