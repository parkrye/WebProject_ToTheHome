import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, DOG } from './config.js';

import BootScene from './scenes/BootScene.js';
import PreloadScene from './scenes/PreloadScene.js';
import TitleScene from './scenes/TitleScene.js';
import SpriteImportScene from './scenes/SpriteImportScene.js';
import PrologueScene from './scenes/PrologueScene.js';
import StageScene from './scenes/StageScene.js';
import EndingScene from './scenes/EndingScene.js';
import HudScene from './scenes/HudScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#12131a',
  pixelArt: false,
  roundPixels: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: DOG.gravity },
      debug: false,
    },
  },
  input: {
    activePointers: 3, // 좌우 이동 + 점프 동시 터치
  },
  render: {
    // 개발 중에만 켠다. 헤드리스 브라우저로 화면을 찍어 확인할 때, 이게 꺼져 있으면
    // 그리기 버퍼가 비워져서 **직전 프레임이 찍히거나 빈 화면이 나온다.**
    // 배포 빌드에서는 성능 때문에 끈다.
    preserveDrawingBuffer: import.meta.env.DEV,
  },
  scene: [
    BootScene,
    PreloadScene,
    TitleScene,
    SpriteImportScene,
    PrologueScene,
    StageScene,
    EndingScene,
    HudScene,
  ],
};

const game = new Phaser.Game(config);

// 콘솔이나 자동화에서 씬 상태를 들여다보기 위한 통로.
// 일부 자동화 도구는 페이지 전역에 접근하지 못하므로 DOM 속성으로도 남긴다.
if (import.meta.env.DEV) {
  window.__game = game;
  setInterval(() => {
    const active = game.scene.scenes.filter((s) => s.scene.isActive()).map((s) => s.scene.key);
    document.body.dataset.scenes = active.join(',');
    document.body.dataset.textures = String(game.textures.getTextureKeys().length);
    document.body.dataset.anims = String(game.anims.anims.size);

    const stage = game.scene.getScene('Stage');
    if (stage && stage.scene.isActive() && stage.dog) {
      document.body.dataset.stage = String(stage.stageId);
      document.body.dataset.dog = `${Math.round(stage.dog.x)},${Math.round(stage.dog.y)}`;
      document.body.dataset.anim = stage.dog.anims.currentAnim?.key ?? '';
      document.body.dataset.checkpoint = stage.save.data.checkpoint ?? '';
    }
  }, 120);
}
