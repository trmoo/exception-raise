/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  미션 채점기. 학생 코드를 공격 · 규칙 공격 · 정상 손님에게 진짜로 실행해 보고 판정한다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */
import { runMachine, shape, BLANK } from './runner.js';
import { MACHINE_CODE, cardOf } from '../data/machine.js';
import { ATTACKS, RULES, NORMALS, PERSIST, lastValues } from '../data/missions.js';

export const KINDS = ['ValueError', 'ZeroDivisionError', 'IndexError', 'KeyError', 'TypeError'];
export const HOLES = ['negIndex', 'negPeople', 'zeroShare', 'remainder'];

// 정상 손님에게 원래 자판기가 하던 말 — 규칙을 더해도 이 말은 그대로 나와야 한다
const BASELINE = Object.fromEntries(NORMALS.map((n) => [n.id, runMachine(MACHINE_CODE, n.values, { echo: false }).out]));
export const baselineOf = (id) => BASELINE[id];

function containsInOrder(got, want) {
  let i = 0;
  for (const l of got) if (i < want.length && l.trim() === want[i].trim()) i++;
  return i === want.length;
}

/** 공격 하나 — verdict: blocked(막음) · crash(멈춤) · leak(팔아 버림) · silent(말 없음) · broken · blank */
export function judgeAttack(code, atk, sh) {
  const r = runMachine(code, atk.values, { echo: false });
  const verdict = { blank: 'blank', broken: 'broken', crash: 'crash', silent: 'silent', vend: 'leak' }[r.status] || 'blocked';
  // 내가 세운 규칙(raise)이 막았나 — 잡힌 예외가 raise 줄에서 났는지 본다
  const byRaise = verdict === 'blocked' && !!sh && r.caught.some((c) => sh.raises.includes(c.line));
  return { atk, r, verdict, byRaise, said: r.out.join(' / ') };
}
export function judgeNormal(code, n) {
  const r = runMachine(code, n.values, { echo: false });
  const ok = !['crash', 'broken', 'blank'].includes(r.status) && containsInOrder(r.out, BASELINE[n.id]);
  return { n, r, ok };
}
export function evaluate(code) {
  const sh = shape(code);
  const attacks = ATTACKS.map((a) => judgeAttack(code, a, sh));
  const rules = RULES.map((a) => judgeAttack(code, a, sh));
  return {
    sh, attacks, rules,
    normals: NORMALS.map((n) => judgeNormal(code, n)),
    byId: Object.fromEntries([...attacks, ...rules].map((x) => [x.atk.id, x])),
  };
}

const ruleIds = (...holes) => RULES.filter((a) => holes.includes(a.hole)).map((a) => a.id);
const blockedAll = (ev, ids) => ids.every((id) => ev.byId[id].verdict === 'blocked');

function whyAttack(ev, ids) {
  const bad = ids.map((id) => ev.byId[id]).find((x) => x.verdict !== 'blocked');
  if (!bad) return '';
  const l = bad.atk.label;
  if (bad.verdict === 'crash') return `「${l}」 → 💥 ${bad.r.type} 로 멈췄어요. 그 예외를 잡는 except 가 있나요?`;
  if (bad.verdict === 'silent') return `「${l}」 → 막기는 했는데 아무 말도 안 했어요 🤐`;
  if (bad.verdict === 'leak') return `「${l}」 → 🍹 그대로 팔아 버렸어요. 규칙(if … raise)이 없거나 조건이 틀렸어요.`;
  return `「${l}」 → 막지 못했어요.`;
}

/** 규칙 공격에 내가 raise 한 메시지가 손님에게 보였나 (except … as e 로 꺼내 print 했나) */
function showsMessage(x) {
  const c = x.r.caught.find((k) => k.msg);
  return !!c && x.r.out.some((l) => l.includes(c.msg));
}

/* ── 🏆 끝판왕 — 끈질긴 손님 ─────────────────────────────────────────
 * 칸마다 값을 여러 번 넣는 손님(PERSIST)과 정상 손님만 돌린다.
 * (한 가지 값만 계속 넣는 공격을 다시 묻는 자판기에 넣으면 끝나지 않으므로 여기서는 쓰지 않는다)
 */
const THANKS = '이용해 주셔서 감사합니다.';
// 끝나지 않는 반복 — 해석기가 「실행이 너무 오래」 또는 「출력이 너무 많습니다」 로 멈춘다(break 없이 계속 파는 경우)
const isStuck = (r) => r.status === 'broken' && /너무 오래|출력이 너무 많/.test(r.msg || '');
/** 끈질긴 손님이 결국 받아야 할 판매 문구 — 출발 자판기에 마지막 값만 넣었을 때의 말 (감사 인사 빼고) */
export const persistWant = (p) => runMachine(MACHINE_CODE, lastValues(p.values), { echo: false }).out.filter((l) => l !== THANKS);

