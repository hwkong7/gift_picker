import type { IncomingMessage, ServerResponse } from "http";

type SerpApiProduct = {
  product_id?: string;
  title?: string;
  link?: string;
  product_link?: string;
  thumbnail?: string;
  source?: string;
  price?: string;
  extracted_price?: number;
};

type Product = {
  id: string;
  name: string;
  image: string;
  url: string;
  price: number;
  mall: string;
};

type CacheEntry = {
  all: Product[];      // 필터 통과한 상품 전체
  fallback: Product[]; // 필터 전 원본
  at: number;
};

const cache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 60; // 1시간
const PAGE_SIZE = 4;

const isDev = process.env.NODE_ENV === "development";

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse,
) {
  const json = (status: number, body: unknown) => {
    res.statusCode = status;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify(body));
  };

  const url = new URL(req.url ?? "", "http://localhost");
  const query = url.searchParams.get("query")?.trim();
  const rawCategory = url.searchParams.get("category") ?? "";
  const category = rawCategory === "undefined" ? "" : rawCategory.trim();
  const offset = Math.max(0, Number(url.searchParams.get("offset") ?? 0) || 0);
  const retry = url.searchParams.get("retry") === "1";

  const staticMust = (url.searchParams.get("must") ?? "")
    .split(",")
    .map((w) => w.trim())
    .filter(Boolean);

  if (!query) return json(400, { error: "query가 필요해요" });

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const serpApiKey = process.env.SERPAPI_KEY?.trim();

  if (!serpApiKey) return json(500, { error: "SerpApi 키가 없어요" });

  try {
    // ── 1. 검색어 생성 ──────────────────────────────
    const refined = geminiKey
      ? await refineQuery(query, category, geminiKey, retry)
      : { keyword: query, must: [] as string[] };

    let searchWord = refined.keyword.trim();
    if (
      category &&
      !searchWord.toLowerCase().includes(category.toLowerCase()) &&
      staticMust.length === 0 &&        // ← 이 줄 추가
      refined.must.length === 0
    ) {
      searchWord = `${searchWord} ${category}`;
    }

    // retry면 캐시 키를 분리해서 새 결과를 받도록
    const cacheKey = retry ? `${searchWord}::retry` : searchWord;

    console.log(`최종 검색어: "${searchWord}" / must: [${refined.must}]`);

    // ── 2. 캐시 확인 ────────────────────────────────
    const hit = cache.get(cacheKey);
    if (hit && Date.now() - hit.at < CACHE_TTL) {
      console.log(`캐시 사용: "${cacheKey}" (offset ${offset})`);
      return json(200, buildPage(hit, offset, searchWord, true));
    }

    // ── 3. SerpApi 호출 ─────────────────────────────
    const serpUrl = new URL("https://serpapi.com/search");
    serpUrl.searchParams.set("engine", "google_shopping");
    serpUrl.searchParams.set("q", searchWord);
    serpUrl.searchParams.set("gl", "kr");
    serpUrl.searchParams.set("hl", "ko");
    serpUrl.searchParams.set("api_key", serpApiKey);

    const response = await fetch(serpUrl.toString());

    if (!response.ok) {
      const text = await response.text();
      console.error("SerpApi 응답 실패:", response.status, text);
      return json(502, {
        error: "상품 검색 실패",
        detail: isDev ? text : undefined,
      });
    }

    const data = await response.json();

    if (data.error) {
      console.error("SerpApi 오류:", data.error);
      return json(502, {
        error: "상품 검색 실패",
        detail: isDev ? data.error : undefined,
      });
    }

    // ── 4. 변환 ────────────────────────────────────
    const results = (data.shopping_results ?? []) as SerpApiProduct[];

    if (results.length === 0) {
      console.warn("결과 없음. 응답 키:", Object.keys(data).join(", "));
    }

    const fallback: Product[] = results
      .map((item, i) => ({
        id: item.product_id ?? `product-${i}`,
        name: item.title ?? "",
        image: item.thumbnail ?? "",
        url: item.product_link ?? item.link ?? "",
        price:
          typeof item.extracted_price === "number"
            ? item.extracted_price
            : parsePrice(item.price),
        mall: item.source ?? "Google Shopping",
      }))
      .filter((p) => p.name && p.url);

    // ── 5. 카테고리 이탈 필터링 ──────────────────────
    const must = (staticMust.length > 0 ? staticMust : refined.must)
      .map((w) => w.toLowerCase())
      .filter(Boolean);

    const filtered =
      must.length > 0
        ? fallback.filter((p) => {
            const name = p.name.toLowerCase();
            return must.some((w) => name.includes(w));
          })
        : fallback;

    // 너무 많이 걸러지면 원본으로 되돌림
    const all = filtered.length >= 2 ? filtered : fallback;

    console.log(
      `상품 ${fallback.length}개 → 필터 후 ${filtered.length}개 → 사용 ${all.length}개`,
    );

    const entry: CacheEntry = { all, fallback, at: Date.now() };
    cache.set(cacheKey, entry);

    json(200, buildPage(entry, offset, searchWord, false));
  } catch (error) {
    console.error("검색 서버 오류:", error);
    json(500, { error: "서버 오류" });
  }
}

