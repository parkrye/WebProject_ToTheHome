/**
 * 맵 관리 툴.
 *
 * 캔버스에 **앵커**만 찍으면 `StageBuilder` 가 그 사이를 채워 지형을 만든다.
 * 마음에 들면 "확정"으로 `src/data/layouts/stage<N>.json` 에 저장되고,
 * 게임은 그 파일이 있으면 손으로 짠 배치 대신 그것을 쓴다.
 *
 * 앵커 종류
 *   경로   반드시 지나야 하는 점. 높이를 크게 벌려 찍으면 지그재그 탑이 세워진다
 *   세이브 중간 저장 지점 (여러 개 가능)
 *   기억   기억 조각. 정규 루트에서 위로 두 단 빠지는 곁길이 자동으로 생긴다
 */

import { STAGES } from '../../src/data/stages.js';
import { build } from '../../src/systems/StageBuilder.js';

const TOOLS = [
  { id: 'route', name: '경로' },
  { id: 'save', name: '세이브' },
  { id: 'keep', name: '기억' },
  { id: 'erase', name: '지우개' },
];

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const ctx = canvas.getContext('2d');

const state = {
  stage: 1,
  tool: 'route',
  view: { x: -60, y: -60, scale: 0.34 },
  seed: { route: [], saves: [], keeps: [] },
  layout: null,
  dragging: null,
};

const stageDef = () => STAGES.find((s) => s.id === state.stage);

/* ---------------------------------------------------------------- 화면 */

const toWorld = (px, py) => ({
  x: Math.round((px / state.view.scale + state.view.x) / 10) * 10,
  y: Math.round((py / state.view.scale + state.view.y) / 10) * 10,
});
const toScreen = (wx, wy) => ({
  x: (wx - state.view.x) * state.view.scale,
  y: (wy - state.view.y) * state.view.scale,
});

function resize() {
  canvas.width = canvas.clientWidth * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
  ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
  draw();
}

function box(x, y, w, h, fill, stroke) {
  const p = toScreen(x, y);
  const s = state.view.scale;
  ctx.fillStyle = fill;
  ctx.fillRect(p.x, p.y, w * s, h * s);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1;
  ctx.strokeRect(p.x, p.y, w * s, h * s);
}

