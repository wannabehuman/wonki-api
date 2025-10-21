import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MenuModule } from './menu/menu.module';
import { StockBaseModule } from './basecode/stock-base.module';
import { StockHstModule } from './stock-hst/stock-hst.module';
import { InboundModule } from './inbound/inbound.module';
import { OutboundModule } from './outbound/outbound.module';
import { CodeModule } from './code/code.module';
import { DashboardController } from './dashboard/dashboard.controller';
import { DashboardService } from './dashboard/dashboard.service';
import { Handstock } from './inbound/entities/inbound.entity';
import { StockHst } from './outbound/entities/outbound.entity';
import { StockBase } from './basecode/entities/stock-base.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,  // 환경 변수를 전체 모듈에서 사용하도록 설정
    }),

    // Rate Limiting 설정 (SQL 인젝션 및 DDoS 방지)
    ThrottlerModule.forRoot([{
      ttl: 60000, // 60초
      limit: 100, // 60초당 100개 요청 제한
    }]),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true,  // 프로덕션에서는 false로 설정 권장
      logging: process.env.NODE_ENV !== 'production',  // 프로덕션에서는 SQL 로깅 비활성화
      // SQL 인젝션 방지를 위한 추가 설정
      extra: {
        max: 10, // 최대 연결 수 제한
        connectionTimeoutMillis: 5000,
      },
    }),

    AuthModule,
    UsersModule,
    MenuModule,
    StockBaseModule,
    StockHstModule,
    InboundModule,
    OutboundModule,
    CodeModule,
    TypeOrmModule.forFeature([Handstock, StockHst, StockBase]),

    // VisitorCountModule,
  ],
  controllers: [AppController, DashboardController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard, // 전역 Rate Limiting 적용
    },
    DashboardService,
  ],
  

  
})
export class AppModule{}
