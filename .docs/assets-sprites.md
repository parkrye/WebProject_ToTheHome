# 애니메이션 에셋 — 8프레임 스프라이트 시트

모든 애니메이션 에셋은 **가로 8칸 × 세로 1줄**의 스프라이트 시트로 제작한다.
프레임을 하나씩 생성해 이어붙여도 되고, 시트째 한 번에 생성해도 된다.

---

## 0. 공통 규격

| 항목 | 값 |
|---|---|
| 시트 배열 | 8 frames × 1 row (가로 배열) |
| 배경 | 완전 투명 (PNG-32, alpha) |
| 캐릭터 프레임 | 128 × 128 px (시트 1024 × 128) |
| 대형 / 2인 프레임 | 256 × 192 px (시트 2048 × 192) |
| 오브젝트 프레임 | 64 × 64 px (시트 512 × 64) |
| 시점 | 정측면(side view), 진행 방향 **오른쪽** |
| 저장 경로 | `public/assets/sprites/<파일명>.png` |

### 스타일 프리픽스 — 모든 프레임 문장 앞에 붙일 것

```
Pixel art sprite, side view facing right, 128x128 frame, fully transparent background, soft warm pastel palette, gentle hand-painted shading, storybook dream atmosphere, no text, no border, no ground shadow, consistent character design:
```

오브젝트 에셋은 위 문장에서 `128x128` 을 `64x64` 로, 2인 컷은 `256x192` 로 바꿔 쓴다.

### 주인공 고정 묘사 — 모든 강아지 프롬프트에서 동일하게 유지

```
a small cream-and-white short-haired mixed-breed dog with floppy ears, a dark button nose, round amber eyes and a lightly curled tail
```

> **일관성 팁**: `dog_idle` 의 1번 프레임을 먼저 확정하고, 이후 모든 생성에 그 이미지를
> 레퍼런스로 첨부하면 캐릭터가 흔들리지 않는다.

### 우선순위

- **P0** — 없으면 플레이 불가 (10종)
- **P1** — 연출·장애물 (12종)
- **P2** — 분위기 보강 (6종)

---

# P0 — 주인공

## 1. `dog_idle.png` — 대기
루프 · 8 fps · 128×128

```
Frame 1: The small cream-and-white dog stands still in side view with all four paws planted and its tail hanging relaxed.
Frame 2: The dog breathes in and its chest rises slightly while both ears droop softly.
Frame 3: The dog's chest reaches its fullest and the tail lifts a few pixels higher.
Frame 4: The dog exhales, the chest settles back down and the tail sways gently to the left.
Frame 5: The dog blinks with both eyes closed and its body sits at the lowest resting height.
Frame 6: The dog opens its eyes again and one ear flicks upward.
Frame 7: The tail sways gently to the right while the head tilts a hair forward.
Frame 8: The dog returns to the neutral standing pose so the cycle can loop back to frame one.
```

## 2. `dog_walk.png` — 걷기
루프 · 10 fps · 128×128

```
Frame 1: The dog starts a walk cycle with its front-right paw lifted and reaching forward.
Frame 2: The front-right paw plants on the ground while the rear-left paw pushes off behind it.
Frame 3: The dog's body glides forward at its lowest bob with two diagonal legs supporting the weight.
Frame 4: The front-left paw swings forward through the air and the tail arcs to the left.
Frame 5: The front-left paw lands and the dog's shoulders lift slightly.
Frame 6: The rear-right paw pushes off and the body reaches the highest bob of the cycle.
Frame 7: The head bobs gently downward as the rear legs gather underneath the belly.
Frame 8: The dog finishes the stride and settles into the same posture as frame one.
```

## 3. `dog_run.png` — 달리기 (도움닫기)
루프 · 14 fps · 128×128

