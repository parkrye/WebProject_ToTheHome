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

import { TERRAIN } from '../config.js';
import { TILE, PROP, ACTOR } from './AssetManifest.js';

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
export function linked(a, b) {
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

/**
 * 이미 놓인 발판과 너무 가까우면 겹쳐 보인다.
 *
 * 위아래로 110px 은 띄운다. 여럿이 모인 자리는 **두껍게** 깔 것이므로, 그만한 두께가
 * 들어갈 자리를 미리 비워 두어야 아래 발판을 덮지 않는다. 옆으로도 넉넉히 벌린다 —
 * 발판이 서로 붙어 있으면 계단이 아니라 겹쳐 놓은 판자로 보인다 (플레이 리뷰 3차 7).
 */
function tooClose(out, x, y, w) {
  return allPads(out).some((p) => {
    const dy = Math.abs(p.y - y);
    if (dy >= 110) return false;
    // **같은 줄에서 옆에 나란히 놓는 것은 막지 않는다.** 그래야 줄지어 이어진 땅이 된다.
    // 막을 것은 실제로 겹치는 경우뿐이다
    const margin = dy < 30 ? 6 : 64;
    return x < p.x + p.w + margin && p.x < x + w + margin;
  });
}

/** 계단 한 칸의 가로 폭. 한 번에 뛸 수 있는 거리 안이어야 한다 */
const STAIR_X = REACH.hop - 40;

/** 이 가로 간격 안에서 이만큼 올라가야 하면 제자리 오르기다 — 계단으로 돌려 놓는다 */
const STEEP_X = 320;
const STEEP_Y = REACH.rise * 1.5;

/**
 * **높이가 달라지는 두 칸이 x 를 나눠 가져도 되는 길이.**
 *
 * 오르는 길에서 윗칸이 아랫칸 위를 덮으면 계단이 아니라 사다리가 된다. 아랫칸에
 * 서면 머리 위가 막혀 있고, 위로 뛰려면 옆으로 비켜설 자리가 없다. 한 칸 오를
 * 때마다 **반드시 옆으로 비켜서게** 한다 — 겹침은 맞닿는 정도까지만.
 *
 * 같은 높이끼리는 상관없다. 나란히 이어 붙어야 한 덩어리 땅이 되기 때문이다.
 */
const MAX_STEP_OVERLAP = 1;

/** 그래서 높이가 달라지는 두 칸은 x 가 최소 이만큼 벌어져야 한다 */
const STEP_X_MIN = PAD_W.link - MAX_STEP_OVERLAP;

/**
 * 같은 줄에서 이만큼 붙어 있으면 한 덩어리로 합친다 (thicken).
 *
 * 계단 자리를 고를 때도 이 값을 봐야 한다. 합쳐지고 나면 없어질 틈에 칸을 놓으면,
 * 놓을 때는 안 겹쳤는데 합친 뒤에 덮이기 때문이다.
 */
const MERGE_GAP = 84;

/** 두 칸이 가로로 나눠 가진 길이 */
function overlapX(a, ax, aw) {
  return Math.min(a.x + a.w, ax + aw) - Math.max(a.x, ax);
}

/** [x, x+w] 가 **높이가 다른** 이미 놓인 칸을 덮는가 (한 번에 뛸 만한 높이차 안에서만) */
function coversNeighbour(pads, x, y, w) {
  return pads.some((p) => {
    const dy = Math.abs(p.y - y);
    if (dy === 0 || dy > REACH.rise) return false;
    return overlapX(p, x, w) > MAX_STEP_OVERLAP;
  });
}

/** 이 칸에서 뛰어 닿을 수 있는 자리인가 */
function withinHop(prev, x, w) {
  if (!prev) return true;
  return Math.max(0, Math.max(prev.x, x) - Math.min(prev.x + prev.w, x + w)) <= REACH.hop;
}

/** 옆으로 얼마나까지 밀어 볼지. 이보다 멀리 밀면 길이 엉뚱한 데로 샌다 */
const NUDGE_MAX = STAIR_X * 2;
const NUDGE_STEP = 24;

/**
 * 길을 놓는 모든 칸이 지나는 자리.
 *
 * **높이가 달라지는 칸은 아래 칸 위를 덮지 않는다.** 덮으면 계단이 아니라 사다리가
 * 되기 때문이다 (MAX_STEP_OVERLAP 주석 참고). 덮게 생겼으면 옆으로 비켜세운다.
 *
 * 볼 것이 둘이다. 바로 앞 칸은 반드시 피해야 하므로 먼저 맞닿는 자리까지 밀고,
 * 그 다음 **이미 깔려 있는 칸들**도 덮지 않는 가장 가까운 자리를 찾는다. 뒤쪽은
 * 뛸 거리 안에서만 찾고, 못 찾으면 원래 자리에 둔다 — 길이 끊기는 것보다 낫다.
 *
 * @returns {object} 실제로 놓인 칸. 다음 칸의 `prev` 가 된다
 */
function stepPad(out, prev, x, y, w = PAD_W.link) {
  let px = x;

  // 1. 바로 앞 칸 — 맞닿는 자리까지 밀어도 뛸 거리를 넘지 않는다
  if (prev && round(prev.y) !== round(y) && overlapX(prev, px, w) > MAX_STEP_OVERLAP) {
    const toRight = px + w / 2 >= prev.x + prev.w / 2;
    px = toRight ? prev.x + prev.w - MAX_STEP_OVERLAP : prev.x - w + MAX_STEP_OVERLAP;
  }

  // 2. 이미 깔린 칸 — 가까운 쪽부터 번갈아 찾아본다
  const pads = allPads(out);
  if (coversNeighbour(pads, px, y, w)) {
    for (let d = NUDGE_STEP; d <= NUDGE_MAX; d += NUDGE_STEP) {
      const tries = [px + d, px - d].filter(
        (t) =>
          withinHop(prev, t, w) &&
          (!prev || round(prev.y) === round(y) || overlapX(prev, t, w) <= MAX_STEP_OVERLAP)
      );
      const found = tries.find((t) => !coversNeighbour(pads, t, y, w));
      if (found !== undefined) {
        px = found;
        break;
      }
    }
  }

  const pad = { x: round(px), y: round(y), w };
  out.ledges.push(pad);
  return pad;
}

/**
 * 제자리에서 올라가야 할 때 **길게 계단식으로** 돌려 놓는다.
 *
 * 좌우좌우로 흔들어 올리면 같은 자리에서 방향만 바꿔 가며 오르게 된다. 오르기도
 * 답답하고, 지형이 아니라 사다리를 세워 둔 것으로 보인다.
 *
 * 대신 **한 방향으로 쭉 가면서 오르고, 끝에서 꺾어 되돌아오면서 더 오른다.**
 * 다 오르면 목표 x 까지 같은 높이로 걸어가는 다리를 놓아 자리를 맞춘다.
 * 산길의 갈지자 등산로와 같은 모양이다.
 */
function switchback(a, b, out, rand) {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  const dy = b.y - a.y;

  const steps = Math.max(2, Math.ceil(Math.abs(dy) / (REACH.rise - 8)));
  const rise = dy / steps;
  // 한 다리(leg)의 길이. 길수록 "쭉 가서 올라간다"가 된다
  const perLeg = 3 + Math.floor(rand() * 2);
  // 목표 쪽으로 먼저 뻗는 편이 되돌아오는 길이 짧다
  let dir = Math.abs(bx - ax) > STAIR_X ? Math.sign(bx - ax) : rand() < 0.5 ? -1 : 1;

  // 한 칸의 가로 폭(150)이 칸 너비(120)보다 넓으므로 계단은 저절로 옆으로 비켜선다.
  // 꺾이는 자리도 마찬가지다 — 되돌아오는 첫 칸은 직전 칸에서 150 떨어진다
  let x = ax;
  let prev = a;
  for (let i = 1; i <= steps; i += 1) {
    x += dir * STAIR_X;
    prev = stepPad(out, prev, x - PAD_W.link / 2, a.y + rise * i);
    x = prev.x + PAD_W.link / 2; // 밀렸으면 그만큼 따라간다
    if (i % perLeg === 0) dir = -dir; // 끝에서 꺾어 되돌아온다
  }

  // 다 올라온 자리에서 목표 x 까지 **같은 높이로** 이어 준다 (겹쳐도 되는 구간이다)
  const runSteps = Math.ceil(Math.abs(bx - x) / STAIR_X);
  for (let k = 1; k < runSteps; k += 1) {
    prev = stepPad(out, prev, x + ((bx - x) * k) / runSteps - PAD_W.link / 2, b.y);
  }
}

/**
 * 두 발판 사이에 길을 놓는다.
 *
 * 가로로 벌어져 있으면 균등하게 나눠 딛고 갈 자리를 만들고, 거의 제자리에서 올라가야
 * 하면 계단식으로 돌려 놓는다 (switchback 주석 참고).
 */
function ladder(a, b, out, rand) {
  const r = rand || (() => 0.5);
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  const dx = bx - ax;
  const dy = b.y - a.y;

  const riseSteps = Math.ceil(Math.abs(dy) / (REACH.rise - 8));
  // 한 칸 오를 때마다 옆으로 비켜서야 하므로, **오를 칸 수만큼 가로 자리가 있어야**
  // 곧은 계단이 된다. 자리가 모자라면 윗칸이 아랫칸을 덮게 되므로 갈지자로 돌린다
  const roomSteps = Math.floor(Math.abs(dx) / STEP_X_MIN);
  const steep = Math.abs(dx) < STEEP_X && Math.abs(dy) > STEEP_Y;

  if (dy !== 0 && (riseSteps > roomSteps || steep)) {
    switchback(a, b, out, r);
    return;
  }

  const steps = Math.max(Math.ceil(Math.abs(dx) / (REACH.hop - 30)), riseSteps, 1);

  let prev = a;
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    // 높이가 달라지는 길에는 흔들림을 주지 않는다. 20px 만 밀려도 윗칸이 아랫칸을 덮는다
    const jitter = dy === 0 ? (r() - 0.5) * 40 : 0;
    prev = stepPad(out, prev, ax + dx * t + jitter - PAD_W.link / 2, a.y + dy * t);
  }
}

