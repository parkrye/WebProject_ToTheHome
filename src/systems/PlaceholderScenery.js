/**
 * 절차적 플레이스홀더 아트 — 배경 · 지형 타일 · 소품 · GUI
 *
 * PlaceholderArt.js 와 같은 원칙: 실제 파일이 있으면 이쪽은 쓰이지 않는다.
 */

import { PALETTE, STAGE_THEME } from '../config.js';
import { createImage } from './PlaceholderArt.js';

const TAU = Math.PI * 2;
const BG_W = 1920;
const BG_H = 540;

function hex(color) {
  return '#' + color.toString(16).padStart(6, '0');
}

function rnd(seed) {
  const x = Math.sin(seed * 127.1) * 43758.5453;
  return x - Math.floor(x);
}

function ellipse(ctx, x, y, rx, ry, fill, rot = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rot, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, w, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = w;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();
}

/* ------------------------------------------------------------------ */
/* 배경                                                                */
/* ------------------------------------------------------------------ */

function drawSky(ctx, theme, w, h) {
  const [top, bottom] = theme.sky;
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, hex(top));
  g.addColorStop(1, hex(bottom));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);

  // 해 또는 달
  const isNight = theme.sky[0] < 0x404040;
  ctx.save();
  ctx.globalAlpha = isNight ? 0.9 : 0.55;
  ellipse(ctx, w * 0.72, h * 0.28, isNight ? 26 : 44, isNight ? 26 : 44, isNight ? '#e8ecf5' : '#fff3d0');
  ctx.globalAlpha = 0.18;
  ellipse(ctx, w * 0.72, h * 0.28, isNight ? 60 : 110, isNight ? 60 : 110, isNight ? '#c9d4ea' : '#ffe6a8');
  ctx.restore();

  if (isNight) {
    for (let i = 0; i < 160; i++) {
      const x = rnd(i) * w;
      const y = rnd(i + 99) * h * 0.7;
      ctx.globalAlpha = 0.3 + rnd(i + 7) * 0.6;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 2, 2);
    }
    ctx.globalAlpha = 1;
    return;
  }

  // 구름
  ctx.save();
  ctx.globalAlpha = 0.5;
  for (let i = 0; i < 7; i++) {
    const cx = rnd(i * 3) * w;
    const cy = 50 + rnd(i * 5) * 170;
    const s = 0.6 + rnd(i * 7) * 0.9;
    for (let k = 0; k < 4; k++) {
      ellipse(ctx, cx + k * 42 * s, cy + Math.sin(k) * 10 * s, 48 * s, 24 * s, '#ffffff');
    }
  }
  ctx.restore();
}

function drawFarLayer(ctx, theme, kind, w, h) {
  const color = hex(theme.far);
  const baseY = h * 0.72;

  if (kind === 'city') {
    ctx.fillStyle = color;
    for (let x = 0; x < w; ) {
      const bw = 60 + rnd(x) * 90;
      const bh = 80 + rnd(x + 3) * 190;
      ctx.fillRect(x, baseY - bh, bw - 6, bh + 60);
      // 창문
      ctx.fillStyle = 'rgba(255,228,170,0.30)';
      for (let wy = baseY - bh + 14; wy < baseY - 20; wy += 26) {
        for (let wx = x + 10; wx < x + bw - 18; wx += 22) {
          if (rnd(wx * wy) > 0.72) ctx.fillRect(wx, wy, 8, 12);
        }
      }
      ctx.fillStyle = color;
      x += bw;
    }
    return;
  }

  if (kind === 'mountain') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, h);
    let x = 0;
    while (x < w + 200) {
      const peak = 150 + rnd(x) * 190;
      ctx.lineTo(x + 110, baseY - peak);
      ctx.lineTo(x + 240, baseY - peak * 0.35);
      x += 240;
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();
    return;
  }

  if (kind === 'coast') {
    // 바다 + 수평선 + 등대
    ctx.fillStyle = color;
    ctx.fillRect(0, baseY, w, h - baseY);
    ctx.save();
    ctx.globalAlpha = 0.35;
    for (let i = 0; i < 26; i++) {
      const y = baseY + 8 + i * 6;
      line(ctx, rnd(i) * w, y, rnd(i) * w + 70 + rnd(i + 2) * 90, y, 2, '#ffffff');
    }
    ctx.restore();
    ctx.fillStyle = '#e8e2d4';
    ctx.fillRect(w * 0.18, baseY - 96, 22, 96);
    ctx.fillStyle = '#c9564b';
    ctx.fillRect(w * 0.18, baseY - 96, 22, 18);
    return;
  }

  // field / default — 완만한 언덕
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 40) {
    ctx.lineTo(x, baseY - Math.sin(x * 0.0035) * 46 - Math.sin(x * 0.0011) * 30);
  }
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
}

