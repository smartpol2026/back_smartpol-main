import { ApiProperty } from '@nestjs/swagger';

export class VotingStatsDto {
  @ApiProperty({
    example: 1000,
    description: 'Total expected votes (all voters in the system)',
  })
  expected: number;

  @ApiProperty({
    example: 350,
    description: 'Total registered votes (voters who have voted)',
  })
  registered: number;

  @ApiProperty({
    example: 650,
    description: 'Total pending votes (voters who have not voted yet)',
  })
  pending: number;
}