function dot(x, y, color, label) {
  const p = toScreen(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
  ctx.fill();
  if (!label) return;
  ctx.fillStyle = '#cdd4e2';
  ctx.font = '11px system-ui';
  ctx.fillText(label, p.x + 9, p.y + 4);
}

function draw() {
  const def = stageDef();
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  ctx.fillStyle = '#14161c';
  ctx.fillRect(0, 0, w, h);
  if (!def) return;

  ctx.strokeStyle = '#20242e';
  ctx.fillStyle = '#3d4454';
  ctx.font = '10px system-ui';
  for (let x = 0; x <= def.width + 1200; x += 500) {
    const p = toScreen(x, 0);
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, h);
    ctx.stroke();
    ctx.fillText(String(x), p.x + 3, 12);
  }
  for (let y = 0; y <= 1200; y += 100) {
    const p = toScreen(0, y);
    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(w, p.y);
    ctx.stroke();
    ctx.fillText(String(y), 3, p.y - 3);
  }

  const kill = toScreen(0, def.killY);
  ctx.strokeStyle = '#5b2b2b';
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(0, kill.y);
  ctx.lineTo(w, kill.y);
  ctx.stroke();
  ctx.setLineDash([]);

  if (state.layout) {
    state.layout.ground.forEach((g) => box(g.x, g.y, g.w, g.h || 90, '#3a4a3f', '#5d7a66'));
    state.layout.ledges.forEach((l) => box(l.x, l.y, l.w, 18, '#4a4460', '#7b6fa6'));
    ctx.fillStyle = '#6b6350';
    state.layout.scent.forEach((s) => {
      const p = toScreen(s.x, s.y);
      ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
    });
    state.layout.keepsakes.forEach((k) => dot(k.x, k.y, '#c79bff'));
  }

  state.seed.route.forEach((r, i) => {
    if (i) {
      const a = toScreen(state.seed.route[i - 1].x, state.seed.route[i - 1].y);
      const b = toScreen(r.x, r.y);
      ctx.strokeStyle = '#2f4f66';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
    const last = state.seed.route.length - 1;
    dot(r.x, r.y, '#8fd0ff', i === 0 ? '출발' : i === last ? '도착' : String(i));
  });
  state.seed.saves.forEach((s, i) => dot(s.x, s.y, '#f5c86b', '세이브 ' + (i + 1)));
  state.seed.keeps.forEach((k, i) => dot(k.x, k.y, '#c79bff', '기억 ' + (i + 1)));
}

/* ---------------------------------------------------------------- 입력 */

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1 || e.shiftKey) {
    state.dragging = { x: e.clientX, y: e.clientY, vx: state.view.x, vy: state.view.y };
    return;
  }
  const wp = toWorld(e.offsetX, e.offsetY);
  const all = [
    ...state.seed.route.map((p, i) => ({ p, list: 'route', i })),
    ...state.seed.saves.map((p, i) => ({ p, list: 'saves', i })),
    ...state.seed.keeps.map((p, i) => ({ p, list: 'keeps', i })),
  ];
  const near = all.find((a) => Math.hypot(a.p.x - wp.x, a.p.y - wp.y) < 40 / state.view.scale);

  if (state.tool === 'erase') {
    if (near) state.seed[near.list].splice(near.i, 1);
  } else if (state.tool === 'route') {
    state.seed.route.push(wp);
    state.seed.route.sort((a, b) => a.x - b.x);
  } else if (state.tool === 'save') {
    state.seed.saves.push(wp);
  } else if (state.tool === 'keep') {
    state.seed.keeps.push({ x: wp.x, y: wp.y, dir: 'right' });
  }
  draw();
});

window.addEventListener('mousemove', (e) => {
  if (!state.dragging) return;
  state.view.x = state.dragging.vx - (e.clientX - state.dragging.x) / state.view.scale;
  state.view.y = state.dragging.vy - (e.clientY - state.dragging.y) / state.view.scale;
  draw();
});
window.addEventListener('mouseup', () => {
  state.dragging = null;
});