/* ------------------------------------------------------------------ 살 붙이기 */

/**
 * 선반 하나 — 발판 2~4개를 한 줄로 놓는다.
 *
 * 발판을 하나씩 흩뿌리면 징검다리처럼 보이고, 줄로 놓아야 **지형**으로 읽힌다.
 */
function shelf(out, rand, x, y, len) {
  // 칸 폭보다 조금만 벌린다. 틈이 MERGE_GAP 안이라야 한 덩어리로 합쳐진다
  const step = PAD_W.shelf + rand() * 30;
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
    // 3~5 개를 한 줄로. 짧으면 연석에 그치고, 길어야 **높은 데 있는 땅**이 된다
    const len = 3 + Math.floor(rand() * 3);
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
      x += dir * (STEP_X_MIN + 1 + rand() * 60); // 높이가 달라지므로 반드시 옆으로 비켜선다
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

/* ------------------------------------------------------------------ 두께 */

/** 지면 윗면 타일 네 종류. 자리마다 다른 것을 써서 같은 무늬가 반복되지 않게 한다 */
const TOP_VARIANTS = [TILE.TOP, TILE.TOP_A, TILE.TOP_B, TILE.TOP_C];

/**
 * 몇 개가 모였는지에 따라 **어떤 타일을 쓸지** 정한다.
 *
 * 타일셋에는 쓰임이 다른 칸이 여럿 있는데, 전부 얇은 발판(6번)으로만 깔면 공중에 판자만
 * 잔뜩 떠 있는 것처럼 보인다.
 *
 *   2개 이상 지면 윗면 (0~3번, 74px) — **높은 데 있는 땅.** 윗면 아래로 속(4번)이 채워진다
 *   그 밖    연석·계단 (7번, 40px) — 낮은 턱
 *   마지막   얇은 발판 (6번, 18px) — 연석조차 못 놓을 만큼 아래가 가까운 자리
 *
 * **자리가 허락하는 한 두껍게 깐다.** 예전에는 셋이 모여야 땅이었는데, 그러면 지도의
 * 대부분이 공중에 뜬 18px 판자가 되어 지형으로 읽히지 않았다 (플레이 리뷰 3차 6).
 *
 * 이어진 것은 **하나로 합친다.** 나란한 세 덩어리보다 이어진 한 덩어리가 땅처럼 보인다.
 * 두께는 바로 아래 발판을 덮지 않는 선까지만 준다. 땅으로 깔 만큼 자리가 없으면
 * 연석으로 낮춰 쓴다 — 아래를 가리는 것보다 낫다.
 */
function thicken(out) {
  const rows = new Map();
  out.ledges.forEach((l) => {
    const key = Math.round(l.y / 12);
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(l);
  });

  const merged = [];
  rows.forEach((row) => {
    row.sort((a, b) => a.x - b.x);
    let run = [row[0]];
    const flush = () => {
      const first = run[0];
      const last = run[run.length - 1];
      merged.push({
        x: first.x,
        y: Math.round(run.reduce((n, p) => n + p.y, 0) / run.length),
        w: last.x + last.w - first.x,
        count: run.length,
      });
    };
    for (let i = 1; i < row.length; i += 1) {
      const prev = run[run.length - 1];
      const gap = row[i].x - (prev.x + prev.w);
      if (gap <= MERGE_GAP) run.push(row[i]);
      else {
        flush();
        run = [row[i]];
      }
    }
    flush();
  });

  // **바닥도 "아래에 있는 발판"이다.**
  // 이걸 빼먹으면 바닥 바로 위 120px 자리에 120px 두께 솔리드가 앉아, 밑면이 바닥에
  // 닿은 채 윗면은 점프(96)로 못 닿는 **넘을 수도 뚫을 수도 없는 벽**이 된다
  const below = [...out.ground.map((g) => ({ x: g.x, y: g.y, w: g.w })), ...merged];

  out.ledges = merged.map((m) => {
    // 바로 아래 발판까지의 여유
    let clearance = 9999;
    below.forEach((o) => {
      if (o === m || o.y <= m.y + 8) return;
      if (o.x > m.x + m.w || o.x + o.w < m.x) return;
      clearance = Math.min(clearance, o.y - m.y);
    });

    // 위에서만 밟히는 것(판자·연석)은 뚫고 지날 수 있으므로 **아래를 가리지만 않으면**
    // 된다. 사방이 막히는 땅은 그 아래에 **설 자리와 뛸 자리**까지 비워 둬야 한다
    const skin = clearance - 14;
    const solid = clearance - TERRAIN.headroom;

    // 얇은 판자가 공중에 잔뜩 떠 있으면 지형으로 안 읽힌다 (플레이 리뷰 3차 6).
    // 자리가 허락하는 한 **땅으로, 안 되면 연석으로** 깐다. 판자는 마지막 수단이다
    const land = (m.count >= 2 || m.w >= 300) && solid >= 68;
    const curb = !land && skin >= 34;

    if (land) {
      // 자리마다 다른 윗면 타일 — 같은 무늬가 이어지면 붙여 놓은 티가 난다
      const pick = TOP_VARIANTS[Math.abs(Math.round(m.x / 137) + Math.round(m.y / 71)) % 4];
      return { x: m.x, y: m.y, w: m.w, h: Math.min(solid, 120), frame: pick };
    }
    // 연석은 위에서만 밟히는 두께(oneWayMaxH) 안에 머물러야 한다
    if (curb) return { x: m.x, y: m.y, w: m.w, h: Math.min(skin, 40), frame: TILE.WALL };
    return { x: m.x, y: m.y, w: m.w, h: 18, frame: TILE.LEDGE };
  });
}

/* ------------------------------------------------------------------ 소품 */

/**
 * 지형 위에 놓을 소품 목록.
 *
 * 칸 번호는 네 스테이지가 같은 자리에 같은 역할을 둔다 (AssetManifest.PROP).
 * 큰 것은 드물게, 작은 것은 자주 나오도록 무게를 준다.
 */
const PROP_KIT = [
  { frame: PROP.A, height: 210, weight: 3 },
  { frame: PROP.B, height: 230, weight: 2 },
  { frame: PROP.C, height: 120, weight: 3 },
  { frame: PROP.D, height: 80, weight: 4 },
  { frame: PROP.E, height: 90, weight: 4 },
  { frame: PROP.F, height: 95, weight: 4 },
  { frame: PROP.G, height: 100, weight: 3 },
  { frame: PROP.H, height: 190, weight: 2 },
  { frame: PROP.I, height: 110, weight: 3 },
  { frame: PROP.J, height: 110, weight: 3 },
  { frame: PROP.TREE, height: 250, weight: 1 },
];

const KIT_TOTAL = PROP_KIT.reduce((n, p) => n + p.weight, 0);

/** 좁은 자리에는 이보다 낮은 것만 세운다 — 큰 것은 길을 가린다 */
const SMALL_PROP = 120;

/** 무게를 반영해 소품 하나를 뽑는다. maxHeight 를 주면 그보다 낮은 것 중에서 고른다 */
function pickProp(rand, maxHeight) {
  const kit = maxHeight ? PROP_KIT.filter((p) => p.height <= maxHeight) : PROP_KIT;
  const total = maxHeight ? kit.reduce((n, p) => n + p.weight, 0) : KIT_TOTAL;
  let t = rand() * total;
  for (let i = 0; i < kit.length; i += 1) {
    t -= kit[i].weight;
    if (t <= 0) return kit[i];
  }
  return kit[kit.length - 1];
}

/**
 * 지형 위에 소품을 세우고 하늘에 나는 것을 띄운다.
 *
 * 지형만 깔면 회색 판자밖에 없어서 어디가 어딘지 읽히지 않는다. 그런데 아무 데나
 * 놓으면 길을 막으므로, **딛고 설 만큼 넓은 자리**(바닥과 두껍게 깔린 땅)에만 놓는다.
 * 얇은 판자 위에는 놓지 않는다 — 거기는 지나가는 길이다.
 */
function decorate(out, rand, seed, area) {
  const props = [];
  if (!seed.props) return props;

  const spots = [
    ...out.ground.map((g) => ({ x: g.x, y: g.y, w: g.w, floor: true })),
    // 두껍게 깔린 땅과 연석. **위로 올라가는 지도는 바닥을 떠나는 순간 아무것도
    // 없어진다** (플레이 리뷰 3차 3). 좁은 자리도 쓰되 낮은 것만 세운다
    ...out.ledges.filter((l) => (l.h ?? 18) >= 34 && l.w >= 220),
  ];

  spots.forEach((spot) => {
    const narrow = !spot.floor && spot.w < 380;
    const count = clamp(round(spot.w / (narrow ? 300 : 420)), spot.floor ? 1 : 0, 6);
    for (let i = 0; i < count; i += 1) {
      const kit = pickProp(rand, narrow ? SMALL_PROP : null);
      // 칸을 나눠 그 안에서 흔든다. 가운데가 비어야 지나다닐 길이 남는다
      const t = (i + 0.2 + rand() * 0.6) / count;
      props.push({
        x: round(spot.x + spot.w * t),
        y: round(spot.y),
        atlas: seed.props,
        frame: kit.frame,
        height: kit.height,
        depth: 6 + (rand() < 0.5 ? 0 : 1),
      });
    }
  });

  // 하늘을 나는 것.
  // drift 가 있으면 placeProp 이 지면에 앉히지 않고 그대로 둔다
  if (seed.actors) {
    // **지나가는 길 바로 위**에 띄운다. 지도 꼭대기에 몰아 두면 위로 한참 올라가는
    // 지도에서는 전부 화면 밖이라 한 마리도 못 보고 지나간다 (플레이 리뷰 3차 2·3).
    // 그래서 x 로만 나누지 않고 **발판을 골라** 그 위에 띄운다 — 세로로 긴 지도에는
    // 위쪽에도 걸린다. 마릿수도 가로·세로를 합친 길이로 잰다
    const pads = allPads(out).sort((a, b) => a.x - b.x);
    const reach = area.x1 - area.x0 + Math.max(0, area.base - area.top);
    const flyers = clamp(round(reach / 1100), 3, 18);
    for (let i = 0; i < flyers; i += 1) {
      const lo = Math.floor((pads.length * i) / flyers);
      const hi = Math.max(lo + 1, Math.floor((pads.length * (i + 1)) / flyers));
      const bucket = pads.slice(lo, hi);
      const pad = bucket[Math.floor(rand() * bucket.length)] || pads[0];
      if (!pad) break;
      props.push({
        x: round(pad.x + pad.w / 2),
        y: round(pad.y - 170 - rand() * 240),
        atlas: seed.actors,
        frame: ACTOR.FLYER,
        height: 44,
        depth: 7,
        drift: round(180 + rand() * 220),
        driftDuration: round(7000 + rand() * 4000),
        bob: 14,
      });
    }
  }

  return props;
}


/* ------------------------------------------------------------------ 위험 */

/**
 * 테마마다 놓을 수 있는 위험과 밀도.
 *
 * **확정 배치를 쓰는 순간 손으로 찍어 둔 위험은 전부 버려진다** — 지형이 통째로
 * 바뀌었으니 예전 좌표는 뜻이 없기 때문이다. 그렇다고 비워 두면 걸어가기만 하면
 * 끝나는 산책로가 된다 (플레이 리뷰 3차 1). 그래서 위험도 지형처럼 **생성기가**
 * 놓는다.
 *
 * 밀도는 손으로 짠 스테이지에서 쓰던 값 그대로다 — 도시 0.9, 해안 1.1, 산 1.5.
 * 들판(4)에는 위험을 두지 않는다. 함께 살던 곳이라 아무 일도 일어나지 않는다.
 */
const HAZARD_KIT = {
  city: { per1000: 0.9, kinds: ['steam', 'rock', 'car'] },
  coast: { per1000: 1.1, kinds: ['wave', 'car', 'rock'] },
  mountain: { per1000: 1.5, kinds: ['rock', 'boar'] },
  field: { per1000: 0, kinds: [] },
};

/** 출발 · 도착 · 세이브 · 기억 조각에서 이만큼은 떼어 놓는다 */
const HAZARD_CLEAR = 460;

/** 위험끼리도 이만큼은 벌린다 — 하나씩 보고 판단할 시간이 있어야 한다 */
const HAZARD_GAP = 520;

/** 자리 후보를 발판 위 몇 px 마다 잡을지 */
const HAZARD_STEP = 560;

/** 낙석이 떨어져 내릴 자리가 비어 있는가 (머리 위가 막혀 있으면 지형 속에서 나온다) */
function openSky(pads, pad, x) {
  return !pads.some((p) => p !== pad && p.x <= x && x <= p.x + p.w && p.y < pad.y && pad.y - p.y < 380);
}

/** 이 자리에 놓을 수 있는 위험인가 */
function hazardFits(kind, slot, pads, baseY) {
  const pad = slot.pad;
  if (kind === 'car') return pad.floor && pad.w >= 1000;
  // 파도는 바다가 있는 **가장 낮은 바닥**에만 밀려온다
  if (kind === 'wave') return pad.floor && pad.y >= baseY - 8;
  if (kind === 'boar') return pad.w >= 420;
  if (kind === 'rock') return openSky(pads, pad, slot.x);
  return true;
}

/** 위험 하나를 그 자리 좌표로 만든다 */
function makeHazard(kind, slot, rand) {
  const { x, pad } = slot;
  const delay = round(rand() * 2600);

  if (kind === 'car') {
    const dir = rand() < 0.5 ? -1 : 1;
    const fromX = round(dir < 0 ? pad.x + pad.w + 140 : pad.x - 140);
    const toX = round(dir < 0 ? pad.x - 140 : pad.x + pad.w + 140);
    return {
      type: 'car',
      x: fromX,
      y: pad.y - 34,
      fromX,
      toX,
      dir,
      speed: round(240 + rand() * 110),
      interval: round(3800 + rand() * 2400),
      delay,
    };
  }

  if (kind === 'rock') {
    return {
      type: 'rock',
      x,
      y: round(pad.y - 340),
      groundY: pad.y - 10,
      interval: round(2400 + rand() * 1200),
      delay,
    };
  }

  if (kind === 'boar') {
    return {
      type: 'boar',
      x,
      y: pad.y - 20,
      range: round(380 + rand() * 140),
      speed: round(380 + rand() * 90),
      delay,
    };
  }

  if (kind === 'wave') {
    return {
      type: 'wave',
      x: x + 280,
      y: pad.y + 120,
      reachX: x - 60,
      interval: round(3400 + rand() * 1600),
      delay,
      effect: 'push',
    };
  }

  return {
    type: 'steam',
    x,
    y: pad.y,
    interval: round(2400 + rand() * 1000),
    warnTime: 700,
    activeTime: round(1200 + rand() * 400),
    power: -430,
  };
}

/**
 * 지형 위에 위험을 놓는다.
 *
 * 놓을 자리는 소품과 같은 기준이다 — **딛고 설 만큼 넓은 자리**만 쓴다. 지나가는 길인
 * 얇은 판자 위에 두면 피할 자리가 없어 외워서 뚫는 수밖에 없다.
 *
 * 출발·도착·세이브·기억 조각 둘레는 비워 둔다. 되살아나자마자 죽거나, 주우러 간
 * 자리에서 죽으면 그건 어려운 게 아니라 억울한 것이다.
 *
 * @param safe 비워 둘 자리들 {x, y}
 */
function hazardize(out, rand, seed, safe, area) {
  const theme = seed.actors ? String(seed.actors).replace('actors_', '') : null;
  const kit = HAZARD_KIT[theme];
  if (!kit || !kit.per1000) return [];

  const pads = [
    ...out.ground.map((g) => ({ ...g, floor: true })),
    ...out.ledges.filter((l) => (l.h ?? 18) >= 40 && l.w >= 380).map((l) => ({ ...l, floor: false })),
  ];
  if (!pads.length) return [];
  const baseY = Math.max(...out.ground.map((g) => g.y));

  // 넓은 발판을 일정 간격으로 쪼개 자리 후보를 만든다
  const slots = [];
  pads.forEach((pad) => {
    const count = Math.floor(pad.w / HAZARD_STEP);
    for (let i = 0; i < count; i += 1) {
      const x = round(pad.x + (pad.w * (i + 0.5)) / count);
      if (safe.some((s) => Math.abs(s.x - x) < HAZARD_CLEAR && Math.abs(s.y - pad.y) < 260)) continue;
      slots.push({ x, pad, roll: rand() });
    }
  });

  // 씨앗 난수로 섞어 앞에서부터 쓴다 — 같은 씨앗이면 언제나 같은 자리다
  slots.sort((a, b) => a.roll - b.roll);

  const budget = clamp(round(((area.x1 - area.x0) / 1000) * kit.per1000), 0, 40);
  const hazards = [];
  const taken = [];

  slots.forEach((slot) => {
    if (hazards.length >= budget) return;
    if (taken.some((t) => Math.abs(t.x - slot.x) < HAZARD_GAP && Math.abs(t.y - slot.pad.y) < 220)) return;

    const kinds = kit.kinds.filter((k) => hazardFits(k, slot, pads, baseY));
    if (!kinds.length) return;

    hazards.push(makeHazard(kinds[Math.floor(rand() * kinds.length) % kinds.length], slot, rand));
    taken.push({ x: slot.x, y: slot.pad.y });
  });

  return hazards;
}
/* --------------------------------------------------------------- 길찾기 노드 */

/**
 * 길찾기 노드를 몇 px 마다 놓을지.
 *
 * 발판 하나에 노드 하나를 놓으면, 폭 2000px 짜리 바닥은 **가운데 한 점**만 길이 된다.
 * 그 위 어디에 서 있든 냄새는 늘 바닥 한가운데를 가리키므로 길잡이 노릇을 못 한다
 * (플레이 리뷰 2차 8). 발판을 일정 간격으로 쪼개 그 칸마다 노드를 놓는다.
 *
 * 간격은 한 번에 뛸 거리(REACH.hop 190)보다 짧아야 한다. 그래야 같은 발판 위의
 * 이웃 칸끼리 `linked()` 로 이어져 한 줄기 길이 된다.
 */
export const PATH_STEP = 150;

/** 발판들을 일정 간격으로 쪼갠 길찾기 노드 */
export function pathNodes(pads) {
  const nodes = [];
  pads.forEach((p) => {
    const parts = Math.max(1, Math.round(p.w / PATH_STEP));
    const w = p.w / parts;
    for (let i = 0; i < parts; i += 1) {
      const x = p.x + w * i;
      // 두께도 같이 들고 간다 — 중간 세이브는 두꺼운 자리에만 놓기 때문이다
      nodes.push({ x, y: p.y, w, cx: x + w / 2, h: p.h ?? 18 });
    }
  });
  return nodes;
}

/**
 * 노드마다 오갈 수 있는 이웃 목록.
 *
 * 이어짐의 규칙은 발판일 때와 **같은 함수**(`linked`)를 쓴다. 생성기가 "오갈 수 있다"고
 * 보고 이은 길이 곧 여기서 찾는 길이어야 하기 때문이다.
 */
export function pathLinks(nodes) {
  const adj = nodes.map(() => []);
  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      if (!linked(nodes[i], nodes[j])) continue;
      adj[i].push(j);
      adj[j].push(i);
    }
  }
  return adj;
}

