/**
 * 절차적 플레이스홀더 아트 — 캐릭터 · 오브젝트 스프라이트 시트
 *
 * AI 에셋이 준비되기 전에도 게임이 "보이게" 하기 위한 임시 그래픽이다.
 * public/assets/sprites/<key>.png 가 존재하면 이 파일의 결과는 쓰이지 않는다.
 */

import { PALETTE } from '../config.js';

const TAU = Math.PI * 2;

/* ------------------------------------------------------------------ */
/* 캔버스 유틸                                                          */
/* ------------------------------------------------------------------ */

function hex(color) {
  return '#' + color.toString(16).padStart(6, '0');
}

/**
 * 8프레임(또는 n프레임) 캔버스 스프라이트 시트를 만들고 프레임을 수동 등록한다.
 * drawFn(ctx, t, index, w, h) — ctx 는 각 프레임 좌상단이 원점이 되도록 이동된 상태
 */
export function createSheet(scene, key, w, h, frames, drawFn) {
  if (scene.textures.exists(key)) return scene.textures.get(key);

  const tex = scene.textures.createCanvas(key, w * frames, h);
  const ctx = tex.getContext();
  ctx.imageSmoothingEnabled = true;

  for (let i = 0; i < frames; i++) {
    ctx.save();
    ctx.translate(i * w, 0);
    ctx.beginPath();
    ctx.rect(0, 0, w, h);
    ctx.clip();
    drawFn(ctx, i / frames, i, w, h);
    ctx.restore();
  }

  tex.refresh();
  for (let i = 0; i < frames; i++) tex.add(i, 0, i * w, 0, w, h);
  return tex;
}

/** 단일 프레임 캔버스 텍스처 */
export function createImage(scene, key, w, h, drawFn) {
  if (scene.textures.exists(key)) return scene.textures.get(key);
  const tex = scene.textures.createCanvas(key, w, h);
  const ctx = tex.getContext();
  drawFn(ctx, w, h);
  tex.refresh();
  return tex;
}

function ellipse(ctx, x, y, rx, ry, fill, rotation = 0) {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.5, rx), Math.max(0.5, ry), rotation, 0, TAU);
  ctx.fillStyle = fill;
  ctx.fill();
}

function line(ctx, x1, y1, x2, y2, width, color, cap = 'round') {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = cap;
  ctx.stroke();
}

function curve(ctx, x1, y1, cx, cy, x2, y2, width, color) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.quadraticCurveTo(cx, cy, x2, y2);
  ctx.lineWidth = width;
  ctx.strokeStyle = color;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function dot(ctx, x, y, r, color) {
  ellipse(ctx, x, y, r, r, color);
}

/* ------------------------------------------------------------------ */
/* 강아지 본체                                                          */
/* ------------------------------------------------------------------ */

/**
 * 오른쪽을 보는 강아지 한 마리.
 * y 는 네 발이 닿는 바닥선.
 */
