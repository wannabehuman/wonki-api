import { Module } from '@nestjs/common';
import { StockBaseModule } from '../basecode/stock-base.module';
import { ItemsController } from './items.controller';
import { CodesController } from './codes.controller';

@Module({
  imports: [StockBaseModule],
  controllers: [ItemsController, CodesController],
})
export class MasterModule {}
