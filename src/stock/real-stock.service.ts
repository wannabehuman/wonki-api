import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealStock } from './entities/real-stock.entity';

@Injectable()
export class RealStockService {
  constructor(
    @InjectRepository(RealStock)
    private readonly realStockRepository: Repository<RealStock>,
  ) {}

  /**
   * 재고현황 조회 (안전재고, 출고건수 포함)
   * @returns 품목별 재고 현황
   */
  async getStockStatus(): Promise<any[]> {
    const query = this.realStockRepository
      .createQueryBuilder('real_stock')
      .leftJoin('wk_stock_base', 'stock_base', 'stock_base.code = real_stock.stock_code')
      .select([
        'real_stock.stock_code AS stock_code',
        'stock_base.name AS stock_name',
        'stock_base.category AS category',
        'real_stock.quantity AS current_quantity',
        'real_stock.unit AS unit',
        'stock_base.safety_stock AS safety_stock',
        `(
          SELECT COUNT(*)
          FROM wk_stock_hst
          WHERE wk_stock_hst.stock_code = real_stock.stock_code
          AND wk_stock_hst.io_type = 'OUT'
        ) AS outbound_count`,
        `(
          SELECT COUNT(*)
          FROM wk_stock_hst
          WHERE wk_stock_hst.stock_code = real_stock.stock_code
          AND wk_stock_hst.io_type = 'IN'
        ) AS inbound_count`,
        `CASE
          WHEN stock_base.safety_stock IS NOT NULL AND real_stock.quantity <= stock_base.safety_stock
          THEN true
          ELSE false
        END AS is_low_stock`,
        'real_stock.updated_at AS updated_at'
      ])
      .orderBy('real_stock.stock_code', 'ASC');

    console.log('=== 재고현황 조회 SQL ===');
    console.log(query.getSql());

    const result = await query.getRawMany();
    console.log('=== 재고현황 조회 결과 ===');
    console.log(JSON.stringify(result, null, 2));

    return result;
  }

  /**
   * 품목별 입출고 이력 조회
   * @param stock_code 품목코드
   * @returns 입출고 이력
   */
  async getStockHistory(stock_code: string): Promise<any> {
    // 1. 현재 재고 정보 조회
    const currentStock = await this.realStockRepository
      .createQueryBuilder('real_stock')
      .leftJoin('wk_stock_base', 'stock_base', 'stock_base.code = real_stock.stock_code')
      .select([
        'real_stock.stock_code AS stock_code',
        'stock_base.name AS stock_name',
        'stock_base.category AS category',
        'real_stock.quantity AS current_quantity',
        'real_stock.unit AS unit',
        'stock_base.safety_stock AS safety_stock',
        'real_stock.created_at AS created_at',
        'real_stock.updated_at AS updated_at'
      ])
      .where('real_stock.stock_code = :stock_code', { stock_code })
      .getRawOne();

    if (!currentStock) {
      // real_stock에 없으면 stock_base에서라도 정보를 가져옴
      const stockBase = await this.realStockRepository.manager
        .createQueryBuilder()
        .select([
          'stock_base.code AS stock_code',
          'stock_base.name AS stock_name',
          'stock_base.category AS category',
          '0 AS current_quantity',
          'stock_base.unit AS unit',
          'stock_base.safety_stock AS safety_stock'
        ])
        .from('wk_stock_base', 'stock_base')
        .where('stock_base.code = :stock_code', { stock_code })
        .getRawOne();

      if (!stockBase) {
        return {
          stock_info: null,
          history: []
        };
      }

      currentStock.stock_code = stockBase.stock_code;
      currentStock.stock_name = stockBase.stock_name;
      currentStock.category = stockBase.category;
      currentStock.current_quantity = 0;
      currentStock.unit = stockBase.unit;
      currentStock.safety_stock = stockBase.safety_stock;
    }

    // 2. 입출고 이력 조회
    const historyQuery = this.realStockRepository.manager
      .createQueryBuilder()
      .select([
        'stock_hst.id AS id',
        'stock_hst.inbound_no AS inbound_no',
        'stock_hst.io_date AS io_date',
        'stock_hst.io_type AS io_type',
        'stock_hst.quantity AS quantity',
        'stock_hst.unit AS unit',
        'stock_hst.remark AS remark',
        'stock_hst."createdAt" AS created_at',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date'
      ])
      .from('wk_stock_hst', 'stock_hst')
      .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
      .where('stock_hst.stock_code = :stock_code', { stock_code })
      .orderBy('stock_hst.io_date', 'DESC')
      .addOrderBy('stock_hst."createdAt"', 'DESC');

    console.log('=== 이력 조회 SQL ===');
    console.log(historyQuery.getSql());
    console.log('stock_code:', stock_code);

    const history = await historyQuery.getRawMany();
    console.log('=== 이력 조회 결과 ===');
    console.log('history count:', history.length);
    console.log(JSON.stringify(history, null, 2));

    // 3. 입고 건수 및 총 입고량
    const inboundSummary = await this.realStockRepository.manager
      .createQueryBuilder()
      .select([
        'COUNT(*) AS inbound_count',
        'SUM(quantity) AS total_inbound_quantity'
      ])
      .from('wk_stock_hst', 'stock_hst')
      .where('stock_hst.stock_code = :stock_code', { stock_code })
      .andWhere('stock_hst.io_type = :io_type', { io_type: 'IN' })
      .getRawOne();

    // 4. 출고 건수 및 총 출고량
    const outboundSummary = await this.realStockRepository.manager
      .createQueryBuilder()
      .select([
        'COUNT(*) AS outbound_count',
        'SUM(quantity) AS total_outbound_quantity'
      ])
      .from('wk_stock_hst', 'stock_hst')
      .where('stock_hst.stock_code = :stock_code', { stock_code })
      .andWhere('stock_hst.io_type = :io_type', { io_type: 'OUT' })
      .getRawOne();

    return {
      stock_info: {
        ...currentStock,
        inbound_count: parseInt(inboundSummary?.inbound_count || '0'),
        total_inbound_quantity: parseFloat(inboundSummary?.total_inbound_quantity || '0'),
        outbound_count: parseInt(outboundSummary?.outbound_count || '0'),
        total_outbound_quantity: parseFloat(outboundSummary?.total_outbound_quantity || '0'),
        is_low_stock: currentStock.safety_stock
          ? currentStock.current_quantity <= currentStock.safety_stock
          : false
      },
      history
    };
  }

  /**
   * 안전재고 미만 품목 조회
   * @returns 안전재고 미만 품목 목록
   */
  async getLowStockItems(): Promise<any[]> {
    const result = await this.realStockRepository
      .createQueryBuilder('real_stock')
      .leftJoin('wk_stock_base', 'stock_base', 'stock_base.code = real_stock.stock_code')
      .select([
        'real_stock.stock_code AS stock_code',
        'stock_base.name AS stock_name',
        'stock_base.category AS category',
        'real_stock.quantity AS current_quantity',
        'real_stock.unit AS unit',
        'stock_base.safety_stock AS safety_stock',
        '(stock_base.safety_stock - real_stock.quantity) AS shortage',
        'real_stock.updated_at AS updated_at'
      ])
      .where('stock_base.safety_stock IS NOT NULL')
      .andWhere('real_stock.quantity <= stock_base.safety_stock')
      .orderBy('(stock_base.safety_stock - real_stock.quantity)', 'DESC')
      .getRawMany();

    return result;
  }
}