export function drawDog(ctx, opt = {}) {
  const {
    x = 64,
    y = 104,
    s = 1,
    legPhase = 0,
    legSwing = 0,
    frontLegLift = 0,
    rearLegLift = 0,
    bodyY = 0,
    tilt = 0,
    stretch = 1,
    headX = 0,
    headY = 0,
    tailAngle = -0.7,
    earFlop = 0,
    eyeOpen = 1,
    alpha = 1,
    body = PALETTE.dogBody,
    shade = PALETTE.dogShade,
    lying = false,
  } = opt;

  const bodyCol = hex(body);
  const shadeCol = hex(shade);
  const darkCol = hex(PALETTE.dogNose);

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y + bodyY);
  ctx.rotate(tilt);
  ctx.scale(s, s);

  const bodyCy = lying ? -13 : -26;
  const rx = 27 * stretch;
  const ry = lying ? 13 : 16;

  if (!lying) {
    // 다리 — 뒤쪽 두 개를 먼저 그려 깊이감을 준다
    const swings = [
      { ox: 15, phase: 0, lift: frontLegLift },
      { ox: -15, phase: 0.5, lift: rearLegLift },
      { ox: 11, phase: 0.5, lift: frontLegLift },
      { ox: -19, phase: 0, lift: rearLegLift },
    ];
    swings.forEach((leg, idx) => {
      const back = idx < 2;
      const a = Math.sin((legPhase + leg.phase) * TAU) * legSwing;
      const len = 22 - leg.lift;
      const hipX = leg.ox;
      const hipY = bodyCy + 8;
      const footX = hipX + Math.sin(a) * len;
      const footY = hipY + Math.cos(a) * len;
      const kneeX = hipX + Math.sin(a) * len * 0.5;
      const kneeY = hipY + Math.cos(a) * len * 0.55 - 2;
      ctx.beginPath();
      ctx.moveTo(hipX, hipY);
      ctx.quadraticCurveTo(kneeX, kneeY, footX, footY);
      ctx.lineWidth = 7;
      ctx.strokeStyle = back ? shadeCol : bodyCol;
      ctx.lineCap = 'round';
      ctx.stroke();
      dot(ctx, footX, footY, 3.6, back ? shadeCol : bodyCol);
    });
  }

  // 꼬리
  curve(ctx, -rx + 3, bodyCy - 2, -rx - 14, bodyCy - 10 + Math.sin(tailAngle) * 8, -rx - 18, bodyCy - 18 + Math.sin(tailAngle) * 12, 6, bodyCol);

  // 몸통
  ellipse(ctx, 0, bodyCy, rx, ry, bodyCol);
  ellipse(ctx, -4, bodyCy + 5, rx * 0.85, ry * 0.6, shadeCol);

  // 머리
  const hx = rx * 0.78 + headX;
  const hy = bodyCy - (lying ? 4 : 16) + headY;
  ellipse(ctx, hx, hy, 14, 13, bodyCol);

  // 귀
  const flop = earFlop;
  ellipse(ctx, hx - 6, hy - 4 + flop, 5.5, 10 - flop * 0.4, shadeCol, -0.35);

  // 주둥이 + 코
  ellipse(ctx, hx + 11, hy + 4, 8, 6, bodyCol);
  dot(ctx, hx + 18, hy + 3, 2.8, darkCol);

  // 눈
  if (eyeOpen > 0.2) {
    dot(ctx, hx + 5, hy - 2, 2.2 * eyeOpen, darkCol);
  } else {
    line(ctx, hx + 2.5, hy - 2, hx + 7.5, hy - 2, 1.6, darkCol);
  }

  ctx.restore();
}

/** 흩날리는 빛 입자 */
function sparks(ctx, cx, cy, count, spread, seed, color, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  for (let i = 0; i < count; i++) {
    const a = (i / count) * TAU + seed;
    const d = spread * (0.35 + ((i * 37) % 100) / 140);
    dot(ctx, cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 1.4 + (i % 3) * 0.7, color);
  }
  ctx.restore();
}

/* ------------------------------------------------------------------ */
/* 강아지 포즈 8종                                                      */
/* ------------------------------------------------------------------ */

