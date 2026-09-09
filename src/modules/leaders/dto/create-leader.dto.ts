import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLeaderDto {
  @ApiProperty({
    example: 'Juan López',
    description: 'Leader name (required)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: '12345678',
    description: 'Leader identification document (required)',
  })
  @IsString()
  @IsNotEmpty()
  document: string;

  @ApiProperty({
    example: 'Bogotá',
    description: 'Municipality where the leader is from (required)',
  })
  @IsString()
  @IsNotEmpty()
  municipality: string;

  @ApiProperty({
    example: '+57 312 123 4567',
    description: 'Leader phone number (required)',
  })
  @IsString()
  @IsNotEmpty()
  phone: string;

  @ApiProperty({
    example: 1,
    description: 'User ID associated with the leader (optional)',
  })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    example: 1,
    description: 'Campaign ID to assign the leader to (optional)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  campaignId?: number;
}
