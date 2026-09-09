import { IsNumber, IsOptional, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVotingTableDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty()
  @IsNumber()
  tableNumber: number;

  @ApiProperty({ example: 3 })
  @IsNotEmpty()
  @IsNumber()
  votingBoothId: number;
}