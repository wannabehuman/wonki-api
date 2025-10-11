import { IsEmail, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: '사용자 이름은 필수입니다.' })
  @IsString()
  username: string;

  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @IsString()
  @MinLength(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' })
  password: string;

  @IsNotEmpty({ message: '이름은 필수입니다.' })
  @IsString()
  name: string;

  @IsOptional()
  @IsEmail({}, { message: '올바른 이메일 형식이 아닙니다.' })
  email?: string;
}
