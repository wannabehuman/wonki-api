import { IsString, IsOptional, IsIn, IsInt } from 'class-validator';

export class CreateCodeDetailDto {
  @IsString()
  grp_code: string;

  @IsString()
  code: string;

  @IsString()
  code_name: string;

  @IsOptional()
  @IsString()
  code_value?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsIn(['Y', 'N'])
  use_yn?: string;

  @IsOptional()
  @IsInt()
  sort_order?: number;
}
