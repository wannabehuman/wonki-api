# Wonki API

NestJS 기반의 독립 API 서버입니다.

## 설명

재고 관리 시스템을 위한 REST API 서버로, 인증, 재고 입고/출고, 기본 코드 관리 등의 기능을 제공합니다.

## 주요 기능

- **인증 시스템**: JWT 기반 사용자 인증
- **재고 관리**: 입고/출고 관리
- **기본 코드 관리**: 시스템 기본 코드 관리
- **사용자 관리**: 회원가입, 승인 시스템

## 기술 스택

- **Framework**: NestJS 10.x
- **Database**: PostgreSQL with TypeORM
- **Authentication**: JWT, Passport
- **Language**: TypeScript

## 설치

```bash
npm install
```

## 환경 변수 설정

`.env` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=your_database

# JWT
JWT_SECRET=your_jwt_secret

# Server
PORT=3000
```

## 실행

```bash
# 개발 모드
npm run start:dev

# 프로덕션 모드
npm run start:prod

# 디버그 모드
npm run start:debug
```

## 빌드

```bash
npm run build
```

## 테스트

```bash
# 단위 테스트
npm run test

# e2e 테스트
npm run test:e2e

# 테스트 커버리지
npm run test:cov
```

## API 엔드포인트

### 인증
- `POST /auth/login` - 로그인
- `POST /auth/register` - 회원가입

### 입고 관리
- `GET /inbound` - 입고 목록 조회
- `POST /inbound` - 입고 등록
- `PATCH /inbound/:id` - 입고 수정
- `DELETE /inbound/:id` - 입고 삭제

### 출고 관리
- `GET /outbound` - 출고 목록 조회
- `POST /outbound` - 출고 등록
- `PATCH /outbound/:id` - 출고 수정
- `DELETE /outbound/:id` - 출고 삭제

### 재고 조회
- `GET /stock` - 재고 목록 조회
- `GET /stock/:id` - 재고 상세 조회

### 기본 코드 관리
- `GET /base-code` - 기본 코드 목록 조회
- `POST /base-code` - 기본 코드 등록
- `PATCH /base-code/:id` - 기본 코드 수정
- `DELETE /base-code/:id` - 기본 코드 삭제

## 프로젝트 구조

```
src/
├── auth/              # 인증 모듈
├── inbound/           # 입고 관리 모듈
├── outbound/          # 출고 관리 모듈
├── stock/             # 재고 관리 모듈
├── base-code/         # 기본 코드 관리 모듈
├── users/             # 사용자 관리 모듈
└── app.module.ts      # 메인 앱 모듈
```

## 라이센스

MIT
