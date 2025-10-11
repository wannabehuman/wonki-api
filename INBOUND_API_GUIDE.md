# 입고 API 가이드

입고(Inbound) 모듈의 채번 규칙 및 API 사용 방법을 설명합니다.

## 주요 변경 사항

### 1. 채번 규칙 (자동 생성)
- **형식**: `yyyyMMdd` + 3자리 일련번호
- **예시**:
  - `20251009001` (2025년 10월 9일 첫 번째 입고)
  - `20251009002` (2025년 10월 9일 두 번째 입고)
  - `20251010001` (2025년 10월 10일 첫 번째 입고)

### 2. 엔티티 구조 변경

**이전:**
- Primary Key: `stock_code`

**현재:**
- Primary Key: `inbound_no` (자동 채번)
- 추가 필드: `preparation_date` (조제일자)
- `stock_code`는 일반 컬럼으로 변경

### 3. 새로운 필드

```typescript
export class Inbound {
  inbound_no: string;          // 입고번호 (채번, PK)
  stock_code: string;           // 재고코드
  inbound_date: Date;           // 입고일자
  preparation_date: Date;       // 조제일자 (새로 추가)
  quantity: number;             // 수량 (소수점 2자리)
  unit: string;                 // 단위
  max_use_period: number;       // 최대 사용기간
  remark: string;               // 비고
  created_at: Date;             // 생성일시
}
```

## API 엔드포인트

### 1. 전체 입고 조회
```http
GET /api/inbound
```

**응답 예시:**
```json
[
  {
    "inbound_no": "20251009001",
    "stock_code": "ITEM001",
    "inbound_date": "2025-10-09",
    "preparation_date": "2025-10-08",
    "quantity": 100.5,
    "unit": "개",
    "max_use_period": 365,
    "remark": "테스트 입고",
    "created_at": "2025-10-09T10:00:00.000Z"
  }
]
```

### 2. 재고코드별 조회
```http
GET /api/inbound/stock/:stock_code
```

**예시:**
```bash
curl http://localhost:3000/api/inbound/stock/ITEM001
```

### 3. 입고일자별 조회
```http
GET /api/inbound/date/:inbound_date
```

**예시:**
```bash
curl http://localhost:3000/api/inbound/date/2025-10-09
```

### 4. 입고번호로 단일 조회
```http
GET /api/inbound/:inbound_no
```

**예시:**
```bash
curl http://localhost:3000/api/inbound/20251009001
```

### 5. 입고 일괄 저장 (INSERT/UPDATE/DELETE)
```http
POST /api/inbound
Content-Type: application/json
Authorization: Bearer <JWT_TOKEN>
```

**요청 본문 (INSERT):**
```json
[
  {
    "rowStatus": "INSERT",
    "stock_code": "ITEM001",
    "inbound_date": "2025-10-09",
    "preparation_date": "2025-10-08",
    "quantity": 100.5,
    "unit": "개",
    "max_use_period": 365,
    "remark": "신규 입고"
  }
]
```

**요청 본문 (UPDATE):**
```json
[
  {
    "rowStatus": "UPDATE",
    "inbound_no": "20251009001",
    "quantity": 150.5,
    "remark": "수량 수정"
  }
]
```

**요청 본문 (DELETE):**
```json
[
  {
    "rowStatus": "DELETE",
    "inbound_no": "20251009001"
  }
]
```

**혼합 요청 예시:**
```json
[
  {
    "rowStatus": "INSERT",
    "stock_code": "ITEM002",
    "inbound_date": "2025-10-09",
    "quantity": 50,
    "unit": "박스"
  },
  {
    "rowStatus": "UPDATE",
    "inbound_no": "20251009001",
    "quantity": 200
  },
  {
    "rowStatus": "DELETE",
    "inbound_no": "20251008001"
  }
]
```

## DTO 검증 규칙

### CreateInboundDto (INSERT 시)

| 필드 | 필수 | 타입 | 검증 규칙 |
|------|------|------|-----------|
| rowStatus | ✅ | string | 'INSERT' |
| stock_code | ✅ | string | 1-50자, 영문/숫자/언더스코어/하이픈만 |
| inbound_date | ✅ | string | YYYY-MM-DD 형식 |
| preparation_date | ❌ | string | YYYY-MM-DD 형식 |
| quantity | ✅ | number | 0.01-999999.99, 소수점 2자리 |
| unit | ✅ | string | 1-20자 |
| max_use_period | ❌ | number | 0-3650 정수 |
| remark | ❌ | string | 최대 500자 |

### UpdateInboundDto (UPDATE/DELETE 시)

| 필드 | 필수 | 타입 | 검증 규칙 |
|------|------|------|-----------|
| rowStatus | ✅ | string | 'UPDATE' 또는 'DELETE' |
| inbound_no | ✅ | string | 11자리 숫자 |
| stock_code | ❌ | string | 1-50자, 영문/숫자/언더스코어/하이픈만 |
| inbound_date | ❌ | string | YYYY-MM-DD 형식 |
| preparation_date | ❌ | string | YYYY-MM-DD 형식 |
| quantity | ❌ | number | 0.01-999999.99, 소수점 2자리 |
| unit | ❌ | string | 1-20자 |
| max_use_period | ❌ | number | 0-3650 정수 |
| remark | ❌ | string | 최대 500자 |

## 채번 로직 상세

