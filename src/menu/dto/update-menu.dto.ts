import { CreateMenuDto } from './create-menu.dto';
import { IsString, IsNumber, IsBoolean, IsOptional, IsArray } from 'class-validator';

// @nestjs/mapped-types의 PartialType 기능을 직접 구현
export class UpdateMenuDto implements Partial<CreateMenuDto> {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  path?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsString()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  order?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];
}
