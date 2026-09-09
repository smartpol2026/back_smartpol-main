import { IsNumber, IsString } from 'class-validator';

export class GrantPermissionDto {
  @IsNumber()
  userId: number;

  @IsString()
  permissionName: string;
}
