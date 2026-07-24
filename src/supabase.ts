import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  throw new Error('Supabase 환경변수가 없어요. .env 파일과 VITE_ 접두사를 확인하세요.')
}

export const supabase = createClient(url, key)