/**
 * 스테이지 절차 생성기.
 *
 * 사람은 **점만 찍는다.** 출발 · 밟을 수 있는 자리 · 세이브 · 수집 요소 · 도착.
 * 순서도 방향도 없다. 그 점들을 뼈대 삼아 **지형을 만들어 내는 것**이 이 파일의 일이다.
 * 관리 툴(`editor.html`)과 게임이 같은 함수를 쓴다 — Phaser 없는 순수 함수.
 *
 * ## 무엇을 보장하는가
 *
 * **모든 발판에서 모든 발판으로 갈 수 있어야 한다.** 떨어지는 건 공짜라 아래로 가는 길은
 * 저절로 생기지만, 그게 함정이 된다 — 떨어졌는데 돌아 올라갈 수 없으면 거기서 막힌다.
 *
 * 그래서 잇는 길은 전부 **올라갈 수 있는 연결**로만 만든다.
 *
 *   한 칸의 높이차 <= 84px  (점프 최고 상승 96px 에서 여유를 뺀 값)
 *   한 칸의 가로 간격 <= 190px (달리며 뛰어 240px 에서 여유를 뺀 값)
 *
 * 이 조건을 지키는 연결은 **위로도 아래로도** 지날 수 있다. 그러므로 이런 연결로만
 * 전부 이어 두면 오갈 수 있음이 저절로 보장된다. 방향을 따로 따질 필요가 없다.
 *
 * ## 무엇을 만들어 내는가
 *
 * 점을 최단 거리로 잇기만 하면 가운데 한 점을 허브로 삼는 별 모양이 되고, 몇 번을 돌려도
 * 같은 그림이 나온다. 지도처럼 보이려면 세 가지가 더 있어야 한다.
 *
 *   **살**    찍지 않은 자리에도 선반이 흩어져 있어야 한다. 찍은 발판이 전부가 아니어야
 *             "그 너머에도 길이 있다"로 읽힌다
 *   **고리**  갈 수 있는 길이 하나뿐이면 복도다. 다른 길로 돌아올 수 있어야 지도다
 *   **곁길**  아무 데도 닿지 않고 끝나는 짧은 가지. 가 볼 만한 구석을 만든다
 *
 * 이 셋과 잇는 순서에 **씨앗 난수**를 물려서, 같은 점 배치라도 씨앗이 다르면 다른 지형이
 * 나오게 한다. 같은 씨앗이면 언제나 같은 지형이다.
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
  shelf: 150,
};

/** 수집 요소는 발판 위 이만큼 떠 있다 (서 있는 채로 닿는 높이) */
const KEEP_LIFT = 52;

/** 바닥으로 볼 높이 폭. 가장 낮은 점에서 이 안이면 두꺼운 지면으로 깐다 */
const GROUND_BAND = 70;

const round = (n) => Math.round(n);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** 씨앗 하나로 같은 결과를 내는 난수 */
function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => {
    s ^= s << 13;
    s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5;
    s >>>= 0;
    return (s % 100000) / 100000;
  };
}

/* ------------------------------------------------------------------ 그래프 */

/** 두 발판이 **서로** 오갈 수 있는가 (올라갈 수 있으면 내려오는 것은 저절로 된다) */
function linked(a, b) {
  const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
  if (gap > REACH.hop) return false;
  return Math.abs(a.y - b.y) <= REACH.rise;
}

/** 서로 오갈 수 있는 것끼리 묶는다 */
function components(pads) {
  const of = new Array(pads.length).fill(-1);
  const groups = [];
  pads.forEach((_, i) => {
    if (of[i] >= 0) return;
    const id = groups.length;
    const bag = [];
    const open = [i];
    of[i] = id;
    while (open.length) {
      const cur = open.pop();
      bag.push(cur);
      pads.forEach((p, j) => {
        if (of[j] >= 0 || !linked(pads[cur], p)) return;
        of[j] = id;
        open.push(j);
      });
    }
    groups.push(bag);
  });
  return { groups, of };
}

const allPads = (out) => [
  ...out.ground.map((g) => ({ ...g, kind: '지면' })),
  ...out.ledges.map((l) => ({ ...l, kind: '턱' })),
];