function drawMidLayer(ctx, theme, kind, w, h) {
  const color = hex(theme.mid);
  const baseY = h * 0.86;

  if (kind === 'city') {
    ctx.fillStyle = color;
    for (let x = 0; x < w; ) {
      const bw = 130 + rnd(x + 11) * 110;
      const bh = 130 + rnd(x + 13) * 120;
      ctx.fillRect(x, baseY - bh, bw - 8, bh + 80);
      ctx.fillStyle = 'rgba(20,24,30,0.25)';
      for (let wy = baseY - bh + 18; wy < baseY; wy += 34) {
        for (let wx = x + 14; wx < x + bw - 26; wx += 30) ctx.fillRect(wx, wy, 16, 20);
      }
      ctx.fillStyle = color;
      x += bw;
    }
    // 전선
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let x = 0; x < w; x += 320) {
      line(ctx, x, baseY - 200, x + 160, baseY - 172, 2, '#2a2e35');
      line(ctx, x + 160, baseY - 172, x + 320, baseY - 200, 2, '#2a2e35');
    }
    ctx.restore();
    return;
  }

  if (kind === 'mountain') {
    ctx.fillStyle = color;
    for (let x = 0; x < w; x += 46) {
      const th = 120 + rnd(x + 5) * 120;
      ctx.beginPath();
      ctx.moveTo(x, baseY + 40);
      ctx.lineTo(x + 23, baseY - th);
      ctx.lineTo(x + 46, baseY + 40);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  if (kind === 'coast') {
    ctx.fillStyle = color;
    ctx.fillRect(0, baseY - 40, w, h - baseY + 60);
    ctx.fillStyle = 'rgba(120,120,120,0.45)';
    for (let x = 40; x < w; x += 190) {
      ctx.beginPath();
      ctx.moveTo(x, baseY - 40);
      ctx.lineTo(x + 30, baseY - 84);
      ctx.lineTo(x + 60, baseY - 40);
      ctx.closePath();
      ctx.fill();
    }
    return;
  }

  // field — 나무와 울타리
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, h);
  for (let x = 0; x <= w; x += 40) ctx.lineTo(x, baseY - Math.sin(x * 0.006) * 26);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();
  for (let x = 120; x < w; x += 430) {
    const ty = baseY - 30;
    ctx.fillStyle = '#7a5c3f';
    ctx.fillRect(x - 7, ty - 60, 14, 70);
    ellipse(ctx, x, ty - 88, 62, 50, hex(theme.near));
  }
}

function drawNearLayer(ctx, theme, kind, w, h) {
  const color = hex(theme.near);
  ctx.save();
  ctx.globalAlpha = 0.92;
  if (kind === 'city') {
    ctx.fillStyle = color;
    ctx.fillRect(0, h - 46, w, 46);
    for (let x = 0; x < w; x += 34) {
      ctx.fillRect(x, h - 92, 5, 50);
    }
  } else {
    for (let x = 0; x < w; x += 13) {
      const bh = 40 + rnd(x) * 46;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.quadraticCurveTo(x + 6, h - bh * 0.6, x + 10 + rnd(x + 1) * 8, h - bh);
      ctx.lineWidth = 5;
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.stroke();
    }
  }
  ctx.restore();
}

function themeKind(key) {
  if (key.includes('city') || key.includes('columbarium')) return 'city';
  if (key.includes('coast')) return 'coast';
  if (key.includes('mountain')) return 'mountain';
  return 'field';
}

function drawColumbarium(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#cfc4ae');
  g.addColorStop(1, '#8d8271');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // 유골함 벽
  for (let y = 40; y < h - 120; y += 62) {
    for (let x = 30; x < w - 30; x += 74) {
      ctx.fillStyle = '#e3dbc9';
      ctx.fillRect(x, y, 62, 50);
      ctx.strokeStyle = '#a99b83';
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, 62, 50);
      ctx.fillStyle = 'rgba(255,236,190,0.5)';
      ctx.fillRect(x + 26, y + 30, 8, 14);
    }
  }
  // 높은 창에서 들어오는 빛
  ctx.save();
  const beam = ctx.createLinearGradient(w * 0.62, 0, w * 0.42, h);
  beam.addColorStop(0, 'rgba(255,246,220,0.55)');
  beam.addColorStop(1, 'rgba(255,246,220,0)');
  ctx.fillStyle = beam;
  ctx.beginPath();
  ctx.moveTo(w * 0.58, 0);
  ctx.lineTo(w * 0.78, 0);
  ctx.lineTo(w * 0.52, h);
  ctx.lineTo(w * 0.24, h);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#6d6455';
  ctx.fillRect(0, h - 110, w, 110);
}

