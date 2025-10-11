import { IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { UserStatus } from '../entities/user.entity';

export class ApproveUserDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsEnum(UserStatus)
  status: UserStatus;

  @IsString()
  @IsNotEmpty()
  approvedBy: string;
}