/** 그 자리에 가장 가까운 노드 번호. 없으면 -1 */
export function nearestNode(nodes, x, y) {
  let best = -1;
  let bestD = Infinity;
  nodes.forEach((p, i) => {
    // 칸 폭 안이면 가로 거리는 0 이다 — 위에 서 있는 칸이 먼저 잡힌다
    const dx = Math.max(0, Math.max(p.x - x, x - (p.x + p.w)));
    const d = dx * dx + (p.y - y) * (p.y - y);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  });
  return best;
}

/** from 에서 to 까지의 최단 경로 (노드 번호 목록). 못 닿으면 빈 배열 */
export function pathRoute(adj, from, to) {
  if (from < 0 || to < 0) return [];

  const prev = new Array(adj.length).fill(-1);
  const seen = new Array(adj.length).fill(false);
  const queue = [from];
  seen[from] = true;

  for (let head = 0; head < queue.length; head += 1) {
    const cur = queue[head];
    if (cur === to) break;
    adj[cur].forEach((j) => {
      if (seen[j]) return;
      seen[j] = true;
      prev[j] = cur;
      queue.push(j);
    });
  }
  if (!seen[to]) return [];

  const route = [];
  for (let at = to; at >= 0; at = prev[at]) route.unshift(at);
  return route;
}

