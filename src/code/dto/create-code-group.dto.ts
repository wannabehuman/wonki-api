import { IsString, IsOptional, IsIn, IsInt } from 'class-validator';

export class CreateCodeGroupDto {
  @IsString()
  grp_code: string;

  @IsString()
  grp_name: string;

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
