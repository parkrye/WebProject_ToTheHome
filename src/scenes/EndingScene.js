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

/**
 * 방 안 기준 치수 — 배경 그림에서 재서 정한다 (화면은 960 x 540).
 *
 * 그림 속 문틀은 y 21~451, 폭은 x 131~336 이다. 실제 문이 2m 이므로
 * **1m 는 약 215px** 이다. 사람도 강아지도 이 자로 재야 방 안에 같이 있는 것으로 보인다.
 * 예전 값(어른 240px)은 1.1m 라 아이보다도 작았다.
 * 문 부품은 그림 속 문(이미 열려 있다)을 **덮어야** 하므로 그림보다 조금 크게 얹는다.
 */
const DOOR = { x: 233, y: 453, h: 447 };
const FLOOR_Y = GAME_HEIGHT - 70; // 방바닥 (침대 쪽. 문보다 카메라에 가깝다)
const BED_X = GAME_WIDTH - 250;
const ADULT_H = 376; // 1.75m
const DOG_H = 104; // 어깨높이 0.48m — 실제보다 조금 키워야 문 너머에서 눈에 든다
/** 그림 속 방석 — 강아지가 자고 있는 채로 그려져 있어 덮어야 한다 */
const CUSHION = { x: 709, y: 481, w: 250, h: 74 };
/**
 * 방 부품에 씌우는 색.
 *
 * `props_home` 은 밝은 램프빛 아래에서 그려졌는데 이 방은 밤이라 훨씬 어둡다.
 * 그대로 얹으면 문만 환해서 **붙여 놓은 티**가 난다. 방 밝기에 맞춰 눌러 준다.
 */
const ROOM_TINT = 0x8b7d6d;

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
      const put = (frame, height, depth, x = DOOR.x, y = DOOR.y) =>
        sizeTo(this.add.image(x, y, home, frame).setOrigin(0.5, 1).setDepth(depth), { height });

      // 빛은 원래 밝아야 하므로 톤을 누르지 않는다
      this.doorLight = put(HOME.LIGHT, DOOR.h - 30, 8);
      this.doorway = put(HOME.DOORWAY, DOOR.h, 11).setTint(ROOM_TINT);
      this.door = put(HOME.DOOR, DOOR.h, 12).setTint(ROOM_TINT);
      this.doorLight.setAlpha(0);
      this.doorway.setAlpha(0);

      // 배경 그림에는 강아지가 방석에서 자고 있다. 프롤로그에서는 그게 맞지만
      // 엔딩에서는 강아지가 밖에서 돌아오므로, 빈 방석으로 덮어 둔다.
      // 그림 속 방석은 낮은 각도라 납작하다. 부품도 눌러서 맞춘다.
      this.add
        .image(CUSHION.x, CUSHION.y, home, HOME.CUSHION)
        .setOrigin(0.5, 1)
        .setDisplaySize(CUSHION.w, CUSHION.h)
        .setTint(ROOM_TINT)
        .setDepth(5);
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
    sizeTo(owner, { height: ADULT_H });
    owner.play('owner_adult_wake');
    await this.wait(1500);

    // 3. 문으로 걸어간다 — 걷는 모션과 이동은 따로다
    if (this.anims.exists('owner_adult_walk')) owner.play('owner_adult_walk');
    owner.setFlipX(true); // 왼쪽 문을 향한다
    await this.tweenTo(owner, { x: DOOR.x + 155 }, 3200);
    owner.anims.stop();

    // 4. 문이 열린다 — 닫힌 문을 치우면 그 자리에 빛과 빈 문틀이 남는다
    this.audio.play('sfx_bark_soft', { volume: 0.5 });
    this.tweenTo(this.door, { alpha: 0 }, 700);
    this.tweenTo(this.doorLight, { alpha: 1 }, 900);
    this.tweenTo(this.doorway, { alpha: 1 }, 700);
    await this.wait(900);

    // 5. 문틀 구멍 뒤에 강아지가 서 있다 — 평소 쓰던 그 스프라이트다
    // 문틀 구멍 뒤에 선다 — 문 바닥선은 방바닥보다 위다 (문이 벽 안쪽에 있다)
    const dog = this.add.sprite(DOOR.x, DOOR.y, 'dog_idle').setOrigin(0.5, 1).setDepth(10).setAlpha(0);
    sizeTo(dog, { height: DOG_H });
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
    sizeTo(awake, { height: ADULT_H });
    awake.play('owner_adult_wake');
    awake.anims.stop();
    awake.setFrame(4); // 침대에 걸터앉은 자세에서 멈춘다

    await this.fadeIn(2600);
    await this.wait(2600);

    // 10. 문 쪽을 바라본다 — 문 앞 바닥에 냄새 입자 하나
    const mote = sizeTo(
      this.add
        .image(DOOR.x + 40, DOOR.y - 8, 'ui_scent_mote')
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
