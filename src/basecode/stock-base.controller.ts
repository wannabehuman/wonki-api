import { Controller, Get, Post, Put, Delete, Param, Body, Query, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { StockBaseService } from './stock-base.service';
import { CreateStockBaseDto } from './dto/create-stock-base.dto';
import { UpdateStockBaseDto } from './dto/update-stock-base.dto';

@Controller('stock-base')
export class StockBaseController {
  constructor(private readonly stockBaseService: StockBaseService) {}

  /**
   * 품목 조회 (GET)
   * GET /api/stock-base
   * GET /api/stock-base?ITEM_CD=TEST&ITEM_NM=테스트&ITEM_GRP_CD=카테고리
   */
  @Get()
  async findAll(@Query() query: any) {
    console.log('Query params:', query);

    // 대소문자 모두 지원 (ITEM_CD/code, ITEM_NM/name, ITEM_GRP_CD/category)
    const code = query.ITEM_CD || query.code;
    const name = query.ITEM_NM || query.name;
    const category = query.ITEM_GRP_CD || query.category;
    const unit = query.unit;
    const isActive = query.isActive;

    // 검색 조건이 있는지 확인 (빈 문자열 제외)
    const hasSearchParams = (code && code.trim() !== '') ||
                           (name && name.trim() !== '') ||
                           (category && category.trim() !== '') ||
                           unit ||
                           isActive !== undefined;

    if (hasSearchParams) {
      const filters = {
        code: code && code.trim() !== '' ? code : undefined,
        name: name && name.trim() !== '' ? name : undefined,
        category: category && category.trim() !== '' ? category : undefined,
        unit: unit,
        isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined
      };
      console.log('Searching with filters:', filters);
      return this.stockBaseService.search(filters);
    }

    console.log('Returning all items');
    return this.stockBaseService.findAll();
  }

  /**
   * 카테고리 목록 조회 (드롭박스용)
   * GET /api/stock-base/categories
   */
  @Get('categories')
  async getCategories() {
    return this.stockBaseService.getCategories();
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string) {
    // 카테고리 파라미터 검증 (SQL 인젝션 방지)
    if (!/^[a-zA-Z0-9가-힣\s_-]+$/.test(category)) {
      throw new Error('Invalid category parameter');
    }
    return this.stockBaseService.findByCategory(category);
  }

  @Get(':code')
  async findOne(@Param('code') code: string) {
    // 코드 파라미터 검증 (SQL 인젝션 방지)
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      throw new Error('Invalid code parameter');
    }
    return this.stockBaseService.findOne(code);
  }

  // 품목 조회 및 저장 (POST)
  @Post()
  async handleRequest(@Body() body: any) {
    // 빈 객체나 빈 배열이면 전체 조회
    if (!body || (Array.isArray(body) && body.length === 0) || Object.keys(body).length === 0) {
      return this.stockBaseService.findAll();
    }
    // console.log(body);
    // 배열이면 일괄 저장 처리
 
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

// 유효한 데이터가 없으면 findAll 실행
    if (validData.length === 0) {
      return this.stockBaseService.findAll();
    }

    console.log(validData);
    return this.stockBaseService.save(validData);
  }

  @Post('single')
  async create(@Body() createStockBaseDto: CreateStockBaseDto) {
    return this.stockBaseService.create(createStockBaseDto);
  }

  @Put(':code')
  async update(@Param('code') code: string, @Body() updateStockBaseDto: UpdateStockBaseDto) {
    // 코드 파라미터 검증 (SQL 인젝션 방지)
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      throw new Error('Invalid code parameter');
    }
    return this.stockBaseService.update(code, updateStockBaseDto);
  }

  @Delete(':code')
  async remove(@Param('code') code: string) {
    // 코드 파라미터 검증 (SQL 인젝션 방지)
    if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
      throw new Error('Invalid code parameter');
    }
    return this.stockBaseService.remove(code);
  }
}