```
Frame 1: The dog stretches into a full gallop with front paws thrown far forward and rear paws trailing far behind.
Frame 2: The front paws strike the ground and the dog's spine begins to compress.
Frame 3: The dog's body is fully compressed with all four paws gathered under its belly.
Frame 4: The rear legs extend explosively and launch the dog off the ground.
Frame 5: The dog is airborne in mid-bound with its legs tucked and ears streaming backward.
Frame 6: The dog reaches the peak of the bound with its back arched and tail streaming straight behind.
Frame 7: The dog begins to descend with its front legs reaching out to catch the ground.
Frame 8: The front paws are about to touch down, flowing straight back into frame one.
```

## 4. `dog_jump.png` — 점프 (도약 → 정점 → 낙하 → 착지)
비루프 · 12 fps · 128×128

```
Frame 1: The dog crouches low with deeply bent legs, gathering power to jump.
Frame 2: The dog's rear legs extend explosively and the front paws leave the ground.
Frame 3: The dog rises steeply with its body stretched upward and its ears blown backward.
Frame 4: The dog reaches the peak of the jump with its body level and its legs slightly tucked.
Frame 5: The dog starts to fall with its front paws reaching downward and its tail lifting.
Frame 6: The dog descends faster with all four legs extended toward the ground.
Frame 7: The paws hit the ground and the legs absorb the impact in a deep bend.
Frame 8: The dog springs back up from the landing into a normal standing posture.
```

## 5. `dog_sniff.png` — 냄새 맡기
루프 · 8 fps · 128×128

```
Frame 1: The dog lowers its head toward the ground with its nose almost touching the dirt.
Frame 2: The dog's nose twitches and tiny scent motes drift up in front of its muzzle.
Frame 3: The dog shuffles its front paws one step forward while keeping the nose down.
Frame 4: The dog inhales deeply and its ribcage expands while the ears perk slightly.
Frame 5: The dog's tail begins to wag as it catches the familiar scent.
Frame 6: The dog swings its muzzle a little to the right, still tracking along the ground.
Frame 7: The dog lifts its head halfway with its eyes half-closed in concentration.
Frame 8: The dog lowers its nose back to the ground so the sniffing motion can loop.
```

## 6. `dog_dispel.png` — 사망 · 빛으로 흩어짐
비루프 · 10 fps · 128×128 · 잔혹한 묘사 없음

```
Frame 1: The dog stands intact while a soft warm light begins to glow along its outline.
Frame 2: The dog's silhouette turns translucent as pale golden motes lift away from its fur.
Frame 3: The tail and hind legs dissolve into drifting particles of light.
Frame 4: Half of the dog's body has scattered into floating warm sparks.
Frame 5: Only the head and chest remain, loosely held together out of glowing dust.
Frame 6: The last shape of the dog breaks apart into a swirling cloud of gentle light.
Frame 7: The particles spread outward and start to fade against the empty background.
Frame 8: Only a few faint golden motes are left, almost fully transparent.
```

> **부활 연출은 이 시트를 역재생**해서 쓴다. 별도 에셋 불필요.

## 7. `dog_dig.png` — 땅파기 · 스테이지 1 세이브 모션
루프 · 12 fps · 128×128

```
Frame 1: The dog plants its rear legs and lowers its chest toward the sand with front paws poised.
Frame 2: The front-right paw rakes backward through the sand and kicks up a small spray.
Frame 3: The front-left paw follows through and a puff of sand bursts under the dog's belly.
Frame 4: Both front paws scrabble rapidly and sand arcs backward past the hind legs.
Frame 5: The dog pauses with its nose buried in the shallow hole it has dug.
Frame 6: The dog lifts its head with a few grains of sand stuck to its muzzle.
Frame 7: The dog shakes its head once and scatters sand from its ears.
Frame 8: The dog drops back into the digging stance so the motion can loop.
```

## 8. `dog_sleep.png` — 그늘 낮잠 · 스테이지 2 세이브 모션
루프 · 6 fps · 128×128

