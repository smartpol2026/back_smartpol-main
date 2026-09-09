import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCorporationDto {
  @ApiProperty({ 
    example: 'Corporación XYZ Updated',
    description: 'Corporation name (optional)'
  })
  @IsString()
  @IsOptional()
  name?: string;
}
