# 움직이는 것들 — 8프레임으로 굽기

`images2` 로 받은 `actors_<스테이지>.png` 4장(각 4칸)을 **낱장 16개로 쪼개 두었다.**
이 16장이 8프레임 시트를 만들 때 쓰는 **레퍼런스 그림**이다.

```bash
python scripts/split_actor_sheets.py "C:\Users\<이름>\Downloads\images2"
```

결과는 `assets-src/_ref/actors_single/actor_<스테이지>_<역할>.png` (1024×1024, 배경 마젠타).
구워 낸 **8프레임 시트는 `assets-src/_ref/actors/`** 에 둔다. 스크립트는 낱장을 일부러
다른 곳에 떨어뜨리므로 시트를 덮어쓰지 않는다. `_ref/` 는 전처리가 건드리지 않는다.

| 파일 | 스테이지 | 역할 | 무엇 |
|---|---|---|---|
| `actor_city_mover` | 도시 | MOVER | 소형차 |
| `actor_city_faller` | 도시 | FALLER | 넘어진 화분 |
| `actor_city_puff` | 도시 | PUFF | 하수구 증기 |
| `actor_city_flyer` | 도시 | FLYER | 참새 |
| `actor_coast_mover` | 해안 | MOVER | 해치백 |
| `actor_coast_faller` | 해안 | FALLER | 파도 |
| `actor_coast_puff` | 해안 | PUFF | 바위 물보라 |
| `actor_coast_flyer` | 해안 | FLYER | 갈매기 |
| `actor_mountain_mover` | 산 | MOVER | 멧돼지 |
| `actor_mountain_faller` | 산 | FALLER | 낙석 — **낱장 그대로 쓴다** (아래 참고) |
| `actor_mountain_puff` | 산 | PUFF | 골짜기 안개 |
| `actor_mountain_flyer` | 산 | FLYER | 부엉이 |
| `actor_field_mover` | 들판 | MOVER | 작은 새 |
| `actor_field_faller` | 들판 | FALLER | 민들레 홀씨 |
| `actor_field_puff` | 들판 | PUFF | 나비 |
| `actor_field_flyer` | 들판 | FLYER | 잠자리 |

> 역할 이름은 `AssetManifest.js` 의 `ACTOR` 상수(MOVER/FALLER/PUFF/FLYER)와 같다.
> 칸 번호로 꺼내 쓰던 것을 이름으로 꺼내 쓰게 되는 셈이다.

---

## 1. 굽는 법

`assets-sprites.md` 와 규칙이 같다. **레퍼런스 그림 한 장 + 8줄 프롬프트 → 8장 → 가로로 이어 붙임.**

1. 위 표의 레퍼런스 PNG를 생성기에 물린다.
2. 아래 **공통 지시문**을 붙이고, 해당 항목의 8줄 중 한 줄을 이어서 한 장씩 뽑는다.
   (한 번에 8칸짜리 시트로 받을 수 있는 생성기라면 8줄을 통째로 넣는다.)
3. 나온 8장을 가로로 이어 붙여 `assets-src/sprites/<이름>.png` 로 저장한다.
4. `python scripts/prepare_assets.py --only images` → 배경 제거·크기 정렬까지 전처리가 한다.

### 공통 지시문