```
Frame 1: The dog turns once in place and begins folding its legs underneath itself.
Frame 2: The dog settles onto its belly with its chin hovering just above its front paws.
Frame 3: The dog rests its chin fully on its paws and closes both eyes.
Frame 4: The ribcage expands slowly in a deep sleeping breath.
Frame 5: The ribcage settles and the tail curls closer around the body.
Frame 6: One ear twitches slightly while the dog dreams.
Frame 7: A hind leg kicks once, very small, as if running inside the dream.
Frame 8: The dog goes still again in its curled sleeping pose, ready to loop.
```

## 9. `dog_splash.png` — 물장구 · 스테이지 3 세이브 모션
루프 · 12 fps · 128×128

```
Frame 1: The dog stands ankle-deep in a shallow pond with one front paw raised above the water.
Frame 2: The dog slaps that paw down and a ring of water bursts outward around it.
Frame 3: Droplets fly up around the dog's chest as the other front paw lifts.
Frame 4: The dog stomps both front paws into the water and a wide sheet of spray rises.
Frame 5: The dog bites playfully at the flying droplets with its head lowered.
Frame 6: The dog hops a little off the surface with all four paws clear of the water.
Frame 7: The dog lands and a tall crown-shaped splash erupts around its legs.
Frame 8: The water settles into ripples while the dog raises a paw again to loop the motion.
```

## 10. `dog_ball_nudge.png` — 공을 코로 툭툭 · 스테이지 4 세이브 모션
루프 · 10 fps · 128×128

```
Frame 1: The dog stands over a small red rubber ball with its nose lowered toward it.
Frame 2: The dog touches the ball with its nose and the ball tips slightly forward.
Frame 3: The dog pushes harder and the ball rolls a short distance to the right.
Frame 4: The dog trots one step to follow the rolling ball with its tail wagging.
Frame 5: The dog stops the ball with a soft tap of its front paw.
Frame 6: The dog drops into a play bow with its chest low and its hindquarters raised.
Frame 7: The dog flicks the ball back to the left with the side of its muzzle.
Frame 8: The dog stands over the ball again, ready to loop the play motion.
```

---

# P1 — 연출 · 장애물

## 11. `dog_puppy_run.png` — 어린 강아지 달리기 (프롤로그)
루프 · 14 fps · 128×128 · 주인공보다 머리가 크고 다리가 짧은 비율

```
Frame 1: A round-bodied puppy version of the same cream-and-white dog stretches into a clumsy gallop with front paws reaching forward.
Frame 2: The puppy's front paws land and its oversized head dips toward the grass.
Frame 3: The puppy's short legs gather under its plump belly.
Frame 4: The puppy pushes off with both hind legs and lifts off the ground.
Frame 5: The puppy floats in mid-bound with its floppy ears flying upward.
Frame 6: The puppy reaches the top of the bound with its tail wagging in a blur.
Frame 7: The puppy tips forward and reaches for the ground with its front paws.
Frame 8: The puppy is about to touch down, ready to loop the joyful run.
```

## 12. `owner_child_run.png` — 어린 주인 달리기 (프롤로그)
루프 · 12 fps · 128×128 · 얼굴 이목구비는 흐리게, 실루엣 위주

```
Frame 1: A young child in a yellow raincoat runs to the right with the left leg swung forward and arms open.
Frame 2: The child's left foot lands and the body leans into the stride.
Frame 3: The child's weight passes over the planted foot and the arms swing across the chest.
Frame 4: The right leg drives forward and the child's hair lifts in the wind.
Frame 5: The right foot lands and the child's shoulders rise at the top of the stride.
Frame 6: Both feet leave the ground for a single airborne frame with the coat flaring out.
Frame 7: The child descends with the left leg reaching forward again.
Frame 8: The child completes the stride and returns to the pose of frame one.
```

## 13. `owner_walk_silhouette.png` — 밤에 걸어오는 주인 (프롤로그 4컷)
비루프 · 8 fps · 128×128 · 완전한 검은 실루엣, 뒤에서 빛이 비침

