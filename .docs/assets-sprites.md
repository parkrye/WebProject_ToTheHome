# 애니메이션 에셋 — 8프레임 스프라이트

## 0. 만드는 방법

1. **레퍼런스 이미지 한 장**을 먼저 만든다. 캐릭터를 고정하는 기준 그림이며,
   각 항목의 "① 레퍼런스" 프롬프트로 뽑는다. 같은 인물이면 레퍼런스를 돌려 쓴다.
2. 아래 **8줄짜리 프롬프트**를 넣는다. 각 줄이 **한 장의 그림**이 된다.
3. 나온 8장을 가로로 이어 붙여 시트 한 장으로 만든다.
4. `assets-src/sprites/<이름>.png` 로 저장하고 `npm run assets:prepare` 를 돌린다.

```
레퍼런스 그림 + 8줄 프롬프트  →  8장  →  가로로 이어 붙임  →  시트 1장
```

- 프롬프트 문장에는 `Frame 1:` 같은 **번호를 붙이지 않는다.** 각 줄이 독립된 그림 지시다.
- 캐릭터의 생김새는 레퍼런스가 정하므로, 문장은 **자세와 동작만** 서술한다.
- 8장이 이어져 하나의 동작이 되도록, 마지막 줄은 첫 줄로 자연스럽게 돌아가야 한다
  (점프처럼 한 번만 재생하는 것은 예외).
- **한 시트에는 한 동작만 담는다.** 문을 열거나 누구를 만나는 것 같은 *장면*은 넣지 않는다.
  배경·문·빛·상대 캐릭터는 각자 따로 있는 부품이고, 겹치고 움직이는 건 코드가 한다.

## 1. 규격

| 항목 | 값 |
|---|---|
| 프레임 수 | **항상 8장** |
| 시트 배열 | 가로 8칸 × 세로 1줄 |
| 배경 | 투명. 생성기가 투명을 못 하면 **단색 마젠타 `#FF00FF`** 로 두면 전처리가 지운다 |
| 프레임 크기 | 정사각형이면 아무 크기나 (전처리가 160px 로 맞춘다) |
| 시점 | 정측면, 진행 방향 **오른쪽** |
| 저장 경로 | `assets-src/sprites/<이름>.png` |

> 프레임마다 캐릭터가 **같은 자리에 서 있어야 한다.** 그림이 프레임 안에서 좌우로
> 옮겨 다니면 재생할 때 덜덜 떨린다. 발이 닿는 바닥선을 8장 모두 같은 높이에 둔다.

---

## 1.1 8칸이 전부 고리는 아니다

생성기가 **기본 서 있는 자세에서 시작해** 그리다 보니, 앞칸이 들어가는 동작이고 뒷칸이
마무리 동작인 시트가 나온다. 8칸을 그대로 돌리면 한 바퀴마다 벌떡 일어난다.

그래서 시트마다 **어디부터 어디까지가 고리인지** 를 `AssetManifest.js` 에 적어 둔다
(`loopFrom` / `loopTo`, 0부터 센다). 로더가 셋으로 나눠 등록한다.

| 등록되는 이름 | 무엇 |
|---|---|
| `key` | **고리**. 평소에 `play(key)` 하면 이것이 돈다 |
| `key_in` | 들어가는 동작. 한 번만 |
| `key_out` | 마무리 동작. 한 번만 |

세이브 포인트 모션은 `들어가기 → 고리 → 마무리` 로 이어 재생한다. 마무리는 주어진
시간이 끝나기 전에 미리 시작해서 딱 맞아떨어지게 한다.

실제로 뽑힌 시트를 눈으로 확인한 결과는 이렇다.

| 시트 | 고리 | 비고 |
|---|---|---|
| `dog_sniff` `dog_splash` `dog_ball_nudge` | 1~8 전체 | 그대로 돌려도 이어진다 |
| `dog_dig` | **2~3** | 1은 서 있는 자세, 4~8은 털고 일어서는 마무리 |
| `dog_sleep` | **4~8** | 1~3은 엎드리는 동작 |
| `owner_adult_wake` `owner_adult_kneel` | 없음 (비루프) | 마지막 칸에서 멈춰 있어도 어색하지 않다 |

