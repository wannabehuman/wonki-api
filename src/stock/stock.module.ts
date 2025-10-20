import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { Stock } from './entities/stock.entity';
import { RealStock } from './entities/real-stock.entity';
import { RealStockController } from './real-stock.controller';
import { RealStockService } from './real-stock.service';

@Module({
  imports: [TypeOrmModule.forFeature([Stock, RealStock])],
  controllers: [StockController, RealStockController],
  providers: [StockService, RealStockService],
  exports: [StockService, RealStockService, TypeOrmModule],
})
export class StockModule {}