/** 이미 놓인 발판과 너무 가까우면 겹쳐 보인다 */
function tooClose(out, x, y, w) {
  return allPads(out).some(
    (p) => Math.abs(p.y - y) < 46 && x < p.x + p.w + 40 && p.x < x + w + 40
  );
}

/**
 * 두 발판 사이에 사다리를 놓는다.
 *
 * 한 칸의 높이차와 가로 간격이 한계를 넘지 않도록 잘게 나눈다.
 * 거의 수직이면 좌우로 흔들어 지그재그로 만든다 — 그래야 착지할 자리가 생기고,
 * 올려다봤을 때 길이 보인다.
 */
function ladder(a, b, out, rand) {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  const dx = bx - ax;
  const dy = b.y - a.y;

  const steps = Math.max(
    Math.ceil(Math.abs(dx) / (REACH.hop - 30)),
    Math.ceil(Math.abs(dy) / (REACH.rise - 8)),
    1
  );
  const vertical = Math.abs(dx) < 140;
  const side = rand && rand() < 0.5 ? -1 : 1;

  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const zig = vertical ? side * (i % 2 ? 82 : -82) : 0;
    const jitter = rand ? (rand() - 0.5) * 40 : 0;
    out.ledges.push({
      x: round(ax + dx * t + zig + jitter - PAD_W.link / 2),
      y: round(a.y + dy * t),
      w: PAD_W.link,
    });
  }
}

/* ------------------------------------------------------------------ 살 붙이기 */

/**
 * 선반 하나 — 발판 2~4개를 한 줄로 놓는다.
 *
 * 발판을 하나씩 흩뿌리면 징검다리처럼 보이고, 줄로 놓아야 **지형**으로 읽힌다.
 */
function shelf(out, rand, x, y, len) {
  const step = 160 + rand() * 30;
  for (let i = 0; i < len; i += 1) {
    const px = round(x + i * step);
    if (tooClose(out, px, y, PAD_W.shelf)) continue;
    out.ledges.push({ x: px, y: round(y), w: PAD_W.shelf });
  }
}

/**
 * 찍지 않은 자리에도 지형을 만든다.
 *
 * 찍은 발판이 전부이면 "여기가 길의 전부"로 보인다. 사이사이와 **가장자리 너머**에도
 * 선반을 흩어 놓아야 지도가 이어져 있다는 느낌이 든다.
 * 흩어 놓은 것 중 외톨이는 뒤의 잇기 단계가 알아서 이어 준다.
 */
function scatter(out, rand, area, amount) {
  const { x0, x1, top, base } = area;
  const span = x1 - x0;

  // **몇 군데로 뭉치게** 놓는다.
  // 고르게 흩뿌리면 발판이 화면을 균일하게 덮어 벽지처럼 보인다. 뭉친 데와 빈 데가
  // 있어야 "저기는 오르는 곳, 여기는 지나가는 곳" 하고 구역이 읽힌다.
  const clumps = Math.max(2, Math.round(span / 900));
  const centers = [];
  for (let i = 0; i < clumps; i += 1) {
    centers.push({
      x: x0 + span * ((i + 0.35 + rand() * 0.3) / clumps),
      y: base - 200 - Math.pow(rand(), 1.3) * (base - top - 200),
      rx: 260 + rand() * 320,
      ry: 220 + rand() * 260,
    });
  }

  for (let i = 0; i < amount; i += 1) {
    const c = centers[Math.floor(rand() * centers.length)];
    const len = 1 + Math.floor(rand() * 3);
    // 가운데로 몰리도록 두 번 뽑아 평균낸다
    const jx = (rand() + rand() - 1) * c.rx;
    const jy = (rand() + rand() - 1) * c.ry;
    const x = clamp(c.x + jx, x0, x1 - len * 170);
    const y = clamp(c.y + jy, top, base - 120);
    shelf(out, rand, x, y, len);
  }
}

/**
 * 아무 데도 닿지 않고 끝나는 짧은 가지.
 *
 * 갈 이유는 없지만 가 볼 수 있는 구석이 있어야 지도가 넓어 보인다.
 * 사다리로 잇기 때문에 들어간 만큼 되돌아 나올 수 있다.
 */
