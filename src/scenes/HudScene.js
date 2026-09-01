import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';

/**
 * 화면 위 UI — 터치 컨트롤, 일시정지, 세로 화면 회전 안내.
 * 문자를 쓰지 않으므로 전부 픽토그램이다.
 */
export default class HudScene extends Phaser.Scene {
  constructor() {
    super('Hud');
  }

  create() {
    this.inputSystem = this.registry.get('input');
    this.audio = this.registry.get('audio');

    this.touchButtons = [];
    this.buildTouchControls();
    this.buildPauseButton();
    this.buildRotateNotice();

    // 터치 기기에서만 가상 패드를 보여준다
    this.showTouch(false);
    this.input.on('pointerdown', (pointer) => {
      if (pointer.wasTouch) this.showTouch(true);
    });
    if (this.sys.game.device.input.touch && !this.sys.game.device.os.desktop) this.showTouch(true);

    this.scale.on('resize', () => this.updateRotateNotice());
    this.updateRotateNotice();
  }

  makeButton(x, y, texture, scale, name) {
    const button = this.add
      .image(x, y, texture)
      .setScrollFactor(0)
      .setDepth(100)
      .setScale(scale)
      .setAlpha(0.55)
      .setInteractive({ useHandCursor: true });

    const press = () => {
      this.inputSystem.setTouch(name, true);
      button.setAlpha(0.9).setScale(scale * 0.92);
    };
    const release = () => {
      this.inputSystem.setTouch(name, false);
      button.setAlpha(0.55).setScale(scale);
    };

    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.touchButtons.push(button);
    return button;
  }

  buildTouchControls() {
    const bottom = GAME_HEIGHT - 78;
    this.makeButton(96, bottom, 'ui_btn_left', 0.62, 'left');
    this.makeButton(208, bottom, 'ui_btn_right', 0.62, 'right');
    this.makeButton(152, bottom - 96, 'ui_btn_down', 0.5, 'down');

    this.makeButton(GAME_WIDTH - 100, bottom, 'ui_btn_jump', 0.62, 'jump');
    this.makeButton(GAME_WIDTH - 216, bottom - 44, 'ui_btn_interact', 0.52, 'interact');
  }

  showTouch(show) {
    this.touchVisible = show;
    this.touchButtons.forEach((button) => button.setVisible(show));
    if (!show) this.inputSystem.clearTouch();
  }

  buildPauseButton() {
    this.pauseButton = this.add
      .image(GAME_WIDTH - 48, 48, 'ui_pause_icon')
      .setScrollFactor(0)
      .setDepth(100)
      .setScale(0.5)
      .setAlpha(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    this.pausePanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(110).setVisible(false);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0b12, 0.72);
    const resume = this.add
      .image(-110, 0, 'ui_icon_paw')
      .setScale(0.6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.togglePause());
    const home = this.add
      .image(110, 0, 'ui_icon_house')
      .setScale(0.6)
      .setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.quitToTitle());
    this.pausePanel.add([shade, resume, home]);
  }

  togglePause() {
    const stage = this.scene.get('Stage');
    if (!stage || !stage.scene.isActive()) return;

    this.paused = !this.paused;
    this.pausePanel.setVisible(this.paused);
    this.inputSystem.clearTouch();
    this.audio.play('sfx_ui_select', { volume: 0.4 });

    if (this.paused) {
      this.scene.pause('Stage');
      return;
    }
    this.scene.resume('Stage');
  }

  quitToTitle() {
    this.paused = false;
    this.pausePanel.setVisible(false);
    this.inputSystem.clearTouch();
    this.audio.stopBgm(this, 500);
    this.audio.stopAmbience(this);
    this.scene.resume('Stage');
    this.scene.stop('Stage');
    this.scene.stop();
    this.scene.start('Title');
  }

  buildRotateNotice() {
    this.rotateNotice = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(120).setVisible(false);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0b12, 0.92);
    const icon = this.add.image(0, 0, 'ui_rotate_device').setScale(0.9);
    this.rotateNotice.add([shade, icon]);
    this.tweens.add({ targets: icon, angle: -12, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  updateRotateNotice() {
    const isPortrait = this.scale.parentSize.height > this.scale.parentSize.width * 1.05;
    const onPhone = this.sys.game.device.input.touch && !this.sys.game.device.os.desktop;
    this.rotateNotice.setVisible(isPortrait && onPhone);
  }
}
