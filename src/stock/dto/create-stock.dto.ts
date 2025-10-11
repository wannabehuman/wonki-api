import { IsNotEmpty, IsNumber, IsString, Min, Max, IsOptional } from 'class-validator';

export class CreateStockDto {
  // @IsString({ message: '행 상태는 문자열이어야 합니다.' })
  rowStatus?: 'INSERT' | 'UPDATE' | 'DELETE';

  @IsString({ message: '재고명은 문자열이어야 합니다.' })
  @IsNotEmpty({ message: '재고명은 비어있을 수 없습니다.' })
  name: string;

  @IsNumber({}, { message: '수량은 숫자여야 합니다.' })
  @Min(0, { message: '수량은 0 이상이어야 합니다.' })
  quantity: number;

  @IsString({ message: '단위는 문자열이어야 합니다.' })
  @IsOptional()
  unit?: string;

  @IsString({ message: '위치는 문자열이어야 합니다.' })
  @IsOptional()
  location?: string;

  @IsNumber({}, { message: '최초입고수량은 숫자여야 합니다.' })
  @Min(0, { message: '최초입고수량은 0 이상이어야 합니다.' })
  @IsOptional()
  initialQuantity?: number;

  @IsNumber({}, { message: '출고수량은 숫자여야 합니다.' })
  @Min(0, { message: '출고수량은 0 이상이어야 합니다.' })
  @IsOptional()
  outQuantity?: number;

  @IsNumber({}, { message: '재고수량은 숫자여야 합니다.' })
  @Min(0, { message: '재고수량은 0 이상이어야 합니다.' })
  @IsOptional()
  stockQuantity?: number;

  @IsString({ message: '재고수정사유는 문자열이어야 합니다.' })
  @IsOptional()
  stockUpdateReason?: string;
}