function drawHomeInterior(ctx, w, h) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, '#3a2f42');
  g.addColorStop(1, '#241d2c');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // 바닥
  ctx.fillStyle = '#4a3b32';
  ctx.fillRect(0, h - 120, w, 120);
  for (let x = 0; x < w; x += 64) line(ctx, x, h - 120, x - 20, h, 2, 'rgba(0,0,0,0.18)');
  // 창문 + 달빛
  ctx.fillStyle = '#54607d';
  ctx.fillRect(w * 0.62, 90, 150, 130);
  ctx.strokeStyle = '#2e2636';
  ctx.lineWidth = 6;
  ctx.strokeRect(w * 0.62, 90, 150, 130);
  line(ctx, w * 0.62 + 75, 90, w * 0.62 + 75, 220, 5, '#2e2636');
  // 문 — 왼쪽, 살짝 열려 따뜻한 빛
  ctx.fillStyle = '#3c2f28';
  ctx.fillRect(60, h - 330, 110, 210);
  const warm = ctx.createLinearGradient(170, 0, 300, 0);
  warm.addColorStop(0, 'rgba(255,214,150,0.45)');
  warm.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = warm;
  ctx.fillRect(160, h - 330, 160, 220);
  // 침대
  ctx.fillStyle = '#6b5442';
  ctx.fillRect(w - 330, h - 210, 270, 92);
  ctx.fillStyle = '#a8907c';
  ctx.fillRect(w - 330, h - 210, 270, 34);
  ctx.fillStyle = '#e8dcc6';
  ellipse(ctx, w - 290, h - 218, 42, 20, '#e8dcc6');
  // 강아지 방석
  ellipse(ctx, w - 430, h - 128, 58, 20, '#8a6f5e');
}

function drawHomeExterior(ctx, w, h) {
  const theme = STAGE_THEME.field;
  drawSky(ctx, theme, w, h);
  ctx.fillStyle = hex(theme.ground);
  ctx.fillRect(0, h - 130, w, 130);
  // 집
  const hx = w * 0.5;
  const hy = h - 130;
  ctx.fillStyle = '#efe3cd';
  ctx.fillRect(hx - 130, hy - 170, 260, 170);
  ctx.beginPath();
  ctx.moveTo(hx - 158, hy - 170);
  ctx.lineTo(hx, hy - 262);
  ctx.lineTo(hx + 158, hy - 170);
  ctx.closePath();
  ctx.fillStyle = '#b4574c';
  ctx.fill();
  ctx.fillStyle = '#6b4a35';
  ctx.fillRect(hx - 30, hy - 92, 60, 92);
  ctx.fillStyle = '#ffe6ac';
  ctx.fillRect(hx - 100, hy - 138, 52, 44);
  ctx.fillRect(hx + 48, hy - 138, 52, 44);
  // 나무
  ctx.fillStyle = '#7a5c3f';
  ctx.fillRect(hx + 210, hy - 96, 18, 96);
  ellipse(ctx, hx + 219, hy - 128, 70, 58, hex(theme.near));
  // 길
  ctx.fillStyle = '#c9b184';
  ctx.beginPath();
  ctx.moveTo(hx - 26, hy);
  ctx.lineTo(hx + 26, hy);
  ctx.lineTo(hx + 90, h);
  ctx.lineTo(hx - 90, h);
  ctx.closePath();
  ctx.fill();
}

export function buildBackground(scene, def) {
  const theme = STAGE_THEME[def.theme] || STAGE_THEME.field;
  const kind = themeKind(def.key);

  if (def.kind === 'interior') {
    const w = 960;
    const h = 540;
    createImage(scene, def.key, w, h, (ctx) => {
      if (def.key.includes('columbarium')) return drawColumbarium(ctx, w, h);
      if (def.key.includes('home_interior')) return drawHomeInterior(ctx, w, h);
      return drawHomeExterior(ctx, w, h);
    });
    return;
  }

  createImage(scene, def.key, BG_W, BG_H, (ctx, w, h) => {
    if (def.kind === 'sky') return drawSky(ctx, theme, w, h);
    if (def.kind === 'far') return drawFarLayer(ctx, theme, kind, w, h);
    if (def.kind === 'mid') return drawMidLayer(ctx, theme, kind, w, h);
    return drawNearLayer(ctx, theme, kind, w, h);
  });
}

/* ------------------------------------------------------------------ */
/* 지형 타일 (32×32, tileSprite 로 반복)                                */
/* ------------------------------------------------------------------ */

