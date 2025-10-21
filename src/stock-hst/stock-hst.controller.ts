import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { StockHstService } from './stock-hst.service';

@Controller('stock-hst')
export class StockHstController {
  constructor(private readonly stockHstService: StockHstService) {}

  // GET 메서드 (Query String)
  @Get()
  async getStockHistoryByQuery(@Query() filters: {
    START_DATE?: string;
    END_DATE?: string;
    ST_DT?: string;  // 프론트에서 ST_DT로 보내는 경우
    ED_DT?: string;  // 프론트에서 ED_DT로 보내는 경우
    IO_TYPE?: string;
    ITEM_CD?: string;
    ITEM_NM?: string;
  }) {
    // ST_DT, ED_DT를 START_DATE, END_DATE로 변환
    const normalizedFilters = {
      START_DATE: filters.START_DATE || filters.ST_DT,
      END_DATE: filters.END_DATE || filters.ED_DT,
      IO_TYPE: filters.IO_TYPE,
      ITEM_CD: filters.ITEM_CD,
      ITEM_NM: filters.ITEM_NM,
    };

    return this.stockHstService.getStockHistory(normalizedFilters);
  }

  // POST 메서드 (Body)
  @Post()
  async getStockHistoryByBody(@Body() filters: {
    START_DATE?: string;
    END_DATE?: string;
    IO_TYPE?: string;
    ITEM_CD?: string;
    ITEM_NM?: string;
  }) {
    return this.stockHstService.getStockHistory(filters);
  }
}
