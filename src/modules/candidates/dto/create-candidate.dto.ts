import { IsString, IsNumber, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCandidateDto {
  @ApiProperty({
    example: 'Juan Duarte',
    description: 'Candidate name (required)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Partido Colombiano',
    description: 'Political party name (required)',
  })
  @IsString()
  @IsNotEmpty()
  party: string;

  @ApiProperty({
    example: 1,
    description: 'Candidate ballot number (required, must be an integer)',
  })
  @IsNumber()
  @IsNotEmpty()
  number: number;

  @ApiProperty({
    example: 1,
    description: 'Corporation ID that the candidate represents (required)',
  })
  @IsNumber()
  @IsNotEmpty()
  corporation_id: number;

  @ApiProperty({
    example: 1,
    description: 'Campaign ID that the candidate belongs to (optional)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  campaignId?: number;

  @ApiProperty({
    example: 1,
    description: 'User ID associated with the candidate (optional)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  userId?: number;
}