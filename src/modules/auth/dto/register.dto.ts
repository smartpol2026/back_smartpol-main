import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address (required)'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password (required, minimum 6 characters)'
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

