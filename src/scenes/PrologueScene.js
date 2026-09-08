import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FADE } from '../config.js';
import { sizeTo } from '../systems/Layout.js';
import { HOME } from '../systems/AssetManifest.js';
import { isReal } from '../systems/AssetLoader.js';

/**
 * 프롤로그 — 대사 없는 4컷.
 *
 *   아침: 강아지가 약간 앞선다
 *   낮  : 둘이 나란하다
 *   저녁: 주인이 앞선다
 *   밤  : 자고 있는 강아지에게 주인이 걸어온다 → 암전
 *
 * 컷 1~3 의 들판은 스테이지 4 와 같은 장소다.
 */

// 배경 그림에 이미 들판이 그려져 있으므로 지면을 따로 깔지 않는다.
// 이 값은 인물이 풀 사이에 서 보이는 높이다.
const GROUND_Y = 496;

/**
 * 강아지는 아이보다 **조금 아래**를 딛는다.
 *
 * 앞쪽 풀(`bg_field_near`)은 y=525 부터 화면을 꽉 채우고, y=480 근처는 4분의 1밖에
 * 덮지 않는다. 예전처럼 강아지를 띄워 두면 아이만 풀 사이에 서 있고 강아지는 그 위
 * 허공을 나는 것으로 보였다. 발을 풀이 짙어지는 높이까지 내려야 땅을 딛은 것이 된다.
 *
 * 키가 84px 이라 이만큼 내려도 머리(y≈438)는 성긴 풀 위로 나온다. 아이보다 조금 앞
 * 지면을 딛는 셈이라 오히려 앞뒤 거리로 읽힌다.
 */
const PUPPY_DROP = 16;

/**
 * 밤 컷(집 안)의 기준 치수. 화면은 960 x 540 이다.
 *
 * 배경 그림 속 문은 높이 430px 이고 실제 문은 2m 다. 그래서 **1m 는 약 215px**.
 * 사람도 강아지도 이 자로 재야 방 안에 같이 있는 것으로 보인다.
 * 예전 값(어른 210px)은 1m 도 안 돼서 인형처럼 보였다.
 */
const FLOOR_Y = 505;
const ADULT_H = 376; // 1.75m
/**
 * 배경 그림 속 방석을 덮는 값.
 * `props_home` 은 384px 칸에 그림이 바닥 가운데로 앉아 있어, 여백까지 쳐서 환산한다
 * (방석 그림은 칸 안에서 300 x 173).
 */
const CUSHION = { x: 720, y: 513, w: 346, h: 240 };
/** 방 부품은 밝은 램프빛 아래에서 그려졌다. 밤 방 밝기에 맞춰 눌러 준다 */
const ROOM_TINT = 0x8b7d6d;

/**
 * 컷마다 누가 앞서는지가 다르다.
 *
 * 다만 **가만히 앞서 있는 게 아니라 서로 앞뒤로 오간다.** 둘의 흔들림 주기를 어긋나게
 * 두면 앞서거니 뒤서거니 하면서 노는 것처럼 보인다. `lead` 는 그 평균 위치일 뿐이다.
 */
const CENTER_X = 494;

/**
 * 강아지는 컷마다 **조금씩 자란다.**
 *
 * 세 컷은 하루가 아니라 함께 자란 몇 해다. 아이는 그림 하나뿐이라 키를 못 바꾸지만,
 * 강아지가 커지는 것만으로 시간이 흘렀다는 게 읽힌다 (플레이 리뷰 2차 4).
 * 한 컷에 12% 씩만 키운다 — 더 키우면 자란 게 아니라 다른 개가 된다.
 */
const CUTS = [
  // lead: 평균적으로 앞서는 거리 (+ 면 강아지가 앞) / dogH: 그 컷의 강아지 키
  { id: 'p1', sky: 'bg_field_sky_morning', lead: 70, duration: 7400, tint: 0xffffff, play: 1.0, dogH: 72 },
  { id: 'p2', sky: 'bg_field_sky_noon', lead: 0, duration: 7400, tint: 0xffffff, play: 1.05, dogH: 82 },
  // 저녁 — 아이가 앞서고 강아지의 걸음이 느려진다
  { id: 'p3', sky: 'bg_field_sky_evening', lead: -80, duration: 7800, tint: 0xf0d0c0, play: 0.8, dogH: 92 },
];

