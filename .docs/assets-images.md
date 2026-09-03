# 이미지 에셋 — 배경 · 타일셋 · 소품 · GUI

각 항목의 코드블록은 **그대로 복사해서 붙여넣는 한 문단짜리 프롬프트**다.

---

## 0. 공통 규격

| 분류 | 크기 | 배경 | 저장 경로 |
|---|---|---|---|
| 하늘/원경 레이어 | 1920 × 540 | 불투명 | `public/assets/bg/` |
| 중경/근경 레이어 | 1920 × 540 | **투명** | `public/assets/bg/` |
| 타일셋 | 512 × 512 (32px 그리드) | 투명 | `public/assets/tiles/` |
| 소품 | 개별 사이즈 명시 | 투명 | `public/assets/props/` |
| GUI | 개별 사이즈 명시 | 투명 | `public/assets/ui/` |
| 컷 일러스트 | 960 × 540 | 불투명 | `public/assets/cutscene/` |

### 전 에셋 공통 아트 디렉션

```
Soft hand-painted pixel art, warm pastel palette with muted saturation, gentle rim light, slight film grain, dreamlike storybook atmosphere, side-scrolling platformer game asset, absolutely no text, no letters, no numbers, no watermark, no logo.
```

> **중요**: 게임 전체에 문자가 등장하지 않는다. 간판·표지판·상호까지 전부
> **글자 없는 픽토그램이나 추상 도형**으로 그려야 한다. 프롬프트마다 "no text"를 반드시 유지할 것.

### 패럴랙스 레이어 구성

| 레이어 | scrollFactor | 내용 |
|---|---|---|
| sky | 0.0 | 하늘 그라디언트, 해/달, 구름 |
| far | 0.2 | 산·건물 스카이라인 실루엣 |
| mid | 0.5 | 건물·나무 무리 |
| near | 0.8 | 앞쪽 수풀·전선·난간 (스테이지에서는 플레이어 뒤, 프롤로그 연출에서는 앞) |

---

# 1. 배경 — 프롤로그 & 스테이지 4 (들판)

프롤로그 컷 1~3과 스테이지 4는 **같은 들판**이다. 시간대만 바뀐다.