```
Use the attached image as the exact reference for this subject's shape, colours and art style; do not redesign it. Soft hand-painted pixel art game asset, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer. The subject stays at exactly the same size and the same position within the frame and never drifts sideways or changes scale. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### 지킬 것

- **프레임 수는 항상 8장**, 가로 8칸 × 세로 1줄.
- 8장 모두 **물체가 같은 자리에 같은 크기**로 있어야 한다. 프레임 안에서 좌우로 옮겨 다니면
  재생할 때 덜덜 떨린다. 이동·회전·명멸은 게임 코드가 준다.
- 프롬프트 줄에 `Frame 1:` 같은 **번호를 붙이지 않는다.** 각 줄이 독립된 그림 지시다.
- 마지막 줄은 첫 줄로 자연스럽게 돌아간다 (전부 루프다. 비루프는 없다).
- 진행 방향은 **오른쪽**. 레퍼런스가 이미 오른쪽을 보고 있으니 뒤집지 않는다.

---

## 2. 도시

### `actor_city_mover` — 소형차 (루프 · 12fps)

```
The car sits level on its wheels with the hubcap patterns upright and the body at its normal ride height.
The wheels have turned an eighth of a turn and the body dips slightly on its suspension.
The wheels have turned a quarter of the way around and the body sits at its lowest, nose tipped a hair down.
The wheels keep turning and the body starts to rise back toward level.
The wheels have made a half turn from the start and the body is level again.
The wheels turn on and the body lifts to its highest point, nose tipped a hair up.
The wheels have almost come back around and the body begins to settle.
The wheels have made one full turn and the car has returned to the pose it began in.
```

### `actor_city_faller` — 넘어진 화분 (루프 · 12fps)

```
The flower pot is tipped with its mouth facing up and to the right, and a little loose soil is spilling out.
The pot has rolled an eighth of a turn clockwise and the spilled soil trails behind its mouth.
The pot lies on its side with its mouth facing right and the soil spreading into a loose arc.
The pot has rolled further clockwise, its mouth tipping downward, and the soil scatters wider.
The pot is upside down with its mouth facing straight down and the soil falling in a thin curtain.
The pot keeps tumbling with its mouth swinging toward the left and the soil breaking into separate clumps.
The pot lies on its other side with its mouth facing left and only a few crumbs still falling.
The pot has come back around to the mouth-up-right pose that began the tumble.
```

### `actor_city_puff` — 하수구 증기 (루프 · 10fps)

```
A thin wisp of white steam has just begun to rise from the drain grate, barely taller than the grate itself.
The steam has grown into a low soft column reaching a third of the way up.
The column pushes higher and its top swells into a small round billow.
The steam reaches two thirds of the way up and its middle narrows into a waist.
The plume is at its tallest, the top billow spread wide and starting to thin at its edges.
The top of the plume drifts apart into loose separate puffs while the base stays thick.
The upper puffs have faded away and only a soft haze is left above the grate.
The last haze is almost gone and a fresh thin wisp is rising from the grate again.
```

> 아래의 **하수구 뚜껑은 8장 모두 같은 자리에 같은 크기로** 있어야 한다. 움직이는 건 김뿐이다.

### `actor_city_flyer` — 참새 (루프 · 14fps)

```
The sparrow glides with both wings held straight out to the sides at shoulder height.
The wings sweep upward and the wingtips rise above the sparrow's back.
The wings reach the top of the beat, nearly touching above the body, and the tail fans slightly.
The wings begin to sweep down with the primary feathers spread wide.
The wings pass level with the body and the sparrow's chest lifts.
The wings drive down past the belly and the tail closes.
The wings reach the bottom of the beat with the tips pointing down beneath the body.
The wings sweep back up into the level gliding pose that began the cycle.
```

---

## 3. 해안

### `actor_coast_mover` — 해치백 (루프 · 12fps)

```
The car sits level on its wheels with the whip antenna standing straight up.
The wheels have turned an eighth of a turn, the body dips on its suspension and the antenna bends back.
The wheels have turned a quarter of the way around, the body sits at its lowest and the antenna leans further back.
The wheels keep turning, the body starts to rise and the antenna springs back toward upright.
The wheels have made a half turn from the start, the body is level and the antenna is upright.
The wheels turn on, the body lifts to its highest point and the antenna whips slightly forward.
The wheels have almost come back around, the body begins to settle and the antenna sways back.
The wheels have made one full turn and the car has returned to the pose it began in.
```

### `actor_coast_faller` — 파도 (루프 · 12fps)

```
The wave is a low swell with a smooth unbroken back and only a thin line of foam along its crest.
The swell has risen higher, its face steepening while the foam gathers along the top.
The crest curls forward into a hook with white foam spilling over the lip.
The curl has thrown forward and the falling foam breaks into a bright sheet.
The lip crashes down into the trough and foam bursts outward along the base.
The broken water spreads forward as a wide flat rush of white foam.
The foam thins and slides back while the body of the wave sinks down.
The water has drawn back into the low smooth swell that began the cycle.
```

### `actor_coast_puff` — 바위 물보라 (루프 · 12fps)

```
The rock stands wet with only a thin skirt of foam around its base and no spray above it.
A narrow jet of white spray shoots up the front of the rock to about half the rock's height.
The spray rises past the top of the rock and breaks into scattered droplets.
The spray reaches its full height, a wide fan of fine droplets spread above the rock.
The top of the fan begins to break apart into separate flecks drifting outward.
The droplets rain back down around the rock and the fan thins from the top.
Only a light mist and a few falling flecks are left around the rock.
The mist has settled into the foam at the base and the rock is nearly clear again.
```

> **바위는 8장 모두 같은 자리에 같은 모양**으로 있어야 한다. 물만 움직인다.

### `actor_coast_flyer` — 갈매기 (루프 · 10fps)

```
The seagull glides with both wings stretched straight out and level with its body.
The wings tilt up slightly and the wingtips begin to lift.
The wings rise into a shallow V above the body with the tips curved upward.
The wings reach the top of the slow beat, held high with the feathers slightly separated.
The wings sweep down and pass level with the body again.
The wings press below the body and the seagull's chest rises a little.
The wings reach the bottom of the beat with the tips angled down and the tail spread.
The wings glide back up into the level pose that began the cycle.
```

---

## 4. 산

### `actor_mountain_mover` — 멧돼지 걷기 (루프 · 10fps)

```
The boar stands in side view with all four hooves planted and its head lowered.
The boar lifts its front-right hoof and reaches it forward while its snout stays low.
The front-right hoof plants and the rear-left hoof pushes off behind.
The boar's body is at the lowest point of the stride, its weight carried by two diagonal legs.
The front-left hoof swings forward through the air and the bristles along the spine sway.
The front-left hoof lands and the shoulders lift slightly.
The rear-right hoof pushes off and the body rises to the highest point of the stride.
The boar has come back to the posture that began the stride.
```

### ~~`actor_mountain_faller`~~ — 낙석은 굽지 않는다

**낱장 그대로 쓰기로 했다.** 떨어지는 돌은 회전만 하면 되고, 그 회전은 코드가 각도를
돌려 주는 편이 8장을 굽는 것보다 낫다. 8장으로 굽으면 프레임마다 돌 모양이 미세하게
달라져 오히려 덜컹거린다.

`assets-src/_ref/actors/actor_mountain_faller.png` 는 **1024×1024 낱장**이며 그대로 둔다.
아래 프롬프트는 쓰지 않지만, 마음이 바뀔 때를 위해 남겨 둔다.

```
The rock hangs with its cracked face toward the viewer and a few small chips beside it.
The rock has turned an eighth of the way around clockwise and the chips drift below it.
The rock has turned a quarter of the way around, the crack now running diagonally across it.
The rock has turned three eighths of the way around and the chips trail further behind.
The rock has turned half way around with the cracked face pointing down.
The rock has turned five eighths of the way around and the chips are scattered wider.
The rock has turned three quarters of the way around, the crack running the other diagonal.
The rock has almost finished a full turn, back to the pose that began the cycle.
```

### `actor_mountain_puff` — 골짜기 안개 (루프 · 6fps)

```
The low bank of pale mist lies even and shallow with an almost flat top edge.
The left half of the bank swells upward into a soft rounded rise.
The rise drifts toward the middle while the right edge thins out.
The mist is tallest in the middle, its top edge curling into slow soft rolls.
The swell drifts further right and a thin gap opens on the left.
The right side lifts into a rounded rise while the left settles low.
The rise thins and spreads until the whole bank is shallow again.
The mist has flattened back into the even low bank that began the cycle.
```

### `actor_mountain_flyer` — 부엉이 (루프 · 6fps)

```
The owl perches on the stump facing the viewer with both eyes wide open and its feathers lying smooth.
The owl's eyes close halfway and its body settles a little lower.
The owl's eyes are fully closed in a slow blink.
The owl's eyes open again and its head tilts a little to the left.
The head is tilted furthest left while the body stays square to the viewer.
The head turns back through the middle and the owl puffs out its chest feathers.
The head tilts a little to the right and the feathers settle again.
The owl has returned to the square wide-eyed perched pose that began the cycle.
```

> 레퍼런스가 **그루터기에 앉아 정면을 보는** 그림이라 앉은 대기 동작으로 잡았다.
> 날아가는 부엉이가 필요하면 갈매기(3절) 8줄을 그대로 쓰고 레퍼런스만 바꾸면 된다.

---

## 5. 들판

### `actor_field_mover` — 작은 새 (루프 · 14fps)

```
The bird glides with both wings held wide and level and its tail closed.
The wings sweep upward and the tail spreads a little.
The wings reach the top of the beat, raised high above the back with the tips nearly meeting.
The wings begin to drive down and the primary feathers fan apart.
The wings pass level with the body and the bird's head lifts a hair.
The wings push down past the belly and the tail closes again.
The wings reach the bottom of the beat with the tips angled beneath the body.
The wings sweep back up into the level gliding pose that began the cycle.
```

### `actor_field_faller` — 민들레 홀씨 (루프 · 8fps)

```
The dandelion seed drifts upright with its filament crown spread evenly and the seed hanging straight below it.
The crown tips slightly to the right and the filaments on that side splay wider.
The seed swings out to the right beneath the crown while the filaments trail to the left.
The crown has turned a little clockwise and the filaments gather closer together.
The seed hangs straight down again while the crown is turned a quarter of the way around.
The crown tips to the left and the filaments on that side splay wider.
The seed swings out to the left while the filaments trail to the right.
The crown rights itself and the seed returns to the pose that began the drift.
```

### `actor_field_puff` — 나비 (루프 · 12fps)

```
The butterfly is seen from directly above with both wings spread completely flat and open.
Both wings have tilted up a little, narrowing the spread slightly.
The wings have risen into a shallow V above the body and read narrower from above.
The wings are raised steeply and nearly touching above the body, seen almost edge on.
The wings meet at the top of the beat, folded together into a single thin shape.
The wings open back down into a steep V.
The wings drop to a shallow V, almost flat again, and the antennae sway.
The wings are spread completely flat and open again, ready to beat.
```

> 나비만 **위에서 내려다본 시점**이다. 레퍼런스가 그렇게 그려져 나왔고, 게임에서도
> 공중을 떠도는 장식이라 옆모습일 필요가 없다. 날개가 접힐 때 **몸통 위치는 그대로** 둔다.

### `actor_field_flyer` — 잠자리 (루프 · 16fps)

```
The dragonfly hovers with all four wings held straight out to the sides and perfectly level.
The front pair of wings tilts up while the rear pair tilts down.
The front wings are raised high and the rear wings pressed low, the two pairs fully out of phase.
The front wings start back down while the rear wings start back up.
All four wings pass level with each other and blur together.
The front wings press low while the rear wings rise high, the phase now reversed.
The front wings begin to rise again and the rear wings begin to drop.
All four wings return to the level hovering pose that began the cycle.
```

---

## 6. 어떻게 게임에 들어가 있나

**시트 한 장에 역할 네 줄.** 세로 한 줄이 역할 하나(`ACTOR` 상수 순서)이고,
가로 8칸이 그 역할의 애니메이션이다. 스테이지마다 한 장이므로 시트는 넷.

```
public/assets/props/actors_<스테이지>.png   2560 x 1280  (칸 320px)

      0   1   2   3   4   5   6   7      ← 프레임
 0 [ mover  ................... ]        ← ACTOR.MOVER
 1 [ faller ................... ]
 2 [ puff   ................... ]
 3 [ flyer  ................... ]
