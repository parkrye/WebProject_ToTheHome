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
| "문이 열리고 그 너머에 강아지" 같은 **장면**을 한 장으로 받으려 했다 | 장면을 그리지 않는다. 닫힌 문 / 빈 문틀 / 빛을 **부품으로 나눠** 받고 코드가 겹친다 |

### 마젠타 배경을 쓰는 이유

`#FF00FF` 는 이 게임의 어떤 소품에도 쓰이지 않는 색이라, 전처리가 **오려낼 곳과 남길 곳을
확실히 구분**할 수 있다. 체커보드나 검은 그라데이션은 실제 그림과 색이 섞여서 지우면
가장자리가 지저분해진다.

---

## 1. 모든 프롬프트에 들어 있는 공통 조각

아래 2~6절의 프롬프트에는 이 두 덩어리가 **이미 앞뒤로 붙어 있다.**
따로 이어 붙일 필요 없이 **코드블록을 통째로 복사해서 그대로 넣으면 된다.**
여기 적어 두는 건 무엇이 왜 들어가 있는지 알아 두라는 뜻이다.

**앞 (스타일 고정)**

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image.
```

**뒤 (기술 조건)**

```
The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

> **그림자 금지**가 중요하다. 바닥 그림자가 있으면 오려낼 때 소품 밑에 시커먼 얼룩이 남는다.
> 그림자는 게임 안에서 코드로 그린다.
>
> 지형 타일(3절)만 "서로 떨어뜨리라"는 문장을 빼고 쓴다. 타일은 칸을 꽉 채워야 하기 때문이다.

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
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A foggy-morning city tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a clean cracked concrete sidewalk surface seen from the side with a worn top edge, the same sidewalk surface with a few weeds growing from the cracks, the same sidewalk surface with a metal drain slot, the same sidewalk surface with a patch of loose broken paving, a solid concrete fill block for underground mass, a dull faded red brick fill block, a thin dark metal grate platform only one third as tall as the cell, and a low painted concrete curb block. The top four tiles must tile seamlessly when repeated side by side horizontally. Muted palette of concrete gray, dull brick red and cold teal. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 3.2 `tiles_coast.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A sunny coastal tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a damp packed sand surface seen from the side with a soft top edge, the same sand surface scattered with small shells and pebbles, a worn asphalt road surface with a faded painted stripe, the same asphalt surface with cracks and patched repairs, a dry pale sand fill block, a barnacled dark rock fill block, a weathered wooden boardwalk plank platform only one third as tall as the cell, and a gray concrete seawall block. The top four tiles must tile seamlessly when repeated side by side horizontally. Sun-bleached palette of pale sand, sea green, rust and warm gray. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 3.3 `tiles_mountain.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A night mountain tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a mossy dirt surface seen from the side with a grass fringe along the top edge, the same dirt surface with exposed tree roots, a bare rocky surface with a jagged top edge, a wet stone surface beside a stream with a slick top edge, a dark packed earth fill block, a jagged gray rock fill block, a mossy fallen log platform only one third as tall as the cell, and a rope and plank bridge segment only one third as tall as the cell. The top four tiles must tile seamlessly when repeated side by side horizontally. Deep forest palette of dark green, damp brown, cool gray and faint moonlit silver. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 3.4 `tiles_field.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A sunlit meadow tileset arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square tiles of identical size, each tile filling its cell completely edge to edge with no padding and no gap. Reading left to right, top to bottom the tiles are: a lush grass surface seen from the side with a soft blade fringe along the top edge, the same grass surface dotted with tiny wildflowers, a bare dirt footpath surface with a soft top edge, the same grass surface with a few small stones set into it, a warm brown soil fill block, a paler dry earth fill block, a weathered wooden fence rail platform only one third as tall as the cell, and a low mossy stone step block. The top four tiles must tile seamlessly when repeated side by side horizontally. Warm pastel palette of fresh green, honey brown and cream. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
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

## 4. 움직이는 것들 — 4열 × 1행 (4칸)

자동차·돌·파도처럼 **모양은 그대로고 위치나 각도만 바뀌는 것들**이다.
전에는 8프레임 애니메이션으로 잡아 두었지만 그럴 필요가 없어서, 그림 한 장을 두고
코드가 옮기고 돌리고 늘린다.

- 저장 경로: `assets-src/props/actors_<스테이지>.png`
- 비율 **4 : 1** (권장 2048×512). 전처리가 1280×320(칸당 320px)으로 맞춘다
- 소품과 마찬가지로 칸 바닥에 세우고, 배경은 단색 마젠타

| 칸 | 역할 | 도시 | 해안 | 산 | 들판 |
|---|---|---|---|---|---|
| 0 | 큰 이동체 | 자동차 | 자동차 | 멧돼지 | 큰 새 |
| 1 | 떨어지거나 밀려오는 것 | 화분 | 파도 | 낙석 | 민들레 홀씨 |
| 2 | 피어오르는 것 | 하수구 증기 | 물보라 | 골짜기 안개 | 나비 |
| 3 | 나는 것 | 참새 | 갈매기 | 부엉이 | 잠자리 |

> 0번 자동차와 1번 파도는 가로로 길다. 칸을 벗어나지만 않으면 되고, 게임에서 높이를
> 지정해 쓰므로 칸 안에서 작아 보여도 괜찮다.

### 4.1 `actors_city.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A foggy-morning city sheet arranged in a strict grid of exactly 4 columns and 1 row, four equal square cells of identical size, one object centered in each cell and resting on that cell's bottom edge. Reading left to right the cells contain: a small boxy compact car seen from the side with a completely blank license plate, a terracotta flower pot tipped as if falling with a little loose soil, a tall plume of white steam rising from a round metal drain grate, and a small gray city sparrow with its wings spread in flight. Muted palette of concrete gray, rust orange and dull teal. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 4.2 `actors_coast.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A sunny coastal sheet arranged in a strict grid of exactly 4 columns and 1 row, four equal square cells of identical size, one object centered in each cell and resting on that cell's bottom edge. Reading left to right the cells contain: a small pale hatchback car seen from the side with a completely blank license plate, a low curling wave of seawater with white foam along its lip seen from the side, a burst of fine white sea spray rising off wet rock, and a white seagull gliding with both wings spread wide. Sun-bleached palette of pale sand, sea green, rust and warm gray. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 4.3 `actors_mountain.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A night mountain sheet arranged in a strict grid of exactly 4 columns and 1 row, four equal square cells of identical size, one object centered in each cell and resting on that cell's bottom edge. Reading left to right the cells contain: a bristly brown wild boar standing in side view with its head lowered, a jagged gray rock with a crack across it as if just broken loose, a low bank of pale valley mist drifting close to the ground, and a small round gray owl perched facing the viewer with both eyes wide open. Deep forest palette of dark green, damp brown and cool gray with faint moonlit rim light. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 4.4 `actors_field.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A sunlit meadow sheet arranged in a strict grid of exactly 4 columns and 1 row, four equal square cells of identical size, one object centered in each cell and resting on that cell's bottom edge. Reading left to right the cells contain: a small brown songbird with its wings spread in flight, a drifting dandelion seed puff, a pale yellow butterfly with both wings fully open, and a slender blue dragonfly with clear wings. Warm pastel palette of fresh green, honey brown and cream in soft morning light. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

