import { IsString, IsNumber, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCandidateDto {
  @ApiProperty({
    example: 'Juan Duarte',
    description: 'Candidate name (optional)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: 'Partido Colombiano',
    description: 'Political party name (optional)',
  })
  @IsString()
  @IsOptional()
  party?: string;

  @ApiProperty({
    example: 1,
    description: 'Candidate ballot number (optional, must be an integer)',
  })
  @IsNumber()
  @IsOptional()
  number?: number;

  @ApiProperty({
    example: 1,
    description: 'Corporation ID that the candidate represents (optional)',
  })
  @IsNumber()
  @IsOptional()
  corporation_id?: number;

  @ApiProperty({
    example: 1,
    description: 'Campaign ID that the candidate belongs to (optional)',
  })
  @IsNumber()
  @IsOptional()
  campaignId?: number;

  @ApiProperty({
    example: 1,
    description: 'User ID associated with the candidate (optional)',
  })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    example: 'newpassword123',
    description: 'Candidate user password (optional, minimum 6 characters)',
    required: false,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
