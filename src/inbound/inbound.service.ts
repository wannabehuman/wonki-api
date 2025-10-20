import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Handstock } from './entities/inbound.entity';
import { CreateInboundDto } from './dto/create-inbound.dto';
import { UpdateInboundDto } from './dto/update-inbound.dto';
import { LogService } from '../log/log.service';
import { StockHst } from '../outbound/entities/outbound.entity';
import { RealStock } from '../stock/entities/real-stock.entity';

@Injectable()
export class InboundService {
  constructor(
    @InjectRepository(Handstock)
    private readonly inboundRepository: Repository<Handstock>,
    @InjectRepository(StockHst)
    private readonly stockHstRepository: Repository<StockHst>,
    @InjectRepository(RealStock)
    private readonly realStockRepository: Repository<RealStock>,
    private readonly logService: LogService,
  ) {}

  /**
   * real_stock 업데이트 (입고 시 재고 증가)
   */
  private async updateRealStock(stock_code: string, quantity: number, unit: string): Promise<void> {
    let realStock = await this.realStockRepository.findOne({
      where: { stock_code }
    });

    if (realStock) {
      // 기존 재고가 있으면 수량 증가
      realStock.quantity = Number(realStock.quantity) + Number(quantity);
      realStock.unit = unit;
    } else {
      // 없으면 새로 생성
      realStock = this.realStockRepository.create({
        stock_code,
        quantity,
        unit
      });
    }

    await this.realStockRepository.save(realStock);
  }

  /**
   * real_stock 복원 (입고 취소 시 재고 감소)
   */
  private async revertRealStock(stock_code: string, quantity: number): Promise<void> {
    const realStock = await this.realStockRepository.findOne({
      where: { stock_code }
    });

    if (realStock) {
      realStock.quantity = Number(realStock.quantity) - Number(quantity);
      // 재고가 0 이하가 되면 삭제
      if (realStock.quantity <= 0) {
        await this.realStockRepository.remove(realStock);
      } else {
        await this.realStockRepository.save(realStock);
      }
    }
  }

  /**
   * 채번 생성: yyyyMMdd + 일련번호 (예: 20251009001)
   */
  private async generateInboundNo(date: Date): Promise<string> {
    // 날짜를 yyyyMMdd 형식으로 변환
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const datePrefix = `${year}${month}${day}`;

    // 해당 날짜의 마지막 번호 조회 (SQL 인젝션 방지를 위해 Like 사용)
    const lastInbound = await this.inboundRepository
      .createQueryBuilder('inbound')
      .where('inbound.inbound_no LIKE :prefix', { prefix: `${datePrefix}%` })
      .orderBy('inbound.inbound_no', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastInbound) {
      // 마지막 3자리를 추출하여 +1
      const lastSequence = parseInt(lastInbound.inbound_no.slice(-3), 10);
      sequence = lastSequence + 1;
    }

    // 일련번호를 3자리로 패딩
    const sequenceStr = String(sequence).padStart(3, '0');
    return `${datePrefix}${sequenceStr}`;
  }

  /**
   * 전체 조회 (품목명 포함)
   */
  async findAll(): Promise<any[]> {
    const result = await this.inboundRepository
      .createQueryBuilder('handstock')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = handstock.stock_code')
      .select([
        'handstock.inbound_no AS inbound_no',
        'handstock.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'handstock.quantity AS quantity',
        'handstock.unit AS unit',
        'stock.max_use_period AS max_use_period',
        `CASE
          WHEN handstock.preparation_date IS NOT NULL AND stock.max_use_period IS NOT NULL
          THEN handstock.preparation_date + stock.max_use_period
          ELSE NULL
        END AS expiry_date`,
        'handstock.remark AS remark',
        'handstock.created_at AS created_at'
      ])
      .orderBy('handstock.inbound_no', 'DESC')
      .getRawMany();

    return result;
  }

