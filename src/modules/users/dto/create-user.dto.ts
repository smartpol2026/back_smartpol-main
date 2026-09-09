import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsArray,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address (required)',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (required, minimum 6 characters)',
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: 3,
    description: 'Role ID (3 for Candidato, 4 for Lider, etc)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  roleId?: number;

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
