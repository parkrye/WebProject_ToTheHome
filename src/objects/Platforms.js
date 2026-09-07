/**
 * 지형과 발판.
 *
 * 타일맵 대신 사각 플랫폼 목록으로 레벨을 구성한다. 데이터 수정이 쉽고,
 * 타일 텍스처는 tileSprite 로 반복해 붙이므로 실제 타일셋이 들어와도 그대로 동작한다.
 */

import Phaser from 'phaser';
import { TERRAIN } from '../config.js';
import { TILE } from '../systems/AssetManifest.js';
import { TILE_DEPTH } from '../systems/Layout.js';

/** 타일 한 칸이 화면에서 차지할 크기 (아틀라스 프레임은 128px) */
const TILE_SCALE = 0.5;

/** 화면에서 타일 한 칸의 높이 */
const TILE_PX = 128 * TILE_SCALE;

/** 지면 윗면으로 쓰는 칸들 — 이 칸을 세로로 반복하면 잔디가 중간에 또 나온다 */
const TOP_FRAMES = [TILE.TOP, TILE.TOP_A, TILE.TOP_B, TILE.TOP_C];

/** 정적 지면. group 에 넣어 한 번에 충돌시킨다 */
export function createGround(scene, group, def, tileKey) {
  const key = def.tile || tileKey;
  const frame = def.frame ?? TILE.TOP;
  const depth = def.depth ?? TILE_DEPTH;

  // 윗면 칸을 사각형 높이만큼 반복하면 **잔디가 중간에 한 번 더 나온다.**
  // 두 칸 이상 두꺼운 지면은 윗면을 맨 위 한 줄만 깔고 그 아래는 속을 채운다.
  const layered = TOP_FRAMES.includes(frame) && def.h > TILE_PX + 2;
  const bodyFrame = layered ? (def.fill ?? TILE.FILL) : frame;

  const body = scene.add.tileSprite(def.x + def.w / 2, def.y + def.h / 2, def.w, def.h, key, bodyFrame);
  body.setTileScale(TILE_SCALE, TILE_SCALE);
  body.setDepth(depth);
  scene.physics.add.existing(body, true);
  body.body.setSize(def.w, def.h);
  body.surface = def.surface || 'soft';
  group.add(body);

  if (layered) {
    const cap = scene.add.tileSprite(def.x + def.w / 2, def.y + TILE_PX / 2, def.w, TILE_PX, key, frame);
    cap.setTileScale(TILE_SCALE, TILE_SCALE);
    cap.setDepth(depth + 0.1);
    body.cap = cap;
  }

  return body;
}

/**
 * 이 두께까지는 "위에서만 밟히는 판자"로 본다.
 *
 * 생성기는 몇 개가 모였는지에 따라 판자(18) · 연석(40) · 땅(최대 120) 을 같은 목록에
 * 담아 준다. 여기서 갈라지는 것이 **조작의 규칙**이다.
 *
 *   판자 · 연석  공중에 뜬 발판이다. 아래에서 뛰어 뚫고 올라갈 수 있고,
 *                ↓ + 점프로 통과해 내려갈 수 있다
 *   땅(68~120)   잔디 윗면을 쓰는 덩어리다. 바닥과 똑같이 사방이 막힌 **지형**이다
 *
 * 예전에는 24 여서 연석(40)까지 사방이 막혔다. 생김새는 판자와 다를 바 없는데
 * 어떤 것은 뚫리고 어떤 것은 안 뚫려서, 무엇을 딛고 있는지 눈으로 알 수 없었다.
 * 두께로 가르되 **경계를 생김새에 맞춘다** — 잔디가 얹힌 것만 지형이다.
 *
 * 두꺼운 것까지 위에서만 밟히게 두면 **땅덩어리를 옆에서 뚫고 들어가고, 그 속에
 * 갇힌다.** 대신 생성기가 두꺼운 덩어리 밑에 머리 공간을 보장한다 (StageBuilder.thicken).
 *
 * 경계값은 생성기와 나눠 쓴다 (`config.TERRAIN`). 여기서만 고치면 어긋난다.
 */
const ONE_WAY_MAX_H = TERRAIN.oneWayMaxH;

/** 얇으면 위에서만 밟히는 발판, 두꺼우면 사방이 막힌 땅 */
export function createLedge(scene, group, def, tileKey) {
  const h = def.h ?? 18;
  const ledge = createGround(scene, group, { frame: TILE.LEDGE, ...def, h }, tileKey);
  if (h > ONE_WAY_MAX_H) return ledge;

  // 위에서만 밟히므로 아래 + 점프로 통과해 내려갈 수 있다 (Dog.handleDrop)
  ledge.oneWay = true;
  ledge.body.checkCollision.down = false;
  ledge.body.checkCollision.left = false;
  ledge.body.checkCollision.right = false;
  return ledge;
}

/** 왕복하는 발판 */
export class MovingPlatform extends Phaser.GameObjects.TileSprite {
  constructor(scene, def, tileKey) {
    super(scene, def.x, def.y, def.w, def.h ?? 24, def.tile || tileKey, def.frame ?? TILE.LEDGE);
    this.setTileScale(TILE_SCALE, TILE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setFriction(1, 0);
    this.setDepth(def.depth ?? 11);
    this.surface = def.surface || 'hard';

    const dx = def.dx ?? 0;
    const dy = def.dy ?? 0;
    const duration = def.duration ?? 2400;

    scene.tweens.add({
      targets: this,
      x: def.x + dx,
      y: def.y + dy,
      duration,
      ease: 'Sine.easeInOut',
      yoyo: true,
      repeat: -1,
      delay: def.delay ?? 0,
      onUpdate: () => {
        // 트윈으로 옮긴 위치를 물리 바디에 반영한다
        this.body.updateFromGameObject();
      },
    });
  }
}

/** 밟으면 흔들리다 무너지고, 잠시 뒤 되돌아오는 발판 */
export class CrumblePlatform extends Phaser.GameObjects.TileSprite {
  constructor(scene, def, tileKey) {
    super(scene, def.x, def.y, def.w, def.h ?? 24, def.tile || tileKey, def.frame ?? TILE.TOP_A);
    this.setTileScale(TILE_SCALE, TILE_SCALE);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(def.depth ?? 11);
    this.surface = def.surface || 'soft';
    this.homeX = def.x;
    this.homeY = def.y;
    this.respawnDelay = def.respawnDelay ?? 3000;
    this.shakeTime = def.shakeTime ?? 400;
    this.triggered = false;
  }

  trigger() {
    if (this.triggered) return;
    this.triggered = true;

    this.scene.tweens.add({
      targets: this,
      x: this.homeX + 3,
      duration: 60,
      yoyo: true,
      repeat: Math.floor(this.shakeTime / 120),
      onComplete: () => this.collapse(),
    });
  }

  collapse() {
    this.scene.audio?.play('sfx_crumble', { volume: 0.45 });
    this.body.enable = false;

    this.scene.tweens.add({
      targets: this,
      y: this.homeY + 160,
      alpha: 0,
      duration: 500,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.scene.time.delayedCall(this.respawnDelay, () => this.restore());
      },
    });
  }

  restore() {
    this.setPosition(this.homeX, this.homeY);
    this.setAlpha(0);
    this.body.enable = true;
    this.body.reset(this.homeX, this.homeY);
    this.triggered = false;
    this.scene.tweens.add({ targets: this, alpha: 1, duration: 300 });
  }
}
