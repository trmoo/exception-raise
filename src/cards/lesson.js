/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  예제 카드 — 값을 골라 실행하면 실행된 줄·멈춘 줄·잡은 줄이 칠해진다.
 *    lessonCard(id)  예제 하나 (l5 raise · l6 as e)
 *    whyCard2        「if 로도 되는데 왜 raise?」 — 같은 값으로 네 판(A~D)을 견준다
 *    loopCard        🏆 끝판왕 — 올바른 값이 들어올 때까지 다시 묻기 (입력 칸에 쉼표로 여러 값)
 */
import { h, fill } from '../ui/dom.js';
import { codeView, consoleView } from '../ui/code.js';
import { runPython } from '../lib/pymini.js';
import { LESSONS, WHY, LOOP } from '../data/lessons.js';

// 카드마다 오른쪽에 둘 짧은 설명
const NOTES = {
  l5: ['raise 예외이름("메시지") — 규칙을 어기면 예외를 내가 직접 일으킨다.', 'raise 아래 줄은 실행되지 않는다. 잡지 않으면 파이썬이 낸 예외처럼 멈추고, 괄호 안 메시지가 그대로 보인다.', '-3 과 열일곱을 넣어 견줘 보세요. 누가 일으킨 예외일까요?'],
  l6: ['내가 일으킨 예외도 except 가 똑같이 잡는다.', 'except ValueError as e: — 일어난 예외에 e 라는 이름을 붙여 받는다. print(e) 하면 괄호 안 메시지가 나온다.', '열일곱을 넣으면? 파이썬이 만든 메시지(영어)가 e 에 들어 있어요.'],
  loop: ['while True: 로 감싸고, 성공하면(else) break 로 빠져나온다.', '실패하면 except 가 안내하고 반복의 처음으로 돌아가 다시 묻는다.', '「열일곱, -3, 17」 처럼 쉼표로 여러 값을 적으면 다시 물을 때마다 차례로 들어가요.'],
};

/** 쉼표로 적은 여러 값 → 입력 목록 (seq 칸) */
const splitSeq = (s) => String(s).split(',').map((x) => x.trim());

/** 실행해 보기 한 덩어리 */
function runner(lesson) {
  // 처음에는 아무 값도 고르지 않은 상태 — 학생이 칩을 고르거나 직접 쓴다
  const vals = lesson.fields.map(() => '');
  const codeHost = h('div', { class: 'ls-code' });
  const outHost = h('div', { class: 'ls-out' });
  // 값을 바꾸면 결과를 지우고 기다린다 — 실행은 언제나 [▶ 실행] 을 눌러야 한다
  function ready() {
    fill(codeHost, codeView(lesson.code));
    fill(outHost, consoleView('값을 고르고 [▶ 실행] 을 눌러 보세요.'));
  }
  const inputs = lesson.fields.map((f, k) => {
    const inp = h('input', { type: 'text', value: '', placeholder: '골라 보세요', 'aria-label': f.label, spellcheck: 'false' });
    const chips = f.chips.map((c) => h('button', { class: 'chip', onClick: () => { inp.value = c; pick(); } }, c));
    // 칸의 값과 같은 칩에 불을 켠다
    function pick() {
      vals[k] = inp.value;
      chips.forEach((b) => b.classList.toggle('on', b.textContent === inp.value));
      ready();
    }
    inp.addEventListener('input', pick);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') run(); });
    return h('label', { class: 'ls-field' + (f.seq ? ' seq' : '') }, h('span', {}, f.label), inp, h('span', { class: 'chips' }, ...chips));
  });
  function run() {
    const list = lesson.fields.flatMap((f, k) => (f.seq ? splitSeq(vals[k]) : [vals[k]]));
    const r = runPython(lesson.code, { inputs: list, echo: true, file: '예제.py' });
    fill(codeHost, codeView(lesson.code, { ran: r.ran, crash: r.ok ? null : r.errorLine, crashType: r.errorType, caught: r.caught }));
    const eof = !r.ok && r.errorType === 'EOFError' ? '\n\n💡 넣을 값이 다 떨어졌어요. 마지막에 올바른 값을 하나 더 적어 보세요.' : '';
    fill(outHost, consoleView(r.ok ? r.output : `${r.output}\n${r.traceback}${eof}`.trim(),
      { title: r.ok ? (r.caught.length ? '실행 결과 — 🛡️ 예외를 잡았어요' : '실행 결과') : '실행 결과 — 💥 멈췄어요' }));
  }
  ready();
  const controls = h('div', { class: 'ls-controls' }, ...inputs, h('button', { class: 'btn primary', onClick: run }, '▶ 실행'));
  return { codeHost, outHost, controls, run };
}

/** 예제 카드의 틀 — variants 가 여럿이면 위에 알약 단추. note 는 판마다 바뀌는 설명 */
function lessonFrame(body, variants, noteList) {
  const left = h('div', { class: 'ls-left' });
  const right = h('div', { class: 'ls-right' });
  const pills = h('div', { class: 'pills' });
  let cur = 0;
  function show(k) {
    cur = k;
    const v = variants[k];
    const r = runner(v.lesson);
    const notes = h('ul', { class: 'ls-notes' }, ...(v.note ? [v.note] : noteList).map((t) => h('li', {}, t)));
    fill(left, r.codeHost);
    fill(right, variants.length > 1 ? pills : null, r.controls, r.outHost, notes);
    fill(pills, ...variants.map((x, j) => h('button', { class: 'pill' + (j === cur ? ' on' : ''), onClick: () => show(j) }, x.label)));
  }
  fill(body, h('div', { class: 'lesson' }, left, right));
  show(0);
}

export function lessonCard(id) {
  return (body) => lessonFrame(body, [{ label: '', lesson: LESSONS[id] }], NOTES[id] || []);
}

/** 「if 로도 되는데 왜 raise?」 — A if+print · B if/else · C raise · D 함수 */
export function whyRaiseCard(body) {
  lessonFrame(body, WHY.map((w) => ({ label: w.label, lesson: w, note: w.note })), []);
}

/** 🏆 끝판왕 — 맞을 때까지 다시 묻기 */
export function loopCard(body) {
  lessonFrame(body, [{ label: '', lesson: LOOP }], NOTES.loop);
}