---

## 2. 이미 만든 것 — 강아지 10종

`dog_idle` `dog_walk` `dog_run` `dog_jump` `dog_sniff` `dog_dispel`
`dog_dig` `dog_sleep` `dog_splash` `dog_ball_nudge`

다시 뽑을 일이 있을 때를 위해 프롬프트를 남겨 둔다.

### `dog_idle` — 대기 (루프 · 8fps)

```
The dog stands still in side view with all four paws planted and its tail hanging relaxed.
The dog breathes in, its chest slightly raised and both ears drooping softly.
The dog's chest is at its fullest and its tail has lifted a little.
The dog breathes out, chest settling back down while the tail sways to the left.
The dog blinks with both eyes closed, its body at the lowest resting height.
The dog opens its eyes again and one ear flicks upward.
The tail sways gently to the right while the head tilts a hair forward.
The dog has returned to the neutral standing pose, ready to begin again.
```

### `dog_walk` — 걷기 (루프 · 10fps)

```
The dog begins a walking stride with its front-right paw lifted and reaching forward.
The front-right paw plants on the ground while the rear-left paw pushes off behind.
The dog glides forward at its lowest point, weight carried by two diagonal legs.
The front-left paw swings forward through the air and the tail arcs to the left.
The front-left paw lands and the dog's shoulders lift slightly.
The rear-right paw pushes off and the body rises to the highest point of the stride.
The head bobs gently downward as the rear legs gather underneath the belly.
The dog finishes the stride in the same posture that began it.
```

### `dog_run` — 달리기 (루프 · 14fps)

```
The dog stretches into a full gallop, front paws thrown far forward and rear paws trailing far behind.
The front paws strike the ground and the dog's spine begins to compress.
The dog's body is fully compressed with all four paws gathered under the belly.
The rear legs extend explosively and launch the dog off the ground.
The dog is airborne in mid-bound with its legs tucked and ears streaming backward.
The dog reaches the top of the bound, back arched and tail streaming straight behind.
The dog begins to descend with its front legs reaching out to catch the ground.
The front paws are about to touch down, flowing back into the start of the gallop.
```

### `dog_jump` — 점프 (비루프 · 12fps)

```
The dog crouches low with deeply bent legs, gathering power to jump.
The dog's rear legs extend explosively and its front paws leave the ground.
The dog rises steeply, body stretched upward and ears blown backward.
The dog hangs at the peak of the jump, body level and legs slightly tucked.
The dog starts to fall, front paws reaching downward and tail lifting.
The dog descends faster with all four legs extended toward the ground.
The dog's paws hit the ground and its legs absorb the impact in a deep bend.
The dog springs back up from the landing into a normal standing posture.
```

### `dog_sniff` — 냄새 맡기 (루프 · 8fps)

```
The dog lowers its head toward the ground with its nose almost touching the dirt.
The dog's nose twitches and a few tiny glowing motes drift up in front of its muzzle.
The dog shuffles its front paws one step forward while keeping its nose down.
The dog inhales deeply, ribcage expanding and ears perking slightly.
The dog's tail begins to wag as it catches a familiar scent.
The dog swings its muzzle a little to the right, still tracking along the ground.
The dog lifts its head halfway with its eyes half-closed in concentration.
The dog lowers its nose back down to the ground to begin sniffing again.
```

### `dog_dispel` — 빛으로 흩어짐 (비루프 · 10fps, 부활은 역재생)

```
The dog stands intact while a soft warm light begins to glow along its outline.
The dog's silhouette turns translucent as pale golden motes lift away from its fur.
The dog's tail and hind legs dissolve into drifting particles of light.
Half of the dog's body has scattered into floating warm sparks.
Only the head and chest remain, loosely held together out of glowing dust.
The last shape of the dog breaks apart into a swirling cloud of gentle light.
The particles spread outward and begin to fade away.
Only a few faint golden motes are left, almost completely transparent.
```