const dogPoses = {
  dogIdle(ctx, t, i) {
    const breath = Math.sin(t * TAU) * 1.6;
    drawDog(ctx, {
      bodyY: -breath,
      headY: -breath * 0.4,
      tailAngle: Math.sin(t * TAU) * 1.2,
      eyeOpen: i === 4 ? 0 : 1,
      legSwing: 0,
    });
  },

  dogWalk(ctx, t) {
    drawDog(ctx, {
      legPhase: t,
      legSwing: 0.5,
      bodyY: -Math.abs(Math.sin(t * TAU)) * 2.5,
      headY: Math.sin(t * TAU + 1) * 1.5,
      tailAngle: Math.sin(t * TAU * 2) * 1.4,
    });
  },

  dogRun(ctx, t) {
    const gallop = Math.sin(t * TAU);
    const airborne = Math.max(0, Math.sin(t * TAU - 0.6));
    drawDog(ctx, {
      legPhase: t,
      legSwing: 0.95,
      bodyY: -airborne * 12,
      stretch: 1 + gallop * 0.12,
      tilt: -gallop * 0.09,
      headY: -airborne * 2,
      tailAngle: 1.4,
      earFlop: -3 - airborne * 2,
    });
  },

  dogJump(ctx, t, i) {
    // 0 웅크림 / 1 도약 / 2-3 상승·정점 / 4-5 하강 / 6 착지 / 7 복귀
    const table = [
      { bodyY: 8, stretch: 0.92, tilt: 0, legSwing: 0.15, frontLegLift: 8, rearLegLift: 8 },
      { bodyY: -6, stretch: 1.1, tilt: -0.22, legSwing: 0.6, rearLegLift: -2 },
      { bodyY: -16, stretch: 1.12, tilt: -0.3, legSwing: 0.5, frontLegLift: 4 },
      { bodyY: -20, stretch: 1.0, tilt: -0.05, legSwing: 0.35, frontLegLift: 6, rearLegLift: 6 },
      { bodyY: -16, stretch: 1.02, tilt: 0.16, legSwing: 0.45, frontLegLift: 2 },
      { bodyY: -7, stretch: 1.06, tilt: 0.26, legSwing: 0.7, frontLegLift: -2 },
      { bodyY: 9, stretch: 0.9, tilt: 0.04, legSwing: 0.2, frontLegLift: 9, rearLegLift: 9 },
      { bodyY: 1, stretch: 1, tilt: 0, legSwing: 0.1 },
    ];
    drawDog(ctx, { ...table[i], tailAngle: 1.1, earFlop: -2 });
  },

  dogSniff(ctx, t, i) {
    const bob = Math.sin(t * TAU * 2) * 1.5;
    drawDog(ctx, {
      headY: 13 + bob,
      headX: 3,
      tailAngle: Math.sin(t * TAU * 2) * 1.6,
      legSwing: 0.12,
      legPhase: t,
      eyeOpen: i >= 6 ? 0.4 : 1,
    });
    if (i >= 1) {
      sparks(ctx, 96, 92 - i * 1.5, 3 + (i % 3), 7 + i, i, hex(PALETTE.scent), 0.75);
    }
  },

  dogDispel(ctx, t, i) {
    const a = Math.max(0, 1 - i / 6.5);
    ctx.save();
    if (i > 0) {
      ctx.beginPath();
      ctx.rect(0, 0, 128, 104 - i * 12);
      ctx.clip();
    }
    drawDog(ctx, { alpha: a, eyeOpen: i < 2 ? 1 : 0 });
    ctx.restore();
    sparks(ctx, 64, 78 - i * 3, 6 + i * 3, 12 + i * 6, i * 0.7, hex(PALETTE.scent), Math.min(1, 0.35 + i * 0.12));
  },

  dogDig(ctx, t, i) {
    const dig = Math.sin(t * TAU * 2);
    drawDog(ctx, {
      headY: 10 + (i === 4 ? 6 : 0),
      bodyY: 4,
      tilt: 0.16,
      frontLegLift: 6 + dig * 8,
      legSwing: 0.9,
      legPhase: t * 2,
      tailAngle: 1.3,
      eyeOpen: i === 4 ? 0 : 1,
    });
    const sand = hex(0xe4d2ae);
    for (let k = 0; k < 5; k++) {
      const p = (i + k * 1.7) % 8;
      dot(ctx, 56 - p * 5, 100 - Math.sin((p / 8) * Math.PI) * 16, 2.4, sand);
    }
    ellipse(ctx, 86, 104, 20, 4, sand);
  },

  dogSleep(ctx, t, i) {
    const breath = Math.sin(t * TAU) * 1.2;
    ctx.save();
    ctx.translate(0, 6);
    drawDog(ctx, {
      lying: true,
      y: 104,
      bodyY: -breath,
      stretch: 1.15,
      eyeOpen: 0,
      earFlop: 2,
      tailAngle: -1.4,
      headY: 4,
      headX: -2,
    });
    ctx.restore();
    // 잠 표시 — 문자 대신 커지는 원 세 개
    ctx.save();
    ctx.globalAlpha = 0.5;
    for (let k = 0; k < 3; k++) {
      const p = (i / 8 + k / 3) % 1;
      dot(ctx, 92 + p * 14, 62 - p * 24, 2 + p * 3, hex(PALETTE.ui));
    }
    ctx.restore();
  },

  dogSplash(ctx, t, i) {
    const kick = Math.sin(t * TAU * 2);
    drawDog(ctx, {
      bodyY: -Math.max(0, kick) * 6,
      frontLegLift: 4 + kick * 9,
      legSwing: 0.85,
      legPhase: t * 2,
      tailAngle: 1.5,
      headY: 2,
    });
    const water = hex(PALETTE.water);
    ctx.save();
    ctx.globalAlpha = 0.85;
    ellipse(ctx, 64, 106, 40, 6, water);
    for (let k = 0; k < 7; k++) {
      const p = ((i + k * 1.3) % 8) / 8;
      const dx = (k - 3) * 9;
      dot(ctx, 64 + dx, 104 - Math.sin(p * Math.PI) * (14 + Math.abs(dx) * 0.4), 2.6, water);
    }
    ctx.restore();
  },

  dogBall(ctx, t, i) {
    const push = i < 4 ? i / 3 : (7 - i) / 3;
    drawDog(ctx, {
      headY: 11,
      headX: 2 + push * 3,
      legPhase: t,
      legSwing: 0.25,
      tailAngle: Math.sin(t * TAU * 2) * 1.6,
      bodyY: i === 5 ? 4 : 0,
      tilt: i === 5 ? 0.2 : 0,
    });
    const ballX = 100 + push * 12;
    dot(ctx, ballX, 98, 9, hex(0xd75a4a));
    ellipse(ctx, ballX, 98, 9, 2.4, hex(0xf3e3c8));
  },
};

