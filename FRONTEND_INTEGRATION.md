# 프론트엔드 연결 가이드 (Svelte)

이 문서는 Svelte 기반 stock_manage 프론트엔드를 wonki-api 백엔드와 연결하는 방법을 설명합니다.

## 백엔드 설정 완료 사항

✅ CORS 설정 완료 (`http://localhost:5173`)
✅ SQL 인젝션 방지 구현
✅ Rate Limiting 설정
✅ 보안 헤더 설정
✅ 입력 검증 강화

## 백엔드 실행

1. **환경 변수 설정**
   ```bash
   cp .env.example .env
   # .env 파일을 열어서 데이터베이스 정보 입력
   ```

2. **서버 실행**
   ```bash
   # 개발 모드
   npm run start:dev

   # 프로덕션 모드
   npm run build
   npm run start:prod
   ```

3. **서버 확인**
   - 주소: `http://localhost:3000`
   - API Prefix: `/api`
   - 예시: `http://localhost:3000/api/stock-base`

## 프론트엔드에서 API 호출하기

### 1. Axios 설치 (Svelte 프로젝트에서)

```bash
npm install axios
```

### 2. API 클라이언트 설정

`src/lib/api.ts` (또는 `src/lib/api.js`) 파일 생성:

```typescript
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // 쿠키/세션 사용 시 필수
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 (JWT 토큰 자동 추가)
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 (에러 처리)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 실패 시 로그인 페이지로 리다이렉트
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### 3. API 서비스 예시

`src/lib/services/stockBase.ts`:

```typescript
import apiClient from '../api';

export interface StockBase {
  code: string;
  name: string;
  category: string;
  unit: string;
  max_use_period?: number;
  remark?: string;
  isAlert?: boolean;
  isActive?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const stockBaseService = {
  // 전체 목록 조회
  async getAll(): Promise<StockBase[]> {
    const response = await apiClient.get('/stock-base');
    return response.data;
  },

  // 카테고리별 조회
  async getByCategory(category: string): Promise<StockBase[]> {
    const response = await apiClient.get(`/stock-base/category/${category}`);
    return response.data;
  },

  // 단일 조회
  async getOne(code: string): Promise<StockBase> {
    const response = await apiClient.get(`/stock-base/${code}`);
    return response.data;
  },

  // 생성
  async create(data: Omit<StockBase, 'createdAt' | 'updatedAt'>): Promise<StockBase> {
    const response = await apiClient.post('/stock-base', data);
    return response.data;
  },

  // 수정
  async update(code: string, data: Partial<StockBase>): Promise<StockBase> {
    const response = await apiClient.put(`/stock-base/${code}`, data);
    return response.data;
  },

  // 삭제
  async delete(code: string): Promise<void> {
    await apiClient.delete(`/stock-base/${code}`);
  },
};
```

### 4. Svelte 컴포넌트에서 사용

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { stockBaseService, type StockBase } from '$lib/services/stockBase';

  let items: StockBase[] = [];
  let loading = true;
  let error = '';

  onMount(async () => {
    try {
      items = await stockBaseService.getAll();
    } catch (e) {
      error = '데이터를 불러오는데 실패했습니다.';
      console.error(e);
    } finally {
      loading = false;
    }
  });

  async function handleCreate(data: any) {
    try {
      await stockBaseService.create(data);
      items = await stockBaseService.getAll();
    } catch (e) {
      alert('생성 실패: ' + e.response?.data?.message);
    }
  }
</script>

{#if loading}
  <p>로딩 중...</p>
{:else if error}
  <p class="error">{error}</p>
{:else}
  <ul>
    {#each items as item}
      <li>{item.name} ({item.code})</li>
    {/each}
  </ul>
{/if}
```

### 5. 환경 변수 설정 (Svelte)

`.env` 파일 생성:

```env
VITE_API_URL=http://localhost:3000/api
```

## API 엔드포인트 목록

### 인증 (Auth)
- `POST /api/auth/login` - 로그인
- `POST /api/auth/register` - 회원가입
- `GET /api/auth/profile` - 프로필 조회 (인증 필요)

### 재고 기준 정보 (Stock Base)
- `GET /api/stock-base` - 전체 조회
- `GET /api/stock-base/category/:category` - 카테고리별 조회
- `GET /api/stock-base/:code` - 단일 조회
- `POST /api/stock-base` - 생성
- `PUT /api/stock-base/:code` - 수정
- `DELETE /api/stock-base/:code` - 삭제

### 입고 (Inbound)
- `GET /api/inbound` - 전체 조회
- `GET /api/inbound/:id` - 단일 조회
- `POST /api/inbound` - 생성
- `PUT /api/inbound/:id` - 수정
- `DELETE /api/inbound/:id` - 삭제

### 출고 (Outbound)
- `GET /api/outbound` - 전체 조회
- `GET /api/outbound/:id` - 단일 조회
- `POST /api/outbound` - 생성
- `PUT /api/outbound/:id` - 수정
- `DELETE /api/outbound/:id` - 삭제

## 보안 주의사항

### 프론트엔드에서 지켜야 할 사항:

1. **XSS 방지**
   - 사용자 입력을 HTML에 직접 삽입하지 않기
   - Svelte의 `{@html}` 사용 시 주의

2. **CSRF 방지**
   - withCredentials 사용 시 백엔드에서 CSRF 토큰 구현 고려

3. **민감 정보 보호**
   - localStorage에 민감 정보 저장 금지
   - JWT 토큰은 HttpOnly 쿠키 사용 권장

4. **입력 검증**
   - 백엔드 검증과 별도로 프론트엔드에서도 기본 검증 수행

## 에러 처리

백엔드에서 반환하는 에러 형식:

```json
{
  "statusCode": 400,
  "message": ["코드는 영문, 숫자, 언더스코어(_), 하이픈(-)만 사용 가능합니다."],
  "error": "Bad Request"
}
```

## Rate Limiting

- **제한**: 60초당 100개 요청
- 초과 시: `429 Too Many Requests` 에러 반환

## 테스트

### 백엔드 API 테스트 (curl)

```bash
# 전체 조회
curl http://localhost:3000/api/stock-base

# 생성
curl -X POST http://localhost:3000/api/stock-base \
  -H "Content-Type: application/json" \
  -d '{"code":"TEST001","name":"테스트","category":"음료","unit":"개"}'

# 조회
curl http://localhost:3000/api/stock-base/TEST001

# 삭제
curl -X DELETE http://localhost:3000/api/stock-base/TEST001
```

## 문제 해결

### CORS 에러 발생 시
1. 백엔드가 실행 중인지 확인
2. 프론트엔드 포트가 5173인지 확인
3. `.env`의 `FRONTEND_URL` 확인

### 401 Unauthorized 에러
1. JWT 토큰 확인
2. 로그인 상태 확인
3. 토큰 만료 확인

### 400 Bad Request 에러
1. 입력 형식 확인
2. 필수 필드 확인
3. 데이터 타입 확인

## 추가 자료

- [NestJS 공식 문서](https://docs.nestjs.com/)
- [Svelte 공식 문서](https://svelte.dev/)
- [Axios 공식 문서](https://axios-http.com/)
- [보안 가이드](./SECURITY.md)
