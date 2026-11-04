/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  차시 범위 — 이 앱은 3차시 하나뿐이다(1·2차시는 exception-basics). 범위를 고르는 화면은 PARTS 가 하나면 숨긴다.
 *  옛 앱과 같은 꼴(PARTS·cardsFor·MISSIONS_OF)을 남겨 둔 것은 서버·대시보드 코드를 그대로 쓰려는 것이다.
 *  ⚠ gas/Code.gs 의 PART_IDS 와 같아야 한다 — 시험이 대조한다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

export const PARTS = [
  { id: 'all', label: '3차시', note: 'raise — 규칙을 세워 예외 일으키기', chapters: null, also: [] },
];
export const partOf = (id) => PARTS.find((p) => p.id === id) || PARTS[PARTS.length - 1];
export const ONE_PART = PARTS.length === 1;

/** 이 차시에 보여 줄 카드만 (차례는 그대로) */
export function cardsFor(cards, partId) {
  const p = partOf(partId);
  if (!p.chapters) return cards.slice();
  return cards.filter((c) => p.chapters.includes(c.chapter) || p.also.includes(c.id));
}

/** 이 차시에 하는 미션 — 결과 카드가 「통과한 미션 n / m」 을 셀 때 쓴다 */
export const MISSIONS_OF = { all: ['m1', 'm2', 'final'] };
