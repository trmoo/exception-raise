/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  🛡️ 규칙 세우기 미션 카드 — 왼쪽은 내 코드, 오른쪽은 목표와 채점 결과.
 *  채점은 학생 코드를 공격·규칙 공격·정상 손님(끝판왕은 끈질긴 손님)에게 진짜로 실행해 판정한다.
 */
import { h, fill, modal, toast, onCleanup } from '../ui/dom.js';
import { createVending } from '../ui/vending.js';
import { codeView, consoleView, codeEditor } from '../ui/code.js';
import { cardOf, FIELDS, showValue } from '../data/machine.js';
import { missionOf } from '../data/missions.js';
import { runMachine } from '../game/runner.js';
import { checkMission } from '../game/judge.js';
import { S, saveCode, passMission, reportFail } from '../game/store.js';

const VERDICT = {
  blocked: { icon: '🛡️', cls: 'good', text: '막음' },
  crash: { icon: '💥', cls: 'bad', text: '뚫림' },
  silent: { icon: '🤐', cls: 'warn', text: '말 없음' },
  leak: { icon: '🍹', cls: 'bad', text: '팔아 버림' },
  broken: { icon: '⛔', cls: 'bad', text: '코드 오류' },
  blank: { icon: '✏️', cls: 'warn', text: '빈칸' },
};

/** 손님 하나를 내 코드로 다시 돌려 자판기와 콘솔로 보여 준다 */
function showRun(code, item) {
  const vm = createVending({ small: true });
  const r = runMachine(code, item.values);
  vm.show(r, item.values);
  modal(item.label, h('div', { class: 'run-detail' }, vm.el,
    h('div', {}, h('p', { class: 'muted' }, FIELDS.map((f) => `${f.icon} ${showValue(item.values[f.key]) || '(빈칸)'}`).join('  ')), consoleView(r.console))), { ok: '닫기', wide: true });
}

export function missionCard(id) {
  return (body) => {
    const m = missionOf(id);
    const start = S.codes[id] || m.starter;
    let saveT = null;
    const ed = codeEditor(start, {
      onChange: (v) => { clearTimeout(saveT); saveT = setTimeout(() => saveCode(id, v), 400); },
      onRun: () => grade(),
    });
    onCleanup(() => { clearTimeout(saveT); saveCode(id, ed.value); });

    const result = h('div', { class: 'ms-result' });
    let hintLv = 0;
    const hintBox = h('div', { class: 'ms-hint' });
    const paintHint = () => fill(hintBox,
      ...m.hints.slice(0, hintLv).map((t) => h('div', { class: 'hint' }, `💡 ${t}`)),
      hintLv < m.hints.length ? h('button', { class: 'btn small', onClick: () => { hintLv++; paintHint(); } }, `💡 힌트 ${hintLv + 1}`) : null);
    paintHint();

    function grade() {
      saveCode(id, ed.value);
      const c = checkMission(m, ed.value);
      if (c.blank) { ed.mark({ [c.blank]: 'crash' }); ed.focusLine(c.blank); }
      else if (c.broken && c.broken.line) ed.mark({ [c.broken.line]: 'crash' });
      else ed.mark({});
      if (c.pass) { if (passMission(id)) toast(`🎉 ${m.loop ? '🏆 끝판왕' : `미션 ${m.no}`} 통과!`, 'gold'); }
      else reportFail(id, c.fails);
      paintResult(c);
    }

    // 미션 1·2 — 규칙 공격 칩 · 🏆 끝판왕 — 끈질긴 손님 칩 (누르면 그 손님으로 다시 돌려 본다) + 확인 목록
    function paintResult(c) {
      const chips = c.ev && c.ev.persists ? h('div', { class: 'kind-row' }, ...c.ev.persists.map((x) =>
        h('button', { class: `kind ${x.sold ? 'good' : 'bad'}`, title: x.p.label, onClick: () => showRun(ed.value, x.p) },
          h('span', { class: 'k-icon' }, x.sold ? '🎉' : '🔁'), h('span', { class: 'k-name' }, x.p.label))))
        : c.ev ? h('div', { class: 'kind-row' }, ...c.ev.rules.filter((x) => !m.holes || m.holes.includes(x.atk.hole)).map((x) => {
          const v = VERDICT[x.verdict];
          return h('button', { class: `kind ${v.cls}`, title: cardOf(x.atk.hole).name, onClick: () => showRun(ed.value, x.atk) },
            h('span', { class: 'k-icon' }, v.icon), h('span', { class: 'k-name' }, cardOf(x.atk.hole).icon + ' ' + x.atk.label));
        })) : null;
      fill(result,
        h('div', { class: 'ms-head ' + (c.pass ? 'pass' : 'fail') }, c.pass ? '✅ 통과!' : '🔧 조금만 더'),
        chips,
        h('ul', { class: 'checklist' }, ...c.items.map((it) => h('li', { class: it.ok ? 'ok' : 'no' }, it.ok ? '✅ ' : '⬜ ', it.text,
          !it.ok && it.why ? h('div', { class: 'why' }, it.why) : null))),
        ...(c.notes || []).map((n) => h('div', { class: 'note' }, `${n.icon} ${n.text}`)));
    }

    const tools = h('div', { class: 'ms-tools' },
      h('button', { class: 'btn primary', onClick: grade }, '🛡️ 채점하기'),
      h('button', { class: 'btn small', onClick: () => { ed.value = m.starter; saveCode(id, m.starter); } }, '↺ 처음 코드'));

    fill(body, h('div', { class: 'mission' },
      h('div', { class: 'ms-left' }, h('div', { class: 'ms-label' }, '✏️ 내 자판기 코드 ', h('span', { class: 'muted' }, '(Tab 들여쓰기 · Ctrl+Enter 채점)')), ed.el),
      h('div', { class: 'ms-right' },
        h('div', { class: 'ms-goal' }, h('span', { class: 'concept' }, m.concept), ' ', m.goal),
        m.syntax ? h('div', { class: 'ms-syntax' }, codeView(m.syntax)) : null,
        tools, hintBox, result)));
    fill(result, h('p', { class: 'muted' }, m.loop ? '빈칸을 채우고 [🛡️ 채점하기] — 몇 번이고 틀리는 끈질긴 손님 3명과 정상 손님 3명이 들어와요.' : '빈칸을 채우고 [🛡️ 채점하기] — 규칙 공격과 지난 시간의 공격 10가지가 들어와요.'));
  };
}
