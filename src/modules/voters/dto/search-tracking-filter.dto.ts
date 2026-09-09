import { IsString, IsEnum, IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class SearchTrackingFilterDto {
  @ApiProperty({
    description: 'Tracking status filter',
    enum: ['expected', 'registered', 'pending'],
    type: String,
    example: 'expected',
    required: true,
  })
  @IsString()
  @IsEnum(['expected', 'registered', 'pending'])
  status: 'expected' | 'registered' | 'pending';

  @ApiProperty({
    description: 'Voter identification to search (partial match allowed)',
    type: String,
    example: '18881217',
    required: true,
  })
  @IsString()
  identification: string;

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
