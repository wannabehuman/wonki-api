import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeGroup } from './entities/code-group.entity';
import { CreateCodeGroupDto } from './dto/create-code-group.dto';
import { UpdateCodeGroupDto } from './dto/update-code-group.dto';
import { LogService } from '../log/log.service';

@Injectable()
export class CodeGroupService {
  constructor(
    @InjectRepository(CodeGroup)
    private readonly codeGroupRepository: Repository<CodeGroup>,
    private readonly logService: LogService,
  ) {}

  /**
   * 전체 조회
   */
  async findAll(): Promise<CodeGroup[]> {
    return this.codeGroupRepository.find({
      order: { sort_order: 'ASC', grp_code: 'ASC' }
    });
  }

  /**
   * 단일 조회
   */
  async findOne(grp_code: string): Promise<CodeGroup> {
    const codeGroup = await this.codeGroupRepository.findOne({
      where: { grp_code }
    });

    if (!codeGroup) {
      throw new NotFoundException(`그룹코드 ${grp_code}을(를) 찾을 수 없습니다.`);
    }

    return codeGroup;
  }

  /**
   * 일괄 저장 (INSERT/UPDATE/DELETE 처리)
   */
  async save(dtos: any[], user?: any) {
    const results: any[] = [];

    for (const dto of dtos) {
      const status = dto.rowStatus || dto.ROW_STATUS;

      try {
        if (status === 'I') {
          const { rowStatus, ROW_STATUS, unicId, Del_Check, ...createData } = dto;
          const result = await this.create(createData as CreateCodeGroupDto, user);
          results.push({ code: true, data: result });
        } else if (status === 'U') {
          const { rowStatus, ROW_STATUS, unicId, Del_Check, grp_code, ...updateData } = dto;
          if (!grp_code) {
            throw new BadRequestException('UPDATE 시 그룹코드는 필수입니다.');
          }
          const result = await this.update(grp_code, updateData as UpdateCodeGroupDto, user);
          results.push({ code: true, data: result });
        } else if (status === 'D') {
          const grp_code = dto.grp_code;
          if (!grp_code) {
            throw new BadRequestException('DELETE 시 그룹코드는 필수입니다.');
          }
          await this.remove(grp_code, user);
          results.push({ code: true, data: { grp_code, deleted: true } });
        }
      } catch (error) {
        results.push({
          code: false,
          data: dto,
          message: error.message
        });
      }
    }

    return results;
  }

  /**
   * 생성
   */
  async create(createDto: CreateCodeGroupDto, user?: any): Promise<CodeGroup> {
    const newCodeGroup = this.codeGroupRepository.create(createDto);
    const savedCodeGroup = await this.codeGroupRepository.save(newCodeGroup);

    await this.logService.log({
      userId: user?.id,
      username: user?.name,
      tableName: 'wk_code_group',
      recordId: savedCodeGroup.grp_code,
      operation: 'INSERT',
      newValue: savedCodeGroup,
      description: `코드그룹 등록: ${savedCodeGroup.grp_code}`,
    });

    return savedCodeGroup;
  }

  /**
   * 수정
   */
  async update(grp_code: string, updateDto: UpdateCodeGroupDto, user?: any): Promise<CodeGroup> {
    const existingCodeGroup = await this.findOne(grp_code);
    const oldValue = { ...existingCodeGroup };

    Object.assign(existingCodeGroup, updateDto);
    const updatedCodeGroup = await this.codeGroupRepository.save(existingCodeGroup);

    await this.logService.log({
      userId: user?.id,
      username: user?.name,
      tableName: 'wk_code_group',
      recordId: grp_code,
      operation: 'UPDATE',
      oldValue: oldValue,
      newValue: updatedCodeGroup,
      description: `코드그룹 수정: ${grp_code}`,
    });

    return updatedCodeGroup;
  }

  /**
   * 삭제
   */
  async remove(grp_code: string, user?: any): Promise<void> {
    const existingCodeGroup = await this.findOne(grp_code);
    const oldValue = { ...existingCodeGroup };

    await this.codeGroupRepository.remove(existingCodeGroup);

    await this.logService.log({
      userId: user?.id,
      username: user?.name,
      tableName: 'wk_code_group',
      recordId: grp_code,
      operation: 'DELETE',
      oldValue: oldValue,
      description: `코드그룹 삭제: ${grp_code}`,
    });
  }
}
