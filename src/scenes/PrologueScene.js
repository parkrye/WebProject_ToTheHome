import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { sizeTo } from '../systems/Layout.js';

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
const GROUND_Y = 478;

const CUTS = [
  { id: 'p1', sky: 'bg_field_sky_morning', dogX: 560, ownerX: 430, duration: 6200, tint: 0xffffff },
  { id: 'p2', sky: 'bg_field_sky_noon', dogX: 520, ownerX: 452, duration: 6200, tint: 0xffffff },
  { id: 'p3', sky: 'bg_field_sky_evening', dogX: 396, ownerX: 556, duration: 6800, tint: 0xf0d0c0 },
];

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
    this.cameras.main.fadeIn(900, 0, 0, 0);
    this.audio.playBgm(this, 'bgm_prologue');

    this.input.on('pointerdown', () => this.skipCut());
    this.input.keyboard.on('keydown', () => this.skipCut());

    this.playCut(0);
  }

  /* --------------------------------------------------------------- */

  clearCut() {
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
    const owner = this.add.sprite(cut.ownerX, GROUND_Y + 10, 'owner_child_run').setOrigin(0.5, 1);
    sizeTo(owner, { height: 190 });
    owner.play('owner_child_run');
    owner.setTint(cut.tint);

    const dog = this.add.sprite(cut.dogX, GROUND_Y + 10, 'dog_puppy_run').setOrigin(0.5, 1);
    sizeTo(dog, { height: 84 });
    dog.play('dog_puppy_run');
    dog.setTint(cut.tint);

    this.layerGroup.add(owner);
    this.layerGroup.add(dog);

    // 앞쪽 풀은 인물보다 앞에 그려져야 깊이가 산다
    const near = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'bg_field_near').setOrigin(0);
    near.setTint(cut.tint);
    this.layerGroup.add(near);
    this.scrollers.push({ tile: near, speed: 150 });

    // 달리는 상하 진동
    [owner, dog].forEach((sprite, i) => {
      this.tweens.add({
        targets: sprite,
        y: GROUND_Y + 2,
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

  /** 밤. 집 안. 자고 있는 강아지에게 주인이 다가온다 */
  playNightCut() {
    const room = this.add.image(0, 0, 'bg_home_interior_night').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.layerGroup.add(room);

    const dog = this.add.sprite(640, 452, 'dog_sleep').setOrigin(0.5, 1);
    sizeTo(dog, { height: 96 });
    dog.play('dog_sleep');
    this.layerGroup.add(dog);

    const owner = this.add.sprite(150, 462, 'owner_walk_silhouette').setOrigin(0.5, 1).setAlpha(0);
    sizeTo(owner, { height: 210 });
    this.layerGroup.add(owner);

    this.layerGroup.add(
      this.add.image(0, 0, 'ui_vignette').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setAlpha(0.9)
    );

    // 걸어와서 강아지 곁에 멈춘다. 걷는 모션은 루프고, 어디서 멈출지는 여기서 정한다
    this.tweens.add({ targets: owner, alpha: 1, duration: 900, delay: 700 });
    this.tweens.add({
      targets: owner,
      x: 560,
      duration: 4200,
      delay: 1200,
      ease: 'Sine.easeInOut',
      onStart: () => owner.play('owner_walk_silhouette'),
      onComplete: () => owner.anims.stop(),
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
    const fade = isLast ? 2200 : 800;

    this.cameras.main.fadeOut(fade, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      if (isLast) return this.finish();
      this.playCut(this.cutIndex + 1);
      this.cameras.main.fadeIn(700, 0, 0, 0);
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
