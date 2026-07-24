export type Gift = {
  id: string;
  name: string;
  emoji: string;
  question: string;
  mode: "search" | "text";
  keyword: string; // 검색어에 붙일 말
};

export const gifts: Gift[] = [
  {
    id: "perfume",
    name: "향수",
    emoji: "🧴",
    question: "어떤 향수를 가지고 싶으신가요?",
    mode: "search",
    keyword: "향수",
  },
  {
    id: "cosmetics",
    name: "화장품",
    emoji: "💄",
    question: "어떤 화장품이 필요하신가요?",
    mode: "search",
    keyword: "화장품",
  },
  {
    id: "food",
    name: "먹을 것",
    emoji: "🍰",
    question: "어떤 걸 드시고 싶으신가요?",
    mode: "search",
    keyword: "기프티콘",
  },
  {
    id: "mug",
    name: "머그컵",
    emoji: "☕",
    question: "어떤 머그컵이 필요하신가요?",
    mode: "search",
    keyword: "머그컵",
  },
  {
    id: "oliveyoung",
    name: "올리브영 기프트카드",
    emoji: "🎁",
    question: "얼마짜리가 필요하신가요?",
    mode: "text",
    keyword: "올리브영 기프트카드",
  },
  {
    id: "character",
    name: "캐릭터 물품",
    emoji: "🧸",
    question: "어떤 캐릭터를 좋아하시나요?",
    mode: "search",
    keyword: "굿즈",
  },
  {
    id: "etc",
    name: "기타",
    emoji: "✏️",
    question: "무엇을 갖고 싶으신가요?",
    mode: "search",
    keyword: "",
  },
];
