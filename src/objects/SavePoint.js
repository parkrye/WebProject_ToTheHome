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

    /**
     * 소품 본체.
     *
     * **폭으로 잡는 것이 기본이다.** 세이브 포인트는 "여기서 쉰다"를 그림 하나로
     * 알려야 하는데, 높이로만 맞추면 넓적한 그림(놀이터)과 동그란 그림(공)이
     * 화면에서 전혀 다른 크기가 된다. 소형 발판 둘을 붙인 너비로 통일하면 어느
     * 스테이지에서도 같은 크기로 읽힌다 (플레이 리뷰 5차 5).
     */
    if (def.prop && scene.textures.exists(def.prop)) {
      this.prop = scene.add.image(0, 0, def.prop).setOrigin(0.5, 1);
      if (def.propWidth) sizeTo(this.prop, { width: def.propWidth });
      else sizeTo(this.prop, { height: def.propHeight ?? 150 });
      if (def.propScale) this.prop.setScale(def.propScale);
      this.add(this.prop);
    }

    /**
     * 닿는 범위는 **소품에서 잰다.**
     *
     * 고정된 110px 은 소품이 240px 로 넓어지자 소품 위에 서 있는데도 안내가 뜨지
     * 않는 자리를 만들었다. 소품 반폭에 강아지 한 마리쯤을 더해 둔다.
     */
    this.reachX = (this.prop ? this.prop.displayWidth / 2 : 60) + 56;
    this.reachY = 160;

    // 바닥 오라는 두지 않는다 — 도착 지점과 같은 이유다 (Decor.GoalMarker 주석).
    // 무엇을 할 수 있는 자리인지는 소품과 가까이 갔을 때 뜨는 안내로 충분하다

    // 상호작용 프롬프트 — 소품 높이가 제각각이므로 **소품 위**에 띄운다
    this.promptY = -Math.max(110, (this.prop?.displayHeight ?? 0) + 26);
    this.prompt = scene.add.image(0, this.promptY, 'ui_prompt_interact').setOrigin(0.5, 1).setAlpha(0);
    sizeTo(this.prompt, { height: UI_SIZE.prompt });
    this.add(this.prompt);

    this.setDepth(15);

    // 접근 판정용 존
    this.zone = scene.add.zone(def.x, def.y - 40, def.radius ?? this.reachX * 2, 140);
    scene.physics.add.existing(this.zone, true);
  }

  showPrompt(show) {
    if (this.promptShown === show) return;
    this.promptShown = show;
    this.scene.tweens.add({
      targets: this.prompt,
      alpha: show ? 1 : 0,
      y: this.promptY - (show ? 10 : 0),
      duration: 220,
      ease: 'Sine.easeOut',
    });
  }

  /** 저장 성공 이펙트 — 저장됐다는 것만 알면 되므로 조용하게 */
  burst() {
    const burst = this.scene.add
      .image(this.x, this.y - 20, 'ui_save_burst')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(30)
      .setAlpha(0.45);
    sizeTo(burst, { height: 90 });
    const burstScale = burst.scaleX;

    this.scene.tweens.add({
      targets: burst,
      scale: burstScale * 1.8,
      alpha: 0,
      duration: 900,
      ease: 'Cubic.easeOut',
      onComplete: () => burst.destroy(),
    });

    for (let i = 0; i < 5; i++) {
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
