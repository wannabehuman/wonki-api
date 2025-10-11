import { PartialType } from '@nestjs/mapped-types';
import { CreateCodeGroupDto } from './create-code-group.dto';

export class UpdateCodeGroupDto extends PartialType(CreateCodeGroupDto) {}
