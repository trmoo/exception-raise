/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  🏁 오늘의 결과 — 「오늘 배운 것」 을 정리해 보여 주지 않고, 선생님과 함께 학생이 직접 적는 물음
 *  (2026-10-28 사용자 지시). 정답 문장은 화면에 없다. 💡 를 누르면 실마리 낱말만 보인다.
 *  적은 글은 이 기기에 남고(S.notes), [📤 제출하기] 를 누르면 선생님 시트(「오늘 배운 것」)로 간다(2026-10-28 사용자 지시).
 *  ⚠ gas/Code.gs 의 NOTES(물음 id·차시)와 cleanNote_ 가 이 파일과 같아야 한다 — 시험이 대조한다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

// 3차시 하나뿐이라 part 는 모두 'all' 이다(서버 NOTES 와 같은 꼴을 지키려고 남겨 둔다).
export const WRAPUP = [
  { id: 'when', part: 'all', q: 'raise 는 언제 쓰나요? 파이썬이 알아서 내는 예외와 무엇이 다른가요?', hint: '파이썬은 모른다 · 내가 정한 규칙 · 어기면' },
  { id: 'how', part: 'all', q: 'raise 로 예외를 일으키는 코드를 한 줄 적어 보세요.', hint: 'raise · 예외 이름 · ("메시지")' },
  { id: 'ase', part: 'all', q: 'except ValueError as e 에서 e 에는 무엇이 들어 있나요?', hint: '괄호 안 메시지 · print(e)' },
  { id: 'loop', part: 'all', q: '올바른 값이 들어올 때까지 다시 묻게 하려면 어떻게 하나요?', hint: 'while True · except 는 안내 · else 에서 break' },
  { id: 'unsure', part: 'all', q: '🤔 아직 헷갈리는 것 한 가지', hint: '' },
];

/** 이 차시에 보여 줄 물음 */
export function wrapupFor(part) {
  return WRAPUP.filter((w) => part === 'all' || w.part === 'all' || w.part === part);
}

/* ── 제출 ── */
export const NOTE_MAX = 300;

/** 적은 글 다듬기 — 줄바꿈·제어 문자는 빈칸으로, 앞뒤 빈칸 없이, 300자까지. 두 번 다듬어도 같다(서버가 한 번 더 다듬으므로). */
export function cleanNote(v) {
  return String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, NOTE_MAX).trim();
}

/** 이 기기에 적어 두는 열쇠 — 「아직 헷갈리는 것」 처럼 두 차시에 다 나오는 물음은 차시마다 따로 적는다 */
export const noteKey = (w, part) => (w.part === 'all' ? `${w.id}@${part}` : w.id);

/** 이 차시에 제출할 글 { 물음 id: 글 } — 비운 칸도 '' 로 넣는다 */
export function collectNotes(part, notes = {}) {
  const out = {};
  for (const w of wrapupFor(part)) out[w.id] = cleanNote(notes[noteKey(w, part)]);
  return out;
}

/** 제출한 글과 지금 글이 같은지 견주는 꼬리표 */
export const notesSig = (part, byId = {}) => JSON.stringify(wrapupFor(part).map((w) => cleanNote(byId[w.id])));

/** 제출하기 전에 짚어 줄 빈칸 — ⭐ 심화처럼 안 해도 되는 물음은 빼고 센다 */
export const emptyRequired = (part, byId = {}) => wrapupFor(part).filter((w) => !w.optional && !cleanNote(byId[w.id]));
