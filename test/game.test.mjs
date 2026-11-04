/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  자판기 · 도감 · 미션 · 예제 · 확인 문제. 「화면에 적은 것과 실제 동작이 어긋나지 않는가」 를 지킨다.
 */
import { 묶음, 확인, 참 } from './harness.mjs';
import { MACHINE_CODE, PRODUCTS, COUPONS, CARDS, FIELDS, makeInputFn, cardOf, holeHint, holeOpenNext } from '../src/data/machine.js';
import { MISSIONS, ATTACKS, RULES, NORMALS, PERSIST, lastValues } from '../src/data/missions.js';
import { LESSONS, QUIZ, WHY, LOOP } from '../src/data/lessons.js';
import { runMachine, shape, BLANK, logicSlip } from '../src/game/runner.js';
import { checkMission, HOLES, persistWant } from '../src/game/judge.js';
import { runPython } from '../src/lib/pymini.js';
import { scoreOf, stuckText, MISSION_LABEL } from '../src/teacher/score.js';
import { koreanOf } from '../src/data/translate.js';
import { readFileSync } from 'node:fs';
import { WRAPUP, wrapupFor, cleanNote, noteKey, collectNotes, notesSig, emptyRequired } from '../src/data/wrapup.js';
import { snoOk, nameOk, maskName, cleanSno, cleanName } from '../src/data/who.js';
import { PARTS, cardsFor, MISSIONS_OF, ONE_PART } from '../src/data/parts.js';
import { loadServer } from '../tools/fake-gas.mjs';

// input( ) 에 차례로 값을 넣되 질문 문구는 찍지 않는다
const run = (code, inputs = []) => runPython(code, { inputFn: (p, k) => inputs[k] });
const V = (o) => ({ num: '0', coupon: '', people: '1', ...o });

묶음('자판기 — 지난 시간의 방어막 자판기');
{
  const r = runPython(`${MACHINE_CODE.split('\n').slice(0, 3).join('\n')}\nprint(메뉴)\nprint(가격)\nprint(쿠폰)`);
  확인('메뉴', r.lines[0], `[${PRODUCTS.map((p) => `'${p.name}'`).join(', ')}]`);
  확인('가격', r.lines[1], `[${PRODUCTS.map((p) => p.price).join(', ')}]`);
  확인('쿠폰', r.lines[2], `{${Object.entries(COUPONS).map(([k, v]) => `'${k}': ${typeof v === 'string' ? `'${v}'` : v}`).join(', ')}}`);
  for (const f of FIELDS) 참(`입력 칸 「${f.label}」 의 질문이 코드에 있다`, MACHINE_CODE.split('\n').some((l) => l.includes('input(') && f.match.test(l.slice(l.indexOf('input(')))));
  const fn = makeInputFn({ num: 'N', coupon: 'C', people: 'P' });
  확인('질문 문구로 칸 고르기', [fn('나눠 낼 사람 수: ', 0), fn('메뉴 번호(0~4): ', 2), fn('쿠폰 코드: ', 0)], ['P', 'N', 'C']);
  참('출발 자판기에는 raise 가 없다 (오늘 더할 것)', shape(MACHINE_CODE).raises.length === 0);
  참('출발 자판기에는 else·finally 가 있다 (2차시의 끝)', shape(MACHINE_CODE).hasElse && shape(MACHINE_CODE).hasFinally);
  for (const a of ATTACKS) 확인(`지난 시간의 공격 「${a.label}」 은 이미 막는다`, runMachine(MACHINE_CODE, a.values).status, 'calm');
  for (const a of RULES) 확인(`규칙 공격 「${a.label}」 은 그대로 팔아 버린다`, runMachine(MACHINE_CODE, a.values).status, 'vend');
  for (const n of NORMALS) 확인(`정상 손님 「${n.label}」`, runMachine(MACHINE_CODE, n.values).status, 'vend');
  참('모든 출력의 끝은 감사 인사 (finally)', [...ATTACKS, ...RULES, ...NORMALS].every((a) => runMachine(MACHINE_CODE, a.values).out.at(-1) === '이용해 주셔서 감사합니다.'));
}