/** 노드 경로를 따라 걸어간 거리를 하나씩 쌓은 목록 */
function walkedLengths(pts) {
  const acc = [0];
  for (let i = 1; i < pts.length; i += 1) {
    acc.push(acc[i - 1] + Math.hypot(pts[i].cx - pts[i - 1].cx, pts[i].y - pts[i - 1].y));
  }
  return acc;
}

/* --------------------------------------------------------------- 중간 세이브 */

/** 출발에서 도착까지의 최단 경로에서 중간 세이브를 놓을 지점 */
const MID_SAVE_AT = [1 / 3, 2 / 3];

/** 이미 찍어 둔 세이브와 이만큼 안이면 겹치는 것으로 보고 놓지 않는다 */
const SAVE_MIN_GAP = 700;

/** 세이브를 놓아도 되는 두께 — 얇은 판자 위는 안 된다 */
const SAVE_MIN_H = 40;

/**
 * 그 지점에서 가장 가까운 **두꺼운 자리**를 경로에서 찾는다.
 *
 * 쉬는 자리는 발밑이 든든해야 한다. 공중에 뜬 18px 판자 위에 놀이터를 놓으면
 * 소품이 허공에 걸린 것처럼 보이고, 되살아나자마자 떨어지기도 한다
 * (플레이 리뷰 3차 4). 앞뒤로 훑어 먼저 걸리는 두꺼운 칸을 쓴다.
 */
