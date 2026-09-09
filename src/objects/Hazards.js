/**
 * 위험 요소.
 *
 * 모든 위험은 예고 동작(텔레그래프)을 가진다 — 암기가 아니라 관찰로 풀리게 하기 위해서다.
 *
 * 그림은 스테이지별 actors 시트의 한 줄(8프레임)을 재생한다.
 * 바퀴가 돌고 날개가 움직이는 건 시트가 하고, 옮기고 돌리고 명멸시키는 건 코드가 한다.
 *
 * kill: 접촉 시 사망 / push: 접촉 시 밀려남 / lift: 위로 밀어 올림
 */

import Phaser from 'phaser';
import { PALETTE, HAZARD } from '../config.js';
import { ACTOR, ACTOR_SLOTS, ACTOR_BOX, actorAnim, actorFrame } from '../systems/AssetManifest.js';
import { sizeToActor } from '../systems/Layout.js';

/**
 * 위험이 **어디까지 미치는지** 예고하는 표시.
 *
 * 예고 소리와 몸짓만으로는 "무언가 온다"까지만 알 수 있고 "어디로 피해야 하는지"는
 * 알 수 없다. 차가 달릴 구간, 멧돼지가 돌진할 거리, 파도가 닿는 자리를 미리 두르면
 * 외워서가 아니라 **보고** 비켜설 수 있다 (플레이 리뷰 4차 9).
 *
 * **예고하는 동안에만** 나타난다. 늘 켜 두면 지형 위에 도형이 계속 얹혀 있게 된다.
 * 모든 위험이 같은 색·같은 깜빡임을 쓴다 — 표시가 종류마다 다르면 배울 것이 늘어난다.
 *
 * 두르는 것은 **위험이 미칠 범위 전체**다. 자동차는 달릴 차선 전부, 낙석은 떨어져
 * 내릴 기둥 전부, 멧돼지는 돌진해 갈 거리 전부. 일부만 그리면 표시 밖에 서 있다가
 * 맞는 일이 생겨서, 표시를 믿을 수 없게 된다.
 */
class WarnZone {
  constructor(scene, { x, y, w, h, depth = 30 }) {
    this.scene = scene;
    // 배경 그림이 빼곡한 도시 위에 얹히므로 **테두리만으로는 읽히지 않는다.**
    // 옅게나마 안쪽을 물들여야 "이 띠 전체가 위험한 자리"로 보인다
    this.box = scene.add
      .rectangle(x, y, Math.max(2, w), Math.max(2, h), PALETTE.warn, 0.28)
      .setStrokeStyle(4, PALETTE.warn, 1)
      .setDepth(depth)
      .setVisible(false);
  }

  /** 돌진 방향처럼 예고할 때가 되어야 정해지는 범위 */
  cover(x, y, w, h) {
    this.box.setPosition(x, y);
    this.box.setSize(Math.max(2, w), Math.max(2, h));
  }

  show() {
    if (this.blink) return;
    this.box.setVisible(true).setAlpha(0.45);
    this.blink = this.scene.tweens.add({
      targets: this.box,
      alpha: 1,
      duration: HAZARD.blink,
      yoyo: true,
      repeat: -1,
    });
  }

  hide() {
    this.blink?.remove();
    this.blink = null;
    this.box.setVisible(false);
  }
}

/** 그 시트·역할 칸에서 그림이 실제로 차지하는 상자 (`actors_city` → city) */
function boxOf(sheetKey, slot) {
  const theme = String(sheetKey).replace('actors_', '');
  return ACTOR_BOX[theme]?.[ACTOR_SLOTS[slot]] ?? null;
}

/** 칸을 통째로 쓰는 낱장 그림 */
const FULL_BOX = { w: 1, h: 1, foot: 0 };

