import { IsString, IsOptional, IsNumber, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateLeaderDto {
  @ApiProperty({
    example: 'Juan López',
    description: 'Leader name (optional)',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    example: '12345678',
    description: 'Leader identification document (optional)',
  })
  @IsString()
  @IsOptional()
  document?: string;

  @ApiProperty({
    example: 'Bogotá',
    description: 'Municipality where the leader is from (optional)',
  })
  @IsString()
  @IsOptional()
  municipality?: string;

  @ApiProperty({
    example: '+57 312 123 4567',
    description: 'Leader phone number (optional)',
  })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    example: 1,
    description: 'User ID associated with the leader (optional)',
  })
  @IsNumber()
  @IsOptional()
  userId?: number;

  @ApiProperty({
    example: 1,
    description:
      'Campaign ID that the leader works for (optional). Change the campaign assignment for this leader.',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  campaignId?: number;

  @ApiProperty({
    example: 'newpassword123',
    description: 'Leader user password (optional, minimum 6 characters)',
    required: false,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;
}
