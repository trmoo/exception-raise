/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  「규칙 세우기」 미션 — 지난 시간의 방어막 자판기에 raise 로 규칙을 더한다.
 *    미션 1  번호 규칙       — 음수 번호를 raise IndexError 로 (이미 있는 except IndexError 가 잡는다)
 *    미션 2  사람 수 규칙    — 음수·너무 많은 사람을 raise ValueError 로 + except ValueError as e 로 내 말 보여 주기
 *    🏆 끝판왕  방어막 전체를 while True: 로 감싸 올바른 값이 들어올 때까지 다시 묻는다
 *    (보스전은 2026-11-05 사용자 지시로 뺐다)
 *  holes — 그 미션의 결과 칸에 보여 줄 규칙 공격(아직 배우지 않은 규칙의 공격은 숨긴다)
 *  ⚠ 모범 답안이 정말로 채점을 통과하는지 `npm test` 가 지킨다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

const HEAD = `메뉴 = ["콜라", "사이다", "우유", "커피", "주스"]
가격 = [1200, 1000, 800, 1500, 1300]
쿠폰 = {"HAPPY": 200, "LUCKY": 500, "FREE": "공짜"}
`;

// try 안 — rules 는 { num, people } 에 끼워 넣을 규칙 줄(들여쓰기 없이)
const IN = (s) => s.split('\n').map((l) => (l ? '    ' + l : l)).join('\n');
function body({ num = '', people = '' } = {}) {
  return IN([
    '번호 = int(input("메뉴 번호(0~4): "))',
    num,
    '값 = 가격[번호]',
    '코드 = input("쿠폰 코드: ")',
    'if 코드 != "":',
    '    값 = 값 - 쿠폰[코드]',
    '인원 = int(input("나눠 낼 사람 수: "))',
    people,
    '한명몫 = 값 // 인원',
  ].filter(Boolean).join('\n'));
}
function handlers(valueAs = false) {
  return [
    valueAs ? 'except ValueError as e:\n    print("입력을 확인하세요:", e)' : 'except ValueError:\n    print("숫자를 정확히 입력하세요.")',
    'except IndexError:\n    print("0~4번 중에서 골라 주세요.")',
    'except KeyError:\n    print("없는 쿠폰이에요.")',
    'except TypeError:\n    print("이 쿠폰은 지금 쓸 수 없어요.")',
    'except ZeroDivisionError:\n    print("0명은 나눠 낼 수 없어요.")',
  ].join('\n');
}
const TAIL = `else:
    print(메뉴[번호], "나왔습니다!")
    print("한 명당", 한명몫, "원")
finally:
    print("이용해 주셔서 감사합니다.")
`;
const machine = (rules, valueAs) => `${HEAD}
try:
${body(rules)}
${handlers(valueAs)}
${TAIL}`;

const R_NUM = 'if 번호 < 0:\n    raise IndexError("0~4번 중에서 골라 주세요.")';
const R_PEOPLE = 'if 인원 < 1:\n    raise ValueError("사람 수는 1명 이상이어야 해요.")\nif 인원 > 값:\n    raise ValueError("사람이 너무 많아요. 한 명당 0원이 돼요.")';
const R_REMAIN = 'if 값 % 인원 != 0:\n    raise ValueError("똑같이 나눠지지 않아요. 사람 수를 바꿔 주세요.")';

const M1_ANSWER = machine({ num: R_NUM });
const M1_STARTER = M1_ANSWER.replace('raise IndexError(', '____ IndexError(');

const M2_ANSWER = machine({ num: R_NUM, people: R_PEOPLE }, true);
const M2_STARTER = M2_ANSWER
  .replace('if 인원 < 1:', 'if ____:')
  .replace('raise ValueError("사람이 너무 많아요', 'raise ____("사람이 너무 많아요')
  .replace('except ValueError as e:', 'except ValueError ____ e:');

// 🏆 끝판왕 — 방어막 전체(번호·사람 수 규칙 + 나머지 규칙)를 while True: 로 감싸 「올바른 값이 들어올 때까지 다시 묻는」 자판기.
//   팔고 나면(else) break 로 빠져나오고, 감사 인사는 반복 밖에서 한 번만 한다(finally 를 반복 안에 두면 다시 물을 때마다 인사한다).
const FINAL_ANSWER = `${HEAD}
while True:
${IN(`try:
${body({ num: R_NUM, people: `${R_PEOPLE}\n${R_REMAIN}` })}
${handlers(true)}
else:
    print(메뉴[번호], "나왔습니다!")
    print("한 명당", 한명몫, "원")
    break`)}
print("이용해 주셔서 감사합니다.")
`;
const FINAL_STARTER = FINAL_ANSWER.replace('\nwhile True:\n', '\n____ True:\n').replace('\n        break\n', '\n        ____\n');

