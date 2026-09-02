# 이미지 에셋 2차 — 아틀라스 방식

1차(`assets-images.md`)로 뽑아 본 결과를 반영한 **재생성용 프롬프트**다.
소품과 지형 타일은 낱장이 아니라 **균등 격자 아틀라스 한 장**으로 받는다.

---

## 0. 1차에서 배운 것

| 겪은 일 | 이번 대응 |
|---|---|
| "transparent background" 라고 쓰면 AI가 **체커보드 무늬를 그려서** 준다 (실제 알파 아님) | 투명을 요구하지 않는다. **단색 마젠타 배경**을 요구하고 전처리가 지운다 |
| 소품 세트가 크기·위치 제각각이라 잘라 쓸 수 없었다 | **균등 격자**를 강제하고, 칸마다 무엇이 들어갈지 번호로 지정한다 |
| 낱개 소품에 어두운 배경 + 후광이 깔려 나왔다 | 배경에 그림자·후광·비네트를 넣지 말라고 못 박는다 |
| 해상도가 1536×1024, 2172×724 등 제각각이었다 | 비율만 맞추면 된다. 전처리가 규격에 맞춰 다시 앉힌다 |
| 타일셋 9열 격자가 행마다 높이가 달랐다 | 칸 수를 8칸으로 줄여 성공률을 올린다 |

### 마젠타 배경을 쓰는 이유

`#FF00FF` 는 이 게임의 어떤 소품에도 쓰이지 않는 색이라, 전처리가 **오려낼 곳과 남길 곳을
확실히 구분**할 수 있다. 체커보드나 검은 그라데이션은 실제 그림과 색이 섞여서 지우면
가장자리가 지저분해진다.

---

## 1. 공통 프롬프트 조각

모든 프롬프트 앞뒤에 이 두 덩어리를 붙인다.

**앞에 붙일 것 (스타일)**

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image.
```

**뒤에 붙일 것 (기술 조건 — 절대 빼지 말 것)**

```
The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

> **그림자 금지**가 중요하다. 바닥 그림자가 있으면 오려낼 때 소품 밑에 시커먼 얼룩이 남는다.
> 그림자는 게임 안에서 코드로 그린다.

---

## 2. 소품 아틀라스 — 4열 × 3행 (12칸)

- 저장 경로: `assets-src/props/props_<스테이지>.png`
- 비율만 **4 : 3** 이면 되고 해상도는 자유 (권장 2048×1536)
- 전처리가 칸마다 배경을 지우고, 여백을 자르고, **칸 바닥에 세워서** 1536×1152 로 다시 저장한다
- 게임은 프레임 번호(0~11)로 꺼내 쓴다. **칸 순서가 곧 번호**다 (왼→오, 위→아래)

```
0  1  2  3
4  5  6  7
8  9 10 11
```

### 2.1 `props_city.png` — 도시

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A foggy-morning city prop sheet arranged in a strict grid of exactly 4 columns and 3 rows, twelve equal square cells of identical size, one object centered in each cell and standing on that cell's bottom edge. Reading left to right, top to bottom the cells contain: a cast-iron street lamp, a traffic light with blank unlit lenses, a round metal drain grate seen from the side, a terracotta flower pot with a small plant, a weathered public bench, a dented metal trash bin, a stack of three cardboard boxes, a rolled-down shop shutter with a completely blank face, a red fire hydrant, an old bicycle leaning on its stand, a bare street tree in a square planter, and a tall wall of small blank memorial niches. Muted palette of concrete gray, rust orange and dull teal. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

| 0 | 1 | 2 | 3 |
|---|---|---|---|
| 가로등 | 신호등 | 하수구 그레이트 | 화분 |
| **4** 벤치 | **5** 쓰레기통 | **6** 상자더미 | **7** 셔터 |
| **8** 소화전 | **9** 자전거 | **10** 가로수 | **11** 납골당 유골함 벽 |

### 2.2 `props_coast.png` — 해안가

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A sunny coastal prop sheet arranged in a strict grid of exactly 4 columns and 3 rows, twelve equal square cells of identical size, one object centered in each cell and standing on that cell's bottom edge. Reading left to right, top to bottom the cells contain: a rusted metal guardrail section, a striped mooring bollard, a red and white floating buoy, a coiled rope, a wooden fish crate, a heap of fishing nets, a folded beach parasol, a vending machine with completely blank panels, a life ring on a wooden post, a small ship anchor, a wind-bent coastal pine tree, and a short white and red lighthouse. Sun-bleached palette of pale sand, sea green, rust and warm gray. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

