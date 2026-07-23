import { useState } from 'react';
import { gifts } from './gifts';
import './App.css';

function App() {
  const [name, setName] = useState<string>('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [etcText, setEtcText] = useState<string>('');
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
        {gifts.map((gift)=>(
          <button
            key={gift.id}
            className={selectedId === gift.id ? 'gift-card selected' : 'gift-card'}
            onClick={() => setSelectedId(gift.id)}
          >
            <span className="gift-emoji">{gift.emoji}</span>
            <span className="gift-name">{gift.name}</span>
          </button>
        ))}
      </div>

      <button
        className={selectedId === 'etc' ? 'gift-card selected' : 'gift-card'}
        onClick={() => setSelectedId('etc')}
      >
        <span className="gift-emoji">✏️</span>
        <span className="gift-name">기타</span>
      </button>

      {selectedId === 'etc' && (
        <input
          type="text"
          value = {etcText}
          onChange={(e) => setEtcText(e.target.value)}
          placeholder="갖고 싶은 걸 적어줘"
        />
      )}
      <p>이름: {name} / 고른 것: {selectedId ?? '없음'} / 기타 : {etcText}</p>
    </div>
  )
}

export default App
