import { PartialType } from '@nestjs/mapped-types';
import { CreateStockDto } from './create-stock.dto';
import { IsNumber, Min, IsString } from 'class-validator';

export class UpdateStockDto extends PartialType(CreateStockDto) {
  @IsString({ message: '재고명은 문자열이어야 합니다.' })
  name: string;

  // @IsString({ message: '행 상태는 문자열이어야 합니다.' })
  rowStatus?: 'INSERT' | 'UPDATE' | 'DELETE';

  @IsNumber({}, { message: '수량은 숫자여야 합니다.' })
  @Min(0, { message: '수량은 0 이상이어야 합니다.' })
  quantity?: number;

  @IsNumber({}, { message: '최초입고수량은 숫자여야 합니다.' })
  @Min(0, { message: '최초입고수량은 0 이상이어야 합니다.' })
  initialQuantity?: number;

  @IsNumber({}, { message: '출고수량은 숫자여야 합니다.' })
  @Min(0, { message: '출고수량은 0 이상이어야 합니다.' })
  outQuantity?: number;

  @IsNumber({}, { message: '재고수량은 숫자여야 합니다.' })
  @Min(0, { message: '재고수량은 0 이상이어야 합니다.' })
  stockQuantity?: number;

  @IsString({ message: '재고수정사유는 문자열이어야 합니다.' })
  stockUpdateReason?: string;
}