## 1.1 `bg_field_sky_morning.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of an early morning sky over open countryside, painted in soft hand-painted pixel art with a warm pastel palette. Pale peach and lavender gradient from the horizon upward, a low soft sun just above the horizon casting long golden light, thin streaks of cloud tinted rose, and a faint morning haze near the ground. The image must tile seamlessly left to right. Dreamlike storybook atmosphere, gentle film grain, no text, no letters, no watermark, no characters.
```

## 1.2 `bg_field_sky_noon.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of a bright midday sky over open countryside, painted in soft hand-painted pixel art with a warm pastel palette. Clear pale blue gradient, tall fluffy cumulus clouds with soft cream highlights, a high small sun, and crisp clean air with no haze. The image must tile seamlessly left to right. Dreamlike storybook atmosphere, gentle film grain, no text, no letters, no watermark, no characters.
```

## 1.3 `bg_field_sky_evening.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of a late evening sky over open countryside, painted in soft hand-painted pixel art with a warm pastel palette. Deep orange and magenta gradient near the horizon fading to dusty violet above, a large low sun half sunk below the skyline, long horizontal cloud bands lit from beneath, and the first faint stars at the top of the frame. The image must tile seamlessly left to right. Melancholy dreamlike storybook atmosphere, gentle film grain, no text, no letters, no watermark, no characters.
```

## 1.4 `bg_field_far.png` (1920×540, 투명)

```
A far parallax layer for a side-scrolling platformer showing distant rolling hills of tall grass, painted in soft hand-painted pixel art with muted pastel greens desaturated by atmospheric haze. Low gentle hill silhouettes with a single small bare tree on the furthest ridge, everything soft-edged and low contrast so it reads as far away. Fully transparent background above the hills, tiles seamlessly left to right. Dreamlike storybook atmosphere, no text, no letters, no watermark, no characters.
```

## 1.5 `bg_field_mid.png` (1920×540, 투명)

```
A mid parallax layer for a side-scrolling platformer showing a meadow of waist-high grass with scattered wildflowers, a leaning wooden fence with a few missing planks, and two round leafy trees, painted in soft hand-painted pixel art with warm pastel greens and small cream and pale yellow flower dots. Slightly more saturated and detailed than the far layer. Fully transparent background above the meadow line, tiles seamlessly left to right. Dreamlike storybook atmosphere, no text, no letters, no watermark, no characters.
```

## 1.6 `bg_field_near.png` (1920×540, 투명)

```
A foreground parallax layer for a side-scrolling platformer showing tall grass blades and a few slender wildflower stems reaching up from the bottom edge of the frame, painted in soft hand-painted pixel art in deeper shadowed green, slightly blurred as if very close to the camera. Only the bottom fifth of the image contains grass, everything else fully transparent, tiles seamlessly left to right. Dreamlike storybook atmosphere, no text, no letters, no watermark, no characters.
```

---

# 2. 배경 — 스테이지 1 (도시, 이른 아침 안개)

## 2.1 `bg_city_sky.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of a cold early morning city sky, painted in soft hand-painted pixel art with a muted desaturated palette of gray blue and pale ash. Heavy low fog blanketing the lower half, a weak white sun barely visible through the haze, and cool flat lighting with almost no shadows. Somber and quiet. The image must tile seamlessly left to right. Dreamlike storybook atmosphere, gentle film grain, no text, no letters, no signage, no watermark, no characters.
```

## 2.2 `bg_city_far.png` (1920×540, 투명)

```
A far parallax layer for a side-scrolling platformer showing a distant city skyline of blocky apartment towers and office buildings reduced to flat gray blue silhouettes softened by fog, painted in soft hand-painted pixel art. A few tiny warm window lights still on, a slim communication tower, and a water tank on one roof. Low contrast so it reads as distant, fully transparent above the skyline, tiles seamlessly left to right. Somber quiet mood, no text, no letters, no signage, no billboards, no watermark, no characters.
```

## 2.3 `bg_city_mid.png` (1920×540, 투명)

```
A mid parallax layer for a side-scrolling platformer showing a row of low four-story concrete residential buildings with rusted balcony railings, air conditioning units, tangled overhead power lines, and a narrow alley gap between two of them, painted in soft hand-painted pixel art with muted concrete gray, faded teal and dull brick tones. Shop fronts have blank shuttered doors and pictogram-free awnings. Fully transparent above the rooftops, tiles seamlessly left to right. Quiet foggy morning mood, no text, no letters, no shop signs, no watermark, no characters.
```

## 2.4 `bg_city_near.png` (1920×540, 투명)

```
A foreground parallax layer for a side-scrolling platformer showing the blurred edge of a chain link fence, a leaning street pole and a few weeds pushing through cracked pavement along the bottom of the frame, painted in soft hand-painted pixel art in dark cool gray, slightly out of focus as if very close to the camera. Only the bottom fifth contains detail, everything else fully transparent, tiles seamlessly left to right. No text, no letters, no signage, no watermark, no characters.
```

## 3.1 `bg_coast_sky_day.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of a bright coastal midday sky, painted in soft hand-painted pixel art with a clean pastel palette of cyan and pale turquoise. High thin clouds, strong clear light, and a distant flat sea horizon line with sun sparkle scattered across the water. The image must tile seamlessly left to right. Open airy dreamlike atmosphere, gentle film grain, no text, no letters, no watermark, no characters.
```

## 3.2 `bg_coast_sky_sunset.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of a coastal sky at sunset, painted in soft hand-painted pixel art with a warm palette of amber, coral and deep rose fading to dusty blue at the top. A wide sun low on the sea horizon laying a long shimmering gold path across the water, backlit clouds with bright rims, and a few distant birds as tiny dark marks. The image must tile seamlessly left to right. Bittersweet dreamlike atmosphere, gentle film grain, no text, no letters, no watermark, no characters.
```

## 3.3 `bg_coast_far.png` (1920×540, 투명)

```
A far parallax layer for a side-scrolling platformer showing a calm open sea with soft horizontal wave bands, a small white lighthouse on a distant rocky headland, and two tiny fishing boats near the horizon, painted in soft hand-painted pixel art with desaturated blue green tones and hazy edges. Fully transparent above the sea line, tiles seamlessly left to right. Peaceful dreamlike atmosphere, no text, no letters, no watermark, no characters.
```

## 3.4 `bg_coast_mid.png` (1920×540, 투명)

```
A mid parallax layer for a side-scrolling platformer showing a coastal roadside strip with a rusted guardrail, weathered concrete seawall, scattered tetrapod blocks, a leaning utility pole, and low salt-bleached scrub grass, painted in soft hand-painted pixel art with sun-faded concrete gray, rust orange and pale sea green. Fully transparent above the seawall line, tiles seamlessly left to right. No text, no letters, no road signs, no watermark, no characters.
```

---

# 4. 배경 — 스테이지 3 (산)

## 4.1 `bg_mountain_sky_night.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of a deep mountain night sky, painted in soft hand-painted pixel art with a palette of indigo, navy and cold violet. A dense field of small stars, a faint milky band across the upper sky, a pale crescent moon casting cool silver light, and thin mist pooling low near the horizon. Quiet, vast and slightly lonely but never frightening. The image must tile seamlessly left to right. Gentle film grain, no text, no letters, no watermark, no characters.
```

## 4.2 `bg_mountain_sky_dawn.png` (1920×540, 불투명)

```
A wide seamless side-scrolling background of a mountain sky at first light, painted in soft hand-painted pixel art with a gradient from deep blue at the top to pale gold and soft pink along the horizon. The last few stars fading at the top, thin layered clouds catching the earliest warm light, and low valley mist glowing faintly. Hopeful dreamlike atmosphere. The image must tile seamlessly left to right. Gentle film grain, no text, no letters, no watermark, no characters.
```

## 4.3 `bg_mountain_far.png` (1920×540, 투명)

```
A far parallax layer for a side-scrolling platformer showing overlapping mountain ridges receding into distance, painted in soft hand-painted pixel art with layered silhouettes in deep blue violet that grow paler with each ridge, and thin bands of mist caught between them. Fully transparent above the ridgeline, tiles seamlessly left to right. Vast quiet dreamlike atmosphere, no text, no letters, no watermark, no characters.
```

## 4.4 `bg_mountain_mid.png` (1920×540, 투명)

```
A mid parallax layer for a side-scrolling platformer showing a dense stand of tall pine and bare deciduous trees on a rocky slope, with exposed boulders, hanging moss and a few fallen trunks, painted in soft hand-painted pixel art in dark forest green and cool gray with faint moonlight rim lighting on the trunks. Fully transparent above the treeline, tiles seamlessly left to right. Quiet nocturnal woodland mood, no text, no letters, no watermark, no characters.
```

## 4.5 `bg_mountain_near.png` (1920×540, 투명)

```
A foreground parallax layer for a side-scrolling platformer showing dark blurred fern fronds, a mossy branch and tall reeds crossing the bottom and lower corners of the frame, painted in soft hand-painted pixel art in near-black forest green, softly out of focus as if very close to the camera. Only the outer edges contain detail, the center is fully transparent, tiles seamlessly left to right. No text, no letters, no watermark, no characters.
```

---

# 5. 배경 — 집 안 (프롤로그 4컷 & 엔딩, 동일 에셋 사용)

## 5.1 `bg_home_interior_night.png` (960×540, 불투명)

```
An interior background of a small warm bedroom at night for a side-scrolling game, painted in soft hand-painted pixel art with a cozy palette of amber lamplight, deep brown wood and dusty blue shadow. A low single bed with a rumpled quilt against the right wall, a round dog cushion on the floor beside it, a wooden door slightly ajar on the left spilling a narrow band of warm hallway light, a window with moonlight and a curtain, and a few small homey details like a folded blanket and a pair of slippers. Every picture frame on the wall is blank. Safe, tender and quiet. No text, no letters, no photographs of faces, no watermark, no characters.
```

## 5.2 `bg_home_exterior.png` (960×540, 불투명) — 스테이지 4 종착점 & 프롤로그

```
A background of a small country house standing alone at the far edge of a grassy meadow, painted in soft hand-painted pixel art with a warm pastel palette. A modest one-story house with a faded red tile roof, cream plaster walls, a wooden front door, two windows glowing softly warm from inside, a low stone garden wall, and a single tall tree beside it. Morning light, long soft shadows across the grass, a faint dirt path leading toward the door. Nostalgic and safe, the place the whole journey is heading toward. No text, no letters, no house numbers, no watermark, no characters.
```

---

# 6. 타일셋 (충돌용 지형)

모두 **32px 그리드**, 512×512 시트. 좌상단부터 지면/모서리/내부/경사/플랫폼 순으로 배치.

## 6.1 `tiles_city.png`

```
A 512x512 pixel art platformer tileset sheet on a fully transparent background, arranged on a strict 32 pixel grid, for a foggy morning city stage. Includes cracked concrete sidewalk top tiles with worn edges, solid concrete fill tiles, left and right corner tiles, brick wall tiles in dull faded red, gray curb and gutter pieces, thin metal grate platform tiles, a low painted-brick fence segment, and short one-way ledge platforms. Muted desaturated palette of concrete gray, dull brick and cold teal. Every tile must align exactly to the grid with clean edges. No text, no letters, no graffiti lettering, no watermark.
```

## 6.2 `tiles_coast.png`

```
A 512x512 pixel art platformer tileset sheet on a fully transparent background, arranged on a strict 32 pixel grid, for a sunny coastal stage. Includes damp packed sand top tiles, dry pale sand fill tiles, worn asphalt road tiles with a faded center line stripe, weathered gray concrete seawall blocks, wooden boardwalk plank platforms, barnacled rock tiles, and angular tetrapod block pieces. Sun-bleached palette of pale sand, sea green, rust and warm gray. Every tile must align exactly to the grid with clean edges. No text, no letters, no watermark.
```

## 6.3 `tiles_mountain.png`

```
A 512x512 pixel art platformer tileset sheet on a fully transparent background, arranged on a strict 32 pixel grid, for a night mountain stage. Includes mossy dirt top tiles with grass fringe, dark packed earth fill tiles, jagged gray rock tiles, mossy boulder pieces, fallen log platform segments, a rope-and-plank bridge section, angled slope tiles at 30 and 45 degrees, and flat stepping stone tiles for a stream. Deep forest palette of dark green, cool gray, damp brown and moonlit silver rim light. Every tile must align exactly to the grid with clean edges. No text, no letters, no watermark.
```

## 6.4 `tiles_field.png`

```
A 512x512 pixel art platformer tileset sheet on a fully transparent background, arranged on a strict 32 pixel grid, for a peaceful sunlit meadow stage. Includes lush grass top tiles with soft blade fringe, warm brown soil fill tiles, gentle slope tiles, a dirt footpath surface, low mossy stone steps, a weathered wooden fence rail platform, and small flower-dotted grass variants. Warm pastel palette of fresh green, honey brown and cream. Every tile must align exactly to the grid with clean edges. No text, no letters, no watermark.
```

---

# 7. 소품 · 인터랙션 요소

## 7.1 `prop_sign_move.png` (128×160, 투명) — 튜토리얼 안내판 ①

```
A small weathered wooden signboard on a single post, standing upright, painted in soft hand-painted pixel art on a fully transparent background. The board face shows only a wordless pictogram carved and painted onto the wood: a left arrow and a right arrow side by side, and beneath them two simple keyboard key caps drawn as rounded squares each containing a matching arrow shape. A tiny dog silhouette walking to the right sits at the bottom of the board. Absolutely no letters, no words, no numbers anywhere on the sign, purely symbolic. Warm faded wood tones, gentle storybook style, no watermark.
```

## 7.2 `prop_sign_jump.png` (128×160, 투명) — 튜토리얼 안내판 ②

```
A small weathered wooden signboard on a single post, standing upright, painted in soft hand-painted pixel art on a fully transparent background. The board face shows only a wordless pictogram: a dog silhouette leaping over a gap along a dotted arc trajectory, and below it one wide rounded key cap symbol with an upward arrow inside it. Absolutely no letters, no words, no numbers anywhere on the sign, purely symbolic. Warm faded wood tones, gentle storybook style, no watermark.
```

## 7.3 `prop_sign_run.png` (128×160, 투명) — 튜토리얼 안내판 ③

```
A small weathered wooden signboard on a single post, standing upright, painted in soft hand-painted pixel art on a fully transparent background. The board face shows only a wordless pictogram: a dog silhouette running to the right with three speed lines trailing behind it, then leaping across a wide gap, and below it a rounded key cap symbol with a thick upward-pointing chevron inside it next to a right arrow key cap. Absolutely no letters, no words, no numbers anywhere on the sign, purely symbolic. Warm faded wood tones, gentle storybook style, no watermark.
```

## 7.4 `prop_sandbox.png` (256×128, 투명) — 스테이지 1 세이브 포인트

```
A small neglected playground sandbox for a side-scrolling game, painted in soft hand-painted pixel art on a fully transparent background. A square wooden frame filled with pale sand, one small plastic shovel and a faded bucket half buried, a few paw-sized dents in the sand surface, and a single spring rider shaped like an abstract animal at the edge. Muted nostalgic palette with cool morning light and gentle fog tint. Quiet and slightly lonely. No text, no letters, no watermark, no characters.
```

## 7.5 `prop_food_stall.png` (320×256, 투명) — 스테이지 2 세이브 포인트

```
A small seaside street food cart with a large striped parasol planted beside it, painted in soft hand-painted pixel art on a fully transparent background. A weathered metal cart on bicycle wheels with a steaming pot, stacked plastic stools, a cooler box, and a wide red and white parasol casting a crisp round shadow. The cart banner and menu board are completely blank with no writing at all, only faded color panels. Sun-bleached warm palette, salty coastal wear and rust, cozy afternoon mood. No text, no letters, no numbers, no menu writing, no watermark, no characters.
```

## 7.6 `prop_valley_pond.png` (384×160, 투명) — 스테이지 3 세이브 포인트

```
A shallow clear rock pool in a mountain valley for a side-scrolling game, painted in soft hand-painted pixel art on a fully transparent background. Smooth rounded boulders framing a small pool of transparent water with visible pebbles on the bottom, a tiny waterfall trickling in from the left, ripple highlights on the surface, ferns and moss along the rim, and a few floating leaves. Cool dawn light with soft silver reflections. Inviting and playful. No text, no letters, no watermark, no characters.
```

## 7.7 `prop_ball.png` (64×64, 투명) — 스테이지 4 세이브 포인트

```
A small worn rubber play ball for a dog, painted in soft hand-painted pixel art on a fully transparent background. A red ball with a faded cream stripe around its middle, scuffed surface, a few small tooth marks, and a soft warm highlight on the upper left. Beloved and well used, sitting in short grass blades. Warm pastel palette, gentle storybook style. No text, no letters, no brand marks, no watermark.
```

## 7.8 `props_city_set.png` (512×512, 투명)

```
A sheet of separated city street props for a side-scrolling platformer, painted in soft hand-painted pixel art on a fully transparent background, each object clearly spaced apart. Includes a street lamp, a traffic light with blank unlit lenses, a round metal drain grate, a terracotta flower pot, a public bench, a dented trash bin, a stack of cardboard boxes, a fire hydrant, a bicycle leaning on a stand, and a rolled-down shop shutter with a blank face. Muted foggy morning palette of gray, rust and dull teal. No text, no letters, no signage, no watermark.
```

## 7.9 `props_coast_set.png` (512×512, 투명)

```
A sheet of separated coastal props for a side-scrolling platformer, painted in soft hand-painted pixel art on a fully transparent background, each object clearly spaced apart. Includes a rusted guardrail section, a striped mooring bollard, a red and white buoy, a coil of rope, a wooden crate, a stack of fishing nets, a beach parasol, a weathered vending machine with completely blank panels, a life ring on a post, and a small anchor. Sun-faded coastal palette with salt corrosion and rust. No text, no letters, no signage, no brand marks, no watermark.
```

## 7.10 `props_mountain_set.png` (512×512, 투명)

```
A sheet of separated mountain and forest props for a side-scrolling platformer, painted in soft hand-painted pixel art on a fully transparent background, each object clearly spaced apart. Includes a mossy fallen log, a cluster of ferns, a mushroom ring, a pile of river stepping stones, a rusted animal snare trap with visible jaws, a broken wooden trail post with a blank arrow board, a thorn bush, a hollow tree stump, a hanging vine, and a small pile of loose rocks. Dark forest palette of deep green, damp brown and cool gray with moonlit rim light. No text, no letters, no watermark.
```

## 7.11 `props_field_set.png` (512×512, 투명)

```
A sheet of separated meadow props for a side-scrolling platformer, painted in soft hand-painted pixel art on a fully transparent background, each object clearly spaced apart. Includes a leaning wooden fence segment, a hay bale, a clump of wildflowers, a butterfly-friendly flowering bush, a small windmill toy on a stick, a scattered handful of dandelion puffs, a wooden gate, a stone marker, a watering can, and a low garden hedge. Warm pastel palette of fresh green, honey and cream in soft morning light. No text, no letters, no watermark.
```

## 7.12 `prop_owner_car.png` (256×128, 투명) — 스테이지 2 연출용 차량

```
A small pale blue compact hatchback car seen from the side, painted in soft hand-painted pixel art on a fully transparent background. Slightly dusty and well used with a faint dent on the rear door, a soft toy hanging from the rear view mirror visible through the window, and warm reflections along the body. The license plate is completely blank with no characters at all. Nostalgic family car feeling, warm pastel palette. No text, no letters, no numbers, no brand logos, no watermark.
```

---

# 8. GUI

문자 없이 픽토그램만 사용한다.

## 8.1 `ui_title_logo.png` (512×256, 투명)

```
A wordless game title emblem for a gentle storybook platformer, painted in soft hand-painted pixel art on a fully transparent background. A small dog silhouette sitting and looking up at a simple house shape, connected by a curving trail of tiny glowing golden motes that arcs between them like a scent trail. Framed loosely by a soft circular glow. Warm pastel palette of cream, honey and dusk violet. Absolutely no text, no letters, no words, no title lettering of any kind, purely a symbolic emblem. No watermark.
```

## 8.2 `ui_icons_menu.png` (384×128, 투명) — 타이틀 메뉴 3종

```
A row of three separated circular game menu icons on a fully transparent background, painted in soft hand-painted pixel art with matching style and identical circle size. The first icon shows a single dog paw print. The second icon shows a simple bone. The third icon shows a small house with a warm glowing window. Each icon sits inside a soft cream circle with a thin warm outline and a gentle drop glow. Warm pastel palette. Absolutely no text, no letters, no numbers, no watermark.
```

## 8.3 `ui_touch_controls.png` (512×256, 투명) — 모바일 가상 패드

```
A set of separated semi-transparent mobile touch control elements for a game overlay, painted in soft hand-painted pixel art on a fully transparent background. Includes a round left-arrow button, a round right-arrow button, a round down-arrow button, a larger round jump button showing an upward arc arrow, and a round interact button showing a dog nose pictogram. Each button is a soft frosted white circle with a thin warm outline and a subtle inner glow, clearly readable over both bright and dark scenery. Absolutely no text, no letters, no numbers, no watermark.
```

## 8.4 `ui_prompt_interact.png` (96×96, 투명) — 상호작용 표시

```
A floating interaction prompt bubble for a game, painted in soft hand-painted pixel art on a fully transparent background. A small rounded speech-bubble shape in warm cream with a soft golden glow, containing only a simple dog nose pictogram with two tiny scent curls rising from it. Gentle drop shadow beneath. Absolutely no text, no letters, no numbers, no watermark.
```

## 8.5 `ui_save_burst.png` (256×256, 투명) — 세이브 완료 이펙트

```
A radial save confirmation effect for a game, painted in soft hand-painted pixel art on a fully transparent background. A soft expanding ring of warm golden light with scattered motes drifting outward and a gentle bloom in the center, fading toward the edges, no hard outlines. Additive-blend friendly with pure black excluded and a fully transparent surround. Warm honey and cream palette. Absolutely no text, no letters, no numbers, no watermark.
```

## 8.6 `ui_rotate_device.png` (256×256, 투명) — 세로 화면 회전 유도

```
A wordless landscape orientation prompt icon for a mobile game, painted in soft hand-painted pixel art on a fully transparent background. A simple rounded phone shape shown upright with a curved rotation arrow sweeping clockwise around it toward a faded horizontal phone outline beside it. Soft cream and warm gray palette with a gentle glow. Absolutely no text, no letters, no numbers, purely symbolic. No watermark.
```

## 8.7 `ui_pause_panel.png` (384×256, 투명) — 일시정지 패널

```
A wordless pause menu panel for a gentle storybook game, painted in soft hand-painted pixel art on a fully transparent background. A soft rounded cream parchment panel with a warm torn-paper edge, containing three evenly spaced circular icon slots: a play triangle, a pair of crossed-out sound waves, and a house symbol. Warm pastel palette with a soft outer glow and gentle shadow. Absolutely no text, no letters, no numbers, no watermark.
```

## 8.8 `ui_credits_marks.png` (512×256, 투명) — 엔딩 크레딧 픽토그램

```
A row of separated small symbolic credit marks for a wordless game ending, painted in soft hand-painted pixel art on a fully transparent background. Includes a paw print, a house, a bone, a musical note, a paintbrush, a gear, and a small heart, all rendered in the same delicate line-and-fill style at matching size with soft warm coloring. Warm cream and honey palette with a faint glow. Absolutely no text, no letters, no names, no numbers, no watermark.
```

## 8.9 `ui_vignette.png` (960×540, 투명) — 화면 비네트 오버레이

```
A full screen vignette overlay for a game, a soft dark warm-brown gradient fading from the frame edges toward a completely transparent center, with very gentle falloff and no visible banding, plus a faint film grain texture. No shapes, no objects, no text, no letters, no watermark. Pure atmospheric overlay only.
```

---

# 9. 컷 일러스트 (선택)

프롤로그·엔딩을 정적 일러스트로 보강하고 싶을 때만 제작한다. 없어도 진행 가능.

## 9.1 `cut_prologue_night.png` (960×540)

```
A single storybook illustration of a small dog sleeping curled on a round cushion beside a low bed in a warm dim bedroom at night, seen from the side, painted in soft hand-painted pixel art. A tall adult silhouette stands in the doorway on the left, backlit by warm hallway light, one hand just beginning to reach out. Amber lamp glow, deep blue shadow, dust motes in the light beam. Tender, quiet, the last peaceful moment. No text, no letters, no watermark.
```

## 9.2 `cut_ending_door.png` (960×540)

```
A single storybook illustration seen from inside a bedroom, of an open front door flooded with brilliant warm morning light, with the small cream-and-white dog standing on the threshold as a bright silhouette and an adult kneeling with arms opening toward it, painted in soft hand-painted pixel art. Heavy warm bloom around the doorway, long light beams across the wooden floor, dust motes suspended in the air. Overwhelming tenderness and release. No text, no letters, no watermark.
```

---

## 부록 A. 제작 순서 권장

1. **GUI 3종** (`ui_title_logo`, `ui_icons_menu`, `ui_touch_controls`) — 타이틀이 먼저 완성되면 전체 톤이 잡힌다
2. **타일셋 4종** — 지형이 있어야 레벨이 완성된다
3. **스테이지 1 배경 4장** → 플레이 테스트
4. 나머지 스테이지 배경 → 소품 → 컷 일러스트

## 부록 B. 체크리스트

1. 투명이어야 하는 레이어에 흰 배경이 남아 있지 않은가
2. 패럴랙스 레이어의 **좌우 끝이 이어지는가** (seamless)
3. 어디에도 글자·숫자·상호·번호판이 들어가지 않았는가 (**최우선**)
4. 같은 스테이지의 레이어들끼리 색온도가 맞는가
5. 타일셋이 32px 그리드에 정확히 맞는가
6. 파일명이 위 표와 정확히 일치하는가 → 일치하면 코드 수정 없이 자동 적용됨
