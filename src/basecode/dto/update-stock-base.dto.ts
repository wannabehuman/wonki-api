import { IsString, IsOptional, IsInt, IsBoolean, IsDate } from 'class-validator';

export class UpdateStockBaseDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsInt()
  @IsOptional()
  max_use_period?: number;

  @IsString()
  @IsOptional()
  remark?: string;

  @IsBoolean()
  @IsOptional()
  isAlert?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;


  @IsDate()
  @IsOptional()
  updatedAt?: Date;
}