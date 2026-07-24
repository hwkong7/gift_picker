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
    const naverUrl =
      'https://openapi.naver.com/v1/search/shop.json' +
      `?query=${encodeURIComponent(query)}&display=4&sort=sim`

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