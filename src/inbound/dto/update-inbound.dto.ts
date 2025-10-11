import { IsInt, IsOptional, IsString, IsNumber, IsDateString, Min, Max, MaxLength, MinLength, Matches, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateInboundDto {
  @IsIn(['INSERT', 'UPDATE', 'DELETE'])
  rowStatus: 'INSERT' | 'UPDATE' | 'DELETE';

  // UPDATE/DELETE 시 필수
  @IsString()
  @IsOptional()
  @MinLength(11)
  @MaxLength(11)
  @Matches(/^\d{11}$/, { message: '입고번호는 11자리 숫자여야 합니다.' })
  inbound_no?: string;

  @IsString()
  @MinLength(1, { message: '재고코드는 필수입니다.' })
  @MaxLength(50, { message: '재고코드는 최대 50자까지 가능합니다.' })
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: '재고코드는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능합니다.',
  })
  @IsOptional()
  stock_code?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: '수량은 소수점 2자리까지 가능합니다.' })
  @Min(0.01, { message: '수량은 0보다 커야 합니다.' })
  @Max(999999.99, { message: '수량은 999999.99를 초과할 수 없습니다.' })
  @IsOptional()
  quantity?: number;

  @IsString()
  @MinLength(1, { message: '단위는 필수입니다.' })
  @MaxLength(20, { message: '단위는 최대 20자까지 가능합니다.' })
  @IsOptional()
  unit?: string;

  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)' })
  @IsOptional()
  inbound_date?: Date | string;

  @IsDateString({}, { message: '올바른 날짜 형식이 아닙니다. (YYYY-MM-DD)' })
  @IsOptional()
  preparation_date?: Date | string;

  @IsString()
  @MaxLength(500, { message: '비고는 최대 500자까지 가능합니다.' })
  @IsOptional()
  remark?: string;
}