/** 지형 타일 한 칸 */
function drawTileCell(ctx, theme, index, size, seed) {
  const ground = hex(theme.ground);
  const isLedge = index === 6;
  const isWall = index === 7;
  const isFill = index === 4 || index === 5;

  if (isLedge) {
    const h = Math.round(size / 3);
    ctx.fillStyle = hex(theme.near);
    ctx.fillRect(0, 0, size, h);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.fillRect(0, 0, size, Math.max(2, h * 0.18));
    return;
  }

  ctx.fillStyle = isWall ? hex(theme.mid) : ground;
  ctx.fillRect(0, 0, size, size);

  if (!isFill && !isWall) {
    // 윗면 — 밝은 띠와 결이 있는 표면
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.fillRect(0, 0, size, Math.max(3, size * 0.12));
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(0, size - Math.max(3, size * 0.1), size, size);
  }

  for (let i = 0; i < 14; i++) {
    const r = rnd(seed + i * 7.3);
    ctx.fillStyle = i % 2 ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.07)';
    ctx.fillRect(r * (size - 6), size * 0.18 + rnd(seed + i * 3.1) * size * 0.7, 4, 4);
  }
}

/** 소품 한 칸 — 칸 바닥에 세운다 */
function drawPropCell(ctx, theme, index, size, seed) {
  const base = size - 6;
  const body = hex(theme.mid);
  const accent = hex(theme.near);

  ctx.save();
  ctx.translate(size / 2, 0);

  if (index === 10) {
    // 나무
    ctx.fillStyle = '#7a5c3f';
    ctx.fillRect(-size * 0.045, base - size * 0.42, size * 0.09, size * 0.42);
    ellipse(ctx, 0, base - size * 0.55, size * 0.3, size * 0.24, accent);
    ellipse(ctx, -size * 0.16, base - size * 0.44, size * 0.17, size * 0.13, body);
    ctx.restore();
    return;
  }

  if (index === 11) {
    // 상징물 — 집 모양으로 대신한다
    const w = size * 0.46;
    const h = size * 0.36;
    ctx.fillStyle = '#efe3cd';
    ctx.fillRect(-w / 2, base - h, w, h);
    ctx.beginPath();
    ctx.moveTo(-w / 2 - 8, base - h);
    ctx.lineTo(0, base - h - size * 0.2);
    ctx.lineTo(w / 2 + 8, base - h);
    ctx.closePath();
    ctx.fillStyle = '#b4574c';
    ctx.fill();
    ctx.fillStyle = '#ffe6ac';
    ctx.fillRect(-size * 0.06, base - h * 0.6, size * 0.12, h * 0.5);
    ctx.restore();
    return;
  }

  // 나머지는 스테이지 색을 쓴 단순 실루엣 — 높이와 폭만 칸마다 다르게
  const h = size * (0.24 + rnd(seed + index) * 0.4);
  const w = size * (0.16 + rnd(seed + index * 2.7) * 0.34);
  const round = index % 3 === 0;

  ctx.fillStyle = index % 2 ? body : accent;
  if (round) {
    ellipse(ctx, 0, base - h / 2, w / 2, h / 2, ctx.fillStyle);
  } else {
    ctx.beginPath();
    ctx.roundRect(-w / 2, base - h, w, h, Math.min(10, w * 0.2));
    ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.16)';
  ctx.fillRect(-w / 2, base - h, w, Math.max(2, h * 0.12));
  ctx.restore();
}

/**
 * 균등 격자 아틀라스를 만든다.
 * 실제 시트가 들어오면 이 함수는 호출되지 않는다.
 */
export function buildAtlas(scene, def) {
  const theme = STAGE_THEME[def.theme] || STAGE_THEME.field;
  const key = def.key;
  if (scene.textures.exists(key)) return;

  const total = def.cols * def.rows;
  const tex = scene.textures.createCanvas(key, def.w * def.cols, def.h * def.rows);
  const ctx = tex.getContext();
  const seed = key.length * 3.7;

  for (let i = 0; i < total; i++) {
    const cx = (i % def.cols) * def.w;
    const cy = Math.floor(i / def.cols) * def.h;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.beginPath();
    ctx.rect(0, 0, def.w, def.h);
    ctx.clip();
    if (def.kind === 'tile') {
      drawTileCell(ctx, theme, i, def.w, seed + i);
    } else {
      drawPropCell(ctx, theme, i, def.w, seed + i);
    }
    ctx.restore();
  }

  tex.refresh();
  // 프레임 번호로 꺼내 쓸 수 있도록 격자를 등록한다
  for (let i = 0; i < total; i++) {
    tex.add(i, 0, (i % def.cols) * def.w, Math.floor(i / def.cols) * def.h, def.w, def.h);
  }
}

/* ------------------------------------------------------------------ */
/* 소품 · GUI                                                          */
/* ------------------------------------------------------------------ */

function signBoard(ctx, w, h, pictogram) {
  ctx.fillStyle = '#6b4f34';
  ctx.fillRect(w / 2 - 6, h * 0.55, 12, h * 0.45);
  ctx.fillStyle = '#c9a878';
  ctx.beginPath();
  ctx.roundRect(6, 8, w - 12, h * 0.58, 8);
  ctx.fill();
  ctx.strokeStyle = '#8a6a45';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.save();
  ctx.translate(w / 2, 8 + (h * 0.58) / 2);
  pictogram(ctx);
  ctx.restore();
}