function thickNear(route, at) {
  if (at < 0) return null;
  for (let d = 0; d < route.length; d += 1) {
    const back = route[at - d];
    if (back && back.h >= SAVE_MIN_H) return back;
    const ahead = route[at + d];
    if (ahead && ahead.h >= SAVE_MIN_H) return ahead;
  }
  return route[at] || null;
}

/**
 * **최단 경로 1/3 지점마다 중간 세이브를 놓는다.**
 *
 * 스테이지가 길어질수록 찍어 둔 세이브 사이가 벌어져서, 한 번 죽으면 한참을 되돌아
 * 걸어야 한다. 사람이 어디에 찍었든 길이의 3분의 1마다 쉴 자리가 있어야 한다
 * (플레이 리뷰 2차 9). 그래서 이건 배치가 아니라 **생성기의 규칙**이다.
 *
 * 3분의 1은 **걸어가는 거리**로 잰다. 칸 수로 세면 넓은 바닥 하나가 한 칸이라
 * 뜻이 없다. 사람이 찍은 세이브 가까이면 놓지 않는다 — 둘이 겹쳐 보인다.
 */
function midSaves(out, startPad, goalPad) {
  const nodes = pathNodes(allPads(out));
  const adj = pathLinks(nodes);
  const from = nearestNode(nodes, startPad.x + startPad.w / 2, startPad.y);
  const to = nearestNode(nodes, goalPad.x + goalPad.w / 2, goalPad.y);

  const route = pathRoute(adj, from, to).map((i) => nodes[i]);
  if (route.length < 3) return;

  const acc = walkedLengths(route);
  const total = acc[acc.length - 1];
  if (!total) return;

  MID_SAVE_AT.forEach((t) => {
    const at = thickNear(route, acc.findIndex((d) => d >= total * t));
    if (!at) return;
    if (out.saves.some((s) => Math.hypot(s.x - at.cx, s.y - at.y) < SAVE_MIN_GAP)) return;
    out.saves.push({ x: round(at.cx), y: round(at.y) });
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
  const out = { ground: [], ledges: [], scent: [], keepsakes: [], saves: [], props: [], hazards: [] };

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

  // 1. 바닥을 쭉 깐다. 구멍이 있으면 그 자리가 곧 "떨어지면 죽는 자리"가 된다.
  //    한 덩어리로 깔지 않고 몇 조각으로 나눠 **윗면 타일을 바꿔 가며** 깐다.
  //    같은 무늬가 끝까지 이어지면 바닥이 그려 놓은 띠처럼 보인다
  const floorSpan = maxX - minX;
  const chunks = clamp(round(floorSpan / 700), 1, 8);
  for (let i = 0; i < chunks; i += 1) {
    const x = minX + (floorSpan * i) / chunks;
    const w = floorSpan / chunks;
    out.ground.push({
      x: round(x),
      y: round(baseY),
      w: round(w) + 1,
      h: groundH,
      frame: TOP_VARIANTS[Math.floor(rand() * 4)],
    });
  }

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
  const amount = clamp(round(((span * height) / 150000) * richness), 0, 70);
  scatter(out, rand, { x0: minX + 60, x1: maxX - 200, top: topY - 240, base: baseY }, amount);

  // 4. 전부 오갈 수 있게 잇는다
  const connected = connectAll(out, rand);

  // 5. 고리와 곁길 — 길이 하나뿐이면 복도지 지도가 아니다
  if (richness > 0) {
    loops(out, rand, clamp(round(3 * richness), 0, 8));
    spurs(out, rand, clamp(round(4 * richness), 0, 10));
    connectAll(out, rand); // 곁길이 외톨이가 되지 않도록 한 번 더 훑는다
  }

  // 6. 몇 개가 모였는지에 따라 두께를 정하고, 이어진 것은 하나로 합친다
  thicken(out);

  // 6-1. 지형이 확정된 뒤에 소품을 세운다. 두께를 알아야 넓은 자리를 고를 수 있다
  out.props = decorate(out, rand, seed, { x0: minX, x1: maxX, top: topY, base: baseY });

  // 7. 길잡이 냄새
  scentPath(
    out,
    startPad.onGround ? out.ground[0] : startPad,
    goalPad.onGround ? out.ground[0] : goalPad
  );

  // 8. 최단 경로 3분의 1마다 중간 세이브. 난수를 쓰지 않으므로 지형은 그대로다
  midSaves(out, startPad, goalPad);

  // 9. 위험. 쉴 자리가 다 정해진 뒤라야 그 둘레를 비워 둘 수 있다
  const safe = [
    { x: start.x, y: startPad.y },
    { x: goal.x, y: goalPad.y },
    ...out.saves,
    ...out.keepsakes,
  ];
  out.hazards = hazardize(out, rand, seed, safe, { x0: minX, x1: maxX });

  const pads = allPads(out);
  const { groups } = components(pads);
  const tops = pads.map((p) => p.y);
  // 두께를 정하는 규칙이 머리 공간을 보장하지만, 규칙을 고쳤을 때 바로 드러나도록 센다
  const ceilings = lowCeilings(out);
  const covered = coveredPads(out);

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
      소품: out.props.length,
      위험: out.hazards.length,
      이어짐: connected && groups.length === 1 ? '전부 오갈 수 있다' : `덩어리 ${groups.length}개로 갈라짐`,
      갈라진덩어리: groups.length,
      머리공간: ceilings.length ? `막힌 자리 ${ceilings.length}곳` : '전부 뛸 수 있다',
      막힌자리: ceilings.length,
      계단: covered.length ? `덮인 발판 ${covered.length}곳` : '전부 옆으로 비켜선다',
      덮인발판: covered.length,
    },
  };
}

