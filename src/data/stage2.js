import { PROP, ACTOR } from '../systems/AssetManifest.js';

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
  actors: 'actors_coast',
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

  /**
   * 두 군데가 갈림길이다.
   *
   * 테트라포드(930) 에서 **왼쪽 위로 되돌아 올라가면** 방파제 끝이 나온다. 막다른 길이라
   * 주우면 되돌아 내려와야 한다 — 이 스테이지에서 유일하게 왼쪽으로 가는 구간이다.
   * 해안 도로(2000~2400) 위로는 **차를 피해 걷는 높은 길**이 있다. 대신 올라가고
   * 내려오는 데 시간이 걸려서, 그냥 도로를 뛰는 것과 맞바꾸는 셈이다.
   */
  ledges: [
    // 테트라포드 계단
    { x: 760, y: 400, w: 120 },
    { x: 930, y: 340, w: 120 },
    { x: 1080, y: 400, w: 110 },

    // ← 방파제 끝 (막다른 길). 왼쪽 위로 되돌아간다
    { x: 1010, y: 252, w: 120 },
    { x: 830, y: 178, w: 130 },

    // 도로 위 가드레일 턱
    { x: 1660, y: 390, w: 130 },

    // ↑ 도로 위 높은 길 — 차가 닿지 않는다
    { x: 2000, y: 382, w: 120 },
    { x: 2200, y: 300, w: 120 },
    { x: 2440, y: 296, w: 170 },

    { x: 3440, y: 400, w: 110 },
    // 밀물 구간에서 파도를 피해 올라설 바위
    { x: 4880, y: 420, w: 120 },
    { x: 5260, y: 412, w: 120 },
    { x: 5660, y: 420, w: 120 },
  ],

  keepsakes: [
    { id: 's2_breakwater', x: 892, y: 126 },
    { id: 's2_highroad', x: 2524, y: 246 },
  ],

  moving: [
    { x: 1450, y: 430, w: 130, h: 22, dx: 0, dy: -90, duration: 2200, surface: 'hard' },
    { x: 4480, y: 440, w: 140, h: 22, dx: 140, dy: 0, duration: 2600, surface: 'hard' },
  ],

  /**
   * 스테이지 1 보다 확실히 빡빡해야 한다 — 1000px 당 위험 1.1 개.
   *
   * 다만 성격이 다르다. 도시가 "기다렸다 건넌다" 였다면 여기는 **양쪽에서 오는 것**을
   * 동시에 봐야 한다. 파도는 죽이지 않고 밀어내기만 하므로 겁 없이 시험해 볼 수 있다.
   */
  hazards: [
    // 좁은 해안 도로의 양방향 차량 — 갓길이 좁아 한쪽으로 붙어 피해야 한다
    { type: 'car', x: 3400, y: GY, fromX: 3400, toX: 1850, dir: -1, speed: 330, interval: 3800, delay: 800 },
    { type: 'car', x: 1850, y: GY, fromX: 1850, toX: 3400, dir: 1, speed: 290, interval: 4600, delay: 2400 },
    { type: 'car', x: 3400, y: GY, fromX: 3400, toX: 1850, dir: -1, speed: 260, interval: 6200, delay: 4200 },
    { type: 'car', x: 4460, y: GY, fromX: 4460, toX: 3520, dir: -1, speed: 310, interval: 4400, delay: 1600 },

    // 밀물 — 닿으면 뒤로 밀려난다 (사망 아님). 셋이 어긋난 주기로 밀려온다
    { type: 'wave', x: 5000, y: GY + 120, reachX: 4700, interval: 3600, delay: 500, effect: 'push' },
    { type: 'wave', x: 5420, y: GY + 120, reachX: 5120, interval: 4200, delay: 1800, effect: 'push' },
    { type: 'wave', x: 5900, y: GY + 120, reachX: 5560, interval: 4800, delay: 3000, effect: 'push' },
  ],

  savePoint: {
    id: 's2_stall',
    x: 2320,
    y: GY,
    prop: 'prop_food_stall',
    propHeight: 190,
    motion: 'dog_sleep',
    motionDuration: 2800,
    sfx: null,
  },

  props: [
    { x: 420, y: GY, atlas: 'props_coast', frame: PROP.B, height: 130, depth: 7 },
    { x: 640, y: GY, atlas: 'props_coast', frame: PROP.J, height: 110, depth: 7 },
    { x: 1240, y: 190, atlas: 'actors_coast', frame: ACTOR.FLYER, height: 52, depth: 7, drift: 320, driftDuration: 8000, bob: 18 },
    { x: 2860, y: 160, atlas: 'actors_coast', frame: ACTOR.FLYER, height: 40, depth: 7, drift: -280, driftDuration: 10000, bob: 14 },
    { x: 2000, y: GY, atlas: 'props_coast', frame: PROP.A, height: 90, depth: 7 },
    { x: 2760, y: GY, atlas: 'props_coast', frame: PROP.A, height: 90, depth: 7 },
    { x: 3180, y: GY, atlas: 'props_coast', frame: PROP.H, height: 200, depth: 7 },
    { x: 3620, y: GY, atlas: 'props_coast', frame: PROP.I, height: 150, depth: 7 },
    { x: 4200, y: GY, atlas: 'props_coast', frame: PROP.E, height: 100, depth: 7 },
    { x: 5100, y: GY + 30, atlas: 'props_coast', frame: PROP.C, height: 90, depth: 7 },
    { x: 4980, y: 200, atlas: 'actors_coast', frame: ACTOR.FLYER, height: 46, depth: 7, drift: 240, driftDuration: 7000, bob: 16 },
    { x: 6120, y: GY + 30, atlas: 'props_coast', frame: PROP.TREE, height: 230, depth: 6 },
    // 절벽 위 등대 — 다음 목적지인 산을 향하는 이정표
    { x: 5900, y: GY + 30, atlas: 'props_coast', frame: PROP.LANDMARK, height: 300, depth: 5, alpha: 0.95 },
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