---

## 5. 집 안 부품 — 4열 × 2행 (8칸)

프롤로그 마지막 컷과 엔딩에 쓴다. 저장 경로 `assets-src/props/props_home.png`, 비율 **4 : 2**.

> **장면을 통째로 그리지 않는다.**
> "문이 열리고 그 너머에 강아지가 서 있다" 같은 그림을 한 장으로 받으면 그 장면에서만
> 쓸 수 있고, 강아지 모습이 스프라이트와 어긋난다. 대신 **닫힌 문 / 빈 문틀 / 쏟아지는 빛**을
> 따로 받아서 코드가 겹친다. 문이 열리면 닫힌 문이 사라지고 빈 문틀 뒤로 빛이 깔리며,
> 그 앞에 평소 쓰던 강아지 스프라이트가 그대로 선다.

```
0  1  2  3
4  5  6  7
```

| 칸 | 내용 | 쓰임 |
|---|---|---|
| 0 | 닫힌 나무문 (문틀 포함) | 평소 상태 |
| 1 | **빈 문틀** — 문짝이 없고 안쪽이 뚫려 있다 | 문이 열린 뒤. 이 구멍 뒤에 강아지를 세운다 |
| 2 | 문에서 쏟아지는 따뜻한 빛 | 1번 뒤에 깔아 역광을 만든다 |
| 3 | 낮은 1인용 침대 | 주인이 자고 있는 곳 |
| 4 | 둥근 강아지 방석 | 침대 옆 |
| 5 | 창문 (달빛) | 벽 장식 |
| 6 | 작은 스탠드 램프 | 따뜻한 불빛 |
| 7 | 빈 액자 | 벽 장식 (그림은 비워 둔다) |

### 5.1 `props_home.png`

