import { IsDate, IsInt, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateOutboundDto {
  @IsInt()
  @IsOptional()
  id?: number;

  @IsString()
  @IsOptional()
  inbound_no?: string;

  @IsString()
  @IsOptional()
  stock_code?: string;

  @Type(() => Date)
  @IsDate()
  @IsOptional()
  io_date?: Date;

  @IsInt()
  @IsOptional()
  quantity?: number;

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
