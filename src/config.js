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
  footPadding: 2, // 전처리가 발을 칸 바닥에 붙여 주므로 여백이 거의 없다
  displaySize: 96,
};

/** 카메라 */
export const CAMERA = {
  lerp: 0.1,
  deadzoneWidth: 240,
  deadzoneHeight: 140,
  followOffsetY: 40,
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
