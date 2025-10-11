import { IsNotEmpty, IsString, MaxLength, MinLength, Matches } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: '사용자 이름은 필수입니다.' })
  @IsString()
  @MinLength(3, { message: '사용자 이름은 최소 3자 이상이어야 합니다.' })
  @MaxLength(50, { message: '사용자 이름은 최대 50자까지 가능합니다.' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '사용자 이름은 영문, 숫자, 언더스코어(_)만 사용 가능합니다.',
  })
  username: string;

  @IsNotEmpty({ message: '비밀번호는 필수입니다.' })
  @IsString()
  @MinLength(4, { message: '비밀번호는 최소 4자 이상이어야 합니다.' })
  @MaxLength(100, { message: '비밀번호는 최대 100자까지 가능합니다.' })
  password: string;
}