export function judgePersist(code, p) {
  const r = runMachine(code, p.values, { echo: false });
  const want = persistWant(p);
  const sales = r.out.filter((l) => /나왔습니다/.test(l)).length;
  const at = r.out.findIndex((l) => /나왔습니다/.test(l));
  const before = at < 0 ? r.out : r.out.slice(0, at);
  const guides = before.filter((l) => l !== THANKS).length;   // 팔기 전에 해 준 안내
  const sold = r.status === 'vend' && sales === 1 && want.every((w) => r.out.includes(w));
  const thanks = r.out.filter((l) => l === THANKS).length;
  return { p, r, sold, guides, guided: guides >= p.bad, thanksOnce: thanks === 1 && r.out.at(-1) === THANKS, want };
}
function whyPersist(x) {
  const r = x.r;
  if (x.sold) return '';
  if (isStuck(r)) return '끝나지 않아요 — 팔고 나서 break 로 빠져나왔나요?';
  if (r.status === 'crash') return `💥 ${r.type} 로 멈췄어요.`;
  if (r.status === 'vend') return '팔기는 했는데 판매 문구가 원래와 달라요(또는 두 번 팔았어요).';
  return `한 번 틀리자 안내만 하고 끝났어요 — 다시 묻게 하세요. (손님이 들은 말: 「${r.out[0] || ''}」)`;
}
export function evaluateFinal(code) {
  return {
    sh: shape(code),
    persists: PERSIST.map((p) => judgePersist(code, p)),
    normals: NORMALS.map((n) => judgeNormal(code, n)),
  };
}
function checkFinal(code) {
  const ev = evaluateFinal(code);
  const broken = [...ev.persists.map((x) => x.r), ...ev.normals.map((x) => x.r)].find((r) => r.status === 'broken' && !isStuck(r));
  if (broken) return { pass: false, broken, ev, items: [{ ok: false, text: '코드가 실행되기', why: `${broken.line || '?'}번째 줄 — ${broken.type}: ${broken.msg}` }], notes: [], fails: ['코드 오류'] };
  const items = [{ ok: ev.sh.loops > 0, text: 'while 로 반복하기' }];
  for (const x of ev.persists) items.push({ ok: x.sold, text: `${x.p.label} — 결국 팔기`, why: whyPersist(x), persist: x.p.id });
  const guided = ev.persists.every((x) => x.guided);
  const bad = ev.persists.find((x) => !x.guided);
  items.push({ ok: guided, text: '틀릴 때마다 안내하기', why: guided ? '' : `「${bad.p.label}」 은 ${bad.p.bad}번 틀렸는데 안내는 ${bad.guides}번뿐이었어요.` });
  const stuck = [...ev.persists, ...ev.normals].some((x) => isStuck(x.r));
  const once = ev.persists.every((x) => x.thanksOnce) && ev.normals.every((x) => x.r.out.filter((l) => l === THANKS).length === 1);
  // 끝나지 않는 반복이면 감사 인사·정상 손님이 틀린 까닭은 break 하나다 — finally 탓으로 잘못 짚지 않게
  const stuckWhy = '반복이 끝나지 않아 맨 아래까지 가지 못했어요 — 먼저 break 를 확인하세요.';
  items.push({ ok: once, text: '감사 인사는 마지막에 한 번만', why: once ? '' : stuck ? stuckWhy : '다시 물을 때마다 감사 인사를 해요. finally 는 반복 안에서는 매번 실행돼요 — 인사를 반복 밖(맨 아래)으로 옮기세요.' });
  const normalsOk = ev.normals.every((x) => x.ok);
  items.push({ ok: normalsOk, text: '정상 손님에게 원래대로 팔기', why: normalsOk ? '' : stuck ? stuckWhy : `「${(ev.normals.find((x) => !x.ok) || {}).n?.label}」 손님이 원래와 다른 결과를 받았어요.` });
  const pass = items.every((x) => x.ok);
  const notes = [];
  if (ev.sh.catchAll) notes.push({ icon: '⚠️', text: 'except: 만 쓰면 모든 예외를 잡지만, 무엇이 잘못됐는지 알 수 없게 되어 오히려 위험합니다.' });
  if (stuck) notes.push({ icon: '🔁', text: 'while True: 는 break 를 만나야 끝나요. 판매(else) 맨 끝에 break 가 있는지 보세요.' });
  const fails = pass ? [] : [
    ...(stuck ? ['끝나지 않음(break)'] : []),
    ...(ev.persists.some((x) => !x.sold) ? ['끈질긴 손님 못 받음'] : []),
    ...(once || stuck ? [] : ['감사 인사 여러 번']),
    ...(normalsOk ? [] : ['정상 손님 실패']),
  ].slice(0, 3);
  return { pass, items, ev, notes, fails };
}

