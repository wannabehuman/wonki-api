import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockHst } from '../outbound/entities/outbound.entity';

@Injectable()
export class StockHstService {
  constructor(
    @InjectRepository(StockHst)
    private stockHstRepository: Repository<StockHst>,
  ) {}

  async getStockHistory(filters: {
    START_DATE?: string;
    END_DATE?: string;
    IO_TYPE?: string;
    ITEM_CD?: string;
    ITEM_NM?: string;
  }) {
    try {
      // QueryBuilder를 사용하여 복잡한 조인 쿼리 작성
      const query = this.stockHstRepository.manager
        .createQueryBuilder()
        .select([
          'stock_hst.id AS id',
          'stock_hst.io_type AS io_type',
          'stock_hst.inbound_no AS inbound_no',
          'stock_hst.stock_code AS stock_code',
          'stock_base.name AS stock_name',
          'stock_hst.io_date AS io_date',
          'handstock.preparation_date AS preparation_date',
          'stock_hst.quantity AS quantity',
          'stock_hst.unit AS unit',
          `CASE
            WHEN handstock.preparation_date IS NOT NULL AND stock_base.max_use_period IS NOT NULL
            THEN handstock.preparation_date + stock_base.max_use_period * INTERVAL '1 day'
            ELSE NULL
          END AS expiry_date`,
          'stock_hst.remark AS remark',
          'stock_hst."createdAt" AS "createdAt"',
          'stock_hst."updatedAt" AS "updatedAt"',
          'creator.name AS created_by_name',
          'updater.name AS updated_by_name',
        ])
        .from('wk_stock_hst', 'stock_hst')
        .leftJoin('wk_stock_base', 'stock_base', 'stock_base.code = stock_hst.stock_code')
        .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
        .leftJoin('wk_user', 'creator', 'creator.id = stock_hst.created_by')
        .leftJoin('wk_user', 'updater', 'updater.id = stock_hst.updated_by')
        .where('1=1');

      // 필터 조건 추가
      if (filters.START_DATE) {
        query.andWhere('stock_hst.io_date >= :startDate', { startDate: filters.START_DATE });
      }

      if (filters.END_DATE) {
        query.andWhere('stock_hst.io_date <= :endDate', { endDate: filters.END_DATE });
      }

      if (filters.IO_TYPE) {
        query.andWhere('stock_hst.io_type = :ioType', { ioType: filters.IO_TYPE });
      }

      if (filters.ITEM_CD) {
        query.andWhere('stock_hst.stock_code LIKE :itemCd', { itemCd: `%${filters.ITEM_CD}%` });
      }

      if (filters.ITEM_NM) {
        query.andWhere('stock_base.name LIKE :itemNm', { itemNm: `%${filters.ITEM_NM}%` });
      }

      // 정렬: 최신순
      query
        .orderBy('stock_hst.io_date', 'DESC')
        .addOrderBy('stock_hst."createdAt"', 'DESC');

      const results = await query.getRawMany();

      return results;
    } catch (error) {
      console.error('Error fetching stock history:', error);
      throw error;
    }
  }
}
