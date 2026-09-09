import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationQueryDto {
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

export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Array of items',
  })
  data: T[];

  @ApiProperty({
    description: 'Current page number',
    type: Number,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    type: Number,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of items',
    type: Number,
  })
  total: number;

  @ApiProperty({
    description: 'Total number of pages',
    type: Number,
  })
  pages: number;

  @ApiProperty({
    description: 'Has next page',
    type: Boolean,
  })
  hasNextPage: boolean;

  @ApiProperty({
    description: 'Has previous page',
    type: Boolean,
  })
  hasPreviousPage: boolean;
}
