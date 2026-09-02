import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETTE } from '../config.js';
import { sizeTo, UI_SIZE } from '../systems/Layout.js';

/**
 * 타이틀. 문자를 쓰지 않으므로 메뉴는 픽토그램 세 개다.
 *   발자국 = 그냥 시작 / 뼈다귀 = 스프라이트 추가해서 시작 / 집 = 이어하기(저장이 있을 때만)
 */
export default class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create() {
    const input = this.registry.get('input');
    const save = this.registry.get('save');
    this.audio = this.registry.get('audio');
    input.attach(this);
    input.clearTouch();

    this.buildBackdrop();

    sizeTo(this.add.image(GAME_WIDTH / 2, 168, 'ui_title_logo').setDepth(10), {
      height: UI_SIZE.titleLogo,
    });

    // 메뉴 구성
    this.items = [
      { key: 'ui_icon_paw', action: () => this.startNewGame() },
      { key: 'ui_icon_bone', action: () => this.startWithSprites() },
    ];
    if (save.hasProgress) {
      this.items.push({ key: 'ui_icon_house', action: () => this.continueGame() });
    }

    const spacing = 150;
    const startX = GAME_WIDTH / 2 - ((this.items.length - 1) * spacing) / 2;

    this.items.forEach((item, i) => {
      const icon = this.add.image(startX + i * spacing, 386, item.key).setDepth(10);
      sizeTo(icon, { height: UI_SIZE.menuIcon });
      icon.setInteractive({ useHandCursor: true });

      icon.on('pointerover', () => this.select(i));
      icon.on('pointerdown', () => {
        this.select(i);
        this.confirm();
      });
      item.icon = icon;

      this.tweens.add({
        targets: icon,
        y: 380,
        duration: 1800 + i * 260,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
      });
    });

    this.index = 0;
    this.select(0);

    // 선택 표시 — 커서 대신 강아지가 그 앞에 앉는다
    this.marker = this.add.sprite(startX, 470, 'dog_idle').setDepth(11);
    sizeTo(this.marker, { height: UI_SIZE.markerDog });
    this.marker.play('dog_idle');

    this.cursors = this.input.keyboard.createCursorKeys();
    this.confirmKeys = this.input.keyboard.addKeys('SPACE,ENTER,E');

    this.input.once('pointerdown', () => this.audio.unlock());
    this.input.keyboard.once('keydown', () => this.audio.unlock());

    this.cameras.main.fadeIn(700, 0, 0, 0);
    this.time.delayedCall(300, () => this.audio.playBgm(this, 'bgm_title'));
  }

  buildBackdrop() {
    const sky = this.add.image(0, 0, 'bg_field_sky_morning').setOrigin(0).setDepth(0);
    sky.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);

    ['bg_field_far', 'bg_field_mid', 'bg_field_near'].forEach((key, i) => {
      const layer = this.add.image(0, 0, key).setOrigin(0).setDepth(1 + i);
      layer.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      layer.setAlpha(0.95);
    });

    this.add.image(0, 0, 'ui_vignette').setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_HEIGHT).setDepth(9).setAlpha(0.3);

    // 떠다니는 냄새 입자
    for (let i = 0; i < 7; i++) {
      const mote = this.add
        .image(Phaser.Math.Between(60, GAME_WIDTH - 60), Phaser.Math.Between(220, 460), 'ui_scent_mote')
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(8)
        .setAlpha(0.35);
      sizeTo(mote, { height: Phaser.Math.Between(22, 40) });
      this.tweens.add({
        targets: mote,
        y: mote.y - Phaser.Math.Between(50, 110),
        alpha: 0.1,
        duration: Phaser.Math.Between(4000, 7000),
        yoyo: true,
        repeat: -1,
      });
    }
  }

  select(index) {
    if (this.index === index && this.selectedOnce) return;
    this.selectedOnce = true;
    this.index = Phaser.Math.Clamp(index, 0, this.items.length - 1);

    this.items.forEach((item, i) => {
      const on = i === this.index;
      sizeTo(item.icon, { height: on ? UI_SIZE.menuIcon * 1.16 : UI_SIZE.menuIcon });
      item.icon.setAlpha(on ? 1 : 0.72);
    });

    if (this.marker) {
      this.tweens.add({
        targets: this.marker,
        x: this.items[this.index].icon.x,
        duration: 220,
        ease: 'Sine.easeOut',
      });
    }
    this.audio.play('sfx_ui_select', { volume: 0.4 });
  }

  confirm() {
    if (this.locked) return;
    this.locked = true;
    this.audio.unlock();
    this.audio.play('sfx_page_turn');
    const action = this.items[this.index].action;
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', action);
  }

  startNewGame() {
    const save = this.registry.get('save');
    save.reset();
    this.audio.stopBgm(this, 400);
    this.scene.start('Prologue');
  }

  startWithSprites() {
    this.scene.start('SpriteImport');
  }

  continueGame() {
    const save = this.registry.get('save');
    this.audio.stopBgm(this, 400);
    if (!save.data.prologueSeen) {
      this.scene.start('Prologue');
      return;
    }
    const stage = Math.max(1, save.data.stage);
    this.scene.start('Stage', { stageId: stage, fromCheckpoint: true });
  }

  update() {
    if (this.locked) return;

    if (Phaser.Input.Keyboard.JustDown(this.cursors.left)) this.select(this.index - 1);
    if (Phaser.Input.Keyboard.JustDown(this.cursors.right)) this.select(this.index + 1);

    const confirmed =
      Phaser.Input.Keyboard.JustDown(this.confirmKeys.SPACE) ||
      Phaser.Input.Keyboard.JustDown(this.confirmKeys.ENTER) ||
      Phaser.Input.Keyboard.JustDown(this.confirmKeys.E);

    if (confirmed) this.confirm();
  }
}