/** 앞뒤로 오가는 폭과 주기. 둘의 주기를 어긋나게 둬야 서로 스쳐 지나간다 */
const WEAVE = {
  dog: { amp: 78, duration: 1700 },
  owner: { amp: 54, duration: 2300 },
};

export default class PrologueScene extends Phaser.Scene {
  constructor() {
    super('Prologue');
  }

  create() {
    this.audio = this.registry.get('audio');
    const input = this.registry.get('input');
    input.attach(this);
    input.clearTouch();

    this.cutIndex = 0;
    this.busy = false;

    this.layerGroup = this.add.container(0, 0);
    this.cameras.main.fadeIn(FADE.in, 0, 0, 0);
    this.audio.playBgm(this, 'bgm_prologue');

    this.input.on('pointerdown', () => this.skipCut());
    this.input.keyboard.on('keydown', () => this.skipCut());

    this.playCut(0);
  }

  /* --------------------------------------------------------------- */

  clearCut() {
    // 트윈부터 끊는다.
    //
    // addCounter 로 만든 트윈은 대상이 스프라이트가 아니라 내부 객체라, 스프라이트를
    // 지워도 **혼자 살아남아 매 프레임 죽은 객체를 건드린다.** 그러면 그 예외가 트윈
    // 매니저의 갱신을 통째로 끊어서, 다음 컷이 반쯤만 그려진다.
    this.tweens.killAll();
    this.layerGroup.removeAll(true);
    if (this.scrollers) this.scrollers.length = 0;
  }

  playCut(index) {
    this.clearCut();
    this.cutIndex = index;
    this.scrollers = [];

    if (index < CUTS.length) return this.playFieldCut(CUTS[index]);
    return this.playNightCut();
  }

  /** 들판에서 함께 달리는 컷 */
  playFieldCut(cut) {
    const sky = this.add.image(0, 0, cut.sky).setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.layerGroup.add(sky);

    [
      { key: 'bg_field_far', speed: 14 },
      { key: 'bg_field_mid', speed: 42 },
    ].forEach(({ key, speed }) => {
      const tile = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, key).setOrigin(0);
      tile.setTint(cut.tint);
      this.layerGroup.add(tile);
      this.scrollers.push({ tile, speed });
    });

    // 달리는 둘 — 앞서는 쪽이 컷마다 바뀐다.
    // 강아지는 아직 어리므로 아이보다 확실히 작아야 한다.
    const ownerX = CENTER_X - cut.lead / 2;
    const dogX = CENTER_X + cut.lead / 2;

    const owner = this.add.sprite(ownerX, GROUND_Y + 10, 'owner_child_run').setOrigin(0.5, 1);
    sizeTo(owner, { height: 190 });
    owner.play('owner_child_run');
    owner.setTint(cut.tint);

    const dog = this.add.sprite(dogX, GROUND_Y + 10 + PUPPY_DROP, 'dog_puppy_run').setOrigin(0.5, 1);
    sizeTo(dog, { height: cut.dogH ?? 84 });
    dog.play('dog_puppy_run');
    dog.setTint(cut.tint);
    dog.anims.timeScale = cut.play;

    this.layerGroup.add(owner);
    this.layerGroup.add(dog);

    // 서로 앞뒤로 오간다 — 노는 것처럼 보이게 하는 핵심
    this.weave(dog, dogX, WEAVE.dog, cut.play);
    this.weave(owner, ownerX, WEAVE.owner, 1);

    // 앞쪽 풀은 인물보다 앞에 그려져야 깊이가 산다
    const near = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_field_near').setOrigin(0);
    near.setTint(cut.tint);
    this.layerGroup.add(near);
    this.scrollers.push({ tile: near, speed: 150 });

