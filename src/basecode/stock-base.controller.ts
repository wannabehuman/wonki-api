import { Controller, Get, Post, Put, Delete, Param, Body, ParseIntPipe, ValidationPipe } from '@nestjs/common';
import { StockBaseService } from './stock-base.service';
import { CreateStockBaseDto } from './dto/create-stock-base.dto';
import { UpdateStockBaseDto } from './dto/update-stock-base.dto';

@Controller('stock-base')
export class StockBaseController {
  constructor(private readonly stockBaseService: StockBaseService) {}

  @Get()
  async findAll() {
    return this.stockBaseService.findAll();
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
