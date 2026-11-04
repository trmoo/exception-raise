/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  카드 목록 — 한 장에 한 가지만 담는다.
 *    찾기(멈추지 않는 고장) → 왜 except 로는 못 잡나 → raise → as e → if 로도 되는데 왜 raise? → 미션 1·2
 *    → 🏆 끝판왕(맞을 때까지 다시 묻기 — 예제 · 미션) → 확인 문제 → 결과
 */
import { startCard, resultCard } from './start.js';
import { lessonCard, whyRaiseCard, loopCard } from './lesson.js';
import { huntCard, whyCard } from './hunt.js';
import { missionCard } from './mission.js';
import { quizCard } from './quiz.js';
import { QUIZ } from '../data/lessons.js';

export const CHAPTERS = [
  { id: 'c0', short: '시작', label: '시작', color: '#64748b' },
  { id: 'c1', short: '고장 찾기', label: '멈추지 않는 고장', color: '#ef4444' },
  { id: 'c2', short: 'raise', label: 'raise — 예외 일으키기', color: '#2563eb' },
  { id: 'c3', short: '규칙 세우기', label: '규칙 세우기', color: '#7c3aed' },
  { id: 'c7', short: '🏆 끝판왕', label: '🏆 끝판왕 — 맞을 때까지 다시 묻기', color: '#be123c' },
  { id: 'c6', short: '확인 문제', label: '확인 문제', color: '#475569' },
];

export function buildCards() {
  return [
    { id: 'start', chapter: 'c0', title: '부숴봐! 자판기 3차시 — raise', render: startCard },
    { id: 'hunt', chapter: 'c1', title: '🔍 멈추지 않는 고장을 찾아라!', render: huntCard },
    { id: 'why', chapter: 'c1', title: 'except 로는 왜 못 잡을까?', render: whyCard },
    { id: 'l5', chapter: 'c2', title: 'raise — 예외를 직접 일으키기', render: lessonCard('l5') },
    { id: 'l6', chapter: 'c2', title: '내가 일으킨 예외도 except 가 잡는다 — as e', render: lessonCard('l6') },
    { id: 'whyraise', chapter: 'c2', title: 'if 로도 되는데 왜 raise 일까?', render: whyRaiseCard },
    { id: 'm1', chapter: 'c3', title: '🛡️ 미션 1 — 번호 규칙', render: missionCard('m1') },
    { id: 'm2', chapter: 'c3', title: '🛡️ 미션 2 — 사람 수 규칙', render: missionCard('m2') },
    { id: 'loop', chapter: 'c7', title: '🔁 맞을 때까지 다시 묻기 — while · break', render: loopCard },
    { id: 'final', chapter: 'c7', title: '🏆 끝판왕 — 끈질긴 손님을 끝까지 받아라', render: missionCard('final') },
    ...QUIZ.map((q, k) => ({ id: `q${k + 1}`, chapter: 'c6', title: `확인 문제 ${k + 1} / ${QUIZ.length}`, render: quizCard(k) })),
    { id: 'result', chapter: 'c6', title: '🏁 오늘의 결과', render: resultCard },
  ];
}
