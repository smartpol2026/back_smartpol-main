import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDepartmentDto {
  @ApiProperty({
    description: 'Department name',
    example: 'Sucre'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Department code',
    example: '70',
    required: false
  })
  @IsOptional()
  @IsString()
  code?: string;
}
