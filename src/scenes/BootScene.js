import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, PALETTE } from '../config.js';
import { discoverAssets } from '../systems/AssetLoader.js';
import { InputSystem } from '../systems/InputSystem.js';
import { SaveSystem } from '../systems/SaveSystem.js';
import { AudioSystem } from '../systems/AudioSystem.js';

/**
 * 전역 시스템을 만들고, 어떤 실제 에셋이 있는지 먼저 조사한다.
 * 조사 결과에 따라 PreloadScene 이 로드할 목록이 정해진다.
 */
export default class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create() {
    this.registry.set('input', new InputSystem());
    this.registry.set('save', new SaveSystem());
    this.registry.set('audio', new AudioSystem(this.game));

    // 로딩 중 표시 — 문자 없이 맥동하는 점 하나
    const pulse = this.add.circle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 10, PALETTE.scent, 0.9);
    this.tweens.add({
      targets: pulse,
      scale: 1.8,
      alpha: 0.3,
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    discoverAssets().finally(() => {
      this.scene.start('Preload');
    });
  }
}
