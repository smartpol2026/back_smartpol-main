import { IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMunicipalityDto {
  @ApiProperty({
    description: 'Municipality name',
    example: 'Ovejas'
  })
  @IsString()
  name: string;

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
    example: 1
  })
  @IsNumber()
  departmentId: number;
}
