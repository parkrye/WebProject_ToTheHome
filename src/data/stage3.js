import { PROP } from '../systems/AssetManifest.js';

/**
 * 스테이지 3 — 산 (최고 난이도)
 *
 * 험로 → 냇가 → 야생동물과 함정 → 능선.
 * 세로로도 움직이는 유일한 스테이지라 월드 높이가 900 이다.
 * 모든 위험은 예고 동작을 가진다.
 */

const GH = 120;

export default {
  id: 3,
  theme: 'mountain',
  tile: 'tiles_mountain',
  surface: 'soft',
  width: 7100,
  height: 900,
  killY: 900,
  bgm: 'bgm_stage3_mountain',
  ambience: 'amb_mountain_night',
  layers: {
    sky: 'bg_mountain_sky_night',
    far: 'bg_mountain_far',
    mid: 'bg_mountain_mid',
    near: 'bg_mountain_near',
  },
  start: { x: 130, y: 640 },

  ground: [
    { x: 0, y: 700, w: 620, h: GH },
    // 험로 — 계단식으로 올라간다
    { x: 780, y: 640, w: 260, h: GH },
    { x: 1180, y: 580, w: 240, h: GH },
    { x: 1560, y: 520, w: 300, h: GH },
    // 냇가 평지
    { x: 1960, y: 520, w: 420, h: GH },
    { x: 2900, y: 520, w: 900, h: GH },
    // 절정 — 야생동물과 함정
    { x: 3960, y: 500, w: 700, h: GH },
    { x: 4820, y: 460, w: 620, h: GH },
    { x: 5620, y: 420, w: 520, h: GH },
    // 능선
    { x: 6280, y: 380, w: 820, h: GH },
  ],

  ledges: [
    { x: 640, y: 660, w: 110 },
    { x: 1060, y: 600, w: 100 },
    { x: 1440, y: 545, w: 100 },
    { x: 2540, y: 440, w: 120 },
    { x: 4700, y: 430, w: 110 },
    { x: 5480, y: 390, w: 110 },
    { x: 6180, y: 350, w: 110 },
  ],

  /** 물살에 흔들리는 디딤돌 */
  moving: [
    { x: 2450, y: 505, w: 120, h: 20, dx: 0, dy: -30, duration: 1400, surface: 'water' },
    { x: 2660, y: 505, w: 120, h: 20, dx: 40, dy: 0, duration: 1800, delay: 400, surface: 'water' },
    { x: 2820, y: 505, w: 110, h: 20, dx: 0, dy: -34, duration: 1200, delay: 800, surface: 'water' },
    { x: 5300, y: 400, w: 130, h: 20, dx: 0, dy: -120, duration: 2400 },
  ],

  /** 밟으면 무너지는 흙 발판 */
  crumble: [
    { x: 4020, y: 400, w: 130, h: 22 },
    { x: 4260, y: 370, w: 130, h: 22 },
    { x: 4500, y: 400, w: 130, h: 22 },
    { x: 5760, y: 340, w: 130, h: 22 },
    { x: 6000, y: 320, w: 130, h: 22 },
  ],

  hazards: [
    // 냇물 — 빠지면 하류로 떠내려간다
    { type: 'static', x: 2660, y: 600, w: 900, h: 120, effect: 'kill' },

    // 멧돼지 — 땅을 긁고 나서 돌진
    { type: 'boar', x: 4560, y: 450, range: 480, speed: 420, delay: 1400 },
    { type: 'boar', x: 5380, y: 410, range: 440, speed: 460, delay: 2600 },

    // 낙석
    { type: 'rock', x: 4180, y: 120, groundY: 480, interval: 2800, delay: 500 },
    { type: 'rock', x: 4420, y: 120, groundY: 480, interval: 3200, delay: 1900 },
    { type: 'rock', x: 5900, y: 100, groundY: 400, interval: 2600, delay: 900 },
    { type: 'rock', x: 6120, y: 100, groundY: 360, interval: 3400, delay: 2200 },

    // 덫
    { type: 'static', x: 3600, y: 500, w: 90, h: 26, effect: 'kill' },
    { type: 'static', x: 5060, y: 440, w: 90, h: 26, effect: 'kill' },
  ],

  savePoint: {
    id: 's3_pond',
    x: 3260,
    y: 520,
    prop: 'prop_valley_pond',
    propHeight: 120,
    motion: 'dog_splash',
    motionDuration: 2600,
    sfx: 'sfx_splash',
  },

  props: [
    { x: 300, y: 700, atlas: 'props_mountain', frame: PROP.TREE, height: 280, depth: 6 },
    { x: 480, y: 700, atlas: 'props_mountain', frame: PROP.B, height: 70, depth: 7 },
    { x: 900, y: 640, atlas: 'props_mountain', frame: PROP.TREE, height: 220, depth: 6, flip: true },
    { x: 1260, y: 580, atlas: 'props_mountain', frame: PROP.A, height: 80, depth: 7 },
    { x: 1700, y: 520, texture: 'owl_watch', scale: 0.9, depth: 7, originY: 1 },
    { x: 2100, y: 520, atlas: 'props_mountain', frame: PROP.TREE, height: 250, depth: 6 },
    { x: 2260, y: 520, atlas: 'props_mountain', frame: PROP.C, height: 60, depth: 7 },
    { x: 3040, y: 520, atlas: 'props_mountain', frame: PROP.H, height: 90, depth: 7 },
    { x: 3520, y: 520, atlas: 'props_mountain', frame: PROP.F, height: 120, depth: 7 },
    { x: 3900, y: 500, atlas: 'props_mountain', frame: PROP.TREE, height: 230, depth: 6, flip: true },
    { x: 4880, y: 460, atlas: 'props_mountain', frame: PROP.G, height: 90, depth: 7 },
    { x: 5700, y: 420, atlas: 'props_mountain', frame: PROP.J, height: 80, depth: 7 },
    { x: 4900, y: 300, texture: 'owl_watch', scale: 0.7, depth: 7, originY: 1, alpha: 0.9 },
    { x: 6400, y: 380, atlas: 'props_mountain', frame: PROP.TREE, height: 260, depth: 6 },
    // 능선의 부엉이 — 여기까지 온 것을 지켜본다
    { x: 6720, y: 380, atlas: 'props_mountain', frame: PROP.LANDMARK, height: 240, depth: 6 },
    { x: 6900, y: 380, texture: 'grass_sway', scale: 1.2, depth: 7 },
  ],

  scent: [
    { x: 260, y: 640 }, { x: 520, y: 630 }, { x: 700, y: 590 },
    { x: 900, y: 570 }, { x: 1100, y: 540 }, { x: 1300, y: 510 },
    { x: 1500, y: 480 }, { x: 1700, y: 450 }, { x: 2000, y: 450 },
    { x: 2300, y: 440 }, { x: 2500, y: 400 }, { x: 2720, y: 430 }, { x: 2900, y: 440 },
    { x: 3200, y: 450 }, { x: 3500, y: 450 }, { x: 3800, y: 440 },
    { x: 4060, y: 350 }, { x: 4300, y: 320 }, { x: 4540, y: 350 },
    { x: 4760, y: 380 }, { x: 5000, y: 390 }, { x: 5300, y: 340 },
    { x: 5560, y: 330 }, { x: 5800, y: 290 }, { x: 6040, y: 270 },
    { x: 6300, y: 310 }, { x: 6700, y: 310 }, { x: 7000, y: 310 },
  ],

  goal: { x: 7020, y: 300, h: 340 },
};
