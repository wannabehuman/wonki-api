import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockHst } from './entities/outbound.entity';
import { CreateOutboundDto } from './dto/create-outbound.dto';
import { UpdateOutboundDto } from './dto/update-outbound.dto';
import { Handstock } from '../inbound/entities/inbound.entity';
import { LogService } from '../log/log.service';
import { RealStock } from '../stock/entities/real-stock.entity';

@Injectable()
export class OutboundService {
  constructor(
    @InjectRepository(StockHst)
    private readonly outboundRepository: Repository<StockHst>,
    @InjectRepository(Handstock)
    private readonly inboundRepository: Repository<Handstock>,
    @InjectRepository(RealStock)
    private readonly realStockRepository: Repository<RealStock>,
    private readonly dataSource: DataSource,
    private readonly logService: LogService,
  ) {}

  async findAll(): Promise<any[]> {
    const result = await this.outboundRepository
      .createQueryBuilder('stock_hst')
      .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = stock_hst.stock_code')
      .leftJoin('wk_user', 'creator', 'creator.id = stock_hst.created_by')
      .leftJoin('wk_user', 'updater', 'updater.id = stock_hst.updated_by')
      .select([
        'stock_hst.id AS id',
        'stock_hst.inbound_no AS inbound_no',
        'stock_hst.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'stock_hst.io_date AS io_date',
        'stock_hst.io_type AS io_type',
        'stock_hst.quantity AS quantity',
        'stock_hst.unit AS unit',
        'stock_hst.remark AS remark',
        'stock_hst.createdAt AS createdAt',
        'stock_hst.updatedAt AS updatedAt',
        'creator.name AS created_by_name',
        'updater.name AS updated_by_name'
      ])
      .orderBy('stock_hst.createdAt', 'DESC')
      .getRawMany();

    return result;
  }

  async findByStock(stock_code: string): Promise<any[]> {
    const result = await this.outboundRepository
      .createQueryBuilder('stock_hst')
      .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = stock_hst.stock_code')
      .leftJoin('wk_user', 'creator', 'creator.id = stock_hst.created_by')
      .leftJoin('wk_user', 'updater', 'updater.id = stock_hst.updated_by')
      .select([
        'stock_hst.id AS id',
        'stock_hst.inbound_no AS inbound_no',
        'stock_hst.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'stock_hst.io_date AS io_date',
        'stock_hst.io_type AS io_type',
        'stock_hst.quantity AS quantity',
        'stock_hst.unit AS unit',
        'stock_hst.remark AS remark',
        'stock_hst.createdAt AS createdAt',
        'stock_hst.updatedAt AS updatedAt',
        'creator.name AS created_by_name',
        'updater.name AS updated_by_name'
      ])
      .where('stock_hst.stock_code = :stock_code', { stock_code })
      .orderBy('stock_hst.createdAt', 'DESC')
      .getRawMany();

    return result;
  }

