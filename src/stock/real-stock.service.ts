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
   * @param itemGrpCode 카테고리 필터
   * @param itemCode 품목코드 필터
   * @param itemName 품목명 필터
   * @returns 품목별 재고 현황
   */
  async getStockStatus(itemGrpCode?: string, itemCode?: string, itemName?: string): Promise<any[]> {
    // stock_base를 기준으로 LEFT JOIN하여 재고가 0인 품목도 모두 표시
    const query = this.realStockRepository.manager
      .createQueryBuilder()
      .select([
        'stock_base.code AS stock_code',
        'stock_base.name AS stock_name',
        'stock_base.category AS category',
        'COALESCE(real_stock.quantity, 0) AS current_quantity',
        'COALESCE(real_stock.unit, stock_base.unit) AS unit',
        'stock_base.safety_stock AS safety_stock',
        `(
          SELECT COUNT(*)
          FROM wk_stock_hst
          WHERE wk_stock_hst.stock_code = stock_base.code
          AND wk_stock_hst.io_type = 'OUT'
        ) AS outbound_count`,
        `(
          SELECT COUNT(*)
          FROM wk_stock_hst
          WHERE wk_stock_hst.stock_code = stock_base.code
          AND wk_stock_hst.io_type = 'IN'
        ) AS inbound_count`,
        `CASE
          WHEN stock_base.safety_stock IS NOT NULL AND COALESCE(real_stock.quantity, 0) <= stock_base.safety_stock
          THEN true
          ELSE false
        END AS is_low_stock`,
        'COALESCE(real_stock.updated_at, stock_base."updatedAt") AS updated_at'
      ])
      .from('wk_stock_base', 'stock_base')
      .leftJoin('wk_real_stock', 'real_stock', 'real_stock.stock_code = stock_base.code');

    // 검색 필터 적용
    if (itemGrpCode && itemGrpCode.trim() !== '') {
      query.andWhere('stock_base.category = :itemGrpCode', { itemGrpCode });
    }

    if (itemCode && itemCode.trim() !== '') {
      query.andWhere('stock_base.code LIKE :itemCode', { itemCode: `%${itemCode}%` });
    }

    if (itemName && itemName.trim() !== '') {
      query.andWhere('stock_base.name LIKE :itemName', { itemName: `%${itemName}%` });
    }

    query.orderBy('stock_base.code', 'ASC');

    console.log('=== 재고현황 조회 SQL ===');
    console.log(query.getSql());
    console.log('검색 조건:', { itemGrpCode, itemCode, itemName });

    const result = await query.getRawMany();
    console.log('=== 재고현황 조회 결과 ===');
    console.log(`총 ${result.length}건`);

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

    // 2. 입출고 이력 조회 (유통기한 = 조제일자 + 최대사용기간)
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
        'handstock.preparation_date AS preparation_date',
        'stock_base.max_use_period AS max_use_period',
        `CASE
          WHEN handstock.preparation_date IS NOT NULL AND stock_base.max_use_period IS NOT NULL
          THEN handstock.preparation_date + stock_base.max_use_period * INTERVAL '1 day'
          ELSE NULL
        END AS expiry_date`
      ])
      .from('wk_stock_hst', 'stock_hst')
      .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
      .leftJoin('wk_stock_base', 'stock_base', 'stock_base.code = stock_hst.stock_code')
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
