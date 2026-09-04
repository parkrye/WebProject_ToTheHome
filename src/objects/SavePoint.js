/**
 * 세이브 포인트.
 *
 * 접근하면 머리 위에 픽토그램이 뜨고, 상호작용하면 스테이지 고유 모션이 재생된다.
 * 이미 저장한 지점에서 다시 상호작용해도 모션은 그대로 재생된다 — 강아지는 그냥 거기서 노는 것.
 */

import Phaser from 'phaser';
import { PALETTE } from '../config.js';
import { sizeTo, UI_SIZE, SAVE_SINK } from '../systems/Layout.js';

export class SavePoint extends Phaser.GameObjects.Container {
  /**
   * @param {object} def { id, x, y, prop, motion, motionDuration, label }
   */
  constructor(scene, def) {
    super(scene, def.x, def.y + (def.sink ?? SAVE_SINK));
    scene.add.existing(this);

    this.def = def;
    this.id = def.id;
    this.motion = def.motion;
    this.motionDuration = def.motionDuration ?? 2200;
    this.busy = false;

    // 소품 본체
    if (def.prop && scene.textures.exists(def.prop)) {
      this.prop = scene.add.image(0, 0, def.prop).setOrigin(0.5, 1);
      sizeTo(this.prop, { height: def.propHeight ?? 150 });
      if (def.propScale) this.prop.setScale(def.propScale);
      this.add(this.prop);
    }

    // 바닥 오라
    this.glow = scene.add.image(0, 6, 'ui_save_glow').setOrigin(0.5, 1).setBlendMode(Phaser.BlendModes.ADD);
    sizeTo(this.glow, { height: 90 });
    this.add(this.glow);
    // 천천히 숨 쉬듯 밝아졌다 어두워진다
    scene.tweens.add({
      targets: this.glow,
      alpha: 0.55,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    // 상호작용 프롬프트
    this.prompt = scene.add.image(0, -110, 'ui_prompt_interact').setOrigin(0.5, 1).setAlpha(0);
    sizeTo(this.prompt, { height: UI_SIZE.prompt });
    this.add(this.prompt);

    this.setDepth(15);

    // 접근 판정용 존
    this.zone = scene.add.zone(def.x, def.y - 40, def.radius ?? 150, 140);
    scene.physics.add.existing(this.zone, true);
  }

  showPrompt(show) {
    if (this.promptShown === show) return;
    this.promptShown = show;
    this.scene.tweens.add({
      targets: this.prompt,
      alpha: show ? 1 : 0,
      y: show ? -120 : -110,
      duration: 220,
      ease: 'Sine.easeOut',
    });
  }

  /** 저장 성공 이펙트 */
  burst() {
    const burst = this.scene.add
      .image(this.x, this.y - 20, 'ui_save_burst')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(30)
      .setAlpha(0.9);
    sizeTo(burst, { height: 150 });
    const burstScale = burst.scaleX;

    this.scene.tweens.add({
      targets: burst,
      scale: burstScale * 3.2,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => burst.destroy(),
    });

    for (let i = 0; i < 10; i++) {
      const mote = this.scene.add
        .image(this.x + Phaser.Math.Between(-40, 40), this.y - 10, 'ui_scent_mote')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(30);
      sizeTo(mote, { height: 34 });
      this.scene.tweens.add({
        targets: mote,
        y: this.y - Phaser.Math.Between(90, 180),
        alpha: 0,
        duration: Phaser.Math.Between(700, 1300),
        onComplete: () => mote.destroy(),
      });
    }
  }
}

/** 세이브 포인트 색 — 플레이스홀더 프롭에도 통일감을 주기 위한 값 */
export const SAVE_TINT = PALETTE.save;
