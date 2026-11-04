/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  자판기 코드 · 입력 칸 · 「멈추지 않는 고장」 도감 카드.
 *  1·2차시(exception-basics) 에서 만든 방어막 자판기(try–except–else–finally)를 그대로 가져와 시작한다.
 *  이 자판기는 예외 5종을 모두 막지만, 파이썬이 「오류」 라고 여기지 않는 값 — 음수 번호·음수 사람 수 ·
 *  너무 많은 사람 · 나누어떨어지지 않는 사람 수 — 앞에서는 멈추지 않고 틀리게 판다.
 *  이 넷을 raise 로 「내가 정한 규칙」 을 세워 예외로 바꾸는 것이 3차시다.
 *  ⚠ 이 파일은 node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

// ── 지난 시간에 만든 방어막 자판기 (2차시 미션 3 의 모범 답안) ─────────────
export const MACHINE_CODE = `메뉴 = ["콜라", "사이다", "우유", "커피", "주스"]
가격 = [1200, 1000, 800, 1500, 1300]
쿠폰 = {"HAPPY": 200, "LUCKY": 500, "FREE": "공짜"}

try:
    번호 = int(input("메뉴 번호(0~4): "))
    값 = 가격[번호]
    코드 = input("쿠폰 코드: ")
    if 코드 != "":
        값 = 값 - 쿠폰[코드]
    인원 = int(input("나눠 낼 사람 수: "))
    한명몫 = 값 // 인원
except ValueError:
    print("숫자를 정확히 입력하세요.")
except IndexError:
    print("0~4번 중에서 골라 주세요.")
except KeyError:
    print("없는 쿠폰이에요.")
except TypeError:
    print("이 쿠폰은 지금 쓸 수 없어요.")
except ZeroDivisionError:
    print("0명은 나눠 낼 수 없어요.")
else:
    print(메뉴[번호], "나왔습니다!")
    print("한 명당", 한명몫, "원")
finally:
    print("이용해 주셔서 감사합니다.")
`;

export const PRODUCTS = [
  { name: '콜라', price: 1200, icon: '🥤' },
  { name: '사이다', price: 1000, icon: '🫧' },
  { name: '우유', price: 800, icon: '🥛' },
  { name: '커피', price: 1500, icon: '☕' },
  { name: '주스', price: 1300, icon: '🧃' },
];
export const COUPONS = { HAPPY: 200, LUCKY: 500, FREE: '공짜' };

// ── 입력 칸 ─────────────────────────────────────────────────────────
// input( ) 의 질문 문구에 match 가 들어 있으면 그 칸의 값을 넣어 준다.
// (학생이 input 의 차례를 바꿔 써도 채점이 흔들리지 않게)
export const FIELDS = [
  { key: 'num', label: '메뉴 번호', icon: '🔢', match: /번호/, def: '0', ph: '0~4' },
  { key: 'coupon', label: '쿠폰 코드', icon: '🎟️', match: /쿠폰/, def: '', ph: '없으면 비움' },
  { key: 'people', label: '나눠 낼 사람 수', icon: '👥', match: /사람|인원/, def: '1', ph: '예) 1' },
];

/** 질문 문구 → 넣을 값. 맞는 칸이 없으면 차례대로 준다.
 *  🏆 끝판왕의 「끈질긴 손님」 은 칸마다 값을 여러 개(배열) 가진다 — 그 칸을 다시 물을 때마다 다음 값을 주고,
 *  다 쓰면 마지막 값을 계속 준다(올바른 값은 언제나 마지막에 둔다). onTake(값) 은 실제로 넣은 값을 차례로 알려 준다. */
export function makeInputFn(values, onTake) {
  const used = {};
  return (prompt, i) => {
    const f = FIELDS.find((x) => x.match.test(prompt)) || FIELDS[i];
    if (!f) return null;
    let v = values[f.key];
    if (Array.isArray(v)) {
      const k = used[f.key] || 0;
      used[f.key] = k + 1;
      v = v[Math.min(k, v.length - 1)];
    }
    const s = v === undefined || v === null ? '' : String(v);
    if (onTake) onTake(s);
    return s;
  };
}
/** 칸의 값을 화면에 보일 글로 — 배열이면 「칠 → -1 → 2」 */
export const showValue = (v) => (Array.isArray(v) ? v.map((x) => (x === '' ? '(빈칸)' : x)).join(' → ') : v);

