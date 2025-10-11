import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockBase } from './entities/stock-base.entity';
import { CreateStockBaseDto } from './dto/create-stock-base.dto';
import { UpdateStockBaseDto } from './dto/update-stock-base.dto';

@Injectable()
export class StockBaseService {
  constructor(
    @InjectRepository(StockBase)
    private stockBaseRepository: Repository<StockBase>,
  ) {}

  async findAll(): Promise<StockBase[]> {
    return this.stockBaseRepository.find();
  }

  async findOne(code: string): Promise<StockBase | null> {
    return this.stockBaseRepository.findOneBy({ code });
  }
  async findByCategory(category: string): Promise<StockBase[]> {
    return this.stockBaseRepository.find({ where: { category } });
  }
  async create(createStockBaseDto: CreateStockBaseDto): Promise<StockBase> {
    const stockBase = this.stockBaseRepository.create(createStockBaseDto);
    return this.stockBaseRepository.save(stockBase);
  }

  async update(code: string, updateStockBaseDto: UpdateStockBaseDto): Promise<StockBase> {
    await this.stockBaseRepository.update(code, updateStockBaseDto);
    return this.findOne(code);
  }

  async remove(code: string): Promise<void> {
    await this.stockBaseRepository.delete(code);
  }

  async save(stockBaseDtos: any[]): Promise<StockBase[]> {
    // const results: StockBase[] = [];
    const results: any[] = [];
    // const errors: any[] = [];
    // console.log(stockBaseDtos);
    for (const stockBaseDto of stockBaseDtos) {
      if (stockBaseDto.ROW_STATUS === 'I') {
        const { ROW_STATUS, ...createData } = stockBaseDto;
        try{
          // 필수 필드 검증
          if (!createData.code || createData.code.trim() === '') {
            throw new Error('품목 코드는 필수입니다.');
          }
          if (!createData.name || createData.name.trim() === '') {
            throw new Error('품목명은 필수입니다.');
          }
          if (!createData.category || createData.category.trim() === '') {
            throw new Error('카테고리는 필수입니다.');
          }
          if (!createData.unit || createData.unit.trim() === '') {
            throw new Error('단위는 필수입니다.');
          }
  
          const created = await this.create(createData as CreateStockBaseDto);
          // results.push(created);
          results.push({ code: true, data: created });
        }catch(error){
        
          results.push({ code:false, data: createData, message: error.message });
        }
      } else if (stockBaseDto.ROW_STATUS === 'U') {
        const { ROW_STATUS, unicId, Del_Check ,code, ...updateData} = stockBaseDto;
        try{
          if (!code) {
            throw new Error('수정할 품목의 코드가 필요합니다.');
          }
          const updated = await this.update(code, updateData as UpdateStockBaseDto);
          results.push({ code: true, data: updated });
        }catch(e){
          results.push({ code: false, data: updateData, message: e.message });
        }
      } else if (stockBaseDto.ROW_STATUS === 'D') {
        const code = stockBaseDto.code;
        if (!code) {
          throw new Error('삭제할 품목의 코드가 필요합니다.');
        }
        await this.remove(code);
        results.push({ code: true, data: code });
      }
    }

    return results;
  }
}
