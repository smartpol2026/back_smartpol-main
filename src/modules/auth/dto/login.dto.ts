import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ 
    example: 'user@example.com',
    description: 'User email address (required)'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ 
    example: 'password123',
    description: 'User password (required)'
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  password: string;
}

