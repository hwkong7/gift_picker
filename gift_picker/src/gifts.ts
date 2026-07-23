export type Gift = {
    id: string;
    name: string;
    emoji: string;
}

export const gifts: Gift[] = [
    { id: 'perfume', name: '향수', emoji: '🧴' },
    { id: 'cosmetics', name: '화장품', emoji: '💄' },
    { id: 'food', name: '먹을 것', emoji: '🍰' },
    { id: 'mug', name: '머그컵', emoji: '☕' },
    { id: 'oliveyoung', name: '올리브영 기프트카드', emoji: '🎁' },
    { id: 'character', name: '캐릭터 물품', emoji: '🧸' },
];