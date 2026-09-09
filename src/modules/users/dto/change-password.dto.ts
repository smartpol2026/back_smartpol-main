import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'newpassword123',
    description: 'New password (minimum 6 characters, maximum 100 characters)',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(100, { message: 'Password must not exceed 100 characters' })
  newPassword: string;
}
