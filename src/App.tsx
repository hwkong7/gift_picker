import { useState } from "react";
import { gifts } from "./gifts";
import type { Gift } from "./gifts";
import type { Product } from "./types";
import { supabase } from "./supabase";
import "./App.css";

type Step = "intro" | "name" | "category" | "detail" | "confirm" | "done";

function FairyTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="fairy-title">
      <img src="/fairy-happy.png" alt="" className="fairy-small" />
      <h1>{children}</h1>
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
  const [searchError, setSearchError] = useState("");

  const [picked, setPicked] = useState<Product | null>(null);
  const [sending, setSending] = useState(false);

  async function handleDetailNext() {
    if (!gift) return;

    if (gift.mode === "text") {
      await save(null);
      return;
    }
    // 요정이 최소 1초는 보이도록
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);

    setLoading(true);
    setSearchError("");
    setPicked(null);
    setStep("confirm");

    try {
      const res = await fetch(
        `/api/search?query=${encodeURIComponent(detail)}&category=${encodeURIComponent(gift.keyword)}`,
      );
      const data = await res.json();

      if (!res.ok) {
        setSearchError(data.error ?? "검색에 실패했어요");
        setProducts([]);
      } else {
        setProducts(data.products);
      }
    } catch (e) {
      console.error(e);
      setSearchError("검색에 실패했어요");
      setProducts([]);
    }

    setLoading(false);
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
              <div className="product-list">
                {products.map((p) => (
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
