import { ApiProperty } from '@nestjs/swagger';

export class VotingBoothResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'SEC. ESC. LA ESPERANZA No 2' })
  name: string;

  @ApiProperty({ example: 'VB-ANTIOQUIA-MEDELLIN-001', required: false })
  code?: string;

  @ApiProperty({ example: 1 })
  municipalityId: number;

  @ApiProperty({ example: 5 })
  mesas: number;
}
