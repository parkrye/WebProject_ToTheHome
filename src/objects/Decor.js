/**
 * 길 안내와 배치용 장식.
 *
 * ScentTrail 은 이 게임에서 언어를 대신해 길을 알려주는 유일한 장치다.
 * 평소에는 아예 보이지 않고, 냄새 맡기(E)를 유지하는 동안에만 반짝인다.
 */

import Phaser from 'phaser';
import { SCENT } from '../config.js';
import { sizeTo, sizeToActor, GROUND_SINK, PROP_DEPTH } from '../systems/Layout.js';
import { ACTOR_SLOTS, ACTOR_FILL, actorAnim, actorFrame } from '../systems/AssetManifest.js';

export class ScentTrail {
  /**
   * @param {Phaser.Scene} scene
   * @param {{x:number,y:number}[]} points
   */
  constructor(scene, points) {
    this.scene = scene;
    this.active = false;
    this.motes = points.map((p, i) => {
      const mote = scene.add
        .image(p.x, p.y, 'ui_scent_mote')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(14)
        .setVisible(false);
      sizeTo(mote, { height: (p.scale ?? 1) * 40 });
      mote.baseScale = mote.scaleX;

      // 그림은 한 장이고, 떠오르는 것은 코드가 준다.
      // 꺼져 있는 동안에도 계속 돌지만 그려지지 않으므로 켜는 순간 어색하지 않다
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
  }

  /**
   * 켜고 끄기.
   *
   * 켜져 있는 동안만 반짝인다. 냄새 맡기를 유지하는 동안에만 켜지므로, 손을 떼면
   * 길 안내가 곧바로 사라진다 (config.SCENT 주석 참고).
   */
  setActive(on) {
    if (this.active === on) return;
    this.active = on;

    this.motes.forEach((mote, i) => {
      mote.twinkle?.remove();
      mote.twinkle = null;

      if (!on) {
        mote.setVisible(false).setScale(mote.baseScale);
        return;
      }

      mote.setVisible(true).setAlpha(SCENT.lowAlpha);
      mote.twinkle = this.scene.tweens.add({
        targets: mote,
        alpha: SCENT.highAlpha,
        scaleX: mote.baseScale * SCENT.grow,
        scaleY: mote.baseScale * SCENT.grow,
        duration: SCENT.twinkle,
        delay: i * 26,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
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
    // 실제 에셋은 원본 크기가 제각각이라 높이를 픽셀로 못박는다
    sizeTo(this, { height: def.height ?? 170 });
    if (def.scale) this.setScale(def.scale);
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

/**
 * 단순 배치용 소품 (충돌 없음).
 *
 * 아틀라스에서 꺼낼 때는 { atlas, frame } 을, 낱장을 쓸 때는 { texture } 를 준다.
 * height 를 주면 그 높이에 맞춰 크기를 조절한다 — 아틀라스 소품은 원본 크기가
 * 제각각이므로 스케일보다 높이로 지정하는 편이 안정적이다.
 */
export function placeProp(scene, def) {
  const key = def.atlas || def.texture;
  if (!key || !scene.textures.exists(key)) return null;

  let prop;
  if (def.atlas) {
    // 움직이는 것들 시트는 한 줄이 8프레임짜리 애니메이션이다.
    // frame 이 그 줄 번호이므로, 애니메이션이 있으면 재생하고 없으면 그림 한 장으로 둔다
    const anim = actorAnim(def.atlas, def.frame ?? 0);
    if (anim && scene.anims.exists(anim)) {
      prop = scene.add.sprite(def.x, def.y, def.atlas, actorFrame(def.frame ?? 0)).play(anim);
    } else {
      prop = scene.add.image(def.x, def.y, def.atlas, def.frame ?? 0);
    }
  } else if (scene.anims.exists(key)) {
    prop = scene.add.sprite(def.x, def.y, key).play(key);
  } else {
    prop = scene.add.image(def.x, def.y, key);
  }

  prop.setOrigin(def.originX ?? 0.5, def.originY ?? 1);

  // 지면에 서는 소품은 타일보다 위에 그린다. 데이터에 적힌 낮은 depth 는 소품끼리의
  // 앞뒤 순서를 정하려던 것이므로, 그 순서는 지킨 채 타일 위로 올린다.
  // 떠 있는 것(새·구름)은 적힌 그대로 둔다 — 그건 정말 뒤에 있어야 한다
  const grounded = (def.originY ?? 1) === 1 && !def.drift && !def.bob;
  const depth = def.depth ?? PROP_DEPTH;
  prop.setDepth(grounded && depth < PROP_DEPTH ? PROP_DEPTH + depth / 100 : depth);

  // 액터 시트는 칸 안에 여백이 있으므로 비율을 쳐서 환산한다
  const theme = def.atlas && def.atlas.startsWith('actors_') ? def.atlas.replace('actors_', '') : null;
  const fill = theme ? ACTOR_FILL[theme]?.[ACTOR_SLOTS[def.frame ?? 0]] : null;
  if (def.height) sizeToActor(prop, { height: def.height }, fill);
  if (def.scale) prop.setScale(def.scale);
  if (def.alpha != null) prop.setAlpha(def.alpha);
  if (def.flip) prop.setFlipX(true);
  if (def.tint != null) prop.setTint(def.tint);
  if (def.scrollFactor != null) prop.setScrollFactor(def.scrollFactor);

  // 지면에 서는 것은 살짝 파묻는다. 타일 윗면에 딱 올리면 붕 떠 보인다
  if (grounded) prop.y += def.sink ?? GROUND_SINK;

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
