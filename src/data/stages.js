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

/** 손으로 짠 스테이지 위에 관리 툴 배치를 덮는다 */
function applyLayout(base, saved) {
  const L = saved.layout;
  if (!L || !L.ground?.length) return base;

  const savePoints = (L.saves || []).map((s, i) => ({
    ...(base.savePoint || {}),
    id: `s${base.id}_gen${i + 1}`,
    x: s.x,
    y: groundTopAt(L.ground, s.x) ?? s.y,
  }));

  // 위로 한참 올라가는 지도는 스테이지 높이와 낙사선도 같이 넓혀야 한다
  const lowest = Math.max(...L.ground.map((g) => g.y + (g.h ?? 90)));

  return {
    ...base,
    width: L.width ?? base.width,
    height: Math.max(base.height, lowest + 60),
    killY: lowest + 90,
    ground: L.ground,
    ledges: L.ledges || [],
    // 지형이 바뀌었으므로 지형에 매달려 있던 것들은 버린다.
    // 관리 툴로 만든 지도는 지형과 냄새와 기억으로만 이루어진다
    moving: [],
    crumble: [],
    hazards: [],
    signs: [],
    scent: L.scent || [],
    keepsakes: L.keepsakes || [],
    props: reanchor(base.props, L.ground),
    // 앵커는 지면 **윗면**이다. 거기에 그대로 놓으면 몸이 지면에 박혀 못 움직인다
    start: L.start ? { x: L.start.x + 40, y: L.start.y - 70 } : base.start,
    goal: { ...base.goal, ...(L.goal || {}) },
    savePoint: savePoints[0] || base.savePoint,
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
