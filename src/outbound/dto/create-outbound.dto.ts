import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOutboundDto {
  @IsString()
  inbound_no: string;

  @IsString()
  stock_code: string;

  @Type(() => Date)
  @IsDate()
  io_date: Date;

  @IsInt()
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsString()
  @IsOptional()
  rowStatus?: string;
}
