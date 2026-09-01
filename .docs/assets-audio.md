# 오디오 에셋 — BGM · 앰비언스 · SFX

각 코드블록은 **그대로 복사해 붙여넣는 1000자 이내 프롬프트**다.
(Suno / Udio / MusicGen / ElevenLabs SFX 등 어디에 넣어도 되도록 서술형으로 작성)

---

## 0. 공통 규격

| 항목 | 값 |
|---|---|
| 포맷 | `.ogg` 우선, `.mp3` 병행 (브라우저 호환) |
| BGM 길이 | 90 ~ 150초, **루프 가능하게** |
| 앰비언스 길이 | 30 ~ 60초, 심리스 루프 |
| SFX 길이 | 0.2 ~ 2초 |
| 샘플레이트 | 44.1 kHz |
| 라우드니스 | BGM −18 LUFS / SFX −12 LUFS 목표 |
| 저장 경로 | `public/assets/audio/` |

### 사운드 디렉션

가사·나레이션 **없음**. 사람 목소리는 무의미한 허밍만 허용한다.
악기는 피아노, 어쿠스틱 기타, 첼로, 하프, 글로켄슈필, 그리고 옅은 패드를 기본으로 삼는다.

### "집으로" 메인 모티프

> **4음 모티프: 도 – 라 – 파 – 솔 (C – A – F – G)**
> 상행 후 살짝 내려앉는, 부르는 듯한 형태.

모든 곡은 이 모티프의 변주다. 프롬프트에 아래 문장을 그대로 붙여 쓰면 통일감이 생긴다.

```
The melody is built on a simple four-note calling motif that rises and then gently falls back, repeated in variations throughout.
```

---

# 1. BGM

## 1.1 `bgm_title.ogg` — 타이틀 (90초, 루프)

```
A quiet instrumental main theme for a gentle storybook video game about a dog finding its way home. Solo felt piano playing a slow, simple melody with generous space between phrases, joined after thirty seconds by a soft warm string pad and a distant glockenspiel. The melody is built on a simple four-note calling motif that rises and then gently falls back, repeated in variations throughout. Tempo around 68 BPM in C major with an unresolved suspended chord at the end of each phrase so it feels like waiting for someone. Intimate close-mic recording with audible felt hammers and room tone, wide gentle reverb, warm analog tape character, no drums, no percussion, no bass guitar, no vocals, no lyrics. Tender, nostalgic, calm, patient. Must loop seamlessly with no fade in or fade out.
```

## 1.2 `bgm_prologue.ogg` — 프롤로그 (120초, 비루프 · 4컷 진행에 맞춰 변화)

```
An instrumental cue for a wordless game prologue that moves from joy to quiet sorrow across four scenes. It opens bright and playful with a lilting acoustic guitar and light glockenspiel at a skipping tempo around 92 BPM in C major, like a child and a dog running through a summer field. Around forty seconds a warm cello enters and the tempo eases. Around eighty seconds the harmony shifts to the relative minor, the guitar drops away, and a lone felt piano carries the melody more slowly and heavily. The final thirty seconds thin out to a single sustained cello note and a faint music box, ending in near silence. The melody is built on a simple four-note calling motif that rises and then gently falls back, repeated in variations throughout. Warm analog tape character, wide soft reverb, no drums, no vocals, no lyrics. Nostalgic, tender, and finally heartbreaking without ever becoming dramatic.
```

## 1.3 `bgm_stage1_city.ogg` — 스테이지 1 도시 (120초, 루프)

```
A quiet instrumental loop for a foggy early morning city level in a gentle platformer game. Sparse muted electric piano playing hesitant repeating figures over a soft low synthesizer drone, with a very light brushed rim tap keeping loose time around 84 BPM. Cool and slightly lonely in A minor, but never threatening, with occasional warm major chords appearing like a remembered smell. A distant reversed pad swells softly every eight bars. The melody is built on a simple four-note calling motif that rises and then gently falls back, played tentatively as if searching. Lo-fi tape saturation, gentle vinyl crackle, wide reverb, restrained dynamics, no big drums, no bass drops, no vocals, no lyrics. Curious, cautious, quietly hopeful. Must loop seamlessly with no fade in or fade out.
```

## 1.4 `bgm_stage2_coast.ogg` — 스테이지 2 해안가 (130초, 루프)