| 0 | 1 | 2 | 3 |
|---|---|---|---|
| 가드레일 | 볼라드 | 부표 | 밧줄 |
| **4** 나무상자 | **5** 어망 | **6** 파라솔 | **7** 자판기 |
| **8** 구명튜브 | **9** 닻 | **10** 해안 소나무 | **11** 등대 |

### 2.3 `props_mountain.png` — 산

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A night mountain forest prop sheet arranged in a strict grid of exactly 4 columns and 3 rows, twelve equal square cells of identical size, one object centered in each cell and standing on that cell's bottom edge. Reading left to right, top to bottom the cells contain: a mossy fallen log, a cluster of ferns, a ring of small mushrooms, a pile of flat river stepping stones, a rusted animal snare trap with open jaws, a broken wooden trail post with a blank arrow board, a thorn bush, a hollow tree stump, a hanging vine, a pile of loose rocks, a tall pine tree, and a bare branch with a small round owl perched on it. Dark forest palette of deep green, damp brown and cool gray with faint moonlit rim light. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

| 0 | 1 | 2 | 3 |
|---|---|---|---|
| 쓰러진 통나무 | 고사리 | 버섯 | 디딤돌 |
| **4** 덫 | **5** 이정표 | **6** 가시덤불 | **7** 그루터기 |
| **8** 덩굴 | **9** 돌무더기 | **10** 침엽수 | **11** 부엉이 앉은 가지 |

### 2.4 `props_field.png` — 들판

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A sunlit meadow prop sheet arranged in a strict grid of exactly 4 columns and 3 rows, twelve equal square cells of identical size, one object centered in each cell and standing on that cell's bottom edge. Reading left to right, top to bottom the cells contain: a weathered wooden fence segment, a round hay bale, a clump of wildflowers, a small flowering bush, a paper pinwheel on a stick, a cluster of dandelion puffs, a wooden garden gate, an upright stone marker, a metal watering can, a low trimmed hedge, a large round leafy tree, and a small country house with a faded red tile roof and two warm glowing windows. Warm pastel palette of fresh green, honey brown and cream in soft morning light. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

| 0 | 1 | 2 | 3 |
|---|---|---|---|
| 울타리 | 건초더미 | 들꽃 | 덤불 |
| **4** 바람개비 | **5** 민들레 | **6** 대문 | **7** 돌 표지 |
| **8** 물뿌리개 | **9** 산울타리 | **10** 큰 나무 | **11** 집 |

> **11번 집**은 스테이지 4 종착점이자 프롤로그·엔딩에 나오는 그 집이다.
> `bg_home_exterior.png` 의 집과 같은 모양이어야 한다.

---

## 3. 지형 타일 아틀라스 — 4열 × 2행 (8칸)

- 저장 경로: `assets-src/tiles/tiles_<스테이지>.png`
- 비율 **4 : 2** (권장 1024×512). 전처리가 512×256(칸당 128px)으로 맞춘다
- **칸을 꽉 채워야 한다.** 소품과 달리 여백이 있으면 지면에 틈이 생긴다
- 0~3번은 좌우로 이어 붙여도 이음매가 보이지 않아야 한다

```
0  1  2  3     ← 지면 윗면
4  5  6  7     ← 속·발판
```

### 3.1 `tiles_city.png`

```
Soft hand-painted pixel art platformer tileset, warm pastel palette with muted saturation, storybook atmosphere, consistent art style. A foggy-morning city tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a clean cracked concrete sidewalk surface seen from the side with a worn top edge, the same sidewalk surface with a few weeds growing from the cracks, the same sidewalk surface with a metal drain slot, the same sidewalk surface with a patch of loose broken paving, a solid concrete fill block for underground mass, a dull faded red brick fill block, a thin dark metal grate platform only one third as tall as the cell, and a low painted concrete curb block. The top four tiles must tile seamlessly when repeated side by side horizontally. Muted palette of concrete gray, dull brick red and cold teal. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow and no drop shadow. Absolutely no text, no letters, no numbers, no watermark.
```

### 3.2 `tiles_coast.png`

```
Soft hand-painted pixel art platformer tileset, warm pastel palette with muted saturation, storybook atmosphere, consistent art style. A sunny coastal tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a damp packed sand surface seen from the side with a soft top edge, the same sand surface scattered with small shells and pebbles, a worn asphalt road surface with a faded painted stripe, the same asphalt surface with cracks and patched repairs, a dry pale sand fill block, a barnacled dark rock fill block, a weathered wooden boardwalk plank platform only one third as tall as the cell, and a gray concrete seawall block. The top four tiles must tile seamlessly when repeated side by side horizontally. Sun-bleached palette of pale sand, sea green, rust and warm gray. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow and no drop shadow. Absolutely no text, no letters, no numbers, no watermark.
```

