/**
 * 위험 요소.
 *
 * 모든 위험은 예고 동작(텔레그래프)을 가진다 — 암기가 아니라 관찰로 풀리게 하기 위해서다.
 *
 * 그림은 스테이지별 actors 시트에서 프레임 하나를 꺼내 쓰는 정적 이미지다.
 * 모양이 변하지 않고 위치·각도·크기만 바뀌므로 애니메이션 시트가 필요 없다.
 *
 * kill: 접촉 시 사망 / push: 접촉 시 밀려남 / lift: 위로 밀어 올림
 */

import Phaser from 'phaser';
import { ACTOR } from '../systems/AssetManifest.js';
import { sizeTo } from '../systems/Layout.js';

class HazardBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, def, defaultFrame) {
    const key = def.texture || def.actors;
    const frame = def.frame ?? defaultFrame;
    super(scene, def.x, def.y, key, frame);

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.def = def;
    this.effect = def.effect || 'kill';
    this.setDepth(def.depth ?? 18);
    if (def.height) sizeTo(this, { height: def.height });
  }

  /** 서브클래스에서 구현 */
  tick() {}
}

/** 주기적으로 화면을 가로지르는 자동차 */
export class Car extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 96, ...def }, ACTOR.MOVER);
    this.dir = def.dir ?? -1;
    this.speed = def.speed ?? 260;
    this.fromX = def.fromX ?? def.x;
    this.toX = def.toX ?? def.x - 900;
    this.interval = def.interval ?? 3200;
    this.timer = def.delay ?? 0;
    this.active_ = false;
    this.setFlipX(this.dir > 0);
    this.body.setSize(this.displayWidth * 0.9, this.displayHeight * 0.7, true);
    this.setVisible(false);
    this.body.setEnable(false);
    this.baseY = def.y;
  }

  tick(time, delta) {
    if (!this.active_) {
      this.timer -= delta;
      if (this.timer > 0) return;
      this.timer = this.interval;
      this.active_ = true;
      this.setPosition(this.fromX, this.baseY);
      this.setVisible(true);
      this.body.setEnable(true);
      this.scene.audio?.play('sfx_car_pass', { volume: 0.4 });
      return;
    }

    this.x += this.dir * this.speed * (delta / 1000);
    // 노면을 달리는 느낌만 살짝 준다
    this.y = this.baseY + Math.sin(time / 90) * 1.5;

    const done = this.dir < 0 ? this.x < this.toX : this.x > this.toX;
    if (done) {
      this.active_ = false;
      this.setVisible(false);
      this.body.setEnable(false);
    }
  }
}

/** 위에서 떨어지는 돌 / 화분 — 그림자로 0.5초 예고 */
export class FallingRock extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 56, ...def }, ACTOR.FALLER);
    this.startY = def.y;
    this.groundY = def.groundY ?? def.y + 300;
    this.interval = def.interval ?? 2600;
    this.timer = def.delay ?? 0;
    this.phase = 'wait';
    this.setVisible(false);
    this.body.setEnable(false);
    this.body.setSize(this.displayWidth * 0.7, this.displayHeight * 0.7, true);

    this.shadow = scene.add.ellipse(def.x, this.groundY, 46, 12, 0x000000, 0.35).setDepth(6).setVisible(false);
  }

  tick(time, delta) {
    this.timer -= delta;

    if (this.phase === 'wait') {
      if (this.timer > 0) return;
      this.phase = 'telegraph';
      this.timer = 500;
      this.shadow.setVisible(true).setScale(0.5);
      this.scene.tweens.add({ targets: this.shadow, scaleX: 1, scaleY: 1, duration: 500 });
      return;
    }

    if (this.phase === 'telegraph') {
      if (this.timer > 0) return;
      this.phase = 'fall';
      this.setPosition(this.def.x, this.startY);
      this.setAngle(0);
      this.setVisible(true);
      this.body.setEnable(true);
      this.body.setAllowGravity(true);
      this.body.setVelocityY(0);
      this.scene.audio?.play('sfx_rock_fall', { volume: 0.5 });
      return;
    }

    // 떨어지는 동안 굴러가는 느낌
    this.angle += delta * 0.25;

    if (this.y >= this.groundY) {
      this.phase = 'wait';
      this.timer = this.interval;
      this.setVisible(false);
      this.body.setEnable(false);
      this.body.setAllowGravity(false);
      this.shadow.setVisible(false);
    }
  }
}

