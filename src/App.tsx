import { useRef, useState } from "react";
import { gifts } from "./gifts";
import type { Gift } from "./gifts";
import type { Product } from "./types";
import { supabase } from "./supabase";
import "./App.css";

type Step = "intro" | "name" | "category" | "detail" | "confirm" | "done";

const PAGE_SIZE = 4;

function FairyTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="fairy-title">
      <img src="/fairy-happy.png" alt="" className="fairy-small" />
      <h1>{children}</h1>
    </div>
  );
}

function PageDots({ current, total }: { current: number; total: number }) {
  if (total <= 1) return null;

  const items: (number | "ellipsis")[] = [];
  for (let p = 1; p <= total; p++) {
    const isEdge = p === 1 || p === total;
    const isNearCurrent = Math.abs(p - current) <= 1;
    if (isEdge || isNearCurrent) {
      items.push(p);
    } else if (items[items.length - 1] !== "ellipsis") {
      items.push("ellipsis");
    }
  }

  return (
    <div className="page-dots">
      {items.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`e-${i}`} className="page-dot ellipsis">
            ···
          </span>
        ) : (
          <span
            key={p}
            className={p === current ? "page-dot filled" : "page-dot"}
          />
        ),
      )}
    </div>
  );
}

function App() {
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [gift, setGift] = useState<Gift | null>(null);
  const [detail, setDetail] = useState("");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [nextOffset, setNextOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const [searchedQuery, setSearchedQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const [picked, setPicked] = useState<Product | null>(null);
  const [sending, setSending] = useState(false);

  const totalLoadedPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const visibleProducts = products.slice(
    currentPage * PAGE_SIZE,
    currentPage * PAGE_SIZE + PAGE_SIZE,
  );

  function buildSearchUrl(offset: number, query: string) {
    if (!gift) return "";
    return (
      `/api/search?query=${encodeURIComponent(query)}` +
      `&category=${encodeURIComponent(gift.keyword)}` +
      `&must=${encodeURIComponent((gift.must ?? []).join(","))}` +
      `&offset=${offset}`
    );
  }

  async function runSearch(query: string) {
    if (!gift) return;
    const trimmed = query.trim();
    if (!trimmed) return;

    setLoading(true);
    setSearchError("");
    setPicked(null);
    setProducts([]);
    setNextOffset(0);
    setTotal(0);
    setCurrentPage(0);
    setSearchedQuery(trimmed);

    try {
      const res = await fetch(buildSearchUrl(0, trimmed));
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error ?? "검색에 실패했어요");
        setProducts([]);
      } else {
        setProducts(data.products);
        setNextOffset(data.nextOffset ?? data.products.length);
        setTotal(data.total ?? data.products.length);
      }
    } catch (e) {
      console.error(e);
      setSearchError("검색에 실패했어요");
      setProducts([]);
    }

    setLoading(false);
  }

  async function handleDetailNext() {
    if (!gift) return;

    if (gift.mode === "text") {
      await save(null);
      return;
    }
    // 요정이 최소 1초는 보이도록
    await new Promise((r) => setTimeout(r, 800));
    setStep("confirm");
    await runSearch(detail);
  }

  async function loadMoreProducts() {
    if (loadingMore) return;
    setLoadingMore(true);

    try {
      const res = await fetch(buildSearchUrl(nextOffset, searchedQuery));
      const data = await res.json();

      if (res.ok) {
        const fresh = (data.products as Product[]).filter(
          (p) => !products.some((existing) => existing.id === p.id),
        );
        const newLength = products.length + fresh.length;

        setProducts((prev) => [...prev, ...fresh]);
        setNextOffset(data.nextOffset ?? nextOffset + PAGE_SIZE);
        setTotal(data.total ?? total);
        setCurrentPage(Math.max(0, Math.ceil(newLength / PAGE_SIZE) - 1));
      }
    } catch (e) {
      console.error(e);
    }

    setLoadingMore(false);
  }

  function goPrevPage() {
    setCurrentPage((p) => Math.max(0, p - 1));
  }

  function goNextPage() {
    setCurrentPage((p) => Math.min(totalLoadedPages - 1, p + 1));
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) goNextPage();
    else goPrevPage();
  }

  async function save(product: Product | null) {
    if (!gift) return;
    setSending(true);

    const { error } = await supabase.from("responses").insert({
      name: name.trim(),
      gift_id: gift.id,
      detail: detail.trim(),
      product_name: product?.name ?? null,
      product_image: product?.image ?? null,
      product_url: product?.url ?? null,
      product_price: product?.price ?? null,
    });

    setSending(false);

    if (error) {
      alert("전달에 실패했어요 ㅠㅠ 다시 시도해주세요");
      console.error(error);
      return;
    }

    setStep("done");
  }

  return (
    <div className="page">
      <div className="scene-wrap" key={step}>
        {step === "intro" && (
          <div className="scene intro">
            <div className="intro-stage">
              <span className="sparkle s1">✨</span>
              <span className="sparkle s2">✨</span>
              <span className="sparkle s3">✨</span>
              <img className="fairy" src="/fairy.png" alt="선물 요정" />
              <span className="scroll">📜</span>
            </div>

            <h1 className="intro-title">큰일났어요!</h1>
            <p className="intro-line1">
              오늘 처음 출근한 선물 요정인데,
              <br />
              배달 명단을 잃어버렸어요...
            </p>
            <p className="intro-line2">저를 좀 도와주실 수 있나요?</p>

            <button
              className="submit intro-btn"
              onClick={() => {
                setStep("name");
              }}
            >
              도와줄게요!
            </button>
          </div>
        )}

        {step === "name" && (
          <div className="scene">
            <div>
              <FairyTitle>이름을 알려주실 수 있나요?</FairyTitle>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="이름을 적어주세요"
              />
              <button
                className="submit"
                onClick={() => setStep("category")}
                disabled={name.trim() === ""}
              >
                다음
              </button>
            </div>
          </div>
        )}

        {step === "category" && (
          <div className="scene">
            <div>
              <FairyTitle>{name}님, 어떤 선물을 원하시나요?</FairyTitle>
              <div className="gift-list">
                {gifts.map((g) => (
                  <button
                    key={g.id}
                    className="gift-card"
                    onClick={() => {
                      setGift(g);
                      setStep("detail");
                    }}
                  >
                    <span className="gift-emoji">{g.emoji}</span>
                    <span className="gift-name">{g.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "detail" && gift && (
          <div className="scene">
            <div>
              <FairyTitle>{gift.question}</FairyTitle>
              <input
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                placeholder="자세히 알려주세요"
              />
              <button
                className="submit"
                onClick={handleDetailNext}
                disabled={detail.trim() === "" || sending}
              >
                {sending ? "전달하는 중..." : "다음"}
              </button>
              <button className="back" onClick={() => setStep("category")}>
                ← 다시 고를래요
              </button>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="scene">
            <div className="search-box">
              <input
                type="text"
                value={detail}
                onChange={(e) => setDetail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    runSearch(detail);
                  }
                }}
                placeholder="검색어를 입력해주세요"
              />
              <button
                type="button"
                className="search-box-btn"
                onClick={() => runSearch(detail)}
                disabled={loading || detail.trim() === ""}
                aria-label="다시 검색"
              >
                🔍
              </button>
            </div>

            <FairyTitle>혹시 이건가요?</FairyTitle>

            {loading && (
              <div className="loading-box">
                <img src="/fairy-search.png" alt="" className="fairy-loading" />
                <p>요정이 찾아보는 중이에요...</p>
              </div>
            )}

            {!loading && searchError && <p>{searchError}</p>}

            {!loading && !searchError && products.length === 0 && (
              <p>비슷한 걸 못 찾았어요...</p>
            )}

            {!loading && products.length > 0 && (
              <>
                <div className="product-pager">
                  <button
                    type="button"
                    className="page-arrow"
                    onClick={goPrevPage}
                    disabled={currentPage === 0}
                    aria-label="이전 페이지"
                  >
                    ‹
                  </button>

                  <div
                    className="product-list"
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                  >
                    {visibleProducts.map((p) => (
                      <button
                        key={p.id}
                        className={
                          picked?.id === p.id
                            ? "product-card selected"
                            : "product-card"
                        }
                        onClick={() => setPicked(p)}
                      >
                        <img src={p.image} alt={p.name} />
                        <span className="product-name">{p.name}</span>
                        <span className="product-price">
                          {p.price.toLocaleString()}원
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="page-arrow"
                    onClick={goNextPage}
                    disabled={currentPage >= totalLoadedPages - 1}
                    aria-label="다음 페이지"
                  >
                    ›
                  </button>
                </div>

                {totalLoadedPages > 1 && (
                  <div className="page-info">
                    <PageDots current={currentPage + 1} total={totalLoadedPages} />
                    <span className="page-count-text">
                      {currentPage + 1} / {totalLoadedPages}페이지 · 총{" "}
                      {total}개
                    </span>
                  </div>
                )}

                {products.length < total && (
                  <button
                    className="load-more"
                    onClick={loadMoreProducts}
                    disabled={loadingMore}
                  >
                    {loadingMore ? "더 찾는 중..." : "더 찾아보기"}
                  </button>
                )}
              </>
            )}

            {!loading && (
              <>
                {picked ? (
                  <button
                    className="submit"
                    onClick={() => save(picked)}
                    disabled={sending}
                  >
                    {sending ? "전달하는 중..." : "이걸로 할게요!"}
                  </button>
                ) : (
                  <button
                    className="submit"
                    onClick={() => save(null)}
                    disabled={sending}
                  >
                    {sending
                      ? "전달하는 중..."
                      : "여기 없어요, 적은 대로 전해주세요"}
                  </button>
                )}

                <button className="back" onClick={() => setStep("detail")}>
                  ← 다시 적을래요
                </button>
              </>
            )}
          </div>
        )}

        {step === "done" && (
          <div className="scene done-scene">
            <img src="/fairy-done.png" alt="" className="fairy-done" />
            <h1>고마워요! 🎉</h1>
            <p>
              덕분에 명단을 채웠어요.
              <br />꼭 전해드릴게요!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
