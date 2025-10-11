# 보안 가이드

이 문서는 wonki-api의 보안 설정 및 SQL 인젝션 방지 전략을 설명합니다.

## 구현된 보안 기능

### 1. SQL 인젝션 방지

#### TypeORM Prepared Statements
- TypeORM은 자동으로 **Prepared Statements**를 사용하여 SQL 인젝션을 방지합니다
- Repository 패턴을 사용하면 모든 쿼리가 파라미터화됩니다

#### DTO 검증 (class-validator)
모든 입력값은 DTO를 통해 검증됩니다:

```typescript
// 예시: CreateStockBaseDto
@IsString()
@MinLength(1)
@MaxLength(50)
@Matches(/^[a-zA-Z0-9_-]+$/)
code: string;
```

**적용된 검증 규칙:**
- `@IsString()`: 문자열 타입 검증
- `@MinLength()`, `@MaxLength()`: 길이 제한
- `@Matches()`: 정규표현식 패턴 검증 (특수문자 제한)
- `@IsInt()`, `@Min()`, `@Max()`: 숫자 범위 검증
- `@IsBoolean()`: Boolean 타입 검증

#### ValidationPipe 설정 (main.ts)
```typescript
app.useGlobalPipes(new ValidationPipe({
  transform: true,                    // DTO로 자동 변환
  whitelist: true,                    // DTO에 정의되지 않은 속성 제거
  forbidNonWhitelisted: true,         // DTO에 없는 속성 있으면 에러
  disableErrorMessages: process.env.NODE_ENV === 'production',
  transformOptions: {
    enableImplicitConversion: false,  // 암묵적 타입 변환 방지
  },
}));
```

#### URL 파라미터 검증
컨트롤러에서 URL 파라미터도 추가 검증합니다:

```typescript
@Get(':code')
async findOne(@Param('code') code: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(code)) {
    throw new Error('Invalid code parameter');
  }
  return this.stockBaseService.findOne(code);
}
```

### 2. Rate Limiting (DDoS/Brute Force 방지)

```typescript
ThrottlerModule.forRoot([{
  ttl: 60000,  // 60초
  limit: 100,  // 60초당 100개 요청 제한
}])
```

### 3. 보안 헤더 (Helmet)

```typescript
app.use(helmet.default());
```

**Helmet이 설정하는 보안 헤더:**
- `X-DNS-Prefetch-Control`: DNS Prefetching 제어
- `X-Frame-Options`: Clickjacking 방지
- `X-Content-Type-Options`: MIME 타입 스니핑 방지
- `Strict-Transport-Security`: HTTPS 강제
- `X-XSS-Protection`: XSS 공격 방지
- 기타 보안 헤더

### 4. CORS 설정

```typescript
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
```

### 5. 데이터베이스 연결 제한

```typescript
TypeOrmModule.forRoot({
  // ... 기타 설정
  extra: {
    max: 10,                          // 최대 연결 수 제한
    connectionTimeoutMillis: 5000,    // 연결 타임아웃
  },
})
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 변수를 설정하세요:

```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=your_username
DB_PASSWORD=your_password
DB_NAME=your_database

# JWT 설정
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=1h

# 세션 설정
SESSION_SECRET=your_session_secret_here

# 환경
NODE_ENV=development

# 프론트엔드 URL
FRONTEND_URL=http://localhost:5173

# 서버 포트
PORT=3000
```

⚠️ **주의:** `.env` 파일은 절대 Git에 커밋하지 마세요!

## 프로덕션 배포 시 권장사항

1. **synchronize: false**
   - `app.module.ts`에서 `synchronize: true`를 `false`로 변경
   - 마이그레이션을 사용하여 DB 스키마 관리

2. **환경 변수 강화**
   - 강력한 JWT_SECRET 사용 (최소 32자 이상)
   - 강력한 DB 비밀번호 사용

3. **HTTPS 사용**
   - 프로덕션에서는 반드시 HTTPS 사용

4. **로깅 최소화**
   - SQL 로깅은 자동으로 프로덕션에서 비활성화됨

5. **Rate Limiting 조정**
   - 실제 트래픽에 맞게 조정

## SQL 인젝션 방지 체크리스트

- ✅ TypeORM Repository 패턴 사용
- ✅ class-validator로 모든 입력 검증
- ✅ ValidationPipe의 whitelist 활성화
- ✅ URL 파라미터 검증
- ✅ 길이 제한 및 패턴 검증
- ✅ Rate Limiting 설정
- ✅ 보안 헤더 설정
- ✅ CORS 제한적 허용
- ✅ 데이터베이스 연결 제한

## 추가 보안 권장사항

1. **정기적인 의존성 업데이트**
   ```bash
   npm audit
   npm audit fix
   ```

2. **비밀번호 해싱**
   - bcrypt 사용 (이미 설치됨)

3. **JWT 만료 시간 설정**
   - 적절한 만료 시간 설정 (예: 1시간)

4. **로그 모니터링**
   - 비정상적인 요청 패턴 모니터링

5. **정기적인 보안 감사**
   - 코드 리뷰
   - 보안 테스트

## 문의

보안 이슈 발견 시 즉시 개발팀에 보고하세요.