```
A spacious instrumental loop for a sunlit coastal road level in a gentle platformer game. Clean fingerpicked acoustic guitar with a steady open pattern, a warm upright bass moving slowly beneath it, soft brushed drums with a light shuffle around 96 BPM, and a distant slide guitar answering the melody. Bright and airy in D major with an undertow of melancholy in the minor fourth chord. The melody is built on a simple four-note calling motif that rises and then gently falls back, here carried by the slide guitar like something remembered from a car window. Long plate reverb, warm analog tape character, salt-air openness, no vocals, no lyrics, no heavy percussion. Wistful, wide, travelling, bittersweet. Must loop seamlessly with no fade in or fade out.
```

## 1.5 `bgm_stage3_mountain.ogg` — 스테이지 3 산 (140초, 루프)

```
A tense but beautiful instrumental loop for a dark mountain forest level in a gentle platformer game. Low sustained cello drone, sparse detuned prepared piano notes, a lone wooden flute phrase appearing and disappearing, and a soft irregular heartbeat pulse of muted low tom around 72 BPM. Cold and vast in E minor with unresolved intervals that keep quiet tension without ever becoming a horror score. Occasional high harmonic string shimmer suggests moonlight through branches. The melody is built on a simple four-note calling motif that rises and then gently falls back, appearing only rarely and fragmented, as if the way home is hard to remember here. Deep hall reverb, subtle wind texture in the background, no vocals, no lyrics, no aggressive drums, no distorted guitars. Lonely, watchful, determined. Must loop seamlessly with no fade in or fade out.
```

## 1.6 `bgm_stage4_field.ogg` — 스테이지 4 들판 (120초, 루프)

```
A warm resolving instrumental loop for a peaceful sunlit meadow level in a gentle platformer game, and the full realization of the theme first heard in the prologue. Felt piano and layered warm strings play the melody openly and completely for the first time, joined by soft acoustic guitar, glockenspiel and a wordless distant humming choir with no words or lyrics at all. Tempo around 76 BPM in C major, harmony fully resolved, phrases finally landing on the tonic instead of hanging unfinished. The melody is built on a simple four-note calling motif that rises and then gently falls back, now stated confidently and repeated with growing warmth. Golden analog tape character, wide lush reverb, no drums, no percussion hits, no sung words. Peaceful, released, tearful in a good way, coming home. Must loop seamlessly with no fade in or fade out.
```

## 1.7 `bgm_ending.ogg` — 엔딩 (150초, 비루프)

```
An instrumental ending cue for a wordless game about a dog reunited with its owner in a dream. It begins almost silent with a single felt piano note and a faint room tone, builds slowly over ninety seconds as warm strings, cello, harp and a wordless humming choir with no words or lyrics gather beneath the melody, and reaches one full open climax at around the two minute mark before dissolving. The final thirty seconds strip back to solo piano playing the theme very slowly, then a single held string note, then silence. Tempo around 66 BPM in C major, deeply resolved. The melody is built on a simple four-note calling motif that rises and then gently falls back, stated one last time complete and unhurried. Warm analog tape, wide cinematic reverb, no drums, no percussion, no sung words. Overwhelming tenderness, release, and quiet grief. Ends fully, no loop.
```

## 1.8 `jingle_save.ogg` — 세이브 완료 징글 (2.5초)

```
A very short warm musical confirmation sting for a gentle storybook game, about two and a half seconds long. A rising three-note glockenspiel figure with a soft harp gliss underneath, resolving on a bright open major chord with a gentle bloom of reverb that fades naturally. Warm, soft-edged, cozy, no harsh transient, no drums, no vocals, no lyrics. Feels like a small safe breath rather than a fanfare. Ends cleanly in silence.
```

## 1.9 `jingle_stage_clear.ogg` — 스테이지 클리어 (5초)

```
A short instrumental stage completion cue for a gentle storybook game, about five seconds long. Warm strings and felt piano state the four-note calling motif once, rising and gently falling back, answered by a soft glockenspiel and a single low cello note that resolves to a warm major chord with a long natural reverb tail. Tempo around 72 BPM, unhurried and tender rather than triumphant. No drums, no cymbal crash, no brass fanfare, no vocals, no lyrics. Feels like one more step closer to home. Ends cleanly in silence.
```

---

# 2. 앰비언스 (BGM과 함께 재생, 볼륨 20~35%)

## 2.1 `amb_city_morning.ogg` (60초, 심리스 루프)

