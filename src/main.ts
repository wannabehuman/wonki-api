import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
// import * as session from 'express-session';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 보안 헤더 설정 (XSS, Clickjacking 등 방지)
  app.use(helmet.default());

  app.setGlobalPrefix('api');

  // 전역 유효성 검사 파이프 적용 (SQL 인젝션 방지)
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // DTO로 자동 변환
    whitelist: true, // DTO에 정의되지 않은 속성 제거
    forbidNonWhitelisted: true, // DTO에 없는 속성 있으면 에러
    disableErrorMessages: process.env.NODE_ENV === 'production', // 프로덕션에서는 상세 에러 숨김
    transformOptions: {
      enableImplicitConversion: false, // 암묵적 타입 변환 방지
    },
  }));

  // CORS 설정 - Svelte 프론트엔드 연결
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173', // Svelte 기본 포트
    credentials: true, // 쿠키/세션 허용
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  // app.use(
  //   session({
  //     secret: process.env.SESSION_SECRET,
  //     resave : false,
  //     saveUninitialized: false,
  //     cookie:{
  //       maxAge: 1000 * 60 * 60,
  //     },
  //   }),
  // );

  await app.listen(3000);
}
bootstrap();
