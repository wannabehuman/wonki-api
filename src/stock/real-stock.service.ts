import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RealStock } from './entities/real-stock.entity';
import * as ExcelJS from 'exceljs';

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
    let currentStock = await this.realStockRepository
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

      // real_stock에 없어도 stock_base 정보를 사용하여 계속 진행
      currentStock = {
        stock_code: stockBase.stock_code,
        stock_name: stockBase.stock_name,
        category: stockBase.category,
        current_quantity: 0,
        unit: stockBase.unit,
        safety_stock: stockBase.safety_stock,
        created_at: null,
        updated_at: null
      };
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
        'stock_hst."updatedAt" AS updated_at',
        'creator.name AS created_by_name',
        'updater.name AS updated_by_name',
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
      .leftJoin('wk_user', 'creator', 'creator.id = stock_hst.created_by')
      .leftJoin('wk_user', 'updater', 'updater.id = stock_hst.updated_by')
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

  /**
   * 엑셀 export용 재고 상세 데이터 조회
   * 품목별로 입고번호(lot)별 수량 포함
   */
  async getStockDetailForExport(itemGrpCode?: string, itemCode?: string, itemName?: string): Promise<any[]> {
    const query = this.realStockRepository.manager
      .createQueryBuilder()
      .select([
        'stock_base.code AS stock_code',
        'stock_base.name AS stock_name',
        'stock_base.category AS category',
        'category_detail.code_name AS category_name',
        // 'stock_base.unit AS unit',
        'handstock.inbound_no AS inbound_no',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'handstock.quantity AS quantity',
        'handstock.remark AS remark',
        `CASE
          WHEN handstock.preparation_date IS NOT NULL AND stock_base.max_use_period IS NOT NULL
          THEN handstock.preparation_date + stock_base.max_use_period * INTERVAL '1 day'
          ELSE NULL
        END AS expiry_date`
      ])
      .from('wk_stock_base', 'stock_base')
      .leftJoin('wk_handstock', 'handstock', 'handstock.stock_code = stock_base.code')
      .leftJoin('wk_code_detail', 'category_detail', 'category_detail.code = stock_base.category AND category_detail.grp_code = :groupCode', { groupCode: 'HERBER_KIND' })
      .where('handstock.quantity > 0') // 재고가 있는 것만

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

    query
      .orderBy(`CASE WHEN category_detail.code_name = '기타' THEN 1 ELSE 0 END`, 'ASC')
      .addOrderBy('category_detail.code_name', 'ASC')
      .addOrderBy('stock_base.name', 'ASC')
      .addOrderBy('handstock.inbound_no', 'ASC');

    const result = await query.getRawMany();
    return result;
  }

  /**
   * 재고현황 엑셀 파일 생성
   */
  async exportStockToExcel(itemGrpCode?: string, itemCode?: string, itemName?: string): Promise<Buffer> {
    // 데이터 조회 (이미 카테고리명 → 품목명 → 입고번호 순으로 정렬됨)
    const data = await this.getStockDetailForExport(itemGrpCode, itemCode, itemName);

    // 카테고리별, 품목별로 그룹핑
    const categoryMap = new Map<string, Map<string, any[]>>();
    data.forEach(row => {
      const categoryName = row.category_name || '미분류';
      const stockCode = row.stock_code;

      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, new Map());
      }
      const stockMap = categoryMap.get(categoryName);

      if (!stockMap.has(stockCode)) {
        stockMap.set(stockCode, []);
      }
      stockMap.get(stockCode).push(row);
    });

    // 워크북 생성
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('재고현황');

    // 헤더 스타일
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4472C4' } },
      alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
      border: {
        top: { style: 'thin' as const },
        left: { style: 'thin' as const },
        bottom: { style: 'thin' as const },
        right: { style: 'thin' as const }
      }
    };

    // 컬럼 정의
    worksheet.columns = [
      { header: '카테고리', key: 'category_name', width: 15 },
      { header: '품목명', key: 'stock_name', width: 25 },
      { header: '재고수량', key: 'total', width: 12 },
      { header: '입고번호', key: 'inbound_no', width: 15 },
      { header: '수량', key: 'quantity', width: 10 },
      { header: '입고일자', key: 'inbound_date', width: 12 },
      { header: '조제일자', key: 'preparation_date', width: 12 },
      { header: '유통기한', key: 'expiry_date', width: 12 },
      { header: '단위', key: 'unit', width: 8 },
      { header: '비고', key: 'remark', width: 20 }
    ];

    // 헤더 스타일 적용
    worksheet.getRow(1).eachCell(cell => {
      cell.style = headerStyle;
    });

    let currentRow = 2;

    // 카테고리별 병합 범위 추적
    const categoryMergeRanges: Array<{startRow: number, endRow: number}> = [];

    // 데이터 삽입 및 병합셀 처리
    categoryMap.forEach((stockMap) => {
      const categoryStartRow = currentRow;

      // 카테고리 내의 각 품목 처리
      stockMap.forEach((rows) => {
        const stockStartRow = currentRow;
        const rowCount = rows.length;

        // 합계 계산
        const total = rows.reduce((sum, row) => sum + Number(row.quantity), 0);

        rows.forEach((row) => {
          const rowData = {
            category_name: row.category_name || '미분류',
            stock_name: row.stock_name,
            total: total,
            inbound_no: row.inbound_no,
            quantity: Number(row.quantity),
            inbound_date: row.inbound_date ? new Date(row.inbound_date).toISOString().split('T')[0] : '',
            preparation_date: row.preparation_date ? new Date(row.preparation_date).toISOString().split('T')[0] : '',
            expiry_date: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : '',
            unit: row.unit || '',
            remark: row.remark || ''
          };

          worksheet.addRow(rowData);
          currentRow++;
        });

        // 품목명과 재고수량 병합
        if (rowCount > 1) {
          worksheet.mergeCells(`B${stockStartRow}:B${stockStartRow + rowCount - 1}`); // 품목명
          worksheet.mergeCells(`C${stockStartRow}:C${stockStartRow + rowCount - 1}`); // 재고수량
        }
      });

      // 카테고리 병합 범위 저장
      const categoryEndRow = currentRow - 1;
      if (categoryEndRow >= categoryStartRow) {
        categoryMergeRanges.push({ startRow: categoryStartRow, endRow: categoryEndRow });
      }
    });

    // 카테고리명 병합 적용
    categoryMergeRanges.forEach(range => {
      if (range.endRow > range.startRow) {
        worksheet.mergeCells(`A${range.startRow}:A${range.endRow}`);
      }
    });

    // 전체 셀 스타일 적용
    for (let row = 2; row < currentRow; row++) {
      // 카테고리명, 품목명, 재고수량 (중앙 정렬)
      ['A', 'B'].forEach(col => {
        const cell = worksheet.getCell(`${col}${row}`);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 재고수량 (오른쪽 정렬)
      const cellC = worksheet.getCell(`C${row}`);
      cellC.alignment = { vertical: 'middle', horizontal: 'right' };
      cellC.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };

      // 나머지 셀 (중앙 정렬)
      ['D', 'F', 'G', 'H', 'I', 'J'].forEach(col => {
        const cell = worksheet.getCell(`${col}${row}`);
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // 수량(E)은 오른쪽 정렬
      const cellE = worksheet.getCell(`E${row}`);
      cellE.alignment = { vertical: 'middle', horizontal: 'right' };
      cellE.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    }

    // 버퍼로 변환
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }
}
