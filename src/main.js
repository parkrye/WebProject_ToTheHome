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
  /**
   * **정수 자리로 반올림하지 않는다.**
   *
   * 카메라는 매 프레임 5.39px 처럼 소수 단위로 움직이는데, 반올림해서 그리면 그 소수가
   * 5, 5, 6, 5, 6 으로 튄다. 화면은 FIT 으로 다시 확대되므로 그 1px 이 더 커져서
   * **모든 이동이 자잘하게 덜컥거린다** (플레이 리뷰 2차 6). 픽셀아트가 아니라
   * 반올림해서 얻을 것도 없다.
   */
  roundPixels: false,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: DOG.gravity },
      // 주소에 ?debug=1 을 붙이면 충돌 박스를 그린다 (개발 빌드 전용).
      // **보이는 그림과 판정이 어긋나는 것**은 눈으로 보지 않으면 못 잡는다
      debug: import.meta.env.DEV && new URLSearchParams(location.search).has('debug'),
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

  // 헤드리스 브라우저는 페이지의 전역(window.__game)을 못 보는 경우가 많다. DOM 은
  // 공유하므로 **이벤트**로도 씬을 바꿀 수 있게 열어 둔다 — 타이틀부터 클릭해 들어가지
  // 않고 곧바로 그 스테이지를 확인할 수 있다.
  //
  //   document.dispatchEvent(new CustomEvent('tothehome:goto', { detail: { stageId: 2 } }))
  document.addEventListener('tothehome:goto', (e) => {
    const { scene = 'Stage', ...data } = e.detail || {};
    game.scene.scenes.filter((s) => s.scene.isActive()).forEach((s) => game.scene.stop(s.scene.key));
    game.scene.start(scene, data);
  });
  // 확인하고 싶은 자리가 늘 출발 지점은 아니다. 걸어서 거기까지 가려면 몇 분이 걸리므로
  // **그 자리로 바로 옮기는** 통로도 같이 열어 둔다.
  //
  //   document.dispatchEvent(new CustomEvent('tothehome:teleport', { detail: { x: 4383, y: 14520 } }))
  document.addEventListener('tothehome:teleport', (e) => {
    const { x, y } = e.detail || {};
    const stage = game.scene.getScene('Stage');
    if (!stage?.dog || x == null || y == null) return;
    stage.dog.setPosition(x, y);
    stage.dog.body?.reset(x, y);
    // 옮긴 거리를 **떨어진 거리로 세면** 착지하자마자 죽는다 (Dog.fallFromY)
    stage.dog.fallFromY = y;
    stage.dog.fallHeight = 0;
    stage.dog.landFallHeight = 0;
  });

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

      // **보이는 그림과 판정이 어긋나면** "왜 죽었는지 모르겠다"가 된다.
      // 위험 요소마다 그림 크기와 몸 크기를, 그리고 **지금 판정이 켜져 있는지**를
      // 나란히 적어 둔다 — 잠깐만 나타나는 것은 켜고 끄는 때가 곧 규칙이다
      document.body.dataset.hazards = (stage.hazards ?? [])
        .filter((h) => h.body && h.box)
        .map(
          (h) =>
            `${h.def.type} art ${Math.round(h.displayWidth * h.box.w)}x${Math.round(h.displayHeight * h.box.h)}` +
            ` body ${Math.round(h.body.width)}x${Math.round(h.body.height)}` +
            `${h.phase ? ` ${h.phase}` : ''} ${h.body.enable ? 'on' : 'off'}`
        )
        .join(' | ');
    }
  }, 120);
}