export const MISSIONS = [
  {
    id: 'm1', no: 1, title: '번호 규칙', concept: 'raise', holes: ['negIndex'],
    goal: '메뉴 번호에 음수(-1)를 넣으면 음료를 팔지 말고 「0~4번 중에서 골라 주세요.」 라고 말하게 하세요. 규칙을 어기면 raise 로 IndexError 를 일으키면, 아래의 except IndexError 가 잡아 줘요.',
    syntax: 'if 규칙을 어기면:\n    raise 예외이름("메시지")',
    starter: M1_STARTER, answer: M1_ANSWER,
    hints: ['빈칸은 하나예요. 「예외를 일으켜라!」 라는 뜻의 낱말 — 공을 「들어 올려 던진다」 는 영어예요.', '빈칸에 raise 를 쓰세요.'],
  },
  {
    id: 'm2', no: 2, title: '사람 수 규칙', concept: 'raise · as e', holes: ['negIndex', 'negPeople', 'zeroShare'],
    goal: '사람 수가 1명보다 적거나(-2) 음료 값보다 많으면(2000) 팔지 마세요. raise 로 ValueError 를 일으키고, except ValueError as e 로 내가 쓴 메시지를 손님에게 보여 주세요.',
    syntax: 'except ValueError as e:\n    print("입력을 확인하세요:", e)',
    starter: M2_STARTER, answer: M2_ANSWER,
    hints: ['빈칸은 세 개 — 사람 수 규칙의 조건 · 일으킬 예외 이름 · 예외에 이름을 붙이는 낱말이에요.', '사람 수는 1명 「이상」 이어야 하니, 규칙을 어기는 조건은 「1보다 작다」 예요.', '첫째 빈칸 인원 < 1, 둘째 빈칸 ValueError, 셋째 빈칸 as'],
  },
  {
    id: 'final', no: 3, title: '끝판왕', concept: 'while · break', loop: true,
    goal: '지금 자판기는 한 번 틀리면 안내만 하고 끝나요. 끈질긴 손님이 몇 번을 틀려도 그때마다 안내하고 다시 묻다가, 올바른 값이 들어오면 팔고 끝나게 하세요.',
    syntax: 'while True:\n    try:\n        …\n    except …:\n        print("다시…")\n    else:\n        팔기\n        break',
    starter: FINAL_STARTER, answer: FINAL_ANSWER,
    hints: ['빈칸은 두 개 — 「~하는 동안 계속」 반복하는 낱말과, 반복을 「깨고」 빠져나오는 낱말이에요.', '예외가 나면 except 가 안내하고 반복의 처음으로 돌아가요. 예외가 없을 때(else)만 팔고 빠져나와야 해요.', '첫째 빈칸 while, 둘째 빈칸 break'],
  },
];
export const missionOf = (id) => MISSIONS.find((m) => m.id === id);

/* ── 공격과 정상 손님 ──────────────────────────────────────────────── */
const V = (o) => ({ num: '0', coupon: '', people: '1', ...o });
// 지난 시간의 공격 10가지 — 방어막 자판기가 이미 막는다. raise 를 더한 뒤에도 계속 막아야 한다.
export const ATTACKS = [
  { id: 'a1', values: V({ num: '칠' }), expect: 'ValueError', label: '번호에 「칠」' },
  { id: 'a2', values: V({ num: '2.5' }), expect: 'ValueError', label: '번호에 「2.5」' },
  { id: 'a3', values: V({ people: '둘' }), expect: 'ValueError', label: '사람 수에 「둘」' },
  { id: 'a4', values: V({ num: '7' }), expect: 'IndexError', label: '번호 7' },
  { id: 'a5', values: V({ num: '100' }), expect: 'IndexError', label: '번호 100' },
  { id: 'a6', values: V({ coupon: 'happy' }), expect: 'KeyError', label: '쿠폰 「happy」' },
  { id: 'a7', values: V({ coupon: 'BONUS' }), expect: 'KeyError', label: '쿠폰 「BONUS」' },
  { id: 'a8', values: V({ coupon: 'FREE' }), expect: 'TypeError', label: '쿠폰 「FREE」' },
  { id: 'a9', values: V({ people: '0' }), expect: 'ZeroDivisionError', label: '사람 수 0' },
  { id: 'a10', values: V({ num: '' }), expect: 'ValueError', label: '번호 칸을 비움' },
];
// 규칙 공격 — 파이썬은 멈추지 않는다. raise 로 규칙을 세워야 막힌다. hole 은 도감 카드 id
export const RULES = [
  { id: 'r1', values: V({ num: '-1' }), hole: 'negIndex', label: '번호 -1' },
  { id: 'r2', values: V({ num: '-5' }), hole: 'negIndex', label: '번호 -5' },
  { id: 'r3', values: V({ people: '-2' }), hole: 'negPeople', label: '사람 수 -2' },
  { id: 'r4', values: V({ people: '2000' }), hole: 'zeroShare', label: '사람 수 2000' },
  { id: 'r5', values: V({ people: '7' }), hole: 'remainder', label: '사람 수 7' },
];
// 🏆 끝판왕의 끈질긴 손님 — 칸마다 값을 여러 번 넣는다(다시 물을 때마다 다음 값, 올바른 값은 언제나 마지막).
//   bad = 틀린 값의 수 = 안내를 받아야 하는 횟수
export const PERSIST = [
  { id: 'p1', values: { num: ['칠', '-1', '7', '2'], coupon: [''], people: ['1'] }, bad: 3, label: '번호를 자꾸 틀리는 손님' },
  { id: 'p2', values: { num: ['3'], coupon: ['happy', 'FREE', 'LUCKY'], people: ['2'] }, bad: 2, label: '쿠폰을 자꾸 틀리는 손님' },
  { id: 'p3', values: { num: ['0'], coupon: [''], people: ['둘', '0', '-2', '2000', '7', '3'] }, bad: 5, label: '사람 수를 자꾸 틀리는 손님' },
];
export const lastValues = (v) => Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Array.isArray(x) ? x[x.length - 1] : x]));
export const NORMALS = [
  { id: 'n1', values: V({}), label: '콜라 사기' },
  { id: 'n2', values: V({ num: '2', coupon: 'HAPPY' }), label: '우유 + HAPPY 쿠폰' },
  { id: 'n3', values: V({ num: '3', coupon: 'LUCKY', people: '2' }), label: '커피를 둘이 나눠 내기' },
];
