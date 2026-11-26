import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class AssignWitnessTableDto {
  @ApiProperty({ example: 12 })
  @IsInt()
  @IsPositive()
  userId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  campaignId: number;

  @ApiProperty({ example: 5 })
  @IsInt()
  @IsPositive()
  votingBoothId: number;

  @ApiProperty({ example: 1 })
  @IsInt()
  @IsPositive()
  tableNumber: number;
}
