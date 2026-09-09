import { IsArray, IsNumber, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignCandidateDto {
  @ApiProperty({
    example: [2, 3],
    description: 'Array of Candidate IDs to assign to the voter (required)',
    isArray: true,
    type: Number,
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsNotEmpty()
  candidate_ids: number[];

  @ApiProperty({
    example: 1,
    description: 'Leader ID to assign to the voter (required)',
  })
  @IsNumber()
  @IsNotEmpty()
  leader_id: number;
}
