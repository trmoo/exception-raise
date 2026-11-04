/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  🔍 멈추지 않는 고장 찾기 — 지난 시간에 만든 방어막 자판기에 값을 넣어,
 *  예외는 다 막는데도 「멈추지 않고 틀리게 파는」 경우 4가지를 찾는다. 찾은 것은 도감 카드가 되어 선생님께 간다.
 *  여기서 「파이썬은 오류라고 여기지 않는다 → except 로는 못 잡는다 → 내가 규칙을 세워 raise 해야 한다」 로 이어진다.
 */
import { h, fill, modal, screenTimeout } from '../ui/dom.js';
import { createVending } from '../ui/vending.js';
import { codeView, consoleView, inputForm } from '../ui/code.js';
import { MACHINE_CODE, FIELDS, CARDS, cardOf, holeHint } from '../data/machine.js';
import { runMachine, logicSlip } from '../game/runner.js';
import { S, addCard, openHoleHint } from '../game/store.js';

/** 도감 줄 — 찾은 카드를 누르면 자세히 */
export function holeSlots(onOpen = openHole) {
  const n = CARDS.filter((x) => S.cards[x.id]).length;
  return h('div', { class: 'got-box' },
    h('div', { class: 'got-title' }, h('b', {}, `🔍 내 도감 ${n}/${CARDS.length}`), ' — 멈추지 않는데 틀린 것'),
    h('div', { class: 'lg-row' }, ...CARDS.map((x) => {
      const got = !!S.cards[x.id];
      return h('button', { class: 'lg-slot' + (got ? ' on' : ''), style: { '--c': x.color }, disabled: !got, onClick: () => onOpen(x) },
        got ? `${x.icon} ${x.name}` : '❔ ???');
    })));
}

function hintBox() {
  const el = h('div', { class: 'hint-box' });
  function draw() {
    const t = holeHint(S.cards, S.hints || {});
    if (!t) { fill(el, h('p', { class: 'hint-done' }, `🎉 ${CARDS.length}가지를 모두 찾았어요! 카드를 눌러 보세요.`)); return; }
    const btn = t.more ? h('button', { class: 'btn hint-btn', onClick: () => { openHoleHint(); draw(); } }, t.level ? `💡 다음 힌트 (${t.level + 1}/${t.total})` : '💡 힌트 보기') : null;
    if (!t.level) { fill(el, h('p', { class: 'hint-wait' }, `${t.found}가지 찾음. 막히면 힌트를 하나씩 열어 보세요.`), btn); return; }
    fill(el, h('p', { class: 'hint-text' }, h('b', {}, `힌트 ${t.level}/${t.total}`), ' ', t.text),
      btn || h('p', { class: 'hint-wait' }, '마지막 힌트예요. 직접 넣어 보세요!'));
  }
  draw();
  return { el, draw };
}

/** 찾은 고장 자세히 — 무엇이 틀렸나 · 내가 넣은 값 · raise 로 세울 규칙(미리 보기) */
export function openHole(x) {
  const got = S.cards[x.id];
  const v = got && got.values;
  modal(`${x.icon} ${x.name}`, h('div', { class: 'dex-detail', style: { '--c': x.color } },
    h('div', { class: 'dd-head' }, h('span', { class: 'dd-nick' }, x.nick)),
    h('section', { class: 'dd-sec' }, h('h4', {}, '📌 무엇이 틀렸나요?'), h('p', {}, x.what)),
    v ? h('section', { class: 'dd-sec' }, h('h4', {}, '🎰 내가 넣은 값'),
      h('div', { class: 'dd-vals' }, ...FIELDS.map((f) => {
        const val = v[f.key] === '' || v[f.key] == null ? '' : String(v[f.key]);
        return h('span', { class: 'dd-val' + (val ? '' : ' empty') }, h('small', {}, `${f.icon} ${f.label}`), h('b', {}, val || '(빈칸)'));
      }))) : null,
    h('section', { class: 'dd-sec' }, h('h4', {}, '🛠 오늘 배울 막는 법 — 규칙을 어기면 raise 로 예외를 일으킨다'),
      codeView(x.rule)),
  ), { ok: '닫기', wide: true });
}