묶음('🔍 멈추지 않는 고장 — 도감 4가지');
{
  확인('도감 4가지', CARDS.map((x) => x.id), ['negIndex', 'negPeople', 'zeroShare', 'remainder']);
  확인('채점기와 같다', HOLES, CARDS.map((x) => x.id));
  for (const x of CARDS) {
    const v = V(x.try);
    const r = runMachine(MACHINE_CODE, v);
    확인(`${x.name} — 마지막 힌트 값은 멈추지 않고 판다`, r.status, 'vend');
    확인(`${x.name} — 그리고 이 고장으로 판정된다`, logicSlip(v, r) && logicSlip(v, r).kind, x.id);
    참(`${x.name} — 힌트 3단계, 마지막에만 넣을 값`, x.hints.length === 3 && Object.values(x.try).every((val) => x.hints[2].includes(val) && !x.hints[0].includes(` ${val} `)));
    // 카드에 보여 주는 규칙을 출발 자판기의 try 안에 넣으면 정말 그 값을 막는다
    const at = x.id === 'negIndex' ? '    값 = 가격[번호]' : '    한명몫 = 값 // 인원';
    const rule = x.rule.split('\n').map((l) => '    ' + l).join('\n');
    const fixed = MACHINE_CODE.replace(at, `${rule}\n${at}`);
    const r2 = runMachine(fixed, v);
    확인(`${x.name} — 카드의 raise 규칙을 넣으면 막힌다`, [r2.status, !!r2.caught[0] && shape(fixed).raises.includes(r2.caught[0].line)], ['calm', true]);
    참(`${x.name} — 규칙을 넣어도 정상 손님은 그대로`, NORMALS.every((n) => runMachine(fixed, n.values).status === 'vend'));
    참(`${x.name} — 규칙 공격이 있다`, RULES.some((a) => a.hole === x.id));
  }
  for (const a of RULES) 확인(`규칙 공격 「${a.label}」 은 「${cardOf(a.hole).name}」`, logicSlip(a.values, runMachine(MACHINE_CODE, a.values)).kind, a.hole);
  참('지난 시간의 공격은 고장 카드가 아니다 (방어막이 막는다)', ATTACKS.every((a) => logicSlip(a.values, runMachine(MACHINE_CODE, a.values)) === null));
  확인('정상 손님은 고장이 아니다', NORMALS.map((n) => logicSlip(n.values, runMachine(MACHINE_CODE, n.values))), NORMALS.map(() => null));
  확인('-6번은 IndexError 라 방어막이 막는다 (고장 아님)', runMachine(MACHINE_CODE, V({ num: '-6' })).status, 'calm');
  참('메뉴 이름이 모두 받침 없음 (「…가 나왔어요」 조사)', PRODUCTS.every((p) => (p.name.charCodeAt(p.name.length - 1) - 0xac00) % 28 === 0));

  확인('처음 힌트는 첫째 것, 아직 안 엶', [holeHint({}).target, holeHint({}).level], ['negIndex', 0]);
  const seen = holeOpenNext({}, {});
  확인('한 번 누르면 1단계', holeHint({}, seen).text, CARDS[0].hints[0]);
  확인('3단계에서 멈춘다', holeHint({}, holeOpenNext({}, holeOpenNext({}, holeOpenNext({}, seen)))).more, false);
  확인('찾으면 다음 목표로', holeHint({ negIndex: {} }, seen).target, 'negPeople');
  확인('다 찾으면 없음', holeHint(Object.fromEntries(CARDS.map((x) => [x.id, {}]))), null);
}