canvas.addEventListener(
  'wheel',
  (e) => {
    e.preventDefault();
    const before = toWorld(e.offsetX, e.offsetY);
    state.view.scale = Math.max(0.08, Math.min(1.6, state.view.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    const after = toWorld(e.offsetX, e.offsetY);
    state.view.x += before.x - after.x;
    state.view.y += before.y - after.y;
    draw();
  },
  { passive: false }
);

/* ---------------------------------------------------------------- 동작 */

function seedFor(def) {
  return {
    stage: def.id,
    seedNumber: Number($('seedNumber').value) || 1,
    peaceful: !!def.peaceful,
    groundH: 90,
    route: state.seed.route,
    keepsakes: state.seed.keeps.map((k, i) => ({
      x: k.x,
      y: k.y,
      dir: k.dir,
      id: 's' + def.id + '_gen' + (i + 1),
    })),
  };
}

function generate() {
  const def = stageDef();
  if (state.seed.route.length < 2) {
    $('stats').textContent = '경로 앵커를 두 개 이상 찍어야 한다.';
    return;
  }
  state.layout = build(seedFor(def));
  const st = state.layout.stats;
  const broken = st['끊긴것'] || [];
  $('stats').innerHTML =
    '길이 <b>' + st['길이'] + '</b>   발판 <b>' + st['발판'] + '</b>   높이차 <b>' +
    st['최고높이'] + '</b>   기억 <b>' + st['기억'] + '</b>   ' +
    '<span class="' + (broken.length ? 'bad' : '') + '">' + st['이어짐'] + '</span>' +
    (broken.length ? '\n끊긴 곳: ' + broken.join(', ') : '');
  draw();
}

async function commit() {
  const def = stageDef();
  if (!state.layout) {
    generate();
    return;
  }
  const last = state.seed.route[state.seed.route.length - 1];
  const body = {
    stage: def.id,
    seed: Object.assign(seedFor(def), { saves: state.seed.saves }),
    layout: {
      ground: state.layout.ground,
      ledges: state.layout.ledges,
      scent: state.layout.scent,
      keepsakes: state.layout.keepsakes,
      start: state.seed.route[0],
      goal: { x: last.x, y: last.y - 90, h: 320 },
      saves: state.seed.saves,
      width: state.layout.stats['길이'],
    },
  };
  const res = await fetch('/__stage/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  $('stats').textContent = res.ok
    ? '확정했다 → src/data/layouts/stage' + def.id + '.json (게임을 새로고침하면 반영된다)'
    : '저장 실패';
}

async function loadStage(id) {
  state.stage = id;
  state.layout = null;
  state.seed = { route: [], saves: [], keeps: [] };

  try {
    const res = await fetch('/__stage/load?stage=' + id);
    if (res.ok) {
      const saved = await res.json();
      if (saved && saved.seed) {
        state.seed.route = saved.seed.route || [];
        state.seed.keeps = (saved.seed.keepsakes || []).map((k) => ({
          x: k.x,
          y: k.y,
          dir: k.dir || 'right',
        }));
        state.seed.saves = saved.seed.saves || [];
        $('seedNumber').value = saved.seed.seedNumber || 7;
        generate();
        return;
      }
    }
  } catch (err) {
    /* 저장본이 없으면 아래에서 지금 배치를 되살린다 */
  }

  // 저장본이 없으면 **지금 손으로 짜 둔 배치**를 앵커로 되살려서 시작점으로 준다
  const def = stageDef();
  state.seed.route = [{ x: def.start.x, y: def.start.y }]
    .concat(def.ground.map((g) => ({ x: Math.round(g.x + g.w / 2), y: g.y })))
    .concat([{ x: def.goal.x, y: def.goal.y + 90 }])
    .sort((a, b) => a.x - b.x);
  state.seed.saves = def.savePoint ? [{ x: def.savePoint.x, y: def.savePoint.y }] : [];
  state.seed.keeps = (def.keepsakes || []).map((k) => ({ x: k.x, y: k.y + 60, dir: 'right' }));
  draw();
}

/* ---------------------------------------------------------------- 초기화 */

TOOLS.forEach((t) => {
  const b = document.createElement('button');
  b.textContent = t.name;
  b.onclick = () => {
    state.tool = t.id;
    Array.from($('tools').children).forEach((c) => c.classList.remove('on'));
    b.classList.add('on');
  };
  if (t.id === state.tool) b.classList.add('on');
  $('tools').append(b);
});

STAGES.forEach((s) => {
  const o = document.createElement('option');
  o.value = String(s.id);
  o.textContent = s.id + ' ' + s.theme;
  $('stage').append(o);
});

$('stage').onchange = (e) => loadStage(Number(e.target.value));
$('gen').onclick = generate;
$('commit').onclick = commit;
$('clear').onclick = () => {
  state.seed = { route: [], saves: [], keeps: [] };
  state.layout = null;
  draw();
};
$('revert').onclick = async () => {
  await fetch('/__stage/delete?stage=' + state.stage, { method: 'POST' });
  await loadStage(state.stage);
  $('stats').textContent = '저장본을 지웠다. 게임은 손으로 짠 배치로 돌아간다.';
};
$('hint').textContent =
  '좌클릭 = 앵커 찍기 · Shift+드래그 = 화면 이동 · 휠 = 확대  |  ' +
  '경로 앵커의 높이를 크게 벌려 찍으면 지그재그 탑이 세워진다';

window.addEventListener('resize', resize);
resize();
loadStage(1);
