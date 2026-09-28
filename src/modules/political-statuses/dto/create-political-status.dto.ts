import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePoliticalStatusDto {
  @ApiProperty({
    example: 'Activo',
    description: 'Estado politico (required)',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
