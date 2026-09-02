import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { sizeTo, UI_SIZE } from '../systems/Layout.js';
import { HOME } from '../systems/AssetManifest.js';
import { isReal } from '../systems/AssetLoader.js';

/**
 * 엔딩 — 대사 없음.
 *
 * 문 밖의 소리 → 일어난다 → 문으로 걸어간다 → 문이 열리고 강아지가 서 있다 →
 * 무릎을 꿇고 팔을 벌린다 → 강아지가 품으로 → 빛 → 암전 → 잠에서 깬다(꿈) → 문 쪽을 본다.
 *
 * 장면을 통째로 그린 그림은 쓰지 않는다. 닫힌 문 · 빈 문틀 · 쏟아지는 빛은 각각 부품이고,
 * 문틀 구멍 뒤에 세우는 강아지는 게임 내내 쓰던 그 스프라이트다. 겹치고 옮기는 건 여기서 한다.
 */

const DOOR_X = 196;
const FLOOR_Y = GAME_HEIGHT - 70; // 배경 그림의 바닥선
const BED_X = GAME_WIDTH - 330;

export default class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create() {
    this.audio = this.registry.get('audio');
    const input = this.registry.get('input');
    input.attach(this);
    input.clearTouch();

    this.add.image(0, 0, 'bg_home_interior_night').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(0);

    this.buildRoom();

    this.add
      .image(0, 0, 'ui_vignette')
      .setOrigin(0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT)
      .setDepth(40)
      .setAlpha(0.45);

    this.cameras.main.fadeIn(2000, 0, 0, 0);
    this.audio.playAmbience(this, 'amb_room_night');
    this.audio.playBgm(this, 'bgm_ending');

