/**
 * 맵 관리 툴.
 *
 * **점만 찍는다.** 출발 · 밟을 수 있는 자리 · 세이브 · 수집 요소 · 도착.
 * 순서도 방향도 없다. "생성"을 누르면 `StageBuilder` 가 그 점들에 발판을 놓고,
 * **모든 발판을 서로 오갈 수 있도록** 사이를 이어 준다.
 *
 * 마음에 들면 "확정" — `src/data/layouts/stage<N>.json` 에 저장되고 게임이 그것을 쓴다.
 */

import { STAGES } from '../../src/data/stages.js';
import { build } from '../../src/systems/StageBuilder.js';

const TOOLS = [
  { id: 'start', name: '출발', color: '#7fd6a0' },
  { id: 'pad', name: '발판', color: '#8fd0ff' },
  { id: 'save', name: '세이브', color: '#f5c86b' },
  { id: 'keep', name: '수집', color: '#c79bff' },
  { id: 'goal', name: '도착', color: '#ff9b7a' },
  { id: 'erase', name: '지우개', color: '#e8836f' },
];
const COLOR = Object.fromEntries(TOOLS.map((t) => [t.id, t.color]));

const $ = (id) => document.getElementById(id);
const canvas = $('view');
const ctx = canvas.getContext('2d');

const state = {
  stage: 1,
  tool: 'pad',
  view: { x: -60, y: -60, scale: 0.34 },
  seed: { start: null, goal: null, pads: [], saves: [], keeps: [] },
  layout: null,
  dragging: null,
};

const stageDef = () => STAGES.find((s) => s.id === state.stage);

// 콘솔에서 들여다보기 위한 통로 (관리 툴은 개발용이라 그대로 열어 둔다)
window.__editor = state;

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

/** 찍어 둔 점 전부를 한 줄로 훑는다 */
function everyPoint() {
  const out = [];
  if (state.seed.start) out.push({ p: state.seed.start, kind: 'start' });
  if (state.seed.goal) out.push({ p: state.seed.goal, kind: 'goal' });
  const lists = { pads: 'pad', saves: 'save', keeps: 'keep' };
  Object.keys(lists).forEach((list) => {
    state.seed[list].forEach((p, i) => out.push({ p, kind: lists[list], list, i }));
  });
  return out;
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
  for (let x = 0; x <= def.width + 1600; x += 500) {
    const p = toScreen(x, 0);
    ctx.beginPath();
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, h);
    ctx.stroke();
    ctx.fillText(String(x), p.x + 3, 12);
  }
  for (let y = 0; y <= 1600; y += 100) {
    const p = toScreen(0, y);
    ctx.beginPath();
    ctx.moveTo(0, p.y);
    ctx.lineTo(w, p.y);
    ctx.stroke();
    ctx.fillText(String(y), 3, p.y - 3);
  }

  if (state.layout) {
    state.layout.ground.forEach((g) => box(g.x, g.y, g.w, g.h || 90, '#3a4a3f', '#5d7a66'));
    state.layout.ledges.forEach((l) => box(l.x, l.y, l.w, 18, '#4a4460', '#7b6fa6'));
    ctx.fillStyle = '#6b6350';
    state.layout.scent.forEach((s) => {
      const p = toScreen(s.x, s.y);
      ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
    });
  }

  everyPoint().forEach((item) => {
    const names = { start: '출발', goal: '도착', save: '세이브', keep: '수집' };
    const label = names[item.kind] ? names[item.kind] + (item.i != null ? ' ' + (item.i + 1) : '') : '';
    dot(item.p.x, item.p.y, COLOR[item.kind], label);
  });
}

/* ---------------------------------------------------------------- 입력 */

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1 || e.shiftKey) {
    state.dragging = { x: e.clientX, y: e.clientY, vx: state.view.x, vy: state.view.y };
    return;
  }
  const wp = toWorld(e.offsetX, e.offsetY);
  const near = everyPoint().find(
    (a) => Math.hypot(a.p.x - wp.x, a.p.y - wp.y) < 40 / state.view.scale
  );

  if (state.tool === 'erase') {
    if (!near) return;
    if (near.kind === 'start') state.seed.start = null;
    else if (near.kind === 'goal') state.seed.goal = null;
    else state.seed[near.list].splice(near.i, 1);
  } else if (state.tool === 'start') {
    state.seed.start = wp;
  } else if (state.tool === 'goal') {
    state.seed.goal = wp;
  } else if (state.tool === 'pad') {
    state.seed.pads.push(wp);
  } else if (state.tool === 'save') {
    state.seed.saves.push(wp);
  } else if (state.tool === 'keep') {
    state.seed.keeps.push(wp);
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
    state.view.scale = Math.max(0.06, Math.min(1.6, state.view.scale * (e.deltaY > 0 ? 0.9 : 1.1)));
    const after = toWorld(e.offsetX, e.offsetY);
    state.view.x += before.x - after.x;
    state.view.y += before.y - after.y;
    draw();
  },
  { passive: false }
);

/* ---------------------------------------------------------------- 동작 */

