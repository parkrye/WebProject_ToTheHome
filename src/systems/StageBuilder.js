/**
 * 스테이지 절차 생성기.
 *
 * 사람은 **점만 찍는다.** 출발 · 밟을 수 있는 자리 · 세이브 · 수집 요소 · 도착.
 * 순서도 없고 방향도 없다. 그 점들에 발판을 놓고, **전부 오갈 수 있도록** 사이를 잇는 것이
 * 이 파일이 하는 일이다. 관리 툴(`editor.html`)과 게임이 같은 함수를 쓴다 — Phaser 없는 순수 함수.
 *
 * ## 무엇을 보장하는가
 *
 * **모든 발판에서 모든 발판으로 갈 수 있어야 한다.** 한쪽으로만 갈 수 있으면 안 된다.
 * 떨어지는 건 공짜라서 아래로 가는 길은 저절로 생기지만, 그게 함정이 된다 —
 * 떨어졌는데 돌아 올라갈 수 없으면 게임이 거기서 막힌다.
 *
 * 그래서 잇는 길은 전부 **올라갈 수 있는 연결**로만 만든다.
 *
 *   한 칸의 높이차 <= 84px  (점프 최고 상승 96px 에서 여유를 뺀 값)
 *   한 칸의 가로 간격 <= 190px (달리며 뛰어 240px 에서 여유를 뺀 값)
 *
 * 이 조건을 지키는 연결은 **위로도 아래로도** 지날 수 있다. 올라갈 땐 뛰고, 내려올 땐
 * 그냥 떨어지면 된다. 그러므로 이런 연결만으로 전부 이어 두면 **오갈 수 있음이 저절로
 * 보장된다.** 따로 방향을 따질 필요가 없다.
 *
 * 바닥은 끊지 않고 쭉 깐다. 어디서 떨어져도 바닥에 닿고, 바닥은 다른 발판과 이어져 있으므로
 * 다시 올라갈 수 있다. 구멍을 파면 그 순간 "떨어지면 죽는 자리"가 생긴다.
 */

/** 점프로 닿는 거리. 실제 한계(96 / 240)에서 여유를 뺀 값이다 */
export const REACH = {
  rise: 84,
  hop: 190,
};

const PAD_W = {
  start: 240,
  goal: 240,
  save: 220,
  pad: 170,
  keep: 130,
  link: 120,
};

/** 수집 요소는 발판 위 이만큼 떠 있다 (서 있는 채로 닿는 높이) */
const KEEP_LIFT = 52;

/** 바닥으로 볼 높이 폭. 가장 낮은 점에서 이 안이면 두꺼운 지면으로 깐다 */
const GROUND_BAND = 70;

const round = (n) => Math.round(n);

/* ------------------------------------------------------------------ 그래프 */

/** 두 발판이 **서로** 오갈 수 있는가 (올라갈 수 있으면 내려오는 것은 저절로 된다) */
function linked(a, b) {
  const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  if (gap > REACH.hop) return false;
  return Math.abs(a.y - b.y) <= REACH.rise;
}

/** 서로 오갈 수 있는 것끼리 묶는다 */
function components(pads) {
  const seen = new Array(pads.length).fill(-1);
  const groups = [];
  pads.forEach((_, i) => {
    if (seen[i] >= 0) return;
    const id = groups.length;
    const bag = [];
    const open = [i];
    seen[i] = id;
    while (open.length) {
      const cur = open.pop();
      bag.push(cur);
      pads.forEach((p, j) => {
        if (seen[j] >= 0 || !linked(pads[cur], p)) return;
        seen[j] = id;
        open.push(j);
      });
    }
    groups.push(bag);
  });
  return { groups, of: seen };
}

/**
 * 두 발판 사이에 사다리를 놓는다.
 *
 * 한 칸의 높이차와 가로 간격이 위 한계를 넘지 않도록 잘게 나눈다.
 * 거의 수직이면 좌우로 흔들어 지그재그로 만든다 — 그래야 착지할 자리가 생기고,
 * 올려다봤을 때 길이 보인다.
 */
