/**
 * 게임 전역 상수.
 * 조작 감각 수치는 .docs/game-design.md 3.3 절과 동기화되어 있다.
 */

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** 강아지 이동 파라미터 */
export const DOG = {
  walkSpeed: 160,
  runSpeed: 300,
  accel: 1400,
  drag: 1800,
  airDragScale: 0.35,
  runHoldTime: 450, // ms. 이 시간 이상 한 방향을 유지하면 도움닫기 진입
  gravity: 1400,
  jumpVelocity: -520,
  runJumpVelocity: -560,
  runJumpThreshold: 240, // 이 수평 속도 이상이면 러닝 점프 보정
  jumpCutScale: 0.45,
  coyoteTime: 120, // ms
  jumpBuffer: 150, // ms
  // 화면에 보이는 크기 기준. 스프라이트 프레임이 몇 px 이든 이 값이 유지된다
  bodyWidth: 46,
  bodyHeight: 40,
  // 아래 + 점프 = 딛고 선 발판을 통과해 내려간다.
  // 이 시간 동안 **그 발판의 윗면 충돌만** 꺼 둔다
  dropThroughTime: 280, // ms

  /**
   * 이 높이 넘게 떨어져서 착지하면 죽는다.
   *
   * 중력 1400 에서 420px 을 떨어지면 초속 1084px — 최고 낙하 속도(1200)에 거의 닿는다.
   * 즉 "끝까지 가속해서 부딪히면 죽는다"가 된다. 점프 최고 상승이 96px 이므로
   * 뛰어올랐다 내려오는 것만으로는 절대 닿지 않는다.
   */
  killFallHeight: 420,
  /**
   * 발이 지면 그림 속으로 얼마나 들어갈지 (화면 px).
   *
   * 타일 윗면에 정확히 올려 놓으면 오히려 붕 떠 보이므로 조금 파묻는다. 다만 이 값은
   * **가장 얇은 발판보다 얕아야 한다.** 예전 값(16)은 판자(18) 위에 섰을 때 판자를
   * 거의 다 파고들어, 강아지가 판자 위가 아니라 **판자 가운데에 걸쳐 있는 것처럼**
   * 보였다 (플레이 리뷰 2차 7). 소품이 파묻히는 깊이(Layout.GROUND_SINK)와 같게 둔다.
   */
  footPadding: 6,
  displaySize: 96,
};

/**
 * 지형 규칙 — **생성기와 충돌 판정이 같은 숫자를 봐야 한다.**
 *
 * 이 둘이 어긋나면 "다 오갈 수 있다"고 검사를 통과한 지도 안에 실제로는 막힌 자리가
 * 생긴다. 생성기(`StageBuilder`)는 이 값을 보고 두께를 정하고, 충돌
 * 판정(`Platforms`)은 같은 값을 보고 위에서만 밟힐지 사방이 막힐지를 정한다.
 */
export const TERRAIN = {
  /**
   * 이 두께까지는 **위에서만 밟히는 발판**이다.
   *
   * 판자(18)와 연석(40)이 여기 들어온다 — 공중에 뜬 발판이므로 아래에서 뛰어 뚫고
   * 올라갈 수 있고 ↓ + 점프로 통과해 내려갈 수 있다. 그보다 두꺼운 것은 잔디 윗면을
   * 얹은 **땅**이라 바닥과 똑같이 사방이 막힌다. 두께가 곧 생김새이므로, 무엇을 딛고
   * 있는지 눈으로 구별할 수 있다.
   */
  oneWayMaxH: 44,

  /**
   * 사방이 막힌 땅의 밑면과 그 아래 발판 사이에 남겨야 할 높이.
   *
   * 몸 높이(40)에 점프 최고 상승(96)을 더한 값이다. 이만큼 비어 있지 않으면 그 아래
   * 선 강아지는 **천장에 머리를 찧어 뛰어오르지 못한다.**
   */
  headroom: 140,
};

/** 카메라 */
export const CAMERA = {
  lerp: 0.1,
  deadzoneWidth: 240,
  deadzoneHeight: 140,
  followOffsetY: 40,

  /**
   * 떨어질 때는 카메라가 곧바로 따라붙는다.
   *
   * 평소 값(lerp 0.1 · 세로 여유 140)으로 자유낙하를 따라가면, 강아지가 화면 아래
   * 끝에 간신히 걸린 채 덜컥거린다. 최고 낙하 속도가 1200px/s 인데 카메라는 매
   * 프레임 남은 거리의 10% 만 좁히기 때문이다. 그래서 **낙하 속도에 따라** 추적을
   * 조이고 세로 여유를 줄인다.
   */
  fallFrom: 320, // px/s. 이 속도부터 조이기 시작
  fallTo: 900, // px/s. 이 속도에서 최대
  fallLerp: 0.85,
  fallDeadzoneHeight: 40,

  /**
   * 아래쪽 보기 — ↓ 를 쥐고 있으면 카메라가 스르륵 내려간다.
   *
   * 강아지가 화면 위쪽에 걸리고 발밑이 넓게 보인다. 내려갈 곳을 살피는 용도라
   * 급하게 움직이면 오히려 불편하므로 천천히(lerp) 옮긴다.
   */
  lookDownOffset: -165,
  lookDownHold: 260, // ms. 걷다가 스친 입력은 무시한다
  lookDownLerp: 0.07,
};

