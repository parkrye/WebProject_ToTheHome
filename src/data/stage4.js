/**
 * 스테이지 4 — 들판 (해방)
 *
 * 주인과 함께 살던 곳. 프롤로그의 그 들판이다.
 * 위험 요소가 하나도 없다. 걷다 보면 프롤로그 장면의 실루엣이 겹쳤다 사라지고,
 * 마지막 언덕을 넘으면 프롤로그와 같은 집이 보인다.
 */

const GY = 470;
const GH = 90;

export default {
  id: 4,
  theme: 'field',
  tile: 'tiles_field',
  surface: 'soft',
  width: 4200,
  height: 560,
  killY: 640,
  bgm: 'bgm_stage4_field',
  ambience: 'amb_field_wind',
  layers: {
    sky: 'bg_field_sky_morning',
    far: 'bg_field_far',
    mid: 'bg_field_mid',
    near: 'bg_field_near',
  },
  start: { x: 130, y: 400 },
  peaceful: true,

  ground: [
    { x: 0, y: GY, w: 1100, h: GH },
    { x: 1180, y: GY - 20, w: 900, h: GH + 20 },
    { x: 2140, y: GY, w: 700, h: GH },
    { x: 2900, y: GY - 40, w: 600, h: GH + 40 },
    { x: 3560, y: GY - 70, w: 700, h: GH + 70 },
  ],

  ledges: [
    { x: 1120, y: 430, w: 90 },
    { x: 2080, y: 440, w: 90 },
    { x: 2850, y: 420, w: 90 },
    { x: 3500, y: 390, w: 90 },
  ],

  moving: [],
  crumble: [],
  hazards: [],

  savePoint: {
    id: 's4_ball',
    x: 1900,
    y: GY - 20,
    prop: 'prop_ball',
    propScale: 1,
    motion: 'dog_ball_nudge',
    motionDuration: 2600,
    sfx: 'sfx_ball',
  },

  props: [
    { x: 420, y: GY, texture: 'grass_sway', scale: 1.1, depth: 7 },
    { x: 700, y: 330, texture: 'butterfly', scale: 1.1, depth: 9, drift: 180, driftDuration: 5200, bob: 26 },
    { x: 1500, y: GY - 20, texture: 'prop_tree', scale: 0.9, depth: 6 },
    { x: 1740, y: 300, texture: 'butterfly', scale: 0.9, depth: 9, drift: -160, driftDuration: 6200, bob: 20 },
    { x: 2400, y: GY, texture: 'grass_sway', scale: 1.2, depth: 7 },
    { x: 3060, y: 290, texture: 'butterfly', scale: 1, depth: 9, drift: 200, driftDuration: 5800, bob: 24 },
    { x: 3300, y: GY - 40, texture: 'grass_sway', scale: 1.1, depth: 7 },
    // 마지막 언덕 너머로 보이는 집 — 프롤로그와 같은 곳
    { x: 4080, y: GY - 70, texture: 'prop_house', scale: 0.95, depth: 5 },
  ],

  /** 프롤로그 회상 — 지나가면 반투명 실루엣이 잠깐 나타난다 */
  memories: [
    { x: 900, y: 440, dog: 'dog_puppy_run', owner: 'owner_child_run', lead: 'dog' },
    { x: 2300, y: 440, dog: 'dog_puppy_run', owner: 'owner_child_run', lead: 'none' },
    { x: 3200, y: 400, dog: 'dog_puppy_run', owner: 'owner_child_run', lead: 'owner' },
  ],

  scent: [
    { x: 260, y: 400 }, { x: 560, y: 390 }, { x: 860, y: 380 },
    { x: 1160, y: 370 }, { x: 1460, y: 360 }, { x: 1760, y: 360 },
    { x: 2060, y: 380 }, { x: 2360, y: 390 }, { x: 2660, y: 380 },
    { x: 2960, y: 350 }, { x: 3260, y: 340 }, { x: 3560, y: 320 },
    { x: 3860, y: 310 }, { x: 4060, y: 300 },
  ],

  goal: { x: 4150, y: 320, h: 340 },
};
