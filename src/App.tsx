import { useState } from "react";
import { gifts } from "./gifts";
import "./App.css";
import { supabase } from "./supabase";

function App() {
  const [name, setName] = useState<string>("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [etcText, setEtcText] = useState<string>("");
  const [sending, setSending] = useState<boolean>(false);
  const [done, setDone] = useState(false);

  const canSubmit =
    name.trim() !== "" &&
    selectedId !== null &&
    (selectedId !== "etc" || etcText.trim() !== "");

  async function handleSubmit() {
    setSending(true);

    const { error } = await supabase.from("responses").insert({
      name: name.trim(),
      gift_id: selectedId,
      etc_text: selectedId === "etc" ? etcText.trim() : null,
    });

    setSending(false);

    if (error) {
      alert("저장에 실패했어 ㅠㅠ 다시 시도해줘");
      console.error(error);
      return;
    }

    setDone(true);
  }
  if (done) {
    return (
      <div className="page">
        <h1>생일 선물 뭐 받고 싶으세요?</h1>
        <p>저장 완료! 고마워요 🎉</p>
      </div>
    );
  }

  return (
    <div className="page">
      <h1>생일 선물 뭐 받고 싶으세요?</h1>

      <label className="field">
        이름
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="이름을 적어줘"
        />
      </label>

      <div className="gift-list">
        {gifts.map((gift) => (
          <button
            key={gift.id}
            className={
              selectedId === gift.id ? "gift-card selected" : "gift-card"
            }
            onClick={() => setSelectedId(gift.id)}
          >
            <span className="gift-emoji">{gift.emoji}</span>
            <span className="gift-name">{gift.name}</span>
          </button>
        ))}
      </div>

      <button
        className={selectedId === "etc" ? "gift-card selected" : "gift-card"}
        onClick={() => setSelectedId("etc")}
      >
        <span className="gift-emoji">✏️</span>
        <span className="gift-name">기타</span>
      </button>

      {selectedId === "etc" && (
        <input
          type="text"
          value={etcText}
          onChange={(e) => setEtcText(e.target.value)}
          placeholder="갖고 싶은 걸 적어줘"
        />
      )}
      <button
        className="submit"
        onClick={handleSubmit}
        disabled={!canSubmit || sending}
      >
        {sending ? "저장 중..." : "저장하기"}
      </button>
    </div>
  );
}

export default App;
