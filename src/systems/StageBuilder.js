/**
 * 스테이지 절차 생성기.
 *
 * 사람이 **거쳐 갈 지점(앵커)** 만 찍어 주면 그 사이를 채워 지형을 만든다.
 * 관리 툴(`editor.html`)과 게임이 같은 함수를 쓴다 — Phaser 를 쓰지 않는 순수 함수다.
 *
 * ## 왜 앵커만 받나
 * 발판을 하나하나 놓는 건 사람이 하기에 지루하고, 점프가 닿는지 매번 계산해야 한다.
 * 반대로 전부 자동으로 만들면 "여기서 높이 올라갔다가 내려오면 좋겠다" 같은 의도를
 * 넣을 수가 없다. 그래서 **의도는 사람이, 계산은 기계가** 하도록 나눈다.
 *
 * ## 닿는 거리
 * 점프 속도 -520, 중력 1400 이므로 최고 상승 96px, 달리며 뛰면 240px 를 건넌다.
 * 생성기는 여유를 두고 상승 84px, 건너뛰기 190px 안에서만 발판을 놓는다.
 */

export const REACH = {
  rise: 84, // 한 번에 올라갈 수 있는 높이
  hop: 190, // 발판 사이 가로 간격
  drop: 260, // 내려올 때 한 번에 떨어져도 되는 높이
};

const LEDGE_W = 120;
const GROUND_BAND = 60; // 이 안이면 "바닥"으로 보고 지면을 깐다

const round = (n) => Math.round(n);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** 씨앗 하나로 같은 결과를 내는 난수 (같은 배치는 같은 지도가 나와야 한다) */
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => {
    s ^= s << 13;
    s ^= s >>> 17;
    s ^= s << 5;
    return ((s >>> 0) % 10000) / 10000;
  };
}

/**
 * 평지 구간 — 지면을 깔되 사이에 틈을 둔다.
 * 틈은 걷기 점프로 넘을 수 있는 폭(90~170)만 쓴다.
 */
function flat(a, b, out, rand, opts) {
  const span = b.x - a.x;
  if (span < 40) return;

  // 공중의 평지는 **얇은 발판**을 이어 깐다. 두꺼운 지면 덩어리를 공중에 띄우면
  // 옥상이 아니라 잘려 나온 땅덩어리처럼 보인다
  if (a.y < opts.baseY - 120) {
    const step = 150;
    for (let x = a.x; x < b.x; x += step) {
      out.ledges.push({ x: round(x), y: a.y, w: Math.min(step - 10, round(b.x - x)) });
    }
    return;
  }

  const gaps = opts.peaceful ? 0 : clamp(Math.floor(span / 620), 0, 3);
  const cuts = [];
  for (let i = 1; i <= gaps; i += 1) cuts.push(a.x + (span * i) / (gaps + 1));

  let cursor = a.x;
  cuts.forEach((cx) => {
    const gap = round(90 + rand() * 80);
    const w = round(cx - gap / 2 - cursor);
    if (w > 60) out.ground.push({ x: round(cursor), y: a.y, w });
    cursor = cx + gap / 2;
  });
  const last = round(b.x - cursor);
  if (last > 60) out.ground.push({ x: round(cursor), y: a.y, w: last });
}

/**
 * 올라가는 구간 — 지그재그 탑을 세운다.
 *
 * 발판을 왼쪽·오른쪽 번갈아 놓아서 **좌우로 오가며 위로** 올라가게 만든다.
 * 한 층씩 앞으로만 가는 계단보다 훨씬 높이 올릴 수 있고, 올려다보면 길이 보인다.
 */
function tower(a, b, out, rand) {
  const totalRise = a.y - b.y;
  const steps = Math.max(1, Math.ceil(totalRise / REACH.rise));
  const rise = totalRise / steps;

  // 탑이 차지할 가로 폭. 좁으면 답답하고 넓으면 점프가 닿지 않는다
  const bandW = clamp(Math.abs(b.x - a.x) || 300, 240, 400);
  const bandX = Math.min(a.x, b.x);
  const swing = (bandW - LEDGE_W) * 0.62;

  for (let i = 1; i <= steps; i += 1) {
    const y = round(a.y - rise * i);
    const left = i % 2 === 1;
    const x = round(bandX + (left ? 0 : swing) + (rand() - 0.5) * 20);
    const w = i === steps ? LEDGE_W + 40 : LEDGE_W;
    out.ledges.push({ x, y, w });
  }
}

