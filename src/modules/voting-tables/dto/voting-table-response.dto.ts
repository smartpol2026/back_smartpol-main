import { ApiProperty } from '@nestjs/swagger';

export class VotingTableResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  tableNumber: number;

  @ApiProperty({ example: 3 })
  votingBoothId: number;
}