/**
 * 크기 기준.
 *
 * 강아지 그림이 화면에서 71px 이고 실제로 0.4m 쯤 되므로 **1m 는 약 178px** 이다.
 * 위험 요소도 이 자로 재야 강아지 옆에 놓였을 때 크기가 맞아 보인다.
 * 예전 값(자동차 96px = 0.54m)은 강아지보다 조금 큰 정도라 장난감 같았다.
 */
class HazardBase extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, def, defaultSlot) {
    const key = def.texture || def.actors;
    const slot = def.slot ?? defaultSlot;
    // 낱장 텍스처를 지정한 경우엔 줄 개념이 없다
    super(scene, def.x, def.y, key, def.texture ? (def.frame ?? 0) : actorFrame(slot));

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setImmovable(true);
    this.def = def;
    this.effect = def.effect || 'kill';
    this.setDepth(def.depth ?? 18);
    this.box = (def.texture ? null : boxOf(key, slot)) ?? FULL_BOX;
    // height 는 **화면에서 그림이 차지할 높이**다. 칸 안 여백은 여기서 쳐 준다
    if (def.height) sizeToActor(this, { height: def.height }, this.box.h);

    // **def.y 는 그림의 밑동이다.** 칸 아래에 여백이 남은 시트는 그만큼 원점을 올려야
    // 지면에 세운 것이 땅에 발을 붙이고 선다
    this.setOrigin(def.originX ?? 0.5, def.originY ?? 1 - this.box.foot);

    if (!def.texture) {
      const anim = actorAnim(key, slot);
      if (anim && scene.anims.exists(anim)) this.play(anim);
    }
  }

  /**
   * **보이는 그림 크기에 맞춰** 몸을 잡는다. 비율은 그 그림에 대한 비율이다.
   *
   * Arcade 의 `setSize()` 는 넘긴 값을 **원본 픽셀로 보고 거기에 스케일을 다시**
   * 곱한다 (`Body.js`: `width = sourceWidth * _sx`). 그래서 화면 px 를 그대로 넘기면
   * 몸이 두 번 커진다 — 도시 자동차는 220px 로 보이는 그림에 **772×600 짜리 몸**이
   * 붙어 있었고, 차가 닿기 380px 전에 죽거나 위쪽 발판에 서 있어도 죽었다.
   *
   * 칸에는 여백이 있으므로 칸이 아니라 **그림 상자**(ACTOR_BOX)를 기준으로 잡는다.
   *
   * @param anchor 'center' 는 그림 가운데, 'bottom' 은 그림 **밑동**에 몸을 붙인다.
   *   땅을 딛고 다니는 것(자동차 바퀴 · 멧돼지 발)은 밑동이 기준이어야 지면에 선
   *   강아지와 제대로 부딪힌다.
   */
  fitBody(wRatio, hRatio, anchor = 'center') {
    const fw = this.frame.realWidth || this.frame.width;
    const fh = this.frame.realHeight || this.frame.height;
    const box = this.box;
    const bh = fh * box.h * hRatio;

    this.body.setSize(fw * box.w * wRatio, bh, true);

    const artBottom = fh * (1 - box.foot);
    const centerY = anchor === 'bottom' ? artBottom - bh / 2 : artBottom - (fh * box.h) / 2;
    this.body.offset.y += centerY - fh / 2;
  }

  /** 서브클래스에서 구현 */
  tick() {}
}

/**
 * 자동차가 화면에서 차지할 높이.
 *
 * 자로 재면 승용차는 1.4m 라 250px 이 맞지만, 그러면 화면 세로의 절반과 가로의 반
 * 가까이를 한 대가 덮는다. 길이 통째로 막힌 것처럼 보여 **피할 데가 없다**는 인상만
 * 남았다 (플레이 리뷰 4차 4). 작은 경차 크기로 낮춘다 — 뛰어넘지 못하는 것(몸높이
 * 117 > 점프 96)은 그대로라 "기다렸다 건넌다"는 규칙은 변하지 않는다.
 */