    this.sequence();
  }

  /**
   * 방 안 부품.
   *
   * 침대·램프·창문 같은 가구는 배경 그림에 이미 들어 있으므로 얹지 않는다.
   * 문만 부품으로 올린다 — 닫아 두었다가 열어야 하기 때문이다.
   * 실제 부품 시트가 없으면 문 연출을 건너뛰고 빛만으로 표현한다.
   */
  buildRoom() {
    const home = 'props_home';
    this.hasHome = isReal(home);

    if (this.hasHome) {
      const put = (frame, height, depth, x = DOOR_X, y = FLOOR_Y) =>
        sizeTo(this.add.image(x, y, home, frame).setOrigin(0.5, 1).setDepth(depth), { height });

      this.doorLight = put(HOME.LIGHT, 260, 8);
      this.doorway = put(HOME.DOORWAY, 270, 11);
      this.door = put(HOME.DOOR, 270, 12);
      this.doorLight.setAlpha(0);
      this.doorway.setAlpha(0);

      // 배경 그림에는 강아지가 방석에서 자고 있다. 프롤로그에서는 그게 맞지만
      // 엔딩에서는 강아지가 밖에서 돌아오므로, 빈 방석으로 덮어 둔다.
      put(HOME.CUSHION, 46, 5, GAME_WIDTH - 300, FLOOR_Y - 4);
      return;
    }

    // 부품이 아직 없다 — 배경 그림의 문을 그대로 두고 아무것도 얹지 않는다
    this.doorLight = null;
    this.doorway = null;
    this.door = null;
  }

  wait(ms) {
    return new Promise((resolve) => this.time.delayedCall(ms, resolve));
  }

  fadeOut(ms) {
    this.cameras.main.fadeOut(ms, 0, 0, 0);
    return new Promise((resolve) => this.cameras.main.once('camerafadeoutcomplete', resolve));
  }

  fadeIn(ms) {
    this.cameras.main.fadeIn(ms, 0, 0, 0);
    return this.wait(ms);
  }

  tweenTo(target, props, duration, ease = 'Sine.easeInOut') {
    if (!target) return Promise.resolve();
    return new Promise((resolve) => {
      this.tweens.add({ targets: target, ...props, duration, ease, onComplete: resolve });
    });
  }

  async sequence() {
    await this.wait(2600);

    // 1. 문 밖에서 나는 소리
    this.audio.play('sfx_scratch_door', { volume: 0.6 });
    await this.wait(1200);
    this.audio.play('sfx_whine', { volume: 0.55 });
    await this.wait(1300);

    // 2. 침대에서 일어난다
    const owner = this.add.sprite(BED_X, FLOOR_Y, 'owner_adult_wake').setOrigin(0.5, 1).setDepth(20);
    sizeTo(owner, { height: 240 });
    owner.play('owner_adult_wake');
    await this.wait(1500);

    // 3. 문으로 걸어간다 — 걷는 모션과 이동은 따로다
    if (this.anims.exists('owner_adult_walk')) owner.play('owner_adult_walk');
    owner.setFlipX(true); // 왼쪽 문을 향한다
    await this.tweenTo(owner, { x: DOOR_X + 120 }, 3200);
    owner.anims.stop();

    // 4. 문이 열린다 — 닫힌 문을 치우면 그 자리에 빛과 빈 문틀이 남는다
    this.audio.play('sfx_bark_soft', { volume: 0.5 });
    this.tweenTo(this.door, { alpha: 0 }, 700);
    this.tweenTo(this.doorLight, { alpha: 1 }, 900);
    this.tweenTo(this.doorway, { alpha: 1 }, 700);
    await this.wait(900);

    // 5. 문틀 구멍 뒤에 강아지가 서 있다 — 평소 쓰던 그 스프라이트다
    const dog = this.add.sprite(DOOR_X, FLOOR_Y, 'dog_idle').setOrigin(0.5, 1).setDepth(10).setAlpha(0);
    sizeTo(dog, { height: 92 });
    dog.play('dog_idle');
    await this.tweenTo(dog, { alpha: 1 }, 900);
    await this.wait(700);

    // 6. 무릎을 꿇고 두 팔을 벌린다
    if (this.anims.exists('owner_adult_kneel')) owner.play('owner_adult_kneel');
    await this.wait(1200);

    // 7. 강아지가 품으로 달려든다
    dog.setDepth(21);
    if (this.anims.exists('dog_run')) dog.play('dog_run');
    await this.tweenTo(dog, { x: owner.x - 30 }, 700, 'Quad.easeIn');

    // 8. 껴안는 순간은 빛에 가려진다
    this.cameras.main.flash(1400, 255, 244, 216);
    await this.wait(1700);

    await this.fadeOut(2400);
    owner.destroy();
    dog.destroy();
    await this.wait(1600);

    // 9. 꿈에서 깨어난다 — 같은 방, 아무도 없다. 문은 다시 닫혀 있다
    if (this.door) this.door.setAlpha(1);
    if (this.doorLight) this.doorLight.setAlpha(0);
    if (this.doorway) this.doorway.setAlpha(0);

    const awake = this.add.sprite(BED_X, FLOOR_Y, 'owner_adult_wake').setOrigin(0.5, 1).setDepth(20);
    sizeTo(awake, { height: 240 });
    awake.play('owner_adult_wake');
    awake.anims.stop();
    awake.setFrame(4); // 침대에 걸터앉은 자세에서 멈춘다

    await this.fadeIn(2600);
    await this.wait(2600);

    // 10. 문 쪽을 바라본다 — 문 앞 바닥에 냄새 입자 하나
    const mote = sizeTo(
      this.add
        .image(DOOR_X + 40, FLOOR_Y - 8, 'ui_scent_mote')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(30)
        .setAlpha(0),
      { height: 44 }
    );
    this.tweens.add({ targets: mote, alpha: 0.85, duration: 2400, ease: 'Sine.easeInOut' });
    this.tweens.add({ targets: mote, y: mote.y - 12, duration: 2600, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });

    await this.wait(4200);

    // 11. 크레딧 — 픽토그램만
    await this.fadeOut(2600);
    this.credits();
  }

  async credits() {
    this.children.removeAll(true);
    this.cameras.main.setBackgroundColor(0x12131a);
    await this.fadeIn(1200);

    sizeTo(this.add.image(GAME_WIDTH / 2, 190, 'ui_title_logo').setAlpha(0.95), { height: UI_SIZE.titleLogo * 0.9 });
    const marks = sizeTo(this.add.image(GAME_WIDTH / 2, 372, 'ui_credits_marks').setAlpha(0), {
      height: UI_SIZE.creditsMarks,
    });
    this.tweens.add({ targets: marks, alpha: 0.9, duration: 1600 });

    const paw = sizeTo(this.add.image(GAME_WIDTH / 2, 456, 'ui_icon_paw').setAlpha(0), { height: 72 });
    this.tweens.add({ targets: paw, alpha: 1, duration: 900, delay: 2400 });
    this.tweens.add({ targets: paw, y: 446, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut', delay: 2400 });

    paw.setInteractive({ useHandCursor: true });
    const back = () => {
      if (this.leaving) return;
      this.leaving = true;
      this.audio.stopBgm(this, 900);
      this.audio.stopAmbience(this);
      this.cameras.main.fadeOut(1200, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Title'));
    };

    this.time.delayedCall(2400, () => {
      paw.on('pointerdown', back);
      this.input.keyboard.on('keydown', back);
    });
  }
}
