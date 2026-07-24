import type { IncomingMessage, ServerResponse } from 'http'

type NaverItem = {
  title: string
  image: string
  link: string
  lprice: string
  mallName: string
  productId: string
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  const url = new URL(req.url ?? '', 'http://localhost')
  const query = url.searchParams.get('query')
  const category = url.searchParams.get('category') ?? ''

  if (!query) {
    res.statusCode = 400
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'query가 필요해요' }))
    return
  }

  const id = process.env.NAVER_CLIENT_ID
  const secret = process.env.NAVER_CLIENT_SECRET

  if (!id || !secret) {
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: '네이버 키가 없어요' }))
    return
  }

  try {
    const searchWord = await refineQuery(query, category)

    const naverUrl =
      'https://openapi.naver.com/v1/search/shop.json' +
      `?query=${encodeURIComponent(searchWord)}&display=4&sort=sim`

    const r = await fetch(naverUrl, {
      headers: {
        'X-Naver-Client-Id': id,
        'X-Naver-Client-Secret': secret,
      },
    })

    if (!r.ok) {
      const text = await r.text()
      console.error('네이버 응답 실패:', r.status, text)
      res.statusCode = 502
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: '네이버 검색 실패' }))
      return
    }

    const data = (await r.json()) as { items: NaverItem[] }

    const products = data.items.map((item) => ({
      id: item.productId,
      name: item.title.replace(/<[^>]*>/g, ''),
      image: item.image,
      url: item.link,
      price: Number(item.lprice),
      mall: item.mallName,
    }))

    res.statusCode = 200
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ products }))
  } catch (e) {
    console.error(e)
    res.statusCode = 500
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: '서버 오류' }))
  }
}

async function refineQuery(query: string, category: string): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return query

  const prompt = `너는 한국 쇼핑몰 검색어를 만드는 도우미야.
사용자가 원하는 선물 카테고리는 "${category}"이고, 사용자가 적은 말은 "${query}"야.

이걸 네이버 쇼핑에서 검색했을 때 좋은 결과가 나올 검색어 한 줄로 바꿔줘.
- 이미 구체적인 브랜드명이나 상품명이면 그대로 써
- 애매하면 대표적인 상품 종류로 바꿔
- 설명이나 따옴표 없이 검색어만 출력해
- 10글자 내외로 짧게`

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    )

    if (!res.ok) {
      console.error('Gemini 실패:', res.status, await res.text())
      return query
    }

    const data = await res.json()
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text

    if (typeof text !== 'string' || text.trim() === '') return query

    console.log(`AI 검색어 변환: "${query}" → "${text.trim()}"`)
    return text.trim()
  } catch (e) {
    console.error('Gemini 오류:', e)
    return query
  }
}