  /**
   * 검색 조건에 따른 조회 (like 검색 지원)
   */
  async search(filterData: {
    startDate?: string;
    endDate?: string;
    itemCode?: string;
    itemName?: string;
  }): Promise<any[]> {
    const queryBuilder = this.inboundRepository
      .createQueryBuilder('handstock')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = handstock.stock_code')
      .select([
        'handstock.inbound_no AS inbound_no',
        'handstock.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'handstock.quantity AS quantity',
        'handstock.unit AS unit',
        'stock.max_use_period AS max_use_period',
        `CASE
          WHEN handstock.preparation_date IS NOT NULL AND stock.max_use_period IS NOT NULL
          THEN handstock.preparation_date + stock.max_use_period
          ELSE NULL
        END AS expiry_date`,
        'handstock.remark AS remark',
        'handstock.created_at AS created_at'
      ]);

    // 날짜 범위 검색
    if (filterData.startDate) {
      const startDate = new Date(filterData.startDate);
      startDate.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('handstock.inbound_date >= :startDate', { startDate });
    }

    if (filterData.endDate) {
      const endDate = new Date(filterData.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('handstock.inbound_date <= :endDate', { endDate });
    }

    // 품목코드 like 검색
    if (filterData.itemCode) {
      queryBuilder.andWhere('handstock.stock_code LIKE :itemCode', {
        itemCode: `%${filterData.itemCode}%`
      });
    }

    // 품목명 like 검색
    if (filterData.itemName) {
      queryBuilder.andWhere('stock.name LIKE :itemName', {
        itemName: `%${filterData.itemName}%`
      });
    }

    const result = await queryBuilder
      .orderBy('handstock.inbound_no', 'DESC')
      .getRawMany();

    return result;
  }

  /**
   * 재고코드별 조회 (품목명 포함)
   */
  async findByStockCode(stock_code: string): Promise<any[]> {
    // SQL 인젝션 방지: 파라미터 검증
    if (!/^[a-zA-Z0-9_-]+$/.test(stock_code)) {
      throw new BadRequestException('Invalid stock_code parameter');
    }

    const result = await this.inboundRepository
      .createQueryBuilder('handstock')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = handstock.stock_code')
      .select([
        'handstock.inbound_no AS inbound_no',
        'handstock.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'handstock.quantity AS quantity',
        'handstock.unit AS unit',
        'stock.max_use_period AS max_use_period',
        `CASE
          WHEN handstock.preparation_date IS NOT NULL AND stock.max_use_period IS NOT NULL
          THEN handstock.preparation_date + stock.max_use_period
          ELSE NULL
        END AS expiry_date`,
        'handstock.remark AS remark',
        'handstock.created_at AS created_at'
      ])
      .where('handstock.stock_code = :stock_code', { stock_code })
      .orderBy('handstock.inbound_no', 'DESC')
      .getRawMany();

    return result;
  }

  /**
   * 입고일자별 조회 (품목명 포함)
   */
  async findByDate(inbound_date: Date): Promise<any[]> {
    const normalizedDate = new Date(inbound_date);
    normalizedDate.setHours(0, 0, 0, 0);

    const result = await this.inboundRepository
      .createQueryBuilder('handstock')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = handstock.stock_code')
      .select([
        'handstock.inbound_no AS inbound_no',
        'handstock.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'handstock.quantity AS quantity',
        'handstock.unit AS unit',
        'stock.max_use_period AS max_use_period',
        `CASE
          WHEN handstock.preparation_date IS NOT NULL AND stock.max_use_period IS NOT NULL
          THEN handstock.preparation_date + stock.max_use_period
          ELSE NULL
        END AS expiry_date`,
        'handstock.remark AS remark',
        'handstock.created_at AS created_at'
      ])
      .where('handstock.inbound_date = :inbound_date', { inbound_date: normalizedDate })
      .orderBy('handstock.inbound_no', 'DESC')
      .getRawMany();

    return result;
  }

  /**
   * 단일 조회 (입고번호로)
   */
  async findOne(inbound_no: string): Promise<Handstock> {
    // SQL 인젝션 방지: 파라미터 검증
    if (!/^\d{11}$/.test(inbound_no)) {
      throw new BadRequestException('Invalid inbound_no parameter');
    }

    const inbound = await this.inboundRepository.findOne({
      where: { inbound_no },
    });

    if (!inbound) {
      throw new NotFoundException(`입고번호 ${inbound_no}을(를) 찾을 수 없습니다.`);
    }

    return inbound;
  }

  /**
   * 일괄 저장 (INSERT/UPDATE/DELETE 처리)
   */
  async save(inboundDtos: any[], user?: any) {
    const results: any[] = [];

    for (const inboundDto of inboundDtos) {
      const status = inboundDto.rowStatus || inboundDto.ROW_STATUS;

      try {
        if (status === 'I') {
          // INSERT: 새로운 입고 생성
          const { rowStatus, ROW_STATUS, unicId, Del_Check, ...createData } = inboundDto;
          const result = await this.create(createData as CreateInboundDto, user);
          results.push({ code: true, data: result });
        } else if (status === 'U') {
          // UPDATE: 기존 입고 수정
          const { rowStatus, ROW_STATUS, unicId, Del_Check, inbound_no, ...updateData } = inboundDto;
          if (!inbound_no) {
            throw new BadRequestException('UPDATE 시 입고번호는 필수입니다.');
          }
          const result = await this.update(inbound_no, updateData as UpdateInboundDto, user);
          results.push({ code: true, data: result });
        } else if (status === 'D') {
          // DELETE: 입고 삭제
          const inbound_no = inboundDto.inbound_no;
          if (!inbound_no) {
            throw new BadRequestException('DELETE 시 입고번호는 필수입니다.');
          }
          await this.remove(inbound_no, user);
          results.push({ code: true, data: { inbound_no, deleted: true } });
        }
      } catch (error) {
        results.push({
          code: false,
          data: inboundDto,
          message: error.message
        });
      }
    }

    return results;
  }

  /**
   * 생성
   */
  async create(createInboundDto: CreateInboundDto, user?: any): Promise<Handstock> {
    // 날짜 정규화
    const inboundDate = new Date(createInboundDto.inbound_date);
    if (isNaN(inboundDate.getTime())) {
      throw new BadRequestException('올바른 입고일자 형식이 아닙니다.');
    }
    inboundDate.setHours(0, 0, 0, 0);

    // 조제일자 정규화 (있는 경우)
    let preparationDate: Date | undefined;
    if (createInboundDto.preparation_date) {
      preparationDate = new Date(createInboundDto.preparation_date);
      if (isNaN(preparationDate.getTime())) {
        throw new BadRequestException('올바른 조제일자 형식이 아닙니다.');
      }
      preparationDate.setHours(0, 0, 0, 0);
    }

    // 채번 생성
    const inboundNo = await this.generateInboundNo(inboundDate);

    // 엔티티 생성
    const newInbound = this.inboundRepository.create({
      inbound_no: inboundNo,
      stock_code: createInboundDto.stock_code,
      inbound_date: inboundDate,
      preparation_date: preparationDate,
      quantity: createInboundDto.quantity,
      unit: createInboundDto.unit,
      remark: createInboundDto.remark,
    });

    const savedInbound = await this.inboundRepository.save(newInbound);

    // real_stock 업데이트 (재고 증가)
    await this.updateRealStock(savedInbound.stock_code, savedInbound.quantity, savedInbound.unit);

    // 입고 이력 기록 (stock_hst에 기록)
    const stockHst = this.stockHstRepository.create({
      inbound_no: savedInbound.inbound_no,
      stock_code: savedInbound.stock_code,
      io_date: savedInbound.inbound_date,
      io_type: 'IN',
      quantity: savedInbound.quantity,
      unit: savedInbound.unit,
      remark: savedInbound.remark,
    });
    await this.stockHstRepository.save(stockHst);

    // 로그 기록
    await this.logService.log({
      userId: user?.userId || user?.id,
      username: user?.username || user?.name,
      tableName: 'wk_handstock',
      recordId: savedInbound.inbound_no,
      operation: 'INSERT',
      newValue: savedInbound,
      description: `입고 등록: ${savedInbound.inbound_no}`,
    });

    return savedInbound;
  }

  /**
   * 수정
   */
  async update(inbound_no: string, updateInboundDto: UpdateInboundDto, user?: any): Promise<Handstock> {
    const existingInbound = await this.findOne(inbound_no);
    const oldValue = { ...existingInbound };
    const oldStockCode = existingInbound.stock_code;
    const oldQuantity = existingInbound.quantity;

    // 수정 가능한 필드만 업데이트
    if (updateInboundDto.stock_code !== undefined) {
      existingInbound.stock_code = updateInboundDto.stock_code;
    }
    if (updateInboundDto.quantity !== undefined) {
      existingInbound.quantity = updateInboundDto.quantity;
    }
    if (updateInboundDto.unit !== undefined) {
      existingInbound.unit = updateInboundDto.unit;
    }
    if (updateInboundDto.inbound_date !== undefined) {
      const inboundDate = new Date(updateInboundDto.inbound_date);
      if (isNaN(inboundDate.getTime())) {
        throw new BadRequestException('올바른 입고일자 형식이 아닙니다.');
      }
      inboundDate.setHours(0, 0, 0, 0);
      existingInbound.inbound_date = inboundDate;
    }
    if (updateInboundDto.preparation_date !== undefined) {
      const preparationDate = new Date(updateInboundDto.preparation_date);
      if (isNaN(preparationDate.getTime())) {
        throw new BadRequestException('올바른 조제일자 형식이 아닙니다.');
      }
      preparationDate.setHours(0, 0, 0, 0);
      existingInbound.preparation_date = preparationDate;
    }
    if (updateInboundDto.remark !== undefined) {
      existingInbound.remark = updateInboundDto.remark;
    }

    const updatedInbound = await this.inboundRepository.save(existingInbound);

    // real_stock 업데이트
    // 품목코드가 변경된 경우
    if (oldStockCode !== updatedInbound.stock_code) {
      // 기존 품목 재고 감소
      await this.revertRealStock(oldStockCode, oldQuantity);
      // 새 품목 재고 증가
      await this.updateRealStock(updatedInbound.stock_code, updatedInbound.quantity, updatedInbound.unit);
    } else if (oldQuantity !== updatedInbound.quantity) {
      // 품목코드는 같지만 수량이 변경된 경우
      const quantityDiff = updatedInbound.quantity - oldQuantity;
      if (quantityDiff > 0) {
        await this.updateRealStock(updatedInbound.stock_code, quantityDiff, updatedInbound.unit);
      } else {
        await this.revertRealStock(updatedInbound.stock_code, Math.abs(quantityDiff));
      }
    }

    // 로그 기록
    await this.logService.log({
      userId: user?.userId || user?.id,
      username: user?.username || user?.name,
      tableName: 'wk_handstock',
      recordId: inbound_no,
      operation: 'UPDATE',
      oldValue: oldValue,
      newValue: updatedInbound,
      description: `입고 수정: ${inbound_no}`,
    });

    return updatedInbound;
  }

  /**
   * 삭제
   */
  async remove(inbound_no: string, user?: any): Promise<void> {
    const existingInbound = await this.findOne(inbound_no);
    const oldValue = { ...existingInbound };

    // real_stock에서 재고 감소
    await this.revertRealStock(existingInbound.stock_code, existingInbound.quantity);

    await this.inboundRepository.remove(existingInbound);

    // 로그 기록
    await this.logService.log({
      userId: user?.userId || user?.id,
      username: user?.username || user?.name,
      tableName: 'wk_handstock',
      recordId: inbound_no,
      operation: 'DELETE',
      oldValue: oldValue,
      description: `입고 삭제: ${inbound_no}`,
    });
  }

  /**
   * 현재고 조회 (품목별 집계)
   * wk_handstock 테이블의 quantity를 품목별로 합산하여 반환
   * @returns 품목별 현재 재고 수량
   */
  async getCurrentStock(): Promise<any[]> {
    const result = await this.inboundRepository
      .createQueryBuilder('handstock')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = handstock.stock_code')
      .select([
        'handstock.stock_code AS stock_code',
        'stock.name AS stock_name',
        'stock.category AS category',
        'stock.unit AS unit',
        'SUM(handstock.quantity) AS quantity',
        'COUNT(handstock.inbound_no) AS inbound_count'
      ])
      .groupBy('handstock.stock_code, stock.name, stock.category, stock.unit')
      .having('SUM(handstock.quantity) > 0')  // 재고가 0보다 큰 품목만 표시
      .orderBy('handstock.stock_code', 'ASC')
      .getRawMany();

    return result;
  }

  /**
   * 일별 입고 이력 집계 (년월 기준)
   * @param year 년도 (예: 2025)
   * @param month 월 (1-12)
   * @returns 품목별 일별 입고 수량
   */
  async getDailyInboundHistory(year: number, month: number): Promise<any[]> {
    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0); // 해당 월의 마지막 날
    endDate.setHours(23, 59, 59, 999);

    const daysInMonth = endDate.getDate();

    // 해당 기간의 입고 데이터 조회
    const inboundData = await this.inboundRepository
      .createQueryBuilder('handstock')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = handstock.stock_code')
      .select([
        'handstock.stock_code AS stock_code',
        'stock.name AS stock_name',
        'EXTRACT(DAY FROM handstock.inbound_date) AS day',
        'SUM(handstock.quantity) AS quantity'
      ])
      .where('handstock.inbound_date >= :startDate', { startDate })
      .andWhere('handstock.inbound_date <= :endDate', { endDate })
      .groupBy('handstock.stock_code, stock.name, EXTRACT(DAY FROM handstock.inbound_date)')
      .getRawMany();

    // 품목별로 그룹화하고 일별 데이터 구조화
    const stockMap = new Map<string, any>();

    inboundData.forEach((row) => {
      const stockCode = row.stock_code;
      const day = parseInt(row.day);
      const quantity = parseInt(row.quantity);

      if (!stockMap.has(stockCode)) {
        stockMap.set(stockCode, {
          stock_code: stockCode,
          stock_name: row.stock_name,
        });
        // 각 일자별 필드 초기화
        for (let i = 1; i <= daysInMonth; i++) {
          stockMap.get(stockCode)[`day_${i}`] = 0;
        }
      }

      // 해당 일자에 수량 설정
      stockMap.get(stockCode)[`day_${day}`] = quantity;
    });

    // Map을 배열로 변환
    return Array.from(stockMap.values());
  }

