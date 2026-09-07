import stage1 from './stage1.js';
import stage2 from './stage2.js';
import stage3 from './stage3.js';
import stage4 from './stage4.js';

/**
 * 관리 툴(`editor.html`)이 확정한 배치.
 *
 * 파일이 있으면 **손으로 짠 지형 대신 그것을 쓴다.** 되돌리려면 관리 툴에서 "되돌리기"를
 * 누르거나 `src/data/layouts/stage<N>.json` 을 지우면 된다.
 */
let LAYOUTS = {};
try {
  // Vite 는 이 호출을 빌드 때 객체로 바꿔 준다. 순수 Node 로 읽을 때는 없는 기능이라
  // 예외가 나는데, 그때는 손으로 짠 배치를 그대로 쓴다 (검사 스크립트용)
  LAYOUTS = import.meta.glob('./layouts/*.json', { eager: true });
} catch {
  LAYOUTS = {};
}

const BASE = [stage1, stage2, stage3, stage4];

/** 그 x 자리의 지면 윗면 높이. 없으면 null */
function groundTopAt(ground, x) {
  const hit = ground.filter((g) => g.x <= x && x <= g.x + g.w).sort((a, b) => a.y - b.y)[0];
  return hit ? hit.y : null;
}

/**
 * 지면에 붙어 있던 것들을 새 지형 위로 다시 앉힌다.
 *
 * 지형이 통째로 바뀌었으므로 예전 y 를 그대로 두면 소품이 공중에 뜬다.
 * x 는 그대로 두고 높이만 새 지면에 맞춘다. 새 지면이 없는 자리의 것은 버린다.
 */
function reanchor(items, ground, key = 'y') {
  return (items || [])
    .map((it) => {
      const top = groundTopAt(ground, it.x);
      if (top == null) return null;
      return { ...it, [key]: top + (it.offsetY || 0) };
    })
    .filter(Boolean);
}

/**
 * 관리 툴에서 그린 좌표를 **0 부터 시작하도록 옮긴다.**
 *
 * 툴에서는 화면을 왼쪽·위로 밀면서 음수 자리에도 찍을 수 있다. 그런데 게임 월드는
 * (0, 0) 에서 시작하므로, 음수 자리에 있는 지형은 경계 밖이 되어 카메라가 따라가지
 * 못하고 강아지가 벽에 갇힌다. 그림은 그대로 두고 **전체를 통째로 밀어** 맞춘다.
 */
function normalize(L) {
  const pads = [...L.ground, ...(L.ledges || [])];
  if (!pads.length) return L;

  const margin = 160;
  const dx = margin - Math.min(...pads.map((p) => p.x));
  const dy = margin - Math.min(...pads.map((p) => p.y));
  if (dx === 0 && dy === 0) return L;

  const move = (list) => (list || []).map((p) => ({ ...p, x: p.x + dx, y: p.y + dy }));
  return {
    ...L,
    ground: move(L.ground),
    ledges: move(L.ledges),
    scent: move(L.scent),
    keepsakes: move(L.keepsakes),
    saves: move(L.saves),
    props: move(L.props),
    start: L.start ? { ...L.start, x: L.start.x + dx, y: L.start.y + dy } : L.start,
    goal: L.goal ? { ...L.goal, x: L.goal.x + dx, y: L.goal.y + dy } : L.goal,
    width: (L.width ?? 0) + dx,
  };
}

/**
 * 맵 양끝을 지면으로 막는다.
 *
 * 생성기는 찍은 점 범위보다 조금 넓게 바닥을 깔지만, 월드 폭은 그보다 더 넓게 잡힌다.
 * 그 차이만큼 양 끝에 바닥이 없어서 **끝까지 걸어가면 그대로 떨어진다.**
 * 가장 바깥 바닥 조각을 경계까지 늘려 막는다 — 구멍을 새로 파지 않으니 안전하다.
 */
function sealEdges(ground, width) {
  if (!ground.length) return ground;
  const out = ground.map((g) => ({ ...g }));

  let left = out[0];
  let right = out[0];
  out.forEach((g) => {
    if (g.x < left.x) left = g;
    if (g.x + g.w > right.x + right.w) right = g;
  });

  if (left.x > 0) {
    left.w += left.x;
    left.x = 0;
  }
  if (right.x + right.w < width) right.w = width - right.x;
  return out;
}

/** 안내판을 세울 때 서로 겹치지 않는 간격 */
const SIGN_STEP = 300;