function spurs(out, rand, count) {
  for (let i = 0; i < count; i += 1) {
    const pads = out.ledges;
    if (!pads.length) return;
    const from = pads[Math.floor(rand() * pads.length)];
    const dir = rand() < 0.5 ? -1 : 1;
    const up = rand() < 0.7;
    const steps = 2 + Math.floor(rand() * 2);

    let x = from.x + from.w / 2;
    let y = from.y;
    for (let k = 0; k < steps; k += 1) {
      x += dir * (120 + rand() * 60);
      y += (up ? -1 : 1) * (50 + rand() * 30);
      if (tooClose(out, x - PAD_W.link / 2, y, PAD_W.link)) break;
      out.ledges.push({ x: round(x - PAD_W.link / 2), y: round(y), w: PAD_W.link });
    }
  }
}

/**
 * 갈라진 덩어리를 하나로 잇는다.
 *
 * 매번 **가장 가까운 짝**만 고르면 가운데 한 점을 허브로 삼는 별 모양이 되고,
 * 몇 번을 돌려도 같은 그림이 나온다. 가까운 후보 몇 개 중에서 무작위로 고른다.
 */
function connectAll(out, rand) {
  for (let pass = 0; pass < 300; pass += 1) {
    const pads = allPads(out);
    const { groups } = components(pads);
    if (groups.length <= 1) return true;

    const groupOf = new Map();
    groups.forEach((bag, g) => bag.forEach((i) => groupOf.set(i, g)));

    const cand = [];
    for (let i = 0; i < pads.length; i += 1) {
      for (let j = i + 1; j < pads.length; j += 1) {
        if (groupOf.get(i) === groupOf.get(j)) continue;
        const a = pads[i];
        const b = pads[j];
        const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
        cand.push({ d: gap + Math.abs(a.y - b.y) * 1.2, a, b });
      }
    }
    if (!cand.length) return false;

    cand.sort((p, q) => p.d - q.d);
    const pick = cand[Math.floor(rand() * Math.min(cand.length, 5))];
    ladder(pick.a, pick.b, out, rand);
  }
  return false;
}

/**
 * 고리를 만든다.
 *
 * 전부 이어졌더라도 길이 하나뿐이면 복도지 지도가 아니다.
 * **가깝게 붙어 있는데 빙 돌아야 닿는** 두 곳을 골라 지름길을 놓으면 순환로가 생긴다.
 */
function loops(out, rand, count) {
  for (let i = 0; i < count; i += 1) {
    const pads = allPads(out);
    const hops = hopDistances(pads);

    const cand = [];
    for (let a = 0; a < pads.length; a += 1) {
      for (let b = a + 1; b < pads.length; b += 1) {
        const near = Math.abs(pads[a].x - pads[b].x) < 520 && Math.abs(pads[a].y - pads[b].y) < 420;
        if (!near) continue;
        if (hops[a][b] < 5) continue; // 이미 가까이 이어져 있으면 지름길이 아니다
        cand.push({ gain: hops[a][b], a: pads[a], b: pads[b] });
      }
    }
    if (!cand.length) return;
    cand.sort((p, q) => q.gain - p.gain);
    const pick = cand[Math.floor(rand() * Math.min(cand.length, 6))];
    ladder(pick.a, pick.b, out, rand);
  }
}

/** 발판 사이의 걸음 수 (너무 크면 999) */
function hopDistances(pads) {
  const n = pads.length;
  const adj = pads.map((a, i) => pads.map((b, j) => (i !== j && linked(a, b) ? 1 : 0)));
  return pads.map((_, from) => {
    const dist = new Array(n).fill(999);
    dist[from] = 0;
    const queue = [from];
    while (queue.length) {
      const cur = queue.shift();
      if (dist[cur] > 8) continue;
      for (let j = 0; j < n; j += 1) {
        if (!adj[cur][j] || dist[j] <= dist[cur] + 1) continue;
        dist[j] = dist[cur] + 1;
        queue.push(j);
      }
    }
    return dist;
  });
}

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
 * 냄새 입자 — 출발에서 도착까지 최단 경로 한 줄기에만 뿌린다.
 * 갈림길이 많아도 **길잡이는 하나여야** 한다.
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

  for (let at = to; at >= 0; at = prev[at]) {
    const p = pads[at];
    out.scent.unshift({ x: round(p.x + p.w / 2), y: round(p.y - 62) });
  }
}

