import { PartialType } from '@nestjs/mapped-types';
import { CreateCodeDetailDto } from './create-code-detail.dto';

export class UpdateCodeDetailDto extends PartialType(CreateCodeDetailDto) {}
