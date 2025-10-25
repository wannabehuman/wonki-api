import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RealStockService } from './real-stock.service';

@Controller('real-stock')
export class RealStockController {
  constructor(private readonly realStockService: RealStockService) {}

  /**
   * 재고현황 조회 (안전재고, 출고건수 포함)
   * GET /api/real-stock/status?itemGrpCode=xxx&itemCode=xxx&itemName=xxx
   */
  @Get('status')
  // @UseGuards(AuthGuard('jwt'))
  async getStockStatus(
    @Query('itemGrpCode') itemGrpCode?: string,
    @Query('itemCode') itemCode?: string,
    @Query('itemName') itemName?: string,
  ) {
    return this.realStockService.getStockStatus(itemGrpCode, itemCode, itemName);
  }

  /**
   * 품목별 입출고 이력 조회
   * GET /api/real-stock/history/:stock_code
   */
  @Get('history/:stock_code')
  // @UseGuards(AuthGuard('jwt'))
  async getStockHistory(@Param('stock_code') stock_code: string) {
    return this.realStockService.getStockHistory(stock_code);
  }

  /**
   * 안전재고 미만 품목 조회
   * GET /api/real-stock/low-stock
   */
  @Get('low-stock')
  // @UseGuards(AuthGuard('jwt'))
  async getLowStockItems() {
    return this.realStockService.getLowStockItems();
  }
}
