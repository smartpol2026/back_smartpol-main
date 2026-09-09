import { IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ 
    example: 'oldpassword123',
    description: 'Current password'
  })
  @IsString()
  @IsNotEmpty()
  currentPassword: string;

  @ApiProperty({ 
    example: 'newpassword123',
    description: 'New password (minimum 6 characters)'
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword: string;

  @ApiProperty({ 
    example: 'newpassword123',
    description: 'Confirm new password'
  })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  confirmPassword: string;
}