```

- `prepare_assets.py` 의 `do_actor_sheets()` 가 `assets-src/_ref/actors/` 의 낱장 시트
  16개를 읽어 이 한 장으로 합친다. **`_ref/actors/` 가 원본 자리다** — 여기에 새 시트를
  덮어쓰고 전처리를 다시 돌리면 그대로 반영된다.
- 합치면서 배경 마젠타 제거·디스필·여백 정리를 한다. 여백을 자르고 크기를 맞추는 건
  **8장을 한 덩어리로** 한다. 프레임마다 따로 하면 날개를 편 칸만 작게 앉아 덜컹거린다.
- 프레임마다 물체가 널뛰는 시트는 `ACTOR_FIX` 에 적어 자리를(필요하면 크기까지) 맞춘다.
- `AssetLoader.registerActorAnimations()` 가 줄마다 애니메이션을 만든다.
  key 는 `actors_city_flyer` 꼴이고, 속도는 `ACTOR_FPS` 가 정한다.
- `Hazards.js` 와 `Decor.placeProp()` 이 그 애니메이션을 재생한다.
  스테이지 데이터(`{ atlas: 'actors_city', frame: ACTOR.FLYER }`)는 **바꿀 필요가 없었다** —
  `frame` 이 이제 칸 번호가 아니라 줄 번호로 읽힌다.

낙석만 낱장이라, 같은 그림을 여덟 번 넣어 둔다. 애니메이션은 돌지만 그림이 안 바뀐다.
따로 분기하지 않으려고 일부러 그렇게 했다.

## 7. 1차 굽기 결과 — 무엇을 다시 뽑아야 하나

15장을 구워 넣고 프레임마다 위치·크기·색을 재 봤다. 세 부류로 갈린다.

| 결과 | 몇 장 | 무엇 |
|---|---|---|
| 그대로 쓴다 | 8 | city_mover, coast_mover, coast_faller, coast_flyer, mountain_mover, mountain_flyer, field_puff, field_faller |
| 전처리가 고친다 | 4 | city_puff, coast_puff, mountain_puff, field_flyer |
| **다시 뽑아야 한다** | 3 | **city_flyer, field_mover, city_faller** |

### 초록 오염 — 다시 뽑을 필요 없다

증기·물보라·안개 세 장은 그림 한가운데가 **형광 초록**으로 물들어 있다 (불투명 픽셀의
11~15%). 잠자리도 다섯 번째 칸에 초록 테두리가 둘렸다.

반투명하고 색이 없는 것(김·물방울·안개)을 크로마키로 오려 내면 배경색이 그림 속으로
번진다. 피사체 자체에 색이 없어서 "배경인지 그림인지" 가릴 기준이 없기 때문이다.

- **조치**: 전처리가 **디스필**한다 — 초록이 빨강·파랑보다 튀는 픽셀에서 초록을 둘 중
  높은 쪽까지 끌어내린다. 김과 물보라는 원래 흰색·회색이라 이렇게만 해도 제 색으로 돌아온다.
  실제로 돌려 보니 물보라와 안개는 완전히 깨끗해지고, 증기는 여섯 번째 칸만 조금 탁하다.
- 다시 뽑는다면 **배경을 마젠타로** 두는 게 낫다. 마젠타는 이 그림들 어디에도 없는 색이라
  번져도 알아보기 쉽고, 초록보다 잘 갈린다.

### 프레임마다 크기가 널뛴다 — 이건 다시 뽑아야 한다

| 시트 | 프레임별 가로 | 바닥선 흔들림 | 증상 |
|---|---|---|---|
| `actor_city_flyer` | 159 ~ 246px | 40px | 2·3번 칸의 참새가 눈에 띄게 크고, 1번 칸은 왼쪽이 잘렸다 |
| `actor_field_mover` | 200 ~ 255px | 61px | 같은 증상. 1번 칸 꼬리가 프레임 밖으로 나갔다 |
| `actor_city_faller` | 139 ~ 232px | 52px | 화분이 구르면서 커졌다 작아진다 (7번 칸이 가장 작다) |

재생할 때 물체가 **커졌다 작아졌다 하며 덜컹거린다.** 코드로는 못 고친다.

---

## 8. 다시 뽑는 3장

레퍼런스는 `assets-src/_ref/actors_single/` 의 같은 이름 파일을 쓴다.
(8프레임 시트가 `_ref/actors/` 를 덮었으므로 낱장을 다시 뽑아 두었다.)

### 공통 지시문 — 강화판

앞선 실패가 **크기가 널뛰는 것**이었으므로, 크기와 자리를 못 박는 문장을 앞에 세웠다.
아래 세 장은 2절의 공통 지시문 대신 **이것**을 쓴다.

```
Use the attached image as the exact reference for this subject's shape, colours and art style; do not redesign it. Soft hand-painted pixel art game asset, warm pastel palette with muted saturation, gentle rim light, storybook dream atmosphere, side-scrolling platformer. Draw eight frames as one horizontal strip of eight equal square cells in a single row. In every cell the subject is drawn at exactly the same scale, seen from exactly the same distance, with its body centred on the same point of the cell; only the parts named in each line move. Leave a clear empty margin on all four sides so that no part of the subject ever touches a cell edge. The background is a completely flat solid magenta #FF00FF fill with absolutely no gradient, no vignette, no glow, no drop shadow and no ground shadow anywhere. Absolutely no text, no letters, no numbers, no labels, no watermark, no logo, no signature.
```

### `actor_city_flyer` — 참새 (루프 · 14fps)

몸통을 고정하고 **날개만** 움직이라고 매 줄에서 다시 말한다.

```
The sparrow's body is level and still, with both wings held straight out to the sides at shoulder height.
The body stays exactly where it was; the wings have swept up so the wingtips are level with the top of the back.
The body stays exactly where it was; the wings are raised high above the back with the tips nearly meeting.
The body stays exactly where it was; the wings have started down and the primary feathers are fanned wide.
The body stays exactly where it was; the wings are level with the body again and the tail has spread a little.
The body stays exactly where it was; the wings have driven down past the belly and the tail has closed.
The body stays exactly where it was; the wings are at the bottom of the beat with the tips below the feet.
The body stays exactly where it was; the wings have swept back up into the straight-out pose that began the cycle.
```

### `actor_field_mover` — 작은 새 (루프 · 14fps)

```
The songbird's body is level and still, with both wings held wide and level and the tail closed.
The body stays exactly where it was; the wings have swept up so the wingtips are level with the top of the back.
The body stays exactly where it was; the wings are raised high with the tips nearly meeting above the back.
The body stays exactly where it was; the wings have begun to drive down and the feathers are fanned apart.
The body stays exactly where it was; the wings are level with the body again and the tail has spread slightly.
The body stays exactly where it was; the wings have pushed down past the belly and the tail has closed.
The body stays exactly where it was; the wings are at the bottom of the beat with the tips below the feet.
The body stays exactly where it was; the wings have swept back up into the level pose that began the cycle.
```

### `actor_city_faller` — 넘어진 화분 (루프 · 12fps)

화분은 제자리에서 **한 바퀴 도는 것**이 전부다. 크기를 매 줄에서 못 박는다.

```
The flower pot is drawn at the centre of the cell with its mouth facing up and to the right, a little loose soil spilling from it.
The same pot at the same size has turned an eighth of a turn clockwise about its own centre, and the spilled soil trails behind the mouth.
The same pot at the same size has turned a quarter turn clockwise and lies on its side with the mouth facing right, the soil spreading in a loose arc.
The same pot at the same size has turned three eighths of a turn clockwise, the mouth tipping downward and the soil scattering wider.
The same pot at the same size has turned half a turn clockwise and is upside down with the mouth facing straight down, the soil falling in a thin curtain.
The same pot at the same size has turned five eighths of a turn clockwise, the mouth swinging toward the left and the soil breaking into separate clumps.
The same pot at the same size has turned three quarters of a turn clockwise and lies on its other side with the mouth facing left, only a few crumbs still falling.
The same pot at the same size has turned seven eighths of a turn clockwise, almost back to the mouth-up-right pose that began the tumble.
```

---

## 9. 체크리스트

1. 8칸이 정확히 같은 크기인가
2. 물체가 8장 모두 **같은 자리·같은 크기**인가 (특히 하수구 뚜껑·바위)
3. 마지막 칸에서 첫 칸으로 자연스럽게 이어지는가
4. 배경이 단색 마젠타이고 그림자·후광이 없는가
5. 어디에도 글자·숫자·상표가 없는가
6. 파일명이 1절 표와 정확히 일치하고 `assets-src/sprites/` 에 있는가
