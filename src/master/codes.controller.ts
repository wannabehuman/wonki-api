import { Controller, Post, Body } from '@nestjs/common';

@Controller('master/codes')
export class CodesController {
  @Post()
  async handleRequest(@Body() body: any) {
    const { mode, ...filterData } = body;

    switch (mode) {
      case 'SELECT':
      case 'select':
        // 공통코드 조회 로직
        // TODO: 추후 공통코드 서비스 연결
        return {
          data: [
            { code: 'CAT001', name: '원자재', type: 'CATEGORY' },
            { code: 'CAT002', name: '부자재', type: 'CATEGORY' },
            { code: 'CAT003', name: '완제품', type: 'CATEGORY' },
          ]
        };

      case 'INSERT':
      case 'insert':
        // TODO: 등록 로직
        return { success: true, data: filterData };

      case 'UPDATE':
      case 'update':
        // TODO: 수정 로직
        return { success: true, data: filterData };

      case 'DELETE':
      case 'delete':
        // TODO: 삭제 로직
        return { success: true, message: 'Deleted successfully' };

      default:
        throw new Error(`Unsupported mode: ${mode}`);
    }
  }
}
