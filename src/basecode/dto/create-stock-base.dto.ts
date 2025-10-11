import { IsString, IsOptional, IsInt, IsBoolean, MaxLength, MinLength, Matches, Min, Max } from 'class-validator';

export class CreateStockBaseDto {
  @IsString()
  @MinLength(1, { message: '코드는 최소 1자 이상이어야 합니다.' })
  @MaxLength(50, { message: '코드는 최대 50자까지 가능합니다.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '코드는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능합니다.',
  })
  code: string;

  @IsString()
  @MinLength(1, { message: '이름은 최소 1자 이상이어야 합니다.' })
  @MaxLength(100, { message: '이름은 최대 100자까지 가능합니다.' })
  name: string;

  @IsString()
  @MinLength(1, { message: '카테고리는 최소 1자 이상이어야 합니다.' })
  @MaxLength(50, { message: '카테고리는 최대 50자까지 가능합니다.' })
  category: string;

  @IsString()
  @MinLength(1, { message: '단위는 최소 1자 이상이어야 합니다.' })
  @MaxLength(20, { message: '단위는 최대 20자까지 가능합니다.' })
  unit: string;

  @IsInt({ message: '사용기간은 정수여야 합니다.' })
  @Min(0, { message: '사용기간은 0 이상이어야 합니다.' })
  @Max(3650, { message: '사용기간은 3650일을 초과할 수 없습니다.' })
  @IsOptional()
  max_use_period?: number;

  @IsString()
  @MaxLength(500, { message: '비고는 최대 500자까지 가능합니다.' })
  @IsOptional()
  remark?: string;

  @IsBoolean({ message: '알림 설정은 boolean 타입이어야 합니다.' })
  @IsOptional()
  isAlert?: boolean;

  @IsBoolean({ message: '활성화 설정은 boolean 타입이어야 합니다.' })
  @IsOptional()
  isActive?: boolean;
}