```
A calm early morning city ambience field recording loop for a game, sixty seconds, seamless. Distant muffled traffic hum with no individual engines close by, a far away crow call, faint wind moving through a narrow alley, the low hum of a ventilation unit, occasional distant footsteps on wet pavement, and a single far-off crossing signal beep every twenty seconds. Everything heavily distance-filtered and soft as if heard through morning fog. No voices, no speech, no music, no sirens, no sudden loud events. Quiet, cool, slightly lonely. Must loop seamlessly with no fade in or fade out.
```

## 2.2 `amb_coast_waves.ogg` (60초, 심리스 루프)

```
A calm coastal ambience field recording loop for a game, sixty seconds, seamless. Gentle waves rolling in and drawing back over sand in an irregular natural rhythm, soft sea breeze, occasional distant seagull calls, faint rigging or metal clinking far away, and a very distant car passing once. Open, wide and airy with plenty of high frequency air. No voices, no speech, no music, no storm, no crashing surf. Peaceful, bright, spacious. Must loop seamlessly with no fade in or fade out.
```

## 2.3 `amb_mountain_night.ogg` (60초, 심리스 루프)

```
A quiet mountain forest night ambience field recording loop for a game, sixty seconds, seamless. Steady soft wind through pine branches, a small stream trickling in the middle distance, sparse crickets, a single distant owl call every twenty seconds, occasional creaking of trees, and a very faint rustle of undergrowth. Deep and open with a sense of great empty space. No voices, no speech, no music, no animal screams, no jump scares. Cool, vast, watchful but not frightening. Must loop seamlessly with no fade in or fade out.
```

## 2.4 `amb_field_wind.ogg` (60초, 심리스 루프)

```
A warm sunny meadow ambience field recording loop for a game, sixty seconds, seamless. Soft continuous breeze moving through tall grass, gentle rustling of leaves, scattered songbirds in the middle distance, a few lazy insects, and a very distant windchime once or twice. Bright, warm and open with a slight midday shimmer. No voices, no speech, no music, no vehicles. Peaceful, safe, nostalgic. Must loop seamlessly with no fade in or fade out.
```

## 2.5 `amb_room_night.ogg` (40초, 심리스 루프)

```
A quiet indoor bedroom night ambience loop for a game, forty seconds, seamless. Very soft room tone, a slow ticking wall clock, faint wind against a window pane, the distant hum of a refrigerator in another room, and occasional gentle house settling creaks. Extremely quiet and intimate with a warm low end. No voices, no speech, no music, no sudden noises. Safe, still, tender. Must loop seamlessly with no fade in or fade out.
```

---

# 3. SFX

짧은 효과음. 각 프롬프트는 그대로 복사해 쓰면 된다.

| 파일 | 용도 | 길이 |
|---|---|---|
| `sfx_step_soft.ogg` | 흙·풀 위 발소리 | 0.2s |
| `sfx_step_hard.ogg` | 콘크리트 위 발소리 | 0.2s |
| `sfx_step_water.ogg` | 얕은 물 발소리 | 0.3s |
| `sfx_jump.ogg` | 점프 | 0.3s |
| `sfx_land.ogg` | 착지 | 0.3s |
| `sfx_dispel.ogg` | 사망(빛으로 흩어짐) | 1.5s |
| `sfx_respawn.ogg` | 부활(빛이 모임) | 1.5s |
| `sfx_dig.ogg` | 땅파기 | 1.0s |
| `sfx_splash.ogg` | 물장구 | 0.8s |
| `sfx_ball.ogg` | 공 튕김 | 0.4s |
| `sfx_sniff.ogg` | 킁킁 | 0.6s |
| `sfx_bark_soft.ogg` | 짧고 여린 짖음 (엔딩 문 앞) | 0.6s |
| `sfx_whine.ogg` | 낑낑 (엔딩 문 앞) | 1.2s |
| `sfx_scratch_door.ogg` | 문 긁기 (엔딩) | 1.0s |
| `sfx_car_pass.ogg` | 자동차 통과 | 2.0s |
| `sfx_rock_fall.ogg` | 낙석 | 1.2s |
| `sfx_crumble.ogg` | 발판 붕괴 | 1.0s |
| `sfx_boar_snort.ogg` | 멧돼지 예고 | 0.8s |
| `sfx_wave_rush.ogg` | 파도 밀려옴 | 2.0s |
| `sfx_steam.ogg` | 증기 분출 | 1.0s |
| `sfx_ui_select.ogg` | UI 선택 | 0.2s |
| `sfx_page_turn.ogg` | 씬 전환 | 0.5s |

