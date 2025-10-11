import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { StockHst } from './entities/outbound.entity';
import { CreateOutboundDto } from './dto/create-outbound.dto';
import { UpdateOutboundDto } from './dto/update-outbound.dto';
import { Handstock } from '../inbound/entities/inbound.entity';
import { LogService } from '../log/log.service';

@Injectable()
export class OutboundService {
  constructor(
    @InjectRepository(StockHst)
    private readonly outboundRepository: Repository<StockHst>,
    @InjectRepository(Handstock)
    private readonly inboundRepository: Repository<Handstock>,
    private readonly dataSource: DataSource,
    private readonly logService: LogService,
  ) {}

  async findAll(): Promise<any[]> {
    const result = await this.outboundRepository
      .createQueryBuilder('stock_hst')
      .leftJoin('wk_handstock', 'handstock', 'handstock.inbound_no = stock_hst.inbound_no')
      .leftJoin('wk_stock_base', 'stock', 'stock.code = stock_hst.stock_code')
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
        'stock_hst.createdAt AS createdAt'
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
        'stock_hst.createdAt AS createdAt'
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
        'stock_hst.createdAt AS createdAt'
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
        'stock_hst.createdAt AS createdAt'
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
          // 입고 데이터 조회
          const inbound = await queryRunner.manager.findOne(Handstock, {
            where: { inbound_no: outboundDto.inbound_no }
          });

          if (!inbound) {
            throw new Error(`해당 입고 데이터를 찾을 수 없습니다. (입고번호: ${outboundDto.inbound_no})`);
          }

          // 재고 부족 검사
          if (inbound.quantity < outboundDto.quantity) {
            throw new Error(`재고 부족: 현재 재고 ${inbound.quantity}${inbound.unit}, 출고 요청 ${outboundDto.quantity}${outboundDto.unit}`);
          }

          // 입고 수량에서 출고 수량 차감
          inbound.quantity -= outboundDto.quantity;
          await queryRunner.manager.save(Handstock, inbound);

          // 출고 데이터 생성
          const newStockHst = queryRunner.manager.create(StockHst, {
            inbound_no: outboundDto.inbound_no,
            stock_code: outboundDto.stock_code,
            io_date: io_date,
            io_type: 'OUT',
            quantity: outboundDto.quantity,
            unit: outboundDto.unit,
            remark: outboundDto.remark,
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
          if (!id || isNaN(id)) {
            throw new Error('수정할 출고 데이터의 ID가 필요합니다.');
          }

          const existingStockHst = await queryRunner.manager.findOne(StockHst, {
            where: { id }
          });

          if (!existingStockHst) {
            throw new Error(`해당 출고 데이터가 존재하지 않습니다.`);
          }

          const oldValue = { ...existingStockHst };

          // 기존 출고 수량을 입고에 다시 추가
          const oldHandstock = await queryRunner.manager.findOne(Handstock, {
            where: { inbound_no: existingStockHst.inbound_no }
          });

          if (oldHandstock) {
            oldHandstock.quantity += existingStockHst.quantity;
            await queryRunner.manager.save(Handstock, oldHandstock);
          }

          // 새로운 입고 데이터에서 출고 수량 차감
          const newHandstock = await queryRunner.manager.findOne(Handstock, {
            where: { inbound_no: outboundDto.inbound_no }
          });

          if (!newHandstock) {
            throw new Error(`해당 입고 데이터를 찾을 수 없습니다. (입고번호: ${outboundDto.inbound_no})`);
          }

          if (newHandstock.quantity < outboundDto.quantity) {
            throw new Error(`재고 부족: 현재 재고 ${newHandstock.quantity}${newHandstock.unit}, 출고 요청 ${outboundDto.quantity}${outboundDto.unit}`);
          }

          newHandstock.quantity -= outboundDto.quantity;
          await queryRunner.manager.save(Handstock, newHandstock);

          // 출고 데이터 업데이트
          existingStockHst.inbound_no = outboundDto.inbound_no;
          existingStockHst.stock_code = outboundDto.stock_code;
          existingStockHst.io_date = io_date;
          existingStockHst.io_type = 'OUT';
          existingStockHst.quantity = outboundDto.quantity;
          existingStockHst.unit = outboundDto.unit;
          existingStockHst.remark = outboundDto.remark;

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
          if (!id || isNaN(id)) {
            throw new Error('삭제할 출고 데이터의 ID가 필요합니다.');
          }

          const existingStockHst = await queryRunner.manager.findOne(StockHst, {
            where: { id }
          });

          if (!existingStockHst) {
            throw new Error(`해당 출고 데이터가 존재하지 않습니다.`);
          }

          const oldValue = { ...existingStockHst };

          // 출고 수량을 입고에 다시 추가 (취소)
          const inbound = await queryRunner.manager.findOne(Handstock, {
            where: { inbound_no: existingStockHst.inbound_no }
          });

          if (inbound) {
            inbound.quantity += existingStockHst.quantity;
            await queryRunner.manager.save(Handstock, inbound);
          }

          await queryRunner.manager.delete(StockHst, id);

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
}
