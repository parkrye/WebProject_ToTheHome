import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETTE } from '../config.js';
import { queueRealAssets, buildMissingTextures, registerAnimations } from '../systems/AssetLoader.js';

/**
 * 존재하는 실제 에셋을 로드하고, 빠진 것은 절차적 텍스처로 채운 뒤
 * 애니메이션을 일괄 등록한다.
 */
export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super('Preload');
  }

  preload() {
    const barW = 320;
    const x = (GAME_WIDTH - barW) / 2;
    const y = GAME_HEIGHT / 2;

    const track = this.add.rectangle(GAME_WIDTH / 2, y, barW, 6, 0xffffff, 0.15);
    const fill = this.add.rectangle(x, y, 0, 6, PALETTE.scent, 0.9).setOrigin(0, 0.5);

    this.load.on('progress', (value) => fill.setSize(barW * value, 6));
    this.load.on('complete', () => {
      track.destroy();
      fill.destroy();
    });

    // 파일이 없어 실패해도 게임은 계속된다 — 그 키는 플레이스홀더가 맡는다
    this.load.on('loaderror', (file) => {
      console.warn('[assets] 불러오지 못함:', file.key);
    });

    queueRealAssets(this);
  }

  create() {
    buildMissingTextures(this);
    registerAnimations(this);
    this.scene.start('Title');
  }
}
