/**
 * 스테이지 1 — 도시 (튜토리얼)
 *
 * 납골당에서 나와 주인의 냄새를 쫓기 시작한다.
 * 이동 → 점프 → 도움닫기 순으로 배우고, 마지막에 횡단보도에서 타이밍을 익힌다.
 *
 * 배치 기준: 지면 상단 y=470. 걷기 점프 ~118px, 달리기 ~222px, 도움닫기 ~240px.
 */

const GY = 470; // ground top
const GH = 90;

export default {
  id: 1,
  theme: 'city',
  tile: 'tiles_city',
  surface: 'hard',
  width: 5700,
  height: 560,
  killY: 620,
  bgm: 'bgm_stage1_city',
  ambience: 'amb_city_morning',
  layers: {
    sky: 'bg_city_sky',
    far: 'bg_city_far',
    mid: 'bg_city_mid',
    near: 'bg_city_near',
  },
  start: { x: 140, y: 420 },
  intro: { texture: 'bg_columbarium_interior', fadeIn: 1400 },

  ground: [
    // 갭 폭은 도움닫기 최대 도달거리(약 240px)보다 넉넉히 짧게 잡는다.
    // 튜토리얼 스테이지라 타이밍이 아슬아슬하면 안 된다.
    { x: 0, y: GY, w: 900, h: GH },
    { x: 990, y: GY, w: 510, h: GH }, // 갭 90 — 걷기 점프로 넘는다
    { x: 1650, y: GY, w: 770, h: GH }, // 갭 150 — 도움닫기를 배우는 곳 (최대 도달 240 대비 여유 90)
    { x: 2900, y: GY, w: 400, h: GH },
    { x: 3700, y: GY, w: 500, h: GH },
    { x: 4300, y: GY, w: 1400, h: GH },
  ],

  // 담장 오르기 — 단차 70px 씩
  ledges: [
    { x: 2470, y: 400, w: 130 },
    { x: 2670, y: 330, w: 130 },
    { x: 2870, y: 390, w: 120 },
    // 단차는 점프 최대 높이(96px)보다 낮게 — 증기 리프트는 보조 수단일 뿐이다
    { x: 3420, y: 400, w: 120 },
    // 횡단보도 중앙분리대 — 차를 피해 잠깐 설 수 있는 안전지대
    { x: 4740, y: 390, w: 110 },
    { x: 5140, y: 390, w: 110 },
  ],

  moving: [{ x: 3560, y: 420, w: 130, h: 22, dy: -110, duration: 2000 }],

  hazards: [
    // 하수구 증기 — 위로 밀어 올리는 리프트
    { type: 'steam', x: 3340, y: GY, interval: 2200, activeTime: 1300, power: -430 },

    // 떨어지는 화분
    { type: 'rock', x: 3860, y: 120, groundY: GY - 10, interval: 2600, delay: 600 },
    { type: 'rock', x: 4060, y: 120, groundY: GY - 10, interval: 3000, delay: 1800 },

    // 횡단보도 — 세 대가 다른 주기로 지나간다
    { type: 'car', x: 5700, y: GY - 34, fromX: 5700, toX: 4200, dir: -1, speed: 300, interval: 3400, delay: 400 },
    { type: 'car', x: 5700, y: GY - 34, fromX: 5700, toX: 4200, dir: -1, speed: 240, interval: 4600, delay: 2200 },
    { type: 'car', x: 4200, y: GY - 34, fromX: 4200, toX: 5700, dir: 1, speed: 270, interval: 5200, delay: 3400 },
  ],

  signs: [
    { x: 320, y: GY, texture: 'prop_sign_move', scale: 0.9 },
    { x: 700, y: GY, texture: 'prop_sign_jump', scale: 0.9 },
    { x: 1380, y: GY, texture: 'prop_sign_run', scale: 0.9 },
  ],

  savePoint: {
    id: 's1_sandbox',
    x: 1980,
    y: GY,
    prop: 'prop_sandbox',
    propScale: 0.9,
    motion: 'dog_dig',
    motionDuration: 2400,
    sfx: 'sfx_dig',
  },

  props: [
    { x: 60, y: GY, texture: 'prop_niche_wall', scale: 0.8, originY: 1, depth: 6, alpha: 0.9 },
    { x: 520, y: GY, texture: 'prop_lamp', depth: 7 },
    { x: 1180, y: GY, texture: 'prop_lamp', depth: 7 },
    { x: 2260, y: GY, texture: 'prop_lamp', depth: 7 },
    { x: 3020, y: GY, texture: 'prop_tree', scale: 0.8, depth: 6 },
    { x: 4460, y: GY, texture: 'prop_lamp', depth: 7 },
    { x: 5320, y: GY, texture: 'prop_lamp', depth: 7 },
    { x: 4980, y: 210, texture: 'seagull_fly', scale: 0.8, depth: 7, drift: 260, driftDuration: 9000 },
  ],

  scent: [
    { x: 260, y: 410 }, { x: 560, y: 400 }, { x: 860, y: 380 },
    { x: 960, y: 350 }, { x: 1060, y: 400 },
    { x: 1300, y: 400 }, { x: 1520, y: 360 }, { x: 1640, y: 330 }, { x: 1780, y: 380 },
    { x: 2120, y: 400 }, { x: 2400, y: 380 },
    { x: 2540, y: 340 }, { x: 2740, y: 270 }, { x: 2930, y: 330 },
    { x: 3120, y: 400 }, { x: 3340, y: 360 }, { x: 3480, y: 280 }, { x: 3640, y: 300 },
    { x: 3820, y: 400 }, { x: 4120, y: 400 }, { x: 4260, y: 370 },
    { x: 4520, y: 400 }, { x: 4800, y: 340 }, { x: 5200, y: 340 }, { x: 5460, y: 400 },
  ],

  goal: { x: 5620, y: 380, h: 320 },
};
