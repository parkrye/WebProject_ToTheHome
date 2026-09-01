/**
 * 길 안내와 배치용 장식.
 *
 * ScentTrail 은 이 게임에서 언어를 대신해 길을 알려주는 유일한 장치다.
 * 평소에는 옅게 떠 있고, 냄새 맡기(↓)를 하면 몇 초간 밝아진다.
 */

import Phaser from 'phaser';

export class ScentTrail {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x:number,y:number}[]} points
   */
  constructor(scene, points) {
    this.scene = scene;
    this.motes = points.map((p, i) => {
      const mote = scene.add
        .sprite(p.x, p.y, 'scent_wisp')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(14)
        .setAlpha(0.22)
        .setScale(p.scale ?? 0.9);
      mote.play({ key: 'scent_wisp', startFrame: i % 8 });
      scene.tweens.add({
        targets: mote,
        y: p.y - 10,
        duration: 1800 + (i % 5) * 220,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
      return mote;
    });
    this.boostUntil = 0;
  }

  /** 냄새 맡기 — 3초간 밝아진다 */
  boost(time) {
    this.boostUntil = time + 3000;
    this.motes.forEach((mote, i) => {
      this.scene.tweens.add({
        targets: mote,
        alpha: 0.95,
        scale: (mote.scaleX ?? 1) * 1.25,
        duration: 220,
        delay: i * 18,
        yoyo: true,
        hold: 2400,
        onComplete: () => mote.setAlpha(0.22),
      });
    });
  }
}

/**
 * 월드에 박혀 있는 튜토리얼 안내판.
 * 지나가면 화면과 함께 뒤로 밀려나고, 돌아오면 다시 볼 수 있다 — 요청서의 의도 그대로.
 */
export class SignBoard extends Phaser.GameObjects.Image {
  constructor(scene, def) {
    super(scene, def.x, def.y, def.texture);
    scene.add.existing(this);
    this.setOrigin(0.5, 1);
    this.setDepth(def.depth ?? 12);
    this.setScale(def.scale ?? 1);
    this.baseY = def.y;

    // 가까이 가면 살짝 떠오르며 또렷해진다
    this.setAlpha(0.9);
    this.highlighted = false;
  }

  highlight(on) {
    if (this.highlighted === on) return;
    this.highlighted = on;
    this.scene.tweens.add({
      targets: this,
      alpha: on ? 1 : 0.9,
      y: on ? this.baseY - 6 : this.baseY,
      duration: 240,
      ease: 'Sine.easeOut',
    });
  }
}

/** 단순 배치용 소품 (충돌 없음) */
export function placeProp(scene, def) {
  const key = def.texture;
  if (!scene.textures.exists(key)) return null;

  const prop = scene.anims.exists(key)
    ? scene.add.sprite(def.x, def.y, key).play(key)
    : scene.add.image(def.x, def.y, key);

  prop.setOrigin(def.originX ?? 0.5, def.originY ?? 1);
  prop.setDepth(def.depth ?? 8);
  if (def.scale) prop.setScale(def.scale);
  if (def.alpha != null) prop.setAlpha(def.alpha);
  if (def.flip) prop.setFlipX(true);
  if (def.tint != null) prop.setTint(def.tint);
  if (def.scrollFactor != null) prop.setScrollFactor(def.scrollFactor);

  if (def.bob) {
    scene.tweens.add({
      targets: prop,
      y: def.y - def.bob,
      duration: def.bobDuration ?? 2000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  if (def.drift) {
    scene.tweens.add({
      targets: prop,
      x: def.x + def.drift,
      duration: def.driftDuration ?? 6000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  return prop;
}

/** 스테이지 끝 — 여기 닿으면 클리어 */
export class StageGoal extends Phaser.GameObjects.Zone {
  constructor(scene, def) {
    super(scene, def.x, def.y, def.w ?? 80, def.h ?? 300);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }
}
