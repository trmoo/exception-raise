/*! 부숴봐! 자판기 3차시 — raise — © 2026 티쳐무 · 모든 권리 보유
 *  진짜 파이썬과 견줄 코드 조각들. `python tools/golden.py` 가 진짜 파이썬으로 돌려 test/golden.json 을 만든다.
 *  ⚠ 조각·자판기·미션·교재 예제를 고치면 golden.py 를 다시 돌릴 것.
 */
import { MACHINE_CODE, FIELDS, makeInputFn } from '../src/data/machine.js';
import { MISSIONS, ATTACKS, RULES, NORMALS, PERSIST } from '../src/data/missions.js';
import { LESSONS, QUIZ, WHY, LOOP } from '../src/data/lessons.js';
import { runPython } from '../src/lib/pymini.js';

const SNIPPETS = [
  ['파일 읽기', `f = open("공지.txt", "r")\nprint(f.read())\nf.close()`],
  ['없는 파일', `open("없는.txt", "r")`],
  ['빈 파일 이름', `open("", "r")`],
  ['FileNotFoundError 잡기', `try:\n    open("x.txt")\nexcept FileNotFoundError:\n    print("없음")\nelse:\n    print("있음")\nfinally:\n    print("끝")`],
  ['readline · readlines', `f = open("여러줄.txt")\nprint(f.readline(), end="")\nprint(f.readlines())`],
  ['except 순서', `try:\n    [1][3]\nexcept ValueError:\n    print("V")\nexcept IndexError:\n    print("I")\nprint("계속")`],
  ['잡히지 않는 종류', `try:\n    {"a": 1}["b"]\nexcept IndexError:\n    print("I")`],
  ['int 여러 꼴', `for t in ["7", " 8 ", "칠", "2.5", ""]:\n    try:\n        print(int(t))\n    except ValueError:\n        print("X")`],
  ['나누기', `print(7 // 2, 7 / 2)\nprint(1 // 0)`],
  ['raise 잡지 않음', `x = -1\nif x < 0:\n    raise ValueError("음수는 안 돼요")\nprint("끝")`],
  ['raise 잡기 · as e', `try:\n    raise IndexError("0~4번만")\nexcept IndexError as e:\n    print("잡음:", e)\nprint("계속")`],
  ['파이썬 예외의 e', `try:\n    int("칠")\nexcept ValueError as e:\n    print(e)`],
  ['raise 뒤 글자', `raise "안 돼요"`],
  ['예외를 만들기만', `ValueError("던지지 않음")\nprint("지나감")`],
  ['raise 아래 줄', `try:\n    print("하나")\n    raise KeyError("x")\n    print("둘")\nexcept KeyError as e:\n    print("잡음", e)`],
  ['함수 안 raise', `def 검사(n):\n    if n < 1:\n        raise ValueError("1 이상")\n    return n\ntry:\n    검사(0)\nexcept ValueError as e:\n    print(e)\nprint(검사(3))`],
  ['나만의 예외', `class 품절에러(Exception):\n    pass\ntry:\n    raise 품절에러("콜라 품절")\nexcept 품절에러 as e:\n    print("잡음:", e)\nraise 품절에러("또 품절")`],
  ['나머지 연산', `print(1200 % 7, 1200 % 2, 1000 % 3)`],
];

// 앱은 파일 입출력을 쓰지 않지만(학생들이 아직 안 배움), 해석기의 open( ) 이 진짜 파이썬과 같은지는 계속 본다
export const EXTRA_FILES = { '공지.txt': '📢 오늘도 맛있게 드세요!', '여러줄.txt': '첫째\n둘째\n셋째\n' };

export function cases() {
  const order = FIELDS.map((f) => f.key);
  const ins = (v) => order.map((k) => v[k]);
  const out = SNIPPETS.map(([name, code]) => ({ name, code, files: EXTRA_FILES }));
  for (const a of [...ATTACKS, ...RULES, ...NORMALS]) out.push({ name: `자판기 · ${a.label}`, code: MACHINE_CODE, inputs: ins(a.values), files: {} });
  for (const m of MISSIONS) {
    // 끝판왕은 다시 묻는 자판기라 한 값만 계속 넣는 공격은 끝나지 않는다 — 정상 손님과 끈질긴 손님만
    const list = m.loop ? NORMALS : [...ATTACKS, ...RULES, ...NORMALS];
    for (const a of list) out.push({ name: `${m.id} 답 · ${a.label}`, code: m.answer, inputs: ins(a.values), files: {} });
  }
  // 끈질긴 손님 — 앱이 실제로 넣는 차례를 해석기로 한 번 돌려 기록한 뒤, 진짜 파이썬에 같은 차례로 넣는다
  // 다시 묻지 않는 미션 2 답과 견주어 「한 번 틀리면 끝」 도 진짜 파이썬과 같은지 본다
  for (const code of [MISSIONS.find((m) => m.loop).answer, MISSIONS.find((m) => m.id === 'm2').answer]) {
    for (const p of PERSIST) {
      const taken = [];
      runPython(code, { inputFn: makeInputFn(p.values, (s) => taken.push(s)), maxSteps: 200000 });
      out.push({ name: `${code === MISSIONS.find((m) => m.loop).answer ? 'final' : 'm2'} 답 · ${p.label}`, code, inputs: taken, files: {} });
    }
  }
  const lessonCases = (prefix, l) => l.fields.forEach((f, k) => f.chips.forEach((ch) => {
    // 칩 값을 하나씩 (나머지 칸은 기본값). 쉼표로 여러 값을 적는 칸(seq)은 나눠서 차례로 넣는다
    const v = l.fields.flatMap((x, j) => { const s = j === k ? ch : x.def; return x.seq ? s.split(',').map((t) => t.trim()) : [s]; });
    out.push({ name: `${prefix} · ${f.label}=${ch}`, code: l.code, inputs: v, files: {} });
  }));
  for (const [id, l] of Object.entries(LESSONS)) lessonCases(`예제 ${id}`, l);
  for (const w of WHY) lessonCases(`왜 raise ${w.id}`, w);
  lessonCases('다시 묻기', LOOP);
  QUIZ.forEach((q, i) => {
    if (q.type === 'output' || q.type === 'crash') out.push({ name: `확인 문제 ${i + 1}`, code: q.code, inputs: q.inputs || [], files: {} });
    // 'return …' 보기는 함수 밖이라 진짜 파이썬에서 컴파일부터 안 된다(SyntaxError) — 대조에서 뺀다
    if (q.check) q.choices.forEach((ch, k) => !ch.startsWith('return') && out.push({ name: `확인 문제 ${i + 1} · 보기 ${k + 1}`, code: q.code.replace(q.check.slot, ch), inputs: [q.check.input], files: {} }));
  });
  return out;
}