function ladder(a, b, out) {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  const dx = bx - ax;
  const dy = b.y - a.y;

  const steps = Math.max(
    Math.ceil(Math.abs(dx) / (REACH.hop - 30)),
    Math.ceil(Math.abs(dy) / (REACH.rise - 8)),
    1
  );
  const vertical = Math.abs(dx) < 120;

  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const zig = vertical ? (i % 2 ? 78 : -78) : 0;
    out.ledges.push({
      x: round(ax + dx * t + zig - PAD_W.link / 2),
      y: round(a.y + dy * t),
      w: PAD_W.link,
    });
  }
}

/**
 * 갈라진 덩어리를 하나로 잇는다.
 *
 * 가장 가까운 두 덩어리를 골라 사다리를 놓기를, 덩어리가 하나가 될 때까지 되풀이한다.
 * 가까운 것부터 이으면 사다리가 짧아지고, 짧은 사다리는 지형처럼 보인다.
 */
function connectAll(out) {
  for (let pass = 0; pass < 200; pass += 1) {
    const pads = allPads(out);
    const { groups } = components(pads);
    if (groups.length <= 1) return true;

    // **서로 다른 덩어리에 속한 발판 중 전체에서 가장 가까운 짝**을 고른다.
    // 특정 덩어리를 기준으로 삼으면 멀리 있는 것끼리 억지로 이어져 긴 사다리가 생긴다.
    const groupOf = new Map();
    groups.forEach((bag, g) => bag.forEach((i) => groupOf.set(i, g)));

    let best = null;
    for (let i = 0; i < pads.length; i += 1) {
      for (let j = i + 1; j < pads.length; j += 1) {
        if (groupOf.get(i) === groupOf.get(j)) continue;
        const a = pads[i];
        const b = pads[j];
        const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
        const d = gap + Math.abs(a.y - b.y) * 1.2;
        if (!best || d < best.d) best = { d, a, b };
      }
    }
    if (!best) return false;
    ladder(best.a, best.b, out);
  }
  return false;
}

const allPads = (out) => [
  ...out.ground.map((g) => ({ ...g, kind: '지면' })),
  ...out.ledges.map((l) => ({ ...l, kind: '턱' })),
];

/* ------------------------------------------------------------------ 만들기 */

/** 점 하나를 발판 하나로 바꾼다 */
function padAt(point, width, baseY) {
  const onGround = point.y >= baseY - GROUND_BAND;
  return {
    x: round(point.x - width / 2),
    y: round(onGround ? baseY : point.y),
    w: width,
    onGround,
  };
}

/**
 * 냄새 입자 — 출발에서 도착까지, 발판을 타고 가는 순서대로 뿌린다.
 *
 * 갈림길이 많아도 **길잡이는 하나여야** 한다. 최단 경로만 따라 놓는다.
 */
function scentPath(out, startPad, goalPad) {
  const pads = allPads(out);
  const idx = (p) => pads.findIndex((q) => q.x === p.x && q.y === p.y && q.w === p.w);
  const from = idx(startPad);
  const to = idx(goalPad);
  if (from < 0 || to < 0) return;

  const prev = new Array(pads.length).fill(-1);
  const seen = new Array(pads.length).fill(false);
  const queue = [from];
  seen[from] = true;
  while (queue.length) {
    const cur = queue.shift();
    if (cur === to) break;
    pads.forEach((p, j) => {
      if (seen[j] || !linked(pads[cur], p)) return;
      seen[j] = true;
      prev[j] = cur;
      queue.push(j);
    });
  }
  if (!seen[to]) return;

  const chain = [];
  for (let at = to; at >= 0; at = prev[at]) chain.unshift(pads[at]);
  chain.forEach((p) => {
    out.scent.push({ x: round(p.x + p.w / 2), y: round(p.y - 62) });
  });
}

