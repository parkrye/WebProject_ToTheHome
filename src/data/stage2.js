/**
 * 스테이지 2 — 해안가
 *
 * 주인이 차를 타고 오가던 길. 방파제 → 좁은 해안 도로 → 밀물 구간.
 * 중간에 주인의 차와 같은 색 자동차가 한 번 지나가고, 강아지는 잠깐 멈춰 선다.
 */

const GY = 470;
const GH = 90;

export default {
  id: 2,
  theme: 'coast',
  tile: 'tiles_coast',
  surface: 'soft',
  width: 6300,
  height: 560,
  killY: 620,
  bgm: 'bgm_stage2_coast',
  ambience: 'amb_coast_waves',
  layers: {
    sky: 'bg_coast_sky_day',
    far: 'bg_coast_far',
    mid: 'bg_coast_mid',
    near: 'bg_field_near',
  },
  start: { x: 120, y: 400 },

  ground: [
    { x: 0, y: GY, w: 700, h: GH },
    // 방파제 테트라포드 사이 — 지면이 끊긴다
    { x: 1180, y: GY, w: 420, h: GH },
    { x: 1900, y: GY, w: 1500, h: GH, surface: 'hard' }, // 해안 도로
    { x: 3560, y: GY, w: 900, h: GH, surface: 'hard' },
    // 밀물 구간 — 낮은 모래밭
    { x: 4600, y: GY + 30, w: 1700, h: GH },
  ],

  ledges: [
    // 테트라포드 계단
    { x: 760, y: 400, w: 120 },
    { x: 930, y: 340, w: 120 },
    { x: 1080, y: 400, w: 110 },
    // 도로 위 가드레일 턱
    { x: 1660, y: 390, w: 130 },
    { x: 3440, y: 400, w: 110 },
    // 밀물 구간에서 파도를 피해 올라설 바위
    { x: 4880, y: 420, w: 120 },
    { x: 5260, y: 400, w: 120 },
    { x: 5660, y: 420, w: 120 },
  ],

  moving: [
    { x: 1450, y: 430, w: 130, h: 22, dx: 0, dy: -90, duration: 2200, surface: 'hard' },
    { x: 4480, y: 440, w: 140, h: 22, dx: 140, dy: 0, duration: 2600, surface: 'hard' },
  ],

  hazards: [
    // 좁은 해안 도로의 양방향 차량
    { type: 'car', x: 3400, y: GY - 34, fromX: 3400, toX: 1850, dir: -1, speed: 320, interval: 4200, delay: 800 },
    { type: 'car', x: 1850, y: GY - 34, fromX: 1850, toX: 3400, dir: 1, speed: 280, interval: 5400, delay: 2600 },
    { type: 'car', x: 4460, y: GY - 34, fromX: 4460, toX: 3520, dir: -1, speed: 300, interval: 4800, delay: 1600 },

    // 밀물 — 닿으면 뒤로 밀려난다 (사망 아님)
    { type: 'wave', x: 5000, y: GY + 120, reachX: 4700, interval: 3800, delay: 500, effect: 'push' },
    { type: 'wave', x: 5760, y: GY + 120, reachX: 5420, interval: 4400, delay: 2400, effect: 'push' },
  ],

  savePoint: {
    id: 's2_stall',
    x: 2320,
    y: GY,
    prop: 'prop_food_stall',
    propScale: 0.85,
    motion: 'dog_sleep',
    motionDuration: 2800,
    sfx: null,
  },

  props: [
    { x: 420, y: GY, texture: 'prop_lamp', depth: 7, alpha: 0.8 },
    { x: 1240, y: 190, texture: 'seagull_fly', scale: 0.9, depth: 7, drift: 320, driftDuration: 8000 },
    { x: 2860, y: 160, texture: 'seagull_fly', scale: 0.7, depth: 7, drift: -280, driftDuration: 10000 },
    { x: 3180, y: GY, texture: 'prop_lamp', depth: 7 },
    { x: 4980, y: 200, texture: 'seagull_fly', scale: 0.8, depth: 7, drift: 240, driftDuration: 7000 },
    { x: 6120, y: GY + 30, texture: 'prop_tree', scale: 0.7, depth: 6, alpha: 0.9 },
  ],

  /** 연출 이벤트 — 존에 들어가면 한 번만 발생 */
  events: [
    {
      id: 's2_owner_car',
      x: 3000,
      w: 160,
      type: 'ownerCar',
      carX: 4400,
      carY: GY - 30,
    },
  ],

  scent: [
    { x: 240, y: 400 }, { x: 520, y: 390 },
    { x: 800, y: 350 }, { x: 960, y: 290 }, { x: 1120, y: 350 },
    { x: 1300, y: 400 }, { x: 1500, y: 340 }, { x: 1700, y: 340 },
    { x: 1980, y: 400 }, { x: 2400, y: 390 }, { x: 2800, y: 400 },
    { x: 3200, y: 390 }, { x: 3480, y: 350 }, { x: 3700, y: 400 },
    { x: 4100, y: 390 }, { x: 4400, y: 380 }, { x: 4560, y: 400 },
    { x: 4920, y: 370 }, { x: 5300, y: 350 }, { x: 5700, y: 370 },
    { x: 6000, y: 420 },
  ],

  goal: { x: 6220, y: 380, h: 320 },
};