```
Frame 1: A backlit adult silhouette stands in a doorway with warm light spilling around the body.
Frame 2: The silhouette takes its first slow step forward and the doorway light narrows.
Frame 3: The figure walks closer and its shadow stretches long across the floor.
Frame 4: The figure takes another quiet step, one arm hanging loose at its side.
Frame 5: The silhouette stops beside the sleeping dog and begins to lean down.
Frame 6: The figure crouches with one hand reaching toward the dog's head.
Frame 7: The hand rests gently on the dog and the silhouette holds still.
Frame 8: The whole frame fades toward black with only a rim of warm light remaining.
```

## 14. `owner_adult_wake.png` — 어른 주인, 잠에서 깨어 일어남 (엔딩)
비루프 · 8 fps · 256×192

```
Frame 1: An adult lies asleep under a blanket in a small bed, seen from the side.
Frame 2: The adult's eyes open and the head turns slightly toward the door.
Frame 3: The adult props up on one elbow and the blanket slides off the shoulder.
Frame 4: The adult sits upright on the edge of the bed with both feet on the floor.
Frame 5: The adult stands up and takes the first step away from the bed.
Frame 6: The adult walks toward the door with one hand rising toward the handle.
Frame 7: The hand grips the door handle and the body leans in.
Frame 8: The door swings open and bright warm light floods across the adult's face.
```

## 15. `owner_dog_hug.png` — 재회의 포옹 (엔딩 클라이맥스)
비루프 · 8 fps · 256×192

```
Frame 1: The adult stands in the open doorway and the small dog sits on the threshold looking up.
Frame 2: The dog's tail begins to wag hard and the adult's knees start to bend.
Frame 3: The adult kneels down and opens both arms wide toward the dog.
Frame 4: The dog springs off its hind legs toward the adult's chest.
Frame 5: The dog collides softly into the adult's arms and the arms begin to close.
Frame 6: The adult wraps both arms fully around the dog and buries their face in its fur.
Frame 7: The two hold still together while a warm glow spreads outward around them.
Frame 8: The glow overtakes the frame and both figures fade into soft white light.
```

## 16. `car_pass.png` — 지나가는 자동차 (스테이지 1·2)
루프 · 10 fps · 256×192 · 측면, 오른쪽을 향함

```
Frame 1: A small boxy compact car sits level in side view with its wheels straight.
Frame 2: The car body bobs slightly upward as the wheels rotate a quarter turn.
Frame 3: The wheels rotate further and the suspension compresses on the front axle.
Frame 4: The car body dips forward and faint exhaust puffs from the rear.
Frame 5: The wheels have made a half rotation and the car body rises again.
Frame 6: The car bounces over a small bump with both wheels blurred in motion.
Frame 7: The suspension settles and a light glints across the windshield.
Frame 8: The car returns to a level pose so the driving loop repeats seamlessly.
```

## 17. `wave_loop.png` — 밀려왔다 빠지는 파도 (스테이지 2)
루프 · 8 fps · 256×192 · 반투명 물결

```
Frame 1: A thin sheet of seawater lies flat at the far edge of the sand.
Frame 2: The water gathers into a low swelling ridge moving toward the shore.
Frame 3: The wave rises into a small curling crest with white foam on its lip.
Frame 4: The wave breaks and spreads a wide sheet of foam across the sand.
Frame 5: The foam reaches its farthest point up the beach and thins out.
Frame 6: The water begins to slide back and leaves a lace of bubbles behind.
Frame 7: The retreating water drags sand grains and darkens the beach surface.
Frame 8: The water returns to the flat resting sheet of frame one.
```

## 18. `boar_charge.png` — 멧돼지 돌진 (스테이지 3)
비루프 · 12 fps · 256×192 · 텔레그래프 0.7초 포함

```
Frame 1: A bristly brown wild boar stands still in side view with its head lowered.
Frame 2: The boar scrapes the ground with a front hoof and dust curls up.
Frame 3: The boar scrapes again and its shoulders tense with the head dropping lower.
Frame 4: The boar launches forward and its front hooves leave the ground.
Frame 5: The boar charges at full speed with its body stretched and dust trailing behind.
Frame 6: The boar keeps charging with all four legs blurred in motion.
Frame 7: The boar plants its hooves hard and skids to a stop with a spray of dirt.
Frame 8: The boar stands panting with its head hanging low, exhausted and vulnerable.
```

