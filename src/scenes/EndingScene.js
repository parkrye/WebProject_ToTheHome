import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETTE } from '../config.js';
import { sizeTo, UI_SIZE } from '../systems/Layout.js';

/**
 * 엔딩 — 대사 없음.
 *
 * 문 밖의 소리 → 일어나 문을 연다 → 재회 → 암전 → 잠에서 깬다(꿈) → 문 쪽을 본다.
 * 마지막에 문 앞 바닥에만 냄새 입자 하나가 남는다.
 */
export default class EndingScene extends Phaser.Scene {
  constructor() {
    super('Ending');
  }

  create() {
    this.audio = this.registry.get('audio');
    const input = this.registry.get('input');
    input.attach(this);
    input.clearTouch();

    this.room = this.add.image(0, 0, 'bg_home_interior_night').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    this.vignette = this.add
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

  async sequence() {
    await this.wait(2600);

    // 1. 문 밖에서 나는 소리
    this.audio.play('sfx_scratch_door', { volume: 0.6 });
    await this.wait(1100);
    this.audio.play('sfx_whine', { volume: 0.55 });
    await this.wait(1400);

    // 2. 일어나서 문으로
    const wake = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 'owner_adult_wake').setDepth(20).setScale(1.9);
    wake.play('owner_adult_wake');
    await this.wait(1400);
    this.audio.play('sfx_bark_soft', { volume: 0.5 });
    await this.wait(1200);
    wake.destroy();

    // 3. 재회
    const hug = this.add.sprite(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 30, 'owner_dog_hug').setDepth(20).setScale(1.9);
    hug.play('owner_dog_hug');
    this.cameras.main.flash(1200, 255, 244, 216);
    await this.wait(2600);

    // 4. 암전
    await this.fadeOut(2400);
    hug.destroy();
    await this.wait(1600);

    // 5. 꿈에서 깨어난다 — 같은 방, 아무도 없다
    await this.fadeIn(2600);
    const awake = this.add.sprite(GAME_WIDTH / 2 + 120, GAME_HEIGHT / 2 + 30, 'owner_adult_wake').setDepth(20).setScale(1.7);
    awake.play('owner_adult_wake');
    awake.anims.pause(awake.anims.currentAnim.frames[3]);
    await this.wait(3200);

    // 6. 문 쪽을 바라본다 — 바닥에 냄새 입자 하나
    const mote = sizeTo(
      this.add.image(196, GAME_HEIGHT - 128, 'ui_scent_mote').setBlendMode(Phaser.BlendModes.ADD).setDepth(30).setAlpha(0),
      { height: 44 }
    );
    this.tweens.add({ targets: mote, alpha: 0.85, duration: 2400, ease: 'Sine.easeInOut' });

    await this.wait(4200);

    // 7. 크레딧 — 픽토그램만
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
