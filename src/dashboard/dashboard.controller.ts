import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * 대시보드 전체 데이터 조회
   * GET /api/dashboard
   */
  @Get()
  async getDashboardData() {
    return this.dashboardService.getDashboardData();
  }

  /**
   * 발주 시급 재고 조회 (안전재고 이하)
   * GET /api/dashboard/low-stock
   */
  @Get('low-stock')
  async getLowStockItems() {
    return this.dashboardService.getLowStockItems();
  }

  /**
   * 유통기한 임박 재고 조회
   * GET /api/dashboard/expiring
   */
  @Get('expiring')
  async getExpiringItems() {
    return this.dashboardService.getExpiringItems();
  }

  /**
   * 전체 재고 요약 조회
   * GET /api/dashboard/summary
   */
  @Get('summary')
  async getTotalStockSummary() {
    return this.dashboardService.getTotalStockSummary();
  }

  /**
   * 최근 입출고 내역 조회
   * GET /api/dashboard/recent-transactions?limit=30
   */
  @Get('recent-transactions')
  async getRecentTransactions(@Query('limit') limit?: number) {
    const resultLimit = limit ? Number(limit) : 30;
    return this.dashboardService.getRecentTransactions(resultLimit);
  }
}