function keyCap(ctx, x, y, size, drawGlyph) {
  ctx.beginPath();
  ctx.roundRect(x - size / 2, y - size / 2, size, size, 5);
  ctx.fillStyle = '#f6efe0';
  ctx.fill();
  ctx.strokeStyle = '#6b5a45';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.save();
  ctx.translate(x, y);
  drawGlyph(ctx);
  ctx.restore();
}

function arrowGlyph(dir) {
  return (ctx) => {
    ctx.beginPath();
    if (dir === 'left') {
      ctx.moveTo(4, -6);
      ctx.lineTo(-5, 0);
      ctx.lineTo(4, 6);
    } else if (dir === 'right') {
      ctx.moveTo(-4, -6);
      ctx.lineTo(5, 0);
      ctx.lineTo(-4, 6);
    } else if (dir === 'up') {
      ctx.moveTo(-6, 4);
      ctx.lineTo(0, -5);
      ctx.lineTo(6, 4);
    } else {
      ctx.moveTo(-6, -4);
      ctx.lineTo(0, 5);
      ctx.lineTo(6, -4);
    }
    ctx.closePath();
    ctx.fillStyle = '#4a3c2c';
    ctx.fill();
  };
}

function dogGlyph(ctx, scale = 1) {
  ctx.save();
  ctx.scale(scale, scale);
  ctx.fillStyle = '#4a3c2c';
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 7, 0, 0, TAU);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(12, -6, 6, 6, 0, 0, TAU);
  ctx.fill();
  ctx.fillRect(-9, 5, 3, 8);
  ctx.fillRect(6, 5, 3, 8);
  ctx.beginPath();
  ctx.moveTo(-12, -2);
  ctx.lineTo(-19, -10);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#4a3c2c';
  ctx.stroke();
  ctx.restore();
}

function roundIcon(ctx, w, h, drawInner) {
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, Math.min(w, h) / 2 - 4, 0, TAU);
  ctx.fillStyle = 'rgba(253,246,231,0.92)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(138,122,99,0.9)';
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.save();
  ctx.translate(w / 2, h / 2);
  drawInner(ctx);
  ctx.restore();
}

function pawGlyph(ctx) {
  ctx.fillStyle = '#6b5a45';
  ctx.beginPath();
  ctx.ellipse(0, 8, 15, 12, 0, 0, TAU);
  ctx.fill();
  [-16, -6, 6, 16].forEach((x, i) => {
    ctx.beginPath();
    ctx.ellipse(x, -10 - (i === 1 || i === 2 ? 5 : 0), 5.5, 7, 0, 0, TAU);
    ctx.fill();
  });
}

function boneGlyph(ctx) {
  ctx.fillStyle = '#6b5a45';
  ctx.beginPath();
  ctx.roundRect(-16, -5, 32, 10, 5);
  ctx.fill();
  [-18, 18].forEach((x) => {
    ctx.beginPath();
    ctx.arc(x, -7, 7, 0, TAU);
    ctx.arc(x, 7, 7, 0, TAU);
    ctx.fill();
  });
}

function houseGlyph(ctx) {
  ctx.fillStyle = '#6b5a45';
  ctx.beginPath();
  ctx.moveTo(-20, -2);
  ctx.lineTo(0, -20);
  ctx.lineTo(20, -2);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(-15, -2, 30, 22);
  ctx.fillStyle = '#ffd98a';
  ctx.fillRect(-5, 6, 10, 14);
}

