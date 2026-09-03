# 여기는 전처리 결과물이다

**이 디렉터리의 파일은 직접 손대지 않는다.** `assets-src/` 의 원본을
`npm run assets:prepare` 가 가공해 만들어 낸 것이다.

```
assets-src/          원본 (git 에 올리지 않는다)
     ↓  npm run assets:prepare
public/assets/       게임이 읽는 것  ← 여기
```

원본을 `assets-src/` 에 두지 않고 여기에 바로 넣어 버린 파일이 이미 있다면,
되돌릴 원본이 없으므로 정상 경로를 태울 수 없다. 그럴 때만 예외로

```bash
python scripts/repair_public_assets.py [--dry-run]
```

가 그 파일들을 **제자리에서** 같은 규격으로 정리한다. 전처리와 같은 함수를
쓰므로 결과물은 같다. 어디까지나 뒷수습이고, 원본은 `assets-src/` 에 넣는 것이 맞다.

전처리가 하는 일:

- **배경 레이어** — 하늘 자리에 그려진 체커보드/흰 배경을 지워 알파로 만든다
- **소품** — 가장자리 배경이나 마젠타 키를 지우고 여백을 잘라 낸다
- **아틀라스** — 균등 격자 칸마다 배경을 지우고, 소품을 칸 바닥에 세워 다시 정렬한다
- **UI 시트** — 버튼·아이콘을 낱개로 나눈다
- **오디오** — ogg 로 변환하고, 필요한 길이만큼 잘라 낸다

## 원본 넣는 곳

| 경로 | 내용 | 규격 |
|---|---|---|
| `assets-src/sprites/` | 8프레임 애니메이션 시트 | 가로 8칸 × 1줄 |
| `assets-src/bg/` | 배경 (하늘·패럴랙스·실내) | 비율만 맞으면 된다 |
| `assets-src/tiles/` | 지형 타일 아틀라스 | **4열 × 2행** |
| `assets-src/props/` | 소품 아틀라스와 낱개 소품 | 아틀라스는 **4열 × 3행** |
| `assets-src/ui/` | GUI | — |
| `assets-src/cutscene/` | 컷 일러스트 | — |
| `assets-src/audio/` | 소리 (wav/mp3/ogg 아무거나) | — |

파일명은 `.docs/assets-images2.md`, `.docs/assets-sprites.md`, `.docs/assets-audio.md`
의 표와 정확히 일치해야 한다.

## manifest.json

`npm run assets`(dev/build 가 자동 실행)가 이 디렉터리를 훑어 목록을 갱신한다.
게임은 이 목록에 있는 파일만 불러오고, 없는 것은 코드로 그린 임시 그림으로 대체한다.

`autodetect: true` 로 바꾸면 목록 대신 HTTP 요청으로 파일 존재를 직접 확인하지만,
요청이 백 개 넘게 생겨 로딩이 느려지므로 권하지 않는다.

## 런타임 주입

타이틀의 **뼈다귀** 아이콘을 고르면 로컬 PNG 를 그 자리에서 넣어볼 수 있다.
파일명이 에셋 이름과 같아야 하고(`dog_walk.png` → `dog_walk`), 가로 8프레임 시트여야 한다.
새로고침하면 사라지므로, 영구 적용은 `assets-src/sprites/` 에 넣고 전처리를 돌린다.
