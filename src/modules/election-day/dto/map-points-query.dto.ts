import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class MapPointsQueryDto {
  @ApiPropertyOptional({
    example: '23',
    description: 'Código DIVIPOLA del departamento (2 dígitos)',
  })
  @IsOptional()
  @Matches(/^\d{2}$/, {
    message: 'departmentCode debe contener exactamente 2 dígitos',
  })
  departmentCode?: string;

  @ApiPropertyOptional({
    example: '23001',
    description: 'Código DIVIPOLA del municipio (5 dígitos)',
  })
  @IsOptional()
  @Matches(/^\d{5}$/, {
    message: 'municipalityCode debe contener exactamente 5 dígitos',
  })
  municipalityCode?: string;
}