```
Soft hand-painted pixel art game asset sheet, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer, consistent art style across every item in the image. A cosy bedroom interior part sheet arranged in a strict grid of exactly 4 columns and 2 rows, eight equal square cells of identical size, one object centered in each cell and resting on that cell's bottom edge. Reading left to right, top to bottom the cells contain: a closed wooden door set in its frame seen straight on, the same door frame completely empty with the doorway opening hollow and see-through, a soft rectangular shaft of warm golden light shaped like a doorway with no frame around it, a low single bed with a rumpled quilt seen from the side, a round padded dog cushion, a small square window with cool moonlight in it, a short bedside lamp with a warm glowing shade, and an empty picture frame with a blank face. Warm palette of amber lamplight, deep brown wood and dusty blue shadow. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Every item is fully separated from its neighbours and never overlaps the grid lines. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

> 1번 칸이 핵심이다. **문짝 없이 문틀만** 있어야 하고, 문틀 안쪽은 배경(마젠타)이 그대로
> 보여야 한다. 그래야 전처리가 그 구멍을 투명하게 만들고, 뒤에 둔 빛과 강아지가 비친다.

### 코드가 엔딩을 조립하는 순서

```
방 배경          bg_home_interior_night
  + 침대(3)  + 방석(4)  + 램프(6)
  + 닫힌 문(0)                       ← 처음
       ↓ 문 밖에서 소리
  주인이 일어난다                     owner_adult_wake
  주인이 문으로 걸어간다              owner_adult_walk + 코드가 x 이동
       ↓ 문 앞 도착
  닫힌 문(0)이 사라지고
  빛(2) → 빈 문틀(1) 순으로 깔린다
  그 사이에 강아지가 선다             dog_idle  ← 평소 쓰던 그 스프라이트
       ↓
  주인이 무릎 꿇고 팔을 벌린다        owner_adult_kneel
  강아지가 품으로 달려든다            dog_run + 코드가 x 이동
       ↓ 화면이 하얗게 물든다 (껴안는 순간은 빛에 가려진다)
```

---

## 6. 빛 두 장 — 낱장 GUI

냄새 입자와 세이브 오라도 애니메이션에서 뺐다. 밝기와 크기 변화는 코드가 준다.

### 6.1 `ui_scent_mote.png` (저장: `assets-src/ui/`)

```
Soft hand-painted pixel art game asset, warm pastel palette, storybook dream atmosphere, a single soft glowing mote of warm golden light centered in the image, painted as a smooth round radial glow that is bright cream white at the very center and fades out toward the edges, with no hard outline, no sparkle spikes, no lens flare and no rays. Nothing else is in the image. The background is completely solid pure black so the glow can be added onto the scene. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 6.2 `ui_save_glow.png` (저장: `assets-src/ui/`)

```
Soft hand-painted pixel art game asset, warm pastel palette, storybook dream atmosphere, a soft warm ring of golden light lying flat on the ground seen from a low side angle so it reads as a wide flattened ellipse, glowing brightest along the ring itself and fading out toward the edges, with a few tiny motes drifting upward from it, no hard outline and no ground texture. Nothing else is in the image. The background is completely solid pure black so the glow can be added onto the scene. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

> 이 둘만 배경이 **검정**이다. 게임에서 가산 합성으로 얹기 때문에 검정은 저절로 사라진다.
> 마젠타로 받으면 빛 가장자리에 자주색이 번져 지우기 어렵다.

---

## 7. 배경 레이어 — 다시 뽑을 때만

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

## 8. 아직 없는 것 — 남은 전부

애니메이션 스프라이트 16종은 다 들어왔다. 이미지로 남은 것은 아래가 **전부**이며,
모두 이 문서 안에 프롬프트가 있다.

| 무엇 | 몇 장 | 격자 | 어디에 |
|---|---|---|---|
| 소품 아틀라스 | 4 | 4×3 (12칸) | **2절** |
| 지형 타일 | 4 | 4×2 (8칸) | **3절** |
| 움직이는 것들 | 4 | 4×1 (4칸) | **4절** |
| 집 안 부품 | 1 | 4×2 (8칸) | **5절** |
| 빛 | 2 | 낱장 | **6절** |

합쳐서 **15장**이다. 배경(7절)은 이미 들어와 있어 다시 뽑지 않아도 된다.

> 화면에서 가장 티가 나는 건 **지형 타일**이다. 지금 지면이 밋밋한 회색 막대라
> 이것부터 채우면 인상이 크게 달라진다.

## 9. 넣는 법

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

## 10. 체크리스트

1. 배경이 **단색 마젠타**인가 (그라데이션·후광·그림자 없음)
2. 칸 수가 정확한가 — 소품 12칸(4×3), 타일 8칸(4×2)
3. 칸마다 물건이 **하나씩** 들어 있고 서로 겹치지 않는가
4. 소품이 칸 **바닥에 서 있는가** (공중에 떠 있으면 안 됨)
5. 타일이 칸을 **꽉 채우는가** (여백이 있으면 지면에 틈이 생긴다)
6. 어디에도 글자·숫자·상표가 없는가
7. `props_home` 1번 칸이 **문짝 없는 빈 문틀**이고 안쪽이 뚫려 있는가
8. 파일명이 위 표와 정확히 일치하는가