/**
 * 내려오는 구간 — 떨어지는 건 공짜지만 그냥 떨어뜨리면 어디로 갈지 모른다.
 * 착지할 자리를 몇 개 놓아 길을 보여 준다.
 */
function descend(a, b, out) {
  const totalDrop = b.y - a.y;
  const steps = Math.max(1, Math.ceil(totalDrop / REACH.drop));
  for (let i = 1; i < steps; i += 1) {
    out.ledges.push({
      x: round(a.x + ((b.x - a.x) * i) / steps),
      y: round(a.y + (totalDrop * i) / steps),
      w: LEDGE_W + 20,
    });
  }
}

/**
 * 곁길 — 기억 조각으로 가는 길.
 *
 * 정규 루트에서 **위로 두 단** 빠져나갔다가 되돌아 나오게 만든다.
 * 정규 루트에 붙여 두면 지나가다 저절로 주워지므로, 일부러 어긋나게 놓는다.
 */
function sideBranch(anchor, out) {
  // 곁길은 **본 지형에 붙어 있어야** 한다. 앵커를 찍은 높이가 아니라,
  // 그 자리에서 가장 가까운 발판 위에서 뻗어 나간다
  const pads = [...out.ground, ...out.ledges];
  if (!pads.length) return { x: anchor.x, y: anchor.y };

  const from = pads
    .map((p) => ({ p, d: Math.abs(p.x + p.w / 2 - anchor.x) + Math.abs(p.y - anchor.y) * 0.4 }))
    .sort((a, b) => a.d - b.d)[0].p;

  const dir = anchor.dir === 'left' ? -1 : 1;
  const step1 = { x: round(from.x + from.w / 2 + dir * 120), y: round(from.y - 76), w: 110 };
  const step2 = { x: round(step1.x + dir * 120), y: round(step1.y - 74), w: 110 };
  out.ledges.push(step1, step2);
  return { x: round(step2.x + 55), y: round(step2.y - 52) };
}

/** 생성된 길 위에 냄새 입자를 뿌린다 — 정규 루트만 가리킨다 */
function scentAlong(route, out) {
  for (let i = 0; i < route.length - 1; i += 1) {
    const a = route[i];
    const b = route[i + 1];
    const steps = Math.max(1, Math.round(Math.hypot(b.x - a.x, b.y - a.y) / 260));
    for (let k = 0; k < steps; k += 1) {
      const t = k / steps;
      out.scent.push({
        x: round(a.x + (b.x - a.x) * t),
        y: round(a.y + (b.y - a.y) * t - 62),
      });
    }
  }
  out.scent.push({ x: route[route.length - 1].x, y: route[route.length - 1].y - 62 });
}

/**
 * 발판이 전부 이어져 있는지 확인한다.
 * 지면에서 출발해 상승 84 / 가로 190 안에서 갈 수 있는 곳을 넓혀 나간다.
 */