const CAR_HEIGHT = 150;

/**
 * 차선 밖에서 나타나고 사라지는 데 쓰는 거리 (갓길 350 안에 든다).
 *
 * 끝으로 갈수록 가파르게 빠져 차선 밖 70px 이면 거의 안 보이게 한다.
 * 생성기도 이 거리를 알아야 차선 주기를 맞출 수 있어 `config.HAZARD` 에 둔다.
 */
const CAR_FADE = HAZARD.carFade;

/**
 * 주기적으로 화면을 가로지르는 자동차.
 *
 * **오기 전에 소리가 먼저 온다.** 자동차는 점프로 못 넘고 달리기로도 못 따돌린다 —
 * 유일한 대처가 "길에 들어가지 않는 것"이므로, 들어갈지 말지를 정할 시간이 먼저
 * 있어야 한다 (플레이 리뷰 3차 · 방해 요소 기준 1). 그 시간 동안 **달릴 구간을
 * 네모로 둘러** 보여 준다.
 *
 * **뚝 멈춰 사라지지 않는다.** 차선 양끝을 넘어가면 갓길을 계속 달려 나가면서
 * 서서히 옅어진다 — 안개 낀 새벽 도시라 멀어지며 흐려지는 것으로 읽힌다
 * (플레이 리뷰 4차 6). 판정은 **차선 안에서만** 켜므로 갓길은 그대로 안전하다.
 *
 *   조용함 → 엔진 소리 + 차선 표시(예고) → 옅게 들어와 차선을 지나 옅게 나감 → 조용함
 */
export class Car extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: CAR_HEIGHT, ...def }, ACTOR.MOVER);
    this.dir = def.dir ?? -1;
    this.speed = def.speed ?? 260;
    this.laneFrom = def.fromX ?? def.x;
    this.laneTo = def.toX ?? def.x - 900;
    this.fadeRun = def.fadeRun ?? CAR_FADE;
    this.interval = def.interval ?? 3200;
    this.warnTime = def.warnTime ?? HAZARD.warnTime;
    this.timer = def.delay ?? 0;
    this.warned = false;
    this.active_ = false;
    // MOVER 시트의 그림은 **오른쪽을 본다.** 왼쪽으로 갈 때만 뒤집어야 앞으로 달린다 —
    // 반대로 걸려 있어서 차가 후진해 오는 것처럼 보였다 (플레이 리뷰 4차 3·7)
    this.setFlipX(this.dir < 0);
    this.fitBody(0.92, 0.78, 'bottom');
    this.setVisible(false);
    this.body.setEnable(false);
    this.baseY = def.y;

    // 진행 방향을 +로 삼은 좌표. 어느 쪽으로 달리든 한 줄로 놓고 잰다
    this.laneStart = this.dir * this.laneFrom;
    this.laneEnd = this.dir * this.laneTo;

    const x0 = Math.min(this.laneFrom, this.laneTo);
    const x1 = Math.max(this.laneFrom, this.laneTo);
    this.warn = new WarnZone(scene, {
      x: (x0 + x1) / 2,
      y: this.baseY - this.body.height / 2,
      w: x1 - x0,
      h: this.body.height,
      depth: (def.depth ?? 18) + 1,
    });
  }

  /**
   * 차선 밖에서는 서서히 나타나고 서서히 사라진다.
   *
   * 들어올 때는 **빨리 짙고**(멀리서부터 보여야 피할지 정한다), 나갈 때는
   * **빨리 엷어진다**(갓길에 선 강아지 위로 지나가는 시간을 줄인다).
   */
  laneAlpha(s) {
    if (s < this.laneStart) {
      const t = Phaser.Math.Clamp((s - this.laneStart + this.fadeRun) / this.fadeRun, 0, 1);
      return 1 - (1 - t) * (1 - t);
    }
    if (s > this.laneEnd) {
      const t = Phaser.Math.Clamp((s - this.laneEnd) / this.fadeRun, 0, 1);
      return (1 - t) ** 3;
    }
    return 1;
  }

  tick(time, delta) {
    if (!this.active_) {
      this.timer -= delta;
      if (this.timer > 0) return;

      // 소리를 내고 차선을 보여 준다. 이 동안 길에서 물러설 수 있다
      if (!this.warned) {
        this.warned = true;
        this.timer = this.warnTime;
        this.warn.show();
        this.scene.audio?.play('sfx_car_pass', { volume: 0.35 });
        return;
      }

      this.warned = false;
      this.timer = this.interval;
      this.active_ = true;
      this.warn.hide();
      this.setPosition(this.laneFrom - this.dir * this.fadeRun, this.baseY);
      this.setAlpha(0);
      this.setVisible(true);
      return;
    }

    this.x += this.dir * this.speed * (delta / 1000);
    // 노면을 달리는 느낌만 살짝 준다
    this.y = this.baseY + Math.sin(time / 90) * 1.5;

    const s = this.dir * this.x;
    this.setAlpha(this.laneAlpha(s));

    // 차선 안에서만 위험하다. 갓길은 나타나고 사라지는 구간이라 판정을 끈다
    const inLane = s >= this.laneStart && s <= this.laneEnd;
    if (this.body.enable !== inLane) this.body.setEnable(inLane);

    if (s > this.laneEnd + this.fadeRun) {
      this.active_ = false;
      this.setVisible(false);
      this.body.setEnable(false);
    }
  }
}

