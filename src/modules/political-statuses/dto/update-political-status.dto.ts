import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePoliticalStatusDto {
  @ApiProperty({
    example: 'Inactivo',
    description: 'Estado politico (optional)',
  })
  @IsString()
  @IsOptional()
  name?: string;
}
