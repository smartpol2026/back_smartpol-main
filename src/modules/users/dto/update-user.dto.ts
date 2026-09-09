import { IsEmail, IsOptional, IsString, MinLength, IsNumber, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'newemail@example.com',
    description: 'User email address (optional)',
    required: false,
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'newpassword123',
    description: 'User password (optional, minimum 6 characters)',
    required: false,
  })
  @IsString()
  @MinLength(6)
  @IsOptional()
  password?: string;

  @ApiProperty({
    example: 1,
    description: 'Organization ID (optional)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  organizationId?: number;

  @ApiProperty({
    example: [1, 2, 3],
    description: 'Campaign IDs to assign (optional)',
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  campaignIds?: number[];
}