/**
 * 냄새(길찾기).
 *
 * **기본은 꺼져 있다.** 냄새 맡기를 일정 시간 유지해야 켜지고, 누르고 있는 동안만
 * 반짝인다. 손을 떼면 곧바로 사라진다 — 늘 켜져 있으면 길을 알려 주는 게 아니라
 * 길이 그려져 있는 것이 된다.
 */
/**
 * 애니메이션.
 *
 * 시트가 **들어가는 동작 → 고리 → 마무리** 로 나뉜 것들은 고리만 계속 돈다.
 * 제 속도로 돌리면 짧은 구간을 빠르게 반복해 파닥거리는 것처럼 보이므로 느리게 돌린다.
 * 들어가고 마무리하는 동작은 제 속도라야 끊겨 보이지 않는다.
 */
export const ANIM = {
  loopSlow: 0.55,
};

export const SCENT = {
  holdToShow: 1000, // ms. 이만큼 유지해야 켜진다
  lowAlpha: 0.3, // 반짝임의 아래쪽
  highAlpha: 0.95, // 반짝임의 위쪽
  twinkle: 520, // ms. 반짝이는 주기
  grow: 1.25, // 반짝일 때 커지는 배율

  /**
   * 길은 **맡을 때마다 지금 자리에서 다시 찾는다.**
   *
   * 미리 그려 둔 한 줄기를 켜고 끄면, 길에서 벗어난 순간 냄새가 엉뚱한 곳을 가리킨다.
   * 어디에 있든 거기서 도착 지점까지의 최단 경로를 그 자리에서 찾아 준다.
   *
   * 다만 끝까지 다 보여 주면 지도를 펼쳐 놓은 것이 된다. 앞쪽 몇 걸음만 보여 준다.
   */
  /**
   * 앞으로 얼마까지 보여 줄지 (px).
   *
   * 걸음 수로 세면 길찾기 노드 간격이 바뀔 때마다 보이는 거리가 달라진다. 노드를
   * 촘촘히 깐 뒤로는 (StageBuilder.PATH_STEP) 거리로 재야 뜻이 유지된다.
   */
  lookahead: 1500,
  maxMotes: 40, // 미리 만들어 두고 돌려 쓰는 입자 수
};

/**
 * 높이 올라갈수록 가까운 배경이 발밑으로 내려간다.
 *
 * 옥상보다 높이 올라갔는데 길가 풍경이 그대로 눈높이에 있으면 높이가 읽히지 않는다.
 * 카메라가 바닥에서 올라온 만큼 이 비율로 레이어를 내리고, 화면 밖으로 나가면 그만이다.
 * 가까운 레이어일수록 많이 내려간다.
 */
export const PARALLAX_DROP = {
  /**
   * 레이어별 내려가는 정도. **비율이 아니라 서로의 무게다.**
   *
   * 예전에는 카메라가 올라온 px 에 이 값을 그대로 곱했다. 그러면 스테이지가 얼마나
   * 높든 상관없이 982px 만 올라가도 가까운 레이어가 화면 밖으로 다 내려가 버린다 —
   * 높이 6478px 짜리 스테이지에서는 6분의 1 만 올라가도 연출이 끝난다
   * (플레이 리뷰 2차 5). 실제 곱하는 값은 스테이지 높이를 보고 정한다.
   */
  mid: 0.4,
  near: 1,

  /** 올라갈 수 있는 높이의 이 지점에서 최대로 내려간다 */
  fullAt: 0.8,
};

/**
 * 위험 요소 공통 규칙.
 *
 * **생성기와 실물이 같은 숫자를 봐야 한다.** 예고 시간이 어긋나면 생성기가 "이만큼은
 * 비어 있다"고 계산해 둔 틈이 실제로는 그만큼 비지 않는다. 그래서 `StageBuilder`(길의
 * 박자를 잡는 쪽)와 `Hazards`(실제로 깜빡이고 튀어나오는 쪽)가 여기를 같이 본다.
 */
export const HAZARD = {
  /**
   * 위험이 나타나기 **이만큼 전부터** 미칠 범위를 붉게 깜빡인다.
   *
   * 예전 값(0.5~0.9초)은 "무언가 온다"를 알리기에도 짧았다. 자동차처럼 들어갈지
   * 말지를 정해야 하는 것은 보고 → 판단하고 → 물러설 시간이 다 있어야 하는데,
   * 0.9초로는 이미 발을 들여놓은 뒤에 켜졌다. 2초면 걸어서 한 걸음 물러설 수 있다.
   */
  warnTime: 2000,

  /** 예고가 밝아졌다 어두워지는 한 번의 시간 — 2초 동안 여덟 번쯤 깜빡인다 */
  blink: 240,

  /**
   * 자동차가 차선 밖에서 나타나고 사라지는 데 쓰는 거리.
   *
   * 갓길은 강아지가 **서서 기다리는 자리**다. 거기를 반투명한 차가 느릿하게 통과하면
   * 팔통통 지나가는 유령이 되므로 짧게 잡는다. 판정은 차선 안에서만 켠다.
   */
  carFade: 190,

  /**
   * 멧돼지 몸의 가로 폭 (화면 px).
   *
   * 돌진 거리는 **몸 가운데를 기준으로** 재므로, 위험이 실제로 닿는 끝은 거기서
   * 몸 반쪽(82px)만큼 더 나간다. 두르는 표시도, 낙석과 벌리는 간격도 이만큼을
   * 같이 세야 한다 — 안 그러면 **표시 밖에 서 있다가 맞는다** (플레이 리뷰 4차 9).
   */
  boarBody: 164,
};

