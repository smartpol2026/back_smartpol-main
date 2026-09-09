import {
  IsString,
  IsOptional,
  IsEmail,
  IsDateString,
  IsNumber,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  NumericOnlyValidator,
  PhoneFormatValidator,
  NameFormatValidator,
} from '../../../common/validators/no-whitespace.validator';

export class UpdateVoterDto {
  @ApiProperty({
    example: 'JOSE ANGEL',
    description:
      'Voter first name (optional, can have spaces in the middle, will be stored in uppercase)',
  })
  @IsString()
  @IsOptional()
  @Validate(NameFormatValidator)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  firstName?: string;

  @ApiProperty({
    example: 'DIAZ ALFARO',
    description:
      'Voter last name (optional, can have spaces in the middle, will be stored in uppercase)',
  })
  @IsString()
  @IsOptional()
  @Validate(NameFormatValidator)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  lastName?: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Voter identification number (optional, numbers only)',
  })
  @IsString()
  @IsOptional()
  @Validate(NumericOnlyValidator)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  identification?: string;

  @ApiProperty({
    example: 'M',
    description: 'Voter gender, M for male or F for female (optional)',
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    example: 'O+',
    description: 'Voter blood type (optional)',
  })
  @IsString()
  @IsOptional()
  bloodType?: string;

  @ApiProperty({
    example: '1980-01-15',
    description: 'Voter birth date in YYYY-MM-DD format (optional)',
  })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiProperty({
    example: '3121234567',
    description: 'Voter phone number (optional, numbers only)',
  })
  @IsString()
  @IsOptional()
  @Validate(PhoneFormatValidator)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiProperty({
    example: 'Cra 5 #12-34 Apt 201',
    description: 'Voter physical address (optional)',
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 1,
    description: 'Department ID (optional)',
  })
  @IsNumber()
  @IsOptional()
  departmentId?: number;

  @ApiProperty({
    example: 1,
    description: 'Municipality ID (optional)',
  })
  @IsNumber()
  @IsOptional()
  municipalityId?: number;

  @ApiProperty({
    example: 'Centro',
    description: 'Voter neighborhood (optional)',
  })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiProperty({
    example: 'VOTER@EXAMPLE.COM',
    description: 'Voter email address (optional, will be stored in uppercase)',
  })
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  email?: string;

  @ApiProperty({
    example: 'Ingeniero',
    description: 'Voter occupation or job title (optional)',
  })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiProperty({
    example: 1,
    description: 'Voting Booth ID (optional)',
  })
  @IsNumber()
  @IsOptional()
  votingBoothId?: number;

  @ApiProperty({
    example: 1,
    description: 'Voting Table ID or Mesa number (optional)',
  })
  @IsString()
  @IsOptional()
  votingTableId?: string;

  @ApiProperty({
    example: 'Active',
    description: 'Voter political status (Active, Inactive, etc.) (optional)',
  })
  @IsString()
  @IsOptional()
  politicalStatus?: string;
}
