export type Gift = {
  id: string;
  name: string;
  emoji: string;
  question: string;
  mode: "search" | "text";
  keyword: string; // 검색어에 붙일 말
  must?: string[]; // 상품명에 이 중 하나는 꼭 있어야 함 (카테고리 이탈 방지)
};

export const gifts: Gift[] = [
  // ── 뷰티 ─────────────────────────────
  {
    id: "perfume",
    name: "향수",
    emoji: "🧴",
    question: "어떤 향수를 가지고 싶으신가요?",
    mode: "search",
    keyword: "향수",
    must: ["향수", "퍼퓸", "오드", "코롱"],
  },
  {
    id: "lip",
    name: "립 메이크업",
    emoji: "💄",
    question: "어떤 립 제품이 필요하신가요?",
    mode: "search",
    keyword: "립스틱",
    must: ["립", "틴트", "글로스"],
  },
  {
    id: "skincare",
    name: "스킨케어",
    emoji: "🧼",
    question: "어떤 스킨케어가 필요하신가요?",
    mode: "search",
    keyword: "스킨케어",
    must: ["크림", "세럼", "앰플", "토너", "로션", "에센스", "클렌징"],
  },

  // ── 리빙 ─────────────────────────────
  {
    id: "mug",
    name: "머그컵·텀블러",
    emoji: "☕",
    question: "어떤 컵이 필요하신가요?",
    mode: "search",
    keyword: "머그컵",
    must: ["머그", "컵", "텀블러", "보온병", "물병"],
  },
  {
    id: "candle",
    name: "캔들·디퓨저",
    emoji: "🕯️",
    question: "어떤 향을 좋아하시나요?",
    mode: "search",
    keyword: "디퓨저",
    must: ["캔들", "디퓨저", "방향제", "룸스프레이", "인센스"],
  },
  {
    id: "pajama",
    name: "잠옷·홈웨어",
    emoji: "🛏️",
    question: "어떤 잠옷이 필요하신가요?",
    mode: "search",
    keyword: "잠옷",
    must: ["잠옷", "파자마", "홈웨어", "수면", "가운"],
  },

  // ── 패션 ─────────────────────────────
  {
    id: "bag",
    name: "가방·지갑",
    emoji: "👜",
    question: "어떤 가방이 필요하신가요?",
    mode: "search",
    keyword: "가방",
    must: ["가방", "백", "지갑", "파우치", "크로스", "토트"],
  },
  {
    id: "accessory",
    name: "액세서리",
    emoji: "💍",
    question: "어떤 액세서리를 좋아하시나요?",
    mode: "search",
    keyword: "액세서리",
    must: ["목걸이", "귀걸이", "반지", "팔찌", "키링", "브로치"],
  },
  {
    id: "socks",
    name: "양말·머플러",
    emoji: "🧣",
    question: "어떤 걸 찾으시나요?",
    mode: "search",
    keyword: "양말",
    must: ["양말", "삭스", "머플러", "목도리", "장갑", "비니"],
  },

  // ── 푸드 ─────────────────────────────
  {
    id: "cake",
    name: "케이크·디저트",
    emoji: "🍰",
    question: "어떤 디저트를 좋아하시나요?",
    mode: "search",
    keyword: "케이크",
    must: ["케이크", "디저트", "쿠키", "마카롱", "초콜릿", "타르트", "푸딩"],
  },
  {
    id: "coffee",
    name: "커피·차",
    emoji: "🍵",
    question: "어떤 걸 좋아하시나요?",
    mode: "search",
    keyword: "원두",
    must: ["커피", "원두", "드립백", "티백", "홍차", "녹차"],
  },
  {
    id: "gifticon",
    name: "먹거리 기프티콘",
    emoji: "🍗",
    question: "어떤 걸 드시고 싶으신가요?",
    mode: "search",
    keyword: "기프티콘",
    must: ["기프티콘", "교환권", "상품권", "쿠폰"],
  },

  // ── 테크·취미 ─────────────────────────
  {
    id: "earphone",
    name: "이어폰·스피커",
    emoji: "🎧",
    question: "어떤 제품을 찾으시나요?",
    mode: "search",
    keyword: "이어폰",
    must: ["이어폰", "헤드폰", "스피커", "버즈", "에어팟"],
  },
  {
    id: "stationery",
    name: "문구·다이어리",
    emoji: "✏️",
    question: "어떤 문구가 필요하신가요?",
    mode: "search",
    keyword: "다이어리",
    must: ["다이어리", "노트", "펜", "스티커", "플래너"],
  },
  {
    id: "character",
    name: "캐릭터 굿즈",
    emoji: "🧸",
    question: "어떤 캐릭터를 좋아하시나요?",
    mode: "search",
    keyword: "굿즈",
    must: ["굿즈", "인형", "피규어", "키링", "쿠션"],
  },
  {
    id: "plant",
    name: "식물·꽃",
    emoji: "🪴",
    question: "어떤 식물을 좋아하시나요?",
    mode: "search",
    keyword: "화분",
    must: ["화분", "식물", "꽃", "꽃다발", "다육", "테라리움"],
  },

  // ── 상품권 ────────────────────────────
  {
    id: "oliveyoung",
    name: "올리브영 기프트카드",
    emoji: "🎁",
    question: "얼마짜리가 필요하신가요?",
    mode: "text",
    keyword: "올리브영 기프트카드",
  },

  // ── 기타 ─────────────────────────────
  {
    id: "etc",
    name: "기타",
    emoji: "✨",
    question: "무엇을 갖고 싶으신가요?",
    mode: "search",
    keyword: "",
  },
];