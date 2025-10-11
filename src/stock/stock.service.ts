import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Stock } from './entities/stock.entity';
import { CreateStockDto } from './dto/create-stock.dto';
import { UpdateStockDto } from './dto/update-stock.dto';

@Injectable()
export class StockService {
  constructor(
    @InjectRepository(Stock)
    private stockRepository: Repository<Stock>,
  ) {}

  async findAll(): Promise<Stock[]> {
    return this.stockRepository.find();
  }

  async findOne(name: string): Promise<Stock | null> {
    return this.stockRepository.findOneBy({
      name
    });
  }

  async saveStock(stockDtos: CreateStockDto[]): Promise<Stock[]> {
    try {
      const results = await Promise.all(stockDtos.map(async (stockDto) => {
        const existingStock = await this.findOne(stockDto.name);

        switch (stockDto.rowStatus) {
          case "INSERT":
            if (existingStock) {
              throw new Error(`재고명 "${stockDto.name}"은 이미 존재합니다.`);
            }
            
            const newStock = this.stockRepository.create({
              name: stockDto.name,
              quantity: stockDto.quantity,
              unit: stockDto.unit,
              location: stockDto.location,
              initialQuantity: stockDto.initialQuantity || 0,
              outQuantity: stockDto.outQuantity || 0,
              stockQuantity: stockDto.quantity || 0,
              stockUpdateReason: stockDto.stockUpdateReason
            } as Partial<Stock>);
            return await this.stockRepository.save(newStock);

          case "UPDATE":
            if (!existingStock) {
              throw new Error(`재고명 "${stockDto.name}"을(를) 찾을 수 없습니다.`);
            }
            
            Object.assign(existingStock, {
              quantity: stockDto.quantity,
              unit: stockDto.unit,
              location: stockDto.location,
              initialQuantity: stockDto.initialQuantity,
              outQuantity: stockDto.outQuantity,
              stockQuantity: stockDto.quantity,
              stockUpdateReason: stockDto.stockUpdateReason
            });
            return await this.stockRepository.save(existingStock);

          case "DELETE":
            if (!existingStock) {
              throw new Error(`재고명 "${stockDto.name}"을(를) 찾을 수 없습니다.`);
            }
            await this.stockRepository.remove(existingStock);
            return null; // 삭제된 항목은 null로 반환

          default:
            throw new Error(`알 수 없는 rowStatus: ${stockDto.rowStatus}`);
        }
      }));

      // 삭제된 항목(null)을 제외한 결과만 반환
      return results.filter(result => result !== null);
    } catch (error) {
      console.error(`Error saving stocks:`, error);
      throw error;
    }
  }

  async updateStock(name: string, updateStockDto: UpdateStockDto): Promise<Stock> {
    try {
      const stock = await this.findOne(name);
      if (!stock) {
        throw new NotFoundException(`Stock ${name} not found`);
      }

      Object.assign(stock, {
        quantity: updateStockDto.quantity,
        initialQuantity: updateStockDto.initialQuantity,
        outQuantity: updateStockDto.outQuantity,
        stockQuantity: updateStockDto.stockQuantity
      });

      return await this.stockRepository.save(stock);
    } catch (error) {
      console.error(`Error updating stock:`, error);
      throw error;
    }
  }

  async deleteStock(name: string): Promise<void> {
    try {
      const stock = await this.findOne(name);
      if (!stock) {
        throw new NotFoundException(`Stock ${name} not found`);
      }

      await this.stockRepository.remove(stock);
    } catch (error) {
      console.error(`Error deleting stock:`, error);
      throw error;
    }
  }
}