  async findByDate(io_date: Date): Promise<any[]> {
    const result = await this.outboundRepository
      .createQueryBuilder('stock_hst')
      .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = stock_hst.stock_code')
      .leftJoin('wk_user', 'creator', 'creator.id = stock_hst.created_by')
      .leftJoin('wk_user', 'updater', 'updater.id = stock_hst.updated_by')
      .select([
        'stock_hst.id AS id',
        'stock_hst.inbound_no AS inbound_no',
        'stock_hst.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'stock_hst.io_date AS io_date',
        'stock_hst.io_type AS io_type',
        'stock_hst.quantity AS quantity',
        'stock_hst.unit AS unit',
        'stock_hst.remark AS remark',
        'stock_hst.createdAt AS createdAt',
        'stock_hst.updatedAt AS updatedAt',
        'creator.name AS created_by_name',
        'updater.name AS updated_by_name'
      ])
      .where('stock_hst.io_date = :io_date', { io_date })
      .orderBy('stock_hst.createdAt', 'DESC')
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
    const queryBuilder = this.outboundRepository
      .createQueryBuilder('stock_hst')
      .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = stock_hst.stock_code')
      .leftJoin('wk_user', 'creator', 'creator.id = stock_hst.created_by')
      .leftJoin('wk_user', 'updater', 'updater.id = stock_hst.updated_by')
      .select([
        'stock_hst.id AS id',
        'stock_hst.inbound_no AS inbound_no',
        'stock_hst.stock_code AS stock_code',
        'stock.name AS stock_name',
        'handstock.inbound_date AS inbound_date',
        'handstock.preparation_date AS preparation_date',
        'stock_hst.io_date AS io_date',
        'stock_hst.io_type AS io_type',
        'stock_hst.quantity AS quantity',
        'stock_hst.unit AS unit',
        'stock_hst.remark AS remark',
        'stock_hst.createdAt AS createdAt',
        'stock_hst.updatedAt AS updatedAt',
        'creator.name AS created_by_name',
        'updater.name AS updated_by_name'
      ])
      .where('stock_hst.io_type = :io_type', { io_type: 'OUT' });

    // 날짜 범위 검색
    if (filterData.startDate) {
      const startDate = new Date(filterData.startDate);
      startDate.setHours(0, 0, 0, 0);
      queryBuilder.andWhere('stock_hst.io_date >= :startDate', { startDate });
    }

    if (filterData.endDate) {
      const endDate = new Date(filterData.endDate);
      endDate.setHours(23, 59, 59, 999);
      queryBuilder.andWhere('stock_hst.io_date <= :endDate', { endDate });
    }

    // 품목코드 like 검색
    if (filterData.itemCode) {
      queryBuilder.andWhere('stock_hst.stock_code LIKE :itemCode', {
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
      .orderBy('stock_hst.createdAt', 'DESC')
      .getRawMany();

    return result;
  }

  async findOne(id: number): Promise<StockHst | null> {
    return this.outboundRepository.findOne({
      where: { id },
    });
  }

  async save(outboundDtos: any[], user?: any) {
    const results: any[] = [];

    // 트랜잭션 시작
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const outboundDto of outboundDtos) {
        const status = outboundDto.rowStatus || outboundDto.ROW_STATUS;

        try {
          // 날짜 유효성 검사 및 처리
          const io_date = outboundDto.io_date instanceof Date
            ? outboundDto.io_date
            : new Date(outboundDto.io_date);

          if (isNaN(io_date.getTime())) {
            throw new Error(`올바른 날짜 형식이 아닙니다: ${outboundDto.io_date}`);
          }

          if (status === 'I') {
          // 사용자 정보 디버깅 (INSERT)
          console.log('OUTBOUND CREATE - User object:', JSON.stringify(user));

          // 입고 데이터 조회
          const inbound = await queryRunner.manager.findOne(Handstock, {
            where: { inbound_no: outboundDto.inbound_no }
          });

          if (!inbound) {
            throw new Error(`해당 입고 데이터를 찾을 수 없습니다. (입고번호: ${outboundDto.inbound_no})`);
          }

          const currentStock = Number(inbound.quantity);
          const outQty = Number(outboundDto.quantity);

          // 재고 부족 검사
          if (currentStock < outQty) {
            throw new Error(`재고 부족: 현재 재고 ${currentStock}${inbound.unit}, 출고 요청 ${outQty}${outboundDto.unit}`);
          }

          // 입고 수량에서 출고 수량 차감
          inbound.quantity = currentStock - outQty;
          await queryRunner.manager.save(Handstock, inbound);

          // real_stock에서도 출고 수량 차감
          const realStock = await queryRunner.manager.findOne(RealStock, {
            where: { stock_code: outboundDto.stock_code }
          });
          if (realStock) {
            realStock.quantity = Number(realStock.quantity) - outQty;
            if (realStock.quantity <= 0) {
              await queryRunner.manager.remove(RealStock, realStock);
            } else {
              await queryRunner.manager.save(RealStock, realStock);
            }
          }

          // 출고 데이터 생성
          const newStockHst = queryRunner.manager.create(StockHst, {
            inbound_no: outboundDto.inbound_no,
            stock_code: outboundDto.stock_code,
            io_date: io_date,
            io_type: 'OUT',
            quantity: outboundDto.quantity,
            unit: outboundDto.unit,
            remark: outboundDto.remark,
            created_by: user?.userId || user?.id,
          });

          const savedStockHst = await queryRunner.manager.save(StockHst, newStockHst);

          // 로그 기록
          await this.logService.log({
            userId: user?.userId || user?.id,
            username: user?.username || user?.name,
            tableName: 'wk_stock_hst',
            recordId: savedStockHst.id.toString(),
            operation: 'INSERT',
            newValue: savedStockHst,
            description: `출고 등록: ${savedStockHst.stock_code} (입고번호: ${savedStockHst.inbound_no})`,
          });

          results.push({ code: true, data: savedStockHst });

        } else if (status === 'U') {
          const id = parseInt((outboundDto as any).id);
          // 사용자 정보 디버깅 (UPDATE)
          console.log('OUTBOUND UPDATE - User object:', JSON.stringify(user));
          console.log('=== 출고 수정 시작 ===');
          console.log('수정할 ID:', id);
          console.log('수정 데이터:', outboundDto);

          if (!id || isNaN(id)) {
            throw new Error('수정할 출고 데이터의 ID가 필요합니다.');
          }

          const existingStockHst = await queryRunner.manager.findOne(StockHst, {
            where: { id }
          });

          if (!existingStockHst) {
            throw new Error(`해당 출고 데이터가 존재하지 않습니다.`);
          }

          console.log('기존 출고 데이터:', existingStockHst);
          const oldValue = { ...existingStockHst };

          // 입고번호가 변경되는 경우
          if (existingStockHst.inbound_no !== outboundDto.inbound_no) {
            console.log('입고번호 변경됨:', existingStockHst.inbound_no, '->', outboundDto.inbound_no);

            // 기존 입고번호의 재고에 기존 출고 수량을 다시 추가
            const oldHandstock = await queryRunner.manager.findOne(Handstock, {
              where: { inbound_no: existingStockHst.inbound_no }
            });

            console.log('기존 입고 데이터:', oldHandstock);
            if (oldHandstock) {
              const oldStock = Number(oldHandstock.quantity);
              const existingOutQty = Number(existingStockHst.quantity);
              console.log('기존 입고 재고 복원:', oldStock, '+', existingOutQty);
              oldHandstock.quantity = oldStock + existingOutQty;
              await queryRunner.manager.save(Handstock, oldHandstock);
              console.log('복원 후 재고:', oldHandstock.quantity);
            }

            // real_stock 복원 (기존 출고 수량만큼)
            const oldRealStock = await queryRunner.manager.findOne(RealStock, {
              where: { stock_code: existingStockHst.stock_code }
            });
            if (oldRealStock) {
              oldRealStock.quantity = Number(oldRealStock.quantity) + Number(existingStockHst.quantity);
              await queryRunner.manager.save(RealStock, oldRealStock);
            } else {
              // real_stock이 없으면 생성
              const newRealStock = queryRunner.manager.create(RealStock, {
                stock_code: existingStockHst.stock_code,
                quantity: Number(existingStockHst.quantity),
                unit: existingStockHst.unit
              });
              await queryRunner.manager.save(RealStock, newRealStock);
            }

            // 새로운 입고번호의 재고에서 새로운 출고 수량 차감
            const newHandstock = await queryRunner.manager.findOne(Handstock, {
              where: { inbound_no: outboundDto.inbound_no }
            });

            console.log('새로운 입고 데이터:', newHandstock);
            if (!newHandstock) {
              throw new Error(`해당 입고 데이터를 찾을 수 없습니다. (입고번호: ${outboundDto.inbound_no})`);
            }

            const newStock = Number(newHandstock.quantity);
            const newOutQty = Number(outboundDto.quantity);

            if (newStock < newOutQty) {
              throw new Error(`재고 부족: 현재 재고 ${newStock}${newHandstock.unit}, 출고 요청 ${newOutQty}${outboundDto.unit}`);
            }

            console.log('새로운 입고 재고 차감:', newStock, '-', newOutQty);
            newHandstock.quantity = newStock - newOutQty;
            await queryRunner.manager.save(Handstock, newHandstock);
            console.log('차감 후 재고:', newHandstock.quantity);

            // real_stock에서 새 출고 수량 차감
            const newRealStock = await queryRunner.manager.findOne(RealStock, {
              where: { stock_code: outboundDto.stock_code }
            });
            if (newRealStock) {
              newRealStock.quantity = Number(newRealStock.quantity) - newOutQty;
              if (newRealStock.quantity <= 0) {
                await queryRunner.manager.remove(RealStock, newRealStock);
              } else {
                await queryRunner.manager.save(RealStock, newRealStock);
              }
            }
          } else {
            console.log('입고번호 동일, 수량만 변경');
            // 입고번호가 같은 경우: 수량 차이만큼만 재고 조정
            const existingQty = Number(existingStockHst.quantity);
            const newQty = Number(outboundDto.quantity);
            const quantityDiff = existingQty - newQty;
            console.log('수량 차이:', quantityDiff, '(기존:', existingQty, '-> 새로운:', newQty, ')');

            const handstock = await queryRunner.manager.findOne(Handstock, {
              where: { inbound_no: existingStockHst.inbound_no }
            });

            console.log('현재 입고 데이터:', handstock);
            if (!handstock) {
              throw new Error(`해당 입고 데이터를 찾을 수 없습니다. (입고번호: ${existingStockHst.inbound_no})`);
            }

            // 재고 부족 검증: 현재 재고 + 원래 출고했던 수량이 새로운 출고 수량보다 작으면 안됨
            const currentStock = Number(handstock.quantity);
            const availableStock = currentStock + existingQty;
            console.log('사용 가능 재고:', availableStock, '(현재:', currentStock, '+ 기존 출고:', existingQty, ')');

            if (availableStock < newQty) {
              throw new Error(`재고 부족: 사용 가능 재고 ${availableStock}${handstock.unit}, 출고 요청 ${newQty}${outboundDto.unit}`);
            }

            // 수량 차이만큼 재고 조정 (기존 5개 -> 새로운 4개 = 차이 +1 만큼 재고 증가)
            console.log('재고 조정:', currentStock, '+', quantityDiff);
            handstock.quantity = currentStock + quantityDiff;
            await queryRunner.manager.save(Handstock, handstock);
            console.log('조정 후 재고:', handstock.quantity);

            // real_stock도 조정
            const realStock = await queryRunner.manager.findOne(RealStock, {
              where: { stock_code: existingStockHst.stock_code }
            });
            if (realStock) {
              // 수량 차이만큼 real_stock도 조정 (출고가 줄면 재고 증가, 출고가 늘면 재고 감소)
              realStock.quantity = Number(realStock.quantity) + quantityDiff;
              if (realStock.quantity <= 0) {
                await queryRunner.manager.remove(RealStock, realStock);
              } else {
                await queryRunner.manager.save(RealStock, realStock);
              }
            }
          }

          // 출고 데이터 업데이트
          existingStockHst.inbound_no = outboundDto.inbound_no;
          existingStockHst.stock_code = outboundDto.stock_code;
          existingStockHst.io_date = io_date;
          existingStockHst.io_type = 'OUT';
          existingStockHst.quantity = outboundDto.quantity;
          existingStockHst.unit = outboundDto.unit;
          existingStockHst.remark = outboundDto.remark;
          existingStockHst.updated_by = user?.userId || user?.id;

          const updatedStockHst = await queryRunner.manager.save(StockHst, existingStockHst);

          // 로그 기록
          await this.logService.log({
            userId: user?.userId || user?.id,
            username: user?.username || user?.name,
            tableName: 'wk_stock_hst',
            recordId: id.toString(),
            operation: 'UPDATE',
            oldValue: oldValue,
            newValue: updatedStockHst,
            description: `출고 수정: ${updatedStockHst.stock_code} (입고번호: ${updatedStockHst.inbound_no})`,
          });

          results.push({ code: true, data: updatedStockHst });

        } else if (status === 'D') {
          const id = parseInt((outboundDto as any).id);
          console.log('=== 출고 삭제 시작 ===');
          console.log('삭제할 ID:', id);
          console.log('삭제 데이터:', outboundDto);

          if (!id || isNaN(id)) {
            throw new Error('삭제할 출고 데이터의 ID가 필요합니다.');
          }

          const existingStockHst = await queryRunner.manager.findOne(StockHst, {
            where: { id }
          });

          if (!existingStockHst) {
            throw new Error(`해당 출고 데이터가 존재하지 않습니다.`);
          }

          console.log('삭제할 출고 데이터:', existingStockHst);
          const oldValue = { ...existingStockHst };

          // 출고 수량을 입고에 다시 추가 (취소)
          const inbound = await queryRunner.manager.findOne(Handstock, {
            where: { inbound_no: existingStockHst.inbound_no }
          });

          console.log('입고 데이터:', inbound);
          if (inbound) {
            const currentStock = Number(inbound.quantity);
            const returnQty = Number(existingStockHst.quantity);
            console.log('재고 복원:', currentStock, '+', returnQty);
            inbound.quantity = currentStock + returnQty;
            await queryRunner.manager.save(Handstock, inbound);
            console.log('복원 후 재고:', inbound.quantity);
          } else {
            console.log('경고: 입고 데이터를 찾을 수 없음 (입고번호:', existingStockHst.inbound_no, ')');
          }

          // real_stock 복원
          const realStock = await queryRunner.manager.findOne(RealStock, {
            where: { stock_code: existingStockHst.stock_code }
          });
          if (realStock) {
            realStock.quantity = Number(realStock.quantity) + Number(existingStockHst.quantity);
            await queryRunner.manager.save(RealStock, realStock);
          } else {
            // real_stock이 없으면 생성
            const newRealStock = queryRunner.manager.create(RealStock, {
              stock_code: existingStockHst.stock_code,
              quantity: Number(existingStockHst.quantity),
              unit: existingStockHst.unit
            });
            await queryRunner.manager.save(RealStock, newRealStock);
          }

          await queryRunner.manager.delete(StockHst, id);
          console.log('출고 데이터 삭제 완료');

          // 로그 기록
          await this.logService.log({
            userId: user?.userId || user?.id,
            username: user?.username || user?.name,
            tableName: 'wk_stock_hst',
            recordId: id.toString(),
            operation: 'DELETE',
            oldValue: oldValue,
            description: `출고 삭제: ${oldValue.stock_code} (입고번호: ${oldValue.inbound_no})`,
          });

          results.push({ code: true, data: { id, deleted: true } });
        }
        } catch (error) {
          results.push({
            code: false,
            data: outboundDto,
            message: error.message
          });
        }
      }

      await queryRunner.commitTransaction();
      return results;

    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async create(createOutboundDto: CreateOutboundDto): Promise<StockHst> {
    const outbound = this.outboundRepository.create({
      ...createOutboundDto,
    });

    return this.outboundRepository.save(outbound);
  }

  async update(id: number, updateOutboundDto: UpdateOutboundDto): Promise<StockHst> {
    await this.outboundRepository.update(id, updateOutboundDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.outboundRepository.delete(id);
  }

  /**
   * 출고이력 조회 (품목별 일별 피벗)
   * @param year 년도 (예: 2025)
   * @param month 월 (1-12)
   * @param itemCode 품목코드 (선택)
   * @param itemName 품목명 (선택)
   * @returns 품목별 일별 출고 수량
   */
  async getOutboundHistory(
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
    const queryBuilder = this.outboundRepository
      .createQueryBuilder('stock_hst')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = stock_hst.stock_code')
      .select([
        'stock_hst.stock_code AS stock_code',
        'stock.name AS item_name',
        'EXTRACT(DAY FROM stock_hst.io_date) AS day',
        'SUM(stock_hst.quantity) AS quantity'
      ])
      .where('stock_hst.io_date >= :startDate', { startDate })
      .andWhere('stock_hst.io_date <= :endDate', { endDate })
      .andWhere('stock_hst.io_type = :io_type', { io_type: 'OUT' });

    // 품목코드 필터
    if (itemCode) {
      queryBuilder.andWhere('stock_hst.stock_code LIKE :itemCode', {
        itemCode: `%${itemCode}%`
      });
    }

    // 품목명 필터
    if (itemName) {
      queryBuilder.andWhere('stock.name LIKE :itemName', {
        itemName: `%${itemName}%`
      });
    }

    const outboundData = await queryBuilder
      .groupBy('stock_hst.stock_code, stock.name, EXTRACT(DAY FROM stock_hst.io_date)')
      .orderBy('stock_hst.stock_code', 'ASC')
      .getRawMany();

    // 품목별로 그룹화하고 일별 데이터 피벗
    const stockMap = new Map<string, any>();

    outboundData.forEach((row) => {
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
