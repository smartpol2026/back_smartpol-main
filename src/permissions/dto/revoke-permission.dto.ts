import { IsNumber, IsString } from 'class-validator';

export class RevokePermissionDto {
  @IsNumber()
  userId: number;

  @IsString()
  permissionName: string;
}
