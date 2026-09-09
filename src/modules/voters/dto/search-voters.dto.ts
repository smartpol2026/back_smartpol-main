import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  MinLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchVotersDto {
  @ApiProperty({
    description: 'Search query (firstName, lastName, or identification)',
    type: String,
    example: 'Juan',
    required: true,
  })
  @IsString()
  @MinLength(1)
  q: string;

  @ApiProperty({
    description: 'Page number (starting from 1)',
    type: Number,
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    type: Number,
    example: 20,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