/**
 * 점 배치를 지형으로 바꾼다.
 *
 * @param {object} seed
 *   { stage, seedNumber, start, goal, pads[], saves[], keeps[], groundH, richness }
 */
export function build(seed) {
  const rand = rng(seed.seedNumber ?? 1);
  const groundH = seed.groundH ?? 90;
  const richness = seed.richness ?? 1; // 살을 얼마나 붙일지 (0 = 점만 잇는다)
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
  const topY = Math.min(...pts.map((p) => p.y));
  // 찍은 범위보다 **넓게** 잡는다. 가장자리 너머에도 길이 있어야 지도가 이어져 보인다
  const minX = Math.min(...pts.map((p) => p.x)) - 340;
  const maxX = Math.max(...pts.map((p) => p.x)) + 420;

  // 1. 바닥을 쭉 깐다. 구멍이 있으면 그 자리가 곧 "떨어지면 죽는 자리"가 된다
  out.ground.push({ x: round(minX), y: round(baseY), w: round(maxX - minX), h: groundH });

  // 2. 찍은 점마다 발판을 놓는다
  const place = (point, width) => {
    const pad = padAt(point, width, baseY);
    if (!pad.onGround) out.ledges.push({ x: pad.x, y: pad.y, w: pad.w });
    return pad;
  };

  const startPad = place(start, PAD_W.start);
  const goalPad = place(goal, PAD_W.goal);
  (seed.pads || []).forEach((p) => place(p, PAD_W.pad));

  (seed.saves || []).forEach((p) => {
    const pad = place(p, PAD_W.save);
    out.saves.push({ x: round(p.x), y: pad.y });
  });

  (seed.keeps || []).forEach((p, i) => {
    const pad = place({ x: p.x, y: p.y + KEEP_LIFT }, PAD_W.keep);
    out.keepsakes.push({
      id: `s${seed.stage}_gen${i + 1}`,
      x: round(p.x),
      y: round(pad.y - KEEP_LIFT),
    });
  });

  // 3. 살을 붙인다 — 찍지 않은 자리와 가장자리 너머까지
  const span = maxX - minX;
  const height = Math.max(200, baseY - topY);
  const amount = clamp(round(((span * height) / 220000) * richness), 0, 60);
  scatter(out, rand, { x0: minX + 60, x1: maxX - 200, top: topY - 240, base: baseY }, amount);

  // 4. 전부 오갈 수 있게 잇는다
  const connected = connectAll(out, rand);

  // 5. 고리와 곁길 — 길이 하나뿐이면 복도지 지도가 아니다
  if (richness > 0) {
    loops(out, rand, clamp(round(3 * richness), 0, 8));
    spurs(out, rand, clamp(round(4 * richness), 0, 10));
    connectAll(out, rand); // 곁길이 외톨이가 되지 않도록 한 번 더 훑는다
  }

  // 6. 길잡이 냄새
  scentPath(
    out,
    startPad.onGround ? out.ground[0] : startPad,
    goalPad.onGround ? out.ground[0] : goalPad
  );

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
      찍은점: pts.length,
      발판: pads.length,
      높이차: Math.max(...tops) - Math.min(...tops),
      세이브: out.saves.length,
      기억: out.keepsakes.length,
      이어짐: connected && groups.length === 1 ? '전부 오갈 수 있다' : `덩어리 ${groups.length}개로 갈라짐`,
      갈라진덩어리: groups.length,
    },
  };
}

/**
 * 검사 — 모든 발판이 서로 오갈 수 있는가.
 *
 * 잇는 연결이 전부 "올라갈 수 있는" 연결이므로, 하나로 이어져 있으면 어느 쪽으로든
 * 지날 수 있다. 방향을 따로 볼 필요가 없다.
 */
export function checkReach(layout) {
  const pads = allPads(layout);
  if (!pads.length) return { ok: true, unreachable: [] };
  const { groups, of } = components(pads);
  const unreachable = pads.filter((_, i) => of[i] !== of[0]).map((p) => `${p.kind}@${p.x},${p.y}`);
  return { ok: groups.length === 1, unreachable, groups: groups.length };
}
