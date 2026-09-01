# 에셋 넣는 곳

여기에 파일을 넣으면 **코드 수정 없이** 게임에 자동 반영된다.
파일이 없는 항목은 코드로 생성한 플레이스홀더 그래픽이 대신 쓰인다.

## 디렉터리

| 경로 | 내용 | 규격 |
|---|---|---|
| `sprites/` | 8프레임 애니메이션 시트 | 가로 8칸 × 세로 1줄, 투명 PNG |
| `bg/` | 배경 패럴랙스 레이어 | 1920×540 (실내 컷은 960×540) |
| `tiles/` | 지형 타일 | 32px 그리드 |
| `props/` | 소품 | 투명 PNG |
| `ui/` | GUI | 투명 PNG |
| `audio/` | BGM · 앰비언스 · SFX | `.ogg` 우선, `.mp3` 병행 |

## 파일명

파일명은 `.docs/assets-*.md` 의 표와 **정확히** 일치해야 한다.
예: `sprites/dog_walk.png`, `bg/bg_city_sky.png`, `audio/bgm_title.ogg`

## manifest.json

```json
{ "autodetect": true, "files": [] }
```

- `autodetect: true` (기본) — 게임이 시작할 때 실제 파일 존재를 직접 확인한다.
  파일을 넣기만 하면 바로 반영되지만, 아직 없는 에셋에 대한 404 경고가 콘솔에 남는다.
- `autodetect: false` — `files` 배열에 적은 경로만 실제 파일로 취급한다.
  콘솔이 깨끗해지므로 에셋을 다 채운 뒤에 이 방식으로 바꾸면 좋다.

```json
{
  "autodetect": false,
  "files": ["assets/sprites/dog_walk.png", "assets/bg/bg_city_sky.png"]
}
```

## 런타임 주입

타이틀에서 뼈다귀 아이콘(스프라이트 추가해서 시작)을 고르면,
로컬 PNG를 그 자리에서 넣어볼 수 있다. 파일명이 에셋 key 와 같아야 한다
(`dog_walk.png` → `dog_walk`). 이 주입은 저장되지 않으며 새로고침하면 사라진다.
영구 적용하려면 이 디렉터리에 파일을 넣으면 된다.
