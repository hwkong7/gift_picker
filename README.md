# 🎁 Gift Picker (선물 요정)

친구/동료에게 "무슨 선물을 받고 싶은지"를 재미있게 물어보는 대화형 웹 앱이에요.
선물 요정 캐릭터가 안내하는 흐름을 따라가며 선물 카테고리를 고르고, 원하는
디테일을 입력하면 실제 쇼핑몰 상품을 검색해서 추천해주고, 최종 응답을
Supabase 데이터베이스에 저장합니다.

## 동작 흐름

1. **이름 입력** → 응답자 이름을 받아요.
2. **선물 카테고리 선택** (`src/gifts.ts`) — 향수, 화장품, 먹을 것, 머그컵,
   올리브영 기프트카드, 캐릭터 물품, 기타 중 선택.
3. **디테일 입력** — 카테고리마다 정해진 질문(`gift.question`)에 답해요.
   - `mode: "search"`인 카테고리는 입력한 디테일로 상품을 검색합니다.
   - `mode: "text"`인 카테고리(예: 기프트카드)는 검색 없이 바로 저장합니다.
4. **상품 검색 및 확인** — `/api/search` 서버리스 함수가:
   - (선택) Gemini API로 사용자의 자연어 입력을 쇼핑 검색어로 다듬고,
   - SerpApi(Google Shopping)로 실제 상품을 검색한 뒤,
   - 상위 4개 상품을 반환합니다. (동일 검색어는 1시간 캐시)
5. **저장 완료** — 선택한 상품(또는 텍스트 응답)을 Supabase `responses`
   테이블에 저장하고 완료 화면을 보여줍니다.

## 기술 스택

- **프론트엔드**: React 19 + TypeScript + Vite
- **백엔드**: Vercel 서버리스 함수 (`api/search.ts`)
- **데이터베이스**: Supabase
- **외부 API**: Google Gemini (검색어 정제), SerpApi Google Shopping (상품 검색)

## 프로젝트 구조

```
api/
  search.ts        # 상품 검색 서버리스 함수 (Gemini + SerpApi)
src/
  App.tsx           # 전체 UI 및 단계별(step) 흐름 관리
  gifts.ts          # 선물 카테고리 정의
  types.ts          # 공용 타입 (Product 등)
  supabase.ts        # Supabase 클라이언트 초기화
public/
  fairy*.png        # 요정 캐릭터 이미지
```

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 만들고 아래 값을 채워주세요.

```bash
# Supabase (프론트엔드에서 사용, VITE_ 접두사 필수)
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# 상품 검색 서버리스 함수(api/search.ts)에서 사용
SERPAPI_KEY=           # 필수 - https://serpapi.com
GEMINI_API_KEY=        # 선택 - 없으면 사용자가 입력한 원문 그대로 검색
GEMINI_MODEL=          # 선택 - 기본값 gemini-flash-latest
```

Supabase 프로젝트에는 아래와 같은 형태의 `responses` 테이블이 필요합니다.

| 컬럼 | 타입 |
| --- | --- |
| name | text |
| gift_id | text |
| detail | text |
| product_name | text (nullable) |
| product_image | text (nullable) |
| product_url | text (nullable) |
| product_price | numeric (nullable) |

### 3. 개발 서버 실행

```bash
npm run dev
```

`/api/search`는 Vercel 서버리스 함수이므로, 로컬에서 API까지 함께 테스트하려면
`vercel dev`로 실행하는 것을 권장합니다.

```bash
vercel dev
```

### 4. 빌드

```bash
npm run build
```

## 배포

이 프로젝트는 Vercel 배포를 기준으로 구성되어 있습니다. Vercel 대시보드(또는
`vercel env`)에 위의 환경 변수를 등록한 뒤 배포하세요.
