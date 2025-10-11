import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { OutboundService } from './outbound.service';
import { CreateOutboundDto } from './dto/create-outbound.dto';
import { UpdateOutboundDto } from './dto/update-outbound.dto';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('outbound')
export class OutboundController {
  constructor(private readonly outboundService: OutboundService) {}

  /**
   * 출고 조회 (GET)
   * GET /api/outbound
   * GET /api/outbound?startDate=2025-01-01&endDate=2025-12-31&itemCode=TEST001&itemName=테스트
   */
  @Get()
  async findAll(@Query() query: any) {
    // 검색 조건이 있는지 확인 (startDate/ST_DT, endDate/ED_DT, itemCode/ITEM_CD, itemName/ITEM_NM)
    const hasSearchParams = query.startDate || query.endDate || query.itemCode || query.itemName ||
                           query.ST_DT || query.ED_DT || query.ITEM_CD || query.ITEM_NM;

    if (hasSearchParams) {
      return this.outboundService.search({
        startDate: query.startDate || query.ST_DT,
        endDate: query.endDate || query.ED_DT,
        itemCode: query.itemCode || query.ITEM_CD,
        itemName: query.itemName || query.ITEM_NM
      });
    }

    return this.outboundService.findAll();
  }

  @Get('stock/:stock_code')
  async findByStock(@Param('stock_code') stock_code: string) {
    return this.outboundService.findByStock(stock_code);
  }

  @Get('date/:io_date')
  async findByDate(@Param('io_date') io_date: string) {
    return this.outboundService.findByDate(new Date(io_date));
  }

  @Get(':id')
  async findOne(@Param('id') id: number) {
    return this.outboundService.findOne(id);
  }

  /**
   * 출고 조회 및 저장 (POST)
   * POST /api/outbound
   * Body: Array<CreateOutboundDto | UpdateOutboundDto> or search params
   */
  @Post()
  async handleRequest(@Body() body: any, @CurrentUser() user?: any) {
    // 빈 객체나 빈 배열이면 전체 조회
    if (!body || (Array.isArray(body) && body.length === 0) || Object.keys(body).length === 0) {
      return this.outboundService.findAll();
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
      return this.outboundService.save(validData, user);
    }

    // 검색 조건이 있는지 확인 (startDate/ST_DT, endDate/ED_DT, itemCode/ITEM_CD, itemName/ITEM_NM)
    const hasSearchParams = body.startDate || body.endDate || body.itemCode || body.itemName ||
                           body.ST_DT || body.ED_DT || body.ITEM_CD || body.ITEM_NM;

    if (hasSearchParams) {
      return this.outboundService.search({
        startDate: body.startDate || body.ST_DT,
        endDate: body.endDate || body.ED_DT,
        itemCode: body.itemCode || body.ITEM_CD,
        itemName: body.itemName || body.ITEM_NM
      });
    }

    // 검색 조건도 없고 저장할 데이터도 없으면 전체 조회
    return this.outboundService.findAll();
  }

  @Post('single')
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createOutboundDto: CreateOutboundDto) {
    return this.outboundService.create(createOutboundDto);
  }

  @Put(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: number,
    @Body() updateOutboundDto: UpdateOutboundDto
  ) {
    return this.outboundService.update(id, updateOutboundDto);
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  async remove(@Param('id') id: number) {
    return this.outboundService.remove(id);
  }
}
