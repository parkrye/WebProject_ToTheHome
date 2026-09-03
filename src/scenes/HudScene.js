import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT } from '../config.js';
import { sizeTo, UI_SIZE } from '../systems/Layout.js';

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

    // 씬 인스턴스는 다시 시작해도 그대로 재사용된다. 남은 상태를 여기서 지운다
    this.paused = false;
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

  makeButton(x, y, texture, size, name) {
    const button = this.add.image(x, y, texture).setScrollFactor(0).setDepth(100).setAlpha(0.55);
    sizeTo(button, { height: size });
    button.setInteractive({ useHandCursor: true });

    const baseW = button.displayWidth;
    const baseH = button.displayHeight;

    const press = () => {
      this.inputSystem.setTouch(name, true);
      button.setAlpha(0.9).setDisplaySize(baseW * 0.92, baseH * 0.92);
    };
    const release = () => {
      this.inputSystem.setTouch(name, false);
      button.setAlpha(0.55).setDisplaySize(baseW, baseH);
    };

    button.on('pointerdown', press);
    button.on('pointerup', release);
    button.on('pointerout', release);
    button.on('pointerupoutside', release);

    this.touchButtons.push(button);
    return button;
  }

  buildTouchControls() {
    const bottom = GAME_HEIGHT - 68;
    this.makeButton(84, bottom, 'ui_btn_left', UI_SIZE.touchButton, 'left');
    this.makeButton(186, bottom, 'ui_btn_right', UI_SIZE.touchButton, 'right');
    this.makeButton(135, bottom - 86, 'ui_btn_down', UI_SIZE.touchButton * 0.8, 'down');

    this.makeButton(GAME_WIDTH - 88, bottom, 'ui_btn_jump', UI_SIZE.jumpButton, 'jump');
    this.makeButton(GAME_WIDTH - 194, bottom - 46, 'ui_btn_interact', UI_SIZE.touchButton * 0.85, 'interact');
  }

  showTouch(show) {
    this.touchVisible = show;
    this.touchButtons.forEach((button) => button.setVisible(show));
    if (!show) this.inputSystem.clearTouch();
  }

  buildPauseButton() {
    this.pauseButton = this.add
      .image(GAME_WIDTH - 42, 42, 'ui_pause_icon')
      .setScrollFactor(0)
      .setDepth(100)
      .setAlpha(0.5);
    sizeTo(this.pauseButton, { height: UI_SIZE.pauseIcon });
    this.pauseButton.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());

    this.input.keyboard.on('keydown-ESC', () => this.togglePause());

    this.pausePanel = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2).setDepth(110).setVisible(false);
    const shade = this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x0d0b12, 0.72);
    const panel = this.textures.exists('ui_pause_panel')
      ? sizeTo(this.add.image(0, 0, 'ui_pause_panel'), { height: UI_SIZE.pausePanel })
      : null;
    const resume = sizeTo(this.add.image(-96, 6, 'ui_icon_paw'), { height: UI_SIZE.menuIcon * 0.72 });
    resume.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.togglePause());
    const home = sizeTo(this.add.image(96, 6, 'ui_icon_house'), { height: UI_SIZE.menuIcon * 0.72 });
    home.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.quitToTitle());
    this.pausePanel.add([shade, panel, resume, home].filter(Boolean));
  }

  togglePause() {
    const stage = this.scene.get('Stage');
    // 멈춰 있는 씬은 isActive() 가 false 다. 그것만 보면 한 번 멈춘 뒤로는
    // 재개 버튼도 ESC 도 여기서 되돌아가 영영 풀리지 않는다
    if (!stage || !(stage.scene.isActive() || stage.scene.isPaused())) return;

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
    const icon = sizeTo(this.add.image(0, 0, 'ui_rotate_device'), { height: UI_SIZE.rotateNotice });
    this.rotateNotice.add([shade, icon]);
    this.tweens.add({ targets: icon, angle: -12, duration: 1400, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  updateRotateNotice() {
    const isPortrait = this.scale.parentSize.height > this.scale.parentSize.width * 1.05;
    const onPhone = this.sys.game.device.input.touch && !this.sys.game.device.os.desktop;
    this.rotateNotice.setVisible(isPortrait && onPhone);
  }
}
