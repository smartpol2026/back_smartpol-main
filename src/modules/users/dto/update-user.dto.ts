import {
  IsEmail,
  IsOptional,
  IsString,
  MinLength,
  IsNumber,
  IsArray,
} from 'class-validator';
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
    example: [1],
    description:
      'Campaign IDs to assign. For Director de campaña (7) and Testigo electoral (8) must contain exactly one campaign; previous campaigns are replaced',
    required: false,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  campaignIds?: number[];

  @ApiProperty({
    example: 5,
    description:
      'Voting booth ID. Superadmin/Admin can change the mesa of a Testigo electoral',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  votingBoothId?: number;

  @ApiProperty({
    example: 2,
    description:
      'Table number. Superadmin/Admin can change the mesa of a Testigo electoral',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  tableNumber?: number;
}
