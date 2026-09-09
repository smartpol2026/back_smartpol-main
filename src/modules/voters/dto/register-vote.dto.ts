import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterVoteDto {
  @ApiProperty({
    example: '1234567890',
    description: 'Voter identification number',
  })
  @IsString()
  @IsNotEmpty()
  identification: string;
}