  /**
   * 입고이력 조회 (품목별 일별 피벗)
   * @param year 년도 (예: 2025)
   * @param month 월 (1-12)
   * @param itemCode 품목코드 (선택)
   * @param itemName 품목명 (선택)
   * @returns 품목별 일별 입고 수량
   */
  async getInboundHistory(
    year: number,
    month: number,
    itemCode?: string,
    itemName?: string
  ): Promise<any[]> {
    // 해당 월의 시작일과 종료일 계산
    const startDate = new Date(year, month - 1, 1);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(year, month, 0); // 해당 월의 마지막 날
    endDate.setHours(23, 59, 59, 999);

    const daysInMonth = endDate.getDate();

    // 쿼리 빌더 생성
    const queryBuilder = this.inboundRepository
      .createQueryBuilder('handstock')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = handstock.stock_code')
      .select([
        'handstock.stock_code AS stock_code',
        'stock.name AS item_name',
        'EXTRACT(DAY FROM handstock.inbound_date) AS day',
        'SUM(handstock.quantity) AS quantity'
      ])
      .where('handstock.inbound_date >= :startDate', { startDate })
      .andWhere('handstock.inbound_date <= :endDate', { endDate });

    // 품목코드 필터
    if (itemCode) {
      queryBuilder.andWhere('handstock.stock_code LIKE :itemCode', {
        itemCode: `%${itemCode}%`
      });
    }

    // 품목명 필터
    if (itemName) {
      queryBuilder.andWhere('stock.name LIKE :itemName', {
        itemName: `%${itemName}%`
      });
    }

    const inboundData = await queryBuilder
      .groupBy('handstock.stock_code, stock.name, EXTRACT(DAY FROM handstock.inbound_date)')
      .orderBy('handstock.stock_code', 'ASC')
      .getRawMany();

    // 품목별로 그룹화하고 일별 데이터 피벗
    const stockMap = new Map<string, any>();

    inboundData.forEach((row) => {
      const stockCode = row.stock_code;
      const day = parseInt(row.day);
      const quantity = parseFloat(row.quantity);

      if (!stockMap.has(stockCode)) {
        stockMap.set(stockCode, {
          stock_code: stockCode,
          item_name: row.item_name,
          total_qty: 0
        });
        // 각 일자별 필드 초기화
        for (let i = 1; i <= daysInMonth; i++) {
          const dayField = `day_${String(i).padStart(2, '0')}`;
          stockMap.get(stockCode)[dayField] = 0;
        }
      }

      // 해당 일자에 수량 설정
      const dayField = `day_${String(day).padStart(2, '0')}`;
      stockMap.get(stockCode)[dayField] = quantity;
      stockMap.get(stockCode).total_qty += quantity;
    });

    // Map을 배열로 변환
    return Array.from(stockMap.values());
  }
}