function noseGlyph(ctx) {
  ctx.fillStyle = '#6b5a45';
  ctx.beginPath();
  ctx.ellipse(0, 4, 13, 10, 0, 0, TAU);
  ctx.fill();
  ctx.fillStyle = 'rgba(253,246,231,0.9)';
  ctx.beginPath();
  ctx.ellipse(-5, 1, 3, 4, 0, 0, TAU);
  ctx.ellipse(5, 1, 3, 4, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#6b5a45';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(10, -12, 8, Math.PI, TAU * 0.75);
  ctx.stroke();
}

const IMAGE_DRAWERS = {
  signMove: (ctx, w, h) =>
    signBoard(ctx, w, h, (c) => {
      keyCap(c, -20, -12, 26, arrowGlyph('left'));
      keyCap(c, 20, -12, 26, arrowGlyph('right'));
      dogGlyph(c, 0.75);
      c.translate(0, 22);
    }),
  signJump: (ctx, w, h) =>
    signBoard(ctx, w, h, (c) => {
      c.save();
      c.setLineDash([4, 4]);
      c.strokeStyle = '#6b5a45';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(-26, 6);
      c.quadraticCurveTo(0, -26, 26, 6);
      c.stroke();
      c.restore();
      c.save();
      c.translate(0, -20);
      dogGlyph(c, 0.55);
      c.restore();
      keyCap(c, 0, 20, 26, arrowGlyph('up'));
    }),
  signRun: (ctx, w, h) =>
    signBoard(ctx, w, h, (c) => {
      c.save();
      c.translate(6, -14);
      dogGlyph(c, 0.6);
      c.restore();
      c.strokeStyle = '#6b5a45';
      c.lineWidth = 2.5;
      [-6, 0, 6].forEach((dy) => {
        c.beginPath();
        c.moveTo(-30, -14 + dy);
        c.lineTo(-16, -14 + dy);
        c.stroke();
      });
      keyCap(c, -16, 20, 26, arrowGlyph('up'));
      keyCap(c, 16, 20, 26, arrowGlyph('right'));
    }),

  sandbox: (ctx, w, h) => {
    ctx.fillStyle = '#e0cda6';
    ctx.beginPath();
    ctx.roundRect(10, h - 54, w - 20, 46, 6);
    ctx.fill();
    ctx.strokeStyle = '#8a6a45';
    ctx.lineWidth = 8;
    ctx.stroke();
    ctx.fillStyle = '#c9b184';
    for (let i = 0; i < 6; i++) ellipse(ctx, 40 + i * 30, h - 34 + (i % 2) * 6, 9, 4, '#cbb489');
    // 삽과 양동이
    ctx.fillStyle = '#d4614f';
    ctx.fillRect(w - 70, h - 78, 28, 26);
    ctx.fillStyle = '#5a86b8';
    line(ctx, 46, h - 52, 60, h - 84, 5, '#5a86b8');
    ellipse(ctx, 62, h - 88, 8, 5, '#5a86b8');
  },

  stall: (ctx, w, h) => {
    // 파라솔
    ctx.fillStyle = '#c9564b';
    ctx.beginPath();
    ctx.moveTo(w / 2, 20);
    ctx.lineTo(w - 20, 92);
    ctx.lineTo(20, 92);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f3ead9';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2, 20);
      ctx.lineTo(40 + i * 78, 92);
      ctx.lineTo(70 + i * 78, 92);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#8a7a63';
    ctx.fillRect(w / 2 - 4, 92, 8, h - 150);
    // 카트
    ctx.fillStyle = '#9aa3ad';
    ctx.beginPath();
    ctx.roundRect(46, h - 118, w - 92, 74, 8);
    ctx.fill();
    ctx.fillStyle = '#6f7a85';
    ctx.fillRect(46, h - 118, w - 92, 14);
    ellipse(ctx, 92, h - 40, 18, 18, '#3a3a42');
    ellipse(ctx, w - 92, h - 40, 18, 18, '#3a3a42');
    // 김
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 3; i++) ellipse(ctx, 120 + i * 12, h - 140 - i * 16, 14, 9, '#ffffff');
    ctx.restore();
  },

  pond: (ctx, w, h) => {
    ctx.fillStyle = '#6a6f63';
    for (let i = 0; i < 6; i++) ellipse(ctx, 20 + i * 70, h - 26 + (i % 2) * 8, 40, 22, '#6a6f63');
    ctx.fillStyle = 'rgba(111,179,201,0.85)';
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 34, w / 2 - 40, 28, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.ellipse(w / 2, h - 34, 40 + i * 34, 8 + i * 6, 0, 0, TAU);
      ctx.stroke();
    }
  },

  ball: (ctx, w, h) => {
    ellipse(ctx, w / 2, h / 2, 26, 26, '#d75a4a');
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(w / 2, h / 2, 26, 26, 0, 0, TAU);
    ctx.clip();
    ctx.fillStyle = '#f3e3c8';
    ctx.fillRect(0, h / 2 - 6, w, 12);
    ctx.restore();
    ellipse(ctx, w / 2 - 9, h / 2 - 10, 6, 4, 'rgba(255,255,255,0.55)');
  },

  ownerCar: (ctx, w, h) => {
    ctx.fillStyle = '#a8c4dd';
    ctx.beginPath();
    ctx.roundRect(10, 48, w - 20, 44, 10);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(58, 20, 118, 34, 9);
    ctx.fill();
    ctx.fillStyle = '#3c4a63';
    ctx.fillRect(68, 28, 46, 22);
    ctx.fillRect(122, 28, 46, 22);
    ellipse(ctx, 62, 96, 17, 17, '#2b2b33');
    ellipse(ctx, w - 62, 96, 17, 17, '#2b2b33');
    ellipse(ctx, 62, 96, 7, 7, '#6c6c78');
    ellipse(ctx, w - 62, 96, 7, 7, '#6c6c78');
  },

  tree: (ctx, w, h) => {
    ctx.fillStyle = '#7a5c3f';
    ctx.fillRect(w / 2 - 12, h - 110, 24, 110);
    line(ctx, w / 2, h - 88, w / 2 - 40, h - 130, 9, '#7a5c3f');
    line(ctx, w / 2, h - 100, w / 2 + 38, h - 142, 9, '#7a5c3f');
    ellipse(ctx, w / 2, h - 160, 84, 66, '#5f8f54');
    ellipse(ctx, w / 2 - 46, h - 132, 46, 36, '#6d9c5b');
    ellipse(ctx, w / 2 + 46, h - 140, 44, 34, '#6d9c5b');
  },

  lamp: (ctx, w, h) => {
    ctx.fillStyle = '#4d5763';
    ctx.fillRect(w / 2 - 6, 40, 12, h - 40);
    ctx.beginPath();
    ctx.roundRect(w / 2 - 22, 14, 44, 30, 6);
    ctx.fillStyle = '#39424d';
    ctx.fill();
    ctx.fillStyle = 'rgba(255,226,160,0.85)';
    ctx.fillRect(w / 2 - 16, 34, 32, 8);
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 16, 42);
    ctx.lineTo(w / 2 + 16, 42);
    ctx.lineTo(w / 2 + 44, h);
    ctx.lineTo(w / 2 - 44, h);
    ctx.closePath();
    ctx.fillStyle = '#ffe2a0';
    ctx.fill();
    ctx.restore();
  },

  house: (ctx, w, h) => {
    ctx.fillStyle = '#efe3cd';
    ctx.fillRect(40, h - 200, w - 80, 200);
    ctx.beginPath();
    ctx.moveTo(16, h - 200);
    ctx.lineTo(w / 2, h - 300);
    ctx.lineTo(w - 16, h - 200);
    ctx.closePath();
    ctx.fillStyle = '#b4574c';
    ctx.fill();
    ctx.fillStyle = '#6b4a35';
    ctx.fillRect(w / 2 - 34, h - 110, 68, 110);
    ctx.fillStyle = '#ffe6ac';
    ctx.fillRect(70, h - 168, 60, 50);
    ctx.fillRect(w - 130, h - 168, 60, 50);
  },

  door: (ctx, w, h) => {
    ctx.fillStyle = '#5a4030';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#3c2a1e';
    ctx.lineWidth = 6;
    ctx.strokeRect(10, 10, w - 20, h - 20);
    ellipse(ctx, w - 26, h / 2, 7, 7, '#d8b463');
  },

  bed: (ctx, w, h) => {
    ctx.fillStyle = '#6b5442';
    ctx.fillRect(0, h - 70, w, 70);
    ctx.fillStyle = '#a8907c';
    ctx.fillRect(0, h - 96, w, 30);
    ellipse(ctx, 48, h - 100, 40, 18, '#e8dcc6');
    ctx.fillStyle = '#4a3b32';
    ctx.fillRect(w - 16, h - 120, 16, 120);
  },

  nicheWall: (ctx, w, h) => {
    for (let y = 0; y < h; y += 62) {
      for (let x = 0; x < w; x += 74) {
        ctx.fillStyle = '#e3dbc9';
        ctx.fillRect(x + 4, y + 4, 62, 50);
        ctx.strokeStyle = '#a99b83';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 4, y + 4, 62, 50);
        ctx.fillStyle = 'rgba(255,236,190,0.5)';
        ctx.fillRect(x + 30, y + 34, 8, 14);
      }
    }
  },

  logo: (ctx, w, h) => {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.globalAlpha = 0.16;
    ellipse(ctx, 0, 0, 200, 100, '#ffd98a');
    ctx.globalAlpha = 1;
    // 강아지
    ctx.save();
    ctx.translate(-110, 24);
    ctx.scale(1.9, 1.9);
    dogGlyph(ctx, 1);
    ctx.restore();
    // 집
    ctx.save();
    ctx.translate(120, 4);
    ctx.scale(2.2, 2.2);
    houseGlyph(ctx);
    ctx.restore();
    // 냄새 궤적
    ctx.save();
    ctx.strokeStyle = 'rgba(255,217,138,0.9)';
    ctx.lineWidth = 3;
    ctx.setLineDash([2, 10]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-64, 10);
    ctx.quadraticCurveTo(20, -70, 80, 0);
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  },

  iconPaw: (ctx, w, h) => roundIcon(ctx, w, h, pawGlyph),
  iconBone: (ctx, w, h) => roundIcon(ctx, w, h, boneGlyph),
  iconHouse: (ctx, w, h) => roundIcon(ctx, w, h, houseGlyph),
  iconPause: (ctx, w, h) =>
    roundIcon(ctx, w, h, (c) => {
      c.fillStyle = '#6b5a45';
      c.fillRect(-11, -14, 8, 28);
      c.fillRect(3, -14, 8, 28);
    }),

  btnLeft: (ctx, w, h) => roundIcon(ctx, w, h, (c) => arrowGlyph('left')(scaleCtx(c, 2.2))),
  btnRight: (ctx, w, h) => roundIcon(ctx, w, h, (c) => arrowGlyph('right')(scaleCtx(c, 2.2))),
  btnDown: (ctx, w, h) => roundIcon(ctx, w, h, (c) => arrowGlyph('down')(scaleCtx(c, 2.2))),
  btnJump: (ctx, w, h) =>
    roundIcon(ctx, w, h, (c) => {
      c.strokeStyle = '#6b5a45';
      c.lineWidth = 6;
      c.lineCap = 'round';
      c.beginPath();
      c.moveTo(-26, 16);
      c.quadraticCurveTo(0, -30, 26, 16);
      c.stroke();
      c.beginPath();
      c.moveTo(18, 2);
      c.lineTo(26, 16);
      c.lineTo(11, 18);
      c.closePath();
      c.fillStyle = '#6b5a45';
      c.fill();
    }),
  btnInteract: (ctx, w, h) => roundIcon(ctx, w, h, noseGlyph),
  promptInteract: (ctx, w, h) => {
    ctx.beginPath();
    ctx.roundRect(6, 6, w - 12, h - 22, 14);
    ctx.fillStyle = 'rgba(253,246,231,0.95)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,200,97,0.9)';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(w / 2 - 8, h - 16);
    ctx.lineTo(w / 2, h - 4);
    ctx.lineTo(w / 2 + 8, h - 16);
    ctx.closePath();
    ctx.fillStyle = 'rgba(253,246,231,0.95)';
    ctx.fill();
    ctx.save();
    ctx.translate(w / 2, h / 2 - 6);
    ctx.scale(0.8, 0.8);
    noseGlyph(ctx);
    ctx.restore();
  },

  scentMote: (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 1, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,242,205,0.98)');
    g.addColorStop(0.35, 'rgba(255,217,138,0.6)');
    g.addColorStop(1, 'rgba(255,217,138,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },

  saveGlow: (ctx, w, h) => {
    // 바닥에 깔리는 납작한 빛 고리
    ctx.save();
    ctx.translate(w / 2, h * 0.72);
    ctx.scale(1, 0.36);
    const g = ctx.createRadialGradient(0, 0, w * 0.06, 0, 0, w * 0.46);
    g.addColorStop(0, 'rgba(255,230,170,0.85)');
    g.addColorStop(0.55, 'rgba(255,200,97,0.35)');
    g.addColorStop(1, 'rgba(255,200,97,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, w * 0.46, 0, TAU);
    ctx.fill();
    ctx.restore();
    // 위로 떠오르는 잔광
    ctx.save();
    ctx.globalAlpha = 0.4;
    for (let i = 0; i < 5; i++) {
      const p = i / 5;
      ellipse(ctx, w / 2 + Math.sin(i * 2.1) * w * 0.16, h * 0.66 - p * h * 0.5, 3.4 - p * 1.6, 3.4 - p * 1.6, '#ffe6aa');
    }
    ctx.restore();
  },

  saveBurst: (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w / 2);
    g.addColorStop(0, 'rgba(255,225,160,0.95)');
    g.addColorStop(0.45, 'rgba(255,200,97,0.45)');
    g.addColorStop(1, 'rgba(255,200,97,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },

  rotate: (ctx, w, h) => {
    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.strokeStyle = 'rgba(253,246,231,0.9)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.roundRect(-34, -58, 68, 116, 10);
    ctx.stroke();
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.roundRect(-58, -34, 116, 68, 10);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, 82, -0.7, 0.9);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(56, 56);
    ctx.lineTo(76, 46);
    ctx.lineTo(60, 34);
    ctx.closePath();
    ctx.fillStyle = 'rgba(253,246,231,0.9)';
    ctx.fill();
    ctx.restore();
  },

  credits: (ctx, w, h) => {
    const glyphs = [pawGlyph, houseGlyph, boneGlyph, noseGlyph];
    glyphs.forEach((g, i) => {
      ctx.save();
      ctx.translate(64 + i * 128, h / 2);
      ctx.scale(0.9, 0.9);
      g(ctx);
      ctx.restore();
    });
  },

  vignette: (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
    g.addColorStop(0, 'rgba(20,14,10,0)');
    g.addColorStop(1, 'rgba(20,14,10,0.55)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  },
};

/** roundIcon 내부에서 글리프를 키워 그리기 위한 헬퍼 */
function scaleCtx(ctx, s) {
  ctx.scale(s, s);
  return ctx;
}

export function buildImage(scene, def) {
  const draw = IMAGE_DRAWERS[def.placeholder];
  createImage(scene, def.key, def.w, def.h, (ctx, w, h) => {
    if (draw) return draw(ctx, w, h);
    ctx.fillStyle = 'rgba(253,246,231,0.5)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = hex(PALETTE.uiLine);
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, w - 4, h - 4);
  });
}
