import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CodeDetail } from './entities/code-detail.entity';
import { CreateCodeDetailDto } from './dto/create-code-detail.dto';
import { UpdateCodeDetailDto } from './dto/update-code-detail.dto';
import { LogService } from '../log/log.service';

@Injectable()
export class CodeDetailService {
  constructor(
    @InjectRepository(CodeDetail)
    private readonly codeDetailRepository: Repository<CodeDetail>,
    private readonly logService: LogService,
  ) {}

  /**
   * 전체 조회
   */
  async findAll(): Promise<CodeDetail[]> {
    return this.codeDetailRepository.find({
      order: { grp_code: 'ASC', sort_order: 'ASC', code: 'ASC' }
    });
  }

  /**
   * 그룹코드별 조회
   */
  async findByGroupCode(grp_code: string): Promise<CodeDetail[]> {
    return this.codeDetailRepository.find({
      where: { grp_code },
      order: { sort_order: 'ASC', code: 'ASC' }
    });
  }

  /**
   * 단일 조회
   */
  async findOne(grp_code: string, code: string): Promise<CodeDetail> {
    const codeDetail = await this.codeDetailRepository.findOne({
      where: { grp_code, code }
    });

    if (!codeDetail) {
      throw new NotFoundException(`코드 ${grp_code}-${code}을(를) 찾을 수 없습니다.`);
    }

    return codeDetail;
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
          const result = await this.create(createData as CreateCodeDetailDto, user);
          results.push({ code: true, data: result });
        } else if (status === 'U') {
          const { rowStatus, ROW_STATUS, unicId, Del_Check, grp_code, code, ...updateData } = dto;
          if (!grp_code || !code) {
            throw new BadRequestException('UPDATE 시 그룹코드와 코드는 필수입니다.');
          }
          const result = await this.update(grp_code, code, updateData as UpdateCodeDetailDto, user);
          results.push({ code: true, data: result });
        } else if (status === 'D') {
          const grp_code = dto.grp_code;
          const code = dto.code;
          if (!grp_code || !code) {
            throw new BadRequestException('DELETE 시 그룹코드와 코드는 필수입니다.');
          }
          await this.remove(grp_code, code, user);
          results.push({ code: true, data: { grp_code, code, deleted: true } });
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
  async create(createDto: CreateCodeDetailDto, user?: any): Promise<CodeDetail> {
    const newCodeDetail = this.codeDetailRepository.create(createDto);
    const savedCodeDetail = await this.codeDetailRepository.save(newCodeDetail);

    await this.logService.log({
      userId: user?.userId || user?.id,
      username: user?.username || user?.name,
      tableName: 'wk_code_detail',
      recordId: `${savedCodeDetail.grp_code}-${savedCodeDetail.code}`,
      operation: 'INSERT',
      newValue: savedCodeDetail,
      description: `코드 등록: ${savedCodeDetail.grp_code}-${savedCodeDetail.code}`,
    });

    return savedCodeDetail;
  }

  /**
   * 수정
   */
  async update(grp_code: string, code: string, updateDto: UpdateCodeDetailDto, user?: any): Promise<CodeDetail> {
    const existingCodeDetail = await this.findOne(grp_code, code);
    const oldValue = { ...existingCodeDetail };

    Object.assign(existingCodeDetail, updateDto);
    const updatedCodeDetail = await this.codeDetailRepository.save(existingCodeDetail);

    await this.logService.log({
      userId: user?.userId || user?.id,
      username: user?.username || user?.name,
      tableName: 'wk_code_detail',
      recordId: `${grp_code}-${code}`,
      operation: 'UPDATE',
      oldValue: oldValue,
      newValue: updatedCodeDetail,
      description: `코드 수정: ${grp_code}-${code}`,
    });

    return updatedCodeDetail;
  }

  /**
   * 삭제
   */
  async remove(grp_code: string, code: string, user?: any): Promise<void> {
    const existingCodeDetail = await this.findOne(grp_code, code);
    const oldValue = { ...existingCodeDetail };

    await this.codeDetailRepository.remove(existingCodeDetail);

    await this.logService.log({
      userId: user?.userId || user?.id,
      username: user?.username || user?.name,
      tableName: 'wk_code_detail',
      recordId: `${grp_code}-${code}`,
      operation: 'DELETE',
      oldValue: oldValue,
      description: `코드 삭제: ${grp_code}-${code}`,
    });
  }
}
