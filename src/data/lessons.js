/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  예제(값을 바꿔 실행해 보기)와 확인 문제.
 *  ⚠ 예제·확인 문제의 출력은 `npm test` 가 진짜 파이썬(golden)과 해석기로 대조한다.
 *  ⚠ node 로 그대로 불러다 시험한다. DOM 을 만들지 말 것.
 */

// 예제 — fields 는 input( ) 에 차례로 넣을 값
export const LESSONS = {
  // raise — 규칙을 어기면 예외를 직접 일으킨다 (잡지 않으면 멈춘다)
  l5: {
    code: `나이 = int(input("나이를 입력하세요: "))
if 나이 < 0:
    raise ValueError("나이는 0보다 작을 수 없습니다.")
print("내년에는", 나이 + 1, "살이에요.")
print("프로그램을 마칩니다.")`,
    fields: [{ label: '나이', def: '-3', chips: ['17', '-3', '열일곱'] }],
  },
  // 내가 일으킨 예외도 except 가 잡는다 + as e 로 메시지를 꺼낸다
  l6: {
    code: `try:
    나이 = int(input("나이를 입력하세요: "))
    if 나이 < 0:
        raise ValueError("나이는 0보다 작을 수 없습니다.")
    print("내년에는", 나이 + 1, "살이에요.")
except ValueError as e:
    print("다시 입력하세요 —", e)
print("프로그램을 마칩니다.")`,
    fields: [{ label: '나이', def: '-3', chips: ['17', '-3', '열일곱'] }],
  },
};

// 「if 로도 되는데 왜 raise?」 — 같은 값을 넣어 네 판을 견준다 (2026-11-05 사용자 질문에서 나온 카드)
//   A if + print 는 말만 하고 그대로 판다 · B if/else 로 막으면 규칙마다 한 겹씩 깊어진다 ·
//   C raise 는 그 자리에서 except 로 건너뛴다 · D 문제를 찾는 곳(함수)과 처리하는 곳이 다를 때
const MENU = `메뉴 = ["콜라", "사이다", "우유", "커피", "주스"]
가격 = [1200, 1000, 800, 1500, 1300]
`;
export const WHY = [
  {
    id: 'A', label: 'A · if + print',
    code: `${MENU}번호 = int(input("메뉴 번호(0~4): "))
if 번호 < 0:
    print("0~4번 중에서 골라 주세요.")
print(메뉴[번호], "나왔습니다!")`,
    fields: [{ label: '메뉴 번호', def: '-1', chips: ['-1', '2'] }],
    note: 'print 는 말만 할 뿐 흐름을 멈추지 않아요. 안내를 하고도 아래 줄로 내려가 그대로 팔아 버려요.',
  },
  {
    id: 'B', label: 'B · if / else',
    code: `${MENU}번호 = int(input("메뉴 번호(0~4): "))
if 번호 < 0:
    print("0~4번 중에서 골라 주세요.")
else:
    인원 = int(input("나눠 낼 사람 수: "))
    if 인원 < 1:
        print("사람 수는 1명 이상이어야 해요.")
    else:
        print(메뉴[번호], "나왔습니다!")
        print("한 명당", 가격[번호] // 인원, "원")`,
    fields: [{ label: '메뉴 번호', def: '-1', chips: ['-1', '2', '칠'] }, { label: '사람 수', def: '2', chips: ['2', '-2'] }],
    note: 'else 로 감싸면 막을 수는 있어요. 그런데 규칙이 하나 늘 때마다 한 겹씩 깊어지고, 「칠」 같은 예외는 여전히 따로 try 가 필요해요.',
  },
  {
    id: 'C', label: 'C · raise',
    code: `${MENU}try:
    번호 = int(input("메뉴 번호(0~4): "))
    if 번호 < 0:
        raise IndexError("0~4번 중에서 골라 주세요.")
    인원 = int(input("나눠 낼 사람 수: "))
    if 인원 < 1:
        raise ValueError("사람 수는 1명 이상이어야 해요.")
    print(메뉴[번호], "나왔습니다!")
    print("한 명당", 가격[번호] // 인원, "원")
except IndexError as e:
    print(e)
except ValueError as e:
    print("입력을 확인하세요:", e)`,
    fields: [{ label: '메뉴 번호', def: '-1', chips: ['-1', '2', '칠'] }, { label: '사람 수', def: '2', chips: ['2', '-2'] }],
    note: 'raise 는 그 자리에서 아래 줄을 모두 건너뛰고 except 로 가요. 규칙이 늘어도 한 겹 그대로이고, 파이썬이 낸 예외(칠)와 내가 정한 규칙이 같은 except 에서 처리돼요.',
  },
  {
    id: 'D', label: 'D · 함수 안에서',
    code: `def 한명몫(값, 인원):
    if 인원 < 1:
        raise ValueError("사람 수는 1명 이상이어야 해요.")
    return 값 // 인원

try:
    인원 = int(input("나눠 낼 사람 수: "))
    print("한 명당", 한명몫(1200, 인원), "원")
except ValueError as e:
    print("다시 입력하세요:", e)`,
    fields: [{ label: '사람 수', def: '-2', chips: ['3', '-2', '둘'] }],
    note: '함수는 「사람 수가 틀렸다」 는 것만 알아요. 그다음에 무엇을 할지는 부른 쪽이 정하죠. 그래서 함수는 raise 로 알리기만 하고, 처리는 부른 쪽의 except 가 해요. int("둘") 이 ValueError 를 내는 것도 똑같은 구조예요.',
  },
];