/**
 * 튜토리얼 안내판을 새 지형의 **출발 지점 앞에** 다시 세운다.
 *
 * 지형이 통째로 바뀌면 손으로 잡아 둔 x 는 뜻을 잃는다. 그렇다고 버리면 조작을 알려
 * 주는 것이 스테이지에서 통째로 사라진다 — 이 게임에는 글자가 없으므로 안내판이
 * 유일한 설명이다.
 *
 * 그래서 x 대신 **순서**만 남긴다. 출발 지점에서 도착 쪽으로 한 장씩 늘어놓으면,
 * 걸어가며 만나는 순서가 곧 배우는 순서(이동 → 점프 → 도움닫기 → …)가 된다.
 * 지면이 없는 자리의 것은 세우지 않는다.
 */
function tutorialSigns(base, ground, start, goal) {
  const signs = base.signs || [];
  if (!signs.length || !start) return [];

  const dir = goal && goal.x < start.x ? -1 : 1;
  return signs
    .map((sign, i) => {
      const x = Math.round(start.x + dir * SIGN_STEP * (i + 1));
      const top = groundTopAt(ground, x);
      return top == null ? null : { ...sign, x, y: top };
    })
    .filter(Boolean);
}

/** 손으로 짠 스테이지 위에 관리 툴 배치를 덮는다 */
function applyLayout(base, saved) {
  if (!saved.layout || !saved.layout.ground?.length) return base;
  const L = normalize(saved.layout);

  // 생성기가 세이브 자리의 높이까지 정해서 준다. 없으면 그 x 의 지면 위에 놓는다
  const savePoints = (L.saves || []).map((s, i) => ({
    ...(base.savePoint || {}),
    id: `s${base.id}_gen${i + 1}`,
    x: s.x,
    y: s.y ?? groundTopAt(L.ground, s.x) ?? base.savePoint?.y,
  }));

  // 위로 한참 올라가는 지도는 스테이지 높이와 낙사선도 같이 넓혀야 한다.
  // 폭·높이는 **실제로 놓인 지형**에서 재야 경계 밖으로 삐져나오지 않는다
  const all = [...L.ground, ...(L.ledges || [])];
  const lowest = Math.max(...L.ground.map((g) => g.y + (g.h ?? 90)));
  const rightmost = Math.max(...all.map((p) => p.x + p.w));
  const width = Math.max(L.width ?? 0, rightmost + 200);

  const ground = sealEdges(L.ground, width);
  const start = L.start ? { x: L.start.x, y: L.start.y - 70 } : base.start;
  const goal = { ...base.goal, ...(L.goal || {}) };

  return {
    ...base,
    width,
    height: Math.max(base.height, lowest + 60),
    killY: lowest + 90,
    ground,
    ledges: L.ledges || [],
    // 지형이 바뀌었으므로 지형에 매달려 있던 것들은 버린다.
    // 관리 툴로 만든 지도는 지형과 냄새와 기억으로만 이루어진다
    moving: [],
    crumble: [],
    hazards: [],
    // 안내판만은 버리지 않는다 — 조작을 알려 주는 유일한 수단이다.
    // 지형에 매달린 x 를 버리고 출발 지점 앞에 순서대로 다시 세운다
    signs: tutorialSigns(base, ground, start, goal),
    scent: L.scent || [],
    keepsakes: L.keepsakes || [],
    // 생성기가 소품까지 만들어 주면 그것을 쓴다. 없으면 손으로 놓은 것을 새 지면에 앉힌다
    props: L.props?.length ? L.props : reanchor(base.props, L.ground),
    // 발판 **윗면** 좌표다. 거기에 그대로 놓으면 몸이 지면에 박혀 못 움직인다
    start,
    goal,
    // 배치에 세이브를 안 찍었으면 **없는 것으로 둔다.** 손으로 짠 자리를 남겨 두면
    // 지형이 통째로 바뀐 자리에 세이브 소품만 공중에 떠 있게 된다
    savePoint: savePoints[0] || null,
    savePoints,
    generated: true,
  };
}

export const STAGES = BASE.map((base) => {
  const saved = LAYOUTS[`./layouts/stage${base.id}.json`];
  return saved ? applyLayout(base, saved.default ?? saved) : base;
});

export function getStage(id) {
  return STAGES.find((s) => s.id === id) || null;
}

export const LAST_STAGE = STAGES[STAGES.length - 1].id;