### `dog_dig` — 땅파기 (루프 · 12fps)

```
The dog plants its rear legs and lowers its chest toward the sand, front paws poised.
The dog's front-right paw rakes backward through the sand, kicking up a small spray.
The front-left paw follows through and a puff of sand bursts under the dog's belly.
Both front paws scrabble rapidly and sand arcs backward past the hind legs.
The dog pauses with its nose buried in the shallow hole it has dug.
The dog lifts its head with a few grains of sand stuck to its muzzle.
The dog shakes its head once, scattering sand from its ears.
The dog drops back into the digging stance to begin again.
```

### `dog_sleep` — 낮잠 (루프 · 6fps)

```
The dog turns once in place and begins folding its legs underneath itself.
The dog settles onto its belly with its chin hovering just above its front paws.
The dog rests its chin fully on its paws and closes both eyes.
The dog's ribcage expands slowly in a deep sleeping breath.
The ribcage settles and the tail curls closer around the body.
One ear twitches slightly while the dog dreams.
A hind leg kicks once, very small, as if running inside a dream.
The dog goes still again in its curled sleeping pose.
```

### `dog_splash` — 물장구 (루프 · 12fps)

```
The dog stands ankle-deep in shallow water with one front paw raised above the surface.
The dog slaps that paw down and a ring of water bursts outward around it.
Droplets fly up around the dog's chest as the other front paw lifts.
The dog stomps both front paws into the water and a wide sheet of spray rises.
The dog bites playfully at the flying droplets with its head lowered.
The dog hops a little off the surface with all four paws clear of the water.
The dog lands and a tall crown-shaped splash erupts around its legs.
The water settles into ripples while the dog raises a paw to start again.
```

### `dog_ball_nudge` — 공을 코로 툭툭 (루프 · 10fps)

```
The dog stands over a small red rubber ball with its nose lowered toward it.
The dog touches the ball with its nose and the ball tips slightly forward.
The dog pushes harder and the ball rolls a short distance to the right.
The dog trots one step to follow the rolling ball, tail wagging.
The dog stops the ball with a soft tap of its front paw.
The dog drops into a play bow, chest low and hindquarters raised.
The dog flicks the ball back to the left with the side of its muzzle.
The dog stands over the ball again, ready to play once more.
```

---

## 3. 남은 것 — 연출용 6종

프롤로그와 엔딩에만 나온다. 강아지 다음으로 필요한 것들이다.

> **원칙: 한 시트는 한 동작만 담는다.**
> "문을 연다", "문 너머로 강아지가 보인다" 같은 **장면**을 스프라이트에 넣지 않는다.
> 문·빛·강아지는 따로 있는 부품이고, 그것들을 겹치고 움직이는 건 코드가 한다.
> 그래야 한 동작을 여러 장면에서 다시 쓸 수 있고, 하나가 어긋나도 전부 다시 뽑지 않는다.

각 항목은 **① 레퍼런스 그림 프롬프트**(한 장)와 **② 8줄 동작 프롬프트**로 되어 있다.
①로 기준 그림을 먼저 만들고, 그 그림을 넣은 채로 ②의 여덟 줄을 돌린다.

### 어른 주인은 레퍼런스 하나를 셋이 함께 쓴다

`owner_adult_wake` · `owner_adult_walk` · `owner_adult_kneel` 은 같은 사람이므로
**레퍼런스를 한 번만 만들어** 세 시트에 모두 쓴다.

```
Soft hand-painted pixel art character reference, a single adult person standing in a neutral side view pose facing right, arms relaxed at the sides, wearing simple soft home clothes in muted warm colours, plain short hair, facial features kept soft and barely detailed so the face reads as anyone's, full body visible from head to feet with both feet on an invisible ground line, warm pastel palette with gentle rim light, storybook dream atmosphere, one character only. The background is a completely flat solid magenta #FF00FF fill with no gradient, no glow, no drop shadow and no ground shadow. No text, no letters, no numbers, no watermark, no logo.
```

---

