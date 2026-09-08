import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETTE, DOG, FADE } from '../config.js';
import { sizeTo, UI_SIZE } from '../systems/Layout.js';

/**
 * 타이틀. 문자를 쓰지 않으므로 메뉴는 픽토그램 세 개다.
 *   발자국 = 그냥 시작 / 뼈다귀 = 스프라이트 추가해서 시작 / 집 = 이어하기(저장이 있을 때만)
 */

/**
 * 선택 표시 강아지가 아이콘 사이를 옮겨 다니는 속도.
 *
 * 걸음 속도(160px/s) 그대로면 아이콘 하나 옮기는 데 1초가 걸려 메뉴가 답답하다.
 * 대신 다리도 같은 배율로 빨리 놀려서 발이 미끄러져 보이지 않게 한다.
 */
const MARKER_SPEED = 320;
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

    // 씬 인스턴스는 다시 시작해도 그대로 재사용된다. confirm() 이 걸어 둔 자물쇠가
    // 남아 있으면 홈으로 돌아왔을 때 메뉴가 통째로 먹통이 된다.
    //
    // 선택 표시 강아지도 마찬가지다. 지난 방문에서 **이미 파괴된 스프라이트**가
    // 그대로 남아 있어서, 그걸 걸어가게 하려다 예외가 나면 create() 가 중간에
    // 끊긴다 — 타이틀이 시작되다 만 채로 활성 씬이 하나도 없어져 화면이 검게
    // 멈춘다 (플레이 리뷰 2차 10)
    this.locked = false;
    this.selectedOnce = false;
    this.marker = null;

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

    // 선택 표시 — 커서 대신 강아지가 그 앞에 앉는다.
    // **고르기 전에 세워 둔다.** select() 가 이 강아지를 걸어가게 하기 때문이다
    this.marker = this.add.sprite(startX, 470, 'dog_idle').setDepth(11);
    sizeTo(this.marker, { height: UI_SIZE.markerDog });
    this.marker.play('dog_idle');

    this.index = 0;
    this.select(0);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.confirmKeys = this.input.keyboard.addKeys('SPACE,ENTER,E');

    this.input.once('pointerdown', () => this.audio.unlock());
    this.input.keyboard.once('keydown', () => this.audio.unlock());

    this.cameras.main.fadeIn(FADE.in, 0, 0, 0);
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

    this.walkMarkerTo(this.items[this.index].icon.x);
    this.audio.play('sfx_ui_select', { volume: 0.4 });
  }

  /**
   * 선택 표시 강아지가 **걸어서** 옮겨 간다.
   *
   * 위치만 트윈으로 밀면 앉은 자세 그대로 옆으로 슉 미끄러진다. 걷는 시트로 바꾸고
   * **이전 위치 기준으로** 가는 쪽을 보게 뒤집어야 "저 아이콘까지 걸어갔다"로 읽힌다.
   * 도착하면 다시 앉고, 보던 방향은 그대로 남는다.
   *
   * dog_idle 과 dog_walk 은 칸 안 여백이 같아서(SHEET_FILL 0.96) 시트를 바꿔도
   * 크기가 튀지 않는다.
   */
  walkMarkerTo(x) {
    const dog = this.marker;
    if (!dog || Math.abs(x - dog.x) < 1) return;

    // 옮기는 도중에 또 고르면 앞선 트윈이 남아 두 방향으로 끌린다
    this.tweens.killTweensOf(dog);
    dog.setFlipX(x < dog.x);
    dog.play('dog_walk', true);
    dog.anims.timeScale = MARKER_SPEED / DOG.walkSpeed;

    this.tweens.add({
      targets: dog,
      x,
      duration: Math.max(180, (Math.abs(x - dog.x) / MARKER_SPEED) * 1000),
      ease: 'Sine.easeInOut',
      onComplete: () => {
        dog.anims.timeScale = 1;
        dog.play('dog_idle', true);
      },
    });
  }

  confirm() {
    if (this.locked) return;
    this.locked = true;
    this.audio.unlock();
    this.audio.play('sfx_page_turn');
    const action = this.items[this.index].action;
    this.cameras.main.fadeOut(FADE.out, 0, 0, 0);
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