/* ------------------------------------------------------------------ */
/* 그 밖의 캐릭터                                                       */
/* ------------------------------------------------------------------ */

function drawPerson(ctx, opt = {}) {
  const {
    x = 64,
    y = 108,
    s = 1,
    stride = 0,
    armSwing = 0,
    bodyY = 0,
    color = PALETTE.ownerChild,
    skin = 0xe8c39e,
    silhouette = false,
    lean = 0,
  } = opt;

  const main = silhouette ? '#1b1725' : hex(color);
  const skinCol = silhouette ? '#1b1725' : hex(skin);

  ctx.save();
  ctx.translate(x, y + bodyY);
  ctx.scale(s, s);
  ctx.rotate(lean);

  // 다리
  line(ctx, 0, -30, Math.sin(stride) * 11, -2, 7, main);
  line(ctx, 0, -30, Math.sin(stride + Math.PI) * 11, -2, 7, main);
  // 몸통
  ctx.beginPath();
  ctx.roundRect(-9, -56, 18, 28, 6);
  ctx.fillStyle = main;
  ctx.fill();
  // 팔
  line(ctx, 0, -50, Math.sin(armSwing + Math.PI) * 13, -34, 5.5, main);
  line(ctx, 0, -50, Math.sin(armSwing) * 13, -34, 5.5, main);
  // 머리
  ellipse(ctx, 0, -66, 10, 11, skinCol);
  if (!silhouette) ellipse(ctx, 0, -72, 10.5, 6, hex(0x5a4433));

  ctx.restore();
}

