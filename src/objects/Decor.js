/**
 * 길 안내와 배치용 장식.
 *
 * ScentTrail 은 이 게임에서 언어를 대신해 길을 알려주는 유일한 장치다.
 * 평소에는 아예 보이지 않고, 냄새 맡기(E)를 유지하는 동안에만 반짝인다.
 */

import Phaser from 'phaser';
import { SCENT } from '../config.js';
import { sizeTo, sizeToActor, GROUND_SINK, PROP_DEPTH, UI_SIZE } from '../systems/Layout.js';
import { ACTOR_SLOTS, ACTOR_FILL, PROP_FOOT, actorAnim, actorFrame } from '../systems/AssetManifest.js';

export class ScentTrail {
  /**
   * 입자를 미리 만들어 두고 돌려 쓴다.
   *
   * 길은 맡을 때마다 다시 찾으므로 어디에 몇 개가 필요할지 미리 알 수 없다.
   * 최대 개수만큼 만들어 두고 경로 길이에 맞춰 꺼내 쓴다.
   *
   * @param {Phaser.Scene} scene
   */
  constructor(scene) {
    this.scene = scene;
    this.active = false;
    this.motes = [];

    for (let i = 0; i < SCENT.maxMotes; i += 1) {
      const mote = scene.add
        .image(0, 0, 'ui_scent_mote')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(14)
        .setVisible(false);
      sizeTo(mote, { height: 40 });
      mote.baseScale = mote.scaleX;
      this.motes.push(mote);
    }
  }

  /**
   * 이 경로를 따라 냄새를 켠다. 손을 떼면 hide() 로 곧바로 꺼진다.
   *
   * @param {{x:number,y:number}[]} points 지금 자리에서 도착까지의 최단 경로
   */
  showRoute(points) {
    this.active = true;

    this.motes.forEach((mote, i) => {
      const p = points[i];
      if (!p) {
        this.stop(mote);
        return;
      }

      mote.setPosition(p.x, p.y).setVisible(true).setAlpha(SCENT.lowAlpha);
      if (mote.twinkle) return; // 이미 반짝이는 중이면 자리만 옮긴다

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

  hide() {
    if (!this.active) return;
    this.active = false;
    this.motes.forEach((mote) => this.stop(mote));
  }

  stop(mote) {
    mote.twinkle?.remove();
    mote.twinkle = null;
    mote.setVisible(false).setScale(mote.baseScale);
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

  // 칸 아래에 여백이 남은 그림은 그만큼 내려 밑동을 지면에 맞춘다 (AssetManifest.PROP_FOOT).
  // 크기를 다 정한 뒤라야 여백이 화면에서 몇 px 인지 알 수 있다
  const foot = PROP_FOOT[key]?.[def.frame ?? 0];
  if (foot) prop.y += foot * prop.displayHeight;

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
    /**
     * 오가는 것은 **가는 쪽을 본다.**
     *
     * 왕복 트윈만 걸어 두면 새가 절반은 뒤로 날아간다 (플레이 리뷰 4차 7).
     * 액터 시트의 그림은 오른쪽을 보고 있으므로 왼쪽으로 갈 때만 뒤집는다.
     * `def.flip` 으로 처음부터 뒤집어 둔 것은 그 방향이 곧 기준이라 건드리지 않는다.
     */
    const face = (goingRight) => {
      if (!def.flip) prop.setFlipX(!goingRight);
    };
    const outward = def.drift > 0;
    face(outward);

    scene.tweens.add({
      targets: prop,
      x: def.x + def.drift,
      duration: def.driftDuration ?? 6000,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onYoyo: () => face(!outward),
      onRepeat: () => face(outward),
    });
  }

  return prop;
}

/**
 * 도착 지점 표시 — **집 그림과 빛기둥.**
 *
 * 문자를 쓰지 않으므로 그림과 빛으로만 알린다.
 *
 * 출발 지점에도 발자국을 깔아 두었지만 걷어냈다. 강아지는 이미 거기 서 있으므로
 * 그 자리를 알려 줄 이유가 없고, 발밑에 뜻 모를 표시만 남았다 (플레이 리뷰 2차 2).
 */
export class GoalMarker {
  constructor(scene, x, y) {
    this.scene = scene;
    this.x = x;
    this.y = y;

    // 빛기둥은 두지 않는다. 숨 쉬듯 밝아졌다 어두워지는 기둥이 화면에서 제일 눈에
    // 띄어서, 새벽 도시의 조용한 분위기를 통째로 깨뜨렸다 (플레이 리뷰 3차 5).
    // 어디로 가야 하는지는 집 그림 하나로 충분하다
    this.icon = scene.add
      .image(x, y - 96, 'ui_icon_house')
      .setOrigin(0.5, 1)
      .setDepth(PROP_DEPTH + 2)
      .setAlpha(0.95);
    sizeTo(this.icon, { height: 96 });

    // 도착은 상호작용해야 통과다. 가까이 가면 안내가 떠오른다
    this.prompt = scene.add
      .image(x, y - 210, 'ui_prompt_interact')
      .setOrigin(0.5, 1)
      .setDepth(PROP_DEPTH + 3)
      .setAlpha(0);
    sizeTo(this.prompt, { height: UI_SIZE.prompt });
    scene.tweens.add({
      targets: this.icon,
      y: this.icon.y - 10,
      duration: 1800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  showPrompt(on) {
    if (!this.prompt || this.promptOn === on) return;
    this.promptOn = on;
    this.scene.tweens.add({
      targets: this.prompt,
      alpha: on ? 1 : 0,
      y: this.y - (on ? 220 : 210),
      duration: 200,
      ease: 'Sine.easeOut',
    });
  }
}

/**
 * 스테이지 끝.
 *
 * 닿기만 해도 넘어가면 "지나가다 끝났다"가 된다. 여기서 **상호작용해야** 통과다
 * (플레이 리뷰 15). 그래서 이 구역은 판정만 하고, 넘길지는 StageScene 이 정한다.
 */
export class StageGoal extends Phaser.GameObjects.Zone {
  constructor(scene, def) {
    super(scene, def.x, def.y, def.w ?? 80, def.h ?? 300);
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
  }
}