export function checkReach(layout, from) {
  const pads = [
    ...layout.ground.map((g) => ({ ...g, kind: '지면' })),
    ...layout.ledges.map((l) => ({ ...l, kind: '턱' })),
  ];
  if (!pads.length) return { ok: true, unreachable: [] };

  const can = (a, b) => {
    const gap = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.w, b.x + b.w));
    return gap <= REACH.hop && a.y - b.y <= REACH.rise;
  };

  // **출발 지점이 놓인 발판**에서 시작한다. 공중에 뜬 지면까지 시작점으로 치면
  // 정작 거기 못 올라가는 지도를 "이어짐"이라고 잘못 판정한다
  const seen = new Set();
  const open = [];
  const roots = from
    ? pads
        .map((p, i) => ({ p, i }))
        .filter(({ p }) => p.x - 80 <= from.x && from.x <= p.x + p.w + 80 && p.y >= from.y - 40)
        .sort((a, b) => a.p.y - b.p.y)
        .slice(0, 1)
    : pads.map((p, i) => ({ p, i })).filter(({ p }) => p.kind === '지면');
  roots.forEach(({ i }) => {
    seen.add(i);
    open.push(i);
  });
  while (open.length) {
    const cur = pads[open.pop()];
    pads.forEach((p, i) => {
      if (seen.has(i) || !can(cur, p)) return;
      seen.add(i);
      open.push(i);
    });
  }
  const unreachable = pads.filter((_, i) => !seen.has(i)).map((p) => `${p.kind}@${p.x},${p.y}`);
  return { ok: !unreachable.length, unreachable };
}

/**
 * 앵커 배치를 받아 지형을 만든다.
 *
 * @param {object} seed
 *   { stage, seedNumber, peaceful, route:[{x,y}], keepsakes:[{id,x,y,dir}], groundH }
 * @returns {object} { ground, ledges, scent, keepsakes, stats }
 */
export function build(seed) {
  const rand = rng(seed.seedNumber ?? 1);
  const groundH = seed.groundH ?? 90;
  const route0 = [...(seed.route || [])].sort((a, b) => a.x - b.x);
  const baseY = route0.length ? Math.max(...route0.map((p) => p.y)) : 470;
  const opts = { peaceful: !!seed.peaceful, baseY };

  const route = [...(seed.route || [])].sort((a, b) => a.x - b.x);
  const out = { ground: [], ledges: [], scent: [], keepsakes: [] };
  if (route.length < 2) return { ...out, stats: { error: '앵커가 두 개는 있어야 한다' } };

  for (let i = 0; i < route.length - 1; i += 1) {
    const a = route[i];
    const b = route[i + 1];
    const dy = a.y - b.y; // 양수면 올라간다

    if (Math.abs(dy) <= GROUND_BAND) {
      flat(a, { ...b, y: a.y }, out, rand, opts);
    } else {
      // 수직 구간 **아래에는 바닥을 깐다.**
      // 오르다 떨어졌을 때 죽는 게 아니라 **올라온 만큼을 잃는** 편이 낫다.
      // 죽어서 다시 시작하면 외우게 되지만, 떨어져서 다시 오르면 보고 고치게 된다
      const from = Math.min(a.x, b.x) - 80;
      const to = Math.max(a.x, b.x) + 140;
      out.ground.push({ x: round(from), y: baseY, w: round(to - from) });

      if (dy > 0) tower(a, b, out, rand);
      else descend(a, b, out);
    }

    // 구간이 끝나는 자리에는 반드시 설 곳이 있어야 한다
    const landing = { x: round(b.x - 60), y: b.y, w: 160 };
    const flatRun = Math.abs(dy) <= GROUND_BAND;
    if (flatRun && a.y >= baseY - 120) out.ground.push({ ...landing, y: a.y });
    else out.ledges.push(flatRun ? { ...landing, y: a.y } : landing);
  }

  (seed.keepsakes || []).forEach((k) => {
    const spot = sideBranch(k, out);
    out.keepsakes.push({ id: k.id, x: spot.x, y: spot.y });
  });

  scentAlong(route, out);

  // 지면에 두께를 준다
  out.ground = out.ground.map((g) => ({ ...g, h: groundH }));

  const check = checkReach(out, route[0]);
  const top = Math.min(...[...out.ground, ...out.ledges].map((p) => p.y));
  const bottom = Math.max(...[...out.ground, ...out.ledges].map((p) => p.y));

  return {
    ...out,
    stats: {
      길이: Math.max(...route.map((p) => p.x)) + 200,
      발판: out.ground.length + out.ledges.length,
      최고높이: bottom - top,
      기억: out.keepsakes.length,
      이어짐: check.ok ? '전부 이어짐' : `끊긴 발판 ${check.unreachable.length}개`,
      끊긴것: check.unreachable,
    },
  };
}