/**
 * **덮인 발판**을 찾는다 — 바로 위(한 번에 뛸 만한 높이차 안)에 x 를 나눠 가진 칸이
 * 있는 자리.
 *
 * 계단은 한 칸 오를 때마다 옆으로 비켜서야 한다 (MAX_STEP_OVERLAP 주석 참고).
 * 길을 놓는 자리는 stepPad 가 그걸 보장하지만, 이미 깔린 선반 밑을 길이 지나가는
 * 것까지는 늘 피할 수 없다 — 얼마나 남았는지 세어 둔다.
 *
 * 같은 높이끼리 겹치는 것은 세지 않는다. 나란히 이어 붙어야 한 덩어리 땅이 된다.
 * 바닥도 세지 않는다 — 바닥은 끊기지 않고 쭉 깔리므로 **바닥에서 올라가는 계단의 첫
 * 칸은 반드시 바닥 위에 놓인다.** 그건 계단이지 막힌 자리가 아니다.
 */
export function coveredPads(layout) {
  const pads = allPads(layout);
  return pads
    .filter((p) => p.kind !== '지면')
    .filter((p) =>
      pads.some(
        (q) =>
          q !== p &&
          q.y < p.y &&
          p.y - q.y <= REACH.rise &&
          overlapX(q, p.x, p.w) > MAX_STEP_OVERLAP
      )
    )
    .map((p) => `${p.kind}@${p.x},${p.y}`);
}