/** 오디오 믹스 (.docs/assets-audio.md 부록 A) */
export const MIX = {
  bgm: 0.55,
  ambience: 0.25,
  sfx: 0.8,
  jingle: 0.9,
  duckedBgm: 0.3,
  crossfade: 800,
};

/** 저장 키 */
export const SAVE_KEY = 'tothehome.save.v1';

/** 패럴랙스 레이어 스크롤 계수 */
export const PARALLAX = {
  sky: 0,
  far: 0.2,
  mid: 0.5,
  near: 0.8,
};

/** 색 팔레트 — 플레이스홀더 그래픽 생성에 사용 */
/**
 * 화면이 어두워졌다 밝아지는 시간.
 *
 * 죽은 강아지가 꾸는 꿈 이야기다. 장면이 툭툭 끊기면 게임 화면 전환이 되고,
 * **느릿하게 넘어가야** 꿈에서 꿈으로 옮겨 가는 것으로 읽힌다.
 * 한자리에 모아 두어 어디서든 같은 호흡으로 넘어가게 한다.
 */
export const FADE = {
  in: 1400, // 씬에 들어올 때
  out: 1000, // 씬을 떠날 때
  cut: 1200, // 프롤로그 한 컷에서 다음 컷으로
  death: 700, // 죽어서 어두워질 때
  respawn: 1100, // 되살아나며 밝아질 때
  clear: 2200, // 스테이지를 넘어갈 때
};

export const PALETTE = {
  dogBody: 0xf3e3c8,
  dogShade: 0xd9c3a1,
  dogNose: 0x3a2f2a,
  dogEye: 0x4a3728,
  ownerChild: 0xf2c14e,
  ownerAdult: 0x8d7b68,
  scent: 0xffd98a,
  save: 0xffc861,
  hazard: 0xd96c5f,
  /**
   * 위험 범위 예고 색 — **옅은 붉은색.**
   *
   * 위험 요소 자체의 색(hazard)보다 밝고 붉다. 지형 위에 잠깐 얹히는 표시라
   * 짙으면 그림을 가리고, 흐리면 새벽 도시의 회색 배경에 묻힌다.
   */
  warn: 0xff7d6e,
  water: 0x6fb3c9,
  ui: 0xfdf6e7,
  uiLine: 0x8a7a63,
};

/** 스테이지별 테마 색 — 플레이스홀더 배경/타일 생성용 */
export const STAGE_THEME = {
  prologue_morning: { sky: [0xffd9b8, 0xfbeadf], far: 0xbfd2b0, mid: 0x9dbd8c, near: 0x6f9163, ground: 0x8fae74 },
  prologue_noon: { sky: [0x9fd0ef, 0xdcefff], far: 0xa9cf9a, mid: 0x86bb76, near: 0x5d8a52, ground: 0x7fae66 },
  prologue_evening: { sky: [0xe98a5b, 0x8f6ba3], far: 0x8f7f8e, mid: 0x6d6076, near: 0x453f52, ground: 0x6a5f63 },
  prologue_night: { sky: [0x241f33, 0x3a3350], far: 0x2e2942, mid: 0x241f33, near: 0x1a1626, ground: 0x2a2438 },
  city: { sky: [0x9aa6b2, 0xd6dde3], far: 0x8d99a6, mid: 0x6f7c89, near: 0x4d5763, ground: 0x5c646d },
  coast: { sky: [0x7ec8e3, 0xdff3fb], far: 0x7fb6c9, mid: 0xe4d3a8, near: 0xc9b183, ground: 0xd8c497 },
  coast_sunset: { sky: [0xf2a25c, 0x7a5c8f], far: 0x9f7f96, mid: 0xc08f6e, near: 0x8a6450, ground: 0xa9805f },
  mountain: { sky: [0x1e2440, 0x39406b], far: 0x2b3358, mid: 0x223047, near: 0x162032, ground: 0x2f3a2c },
  mountain_dawn: { sky: [0x3d4a75, 0xf0b98a], far: 0x5a6289, mid: 0x3c4a5c, near: 0x22303c, ground: 0x3a463a },
  field: { sky: [0x9fd7f2, 0xe8f6ff], far: 0xb2d6a0, mid: 0x8dc079, near: 0x5f8f54, ground: 0x83b26a },
  home: { sky: [0x2a2136, 0x453856], far: 0x3a2f47, mid: 0x2f2739, near: 0x241d2c, ground: 0x4a3b3a },
};