// ── 🔍 멈추지 않는 고장 도감 — 파이썬은 오류라고 여기지 않는데 자판기로서는 틀린 것 ──
//   id 는 runner.js 의 logicSlip( ) 이 돌려주는 kind 와 같다.
//   hints — 학생이 누를 때만 하나씩 (방향 → 자리 → 거의 답). 마지막 단계에만 넣을 값을 쓴다.
//   rule  — raise 로 세우는 규칙 (찾은 카드를 누르면 보인다)
export const CARDS = [
  {
    id: 'negIndex', icon: '🔄', color: '#0ea5e9', name: '뒤에서 파는 자판기', nick: '0~4번만 있는데 -1번이 팔려요',
    what: '메뉴 번호에 음수를 넣으면 파이썬은 「뒤에서 몇째」 로 읽어요. 0~4번만 있다고 했는데 -1번에 주스가 나와요. 파이썬에게는 오류가 아니라서 except 가 잡을 수 없어요.',
    hints: [
      '안내에는 「메뉴 번호(0~4)」 라고 적혀 있어요. 코드가 정말 0~4 만 받는지 검사하나요?',
      '파이썬 리스트에서 음수 번호는 오류가 아니에요. 가격[-1] 은 어느 자리일까요?',
      '메뉴 번호 칸에 -1 을 넣어 보세요.',
    ],
    try: { num: '-1' },
    rule: 'if 번호 < 0:\n    raise IndexError("0~4번 중에서 골라 주세요.")',
  },
  {
    id: 'negPeople', icon: '➖', color: '#8b5cf6', name: '거꾸로 돈을 주는 자판기', nick: '한 명당 -600원',
    what: '사람 수에 음수를 넣어도 int( ) 는 정수로 받아들여요. 한 명당 -600원 — 돈을 내는 게 아니라 받아 가요.',
    hints: [
      'int( ) 는 「-2」 도 정수로 바꿔 줘요. 사람 수에 쓸 수 없는 정수가 있을까요?',
      '사람 수 칸에 0보다 작은 수를 넣으면 한 명당 값은 어떻게 될까요?',
      '나눠 낼 사람 수 칸에 -2 를 넣어 보세요.',
    ],
    try: { people: '-2' },
    rule: 'if 인원 < 1:\n    raise ValueError("사람 수는 1명 이상이어야 해요.")',
  },
  {
    id: 'zeroShare', icon: '🆓', color: '#22c55e', name: '공짜 자판기', nick: '한 명당 0원',
    what: '// 는 몫만 남겨요. 사람 수가 값보다 많으면 몫이 0 이라 한 명당 0원 — 음료가 공짜가 돼요.',
    hints: [
      '// 는 나눗셈의 몫만 남겨요. 나누는 수가 아주 크면 몫은 얼마가 될까요?',
      '사람 수를 음료 값보다 크게 하면 한 명당 값은?',
      '나눠 낼 사람 수 칸에 2000 을 넣어 보세요.',
    ],
    try: { people: '2000' },
    rule: 'if 인원 > 값:\n    raise ValueError("사람이 너무 많아요.")',
  },
  {
    id: 'remainder', icon: '🪙', color: '#f59e0b', name: '돈이 모자란 자판기', nick: '3원이 사라졌어요',
    what: '// 는 나머지를 버려요. 1200원을 7명이 171원씩 내면 1197원 — 3원이 모자라요. 아무도 알려 주지 않아요.',
    hints: [
      '「한 명당 값 × 사람 수」 가 원래 값과 같은지 직접 계산해 보세요.',
      '1200 은 2·3·4 로 나누어떨어져요. 나누어떨어지지 않는 사람 수라면?',
      '나눠 낼 사람 수 칸에 7 을 넣어 보세요.',
    ],
    try: { people: '7' },
    rule: 'if 값 % 인원 != 0:\n    raise ValueError("똑같이 나눠지지 않아요.")',
  },
];
export const cardOf = (id) => CARDS.find((c) => c.id === id);

/** 아직 못 찾은 것 가운데 첫째의 힌트. seen[id] = 연 단계 수. 다 찾았으면 null */
export function holeHint(found, seen = {}) {
  const t = CARDS.find((x) => !found[x.id]);
  if (!t) return null;
  const level = Math.min(seen[t.id] || 0, t.hints.length);
  const n = CARDS.length - CARDS.filter((x) => !found[x.id]).length;
  return { target: t.id, found: n, level, total: t.hints.length, text: level ? t.hints[level - 1] : '', more: level < t.hints.length };
}
export function holeOpenNext(found, seen = {}) {
  const t = CARDS.find((x) => !found[x.id]);
  if (!t) return seen;
  return { ...seen, [t.id]: Math.min((seen[t.id] || 0) + 1, t.hints.length) };
}
