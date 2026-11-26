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

  @ApiProperty({ example: 8.75, required: false, nullable: true })
  latitude?: number | null;

  @ApiProperty({ example: -75.88, required: false, nullable: true })
  longitude?: number | null;
}