## 3.1 발소리 3종

```
Three separate very short dog footstep sound effects for a game, each about 0.2 seconds, dry and close-mic recorded with minimal reverb. The first is a small soft paw landing on dirt and grass, muffled with a faint grass rustle. The second is the same small paw on hard concrete, slightly brighter with a soft claw tick. The third is the same paw in shallow water, a light wet slap with fine droplets. Light weight, small animal, gentle and never harsh. No music, no voices, no reverb tail.
```

## 3.2 `sfx_jump.ogg` / `sfx_land.ogg`

```
Two short game sound effects for a small light dog, dry and close-mic recorded. The first is a jump, a soft quick fabric-like whoosh with a faint paw push-off scuff, about 0.3 seconds, light and airy with a gentle upward pitch feel. The second is a landing, a soft paw impact on dirt with a small puff of dust and a faint claw scrabble, about 0.3 seconds, cushioned and low without any hard thud. Small, light, gentle. No music, no voices, no long reverb.
```

## 3.3 `sfx_dispel.ogg` / `sfx_respawn.ogg`

```
Two gentle magical game sound effects, each about 1.5 seconds, warm and soft with no aggression. The first is a dissolving sound, a soft airy shimmer of fine glassy particles scattering outward with a slow downward pitch drift and a warm bell-like tone fading into reverb. The second is exactly its reverse, particles gathering inward with a rising shimmer that settles into a single soft warm bell tone. Ethereal, comforting, dreamlike rather than sad or scary. No music, no voices, no impact, no distortion.
```

## 3.4 강아지 발성 3종 (엔딩용)

```
Three short recordings of a small gentle dog, dry and close-mic recorded with light room tone. The first is a single soft high bark, brief and hopeful rather than aggressive, about 0.6 seconds. The second is a quiet whine rising and falling, longing and tender, about 1.2 seconds. The third is claws scratching lightly on a wooden door in short repeated strokes, about one second. Small breed, gentle, emotionally warm. No growling, no aggression, no music, no human voices.
```

## 3.5 환경 SFX

```
A set of short environmental game sound effects, each dry with only light natural reverb. A compact car passing from left to right with a soft doppler sweep, about two seconds. A rock breaking loose and tumbling down a slope before a dull impact and scattering pebbles, about 1.2 seconds. A dirt ledge cracking and crumbling away with falling soil clods, about one second. A wild boar snorting and scraping a hoof on dry ground as a warning, about 0.8 seconds. A wave rushing up a sandy beach and hissing back out, about two seconds. A pressurized steam vent hissing up through a metal grate, about one second. No music, no voices, no screeching, no extreme loudness.
```

## 3.6 UI SFX

```
Two very short interface sound effects for a gentle storybook game. The first is a menu selection, a single soft wooden mallet tap on a small tuned block with a warm short bloom, about 0.2 seconds. The second is a scene transition, a soft paper page turning combined with a gentle airy whoosh and a faint harp gliss, about half a second. Warm, cozy, hand-made feeling, never electronic or sharp. No music, no voices, no beeps.
```

---

## 부록 A. 믹싱 가이드

| 레이어 | 볼륨 |
|---|---|
| BGM | 0.55 |
| 앰비언스 | 0.25 |
| SFX | 0.8 |
| 세이브/클리어 징글 | 0.9 (재생 중 BGM을 0.3으로 덕킹) |

- 씬 전환 시 BGM은 0.8초 크로스페이드
- 세이브 모션 중에는 앰비언스만 남기고 BGM을 0.35까지 낮췄다 복귀
- 모바일 브라우저는 첫 터치 이전에 오디오가 재생되지 않으므로, 타이틀 첫 입력 시 `AudioContext`를 resume 한다

## 부록 B. 체크리스트

1. 루프 지점에 클릭 노이즈나 무음 갭이 없는가
2. 가사·나레이션이 섞여 들어가지 않았는가 (**허밍만 허용**)
3. 모든 곡에서 4음 모티프가 들리는가
4. 스테이지 4와 엔딩이 프롤로그 테마의 해결처럼 들리는가
5. 파일명이 위 표와 정확히 일치하는가 → 일치하면 코드 수정 없이 자동 적용됨
