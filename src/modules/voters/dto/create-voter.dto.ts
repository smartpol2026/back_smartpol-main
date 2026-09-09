import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsDateString,
  IsNumber,
  IsOptional,
  Validate,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  NumericOnlyValidator,
  PhoneFormatValidator,
  NameFormatValidator,
} from '../../../common/validators/no-whitespace.validator';

export class CreateVoterDto {
  @ApiProperty({
    example: 'JOSE ANGEL',
    description:
      'Voter first name (required, can have spaces in the middle, will be stored in uppercase)',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(NameFormatValidator)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  firstName: string;

  @ApiProperty({
    example: 'DIAZ ALFARO',
    description:
      'Voter last name (required, can have spaces in the middle, will be stored in uppercase)',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(NameFormatValidator)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.toUpperCase().trim() : value,
  )
  lastName: string;

  @ApiProperty({
    example: '1234567890',
    description: 'Voter identification number (required, numbers only)',
  })
  @IsString()
  @IsNotEmpty()
  @Validate(NumericOnlyValidator)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  identification: string;

  @ApiProperty({
    example: 'M',
    description: 'Voter gender, M for male or F for female (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  gender?: string;

  @ApiProperty({
    example: 'O+',
    description: 'Voter blood type (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  bloodType?: string;

  @ApiProperty({
    example: '1980-01-15',
    description: 'Voter birth date in YYYY-MM-DD format (optional)',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  birthDate?: string;

  @ApiProperty({
    example: '3121234567',
    description: 'Voter phone number (optional, numbers only)',
    required: false,
  })
  @IsString()
  @IsOptional()
  @Validate(PhoneFormatValidator)
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  phone?: string;

  @ApiProperty({
    example: 'Cra 5 #12-34 Apt 201',
    description: 'Voter physical address (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({
    example: 1,
    description: 'Department ID (required)',
  })
  @IsNumber()
  @IsNotEmpty()
  departmentId: number;

  @ApiProperty({
    example: 1,
    description: 'Municipality ID (required)',
  })
  @IsNumber()
  @IsNotEmpty()
  municipalityId: number;

  @ApiProperty({
    example: 'Centro',
    description: 'Voter neighborhood (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiProperty({
    example: 'VOTER@EXAMPLE.COM',
    description: 'Voter email address (optional, will be stored in uppercase)',
    required: false,
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
    required: false,
  })
  @IsString()
  @IsOptional()
  occupation?: string;

  @ApiProperty({
    example: 1,
    description: 'Voting Booth ID (optional)',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  votingBoothId?: number;

  @ApiProperty({
    example: 1,
    description: 'Voting Table ID or Mesa number (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  votingTableId?: string;

  @ApiProperty({
    example: 'Active',
    description: 'Voter political status (optional)',
    required: false,
  })
  @IsString()
  @IsOptional()
  politicalStatus?: string;
}