// =====================================================
// 페이지 잘라내기
// =====================================================

function buildPage(
  entry: CacheEntry,
  offset: number,
  searchWord: string,
  cached: boolean,
) {
  // offset이 끝을 넘으면 처음으로 돌아감 (계속 눌러도 계속 보이게)
  const start = entry.all.length > 0 ? offset % entry.all.length : 0;
  const products = entry.all.slice(start, start + PAGE_SIZE);

  // 끝에서 잘려 4개가 안 되면 앞에서 채움
  if (products.length < PAGE_SIZE && entry.all.length > PAGE_SIZE) {
    products.push(...entry.all.slice(0, PAGE_SIZE - products.length));
  }

  return {
    products,
    searchWord,
    cached,
    total: entry.all.length,
    nextOffset: start + PAGE_SIZE,
    hasMore: entry.all.length > PAGE_SIZE,
  };
}

// =====================================================
// Gemini 검색어 변환
// =====================================================

async function refineQuery(
  query: string,
  category: string,
  apiKey: string,
  retry: boolean,
): Promise<{ keyword: string; must: string[] }> {
  const prompt = `너는 한국 쇼핑몰 검색어 생성기야.

카테고리: "${category}"
사용자 입력: "${query}"

JSON만 출력해. 설명, 마크다운 코드블록 금지.
{"keyword": "검색어", "must": ["단어1", "단어2"]}

규칙:
- keyword에는 반드시 구체적인 품목명이 들어가야 해.
  나쁜 예: "디올 화장품" → 품목이 모호해서 향수가 섞여 나옴
  좋은 예: "디올 립스틱"
- 카테고리가 넓으면(화장품, 먹을 것 등) 사용자 의도에 맞는 대표 품목을 하나 골라.
- 브랜드명·캐릭터명은 그대로 유지.
- keyword는 20글자 이내.
- must에는 그 품목의 상품명에 들어갈 단어를 2~4개.
  예: 치킨 → ["치킨", "닭", "후라이드", "양념"]
  예: 립스틱 → ["립스틱", "립", "틴트"]
  예: 텀블러 → ["텀블러", "보온병", "물병"]
${retry ? "- 이번엔 앞서와 다른 품목이나 다른 각도로 골라줘." : ""}`;

  try {
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: retry ? 1.0 : 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      console.error("Gemini 실패:", response.status, await response.text());
      return { keyword: query, must: [] };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || !text.trim()) {
      console.warn("Gemini 응답이 비어 있습니다.");
      return { keyword: query, must: [] };
    }

    const cleaned = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);

    const keyword =
      typeof parsed.keyword === "string" && parsed.keyword.trim()
        ? parsed.keyword.trim()
        : query;

    const must = Array.isArray(parsed.must)
      ? parsed.must.filter((w: unknown) => typeof w === "string" && w.trim())
      : [];

    console.log(`AI 변환: "${query}" → "${keyword}"`);
    return { keyword, must };
  } catch (error) {
    console.error("Gemini 오류:", error);
    return { keyword: query, must: [] };
  }
}

function parsePrice(price?: string): number {
  if (!price) return 0;
  return Number(price.replace(/[^0-9]/g, "")) || 0;
}