/** 미션 채점 — { pass, items:[{ok,text,why}], ev, notes, fails:[이유 꼬리표] } */
export function checkMission(mission, code) {
  if (code.includes(BLANK)) {
    const line = code.split('\n').findIndex((l) => l.includes(BLANK)) + 1;
    return { pass: false, blank: line, items: [{ ok: false, text: '빈칸(____) 모두 채우기', why: `${line}번째 줄에 아직 빈칸이 있어요.` }], notes: [], fails: ['빈칸'] };
  }
  if (mission.loop) return checkFinal(code);
  const ev = evaluate(code);
  const broken = [...ev.attacks, ...ev.rules, ...ev.normals].find((x) => x.r.status === 'broken');
  if (broken) {
    const r = broken.r;
    return { pass: false, broken: r, ev, items: [{ ok: false, text: '코드가 실행되기', why: `${r.line || '?'}번째 줄 — ${r.type}: ${r.msg}` }], notes: [], fails: ['코드 오류'] };
  }
  const sh = ev.sh;
  const allAtk = ATTACKS.map((a) => a.id);
  const items = [];
  switch (mission.id) {
    case 'm1': {
      const ids = ruleIds('negIndex');
      items.push({ ok: sh.raises.length > 0, text: 'raise 쓰기' });
      items.push({ ok: blockedAll(ev, ids), text: '음수 번호(-1, -5)에 팔지 않기', why: whyAttack(ev, ids), hole: 'negIndex' });
      break;
    }
    case 'm2': {
      const ids = ruleIds('negPeople', 'zeroShare');
      items.push({ ok: blockedAll(ev, ruleIds('negPeople')), text: '사람 수 -2 에 팔지 않기', why: whyAttack(ev, ruleIds('negPeople')), hole: 'negPeople' });
      items.push({ ok: blockedAll(ev, ruleIds('zeroShare')), text: '사람 수 2000 에 팔지 않기', why: whyAttack(ev, ruleIds('zeroShare')), hole: 'zeroShare' });
      const shown = ids.every((id) => showsMessage(ev.byId[id]));
      items.push({ ok: shown, text: 'as e 로 내가 쓴 메시지를 손님에게 보여 주기', why: shown ? '' : 'raise 의 괄호 안 메시지가 손님에게 보이지 않아요. except ValueError as e: 아래에서 e 를 print 하세요.' });
      items.push({ ok: blockedAll(ev, ruleIds('negIndex')), text: '번호 규칙(미션 1) 계속 지키기', why: whyAttack(ev, ruleIds('negIndex')) });
      break;
    }
    default: break;
  }
  items.push({ ok: blockedAll(ev, allAtk), text: '지난 시간의 공격 10가지 계속 막기', why: whyAttack(ev, allAtk) });
  const normalsOk = ev.normals.every((x) => x.ok);
  items.push({ ok: normalsOk, text: '정상 손님에게 원래대로 팔기', why: normalsOk ? '' : `「${(ev.normals.find((x) => !x.ok) || {}).n?.label}」 손님이 원래와 다른 결과를 받았어요.` });
  const pass = items.every((x) => x.ok);
  // 선생님 대시보드에 보낼 「어디서 막혔나」 꼬리표 (짧게)
  const fails = pass ? [] : failTags(ev, normalsOk);
  return { pass, items, ev, notes: advice(ev), fails };
}

/** 「어디서 막혔나」 — 뚫린 규칙(도감 이름) · 멈춘 예외 · 정상 손님 */
function failTags(ev, normalsOk) {
  const leaked = [...new Set(ev.rules.filter((x) => x.verdict !== 'blocked').map((x) => x.atk.hole))].map((h) => `${cardOf(h).name} 못 막음`);
  const crashed = uncaughtKinds(ev).map((k) => `${k} 멈춤`);
  return leaked.concat(crashed).concat(normalsOk ? [] : ['정상 손님 실패']).slice(0, 3);
}

/** 잡히지 않은 예외의 종류 (중복 없이) */
export function uncaughtKinds(ev) {
  return [...new Set([...ev.attacks, ...ev.rules].filter((x) => x.verdict === 'crash').map((x) => x.r.type))];
}

export function advice(ev) {
  const notes = [];
  if (!ev.sh) return notes;
  if (ev.sh.catchAll) notes.push({ icon: '⚠️', text: 'except: 만 쓰면 모든 예외를 잡지만, 무엇이 잘못됐는지 알 수 없게 되어 오히려 위험합니다. 예상되는 예외의 이름을 적어 주세요.' });
  if (ev.sh.silentHandler) notes.push({ icon: '🤐', text: 'except 아래에 pass 만 있으면 손님은 왜 안 되는지 모른 채 떠납니다.' });
  const outside = ev.rules.find((x) => x.verdict === 'crash' && ev.sh.raises.includes(x.r.line));
  if (outside) notes.push({ icon: '🎯', text: `raise 는 했는데 잡지 못해 멈췄어요(${outside.r.type}). raise 하는 줄이 try 안에 있는지, 그 예외를 잡는 except 가 있는지 보세요.` });
  return notes;
}