/**
 * 낮은 천장을 찾는다 — **머리를 찧어 못 뛰는 자리.**
 *
 * 이어짐 검사는 발판의 **윗면 y 만** 본다. 그래서 사방이 막힌 땅이 아래 발판 바로
 * 위를 덮고 있어도 "닿는다"고 통과한다. 실제로는 그 발판에 선 강아지가 천장에 걸려
 * 뛰어오르지 못하므로, 갈 수 있다고 적어 놓고 갇히는 자리가 된다.
 *
 * 위에서만 밟히는 판자는 뚫고 지날 수 있으니 천장이 아니다. 두께로 가른다.
 */
export function lowCeilings(layout) {
  const pads = allPads(layout);
  const roofs = pads.filter((r) => (r.h ?? 18) > TERRAIN.oneWayMaxH);

  return pads
    .filter((p) =>
      roofs.some((r) => {
        if (r === p || r.y >= p.y) return false; // 발판보다 위에 있는 것만 천장이다
        if (r.x > p.x + p.w || r.x + r.w < p.x) return false;
        return p.y - (r.y + (r.h ?? 18)) < TERRAIN.headroom;
      })
    )
    .map((p) => `${p.kind}@${p.x},${p.y}`);
}

/**
 * 검사 — 모든 발판이 서로 오갈 수 있는가.
 *
 * 잇는 연결이 전부 "올라갈 수 있는" 연결이므로, 하나로 이어져 있으면 어느 쪽으로든
 * 지날 수 있다. 방향을 따로 볼 필요가 없다.
 *
 * 다만 이어져 있다고 지날 수 있는 것은 아니다. 머리 위가 막혀 있으면 뛸 수 없으므로
 * 낮은 천장도 같이 본다 (lowCeilings).
 */
export function checkReach(layout) {
  const pads = allPads(layout);
  if (!pads.length) return { ok: true, unreachable: [], ceilings: [], covered: [] };
  const { groups, of } = components(pads);
  const unreachable = pads.filter((_, i) => of[i] !== of[0]).map((p) => `${p.kind}@${p.x},${p.y}`);
  const ceilings = lowCeilings(layout);
  const covered = coveredPads(layout);
  return {
    ok: groups.length === 1 && !ceilings.length,
    unreachable,
    ceilings,
    covered,
    groups: groups.length,
  };
}