```typescript
/**
 * 채번 생성 로직
 * 1. 입고일자를 yyyyMMdd 형식으로 변환
 * 2. 해당 날짜로 시작하는 마지막 입고번호 조회
 * 3. 일련번호 +1 (없으면 001부터 시작)
 * 4. yyyyMMdd + 3자리 일련번호 반환
 */
async generateInboundNo(date: Date): Promise<string> {
  const datePrefix = '20251009'; // 예시
  const lastInbound = await findLastInbound(datePrefix);

  let sequence = 1;
  if (lastInbound) {
    sequence = parseInt(lastInbound.inbound_no.slice(-3), 10) + 1;
  }

  return `${datePrefix}${String(sequence).padStart(3, '0')}`;
}
```

## 보안 기능

### SQL 인젝션 방지
1. **DTO 검증**: class-validator로 모든 입력 검증
2. **파라미터 검증**: URL 파라미터에 정규식 검증 적용
3. **TypeORM 쿼리빌더**: Prepared Statements 사용
4. **입력 제한**: 길이, 패턴, 범위 제한

### 예시
```typescript
// 재고코드 검증
if (!/^[a-zA-Z0-9_-]+$/.test(stock_code)) {
  throw new BadRequestException('Invalid stock_code parameter');
}

// 입고번호 검증
if (!/^\d{11}$/.test(inbound_no)) {
  throw new BadRequestException('Invalid inbound_no parameter');
}

// 날짜 검증
if (!/^\d{4}-\d{2}-\d{2}$/.test(inbound_date)) {
  throw new Error('Invalid date format. Use YYYY-MM-DD');
}
```

## 사용 예시

### curl 예시

#### 1. 신규 입고 등록
```bash
curl -X POST http://localhost:3000/api/inbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '[
    {
      "rowStatus": "INSERT",
      "stock_code": "ITEM001",
      "inbound_date": "2025-10-09",
      "preparation_date": "2025-10-08",
      "quantity": 100,
      "unit": "개",
      "max_use_period": 365,
      "remark": "신규 입고"
    }
  ]'
```

#### 2. 입고 수정
```bash
curl -X POST http://localhost:3000/api/inbound \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '[
    {
      "rowStatus": "UPDATE",
      "inbound_no": "20251009001",
      "quantity": 150,
      "remark": "수량 수정"
    }
  ]'
```

#### 3. 입고 조회
```bash
# 전체 조회
curl http://localhost:3000/api/inbound

# 입고번호로 조회
curl http://localhost:3000/api/inbound/20251009001

# 재고코드로 조회
curl http://localhost:3000/api/inbound/stock/ITEM001

# 날짜로 조회
curl http://localhost:3000/api/inbound/date/2025-10-09
```

### JavaScript/TypeScript (Axios)

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// 입고 생성
async function createInbound() {
  const response = await axios.post(`${API_BASE_URL}/inbound`, [
    {
      rowStatus: 'INSERT',
      stock_code: 'ITEM001',
      inbound_date: '2025-10-09',
      preparation_date: '2025-10-08',
      quantity: 100,
      unit: '개',
    }
  ], {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log('생성된 입고:', response.data);
  // 응답: [{ inbound_no: '20251009001', ... }]
}

// 입고 조회
async function getInbound(inbound_no: string) {
  const response = await axios.get(`${API_BASE_URL}/inbound/${inbound_no}`);
  console.log('입고 정보:', response.data);
}
```

## 에러 처리

### 일반적인 에러

| 에러 코드 | 메시지 | 원인 |
|----------|--------|------|
| 400 | Invalid stock_code parameter | 재고코드 형식 오류 |
| 400 | Invalid inbound_no parameter | 입고번호 형식 오류 (11자리 숫자 아님) |
| 400 | Invalid date format | 날짜 형식 오류 (YYYY-MM-DD 아님) |
| 400 | UPDATE 시 입고번호는 필수입니다. | UPDATE인데 inbound_no 없음 |
| 401 | Unauthorized | JWT 토큰 없음 또는 만료 |
| 404 | 입고번호 XXX을(를) 찾을 수 없습니다. | 존재하지 않는 입고번호 |

### 검증 에러 예시
```json
{
  "statusCode": 400,
  "message": [
    "재고코드는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능합니다.",
    "수량은 0보다 커야 합니다.",
    "단위는 최대 20자까지 가능합니다."
  ],
  "error": "Bad Request"
}
```

## 데이터베이스 마이그레이션

기존 데이터가 있는 경우, 다음 SQL을 실행하여 테이블 구조를 변경하세요:

```sql
-- 1. 백업 테이블 생성
CREATE TABLE inbound_backup AS SELECT * FROM inbound;

-- 2. 기존 테이블 삭제
DROP TABLE inbound;

-- 3. 새 테이블 생성 (synchronize: true로 자동 생성하거나 수동 생성)
CREATE TABLE inbound (
  inbound_no VARCHAR(11) PRIMARY KEY,
  stock_code VARCHAR(255) NOT NULL,
  inbound_date DATE NOT NULL,
  preparation_date DATE,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  max_use_period INTEGER,
  remark TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 데이터 마이그레이션 (필요시)
-- 기존 데이터를 새 채번 규칙에 맞게 변환하는 스크립트 작성 필요
```

## 주의사항

1. **인증 필요**: POST 요청(저장)은 JWT 인증이 필요합니다
2. **채번 자동 생성**: INSERT 시 inbound_no는 자동 생성되므로 보내지 않습니다
3. **날짜 형식**: 모든 날짜는 `YYYY-MM-DD` 형식을 사용해야 합니다
4. **수량 소수점**: 수량은 소수점 2자리까지 입력 가능합니다
5. **일련번호 제한**: 하루 최대 999개 입고까지 가능합니다 (001-999)

## 문의

입고 API 관련 문의사항은 개발팀에 문의하세요.
