import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Handstock } from '../inbound/entities/inbound.entity';
import { StockHst } from '../outbound/entities/outbound.entity';
import { StockBase } from '../basecode/entities/stock-base.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Handstock)
    private handstockRepository: Repository<Handstock>,
    @InjectRepository(StockHst)
    private stockHstRepository: Repository<StockHst>,
    @InjectRepository(StockBase)
    private stockBaseRepository: Repository<StockBase>,
  ) {}

  // 1. 발주 시급 재고 (안전재고 이하)
  async getLowStockItems(): Promise<any[]> {
    const query = `
      SELECT
        h.stock_code,
        sb.name as stock_name,
        sb.category,
        SUM(h.quantity) as current_stock,
        sb.safety_stock,
        sb.unit,
        (sb.safety_stock - SUM(h.quantity)) as shortage
      FROM wk_handstock h
      LEFT JOIN wk_stock_base sb ON h.stock_code = sb.code
      WHERE sb.safety_stock IS NOT NULL AND sb.safety_stock > 0
      GROUP BY h.stock_code, sb.name, sb.category, sb.safety_stock, sb.unit
      HAVING SUM(h.quantity) <= sb.safety_stock
      ORDER BY shortage DESC
      LIMIT 20
    `;

    const result = await this.handstockRepository.query(query);
    return result;
  }

  // 2. 유통기한 임박 재고 (최대 사용기간 기준)
  async getExpiringItems(): Promise<any[]> {
    const query = `
      SELECT
        h.inbound_no,
        h.stock_code,
        sb.name as stock_name,
        sb.category,
        h.quantity,
        h.unit,
        h.inbound_date,
        h.preparation_date,
        sb.max_use_period,
        CASE
          WHEN h.preparation_date IS NOT NULL THEN
            h.preparation_date + (sb.max_use_period || ' days')::interval
          ELSE
            h.inbound_date + (sb.max_use_period || ' days')::interval
        END as expiry_date,
        CASE
          WHEN h.preparation_date IS NOT NULL THEN
            EXTRACT(DAY FROM (h.preparation_date + (sb.max_use_period || ' days')::interval - CURRENT_DATE))
          ELSE
            EXTRACT(DAY FROM (h.inbound_date + (sb.max_use_period || ' days')::interval - CURRENT_DATE))
        END as days_until_expiry
      FROM wk_handstock h
      LEFT JOIN wk_stock_base sb ON h.stock_code = sb.code
      WHERE sb.max_use_period IS NOT NULL
        AND h.quantity > 0
        AND CASE
          WHEN h.preparation_date IS NOT NULL THEN
            h.preparation_date + (sb.max_use_period || ' days')::interval
          ELSE
            h.inbound_date + (sb.max_use_period || ' days')::interval
        END <= CURRENT_DATE + INTERVAL '30 days'
      ORDER BY days_until_expiry ASC
      LIMIT 20
    `;

    const result = await this.handstockRepository.query(query);
    return result;
  }

  // 3. 전체 재고 요약
  async getTotalStockSummary(): Promise<any> {
    const query = `
      SELECT
        COUNT(DISTINCT h.stock_code) as total_items,
        COUNT(DISTINCT h.inbound_no) as total_lots,
        SUM(h.quantity) as total_quantity,
        COUNT(DISTINCT CASE WHEN h.quantity > 0 THEN h.stock_code END) as active_items,
        COUNT(DISTINCT CASE WHEN h.quantity = 0 THEN h.stock_code END) as empty_items
      FROM wk_handstock h
    `;

    const result = await this.handstockRepository.query(query);
    return result[0] || {};
  }

  // 4. 최근 입출고 내역
  async getRecentTransactions(limit: number = 20): Promise<any[]> {
    const query = `
      SELECT
        'IN' as transaction_type,
        h.inbound_no as transaction_no,
        h.stock_code,
        sb.name as stock_name,
        h.quantity,
        h.unit,
        h.inbound_date as transaction_date,
        h.remark,
        h.created_at
      FROM wk_handstock h
      LEFT JOIN wk_stock_base sb ON h.stock_code = sb.code

      UNION ALL

      SELECT
        'OUT' as transaction_type,
        s.id::text as transaction_no,
        s.stock_code,
        sb.name as stock_name,
        s.quantity,
        s.unit,
        s.io_date as transaction_date,
        s.remark,
        s."createdAt" as created_at
      FROM wk_stock_hst s
      LEFT JOIN wk_stock_base sb ON s.stock_code = sb.code
      WHERE s.io_type = 'OUT'

      ORDER BY created_at DESC
      LIMIT $1
    `;

    const result = await this.handstockRepository.query(query, [limit]);
    return result;
  }

  // 대시보드 전체 데이터
  async getDashboardData(): Promise<any> {
    const [lowStock, expiring, summary, recentTransactions] = await Promise.all([
      this.getLowStockItems(),
      this.getExpiringItems(),
      this.getTotalStockSummary(),
      this.getRecentTransactions(30),
    ]);

    return {
      lowStock,
      expiring,
      summary,
      recentTransactions,
    };
  }
}