export function huntCard(body) {
  const vm = createVending();
  const codeHost = h('div', { class: 'bk-code' });
  const outHost = h('div', { class: 'bk-out' });
  const banner = h('div', { class: 'banner' }, '지난 시간에 만든 방어막 자판기예요. 예외 5종은 다 막아요. 그런데 ', h('b', {}, '멈추지도 않고 틀리게 파는'), ' 값이 있어요. 찾아보세요!');
  const slotHost = h('div', {});
  const hint = hintBox();
  const form = inputForm({}, { onRun: run, runLabel: '▶ 넣기', compact: true });

  function run(values) {
    const res = runMachine(MACHINE_CODE, values);
    vm.show(res, values);
    fill(codeHost, codeView(MACHINE_CODE, { ran: res.ran, crash: res.status === 'crash' ? res.line : null, crashType: res.type, caught: res.caught }));
    fill(outHost, consoleView(res.console));
    if (res.status === 'calm') {
      banner.className = 'banner ok';
      const c = res.caught[0];
      fill(banner, h('b', {}, `🛡️ 방어막이 막았어요${c ? ` — ${c.type}` : ''}.`), ' 이건 파이썬이 알려 준 오류(예외)예요. 지금 찾는 건 ', h('b', {}, '파이썬도 모르는 고장'), '이에요.');
      return;
    }
    const slip = logicSlip(values, res);
    if (!slip) {
      banner.className = 'banner ok';
      fill(banner, h('b', {}, '✅ 제대로 팔았어요.'), ' 그런데 정말 맞나요? 「한 명당 × 사람 수 = 값」 인지, 고른 음료가 맞는지 따져 보세요.');
      return;
    }
    const x = cardOf(slip.kind);
    const isNew = addCard(slip.kind, { values });
    banner.className = 'banner logic';
    fill(banner, h('b', {}, `🤔 멈추지 않는 고장! ${x.icon} ${x.name}`), ' ', slip.text, isNew ? h('span', { class: 'b-new' }, ' 🎉 새로 찾음!') : null);
    fill(slotHost, holeSlots());
    if (isNew) { hint.draw(); screenTimeout(() => openHole(x), 1300); }
  }

  fill(codeHost, codeView(MACHINE_CODE));
  fill(outHost, consoleView('여기에 자판기가 한 일이 찍혀요.'));
  fill(slotHost, holeSlots());
  fill(body, h('div', { class: 'break' },
    h('div', { class: 'bk-right' }, codeHost, outHost),
    h('div', { class: 'bk-machine' }, vm.el, slotHost, hint.el),
    h('div', { class: 'bk-mid' }, form.el, banner)));
  vm.show(null);
}

/** 「except 로는 왜 못 잡나」 — 파이썬이 내는 예외 ↔ 내가 정하는 규칙 비교 */
export const COMPARE = [
  ['누가 알아채나', '파이썬이 스스로', '아무도 — 내가 정해야'],
  ['예', 'int("칠") · 가격[7] · 1200 // 0', '번호 -1 · 사람 수 -2 · 사람 수 2000'],
  ['그냥 두면', '멈춘다 (except 로 잡을 수 있다)', '멈추지 않고 틀리게 판다'],
  ['막는 법', 'try – except', 'if 로 검사하고 raise 로 예외를 일으킨다'],
];
export function whyCard(body) {
  const table = h('table', { class: 'cmp' },
    h('thead', {}, h('tr', {}, h('th', {}, ''), h('th', { class: 'rt' }, '💥 파이썬이 내는 예외'), h('th', { class: 'lg' }, '🤔 파이썬이 모르는 고장'))),
    h('tbody', {}, ...COMPARE.map(([k, a, b]) => h('tr', {}, h('th', {}, k), h('td', { class: 'rt' }, a), h('td', { class: 'lg' }, b)))));
  fill(body, h('div', { class: 'errs' },
    h('div', { class: 'errs-left' },
      h('p', { class: 'lead' }, 'except 는 ', h('b', {}, '예외가 일어났을 때만'), ' 움직여요. 파이썬이 오류라고 여기지 않는 값에는 except 가 할 일이 없어요.'),
      table),
    h('div', { class: 'errs-right' },
      h('div', { class: 'pair logic' },
        h('div', { class: 'pair-head' }, h('b', {}, '💡 그러면 어떻게?')),
        h('p', { class: 'pair-note' }, '「번호는 0 이상」, 「사람 수는 1명 이상」 처럼 ', h('b', {}, '내가 규칙을 정하고'), ', 규칙을 어기면 ', h('b', {}, '내가 직접 예외를 일으키면'), ' 돼요.'),
        codeView('if 번호 < 0:\n    raise IndexError("0~4번 중에서 골라 주세요.")'),
        h('p', { class: 'pair-note' }, '그러면 이 고장도 다른 예외처럼 ', h('b', {}, 'except 가 잡아'), ' 줘요. 이 낱말 ', h('b', {}, 'raise'), '(들어 올리다 · 일으키다)를 오늘 배워요.')))));
}
