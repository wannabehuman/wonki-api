import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CodeGroupService } from './code-group.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('code-group')
export class CodeGroupController {
  constructor(private readonly codeGroupService: CodeGroupService) {}

  /**
   * 전체 조회
   * GET /api/code-group
   */
  @Get()
  async findAll() {
    return this.codeGroupService.findAll();
  }

  /**
   * 단일 조회
   * GET /api/code-group/:grp_code
   */
  @Get(':grp_code')
  async findOne(@Param('grp_code') grp_code: string) {
    return this.codeGroupService.findOne(grp_code);
  }

  /**
   * 조회 및 저장 (POST)
   * POST /api/code-group
   */
  @Post()
  async handleRequest(@Body() body: any, @CurrentUser() user?: any) {
    // 빈 객체나 빈 배열이면 전체 조회
    if (!body || (Array.isArray(body) && body.length === 0) || Object.keys(body).length === 0) {
      return this.codeGroupService.findAll();
    }

    // body 안의 모든 속성을 순회하면서 배열인 값만 추출
    const allArrays = Object.values(body).filter(Array.isArray);
    let validData = [];

    // 각 배열마다 rowStatus/ROW_STATUS가 있는 항목만 필터링
    for (const arr of allArrays) {
      const filtered = arr.filter(item => {
        const status = item.rowStatus || item.ROW_STATUS;
        return status && ['I', 'U', 'D'].includes(status);
      });
      validData = validData.concat(filtered);
    }

    // 저장할 데이터가 있으면 저장 실행
    if (validData.length > 0) {
      return this.codeGroupService.save(validData, user);
    }

    // 저장할 데이터도 없으면 전체 조회
    return this.codeGroupService.findAll();
  }
}
