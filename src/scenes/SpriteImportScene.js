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
 *
 * **설명은 실물로 한다.** 예전에는 빈 네모 여덟 칸에 점을 하나씩 늘려 찍어 "가로
 * 8프레임"을 알리려 했는데, 그 격자가 무엇을 뜻하는지도 아래 두 단추가 무엇을 하는지도
 * 읽히지 않았다 (플레이 리뷰 5차 4). 지금 쓰이고 있는 시트를 **여덟 칸으로 실제로
 * 펼쳐 놓고**, 화살표로 그 아래 움직이는 미리보기에 잇는다 — 넣어야 할 것이 무엇이고
 * 넣으면 무엇이 되는지가 한 화면에 같이 있다.
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

    // 돌아가기 — 왼윗 구석. 게임 밖 화면에서 나가는 길이 있어야 한다
    this.backButton = sizeTo(this.add.image(46, 42, 'ui_btn_left'), { height: 40 }).setAlpha(0.5);
    this.backButton
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => this.backButton.setAlpha(0.9))
      .on('pointerout', () => this.backButton.setAlpha(0.5))
      .on('pointerdown', () => this.goBack());

    sizeTo(this.add.image(GAME_WIDTH / 2, 74, 'ui_icon_bone').setAlpha(0.9), { height: 54 });

    this.drawSheetExample(GAME_WIDTH / 2, 178);

    // 미리보기 — 여덟 칸을 이어 붙이면 이렇게 움직인다
    this.preview = this.add.sprite(GAME_WIDTH / 2, 330, 'dog_walk');
    sizeTo(this.preview, { height: 104 });
    this.preview.play('dog_walk');

    this.acceptedIcons = [];

    // 파일 선택 버튼 (뼈다귀 + 그림 파일) / 시작 버튼 (발자국 + 나아가기)
    this.pickButton = this.buildButton(GAME_WIDTH / 2 - 130, 418, 'ui_icon_bone', 'file', () =>
      this.openPicker()
    );
    this.startButton = this.buildButton(GAME_WIDTH / 2 + 130, 418, 'ui_icon_paw', 'go', () =>
      this.begin()
    );

    this.tweens.add({
      targets: [this.pickButton, this.startButton],
      y: 412,
      duration: 1700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.fileInput = this.createFileInput();

    this.keys = this.input.keyboard.addKeys('SPACE,ENTER,ESC,E');
    this.cameras.main.fadeIn(FADE.out, 0, 0, 0);
  }

  /**
   * **지금 쓰이고 있는 시트를 그대로 여덟 칸에 펼친다.**
   *
   * 빈 네모와 점으로 "8프레임"을 설명하는 대신 진짜 그림을 한 칸씩 보여 준다.
   * 넣어야 할 파일이 어떻게 생겼는지 그 자체가 예시가 되고, 새 시트를 넣으면
   * 이 줄도 같이 바뀌므로 **제대로 들어갔는지도 여기서 보인다.**
   */
  drawSheetExample(cx, cy) {
    if (this.sheetCells) this.sheetCells.forEach((o) => o.destroy());
    this.sheetCells = [];

    const cell = 62;
    const total = cell * 8;
    const left = cx - total / 2;
    const key = 'dog_walk';
    const frames = this.textures.exists(key) ? this.textures.get(key).getFrameNames().length : 0;

    for (let i = 0; i < 8; i += 1) {
      const x = left + i * cell + cell / 2;
      const box = this.add
        .rectangle(x, cy, cell - 4, cell - 4, PALETTE.uiLine, 0.12)
        .setStrokeStyle(2, PALETTE.uiLine, 0.85);
      this.sheetCells.push(box);

      if (i >= frames) continue;
      const shot = this.add.image(x, cy, key, i);
      sizeTo(shot, { height: cell - 18 });
      this.sheetCells.push(shot);
    }

    // 여덟 칸이 이어져 한 동작이 된다 — 아래 미리보기로 잇는 화살표
    this.sheetCells.push(
      // Phaser 의 세모는 **꼭짓점의 최댓값**으로 크기를 잡고 그 절반을 원점으로 삼는다.
      // 음수 좌표를 섞으면 그림이 원점에서 밀려나므로 좌표를 0 부터 잡는다
      this.add.triangle(cx, cy + cell / 2 + 26, 0, 0, 24, 0, 12, 18, PALETTE.ui, 0.8)
    );
  }

  /**
   * 단추 하나 = **아이콘 + 그 아래 표.**
   *
   * 아이콘은 넷 다 같은 모양의 둥근 메달이라 그림만으로는 구별되지 않는다. 그렇다고
   * 메달 위에 표를 얹으면 무늬에 묻혀 흠집처럼 보인다. 아래에 따로 떼어 놓는다.
   *
   *   file — 그림 파일 한 장 (모서리가 접힌 종이 + 산과 해). "파일을 고른다"
   *   go   — 오른쪽을 가리키는 세모. "이대로 시작한다"
   *
   * 통째로 하나의 컨테이너다. 위아래로 흔들리는 트윈이 표까지 같이 들고 다녀야
   * 아이콘과 표가 한 물건으로 읽힌다.
   */
  buildButton(x, y, key, badge, onPick) {
    const button = this.add.container(x, y);
    const icon = sizeTo(this.add.image(0, 0, key), { height: UI_SIZE.menuIcon * 0.8 });
    button.add(icon);

    if (badge === 'file') {
      button.add([
        // 모서리가 접힌 종이 한 장
        this.add.rectangle(0, 62, 30, 38, PALETTE.ui, 0.16).setStrokeStyle(2, PALETTE.ui, 0.85),
        this.add.triangle(10, 47, 0, 0, 10, 0, 10, 10, PALETTE.ui, 0.85),
        // 그림 파일이라는 뜻 — 안에 작은 산과 해
        this.add.triangle(-2, 69, 0, 14, 9, 0, 18, 14, PALETTE.ui, 0.85),
        this.add.circle(9, 56, 3, PALETTE.ui, 0.85),
      ]);
    } else {
      button.add(this.add.triangle(0, 62, 0, 0, 20, 12, 0, 24, PALETTE.ui, 0.9));
    }

    button.setSize(110, 150);
    button.setInteractive({ useHandCursor: true }).on('pointerdown', onPick);
    return button;
  }

  goBack() {
    if (this.locked) return;
    this.locked = true;
    this.audio.play('sfx_ui_select', { volume: 0.4 });
    this.scene.start('Title');
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
      sizeTo(this.add.image(120 + (i % 12) * 60, 524, 'ui_icon_paw').setAlpha(0.9), {
        height: 26,
      })
    );

    if (appliedKeys.length) {
      this.registry.get('save').set({ customSprites: true });
      this.audio.play('jingle_save', { volume: 0.5 });
      // 걷기 미리보기와 여덟 칸 예시를 새 텍스처로 다시 만든다 —
      // 넣은 것이 그대로 여기 뜨므로 제대로 들어갔는지 눈으로 확인된다
      this.preview.destroy();
      this.preview = this.add.sprite(GAME_WIDTH / 2, 330, 'dog_walk');
      sizeTo(this.preview, { height: 104 });
      this.preview.play('dog_walk');
      this.drawSheetExample(GAME_WIDTH / 2, 178);
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
      // 시트마다 원본 크기가 달라서 배율로 맞추면 줄이 들쭉날쭉해진다
      const icon = sizeTo(this.add.sprite(90 + i * 78, 250, def.key).setAlpha(0), { height: 52 });
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.goBack();
  }
}