const otherPoses = {
  puppyRun(ctx, t) {
    const airborne = Math.max(0, Math.sin(t * TAU - 0.6));
    ctx.save();
    ctx.translate(0, 14);
    drawDog(ctx, {
      s: 0.78,
      legPhase: t,
      legSwing: 1.05,
      bodyY: -airborne * 10,
      stretch: 1 + Math.sin(t * TAU) * 0.14,
      tilt: -Math.sin(t * TAU) * 0.1,
      headY: -6,
      headX: 2,
      earFlop: -4,
      tailAngle: 1.5,
    });
    ctx.restore();
  },

  childRun(ctx, t) {
    const stride = t * TAU;
    drawPerson(ctx, {
      stride,
      armSwing: stride + Math.PI,
      bodyY: -Math.abs(Math.sin(stride)) * 4,
      lean: -0.08,
      s: 0.9,
    });
  },

  ownerWalk(ctx, t, i) {
    const step = Math.min(i, 4);
    const crouch = i >= 5 ? (i - 4) * 6 : 0;
    ctx.save();
    ctx.globalAlpha = i === 7 ? 0.35 : 1;
    drawPerson(ctx, {
      x: 34 + step * 8,
      y: 118,
      s: 1.05,
      silhouette: true,
      stride: i < 5 ? i * 0.9 : 0,
      armSwing: i < 5 ? i * 0.9 + Math.PI : 0.6,
      bodyY: crouch,
      lean: i >= 5 ? 0.25 : 0,
    });
    ctx.restore();
  },

  ownerWake(ctx, t, i, w, h) {
    // 침대에서 일어나 문으로 걸어가 문을 여는 8단계
    const bedCol = hex(0x6b5442);
    ctx.fillStyle = hex(0x2c2436);
    ctx.fillRect(0, 0, w, h);
    ctx.beginPath();
    ctx.roundRect(18, 120, 110, 44, 6);
    ctx.fillStyle = bedCol;
    ctx.fill();

    const stages = [
      { x: 60, y: 130, lean: 1.4, s: 0.85 },
      { x: 60, y: 130, lean: 1.3, s: 0.85 },
      { x: 66, y: 128, lean: 0.9, s: 0.9 },
      { x: 74, y: 150, lean: 0.1, s: 0.95 },
      { x: 92, y: 156, lean: 0, s: 1 },
      { x: 132, y: 156, lean: -0.05, s: 1 },
      { x: 176, y: 156, lean: -0.05, s: 1 },
      { x: 190, y: 156, lean: 0, s: 1 },
    ];
    const st = stages[i];
    drawPerson(ctx, { ...st, color: PALETTE.ownerAdult, silhouette: true });

    // 문 — 마지막 두 프레임에서 열리며 빛이 쏟아진다
    const open = i >= 6 ? (i - 5) / 2 : 0;
    ctx.save();
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = hex(0x4a3b2c);
    ctx.fillRect(214, 60, 30, 100);
    if (open > 0) {
      const g = ctx.createLinearGradient(214, 0, 214 - 120 * open, 0);
      g.addColorStop(0, 'rgba(255,230,170,0.95)');
      g.addColorStop(1, 'rgba(255,230,170,0)');
      ctx.fillStyle = g;
      ctx.fillRect(214 - 120 * open, 55, 120 * open + 30, 110);
    }
    ctx.restore();
  },

  ownerHug(ctx, t, i, w, h) {
    ctx.fillStyle = hex(0x2c2436);
    ctx.fillRect(0, 0, w, h);
    // 문에서 쏟아지는 빛
    const g = ctx.createLinearGradient(w, 0, 0, 0);
    g.addColorStop(0, `rgba(255,232,180,${0.5 + i * 0.06})`);
    g.addColorStop(1, 'rgba(255,232,180,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    const kneel = Math.min(i, 4) / 4;
    drawPerson(ctx, {
      x: 96,
      y: 168 - 0 + kneel * 22,
      s: 1 - kneel * 0.18,
      silhouette: true,
      stride: 0.3,
      armSwing: -0.9 - kneel * 0.6,
      lean: kneel * 0.25,
    });

    const dogX = 176 - Math.min(i, 5) * 12;
    const hop = i >= 3 && i <= 5 ? -14 : 0;
    ctx.save();
    ctx.translate(0, 60);
    drawDog(ctx, {
      x: dogX,
      y: 108,
      s: 0.85,
      bodyY: hop,
      tailAngle: 1.5,
      legSwing: 0.6,
      legPhase: t,
      tilt: hop ? -0.25 : 0,
    });
    ctx.restore();

    if (i >= 6) {
      ctx.save();
      ctx.globalAlpha = (i - 5) / 2.2;
      ctx.fillStyle = '#fff3d8';
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  },
};

/* ------------------------------------------------------------------ */

export const POSES = { ...dogPoses, ...otherPoses };

/**
 * 시트 하나를 절차적으로 생성한다.
 * @param {Phaser.Scene} scene
 * @param {{key:string,w:number,h:number,placeholder:string}} def
 */
export function buildSpriteSheet(scene, def) {
  const draw = POSES[def.placeholder];
  if (!draw) {
    createSheet(scene, def.key, def.w, def.h, 8, (ctx, t, i, w, h) => {
      ctx.fillStyle = 'rgba(217,108,95,0.55)';
      ctx.fillRect(4, 4, w - 8, h - 8);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6 + i * ((w - 20) / 8), h - 16, 10, 10);
    });
    return;
  }
  createSheet(scene, def.key, def.w, def.h, 8, draw);
}