// 🏆 끝판왕 — 올바른 값이 들어올 때까지 다시 묻기. seq: 입력 칸에 쉼표로 여러 값을 적으면 다시 물을 때마다 차례로 넣는다
export const LOOP = {
  code: `while True:
    try:
        나이 = int(input("나이를 입력하세요: "))
        if 나이 < 0:
            raise ValueError("나이는 0보다 작을 수 없습니다.")
    except ValueError as e:
        print("다시 입력하세요 —", e)
    else:
        break
print("내년에는", 나이 + 1, "살이에요.")`,
  fields: [{ label: '넣을 값들', def: '열일곱, -3, 17', chips: ['17', '열일곱, -3, 17', '-1, -2, 0'], seq: true }],
};

// 확인 문제 — choices 의 \n 은 줄바꿈. type 'output' 은 코드를 돌린 출력이 answer 와 같아야 한다.
//   type 'crash' 는 코드가 그 예외로 멈춰야 정답이다(시험이 type·msg 를 대조한다).
const Q1_CODE = `try:
    n = int(input("수: "))
    if n < 0:
        raise ValueError("음수는 안 돼요")
    print("통과")
except ValueError as e:
    print("오류:", e)
print("끝")`;

export const QUIZ = [
  {
    q: '「-3」 을 입력했을 때 실행 결과는?', type: 'output', inputs: ['-3'],
    code: Q1_CODE,
    choices: ['통과\n끝', '오류: 음수는 안 돼요\n끝', '오류: 음수는 안 돼요\n통과\n끝', 'ValueError 로 멈춘다'],
    answer: '오류: 음수는 안 돼요\n끝',
    why: 'raise 가 실행되면 그 아래 줄(통과)은 건너뛰고 except 로 갑니다. e 에는 괄호 안에 쓴 메시지가 들어 있어요.',
  },
  {
    q: '같은 코드에 「abc」 를 입력했을 때 실행 결과는?', type: 'output', inputs: ['abc'],
    code: Q1_CODE,
    choices: ['오류: 음수는 안 돼요\n끝', "오류: invalid literal for int() with base 10: 'abc'\n끝", '통과\n끝', 'ValueError 로 멈춘다'],
    answer: "오류: invalid literal for int() with base 10: 'abc'\n끝",
    why: 'int("abc") 에서 파이썬이 스스로 ValueError 를 일으켰어요. 그때 e 에는 파이썬이 만든(영어) 메시지가 들어 있어요.',
  },
  {
    q: '사람 수가 1보다 작으면 예외를 일으키려고 해요. ㉠ 에 알맞은 것은?', type: 'pick',
    code: `인원 = int(input("사람 수: "))
if 인원 < 1:
    ㉠
print("한 명당", 1200 // 인원, "원")`,
    choices: ['raise ValueError("1명 이상이어야 해요")', 'ValueError("1명 이상이어야 해요")', 'return ValueError("1명 이상이어야 해요")', 'raise "1명 이상이어야 해요"'],
    answer: 'raise ValueError("1명 이상이어야 해요")',
    why: '예외를 일으키는 낱말은 raise 예요. ValueError(…) 만 쓰면 예외를 만들기만 하고 던지지 않아 아무 일도 없어요. raise 뒤에는 글자가 아니라 예외가 와야 해요.',
    // 시험용 — 고른 줄을 ㉠ 에 넣고 0 을 입력했을 때: 정답만 ValueError 로 멈추고 나머지는 다르게 된다
    check: { slot: '㉠', input: '0' },
  },
  {
    q: '이 코드를 실행하면?', type: 'crash',
    code: `점수 = 120
if 점수 > 100:
    raise ValueError("점수는 100점까지예요")
print("저장했어요")`,
    choices: ['저장했어요', 'ValueError: 점수는 100점까지예요 — 를 보이고 멈춘다', '점수는 100점까지예요\n저장했어요', '아무것도 나오지 않는다'],
    answer: 'ValueError: 점수는 100점까지예요 — 를 보이고 멈춘다',
    expect: { type: 'ValueError', msg: '점수는 100점까지예요' },
    why: '내가 일으킨 예외도 잡지 않으면 프로그램이 멈춰요. 그래서 raise 는 보통 try 안에서 쓰고 except 로 받아 줘요.',
  },
];
