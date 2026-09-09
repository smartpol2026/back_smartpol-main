import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
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
}