### 3.3 `tiles_mountain.png`

```
Soft hand-painted pixel art platformer tileset, warm pastel palette with muted saturation, storybook atmosphere, consistent art style. A night mountain tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a mossy dirt surface seen from the side with a grass fringe along the top edge, the same dirt surface with exposed tree roots, a bare rocky surface with a jagged top edge, a wet stone surface beside a stream with a slick top edge, a dark packed earth fill block, a jagged gray rock fill block, a mossy fallen log platform only one third as tall as the cell, and a rope and plank bridge segment only one third as tall as the cell. The top four tiles must tile seamlessly when repeated side by side horizontally. Deep forest palette of dark green, damp brown, cool gray and faint moonlit silver. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow and no drop shadow. Absolutely no text, no letters, no numbers, no watermark.
```

### 3.4 `tiles_field.png`

```
Soft hand-painted pixel art platformer tileset, warm pastel palette with muted saturation, storybook atmosphere, consistent art style. A sunlit meadow tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a lush grass surface seen from the side with a soft blade fringe along the top edge, the same grass surface dotted with tiny wildflowers, a bare dirt footpath surface with a soft top edge, the same grass surface with a few small stones set into it, a warm brown soil fill block, a paler dry earth fill block, a weathered wooden fence rail platform only one third as tall as the cell, and a low mossy stone step block. The top four tiles must tile seamlessly when repeated side by side horizontally. Warm pastel palette of fresh green, honey brown and cream. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow and no drop shadow. Absolutely no text, no letters, no numbers, no watermark.
```

| 칸 | 쓰임 |
|---|---|
| 0 | 지면 윗면 — 기본 (가장 많이 쓰임) |
| 1 | 지면 윗면 — 변형 A |
| 2 | 지면 윗면 — 변형 B / 길 |
| 3 | 지면 윗면 — 변형 C |
| 4 | 땅속 채움 — 기본 |
| 5 | 땅속 채움 — 변형 |
| 6 | **얇은 발판** (칸 높이의 1/3) |
| 7 | 벽 · 연석 · 계단 |

---

## 4. 배경 레이어 — 다시 뽑을 때만

1차 배경은 전처리로 살려 놓았으니 **다시 뽑을 필요는 없다.**
새로 뽑는다면 아래 조건만 바꾸면 된다.

기존 프롬프트(`assets-images.md` 1~5절)에서 이 문장을

```
fully transparent background
```

이렇게 바꾼다.

```
The sky area is a completely flat solid magenta #FF00FF fill with no gradient and no clouds, so it can be cut out cleanly. Only the scenery itself is painted.
```

`sky` 레이어와 실내 배경(`bg_columbarium_interior`, `bg_home_interior_night`, `bg_home_exterior`)은
**원래 불투명이 맞으므로** 이 치환을 하지 않는다.

---

## 5. 아직 없는 것

`assets-sprites.md` 의 **8프레임 캐릭터 스프라이트 28종**이 비어 있다.
강아지·주인·자동차·파도 같은 움직이는 것은 전부 코드로 그린 임시 그림이 나온다.
게임의 인상을 가장 크게 바꾸는 부분이니 다음 차례로 권한다.

---

## 6. 넣는 법

```bash
# 1. assets-src/ 아래 규정된 경로에 원본을 넣는다
#      assets-src/props/props_city.png
#      assets-src/tiles/tiles_city.png
# 2. 전처리 (배경 제거 · 격자 정렬 · 축소)
python scripts/prepare_assets.py --only images
# 3. 목록 갱신 후 실행
npm run dev
```

`public/assets/` 는 **전처리 결과물**이라 직접 손대지 않는다. 원본은 항상 `assets-src/` 에 둔다.

## 7. 체크리스트

1. 배경이 **단색 마젠타**인가 (그라데이션·후광·그림자 없음)
2. 칸 수가 정확한가 — 소품 12칸(4×3), 타일 8칸(4×2)
3. 칸마다 물건이 **하나씩** 들어 있고 서로 겹치지 않는가
4. 소품이 칸 **바닥에 서 있는가** (공중에 떠 있으면 안 됨)
5. 타일이 칸을 **꽉 채우는가** (여백이 있으면 지면에 틈이 생긴다)
6. 어디에도 글자·숫자·상표가 없는가
7. 파일명이 위 표와 정확히 일치하는가