### 3.1 `dog_puppy_run` — 어린 강아지가 신나게 달린다
루프 · 14fps

**① 레퍼런스**

```
Soft hand-painted pixel art character reference, a single puppy version of a small cream-and-white short-haired dog with a red neckerchief, standing in a neutral side view pose facing right, drawn with puppy proportions of an oversized round head, big floppy ears, short stubby legs and a plump belly, full body visible with all four paws on an invisible ground line, warm pastel palette with gentle rim light, storybook dream atmosphere, one character only. The background is a completely flat solid magenta #FF00FF fill with no gradient, no glow, no drop shadow and no ground shadow. No text, no letters, no numbers, no watermark, no logo.
```

**② 동작 8줄**

```
The puppy stretches into a clumsy gallop with its front paws reaching forward.
The puppy's front paws land and its oversized head dips downward.
The puppy's short legs gather under its plump belly.
The puppy pushes off with both hind legs and lifts off the ground.
The puppy floats in mid-bound with its floppy ears flying upward.
The puppy reaches the top of the bound with its tail wagging in a blur.
The puppy tips forward and reaches for the ground with its front paws.
The puppy is about to touch down, ready to bound again.
```

---

### 3.2 `owner_child_run` — 어린 주인이 달린다
루프 · 12fps

**① 레퍼런스**

```
Soft hand-painted pixel art character reference, a single young child of about seven years old standing in a neutral side view pose facing right, arms relaxed at the sides, wearing a soft yellow coat and simple trousers, plain short hair, facial features kept soft and barely detailed so the face reads as anyone's, full body visible from head to feet with both feet on an invisible ground line, warm pastel palette with gentle rim light, storybook dream atmosphere, one character only. The background is a completely flat solid magenta #FF00FF fill with no gradient, no glow, no drop shadow and no ground shadow. No text, no letters, no numbers, no watermark, no logo.
```

**② 동작 8줄**

```
The child runs to the right with the left leg swung forward and both arms open.
The child's left foot lands and the body leans into the stride.
The child's weight passes over the planted foot as the arms swing across the chest.
The right leg drives forward and the child's hair lifts in the wind.
The right foot lands and the child's shoulders rise at the top of the stride.
Both feet leave the ground for a single airborne moment with the coat flaring out.
The child descends with the left leg reaching forward again.
The child completes the stride in the same pose that began it.
```

---

### 3.3 `owner_walk_silhouette` — 어둠 속에서 걸어온다
루프 · 8fps

프롤로그 마지막 컷에서 쓴다. **걷는 동작만** 있으면 된다 —
어디서 어디로 걸어오는지, 언제 멈추는지, 언제 어두워지는지는 코드가 정한다.

**① 레퍼런스**

```
Soft hand-painted pixel art character reference, a single adult figure rendered as a completely solid black featureless silhouette with no facial features and no clothing detail, standing in a neutral side view pose facing right, arms relaxed at the sides, full body visible from head to feet with both feet on an invisible ground line, only the outer shape readable, one character only. The background is a completely flat solid magenta #FF00FF fill with no gradient, no glow, no drop shadow and no ground shadow. No text, no letters, no numbers, no watermark, no logo.
```

**② 동작 8줄**

```
The black silhouette begins a slow walking stride with the left leg swung forward.
The left foot lands and the body settles over it.
The silhouette's weight passes over the planted foot with both arms hanging still.
The right leg swings forward through the air.
The right foot lands and the shoulders rise slightly.
The silhouette reaches the tallest point of the stride.
The left leg swings forward again as the body dips.
The silhouette completes the stride in the same pose that began it.
```

---

### 3.4 `owner_adult_wake` — 침대에서 일어나 선다
비루프 · 8fps · 224px · 레퍼런스는 위의 **어른 주인** 공용

침대는 배경과 소품에 이미 있으므로 **사람만** 그린다.
누운 자세에서 시작해 두 발로 서는 데서 끝난다. 문은 나오지 않는다.

**② 동작 8줄**

