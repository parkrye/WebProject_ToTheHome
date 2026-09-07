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
 * 위아래로 88px 은 띄운다. 여럿이 모인 자리는 **두껍게** 깔 것이므로, 그만한 두께가
 * 들어갈 자리를 미리 비워 두어야 아래 발판을 덮지 않는다.
 */
function tooClose(out, x, y, w) {
  return allPads(out).some((p) => {
    const dy = Math.abs(p.y - y);
    if (dy >= 88) return false;
    // **같은 줄에서 옆에 나란히 놓는 것은 막지 않는다.** 그래야 줄지어 이어진 땅이 된다.
    // 막을 것은 실제로 겹치는 경우뿐이다
    const margin = dy < 30 ? 6 : 40;
    return x < p.x + p.w + margin && p.x < x + w + margin;
  });
}

/** 계단 한 칸의 가로 폭. 한 번에 뛸 수 있는 거리 안이어야 한다 */
const STAIR_X = REACH.hop - 40;

/** 이 가로 간격 안에서 이만큼 올라가야 하면 제자리 오르기다 — 계단으로 돌려 놓는다 */
const STEEP_X = 320;
const STEEP_Y = REACH.rise * 1.5;

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

  let x = ax;
  for (let i = 1; i <= steps; i += 1) {
    x += dir * STAIR_X;
    out.ledges.push({
      x: round(x - PAD_W.link / 2),
      y: round(a.y + rise * i),
      w: PAD_W.link,
    });
    if (i % perLeg === 0) dir = -dir; // 끝에서 꺾어 되돌아온다
  }

  // 다 올라온 자리에서 목표 x 까지 같은 높이로 이어 준다
  const runSteps = Math.ceil(Math.abs(bx - x) / STAIR_X);
  for (let k = 1; k < runSteps; k += 1) {
    out.ledges.push({
      x: round(x + ((bx - x) * k) / runSteps - PAD_W.link / 2),
      y: round(b.y),
      w: PAD_W.link,
    });
  }
}

/**
 * 두 발판 사이에 길을 놓는다.
 *
 * 가로로 벌어져 있으면 균등하게 나눠 딛고 갈 자리를 만들고, 거의 제자리에서 올라가야
 * 하면 계단식으로 돌려 놓는다 (switchback 주석 참고).
 */
function ladder(a, b, out, rand) {
  const ax = a.x + a.w / 2;
  const bx = b.x + b.w / 2;
  const dx = bx - ax;
  const dy = b.y - a.y;

  if (rand && Math.abs(dx) < STEEP_X && Math.abs(dy) > STEEP_Y) {
    switchback(a, b, out, rand);
    return;
  }

  const steps = Math.max(
    Math.ceil(Math.abs(dx) / (REACH.hop - 30)),
    Math.ceil(Math.abs(dy) / (REACH.rise - 8)),
    1
  );

  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    const jitter = rand ? (rand() - 0.5) * 40 : 0;
    out.ledges.push({
      x: round(ax + dx * t + jitter - PAD_W.link / 2),
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

/* ------------------------------------------------------------------ 두께 */

/** 지면 윗면 타일 네 종류. 자리마다 다른 것을 써서 같은 무늬가 반복되지 않게 한다 */
const TOP_VARIANTS = [TILE.TOP, TILE.TOP_A, TILE.TOP_B, TILE.TOP_C];

/**
 * 몇 개가 모였는지에 따라 **어떤 타일을 쓸지** 정한다.
 *
 * 타일셋에는 쓰임이 다른 칸이 여럿 있는데, 전부 얇은 발판(6번)으로만 깔면 공중에 판자만
 * 잔뜩 떠 있는 것처럼 보인다.
 *
 *   1개      얇은 발판 (6번, 18px) — 딛고 지나가는 판자
 *   2개      연석·계단 (7번, 40px) — 낮은 턱
 *   3개 이상 지면 윗면 (0~3번, 74px) — **높은 데 있는 땅.** 윗면 아래로 속(4번)이 채워진다
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
      if (gap <= 46) run.push(row[i]);
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

    const land = (m.count >= 3 || m.w >= 430) && solid >= 68;
    const curb = !land && (m.count >= 2 || m.w >= 300) && skin >= 34;

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

/** 무게를 반영해 소품 하나를 뽑는다 */
function pickProp(rand) {
  let t = rand() * KIT_TOTAL;
  for (let i = 0; i < PROP_KIT.length; i += 1) {
    t -= PROP_KIT[i].weight;
    if (t <= 0) return PROP_KIT[i];
  }
  return PROP_KIT[PROP_KIT.length - 1];
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
    ...out.ledges.filter((l) => (l.h ?? 18) >= 40 && l.w >= 260),
  ];

  spots.forEach((spot) => {
    const count = clamp(round(spot.w / 420), spot.floor ? 1 : 0, 6);
    for (let i = 0; i < count; i += 1) {
      const kit = pickProp(rand);
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

  // 하늘을 나는 것 — 지형과 상관없이 위쪽에 띄운다.
  // drift 가 있으면 placeProp 이 지면에 앉히지 않고 그대로 둔다
  if (seed.actors) {
    const span = area.x1 - area.x0;
    const flyers = clamp(round(span / 2200), 1, 6);
    for (let i = 0; i < flyers; i += 1) {
      props.push({
        x: round(area.x0 + (span * (i + 0.5)) / flyers),
        y: round(area.top - 80 - rand() * 200),
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
  const out = { ground: [], ledges: [], scent: [], keepsakes: [], saves: [], props: [] };

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

  const pads = allPads(out);
  const { groups } = components(pads);
  const tops = pads.map((p) => p.y);
  // 두께를 정하는 규칙이 머리 공간을 보장하지만, 규칙을 고쳤을 때 바로 드러나도록 센다
  const ceilings = lowCeilings(out);

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
      이어짐: connected && groups.length === 1 ? '전부 오갈 수 있다' : `덩어리 ${groups.length}개로 갈라짐`,
      갈라진덩어리: groups.length,
      머리공간: ceilings.length ? `막힌 자리 ${ceilings.length}곳` : '전부 뛸 수 있다',
      막힌자리: ceilings.length,
    },
  };
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
  if (!pads.length) return { ok: true, unreachable: [], ceilings: [] };
  const { groups, of } = components(pads);
  const unreachable = pads.filter((_, i) => of[i] !== of[0]).map((p) => `${p.kind}@${p.x},${p.y}`);
  const ceilings = lowCeilings(layout);
  return {
    ok: groups.length === 1 && !ceilings.length,
    unreachable,
    ceilings,
    groups: groups.length,
  };
}
