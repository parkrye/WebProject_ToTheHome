/**
 * 기억 조각 — 주워 모으는 것.
 *
 * **정규 루트에서 벗어난 자리**에만 둔다. 냄새 입자가 가리키는 길로만 가면 지나치게 되고,
 * 위로 올라가거나 아래로 내려가 보아야 닿는다. 지도를 복잡하게 만드는 것이 이것의 일이다.
 *
 * 문자도 숫자도 쓰지 않는다. 주우면 빛이 위로 흩어지고, 화면 구석의 그림 하나가 켜진다.
 * 모은 것은 엔딩에서 방 안의 빛으로 돌아온다.
 */

import Phaser from 'phaser';
import { sizeTo } from '../systems/Layout.js';

export class Keepsake extends Phaser.GameObjects.Container {
  /** @param {object} def { id, x, y } */
  constructor(scene, def) {
    super(scene, def.x, def.y);
    scene.add.existing(this);

    this.id = def.id;
    this.taken = false;
    this.setDepth(def.depth ?? 14);

    // 뒤에 깔리는 빛 — 멀리서도 "저기 뭔가 있다"가 읽혀야 한다
    this.glow = scene.add
      .image(0, 0, 'ui_scent_mote')
      .setBlendMode(Phaser.BlendModes.ADD)
      .setAlpha(0.75);
    sizeTo(this.glow, { height: 72 });
    this.add(this.glow);

    this.icon = scene.add.image(0, 0, 'ui_icon_bone');
    sizeTo(this.icon, { height: 34 });
    this.add(this.icon);

    scene.physics.add.existing(this);
    this.body.setAllowGravity(false);
    this.body.setSize(52, 52);
    this.body.setOffset(-26, -26);

    scene.tweens.add({
      targets: this,
      y: def.y - 10,
      duration: 1600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
    scene.tweens.add({
      targets: this.glow,
      alpha: 0.35,
      scale: this.glow.scale * 0.82,
      duration: 1100,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  /** 주웠다. 빛이 위로 흩어진다 */
  take() {
    if (this.taken) return false;
    this.taken = true;
    this.body.setEnable(false);

    this.scene.tweens.add({
      targets: this,
      y: this.y - 70,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
      onComplete: () => this.destroy(),
    });
    this.scene.tweens.add({
      targets: this.glow,
      scale: this.glow.scale * 2.6,
      alpha: 0,
      duration: 700,
      ease: 'Quad.easeOut',
    });
    return true;
  }
}

/**
 * 화면 구석의 표시줄.
 *
 * 숫자를 쓸 수 없으므로 **그 스테이지에 있는 개수만큼 그림을 늘어놓고**, 주운 것만 켠다.
 * 몇 개가 남았는지는 꺼져 있는 그림의 수가 말해 준다.
 */
export class KeepsakeRow {
  constructor(scene, total, collected) {
    this.icons = [];
    if (!total) return;

    const gap = 26;
    const left = 20;
    for (let i = 0; i < total; i += 1) {
      const icon = scene.add
        .image(left + i * gap, 24, 'ui_icon_bone')
        .setScrollFactor(0)
        .setDepth(60);
      sizeTo(icon, { height: 22 });
      icon.setAlpha(i < collected ? 0.95 : 0.22);
      this.icons.push(icon);
    }
    this.lit = collected;
  }

  /** 하나 더 켠다 */
  light(scene) {
    const icon = this.icons[this.lit];
    this.lit += 1;
    if (!icon) return;
    scene.tweens.add({ targets: icon, alpha: 0.95, scale: icon.scale * 1.5, duration: 220, yoyo: true });
    icon.setAlpha(0.95);
  }
}
