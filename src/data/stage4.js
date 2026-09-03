import { PROP, ACTOR } from '../systems/AssetManifest.js';

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
  actors: 'actors_field',
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

  /**
   * 지면에 **틈이 하나도 없다.**
   *
   * 이 스테이지는 사망 요소가 없다는 게 규칙인데, 틈이 있으면 거기 빠져 죽는다.
   * 그래서 지면을 끝까지 이어 붙이고, 대신 20~40px 짜리 단차로 기복만 준다.
   * 단차는 걷기 점프(118px)로 넘고도 한참 남으므로 실수할 여지가 없다.
   */
  ground: [
    { x: 0, y: GY, w: 1180, h: GH },
    { x: 1180, y: GY - 20, w: 960, h: GH + 20 },
    { x: 2140, y: GY, w: 760, h: GH },
    { x: 2900, y: GY - 40, w: 660, h: GH + 40 },
    { x: 3560, y: GY - 70, w: 700, h: GH + 70 },
  ],

  /**
   * 지면이 이어져 있으므로 **길을 찾는 데는 턱이 필요 없다.**
   * 여기 있는 턱은 전부 기억 조각으로 가는 갈림길이다. 놓쳐도 진행에 지장이 없고,
   * 위험이 없으니 떨어져도 그냥 잔디에 앉는다.
   */
  ledges: [
    // ↑ 큰 나무 위
    { x: 1420, y: 366, w: 110 },
    { x: 1600, y: 286, w: 120 },

    // ↑ 언덕 꼭대기
    { x: 2760, y: 386, w: 110 },
    { x: 2960, y: 300, w: 120 },
  ],

  keepsakes: [
    { id: 's4_treetop', x: 1660, y: 234 },
    { id: 's4_hilltop', x: 3020, y: 248 },
  ],

  moving: [],
  crumble: [],
  hazards: [],

  savePoint: {
    id: 's4_ball',
    x: 1900,
    y: GY - 20,
    prop: 'prop_ball',
    propHeight: 46,
    motion: 'dog_ball_nudge',
    motionDuration: 2600,
    sfx: 'sfx_ball',
  },

  props: [
    { x: 420, y: GY, atlas: 'props_field', frame: PROP.C, height: 80, depth: 7 },
    { x: 700, y: 330, atlas: 'actors_field', frame: ACTOR.PUFF, height: 34, depth: 9, drift: 180, driftDuration: 5200, bob: 26 },
    { x: 1200, y: GY - 20, atlas: 'props_field', frame: PROP.A, height: 90, depth: 7 },
    { x: 1500, y: GY - 20, atlas: 'props_field', frame: PROP.TREE, height: 280, depth: 6 },
    { x: 1660, y: GY - 20, atlas: 'props_field', frame: PROP.C, height: 70, depth: 7 },
    { x: 1740, y: 300, atlas: 'actors_field', frame: ACTOR.PUFF, height: 30, depth: 9, drift: -160, driftDuration: 6200, bob: 20 },
    { x: 2400, y: GY, atlas: 'props_field', frame: PROP.C, height: 86, depth: 7 },
    { x: 2200, y: GY, atlas: 'props_field', frame: PROP.B, height: 110, depth: 7 },
    { x: 2620, y: GY, atlas: 'props_field', frame: PROP.E, height: 90, depth: 7 },
    { x: 3000, y: GY - 40, atlas: 'props_field', frame: PROP.G, height: 130, depth: 7 },
    { x: 3060, y: 290, atlas: 'actors_field', frame: ACTOR.PUFF, height: 32, depth: 9, drift: 200, driftDuration: 5800, bob: 24 },
    { x: 3300, y: GY - 40, atlas: 'props_field', frame: PROP.C, height: 80, depth: 7 },
    { x: 3700, y: GY - 70, atlas: 'props_field', frame: PROP.TREE, height: 260, depth: 6 },
    // 마지막 언덕 너머로 보이는 집 — 프롤로그와 같은 곳
    { x: 4080, y: GY - 70, atlas: 'props_field', frame: PROP.LANDMARK, height: 330, depth: 5 },
  ],

  /** 프롤로그 회상 — 지나가면 반투명 실루엣이 잠깐 나타난다 */
  memories: [
    { x: 900, y: 440, dog: 'dog_puppy_run', owner: 'owner_child_run', lead: 'dog' },
    { x: 2300, y: 440, dog: 'dog_puppy_run', owner: 'owner_child_run', lead: 'none' },
    { x: 3200, y: 400, dog: 'dog_puppy_run', owner: 'owner_child_run', lead: 'owner' },
  ],

  /**
   * 집에 가까워질수록 **냄새가 짙어진다.**
   *
   * 앞쪽은 300px 간격으로 띄엄띄엄, 마지막 언덕부터는 120px 간격으로 촘촘하게 둔다.
   * 위험이 하나도 없는 스테이지라, 길을 끄는 힘은 이 밀도 변화가 전부다.
   */
  scent: [
    { x: 260, y: 400 }, { x: 560, y: 390 }, { x: 860, y: 380 },
    { x: 1160, y: 370 }, { x: 1460, y: 360 }, { x: 1760, y: 360 },
    { x: 2060, y: 380 }, { x: 2360, y: 390 }, { x: 2660, y: 380 },
    { x: 2900, y: 360 }, { x: 3080, y: 348 }, { x: 3260, y: 340 },
    { x: 3420, y: 330 }, { x: 3560, y: 320 }, { x: 3680, y: 314 },
    { x: 3800, y: 308 }, { x: 3900, y: 304 }, { x: 4000, y: 300 },
    { x: 4080, y: 298 }, { x: 4140, y: 296 },
  ],

  goal: { x: 4150, y: 320, h: 340 },
};