    // 달리는 상하 진동
    [[owner, 0], [dog, PUPPY_DROP]].forEach(([sprite, drop], i) => {
      this.tweens.add({
        targets: sprite,
        y: GROUND_Y + 2 + drop,
        duration: 260 + i * 30,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.layerGroup.add(
      this.add.image(0, 0, 'ui_vignette').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.75)
    );

    this.queueNext(cut.duration);
  }

  /**
   * 앞뒤로 오가게 한다.
   *
   * 앞으로 나갈 때는 다리도 빨라지고 몸이 살짝 앞으로 기운다. 위치만 흔들면
   * 미끄러지는 것처럼 보이고, 다리 속도까지 같이 움직여야 "더 달린다"로 읽힌다.
   */
  weave(sprite, baseX, { amp, duration }, playScale) {
    this.tweens.add({
      targets: sprite,
      x: baseX + amp,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      onUpdate: (tw) => {
        if (!sprite.active || !sprite.anims) return;
        sprite.anims.timeScale = playScale * (0.82 + 0.42 * tw.getValue());
      },
    });
  }

  /** 밤. 집 안. 자고 있는 강아지에게 주인이 다가온다 */
  playNightCut() {
    const room = this.add.image(0, 0, 'bg_home_interior_night').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.layerGroup.add(room);

    // 배경 그림에는 강아지가 방석에서 자고 있다. 그 위에 스프라이트를 또 세우면
    // 강아지가 둘이 된다. 빈 방석으로 덮고, 그 자리에 숨쉬는 스프라이트를 눕힌다.
    if (isReal('props_home')) {
      this.layerGroup.add(
        this.add.image(CUSHION.x, CUSHION.y, 'props_home', HOME.CUSHION)
          .setOrigin(0.5, 1)
          .setDisplaySize(CUSHION.w, CUSHION.h)
          .setTint(ROOM_TINT)
      );

      // 방 안의 자로 재야 한다. 어른(1.75m)이 376px 이므로 1px 은 약 4.7mm 다.
      // 몸을 말고 자는 강아지는 60cm 남짓이라 130px 쯤 된다 — 예전 값(200)은 1m 에
      // 가까워서 방석을 넘치고 어른만 하게 보였다 (플레이 리뷰 2차 3)
      const dog = this.add.sprite(CUSHION.x, CUSHION.y - 22, 'dog_sleep').setOrigin(0.5, 1);
      sizeTo(dog, { width: 130 });
      dog.play('dog_sleep');
      this.layerGroup.add(dog);
    }

    // 사람 키는 방 크기에서 나온다 — 문 높이 573px 이 2m 이므로 1px 은 약 3.5mm 다.
    // 어른(1.75m)은 490px 쯤 되어야 하고, 그보다 작으면 인형처럼 보인다.
    const owner = this.add.sprite(150, FLOOR_Y, 'owner_walk_silhouette').setOrigin(0.5, 1).setAlpha(0);
    sizeTo(owner, { height: ADULT_H });
    this.layerGroup.add(owner);

    this.layerGroup.add(
      this.add.image(0, 0, 'ui_vignette').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.9)
    );

    // 걸어와서 강아지 곁에 멈춘다. 걷는 모션은 루프고, 어디서 멈출지는 여기서 정한다
    this.tweens.add({ targets: owner, alpha: 1, duration: 900, delay: 700 });
    this.tweens.add({
      targets: owner,
      x: CUSHION.x - 185, // 방석 옆에 멈춰 선다
      duration: 4200,
      delay: 1200,
      ease: 'Sine.easeInOut',
      onStart: () => owner.play('owner_walk_silhouette'),
      // 걷다 멈춘 자리의 아무 칸에서 서 버리면 어색하다. 서 있는 칸으로 되돌린다
      onComplete: () => {
        owner.anims.stop();
        owner.setFrame(0);
      },
    });

    this.audio.play('sfx_whine', { volume: 0.25 });
    this.queueNext(7600);
  }

  queueNext(delay) {
    this.busy = false;
    if (this.pending) this.pending.remove(false);
    this.pending = this.time.delayedCall(delay, () => this.advance());
  }

  skipCut() {
    if (this.busy) return;
    this.advance();
  }

  advance() {
    if (this.busy) return;
    this.busy = true;
    if (this.pending) this.pending.remove(false);

    const isLast = this.cutIndex >= CUTS.length;
    const fade = isLast ? FADE.clear : FADE.cut;

    this.cameras.main.fadeOut(fade, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (isLast) return this.finish();
      this.playCut(this.cutIndex + 1);
      this.cameras.main.fadeIn(FADE.cut, 0, 0, 0);
    });
  }

  finish() {
    const save = this.registry.get('save');
    save.markPrologueSeen();
    save.enterStage(1);
    this.audio.stopBgm(this, 900);
    this.time.delayedCall(600, () => this.scene.start('Stage', { stageId: 1 }));
  }

  update(time, delta) {
    if (!this.scrollers) return;
    const step = delta / 1000;
    this.scrollers.forEach(({ tile, speed }) => {
      tile.tilePositionX += speed * step;
    });
  }
}