/**
 * 위에서 떨어지는 돌 / 화분.
 *
 * **떨어져 내릴 기둥 전체를 두른다.** 예전에는 바닥에 그림자만 그렸는데, 그러면
 * 떨어지는 길목을 지나가다 맞아도 어디가 위험했는지 알 수 없다. 돌은 바닥에 닿기
 * 전부터 위험하므로 **위험한 것은 기둥 전체**다 (플레이 리뷰 5차 2).
 * 바닥 그림자는 남겨 둔다 — 기둥이 어디로 내려앉는지를 짚어 주기 때문이다.
 */
export class FallingRock extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 82, ...def }, ACTOR.FALLER); // 떨어지는 것 0.45m
    this.startY = def.y;
    this.groundY = def.groundY ?? def.y + 300;
    this.interval = def.interval ?? 2600;
    this.warnTime = def.warnTime ?? HAZARD.warnTime;
    this.timer = def.delay ?? 0;
    this.phase = 'wait';
    this.setVisible(false);
    this.body.setEnable(false);
    this.fitBody(0.7, 0.7);

    // 떨어질 자리를 미리 두른다. 그림자를 **실제 몸 너비만큼** 벌려 두면 그 자체가
    // 범위 표시가 된다 — 다른 위험과 같은 색을 써서 "위험한 자리"로 읽히게 한다
    this.shadow = scene.add
      .ellipse(def.x, this.groundY, this.body.width, 14, PALETTE.warn, 0.25)
      .setStrokeStyle(2, PALETTE.warn, 0.9)
      .setDepth(6)
      .setVisible(false);

    // 떨어져 내릴 기둥 — 돌이 나타나는 자리부터 바닥까지
    const top = Math.min(this.startY - this.body.height, this.groundY);
    this.warn = new WarnZone(scene, {
      x: def.x,
      y: (top + this.groundY) / 2,
      w: this.body.width,
      h: this.groundY - top,
      depth: (def.depth ?? 18) + 1,
    });
  }

  tick(time, delta) {
    this.timer -= delta;

    if (this.phase === 'wait') {
      if (this.timer > 0) return;
      this.phase = 'telegraph';
      this.timer = this.warnTime;
      this.warn.show();
      this.shadow.setVisible(true).setScale(0.5);
      this.scene.tweens.add({ targets: this.shadow, scaleX: 1, scaleY: 1, duration: this.warnTime });
      return;
    }

    if (this.phase === 'telegraph') {
      if (this.timer > 0) return;
      this.phase = 'fall';
      this.warn.hide();
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

/**
 * 멧돼지 — 땅 긁기 0.7초 후 직선 돌진, 이후 경직.
 *
 * **예고하는 동안 강아지 쪽으로 몸을 돌리고 달릴 거리를 두른다.** 늘 한쪽으로만
 * 달리면 반대편에서 다가온 사람에게는 아무 일도 일어나지 않아 무엇을 하는 놈인지 알
 * 수 없고, 어디까지 오는지 모르면 얼마나 물러서야 할지도 정할 수 없다
 * (방해 요소 기준 1·2 · 플레이 리뷰 4차 9).
 *
 * 달리기(300)보다 빠르므로 도망칠 수는 없다. 대신 몸이 낮아 **뛰어넘을 수 있다.**
 */
export class Boar extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 145, ...def }, ACTOR.MOVER); // 멧돼지 0.8m
    this.homeX = def.x;
    this.range = def.range ?? 420;
    this.speed = def.speed ?? 420;
    this.phase = 'idle';
    this.warnTime = def.warnTime ?? HAZARD.warnTime;
    this.timer = def.delay ?? 1200;
    // 몸을 그림보다 낮게 잡는다 — 등 위로 **뛰어넘을 수 있어야** 피할 길이 생긴다.
    // 서서 뛰면 96px, 달리며 뛰면 112px 오르므로 84px 이면 넘어간다
    this.fitBody(0.85, 0.58, 'bottom');

    this.warn = new WarnZone(scene, {
      x: def.x,
      y: def.y - this.body.height / 2,
      w: this.range,
      h: this.body.height,
      depth: (def.depth ?? 18) + 1,
    });
  }

  tick(time, delta) {
    this.timer -= delta;

    if (this.phase === 'idle') {
      if (this.timer > 0) return;
      this.phase = 'telegraph';
      this.timer = this.warnTime;
      // 어디로 달릴지 정하고 그쪽을 본다 — MOVER 그림은 **오른쪽**을 보고 있으므로
      // 왼쪽으로 달릴 때만 뒤집는다 (플레이 리뷰 4차 7)
      const dog = this.scene.dog;
      this.chargeDir = dog && dog.x > this.x ? 1 : -1;
      this.setFlipX(this.chargeDir < 0);
      // 달려 나갈 거리를 두른다 — 얼마나 물러서야 하는지 눈으로 잰다
      this.warn.cover(
        this.homeX + (this.chargeDir * this.range) / 2,
        this.def.y - this.body.height / 2,
        this.range,
        this.body.height
      );
      this.warn.show();
      // 예고 — 앞발로 땅을 긁듯 좌우로 잘게 떤다. **예고가 끝날 때까지** 긁는다
      this.scene.tweens.add({
        targets: this,
        x: this.homeX + 8,
        duration: 90,
        yoyo: true,
        repeat: Math.max(1, Math.round(this.warnTime / 180) - 1),
        onComplete: () => this.setX(this.homeX),
      });
      this.scene.audio?.play('sfx_boar_snort', { volume: 0.5 });
      return;
    }

    if (this.phase === 'telegraph') {
      if (this.timer > 0) return;
      this.phase = 'charge';
      this.timer = (this.range / this.speed) * 1000;
      this.warn.hide();
      this.body.setVelocityX((this.chargeDir ?? -1) * this.speed);
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

/**
 * 밀려왔다 빠지는 파도 — 닿으면 뒤로 밀려난다.
 *
 * **어디까지 닿는지를 먼저 두른다.** 파도는 죽이지 않지만 밀려나면 왔던 길로
 * 되돌아가야 하므로, 물러설 자리를 미리 알 수 있어야 한다 (플레이 리뷰 4차 9).
 */
export class Wave extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 190, ...def, effect: 'push' }, ACTOR.FALLER); // 파도 1.05m
    this.restX = def.x;
    this.reachX = def.reachX ?? def.x + 420;
    this.interval = def.interval ?? 3600;
    this.warnTime = def.warnTime ?? HAZARD.warnTime;
    this.timer = def.delay ?? 0;
    this.phase = 'idle';
    this.fitBody(0.9, 0.8);
    this.setAlpha(0.85);
    this.setDepth(def.depth ?? 22);

    const x0 = Math.min(this.restX, this.reachX);
    const x1 = Math.max(this.restX, this.reachX);
    this.warn = new WarnZone(scene, {
      x: (x0 + x1) / 2,
      y: def.y - this.body.height / 2,
      w: x1 - x0 + this.body.width,
      h: this.body.height,
      depth: (def.depth ?? 22) + 1,
    });
  }

  tick(time, delta) {
    this.timer -= delta;
    if (this.timer > 0) return;

    if (this.phase === 'idle') {
      this.phase = 'warn';
      this.timer = this.warnTime;
      this.warn.show();
      return;
    }

    this.phase = 'idle';
    this.timer = this.interval;
    this.warn.hide();

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

/**
 * 하수구 증기 — 위로 밀어 올린다.
 *
 * **나오기 전에 네모로 자리를 알려 준다.** 예고 없이 뿜으면 외워서 피하는 수밖에
 * 없지만, 자리를 먼저 보여 주면 보고 판단할 수 있다.
 *
 *   조용함  →  네모 깜빡임(예고)  →  뿜는 동안만 판정  →  다시 조용함
 *
 * 판정은 **뿜는 동안에만** 켠다. 예전에는 보이지 않는 동안에도 몸이 살아 있어서,
 * 아무것도 없는 자리에서 갑자기 떠올랐다.
 */
export class SteamVent extends HazardBase {
  constructor(scene, def) {
    super(scene, { height: 290, ...def, effect: 'lift' }, ACTOR.PUFF); // 증기 기둥 1.6m
    this.setDepth(def.depth ?? 12);
    this.setAlpha(0);
    this.fitBody(0.5, 0.9, 'bottom');
    this.body.setEnable(false);

    this.liftPower = def.power ?? -430;
    this.interval = def.interval ?? 2400;
    this.warnTime = def.warnTime ?? HAZARD.warnTime;
    this.activeTime = def.activeTime ?? 1200;
    this.timer = def.delay ?? 0;
    this.phase = 'idle';
    this.baseScaleY = this.scaleY;

    // 예고 표시 — 뿜어 나올 자리를 **몸 그대로** 두른다. 다른 위험과 같은 색·같은 깜빡임
    this.warn = new WarnZone(scene, {
      x: this.x,
      y: this.y - this.body.height / 2,
      w: this.body.width,
      h: this.body.height,
      depth: (def.depth ?? 12) + 1,
    });
  }

  setPhase(phase) {
    this.phase = phase;
    if (phase === 'warn') this.warn.show();
    else this.warn.hide();
    this.body.setEnable(phase === 'blow');
  }

  tick(time, delta) {
    this.timer -= delta;
    if (this.timer > 0) return;

    if (this.phase === 'idle') {
      this.setPhase('warn');
      this.timer = this.warnTime;
      return;
    }

    if (this.phase === 'warn') {
      this.setPhase('blow');
      this.timer = this.activeTime;
      this.scene.audio?.play('sfx_steam', { volume: 0.35 });
      this.setScale(this.scaleX, this.baseScaleY * 0.3);
      this.scene.tweens.add({
        targets: this,
        alpha: 0.8,
        scaleY: this.baseScaleY,
        duration: 260,
        ease: 'Quad.easeOut',
      });
      return;
    }

    this.setPhase('idle');
    this.timer = this.interval;
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
