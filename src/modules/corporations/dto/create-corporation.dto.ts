import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCorporationDto {
  @ApiProperty({ 
    example: 'Corporación XYZ',
    description: 'Corporation name (required)'
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
