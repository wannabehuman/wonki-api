import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockHstController } from './stock-hst.controller';
import { StockHstService } from './stock-hst.service';
import { StockHst } from '../outbound/entities/outbound.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockHst])],
  controllers: [StockHstController],
  providers: [StockHstService],
  exports: [StockHstService, TypeOrmModule],
})
export class StockHstModule {}
