import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboundController } from './outbound.controller';
import { OutboundService } from './outbound.service';
import { StockHst } from './entities/outbound.entity';
import { Handstock } from '../inbound/entities/inbound.entity';
import { LogModule } from '../log/log.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([StockHst, Handstock]),
    LogModule,
  ],
  controllers: [OutboundController],
  providers: [OutboundService],
  exports: [OutboundService],
})
export class OutboundModule {}
