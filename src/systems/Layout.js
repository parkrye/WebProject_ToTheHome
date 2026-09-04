/**
 * 화면 배치 헬퍼.
 *
 * AI 에셋은 원본 해상도가 제각각이라 setScale 로 크기를 맞추면 교체할 때마다 어긋난다.
 * 그래서 UI 와 소품은 "화면에서 몇 픽셀로 보일지"를 직접 지정한다.
 */

/** 비율을 지키며 목표 크기에 맞춘다. width 나 height 중 하나만 주면 된다 */
/**
 * 지면 위에 놓이는 것들을 **살짝 파묻는다.**
 *
 * 타일 윗면에 정확히 올려 놓으면 오히려 붕 떠 보인다. 지면 그림의 윗면에는 풀·자갈 같은
 * 부드러운 층이 있어서, 물체가 그 안으로 조금 들어가야 땅에 붙은 것으로 읽힌다.
 */
export const GROUND_SINK = 7;

/**
 * 세이브 포인트 소품은 더 깊이 파묻는다.
 *
 * 모래 놀이터·포장마차·연못처럼 **바닥이 넓은 것**들이라, 지면에 살짝 얹는 정도로는
 * 땅 위에 놓인 게 아니라 떠 있는 것처럼 읽힌다.
 */
export const SAVE_SINK = 18;

/**
 * 그리는 앞뒤 순서.
 *
 * 지면 타일보다 소품이 뒤에 있으면, 땅에 **서 있는** 것이 아니라 땅에 **박힌** 것으로
 * 읽힌다. 그래서 지면에 서는 소품은 언제나 타일 위다.
 */
export const TILE_DEPTH = 10;
export const PROP_DEPTH = 11;

/**
 * 액터 시트용 크기 맞춤.
 *
 * 칸 안 여백을 쳐 주므로, `height` 는 **화면에서 그림이 차지할 높이**다.
 * 비율을 모르면 그냥 칸 높이로 맞춘다.
 */
export function sizeToActor(gameObject, { height }, fill) {
  if (!gameObject || !height) return gameObject;
  return sizeTo(gameObject, { height: fill ? height / fill : height });
}

export function sizeTo(gameObject, { width, height } = {}) {
  if (!gameObject) return gameObject;

  const srcW = gameObject.frame ? gameObject.frame.realWidth || gameObject.frame.width : gameObject.width;
  const srcH = gameObject.frame ? gameObject.frame.realHeight || gameObject.frame.height : gameObject.height;
  if (!srcW || !srcH) return gameObject;

  const ratio = srcW / srcH;
  if (height) {
    gameObject.setDisplaySize(height * ratio, height);
  } else if (width) {
    gameObject.setDisplaySize(width, width / ratio);
  }
  return gameObject;
}

/** UI 기본 크기 — 한곳에서 관리해야 화면이 흐트러지지 않는다 */
export const UI_SIZE = {
  titleLogo: 300, // 높이
  menuIcon: 104,
  markerDog: 62,
  touchButton: 92,
  jumpButton: 108,
  pauseIcon: 46,
  prompt: 62,
  rotateNotice: 220,
  creditsMarks: 96,
  pausePanel: 300,
};
