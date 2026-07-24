import { useState } from 'react'
import { gifts } from './gifts'
import type { Gift } from './gifts'
import { supabase } from './supabase'
import './App.css'

type Step = 'intro' | 'name' | 'category' | 'detail' | 'done'

function App() {
  const [step, setStep] = useState<Step>('intro')
  const [name, setName] = useState('')
  const [gift, setGift] = useState<Gift | null>(null)
  const [detail, setDetail] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit() {
    if (!gift) return
    setSending(true)

    const { error } = await supabase.from('responses').insert({
      name: name.trim(),
      gift_id: gift.id,
      detail: detail.trim(),
    })

    setSending(false)

    if (error) {
      alert('전달에 실패했어요 ㅠㅠ 다시 시도해주세요')
      console.error(error)
      return
    }

    setStep('done')
  }

  return (
    <div className="page">
      {step === 'intro' && (
        <div>
          <h1>큰일났어요! 🧚</h1>
          <p>오늘 처음 출근한 선물 요정인데, 배달 명단을 잃어버렸어요...</p>
          <p>저를 좀 도와주실 수 있나요?</p>
          <button className="submit" onClick={() => setStep('name')}>
            시작하기
          </button>
        </div>
      )}

      {step === 'name' && (
        <div>
          <h1>이름을 알려주실 수 있나요?</h1>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="이름을 적어주세요"
          />
          <button
            className="submit"
            onClick={() => setStep('category')}
            disabled={name.trim() === ''}
          >
            다음
          </button>
        </div>
      )}

      {step === 'category' && (
        <div>
          <h1>{name}님, 어떤 선물을 원하시나요?</h1>
          <div className="gift-list">
            {gifts.map((g) => (
              <button
                key={g.id}
                className="gift-card"
                onClick={() => {
                  setGift(g)
                  setStep('detail')
                }}
              >
                <span className="gift-emoji">{g.emoji}</span>
                <span className="gift-name">{g.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'detail' && gift && (
        <div>
          <h1>{gift.question}</h1>
          <input
            type="text"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="자세히 알려주세요"
          />
          <button
            className="submit"
            onClick={handleSubmit}
            disabled={detail.trim() === '' || sending}
          >
            {sending ? '전달하는 중...' : '요정에게 알려주기'}
          </button>
          <button className="back" onClick={() => setStep('category')}>
            ← 다시 고를래요
          </button>
        </div>
      )}

      {step === 'done' && (
        <div>
          <h1>고마워요! 🎉</h1>
          <p>덕분에 명단을 채웠어요. 꼭 전해드릴게요!</p>
        </div>
      )}
    </div>
  )
}

export default App