/** 멧돼지 — 땅 긁기 0.7초 후 직선 돌진, 이후 경직 */
export class Boar extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 110, ...def }, ACTOR.MOVER);
    this.homeX = def.x;
    this.range = def.range ?? 420;
    this.speed = def.speed ?? 420;
    this.phase = 'idle';
    this.timer = def.delay ?? 1200;
    this.body.setSize(this.displayWidth * 0.85, this.displayHeight * 0.7, true);
  }

  tick(time, delta) {
    this.timer -= delta;

    if (this.phase === 'idle') {
      if (this.timer > 0) return;
      this.phase = 'telegraph';
      this.timer = 700;
      // 예고 — 앞발로 땅을 긁듯 좌우로 잘게 떤다
      this.scene.tweens.add({
        targets: this,
        x: this.homeX + 8,
        duration: 90,
        yoyo: true,
        repeat: 3,
        onComplete: () => this.setX(this.homeX),
      });
      this.scene.audio?.play('sfx_boar_snort', { volume: 0.5 });
      return;
    }

    if (this.phase === 'telegraph') {
      if (this.timer > 0) return;
      this.phase = 'charge';
      this.timer = (this.range / this.speed) * 1000;
      this.body.setVelocityX(-this.speed);
      return;
    }

    if (this.phase === 'charge') {
      if (this.timer > 0) return;
      this.phase = 'recover';
      this.timer = 1400;
      this.body.setVelocityX(0);
      // 지친 표시 — 고개를 떨구듯 살짝 기운다
      this.scene.tweens.add({ targets: this, angle: 6, duration: 300 });
      return;
    }

    if (this.timer > 0) return;
    this.phase = 'idle';
    this.timer = 1600;
    this.setAngle(0);
    this.setPosition(this.homeX, this.def.y);
  }
}

/** 밀려왔다 빠지는 파도 — 닿으면 뒤로 밀려난다 */
export class Wave extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 150, ...def, effect: 'push' }, ACTOR.FALLER);
    this.setOrigin(0.5, 1);
    this.restX = def.x;
    this.reachX = def.reachX ?? def.x + 420;
    this.interval = def.interval ?? 3600;
    this.timer = def.delay ?? 0;
    this.body.setSize(this.displayWidth * 0.9, this.displayHeight * 0.5, true);
    this.setAlpha(0.85);
    this.setDepth(def.depth ?? 22);
  }

  tick(time, delta) {
    this.timer -= delta;
    if (this.timer > 0) return;
    this.timer = this.interval;

    this.scene.audio?.play('sfx_wave_rush', { volume: 0.4 });
    this.scene.tweens.add({
      targets: this,
      x: this.reachX,
      duration: 1100,
      ease: 'Sine.easeOut',
      yoyo: true,
      hold: 260,
    });
  }
}

/** 하수구 증기 — 위험이 아니라 위로 밀어 올리는 리프트 */
export class SteamVent extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 140, ...def, effect: 'lift' }, ACTOR.PUFF);
    this.setOrigin(0.5, 1);
    this.setDepth(def.depth ?? 12);
    this.setAlpha(0);
    this.body.setSize(70, this.displayHeight * 0.9, true);
    this.liftPower = def.power ?? -430;
    this.interval = def.interval ?? 2400;
    this.activeTime = def.activeTime ?? 1200;
    this.timer = def.delay ?? 0;
    this.blowing = false;
    this.baseScaleY = this.scaleY;
  }

  tick(time, delta) {
    this.timer -= delta;
    if (this.timer > 0) return;

    this.blowing = !this.blowing;
    this.timer = this.blowing ? this.activeTime : this.interval;

    if (this.blowing) {
      this.scene.audio?.play('sfx_steam', { volume: 0.35 });
      this.setScale(this.scaleX, this.baseScaleY * 0.3);
      this.scene.tweens.add({
        targets: this,
        alpha: 0.75,
        scaleY: this.baseScaleY,
        duration: 260,
        ease: 'Quad.easeOut',
      });
      return;
    }

    this.scene.tweens.add({ targets: this, alpha: 0, duration: 320 });
  }
}

/** 고정 위험 — 덫, 가시, 물웅덩이 */
export class StaticHazard extends Phaser.GameObjects.Rectangle {
  constructor(scene, def) {
    super(scene, def.x, def.y, def.w, def.h, def.debugColor ?? 0x000000, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.effect = def.effect || 'kill';
    this.setDepth(9);

    if (def.texture && scene.textures.exists(def.texture)) {
      this.visual = scene.add
        .tileSprite(def.x, def.y, def.w, def.h, def.texture, def.frame)
        .setDepth(def.depth ?? 9)
        .setAlpha(0.9);
    }

    this.tick = () => {};
  }
}

export const HAZARD_TYPES = {
  car: Car,
  rock: FallingRock,
  boar: Boar,
  wave: Wave,
  steam: SteamVent,
  static: StaticHazard,
};
