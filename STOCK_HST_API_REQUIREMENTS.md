# 입출고내역 전체보기 API 요구사항

## API 엔드포인트

```
POST /api/stock-hst
```

## 요청 파라미터 (Query String 또는 Body)

```json
{
  "START_DATE": "2025-01-01",    // 시작일자 (선택, YYYY-MM-DD)
  "END_DATE": "2025-12-31",      // 종료일자 (선택, YYYY-MM-DD)
  "IO_TYPE": "IN",               // 구분 (선택: '', 'IN', 'OUT')
  "ITEM_CD": "KALGEUN",          // 품목코드 (선택, 부분일치)
  "ITEM_NM": "갈근탕"             // 품목명 (선택, 부분일치)
}
```

## 응답 예시

```json
[
  {
    "id": 1,
    "io_type": "IN",
    "inbound_no": "IB20251021001",
    "stock_code": "KALGEUN",
    "stock_name": "갈근탕",
    "io_date": "2025-10-21",
    "preparation_date": "2025-10-20",
    "quantity": 100,
    "unit": "EA",
    "expiry_date": "2026-04-19",
    "remark": "신규입고"
  },
  {
    "id": 2,
    "io_type": "OUT",
    "inbound_no": "IB20251021001",
    "stock_code": "KALGEUN",
    "stock_name": "갈근탕",
    "io_date": "2025-10-22",
    "preparation_date": "2025-10-20",
    "quantity": 10,
    "unit": "EA",
    "expiry_date": "2026-04-19",
    "remark": "출고"
  }
]
```

## 쿼리 로직

```sql
SELECT
  stock_hst.id,
  stock_hst.io_type,
  stock_hst.inbound_no,
  stock_hst.stock_code,
  stock_base.name AS stock_name,
  stock_hst.io_date,
  handstock.preparation_date,
  stock_hst.quantity,
  stock_hst.unit,
  CASE
    WHEN handstock.preparation_date IS NOT NULL AND stock_base.max_use_period IS NOT NULL
    THEN handstock.preparation_date + stock_base.max_use_period * INTERVAL '1 day'
    ELSE NULL
  END AS expiry_date,
  stock_hst.remark,
  stock_hst."createdAt"
FROM wk_stock_hst stock_hst
LEFT JOIN wk_stock_base stock_base ON stock_base.code = stock_hst.stock_code
LEFT JOIN wk_handstock handstock ON handstock.inbound_no = stock_hst.inbound_no
WHERE 1=1
  AND (COALESCE(:START_DATE, '') = '' OR stock_hst.io_date >= :START_DATE)
  AND (COALESCE(:END_DATE, '') = '' OR stock_hst.io_date <= :END_DATE)
  AND (COALESCE(:IO_TYPE, '') = '' OR stock_hst.io_type = :IO_TYPE)
  AND (COALESCE(:ITEM_CD, '') = '' OR stock_hst.stock_code LIKE CONCAT('%', :ITEM_CD, '%'))
  AND (COALESCE(:ITEM_NM, '') = '' OR stock_base.name LIKE CONCAT('%', :ITEM_NM, '%'))
ORDER BY stock_hst.io_date DESC, stock_hst."createdAt" DESC
```

## 필드 설명

- `id`: 이력 ID
- `io_type`: 입출고 구분 ('IN' = 입고, 'OUT' = 출고)
- `inbound_no`: 입고번호
- `stock_code`: 품목코드
- `stock_name`: 품목명 (wk_stock_base에서 조인)
- `io_date`: 입출고일자
- `preparation_date`: 조제일자 (wk_handstock에서 조인)
- `quantity`: 수량
- `unit`: 단위
- `expiry_date`: 유통기한 (조제일자 + 최대사용기간으로 계산)
- `remark`: 비고
- `createdAt`: 생성일시

## 참고

- 날짜 필터는 `io_date` 기준
- 최신순 정렬 (io_date DESC, createdAt DESC)
- 빈 문자열 파라미터는 필터 미적용
- 품목코드/품목명은 부분일치 검색 (LIKE)
