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

// 크레딧 절약용 캐시 (같은 검색어 1시간 재사용)
const cache = new Map<string, { data: Product[]; at: number }>();
const CACHE_TTL = 1000 * 60 * 60;

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

  if (!query) return json(400, { error: "query가 필요해요" });

  const geminiKey = process.env.GEMINI_API_KEY?.trim();
  const serpApiKey = process.env.SERPAPI_KEY?.trim();

  if (!serpApiKey) return json(500, { error: "SerpApi 키가 없어요" });

  try {
    // 1. Gemini로 검색어 정리 (실패해도 원본 사용)
    let searchWord = geminiKey
      ? await refineQuery(query, category, geminiKey)
      : query;

    if (category && !searchWord.toLowerCase().includes(category.toLowerCase())) {
      searchWord = `${searchWord} ${category}`;
    }
    searchWord = searchWord.trim();

    console.log(`최종 검색어: "${searchWord}"`);

    // 2. 캐시 확인
    const hit = cache.get(searchWord);
    if (hit && Date.now() - hit.at < CACHE_TTL) {
      console.log(`캐시 사용: "${searchWord}"`);
      return json(200, { products: hit.data, searchWord, cached: true });
    }

    // 3. SerpApi 호출
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

    // 4. 결과 변환
    const results = (data.shopping_results ?? []) as SerpApiProduct[];

    if (results.length === 0) {
      console.warn("결과 없음. 응답 키:", Object.keys(data).join(", "));
    }

    const products: Product[] = results
      .slice(0, 4)
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

    console.log(`상품 ${products.length}개 검색 완료`);

    cache.set(searchWord, { data: products, at: Date.now() });

    json(200, { products, searchWord });
  } catch (error) {
    console.error("검색 서버 오류:", error);
    json(500, { error: "서버 오류" });
  }
}

// =====================================================
// Gemini 검색어 변환
// =====================================================

async function refineQuery(
  query: string,
  category: string,
  apiKey: string,
): Promise<string> {
  const prompt = `너는 한국 쇼핑몰 상품 검색어를 만드는 도우미야.

선물 카테고리: "${category}"
사용자가 적은 말: "${query}"

Google Shopping에서 상품을 검색하기 좋은 짧고 명확한 검색어를 만들어줘.

규칙:
- 반드시 "${category}" 종류의 상품이어야 해.
- 브랜드명·캐릭터명·상품명이 있으면 그대로 유지해.
- 애매한 표현은 실제 쇼핑몰에서 쓰는 상품명으로 바꿔.
- 검색어만 출력. 설명·따옴표·마침표 금지.
- 20글자 이내.

예시:
카테고리 "머그컵", 입력 "포차코" → 포차코 머그컵
카테고리 "향수", 입력 "여름에 뿌릴 시원한 거" → 시트러스 향수
카테고리 "텀블러", 입력 "귀여운 거" → 귀여운 텀블러`;

  try {
    const model = process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });

    if (!response.ok) {
      console.error("Gemini 실패:", response.status, await response.text());
      return query;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (typeof text !== "string" || !text.trim()) {
      console.warn("Gemini 검색어가 비어 있습니다.");
      return query;
    }

    const refined = text
      .trim()
      .replace(/^["'""'']+|["'""'']+$/g, "")
      .replace(/\n/g, " ")
      .trim();

    console.log(`AI 검색어 변환: "${query}" → "${refined}"`);
    return refined || query;
  } catch (error) {
    console.error("Gemini 오류:", error);
    return query;
  }
}

function parsePrice(price?: string): number {
  if (!price) return 0;
  return Number(price.replace(/[^0-9]/g, "")) || 0;
}