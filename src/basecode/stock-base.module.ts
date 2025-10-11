import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockBaseController } from './stock-base.controller';
import { StockBaseService } from './stock-base.service';
import { StockBase } from './entities/stock-base.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockBase])],
  controllers: [StockBaseController],
  providers: [StockBaseService],
  exports: [StockBaseService],
})
export class StockBaseModule {}
