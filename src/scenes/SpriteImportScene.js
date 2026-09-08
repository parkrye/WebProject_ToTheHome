import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETTE, FADE } from '../config.js';
import { injectUserSprites } from '../systems/AssetLoader.js';
import { SPRITE_SHEETS } from '../systems/AssetManifest.js';
import { sizeTo, UI_SIZE } from '../systems/Layout.js';

/**
 * "직접 스프라이트 추가해서 시작".
 *
 * 파일명이 에셋 key 와 같은 8프레임 가로 시트 PNG 를 고르면 그 자리에서 교체된다.
 * (예: dog_walk.png → dog_walk 애니메이션)
 * 문자를 쓰지 않으므로 안내는 8칸 격자 픽토그램과 미리보기로 한다.
 */
export default class SpriteImportScene extends Phaser.Scene {
  constructor() {
    super('SpriteImport');
  }

  create() {
    this.audio = this.registry.get('audio');
    const input = this.registry.get('input');
    input.attach(this);

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x1a1620).setOrigin(0);
    sizeTo(this.add.image(GAME_WIDTH / 2, 92, 'ui_icon_bone').setAlpha(0.9), { height: UI_SIZE.menuIcon * 0.8 });

    this.drawFrameGuide(GAME_WIDTH / 2, 200);

    // 미리보기 — 지금 적용된 강아지 걷기
    this.preview = this.add.sprite(GAME_WIDTH / 2, 372, 'dog_walk').setScale(1.3);
    this.preview.play('dog_walk');

    this.acceptedIcons = [];

    // 파일 선택 버튼 (뼈다귀) / 시작 버튼 (발자국)
    this.pickButton = sizeTo(this.add.image(GAME_WIDTH / 2 - 110, 452, 'ui_icon_bone'), {
      height: UI_SIZE.menuIcon * 0.8,
    });
    this.pickButton.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.openPicker());

    this.startButton = sizeTo(this.add.image(GAME_WIDTH / 2 + 110, 452, 'ui_icon_paw'), {
      height: UI_SIZE.menuIcon * 0.8,
    });
    this.startButton.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.begin());

    this.tweens.add({
      targets: [this.pickButton, this.startButton],
      y: 446,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.fileInput = this.createFileInput();

    this.keys = this.input.keyboard.addKeys('SPACE,ENTER,ESC,E');
    this.cameras.main.fadeIn(FADE.out, 0, 0, 0);
  }

  /** 8칸 격자 — "가로 8프레임 시트" 를 문자 없이 알린다 */
  drawFrameGuide(cx, cy) {
    const cell = 56;
    const total = cell * 8;
    const left = cx - total / 2;

    const g = this.add.graphics();
    g.lineStyle(2, PALETTE.uiLine, 0.85);
    for (let i = 0; i < 8; i++) {
      g.strokeRect(left + i * cell, cy - 28, cell, 56);
    }

    // 각 칸에 순서를 뜻하는 점을 찍는다 (숫자 대신)
    for (let i = 0; i < 8; i++) {
      for (let d = 0; d <= i; d++) {
        const perRow = 4;
        const col = d % perRow;
        const row = Math.floor(d / perRow);
        this.add.circle(left + i * cell + 12 + col * 9, cy + 12 + row * 9, 2.4, PALETTE.scent, 0.9);
      }
    }

    // 화살표
    this.add.triangle(left + total + 26, cy, 0, -9, 14, 0, 0, 9, PALETTE.ui, 0.8);
  }

  createFileInput() {
    const el = document.createElement('input');
    el.type = 'file';
    el.accept = 'image/png,image/webp';
    el.multiple = true;
    el.style.display = 'none';
    document.body.appendChild(el);

    el.addEventListener('change', async () => {
      if (!el.files || !el.files.length) return;
      const applied = await injectUserSprites(this, el.files);
      this.onApplied(applied, el.files.length);
      el.value = '';
    });

    this.events.once('shutdown', () => el.remove());
    return el;
  }

  openPicker() {
    this.audio.play('sfx_ui_select');
    this.fileInput.click();
  }

  onApplied(appliedKeys, attempted) {
    // 적용된 개수만큼 발바닥 도장을 찍는다 (문자 없이 결과 표시)
    this.acceptedIcons.forEach((icon) => icon.destroy());
    this.acceptedIcons = appliedKeys.map((key, i) =>
      sizeTo(this.add.image(120 + (i % 12) * 60, 506 + Math.floor(i / 12) * 26, 'ui_icon_paw').setAlpha(0.9), {
        height: 26,
      })
    );

    if (appliedKeys.length) {
      this.registry.get('save').set({ customSprites: true });
      this.audio.play('jingle_save', { volume: 0.5 });
      // 걷기 미리보기를 새 텍스처로 다시 만든다
      this.preview.destroy();
      this.preview = this.add.sprite(GAME_WIDTH / 2, 372, 'dog_walk').setScale(1.3);
      this.preview.play('dog_walk');
    }

    if (appliedKeys.length < attempted) {
      // 이름이 맞지 않은 파일이 있었다 — 규칙을 다시 보여준다
      this.cameras.main.shake(180, 0.004);
      this.flashKeyHint();
    }
  }

  /** 이름 규칙 힌트 — 알려진 key 를 발바닥 아이콘 줄로 늘어놓는다 */
  flashKeyHint() {
    if (this.hintGroup) this.hintGroup.forEach((o) => o.destroy());
    const dogKeys = SPRITE_SHEETS.filter((d) => d.key.startsWith('dog_')).slice(0, 10);
    this.hintGroup = dogKeys.map((def, i) => {
      const icon = this.add
        .sprite(90 + i * 78, 300, def.key)
        .setScale(0.5)
        .setAlpha(0);
      if (this.anims.exists(def.key)) icon.play(def.key);
      this.tweens.add({ targets: icon, alpha: 0.85, duration: 300, yoyo: true, hold: 1600, onComplete: () => icon.destroy() });
      return icon;
    });
  }

  begin() {
    if (this.locked) return;
    this.locked = true;
    this.audio.play('sfx_page_turn');
    this.cameras.main.fadeOut(FADE.out, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      const save = this.registry.get('save');
      save.set({ stage: 0, checkpoint: null, prologueSeen: false });
      this.audio.stopBgm(this, 300);
      this.scene.start('Prologue');
    });
  }

  update() {
    if (this.locked) return;
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || Phaser.Input.Keyboard.JustDown(this.keys.ENTER)) this.begin();
    if (Phaser.Input.Keyboard.JustDown(this.keys.E)) this.openPicker();
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      this.locked = true;
      this.scene.start('Title');
    }
  }
}