```
The adult lies asleep on one side with knees drawn up and eyes closed.
The adult's eyes open while the body stays lying down.
The adult props up on one elbow and lifts the head and shoulders.
The adult pushes upright into a sitting pose with the legs still folded.
The adult swings both legs down and sits on the edge with feet on the ground.
The adult leans forward and pushes off with both hands to rise.
The adult straightens up onto both feet, still slightly hunched.
The adult stands fully upright with arms relaxed at the sides.
```

### 3.5 `owner_adult_walk` — 어른이 걷는다
루프 · 10fps · 224px · 레퍼런스는 위의 **어른 주인** 공용

```
The adult begins a slow walking stride with the left leg swung forward.
The left foot lands and the body settles over it.
The adult's weight passes over the planted foot as the arms swing gently.
The right leg swings forward through the air.
The right foot lands and the shoulders rise slightly.
The adult reaches the tallest point of the stride.
The left leg swings forward again as the body dips.
The adult completes the stride in the same pose that began it.
```

### 3.6 `owner_adult_kneel` — 무릎을 꿇고 두 팔을 벌린다
비루프 · 8fps · 224px · 레퍼런스는 위의 **어른 주인** 공용

재회 장면에 쓴다. **사람의 동작만** 담는다 — 강아지는 따로 있는 스프라이트를
코드가 품 쪽으로 옮기고, 껴안는 순간은 화면이 하얗게 물들며 가려진다.

```
The adult stands upright with arms relaxed at the sides.
The adult bends both knees slightly and begins to lower.
The adult sinks lower with the back straight and arms starting to lift.
One knee touches the ground and the other stays raised.
The adult settles onto both knees with the torso upright.
The adult begins to open both arms forward.
The adult spreads both arms wide and leans slightly forward.
The adult holds both arms wide open, waiting to receive something.
```

---

## 4. 애니메이션에서 뺀 것들

전에는 자동차·돌·파도까지 8프레임으로 잡아 두었는데, **모양이 변하지 않고 위치·각도·크기만
바뀌는 것들이라 애니메이션이 필요 없다.** 그림 한 장을 두고 코드가 움직인다.

| 전에 | 지금 | 움직임은 |
|---|---|---|
| `car_pass` | `actors_*` 0번 칸 | 코드가 가로로 옮긴다 |
| `rock_fall` | `actors_*` 1번 칸 | 중력으로 떨어지며 코드가 회전시킨다 |
| `wave_loop` | `actors_*` 1번 칸 | 코드가 밀려왔다 빠지게 한다 |
| `boar_charge` | `actors_*` 0번 칸 | 예고할 때 잘게 떨고, 돌진은 속도로 |
| `steam_vent` | `actors_*` 2번 칸 | 분출할 때 세로로 늘어나며 나타난다 |
| `seagull_fly` | `actors_*` 3번 칸 | 코드가 떠다니게 한다 |
| `butterfly` | `actors_field` 2번 칸 | 코드가 위아래로 흔든다 |
| `owl_watch` | `actors_mountain` 3번 칸 | 가만히 있는 게 맞다 |
| `grass_sway` | `props_*` 들꽃 칸 | 배경 레이어가 이미 흔들린다 |
| `platform_crumble` | 지형 타일 | 코드가 흔들고 떨어뜨린다 |
| `stream_water` | 지형 타일 | — |
| `scent_wisp` | `ui_scent_mote` | 코드가 떠오르고 깜박이게 한다 |
| `savepoint_glow` | `ui_save_glow` | 코드가 숨 쉬듯 밝기를 바꾼다 |

이것들의 프롬프트는 `.docs/assets-images2.md` 에 있다.

---

## 5. 체크리스트

1. 8장이 맞는가
2. 배경이 투명하거나 **단색 마젠타**인가 (체커보드 무늬를 그려 놓은 게 아닌가)
3. 8장에서 캐릭터의 크기·색·귀 모양이 같은가
4. 발이 닿는 바닥선이 8장 모두 같은 높이인가
5. 루프 동작이라면 8번째에서 1번째로 자연스럽게 이어지는가
6. 파일명이 위 이름과 정확히 같은가
