import { PROP, ACTOR } from '../systems/AssetManifest.js';

/**
 * 스테이지 1 — 도시 (튜토리얼)
 *
 * 안개 낀 이른 아침, 아직 깨어나지 않은 도시에서 눈을 뜬다.
 * **어디에서 왔는지는 말하지 않는다.** 강아지가 무엇인지도 설명하지 않는다.
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
  actors: 'actors_city',
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

  // 시작 연출 — 자고 있다가 눈을 뜬다 (플레이 리뷰 3)
  wake: { fade: 1600, hold: 1500, rise: 1100 },

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

  /**
   * 단차는 점프 최대 높이(96px)보다 낮게 잡는다.
   *
   * 2470~2870 은 **갈림길**이다. 담장 세 단을 올라간 뒤 그대로 내려오면 정규 루트고,
   * 3060 에서 한 단 더 올라가면 옥상으로 빠진다. 옥상 끝에 기억 조각이 있고,
   * 3520 으로 내려와 움직이는 발판에 합류하므로 **돌아 나올 필요는 없다.**
   */
  ledges: [
    // 담장 오르기
    { x: 2470, y: 400, w: 130 },
    { x: 2670, y: 330, w: 130 },
    { x: 2870, y: 390, w: 120 },

    // ↑ 옥상 갈림길 — 담장 꼭대기에서 위로 이어진다
    { x: 3060, y: 300, w: 140 },
    { x: 3300, y: 250, w: 160 },
    { x: 3520, y: 330, w: 120 }, // 다시 내려와 움직이는 발판에 합류

    { x: 3420, y: 400, w: 120 },

    // ↓ 갓길 아래 — 지면 틈으로 내려가야 닿는다. 되돌아 올라온다
    { x: 4200, y: 556, w: 110 },

    // 횡단보도 중앙분리대 — 차를 피해 잠깐 설 수 있는 안전지대
    { x: 4740, y: 390, w: 110 },
    { x: 5140, y: 390, w: 110 },
  ],

  /**
   * 기억 조각 — 냄새 입자가 가리키는 길에서 벗어나야 닿는다.
   * 하나는 위(옥상), 하나는 아래(갓길 틈)로 보낸다.
   */
  keepsakes: [
    { id: 's1_roof', x: 3380, y: 198 },
    { id: 's1_gutter', x: 4256, y: 504 },
  ],

  moving: [{ x: 3560, y: 420, w: 130, h: 22, dy: -110, duration: 2000 }],

  /**
   * 튜토리얼이므로 **위험은 한 번에 하나씩만** 만나게 둔다.
   *
   * 증기(리프트)와 화분(타이밍)과 자동차(관찰)를 x 로 멀찍이 떼어 놓고, 주기도 넉넉하게
   * 잡는다. 1000px 당 위험 0.9 개 — 산(스테이지 3)의 절반이 안 된다.
   */
  hazards: [
    // 하수구 증기 — 위로 밀어 올리는 리프트. 위험이 아니라 도구다
    { type: 'steam', x: 3340, y: GY, interval: 2400, warnTime: 700, activeTime: 1400, power: -430 },

    // 떨어지는 화분 — 한 개만 둔다. 둘을 붙여 두면 처음 배우는 사람에게 너무 빠르다
    { type: 'rock', x: 3980, y: 120, groundY: GY - 10, interval: 3000, delay: 900 },

    // 횡단보도 — 세 대가 다른 주기로 지나간다.
    // 주기를 길게 잡아 **차가 다 지나간 뒤 건너는 시간**이 확실히 생기게 한다
    { type: 'car', x: 5700, y: GY, fromX: 5700, toX: 4200, dir: -1, speed: 280, interval: 4400, delay: 400 },
    { type: 'car', x: 5700, y: GY, fromX: 5700, toX: 4200, dir: -1, speed: 230, interval: 5600, delay: 2400 },
    { type: 'car', x: 4200, y: GY, fromX: 4200, toX: 5700, dir: 1, speed: 250, interval: 6200, delay: 3800 },
  ],

  /**
   * 안내판 — 걸어가며 만나는 순서가 곧 배우는 순서다.
   *
   * 배열 순서를 그대로 쓰는 곳이 하나 더 있다. 관리 툴로 만든 지형을 쓸 때는 여기 적은
   * x 가 뜻을 잃으므로, `stages.js` 가 **이 순서대로** 출발 지점 앞에 다시 늘어놓는다.
   */
  signs: [
    { x: 320, y: GY, texture: 'prop_sign_move', height: 165 },
    { x: 700, y: GY, texture: 'prop_sign_jump', height: 165 },
    { x: 1380, y: GY, texture: 'prop_sign_run', height: 165 },
    // 길을 잃기 전에 — 코를 꾹 눌러 냄새를 맡으면 갈 길이 보인다
    { x: 1640, y: GY, texture: 'prop_sign_sniff', height: 165 },
    // 첫 세이브(모래 놀이터) 바로 앞 — 쉬어 가는 자리에서는 톡
    { x: 1840, y: GY, texture: 'prop_sign_interact', height: 165 },
    // 담장에 오르기 직전 — 올라간 발판에서 다시 내려오는 법
    { x: 2400, y: GY, texture: 'prop_sign_jumpdown', height: 165 },
    // 갓길 틈 앞 — 발밑을 살펴야 내려갈 자리가 보인다
    { x: 4120, y: GY, texture: 'prop_sign_lookdown', height: 165 },
  ],

  savePoint: {
    id: 's1_sandbox',
    x: 1980,
    y: GY,
    prop: 'prop_sandbox',
    propHeight: 110,
    motion: 'dog_dig',
    motionDuration: 2400,
    sfx: 'sfx_dig',
  },

  props: [
    // 출발 지점 — 셔터가 내려진 가게. 도시가 아직 깨지 않았다는 것만 말한다
    { x: 60, y: GY, atlas: 'props_city', frame: PROP.H, height: 240, depth: 6, alpha: 0.95 },
    { x: 520, y: GY, atlas: 'props_city', frame: PROP.A, height: 210, depth: 7 },
    { x: 900, y: GY, atlas: 'props_city', frame: PROP.E, height: 90, depth: 7 },
    { x: 1180, y: GY, atlas: 'props_city', frame: PROP.A, height: 210, depth: 7 },
    { x: 1330, y: GY, atlas: 'props_city', frame: PROP.F, height: 95, depth: 7 },
    { x: 2260, y: GY, atlas: 'props_city', frame: PROP.A, height: 210, depth: 7 },
    { x: 2350, y: GY, atlas: 'props_city', frame: PROP.D, height: 80, depth: 7 },
    { x: 3020, y: GY, atlas: 'props_city', frame: PROP.TREE, height: 250, depth: 6, sink: 30 },
    { x: 3120, y: GY, atlas: 'props_city', frame: PROP.J, height: 110, depth: 7 },
    { x: 3980, y: GY, atlas: 'props_city', frame: PROP.G, height: 100, depth: 7 },
    { x: 4460, y: GY, atlas: 'props_city', frame: PROP.B, height: 230, depth: 7 },
    { x: 5060, y: GY, atlas: 'props_city', frame: PROP.H, height: 190, depth: 6 },
    { x: 5320, y: GY, atlas: 'props_city', frame: PROP.A, height: 210, depth: 7 },
    { x: 4980, y: 210, atlas: 'actors_city', frame: ACTOR.FLYER, height: 44, depth: 7, drift: 260, driftDuration: 9000, bob: 16 },
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
