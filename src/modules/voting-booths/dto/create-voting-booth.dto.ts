import {
  IsString,
  IsNumber,
  IsNotEmpty,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVotingBoothDto {
  @ApiProperty({ example: 'SEC. ESC. LA ESPERANZA No 2' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({ example: 'VB-ANTIOQUIA-MEDELLIN-001', required: false })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  municipalityId: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  @IsNumber()
  mesas: number;

  @ApiProperty({ example: 8.75, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ example: -75.88, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;
}