## 19. `rock_fall.png` — 낙석 (스테이지 3)
비루프 · 12 fps · 64×64

```
Frame 1: A jagged gray rock rests wedged in place with a thin crack running across it.
Frame 2: The rock trembles and small pebbles break loose from its underside.
Frame 3: The rock tips free of its ledge and begins to tilt downward.
Frame 4: The rock falls while slowly rotating clockwise with dust trailing above it.
Frame 5: The rock falls faster and stretches slightly with motion blur.
Frame 6: The rock strikes the ground and flattens for a single impact frame.
Frame 7: The rock shatters into three chunks with a burst of dust.
Frame 8: Only a low cloud of settling dust and a few small fragments remain.
```

## 20. `platform_crumble.png` — 무너지는 흙 발판 (스테이지 3)
비루프 · 10 fps · 256×192

```
Frame 1: A narrow ledge of packed earth with grass on top sits solid and intact.
Frame 2: A hairline crack appears across the middle of the earth ledge.
Frame 3: The ledge shakes and loose soil trickles from its underside.
Frame 4: The crack widens and the right half of the ledge sags downward.
Frame 5: The ledge splits into two pieces that begin to separate.
Frame 6: Both halves tilt and fall away with clumps of soil scattering.
Frame 7: The falling chunks break apart into smaller clods and dust.
Frame 8: Only an empty gap and a fading cloud of dust remain where the ledge was.
```

## 21. `steam_vent.png` — 하수구 증기 (스테이지 1)
루프 · 10 fps · 128×128 · 반투명 흰 김

```
Frame 1: A round metal drain grate sits quiet with only a faint wisp above it.
Frame 2: A thin jet of white steam begins to rise through the grate slots.
Frame 3: The steam column grows taller and starts to widen at the top.
Frame 4: The steam reaches its full height in a billowing white plume.
Frame 5: The plume spreads sideways and thins into soft curling tendrils.
Frame 6: The steam loses pressure and the column begins to break apart.
Frame 7: Only scattered patches of vapor drift upward and fade.
Frame 8: The grate is quiet again with a faint wisp, ready to loop.
```

## 22. `seagull_fly.png` — 갈매기 (스테이지 2)
루프 · 12 fps · 128×128

```
Frame 1: A white seagull glides to the right with both wings held level and straight.
Frame 2: The gull raises its wings halfway up in the start of an upstroke.
Frame 3: The wings reach their highest point above the body with the tips nearly touching.
Frame 4: The gull sweeps its wings downward and its body rises slightly.
Frame 5: The wings pass level with the body at full extension.
Frame 6: The wings reach the bottom of the downstroke curved beneath the body.
Frame 7: The gull's body dips a little as the wings begin to lift again.
Frame 8: The wings return to the level gliding pose of frame one.
```

---

# P2 — 분위기

## 23. `butterfly.png` — 나비 (스테이지 4)
루프 · 10 fps · 64×64

```
Frame 1: A pale yellow butterfly holds its wings fully open and flat.
Frame 2: The butterfly's wings tilt slightly closed and its body drifts upward.
Frame 3: The wings close nearly all the way into a thin vertical shape.
Frame 4: The wings snap open again and the butterfly rises a little higher.
Frame 5: The butterfly drifts to the right with its wings fully spread.
Frame 6: The wings tilt and the butterfly dips slightly downward.
Frame 7: The wings close halfway as the butterfly turns back to the left.
Frame 8: The butterfly opens its wings flat again to loop the fluttering path.
```

## 24. `scent_wisp.png` — 냄새 입자 (길 안내 핵심)
루프 · 10 fps · 64×64 · 발광, 가산 합성용