/**
 * 점 배치를 지형으로 바꾼다.
 *
 * @param {object} seed
 *   { stage, start:{x,y}, goal:{x,y}, pads:[{x,y}], saves:[{x,y}], keeps:[{x,y}], groundH }
 */
export function build(seed) {
  const groundH = seed.groundH ?? 90;
  const out = { ground: [], ledges: [], scent: [], keepsakes: [], saves: [] };

  const start = seed.start;
  const goal = seed.goal;
  if (!start || !goal) {
    return { ...out, stats: { error: '출발 지점과 도착 지점을 찍어야 한다' } };
  }

  const pts = [
    start,
    goal,
    ...(seed.pads || []),
    ...(seed.saves || []),
    ...(seed.keeps || []).map((k) => ({ ...k, y: k.y + KEEP_LIFT })),
  ];
  const baseY = Math.max(...pts.map((p) => p.y));
  const minX = Math.min(...pts.map((p) => p.x)) - 160;
  const maxX = Math.max(...pts.map((p) => p.x)) + 200;

  // 1. 바닥을 쭉 깐다. 구멍이 있으면 그 자리가 곧 "떨어지면 죽는 자리"가 된다
  out.ground.push({ x: round(minX), y: round(baseY), w: round(maxX - minX), h: groundH });

  // 2. 찍은 점마다 발판을 놓는다. 바닥 높이에 있는 것은 이미 바닥이 있으므로 그냥 둔다
  const place = (point, width) => {
    const pad = padAt(point, width, baseY);
    if (!pad.onGround) out.ledges.push({ x: pad.x, y: pad.y, w: pad.w });
    return pad;
  };

  const startPad = place(start, PAD_W.start);
  const goalPad = place(goal, PAD_W.goal);
  (seed.pads || []).forEach((p) => place(p, PAD_W.pad));

  (seed.saves || []).forEach((p, i) => {
    const pad = place(p, PAD_W.save);
    out.saves.push({ x: round(p.x), y: pad.y });
  });

  (seed.keeps || []).forEach((p, i) => {
    const pad = place({ x: p.x, y: p.y + KEEP_LIFT }, PAD_W.keep);
    out.keepsakes.push({ id: `s${seed.stage}_gen${i + 1}`, x: round(p.x), y: round(pad.y - KEEP_LIFT) });
  });

  // 3. 갈라진 덩어리를 전부 잇는다
  const connected = connectAll(out);

  // 4. 길잡이 냄새는 출발에서 도착까지 한 줄기만
  scentPath(out, startPad.onGround ? out.ground[0] : startPad, goalPad.onGround ? out.ground[0] : goalPad);

  const pads = allPads(out);
  const { groups } = components(pads);
  const tops = pads.map((p) => p.y);

  return {
    ...out,
    start: { x: start.x, y: startPad.y },
    goal: { x: goal.x, y: goalPad.y },
    width: round(maxX + 120),
    stats: {
      길이: round(maxX + 120),
      발판: pads.length,
      놓은점: pts.length,
      높이차: Math.max(...tops) - Math.min(...tops),
      기억: out.keepsakes.length,
      세이브: out.saves.length,
      이어짐: connected && groups.length === 1 ? '전부 오갈 수 있다' : `덩어리 ${groups.length}개로 갈라짐`,
      갈라진덩어리: groups.length,
    },
  };
}

/**
 * 검사 — 모든 발판이 서로 오갈 수 있는가.
 *
 * 잇는 연결이 전부 "올라갈 수 있는" 연결이므로, 하나로 이어져 있으면
 * 어느 쪽으로든 지날 수 있다. 방향을 따로 볼 필요가 없다.
 */
export function checkReach(layout) {
  const pads = allPads(layout);
  if (!pads.length) return { ok: true, unreachable: [] };
  const { groups, of } = components(pads);
  const unreachable = pads.filter((_, i) => of[i] !== of[0]).map((p) => `${p.kind}@${p.x},${p.y}`);
  return { ok: groups.length === 1, unreachable, groups: groups.length };
}
