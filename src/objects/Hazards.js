/**
 * 위험 요소.
 *
 * 모든 위험은 예고 동작(텔레그래프)을 가진다 — 암기가 아니라 관찰로 풀리게 하기 위해서다.
 * kill: 접촉 시 사망 / push: 접촉 시 밀려남
 */

import Phaser from 'phaser';

class HazardBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, def, texture) {
    super(scene, def.x, def.y, texture, 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.def = def;
    this.effect = def.effect || 'kill';
    this.setDepth(def.depth ?? 18);
  }

  /** 서브클래스에서 구현 */
  tick() {}
}

/** 주기적으로 화면을 가로지르는 자동차 */
export class Car extends HazardBase {
  constructor(scene, def) {
    super(scene, def, def.texture || 'car_pass');
    this.play(def.texture || 'car_pass');
    this.dir = def.dir ?? -1;
    this.speed = def.speed ?? 260;
    this.fromX = def.fromX ?? def.x;
    this.toX = def.toX ?? def.x - 900;
    this.interval = def.interval ?? 3200;
    this.timer = def.delay ?? 0;
    this.active_ = false;
    this.setScale(def.scale ?? 0.85);
    this.setFlipX(this.dir > 0);
    this.body.setSize(180, 60);
    this.setVisible(false);
    this.body.setEnable(false);
  }

  tick(time, delta) {
    if (!this.active_) {
      this.timer -= delta;
      if (this.timer > 0) return;
      this.timer = this.interval;
      this.active_ = true;
      this.setPosition(this.fromX, this.def.y);
      this.setVisible(true);
      this.body.setEnable(true);
      this.scene.audio?.play('sfx_car_pass', { volume: 0.4 });
      return;
    }

    this.x += this.dir * this.speed * (delta / 1000);
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
    super(scene, def, 'rock_fall');
    this.startY = def.y;
    this.groundY = def.groundY ?? def.y + 300;
    this.interval = def.interval ?? 2600;
    this.timer = def.delay ?? 0;
    this.phase = 'wait';
    this.setScale(def.scale ?? 1.1);
    this.setVisible(false);
    this.body.setEnable(false);
    this.body.setSize(40, 40);

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
      this.setVisible(true);
      this.body.setEnable(true);
      this.body.setAllowGravity(true);
      this.body.setVelocityY(0);
      this.play('rock_fall');
      this.scene.audio?.play('sfx_rock_fall', { volume: 0.5 });
      return;
    }

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
    super(scene, def, 'boar_charge');
    this.homeX = def.x;
    this.range = def.range ?? 420;
    this.speed = def.speed ?? 420;
    this.phase = 'idle';
    this.timer = def.delay ?? 1200;
    this.setScale(def.scale ?? 0.8);
    this.body.setSize(150, 70);
    this.play('boar_charge');
    this.anims.pause(this.anims.currentAnim.frames[0]);
  }

  tick(time, delta) {
    this.timer -= delta;

    if (this.phase === 'idle') {
      if (this.timer > 0) return;
      this.phase = 'telegraph';
      this.timer = 700;
      this.anims.resume();
      this.anims.play('boar_charge', true);
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
      return;
    }

    // recover — 천천히 제자리로
    if (this.timer > 0) return;
    this.phase = 'idle';
    this.timer = 1600;
    this.setPosition(this.homeX, this.def.y);
    this.anims.pause(this.anims.currentAnim.frames[0]);
  }
}

/** 밀려왔다 빠지는 파도 — 닿으면 뒤로 밀려난다 */
export class Wave extends HazardBase {
  constructor(scene, def) {
    super(scene, { ...def, effect: 'push' }, 'wave_loop');
    this.play('wave_loop');
    this.setOrigin(0.5, 1);
    this.setScale(def.scaleX ?? 2.4, def.scaleY ?? 1.1);
    this.restX = def.x;
    this.reachX = def.reachX ?? def.x + 420;
    this.interval = def.interval ?? 3600;
    this.timer = def.delay ?? 0;
    this.body.setSize(240, 80);
    this.body.setOffset(8, 110);
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
export class SteamVent extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, def) {
    super(scene, def.x, def.y, 'steam_vent', 0);
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.body.setSize(70, 150);
    this.body.setOffset(28, -30);
    this.setOrigin(0.5, 1);
    this.setDepth(12);
    this.setAlpha(0.7);
    this.play('steam_vent');
    this.effect = 'lift';
    this.liftPower = def.power ?? -430;
    this.interval = def.interval ?? 2400;
    this.activeTime = def.activeTime ?? 1200;
    this.timer = def.delay ?? 0;
    this.blowing = false;
    this.setVisible(false);
  }

  tick(time, delta) {
    this.timer -= delta;
    if (this.timer > 0) return;

    this.blowing = !this.blowing;
    this.timer = this.blowing ? this.activeTime : this.interval;
    this.setVisible(this.blowing);
    if (this.blowing) this.scene.audio?.play('sfx_steam', { volume: 0.35 });
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
      this.visual = scene.add.tileSprite(def.x, def.y, def.w, def.h, def.texture).setDepth(def.depth ?? 9);
      if (def.animate && scene.anims.exists(def.texture)) {
        // tileSprite 는 애니메이션을 못 쓰므로 스프라이트를 겹쳐 흐르는 느낌만 준다
        this.visual.setAlpha(0.9);
      }
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