묶음('미션 — 모범 답안은 통과, 빈칸 코드는 막힌다');
for (const m of MISSIONS) {
  확인(`${m.id} 모범 답안 통과`, checkMission(m, m.answer).items.filter((x) => !x.ok).map((x) => x.text), []);
  참(`${m.id} 모범 답안에 except: 만능 방어막이 없다`, !shape(m.answer).catchAll);
  참(`${m.id} 모범 답안에 raise 가 있다`, shape(m.answer).raises.length > 0);
  참(`${m.id} 모범 답안에 파일 입출력이 없다`, !/\bopen\(|FileNotFoundError/.test(m.answer));
  if (!m.boss) {
    참(`${m.id} 빈칸 코드에 빈칸이 있다`, m.starter.includes(BLANK));
    참(`${m.id} 빈칸 코드는 통과 못 한다`, !checkMission(m, m.starter).pass);
  }
  참(`${m.id} 출발 자판기로는 못 넘는다`, !checkMission(m, MACHINE_CODE).pass);
}
{
  // 빈칸을 마지막 힌트에 적은 차례대로 채우면 모범 답안이 된다 (힌트가 틀린 차례를 말하면 여기서 깨진다)
  const fills = { m1: ['raise'], m2: ['인원 < 1', 'ValueError', 'as'], final: ['while', 'break'] };
  for (const [id, f] of Object.entries(fills)) {
    const m = MISSIONS.find((x) => x.id === id);
    확인(`${id} 빈칸 수`, m.starter.split(BLANK).length - 1, f.length);
    let code = m.starter;
    for (const x of f) code = code.replace(BLANK, x);
    확인(`${id} 빈칸을 힌트 차례대로 채우면 모범 답안`, code, m.answer);
    const last = m.hints[m.hints.length - 1];
    let at = -1;
    참(`${id} 마지막 힌트가 빈칸 낱말을 그 차례로 말한다`, f.every((x) => { const k = last.indexOf(x, at + 1); if (k < 0) return false; at = k; return true; }));
  }
  const [m1, m2, final] = MISSIONS;
  확인('미션은 셋 — 번호 규칙 · 사람 수 규칙 · 끝판왕 (보스전은 2026-11-05 뺐다)', MISSIONS.map((m) => m.id), ['m1', 'm2', 'final']);
  참('미션 1 답으로는 미션 2 를 못 넘는다', !checkMission(m2, m1.answer).pass);
  참('미션 2 답으로는 끝판왕을 못 넘는다 (다시 묻지 않는다)', !checkMission(final, m2.answer).pass);
  참('끝판왕 모범 답안에는 나머지 규칙까지 들어 있다 (보스전에서 옮겨 옴)', /값 % 인원 != 0/.test(final.answer));
  확인('공격 수 — 지난 시간 10 + 규칙 5', [ATTACKS.length, RULES.length], [10, 5]);
}

묶음('채점기 — 아쉬운 규칙');
{
  const [m1, m2] = MISSIONS;
  // raise 를 try 밖에 쓰면 잡히지 않고 멈춘다
  const outside = MACHINE_CODE.replace('\ntry:\n    번호 = int(input("메뉴 번호(0~4): "))\n',
    '\n번호 = int(input("메뉴 번호(0~4): "))\nif 번호 < 0:\n    raise IndexError("0~4번 중에서 골라 주세요.")\ntry:\n');
  참('(시험 준비) try 밖에 raise 를 둔 코드가 만들어졌다', outside !== MACHINE_CODE);
  const c1 = checkMission(m1, outside);
  참('raise 를 try 밖에 쓰면 멈춤으로 판정', !c1.pass && c1.ev.byId.r1.verdict === 'crash');
  참('그때 「try 안에 있는지」 를 짚어 준다', c1.notes.some((n) => /try 안에/.test(n.text)));
  // raise 대신 print 로 막으면 — else 가 돌아 그대로 팔아 버린다
  const printed = MACHINE_CODE.replace('    값 = 가격[번호]', '    if 번호 < 0:\n        print("0~4번 중에서 골라 주세요.")\n    값 = 가격[번호]');
  참('raise 대신 print 만 하면 그대로 팔아 버린다', checkMission(m1, printed).ev.byId.r1.verdict === 'leak');
  // as e 없이 고정 문구 — 막기는 하지만 내 메시지가 안 보인다
  const noAs = m2.answer.replace('except ValueError as e:\n    print("입력을 확인하세요:", e)', 'except ValueError:\n    print("숫자를 정확히 입력하세요.")');
  참('(시험 준비) as e 를 뺀 코드가 만들어졌다', noAs !== m2.answer);
  확인('as e 없이 고정 문구면 「내 메시지 보여 주기」 만 실패', checkMission(m2, noAs).items.filter((x) => !x.ok).map((x) => x.text), ['as e 로 내가 쓴 메시지를 손님에게 보여 주기']);
  // 조건을 거꾸로 쓰면 정상 손님이 실패
  const wrong = m2.answer.replace('if 인원 < 1:', 'if 인원 >= 1:');
  참('조건을 거꾸로 쓰면 정상 손님 실패', checkMission(m2, wrong).items.some((x) => !x.ok && /정상 손님/.test(x.text)));
  // except: 로 다 덮기
  const lazy = m2.answer.replace(/except ValueError as e:[\s\S]*?\nelse:/, 'except:\n    print("문제가 생겼어요.")\nelse:');
  참('(시험 준비) except: 로 바꾼 코드가 만들어졌다', lazy !== m2.answer && /^except:$/m.test(lazy));
  참('except: 만 쓰면 남용 경고', checkMission(m2, lazy).notes.some((n) => /except: 만 쓰면/.test(n.text)));
  const broken = checkMission(m1, 'try:\nprint(1)\n');
  참('문법 오류는 「코드가 실행되기」', !broken.pass && /실행/.test(broken.items[0].text));
  const changed = m1.answer.replace('"나왔습니다!"', '"드릴게요"');
  참('판매 문구를 바꾸면 정상 손님 실패', checkMission(m1, changed).items.some((x) => !x.ok && /정상 손님/.test(x.text)));
  참('막힌 곳 꼬리표는 서버의 40자 제한 안', [m1, m2].every((m) => checkMission(m, MACHINE_CODE).fails.every((t) => `${m.id}:${t}`.length <= 40)));
}

묶음('예제');
{
  const r5 = run(LESSONS.l5.code, ['-3']);
  확인('raise — 음수면 내 메시지로 멈추고 아래 줄은 안 돈다', [r5.errorType, r5.errorMsg, r5.ran.includes(4)], ['ValueError', '나이는 0보다 작을 수 없습니다.', false]);
  확인('raise — 17 이면 그대로', run(LESSONS.l5.code, ['17']).lines, ['내년에는 18 살이에요.', '프로그램을 마칩니다.']);
  확인('raise — 열일곱이면 파이썬이 낸 ValueError', run(LESSONS.l5.code, ['열일곱']).errorType, 'ValueError');
  확인('as e — 내 메시지', run(LESSONS.l6.code, ['-3']).lines, ['다시 입력하세요 — 나이는 0보다 작을 수 없습니다.', '프로그램을 마칩니다.']);
  확인('as e — 파이썬이 만든 메시지', run(LESSONS.l6.code, ['열일곱']).lines, ["다시 입력하세요 — invalid literal for int() with base 10: '열일곱'", '프로그램을 마칩니다.']);
  확인('예제는 raise · as e 둘 (나만의 예외는 2026-11-05 뺐다)', Object.keys(LESSONS), ['l5', 'l6']);
  for (const [id, l] of Object.entries(LESSONS)) {
    참(`예제 ${id} 의 기본값이 칩에 있다`, l.fields.every((f) => f.chips.includes(f.def)));
    참(`예제 ${id} 에 파일 입출력이 없다`, !/\bopen\(|FileNotFoundError/.test(l.code));
  }
}

묶음('확인 문제');
for (const [i, q] of QUIZ.entries()) {
  참(`Q${i + 1} 정답이 보기에 있다`, q.choices.includes(q.answer));
  확인(`Q${i + 1} 보기 4개, 겹치지 않음`, new Set(q.choices).size, 4);
  if (q.type === 'output') 확인(`Q${i + 1} 정답 = 실제 출력`, run(q.code, q.inputs).lines.join('\n'), q.answer);
  if (q.type === 'crash') {
    const r = run(q.code);
    확인(`Q${i + 1} 정말 그 예외로 멈춘다`, [r.ok, r.errorType, r.errorMsg, r.lines], [false, q.expect.type, q.expect.msg, []]);
  }
  if (q.check) {
    // 보기를 하나씩 ㉠ 자리에 넣고 0 을 넣어 돌린다 — 정답만 내 예외(ValueError)로 멈춘다
    q.choices.forEach((ch) => {
      const r = run(q.code.replace(q.check.slot, ch), [q.check.input]);
      const raisedMine = !r.ok && r.errorType === 'ValueError' && r.errorMsg === '1명 이상이어야 해요';
      확인(`Q${i + 1} 「${ch}」 → ${raisedMine ? '내 예외' : r.ok ? '그냥 지나감' : r.errorType}`, raisedMine, ch === q.answer);
    });
  }
}

묶음('대시보드 점수 · 문구');
확인('점수 셈', scoreOf({ cards: ['a', 'b'], missions: ['m1'], quiz: 4 }), 20 + 20 + 20);
확인('막힌 곳 문구', stuckText('m2:공짜 자판기 못 막음'), '미션 2 사람 수 규칙 — 공짜 자판기 못 막음');
확인('미션 이름표가 미션마다 있다', Object.keys(MISSION_LABEL), MISSIONS.map((m) => m.id));

묶음('이 기기 기록');
{
  const store = readFileSync(new URL('../src/game/store.js', import.meta.url), 'utf8');
  참('이 기기 기록 열쇠는 1·2차시 앱과 겹치지 않는다', /exc-raise:/.test(store) && !/exc-basics:/.test(store));
  참('보스전·별·모범 방어막 기록이 남아 있지 않다', !/boss|stars|answerOn/.test(store));
}

묶음('오류 한국어 말풍선');
{
  확인('파이썬 메시지는 한국어로', koreanOf("ValueError: invalid literal for int() with base 10: '칠'"), "정수형으로 바꿀 수 없는 값이에요: '칠'");
  확인('내가 쓴 한국어 메시지는 풀이하지 않는다', [koreanOf('ValueError: 사람 수는 1명 이상이어야 해요.'), koreanOf('IndexError: 0~4번 중에서 골라 주세요.')], ['', '']);
  참('raise 뒤에 글자만 쓰면 무엇이 틀렸는지 알려 준다', /raise 뒤에는/.test(koreanOf('TypeError: exceptions must derive from BaseException')));
  확인('나만의 예외 이름은 풀이하지 않는다', koreanOf('품절에러: 우유는 다 팔렸어요.'), '');
}

묶음('카드 목록 — 3차시 하나');
{
  const src = readFileSync(new URL('../src/cards/index.js', import.meta.url), 'utf-8');
  const list = [...src.matchAll(/\{ id: '(\w+)', chapter: '(c\w+)'/g)].map((m) => ({ id: m[1], chapter: m[2] }));
  const quizAt = list.findIndex((c) => c.id === 'result');
  list.splice(quizAt, 0, ...QUIZ.map((q, k) => ({ id: `q${k + 1}`, chapter: 'c6' })));
  확인('카드 차례', cardsFor(list, 'all').map((c) => c.id), ['start', 'hunt', 'why', 'l5', 'l6', 'whyraise', 'm1', 'm2', 'loop', 'final', ...QUIZ.map((q, k) => `q${k + 1}`), 'result']);
  참('범위는 하나 — 고르는 화면을 숨긴다', ONE_PART && PARTS.length === 1);
  참('결과 카드의 미션 = 카드 목록의 미션', MISSIONS_OF.all.every((m) => list.some((c) => c.id === m)) && MISSIONS_OF.all.length === MISSIONS.length);
  확인('서버와 같은 범위 이름', loadServer().api.PART_IDS, PARTS.map((p) => p.id));
  참('1·2차시 카드가 섞이지 않았다', !list.some((c) => ['l1', 'break', 'dex', 'l2', 'l3', 'l4', 'm3', 'misuse', 'errors', 'logic', 'l7', 'boss'].includes(c.id)));
}

묶음('학번·이름 — 화면과 서버가 같은 규칙');
{
  const { api } = loadServer();
  const ok = (fn) => { try { fn(); return true; } catch (e) { return false; } };
  for (const v of ['20307', '1234', '123456', ' 20307 ', '2030', '1234567', '2030a', '', '-2030']) 확인(`학번 「${v}」`, snoOk(v), ok(() => api.cleanSno_(v)));
  for (const v of ['홍길동', 'Kim Ana', '  홍  길동 ', '김', '<b>', '홍길동1', '', 'ㅎㅎ', 'a'.repeat(21)]) 확인(`이름 「${v}」`, nameOk(v), ok(() => api.cleanName_(v)));
  for (const v of ['홍길동', '김철', '남궁민수', 'A', 'Ana']) 확인(`가리기 「${v}」`, maskName(v), api.maskName_(v));
  확인('다듬기', [cleanSno(' 20 307 '), cleanName('  홍  길동 ')], ['20307', '홍 길동']);
}

묶음('🏁 오늘 배운 것 — 학생이 직접 적는다');
{
  확인('물음', wrapupFor('all').map((w) => w.id), ['when', 'how', 'ase', 'loop', 'unsure']);
  참('물음은 물음표로 끝나거나 「한 가지」·「적어 보세요」', WRAPUP.every((w) => /\?|\)$|한 가지$|보세요\.$/.test(w.q)));
  const card = readFileSync(new URL('../src/cards/start.js', import.meta.url), 'utf-8');
  // 결과 카드 함수 안에만 — 시작 카드의 소개 문장은 괜찮다
  const resultSrc = card.slice(card.indexOf('export function resultCard'), card.indexOf('export async function askReset'));
  참('결과 카드에 정리 문장(정답)을 다시 적지 않는다', resultSrc.length > 100 && !/raise\s|괄호 안 메시지|as e/.test(resultSrc));
  const { api } = loadServer();
  확인('서버와 같은 물음 · 차시', api.NOTES.map((n) => [n[0], n[1]]), WRAPUP.map((w) => [w.id, w.part]));
  확인('서버와 같은 길이 한도', api.NOTE_MAX, 300);
  for (const v of ['  예외는  멈춤 ', 'a\nb\tc\r', '=1+1', 'x'.repeat(400), '', null, undefined, 'a\u0000b\u007f']) {
    확인(`다듬기가 서버와 같다 「${String(v).slice(0, 10)}」`, cleanNote(v), api.cleanNote_(v));
  }
  const W = (id) => WRAPUP.find((w) => w.id === id);
  확인('열쇠', noteKey(W('unsure'), 'all'), 'unsure@all');
  확인('제출할 글 모으기 — 이 앱 물음만, 비운 칸은 빈 글', collectNotes('all', { 'when@all': ' 규칙 ', 'unsure@all': '없음', what: '옛 물음' }),
    { when: '규칙', how: '', ase: '', loop: '', unsure: '없음' });
  참('낸 그대로면 꼬리표가 같고 고치면 달라진다', notesSig('all', { when: 'a ' }) === notesSig('all', { when: 'a', how: '' }) && notesSig('all', { when: 'a' }) !== notesSig('all', { when: 'b' }));
  확인('모두 적으면 짚을 칸이 없다', emptyRequired('all', { when: 'a', how: 'b', ase: 'c', loop: 'e', unsure: 'd' }).map((w) => w.id), []);
  참('결과 카드에 제출 단추가 있다', /submitNotes\(part/.test(card) && /선생님께 제출하기/.test(card));
}

묶음('미션마다 보여 줄 규칙 공격');
{
  const [m1, m2] = MISSIONS;
  for (const m of [m1, m2]) {
    참(`${m.id} 의 규칙 공격은 도감에 있다`, m.holes.every((h) => HOLES.includes(h)));
    참(`${m.id} 모범 답안은 보여 주는 규칙 공격을 모두 막는다`, checkMission(m, m.answer).ev.rules.filter((x) => m.holes.includes(x.atk.hole)).every((x) => x.verdict === 'blocked'));
  }
}

묶음('「if 로도 되는데 왜 raise?」 — 네 판이 카드의 설명대로 돈다');
{
  const W = (id) => WHY.find((w) => w.id === id);
  확인('A if + print — -1 이면 안내하고도 판다', run(W('A').code, ['-1']).lines, ['0~4번 중에서 골라 주세요.', '주스 나왔습니다!']);
  확인('B if / else — -1 이면 안내만', run(W('B').code, ['-1', '2']).lines, ['0~4번 중에서 골라 주세요.']);
  확인('B if / else — 사람 수 -2 도 막는다', run(W('B').code, ['2', '-2']).lines, ['사람 수는 1명 이상이어야 해요.']);
  확인('B if / else — 칠은 여전히 멈춘다 (try 가 없다)', run(W('B').code, ['칠', '2']).errorType, 'ValueError');
  참('B 는 if 가 두 겹 (규칙마다 한 겹씩 깊어진다)', /\n {4}if 인원 < 1:\n {8}print/.test(W('B').code));
  확인('C raise — -1', run(W('C').code, ['-1', '2']).lines, ['0~4번 중에서 골라 주세요.']);
  확인('C raise — 사람 수 -2', run(W('C').code, ['2', '-2']).lines, ['입력을 확인하세요: 사람 수는 1명 이상이어야 해요.']);
  확인('C raise — 칠도 같은 except 로', run(W('C').code, ['칠', '2']).lines, ["입력을 확인하세요: invalid literal for int() with base 10: '칠'"]);
  확인('C raise — 정상', run(W('C').code, ['2', '2']).lines, ['우유 나왔습니다!', '한 명당 400 원']);
  확인('D 함수 — 함수가 raise, 부른 쪽이 처리', run(W('D').code, ['-2']).lines, ['다시 입력하세요: 사람 수는 1명 이상이어야 해요.']);
  확인('D 함수 — 정상', run(W('D').code, ['3']).lines, ['한 명당 400 원']);
  확인('D 함수 — 둘', run(W('D').code, ['둘']).lines, ["다시 입력하세요: invalid literal for int() with base 10: '둘'"]);
  for (const w of WHY) 참(`${w.id} 의 기본값이 칩에 있다`, w.fields.every((f) => f.chips.includes(f.def)));
  참('판마다 설명이 있다', WHY.every((w) => w.note.length > 20));
}

묶음('🔁 맞을 때까지 다시 묻기 — 예제');
{
  const seq = (s) => s.split(',').map((t) => t.trim());
  확인('열일곱 → -3 → 17', run(LOOP.code, seq('열일곱, -3, 17')).lines,
    ["다시 입력하세요 — invalid literal for int() with base 10: '열일곱'", '다시 입력하세요 — 나이는 0보다 작을 수 없습니다.', '내년에는 18 살이에요.']);
  확인('한 번에 맞히면 안내 없이', run(LOOP.code, ['17']).lines, ['내년에는 18 살이에요.']);
  const eof = run(LOOP.code, seq('-1, -2, 0'));
  참('-1, -2, 0 — 0 은 올바른 값이라 1살', eof.ok && eof.lines.at(-1) === '내년에는 1 살이에요.');
  확인('틀린 값만 넣으면 넣을 값이 떨어져 EOFError (화면이 「올바른 값을 더 적어 보라」 고 알려 준다)', run(LOOP.code, ['-1']).errorType, 'EOFError');
  참('예제는 while True · else · break', /while True:/.test(LOOP.code) && /else:\n {8}break/.test(LOOP.code));
}

묶음('🏆 끝판왕 — 끈질긴 손님');
{
  const final = MISSIONS.find((m) => m.loop);
  확인('끈질긴 손님 3명', PERSIST.length, 3);
  for (const p of PERSIST) {
    const bad = Object.values(p.values).reduce((n, v) => n + v.length - 1, 0);
    확인(`${p.label} — 틀린 값의 수`, p.bad, bad);
    // 틀린 값은 하나하나가 정말 틀린 값이어야 한다 (출발 자판기에 그 값만 넣으면 팔지 않거나 규칙 고장)
    for (const [k, list] of Object.entries(p.values)) for (const x of list.slice(0, -1)) {
      const v = { ...lastValues(p.values), [k]: x };
      const r = runMachine(MACHINE_CODE, v);
      참(`${p.label} — 「${x}」 는 틀린 값`, r.status !== 'vend' || logicSlip(v, r) !== null);
    }
    확인(`${p.label} — 마지막 값으로는 판다`, runMachine(MACHINE_CODE, lastValues(p.values)).status, 'vend');
    참(`${p.label} — 기대하는 판매 문구 두 줄`, persistWant(p).length === 2 && /나왔습니다/.test(persistWant(p)[0]));
  }
  const c = checkMission(final, final.answer);
  확인('모범 답안 — 끈질긴 손님마다 안내 수', c.ev.persists.map((x) => x.guides), PERSIST.map((p) => p.bad));
  확인('모범 답안 — 감사 인사는 끝에 한 번', c.ev.persists.map((x) => x.r.out.at(-1)), PERSIST.map(() => '이용해 주셔서 감사합니다.'));
  참('모범 답안에 while 하나 · break 하나', shape(final.answer).loops === 1 && shape(final.answer).breaks === 1);
  참('모범 답안에는 finally 가 없다 (반복 안에 두면 매번 인사)', !shape(final.answer).hasFinally);

  const items = (code) => checkMission(final, code).items.filter((x) => !x.ok).map((x) => x.text);
  const once = MISSIONS.find((m) => m.id === 'm2').answer;
  참('미션 2 답(다시 묻지 않음)으로는 못 넘는다 — 「결국 팔기」 실패', items(once).some((t) => /결국 팔기/.test(t)) && items(once).includes('while 로 반복하기'));
  const noBreak = final.answer.replace('\n        break\n', '\n        pass\n');
  const cb = checkMission(final, noBreak);
  참('break 를 빼면 끝나지 않는다고 알려 준다', !cb.pass && cb.fails.includes('끝나지 않음(break)') && cb.notes.some((n) => /break/.test(n.text)));
  // finally 를 반복 안에 두면 다시 물을 때마다 인사한다
  const fin = final.answer.replace('        break\nprint("이용해 주셔서 감사합니다.")', '        break\n    finally:\n        print("이용해 주셔서 감사합니다.")');
  참('(시험 준비) finally 를 반복 안에 둔 코드', fin !== final.answer);
  확인('finally 를 반복 안에 두면 「감사 인사는 한 번만」 만 실패', items(fin), ['감사 인사는 마지막에 한 번만']);
  // 규칙(raise)을 빼면 -1 · 2000 같은 값에 그대로 팔아 버려 끈질긴 손님을 끝까지 받지 못한다
  const noRule = final.answer.replace('        if 번호 < 0:\n            raise IndexError("0~4번 중에서 골라 주세요.")\n', '');
  참('(시험 준비) 번호 규칙을 뺀 코드', noRule !== final.answer);
  참('번호 규칙을 빼면 「번호를 자꾸 틀리는 손님」 을 못 받는다 (-1 에 주스를 판다)', items(noRule).some((t) => /번호를 자꾸 틀리는 손님/.test(t)));
  참('끝판왕 꼬리표도 40자 안', [once, noBreak, fin, noRule].every((code) => checkMission(final, code).fails.every((t) => `final:${t}`.length <= 40)));
}

묶음('🏆 끝판왕 — break 를 빼면 finally 탓으로 잘못 짚지 않는다');
{
  const final = MISSIONS.find((m) => m.loop);
  const c = checkMission(final, final.answer.replace('\n        break\n', '\n        pass\n'));
  참('감사 인사 · 정상 손님 항목은 break 를 확인하라고 한다', c.items.filter((x) => !x.ok && /감사|정상/.test(x.text)).every((x) => /break/.test(x.why) && !/finally/.test(x.why)));
}