const seedFor = (def) => ({
  stage: def.id,
  seedNumber: Number($('seedNumber').value) || 1,
  // 살 — 찍지 않은 자리에 지형을 얼마나 붙일지. 0 이면 점만 잇는다
  richness: Number($('richness').value) / 100,
  groundH: 90,
  start: state.seed.start,
  goal: state.seed.goal,
  pads: state.seed.pads,
  saves: state.seed.saves,
  keeps: state.seed.keeps,
});

function generate() {
  const def = stageDef();
  if (!state.seed.start || !state.seed.goal) {
    $('stats').textContent = '출발 지점과 도착 지점을 찍어야 한다.';
    return;
  }
  try {
    state.layout = build(seedFor(def));
  } catch (err) {
    // 생성기가 터지면 조용히 실패하지 않고 그대로 보여 준다
    $('stats').innerHTML = '<span class="bad">생성 실패: ' + err.message + '</span>';
    return;
  }
  const st = state.layout.stats;
  if (st.error) {
    $('stats').innerHTML = '<span class="bad">' + st.error + '</span>';
    return;
  }
  const broken = st['갈라진덩어리'] > 1;
  $('stats').innerHTML =
    '씨앗 <b>' + $('seedNumber').value + '</b>   길이 <b>' + st['길이'] +
    '</b>   찍은 점 <b>' + st['찍은점'] + '</b>   발판 <b>' +
    st['발판'] + '</b>   높이차 <b>' + st['높이차'] + '</b>   세이브 <b>' + st['세이브'] +
    '</b>   수집 <b>' + st['기억'] + '</b>   ' +
    '<span class="' + (broken ? 'bad' : '') + '">' + st['이어짐'] + '</span>';
  draw();
}

async function commit() {
  const def = stageDef();
  if (!state.layout) {
    generate();
    return;
  }
  const L = state.layout;
  const body = {
    stage: def.id,
    seed: seedFor(def),
    layout: {
      ground: L.ground,
      ledges: L.ledges,
      scent: L.scent,
      keepsakes: L.keepsakes,
      saves: L.saves,
      start: L.start,
      goal: { x: L.goal.x, y: L.goal.y - 90, h: 320 },
      width: L.width,
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
  state.seed = { start: null, goal: null, pads: [], saves: [], keeps: [] };

  try {
    const res = await fetch('/__stage/load?stage=' + id);
    if (res.ok) {
      const saved = await res.json();
      if (saved && saved.seed && saved.seed.start) {
        $('seedNumber').value = saved.seed.seedNumber || 1;
        if (saved.seed.richness != null) $('richness').value = String(Math.round(saved.seed.richness * 100));
        state.seed = {
          start: saved.seed.start,
          goal: saved.seed.goal,
          pads: saved.seed.pads || [],
          saves: saved.seed.saves || [],
          keeps: saved.seed.keeps || [],
        };
        generate();
        return;
      }
    }
  } catch (err) {
    /* 저장본이 없으면 아래에서 지금 배치를 되살린다 */
  }

  // 저장본이 없으면 **지금 손으로 짜 둔 배치**를 점으로 되살려서 시작점으로 준다
  const def = stageDef();
  state.seed.start = { x: def.start.x, y: def.start.y };
  state.seed.goal = { x: def.goal.x, y: def.goal.y + 90 };
  state.seed.pads = def.ground
    .map((g) => ({ x: Math.round(g.x + g.w / 2), y: g.y }))
    .concat((def.ledges || []).map((l) => ({ x: Math.round(l.x + l.w / 2), y: l.y })));

  const saves = def.savePoints && def.savePoints.length
    ? def.savePoints
    : def.savePoint
      ? [def.savePoint]
      : [];
  state.seed.saves = saves.map((p) => ({ x: p.x, y: p.y }));
  state.seed.keeps = (def.keepsakes || []).map((k) => ({ x: k.x, y: k.y }));
  draw();
}

/* ---------------------------------------------------------------- 초기화 */

TOOLS.forEach((t) => {
  const b = document.createElement('button');
  b.textContent = t.name;
  b.style.borderColor = t.color;
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
// 같은 점 배치라도 씨앗이 다르면 다른 지형이 나온다
$('reroll').onclick = () => {
  $('seedNumber').value = String(1 + Math.floor(Math.random() * 99999));
  generate();
};
$('richness').oninput = () => {
  if (state.layout) generate();
};
$('commit').onclick = commit;
$('clear').onclick = () => {
  state.seed = { start: null, goal: null, pads: [], saves: [], keeps: [] };
  state.layout = null;
  draw();
};
$('revert').onclick = async () => {
  await fetch('/__stage/delete?stage=' + state.stage, { method: 'POST' });
  await loadStage(state.stage);
  $('stats').textContent = '저장본을 지웠다. 게임은 손으로 짠 배치로 돌아간다.';
};
$('hint').textContent =
  '좌클릭 = 점 찍기 · Shift+드래그 = 화면 이동 · 휠 = 확대  |  ' +
  '순서는 없다. 점만 흩어 놓으면 전부 오갈 수 있도록 사이를 이어 준다 · ' +
  '"다시" 를 누르면 같은 점으로 다른 지형이 나온다 · "살" 은 찍지 않은 자리에 지형을 얼마나 붙일지';

window.addEventListener('resize', resize);
resize();
loadStage(1);
