import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InboundController } from './inbound.controller';
import { InboundService } from './inbound.service';
import { Handstock } from './entities/inbound.entity';
import { LogModule } from '../log/log.module';
import { StockHst } from '../outbound/entities/outbound.entity';
// import { StockBase } from '../basecode/entities/stock-base.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Handstock, StockHst]),
    LogModule,
  ],
  controllers: [InboundController],
  providers: [InboundService],
  exports: [InboundService],
})
export class InboundModule {}
