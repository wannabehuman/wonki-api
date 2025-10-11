import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { InboundService } from './inbound.service';
import { CreateInboundDto } from './dto/create-inbound.dto';
import { UpdateInboundDto } from './dto/update-inbound.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('inbound')
export class InboundController {
  constructor(private readonly inboundService: InboundService) {}

  /**
   * 입고 조회 (GET)
   * GET /api/inbound
   * GET /api/inbound?startDate=2025-01-01&endDate=2025-12-31&itemCode=TEST001&itemName=테스트
   */
  @Get()
  async findAll(@Query() query: any) {
    // 검색 조건이 있는지 확인 (startDate/ST_DT, endDate/ED_DT, itemCode/ITEM_CD, itemName/ITEM_NM)
    const hasSearchParams = query.startDate || query.endDate || query.itemCode || query.itemName ||
                           query.ST_DT || query.ED_DT || query.ITEM_CD || query.ITEM_NM;

    if (hasSearchParams) {
      return this.inboundService.search({
        startDate: query.startDate || query.ST_DT,
        endDate: query.endDate || query.ED_DT,
        itemCode: query.itemCode || query.ITEM_CD,
        itemName: query.itemName || query.ITEM_NM
      });
    }

    return this.inboundService.findAll();
  }

  /**
   * 일별 입고 이력 집계 조회
   * GET /api/inbound/daily?year=2025&month=1
   */
  @Get('daily')
  async getDailyHistory(@Query('year') year: string, @Query('month') month: string) {
    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      throw new Error('Invalid year or month parameter');
    }

    return this.inboundService.getDailyInboundHistory(yearNum, monthNum);
  }

  /**
   * 재고코드별 입고 조회
   * GET /api/inbound/stock/:stock_code
   */
  @Get('stock/:stock_code')
  async findByStockCode(@Param('stock_code') stock_code: string) {
    return this.inboundService.findByStockCode(stock_code);
  }

  /**
   * 입고일자별 조회
   * GET /api/inbound/date/:inbound_date
   * 예: /api/inbound/date/2025-10-09
   */
  @Get('date/:inbound_date')
  async findByDate(@Param('inbound_date') inbound_date: string) {
    // 날짜 형식 검증 (SQL 인젝션 방지)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(inbound_date)) {
      throw new Error('Invalid date format. Use YYYY-MM-DD');
    }
    return this.inboundService.findByDate(new Date(inbound_date));
  }

  /**
   * 입고번호로 단일 조회
   * GET /api/inbound/:inbound_no
   * 예: /api/inbound/20251009001
   */
  @Get(':inbound_no')
  async findOne(@Param('inbound_no') inbound_no: string) {
    return this.inboundService.findOne(inbound_no);
  }

  /**
   * 입고 조회 및 저장 (POST)
   * POST /api/inbound
   * Body: Array<CreateInboundDto | UpdateInboundDto> or search params
   */
  @Post()
  async handleRequest(@Body() body: any, @CurrentUser() user?: any) {
    // 빈 객체나 빈 배열이면 전체 조회
    if (!body || (Array.isArray(body) && body.length === 0) || Object.keys(body).length === 0) {
      return this.inboundService.findAll();
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
      return this.inboundService.save(validData, user);
    }

    // 검색 조건이 있는지 확인 (startDate/ST_DT, endDate/ED_DT, itemCode/ITEM_CD, itemName/ITEM_NM)
    const hasSearchParams = body.startDate || body.endDate || body.itemCode || body.itemName ||
                           body.ST_DT || body.ED_DT || body.ITEM_CD || body.ITEM_NM;

    if (hasSearchParams) {
      return this.inboundService.search({
        startDate: body.startDate || body.ST_DT,
        endDate: body.endDate || body.ED_DT,
        itemCode: body.itemCode || body.ITEM_CD,
        itemName: body.itemName || body.ITEM_NM
      });
    }

    // 검색 조건도 없고 저장할 데이터도 없으면 전체 조회
    return this.inboundService.findAll();
  }

  /**
   * 입고 이력 조회
   * POST /api/inbound/history
   */
  @Post('history')
  async getHistory(@Body() body: any) {
    const { mode, ...filterData } = body;

    if (mode === 'SELECT' || mode === 'select') {
      if (filterData.stock_code) {
        return { data: await this.inboundService.findByStockCode(filterData.stock_code) };
      }
      if (filterData.startDate && filterData.endDate) {
        // TODO: 기간별 조회 로직 추가
        return { data: await this.inboundService.findAll() };
      }
      return { data: await this.inboundService.findAll() };
    }

    throw new Error('History endpoint only supports SELECT mode');
  }
}
