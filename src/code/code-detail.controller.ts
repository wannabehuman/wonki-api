import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CodeDetailService } from './code-detail.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('code-detail')
export class CodeDetailController {
  constructor(private readonly codeDetailService: CodeDetailService) {}

  /**
   * 전체 조회
   * GET /api/code-detail
   */
  @Get()
  async findAll() {
    return [];
  }

  /**
   * 그룹코드별 조회
   * GET /api/code-detail/group/:grp_code
   */
  // @Get('group/:grp_code')
  // async findByGroupCode(@Param('grp_code') grp_code: string) {
  //   return this.codeDetailService.findByGroupCode(grp_code);
  // }

  /**
   * 그룹코드별 조회 (먼저 선언)
   * GET /api/code-detail/:grp_code
   */
  @Get(':grp_code')
  async findGrpCd(@Param('grp_code') grp_code: string) {
    // console.log(grp_code);
    // grp_code가 비어있거나 유효하지 않으면 빈 배열 반환
    if (!grp_code || grp_code.trim() === '') {
      console.log('grp_code가 비어있거나 유효하지 않음');
      return [];
    }
    console.log('grp_code가 유효함');
    return this.codeDetailService.findByGroupCode(grp_code);
  }

  /**
   * 단일 조회
   * GET /api/code-detail/:grp_code/:code
   */
  @Get(':grp_code/:code')
  async findOne(@Param('grp_code') grp_code: string, @Param('code') code: string) {
    return this.codeDetailService.findOne(grp_code, code);
  }
  /**
   * 조회 및 저장 (POST)
   * POST /api/code-detail
   */
  @Post()
  async handleRequest(@Body() body: any, @CurrentUser() user?: any) {
    // 빈 객체나 빈 배열이면 전체 조회
    if (!body || (Array.isArray(body) && body.length === 0) || Object.keys(body).length === 0) {
      return this.codeDetailService.findAll();
    }

    // grp_code가 있으면 그룹별 조회
    if (body.grp_code && !body.rowStatus && !body.ROW_STATUS) {
      return this.codeDetailService.findByGroupCode(body.grp_code);
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
      return this.codeDetailService.save(validData, user);
    }

    // 저장할 데이터도 없으면 전체 조회
    return this.codeDetailService.findAll();
  }
}