```
Frame 1: A single tiny mote of warm golden light glows faintly against transparency.
Frame 2: The mote brightens and a soft halo spreads around it.
Frame 3: The mote splits into two smaller motes that drift slowly apart.
Frame 4: Both motes rise and a faint curling thread of light connects them.
Frame 5: The thread of light spirals gently upward like a curl of scent.
Frame 6: The motes reach their highest point and reach peak brightness.
Frame 7: The light begins to dim and the spiral thread thins out.
Frame 8: Only a faint glow remains near the bottom, ready to loop the rise.
```

## 25. `savepoint_glow.png` — 세이브 포인트 오라
루프 · 8 fps · 128×128 · 발광, 가산 합성용

```
Frame 1: A soft ring of warm light rests on the ground with a faint upward shimmer.
Frame 2: The ring brightens and a few motes lift from its edge.
Frame 3: The motes rise higher and the ring pulses outward slightly.
Frame 4: The ring reaches its widest and brightest pulse.
Frame 5: The ring contracts while the risen motes keep floating upward.
Frame 6: The motes fade near the top and the ring dims.
Frame 7: The ring settles into a low steady glow with a slow shimmer.
Frame 8: The glow returns to the resting state of frame one to loop.
```

## 26. `stream_water.png` — 흐르는 냇물 타일 (스테이지 3)
루프 · 10 fps · 128×128 · **좌우 이음매가 맞아야 함(seamless tile)**

```
Frame 1: A seamless tile of shallow clear stream water shows gentle ripples flowing to the right.
Frame 2: The ripple crests shift slightly to the right and a few highlights brighten.
Frame 3: Small white foam lines appear where the water passes over hidden stones.
Frame 4: The ripples stretch and the foam lines drift further right.
Frame 5: The surface highlights scatter into fine sparkles across the tile.
Frame 6: The ripples merge into longer smooth streaks moving right.
Frame 7: New ripple crests form at the left edge of the tile.
Frame 8: The pattern aligns back to frame one so the flow loops seamlessly.
```

## 27. `owl_watch.png` — 지켜보는 부엉이 (스테이지 3)
루프 · 6 fps · 128×128

```
Frame 1: A round gray owl perches on a branch facing the viewer with both eyes wide open.
Frame 2: The owl's feathers puff slightly and its head tilts a few degrees to the left.
Frame 3: The owl closes both eyes in a slow blink.
Frame 4: The owl opens its eyes again, now with the pupils narrowed.
Frame 5: The owl rotates its head to the right in a smooth turn.
Frame 6: The owl's head reaches the far right and the body stays perfectly still.
Frame 7: The owl rotates its head back toward the center.
Frame 8: The owl faces forward again with wide eyes, ready to loop the watching cycle.
```

## 28. `grass_sway.png` — 흔들리는 풀 (스테이지 4 / 프롤로그)
루프 · 8 fps · 128×128 · 좌우 이음매 맞출 것

```
Frame 1: A cluster of tall green grass blades stands straight up at rest.
Frame 2: A breeze bends every blade slightly to the right.
Frame 3: The blades bend further right and their tips curve over.
Frame 4: The grass reaches its maximum rightward bend and a few seed heads scatter.
Frame 5: The blades spring back toward upright and overshoot a little to the left.
Frame 6: The grass leans gently left at its farthest point.
Frame 7: The blades swing back toward the center with the tips still wavering.
Frame 8: The grass returns to the upright resting pose to loop the sway.
```

---

## 부록 A. 생성 후 체크리스트

1. 배경이 정말 투명한가 (흰색 배경이 아닌지)
2. 8프레임이 **정확히 균등한 폭**으로 잘리는가 (1024 / 8 = 128)
3. 루프 에셋의 1번과 8번 프레임이 자연스럽게 이어지는가
4. 프레임 사이에 캐릭터 크기·색·귀 모양이 변하지 않는가
5. 캐릭터의 발바닥 y좌표가 프레임마다 흔들리지 않는가 (점프/달리기 제외)
6. 파일명이 위 표와 정확히 일치하는가 → 일치하면 코드 수정 없이 자동 적용됨
