"""
에셋 전처리 — assets-src/ (원본) → public/assets/ (게임이 읽는 것)

AI 생성 에셋은 크기도 제각각이고, "투명 배경"을 실제 알파 대신 체커보드나
어두운 그라데이션으로 그려 오는 경우가 많다. 여기서 한 번에 정리한다.

  * 패럴랙스 레이어  : 배경(체커보드/흰 하늘)을 지워 알파로
  * 소품            : 가장자리에서 번져 들어가며 배경 제거
  * 아틀라스         : 균등 격자 칸마다 배경 제거 후 다시 균등 격자로
  * UI 시트          : 버튼/아이콘 낱개로 분리
  * 타일 아틀라스     : 8x4 격자로 정렬
  * 전부             : 게임 해상도에 맞게 축소 + 용량 최적화
  * 오디오           : ffmpeg 로 ogg 변환, 필요하면 길이도 자름

사용: python scripts/prepare_assets.py [--only images|audio] [--force]
"""

import os
import shutil
import subprocess
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets-src')
OUT = os.path.join(ROOT, 'public', 'assets')

Image.MAX_IMAGE_PIXELS = None

# ---------------------------------------------------------------- 공통 유틸


def log(msg):
    try:
        print('[assets] ' + msg)
    except UnicodeEncodeError:
        # 윈도우 콘솔이 cp949 면 표현 못 하는 문자가 있다
        print('[assets] ' + msg.encode('ascii', 'replace').decode('ascii'))


def ensure(path):
    os.makedirs(path, exist_ok=True)


def load(path):
    return Image.open(path).convert('RGBA')


def save(im, rel, quantize=True):
    dest = os.path.join(OUT, rel)
    ensure(os.path.dirname(dest))
    if quantize and im.mode == 'RGBA':
        # 알파를 남기면서 색만 줄여 용량을 낮춘다
        alpha = im.getchannel('A')
        rgb = im.convert('RGB').quantize(colors=200, method=Image.Quantize.MEDIANCUT)
        im = rgb.convert('RGBA')
        im.putalpha(alpha)
    im.save(dest, optimize=True)
    return dest


def fit(im, max_w=None, max_h=None):
    """비율을 지키며 축소한다 (확대는 하지 않는다)."""
    w, h = im.size
    scale = 1.0
    if max_w:
        scale = min(scale, max_w / float(w))
    if max_h:
        scale = min(scale, max_h / float(h))
    if scale >= 1.0:
        return im
    return im.resize((max(1, int(w * scale)), max(1, int(h * scale))), Image.LANCZOS)


# ---------------------------------------------------------------- 배경 제거


def strip_sky(im, bright=232, sat=26, feather=6):
    """
    위쪽 하늘/체커보드를 지운다.

    각 열을 위에서 아래로 훑어 '밝고 채도 낮은' 픽셀이 이어지는 동안만 지운다.
    건물 안쪽의 밝은 창문은 위와 이어져 있지 않으므로 살아남는다.
    """
    a = np.asarray(im).astype(np.int16)
    rgb = a[:, :, :3]
    h, w, _ = rgb.shape

    mx = rgb.max(axis=2)
    mn = rgb.min(axis=2)
    skyish = (mx >= bright) & ((mx - mn) <= sat)

    # 열마다 위에서부터 연속인 구간만 True 로 남긴다
    keep = np.cumprod(skyish, axis=0).astype(bool)

    alpha = a[:, :, 3].copy()
    alpha[keep] = 0

    # 경계를 부드럽게 — 지워진 영역 바로 아래 몇 줄을 서서히 불투명하게
    if feather > 0:
        edge = np.argmin(keep, axis=0)  # 열마다 하늘이 끝나는 행
        for step in range(feather):
            row = edge + step
            valid = (row < h) & (edge > 0)
            cols = np.where(valid)[0]
            if len(cols) == 0:
                continue
            frac = int(255 * (step + 1) / float(feather + 1))
            cur = alpha[row[cols], cols]
            alpha[row[cols], cols] = np.minimum(cur, frac).astype(alpha.dtype)

    out = a.copy()
    out[:, :, 3] = alpha
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def strip_border(im, tol=60, feather=2):
    """
    가장자리에서 번져 들어가며 배경을 지운다 (소품용).
    네 변에서 시작해, 시작 색과 비슷한 픽셀을 이어진 만큼 투명하게 만든다.
    """
    a = np.asarray(im).astype(np.int16)
    rgb = a[:, :, :3]
    h, w, _ = rgb.shape

    # 가장자리 색의 중앙값을 배경색으로 본다
    edges = np.concatenate([rgb[0, :], rgb[-1, :], rgb[:, 0], rgb[:, -1]])
    bg = np.median(edges, axis=0)

    dist = np.abs(rgb - bg).sum(axis=2)
    similar = dist <= tol

    # 가장자리에서 시작하는 연결 성분만 지운다 (BFS 대신 반복 팽창)
    mask = np.zeros((h, w), dtype=bool)
    mask[0, :] = similar[0, :]
    mask[-1, :] = similar[-1, :]
    mask[:, 0] = similar[:, 0]
    mask[:, -1] = similar[:, -1]

    while True:
        grown = mask.copy()
        grown[1:, :] |= mask[:-1, :]
        grown[:-1, :] |= mask[1:, :]
        grown[:, 1:] |= mask[:, :-1]
        grown[:, :-1] |= mask[:, 1:]
        grown &= similar
        if grown.sum() == mask.sum():
            break
        mask = grown

    alpha = a[:, :, 3].copy()
    alpha[mask] = 0

    if feather > 0:
        soft = mask.copy()
        for _ in range(feather):
            grown = soft.copy()
            grown[1:, :] |= soft[:-1, :]
            grown[:-1, :] |= soft[1:, :]
            grown[:, 1:] |= soft[:, :-1]
            grown[:, :-1] |= soft[:, 1:]
            soft = grown
        halo = soft & (~mask)
        alpha[halo] = (alpha[halo] * 0.55).astype(alpha.dtype)

    out = a.copy()
    out[:, :, 3] = alpha
    return Image.fromarray(out.astype(np.uint8), 'RGBA')


def looks_magenta(im, ratio=0.12):
    """마젠타 키 배경으로 그려진 그림인지 본다."""
    a = np.asarray(im)[:, :, :3].astype(np.int16)
    keyed = (a[:, :, 0] > 170) & (a[:, :, 1] < 100) & (a[:, :, 2] > 170)
    return keyed.mean() > ratio


def strip_chroma(im, feather=1):
    """
    마젠타(#FF00FF) 배경을 지운다.

    가장자리 flood fill 과 달리 색으로 바로 판별하므로, 소품 사이에 낀 배경까지
    깔끔하게 빠진다. 경계에 남는 자주색 테두리(스필)도 함께 눌러 준다.
    """
    a = np.asarray(im).astype(np.int16)
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]

    keyed = (r > 150) & (b > 150) & (g < np.minimum(r, b) - 45)
    alpha = a[:, :, 3].copy()
    alpha[keyed] = 0

    # 스필 억제 — 배경에 닿은 가장자리 픽셀의 자주색 기운을 뺀다
    spill = (~keyed) & (g < np.minimum(r, b) - 18)
    if spill.any():
        mid = ((r + b) // 2).astype(np.int16)
        target = np.minimum(mid, g + 26)
        a[:, :, 0] = np.where(spill, np.minimum(r, target + 12), r)
        a[:, :, 2] = np.where(spill, np.minimum(b, target + 12), b)

    if feather > 0:
        soft = keyed.copy()
        for _ in range(feather):
            grown = soft.copy()
            grown[1:, :] |= soft[:-1, :]
            grown[:-1, :] |= soft[1:, :]
            grown[:, 1:] |= soft[:, :-1]
            grown[:, :-1] |= soft[:, 1:]
            soft = grown
        halo = soft & (~keyed)
        alpha[halo] = (alpha[halo] * 0.5).astype(alpha.dtype)

    a[:, :, 3] = alpha
    return Image.fromarray(np.clip(a, 0, 255).astype(np.uint8), 'RGBA')


def strip_grid_lines(im, light=190, ratio=0.85):
    """시트에 그려진 흰 격자선을 배경색으로 덮는다.

    생성기가 칸을 나눠 그리라고 하면 칸 사이에 밝은 선을 실제로 그어 준다.
    그 선이 남아 있으면 여백을 자를 때 선까지 물건으로 잡혀 소품이 칸 안에서
    조그맣게, 한쪽으로 치우쳐 앉는다.

    선은 시트를 가로지르지만 소품은 그렇지 않다. 그래서 **끝에서 끝까지 밝은**
    줄만 골라 지운다.
    """
    a = np.asarray(im).astype(np.int16)
    rgb = a[:, :, :3]
    lightish = rgb.min(axis=2) > light

    bg = np.median(rgb.reshape(-1, 3), axis=0).astype(np.uint8)
    out = np.asarray(im).copy()
    for idx in np.where(lightish.mean(axis=0) > ratio)[0]:
        out[:, idx, :3] = bg
    for idx in np.where(lightish.mean(axis=1) > ratio)[0]:
        out[idx, :, :3] = bg
    return Image.fromarray(out)


def clean_background(im, tol=80):
    """배경을 지운다 — 마젠타 키가 보이면 그쪽을, 아니면 가장자리 번짐을 쓴다."""
    if looks_magenta(im):
        return strip_chroma(im)
    a = np.asarray(im)[:, :, 3]
    if float((a < 16).sum()) / a.size >= 0.05:
        return im  # 이미 투명이 충분하다
    return strip_border(im, tol=tol, feather=2)


def trim(im, threshold=8):
    """투명 여백을 잘라낸다."""
    a = np.asarray(im)[:, :, 3]
    rows = np.where(a.max(axis=1) > threshold)[0]
    cols = np.where(a.max(axis=0) > threshold)[0]
    if len(rows) == 0 or len(cols) == 0:
        return im
    return im.crop((cols[0], rows[0], cols[-1] + 1, rows[-1] + 1))


# ---------------------------------------------------------------- 시트 분할


def split_columns(im, min_width=20, alpha_threshold=24):
    """가로로 늘어선 덩어리를 왼쪽부터 잘라 낸다."""
    a = np.asarray(im)[:, :, 3]
    col = (a > alpha_threshold).sum(axis=0)
    thresh = max(2, int(col.max() * 0.02))
    on = col > thresh

    spans = []
    start = None
    for i, v in enumerate(on):
        if v and start is None:
            start = i
        elif not v and start is not None:
            if i - start >= min_width:
                spans.append((start, i))
            start = None
    if start is not None and len(on) - start >= min_width:
        spans.append((start, len(on)))

    return [trim(im.crop((s, 0, e, im.height))) for s, e in spans]


# ---------------------------------------------------------------- 이미지 작업

# 패럴랙스 레이어 — 하늘을 지워 알파로 만든다
PARALLAX = [
    'bg_city_far', 'bg_city_mid', 'bg_city_near',
    'bg_coast_far', 'bg_coast_mid', 'bg_coast_near',
    'bg_field_far', 'bg_field_mid', 'bg_field_near',
    'bg_mountain_far', 'bg_mountain_mid', 'bg_mountain_near',
]

# 통짜 배경 — 불투명 그대로 둔다
OPAQUE_BG = [
    'bg_city_sky', 'bg_coast_sky_day', 'bg_coast_sky_sunset',
    'bg_field_sky_morning', 'bg_field_sky_noon', 'bg_field_sky_evening',
    'bg_mountain_sky_night', 'bg_mountain_sky_dawn',
    'bg_columbarium_interior', 'bg_home_interior_night', 'bg_home_exterior',
]

# 8프레임 스프라이트의 프레임 한 칸 크기.
# 화면에 96px 안팎으로 그려지므로 160px 이면 충분히 선명하다.
SPRITE_FRAME = {
    '_default': 160,
    # 사람은 세로로 길어서 같은 칸에 담으면 작아진다. 조금 큰 칸을 쓴다
    'owner_child_run': 224,
    'owner_walk_silhouette': 224,
    'owner_adult_wake': 224,
    'owner_adult_walk': 224,
    'owner_adult_kneel': 224,
}

# 낱개 소품 — 가장자리 배경을 지운다
SOLO_PROPS = {
    'prop_ball': 260,
    'prop_food_stall': 620,
    'prop_owner_car': 560,
    'prop_sandbox': 520,
    'prop_sign_jump': 300,
    'prop_sign_move': 300,
    'prop_sign_run': 300,
    'prop_valley_pond': 700,
}

# 아틀라스 — 균등 격자로 슬라이스해서 쓰는 시트.
# 칸마다 배경을 지우고, 여백을 잘라낸 뒤, 칸 바닥에 맞춰 다시 앉힌다.
# 그래야 Phaser 가 프레임 번호만으로 꺼내 쓸 수 있고 지면에 세울 때 발이 뜨지 않는다.
ATLASES = {
    # 소품 — 4열 3행 (12칸)
    'props/props_city': {'cols': 4, 'rows': 3, 'cell': 384, 'anchor': 'bottom'},
    'props/props_coast': {'cols': 4, 'rows': 3, 'cell': 384, 'anchor': 'bottom'},
    'props/props_mountain': {'cols': 4, 'rows': 3, 'cell': 384, 'anchor': 'bottom'},
    'props/props_field': {'cols': 4, 'rows': 3, 'cell': 384, 'anchor': 'bottom'},
    'props/props_home': {'cols': 4, 'rows': 2, 'cell': 384, 'anchor': 'bottom'},
    # 움직이는 것들 — 4열 1행 (4칸)
    'props/actors_city': {'cols': 4, 'rows': 1, 'cell': 320, 'anchor': 'bottom'},
    'props/actors_coast': {'cols': 4, 'rows': 1, 'cell': 320, 'anchor': 'bottom'},
    'props/actors_mountain': {'cols': 4, 'rows': 1, 'cell': 320, 'anchor': 'bottom'},
    'props/actors_field': {'cols': 4, 'rows': 1, 'cell': 320, 'anchor': 'bottom'},
    # 지형 타일 — 4열 2행 (8칸). 타일은 칸을 꽉 채워야 하므로 여백을 자르지 않는다
    'tiles/tiles_city': {'cols': 4, 'rows': 2, 'cell': 128, 'anchor': 'stretch'},
    'tiles/tiles_coast': {'cols': 4, 'rows': 2, 'cell': 128, 'anchor': 'stretch'},
    'tiles/tiles_mountain': {'cols': 4, 'rows': 2, 'cell': 128, 'anchor': 'stretch'},
    'tiles/tiles_field': {'cols': 4, 'rows': 2, 'cell': 128, 'anchor': 'stretch'},
}

# UI 시트 → 낱개 이름
UI_SHEETS = {
    'ui_touch_controls': ['ui_btn_left', 'ui_btn_right', 'ui_btn_down', 'ui_btn_jump', 'ui_btn_interact'],
    'ui_icons_menu': ['ui_icon_paw', 'ui_icon_bone', 'ui_icon_house'],
}

# 그대로 쓰는 UI (배경만 지우고 축소)
UI_SOLO = {
    'ui_title_logo': (760, 380),
    'ui_prompt_interact': (150, 150),
    'ui_save_burst': (420, 420),
    'ui_rotate_device': (360, 360),
    'ui_pause_panel': (560, 380),
    'ui_credits_marks': (760, 200),
    'ui_vignette': (960, 540),
    'ui_scent_mote': (96, 96),
    'ui_save_glow': (192, 192),
}

def do_backgrounds():
    src = os.path.join(SRC, 'bg')
    for name in PARALLAX:
        p = os.path.join(src, name + '.png')
        if not os.path.exists(p):
            continue
        im = load(p)
        # 이미 알파가 충분히 있으면 하늘 제거를 건너뛴다
        a = np.asarray(im)[:, :, 3]
        transparent_ratio = float((a < 16).sum()) / a.size
        if transparent_ratio < 0.02:
            im = strip_sky(im)
        im = fit(im, max_w=1920)
        save(im, 'bg/%s.png' % name)
        log('배경 레이어 %s' % name)

    for name in OPAQUE_BG:
        p = os.path.join(src, name + '.png')
        if not os.path.exists(p):
            continue
        im = load(p).convert('RGB')
        im = fit(im, max_w=1920, max_h=1080)
        dest = os.path.join(OUT, 'bg', name + '.png')
        ensure(os.path.dirname(dest))
        im.quantize(colors=220, method=Image.Quantize.MEDIANCUT).save(dest, optimize=True)
        log('통짜 배경 %s' % name)

    # 컷신
    cut = os.path.join(SRC, 'cutscene')
    if os.path.isdir(cut):
        for fn in sorted(os.listdir(cut)):
            if not fn.endswith('.png'):
                continue
            im = load(os.path.join(cut, fn)).convert('RGB')
            im = fit(im, max_w=1280, max_h=720)
            dest = os.path.join(OUT, 'cutscene', fn)
            ensure(os.path.dirname(dest))
            im.quantize(colors=220, method=Image.Quantize.MEDIANCUT).save(dest, optimize=True)
            log('컷신 %s' % fn)


def do_sprites():
    """
    8프레임 애니메이션 시트를 정리한다.

    원본 프레임 크기가 얼마든 게임이 쓰는 크기(SPRITE_FRAME)로 맞춰 다시 이어 붙인다.
    프레임마다 배경을 지우되, 발이 붙어 있는 바닥선은 건드리지 않는다.
    """
    src = os.path.join(SRC, 'sprites')
    if not os.path.isdir(src):
        return

    for fn in sorted(os.listdir(src)):
        if not fn.lower().endswith(('.png', '.webp')):
            continue
        stem = os.path.splitext(fn)[0]
        im = load(os.path.join(src, fn))

        if im.width % 8 != 0:
            log('스프라이트 %s 건너뜀 — 가로가 8로 나뉘지 않는다 (%dx%d)' % (stem, im.width, im.height))
            continue

        fw = im.width // 8
        cell = SPRITE_FRAME.get(stem, SPRITE_FRAME['_default'])

        # 마젠타로 그려 왔으면 먼저 지운다 (시트 전체를 한 번에)
        if looks_magenta(im):
            im = strip_chroma(im)

        # 시트 전체 기준으로 아래 여백을 잘라 낸다.
        # 프레임마다 자르면 위치가 흔들리므로 8장을 통째로 본다.
        alpha = np.asarray(im)[:, :, 3]
        rows = np.where(alpha.max(axis=1) > 8)[0]
        if len(rows):
            im = im.crop((0, 0, im.width, min(im.height, int(rows[-1]) + 2)))

        out = Image.new('RGBA', (cell * 8, cell), (0, 0, 0, 0))
        scale = cell / float(fw)
        ph = max(1, min(cell, int(round(im.height * scale))))

        for i in range(8):
            piece = im.crop((i * fw, 0, (i + 1) * fw, im.height))
            piece = piece.resize((cell, ph), Image.LANCZOS)
            # 발이 칸 바닥에 닿도록 아래로 붙인다
            out.paste(piece, (i * cell, cell - ph))

        save(out, 'sprites/%s.png' % stem)
        log('스프라이트 %-20s 8 x %dpx' % (stem, cell))


def do_props():
    src = os.path.join(SRC, 'props')
    for name, target_h in SOLO_PROPS.items():
        p = os.path.join(src, name + '.png')
        if not os.path.exists(p):
            continue
        im = clean_background(load(p))
        im = trim(im)
        im = fit(im, max_h=target_h)
        save(im, 'props/%s.png' % name)
        log('소품 %s  %dx%d' % (name, im.width, im.height))


def do_atlases():
    """균등 격자 아틀라스를 칸 단위로 정리해 다시 균등 격자로 저장한다."""
    for rel, spec in ATLASES.items():
        p = os.path.join(SRC, rel + '.png')
        if not os.path.exists(p):
            continue

        src_im = load(p)
        cols, rows, cell = spec['cols'], spec['rows'], spec['cell']
        anchor = spec['anchor']

        if anchor != 'stretch':
            src_im = strip_grid_lines(src_im)

        cw = src_im.width / float(cols)
        ch = src_im.height / float(rows)

        # 격자 규격이 안 맞는 옛 시트를 잘못 자르지 않도록 칸 모양을 확인한다.
        #
        # 생성기가 칸을 정사각으로 안 그려 준다. 4x2 를 시켜도 세로로 긴 칸 여덟 개로
        # 주는 일이 흔하다. 소품은 칸마다 오려서 다시 앉히므로 칸이 좀 길어도 상관없고,
        # 칸 비율이 상식 밖일 때만 (칸 수를 잘못 센 시트다) 건너뛴다.
        # 타일은 칸을 통째로 정사각으로 늘려 쓰기 때문에 칸이 정사각이어야 한다.
        ratio = cw / ch
        lo, hi = (0.85, 1.18) if anchor == 'stretch' else (0.45, 2.2)
        if not lo <= ratio <= hi:
            log('아틀라스 %s 건너뜀 — %d x %d 칸으로 나누면 칸 모양이 %.2f : 1 이다 (%dx%d). '
                '.docs/assets-images2.md 규격으로 다시 뽑아야 한다'
                % (rel, cols, rows, ratio, src_im.width, src_im.height))
            continue

        out = Image.new('RGBA', (cell * cols, cell * rows), (0, 0, 0, 0))
        filled = 0

        for r in range(rows):
            for c in range(cols):
                box = [int(c * cw), int(r * ch), int((c + 1) * cw), int((r + 1) * ch)]
                if anchor != 'stretch':
                    # 생성기가 칸 사이에 흰 격자선을 그려 주는 일이 있다. 그 선이 남으면
                    # 여백을 자를 때 칸 전체가 물건으로 잡혀 소품이 조그맣게 앉는다.
                    # 타일은 칸을 꽉 채워야 하므로 건드리지 않는다.
                    ix, iy = int(cw * 0.02), int(ch * 0.02)
                    box = [box[0] + ix, box[1] + iy, box[2] - ix, box[3] - iy]
                piece = src_im.crop(tuple(box))

                if anchor == 'stretch':
                    # 타일은 칸을 꽉 채운다. 마젠타 여백만 걷어내고 늘린다
                    if looks_magenta(piece):
                        piece = trim(strip_chroma(piece))
                    piece = piece.resize((cell, cell), Image.LANCZOS)
                    out.paste(piece, (c * cell, r * cell))
                    filled += 1
                    continue

                # 소품 — 배경을 지우고 여백을 자른 뒤 칸 바닥에 세운다
                piece = clean_background(piece)
                piece = trim(piece)
                if piece.width < 8 or piece.height < 8:
                    continue

                piece = fit(piece, max_w=cell - 8, max_h=cell - 8)
                x = c * cell + (cell - piece.width) // 2
                y = r * cell + (cell - piece.height)
                out.paste(piece, (x, y), piece)
                filled += 1

        save(out, rel + '.png')
        log('아틀라스 %s  %d/%d칸  %dx%d' % (rel, filled, cols * rows, out.width, out.height))


def do_ui():
    src = os.path.join(SRC, 'ui')
    for sheet, names in UI_SHEETS.items():
        p = os.path.join(src, sheet + '.png')
        if not os.path.exists(p):
            continue
        pieces = split_columns(load(p))
        log('UI 시트 %s → %d조각' % (sheet, len(pieces)))
        for i, piece in enumerate(pieces):
            label = names[i] if i < len(names) else '%s_%02d' % (sheet, i)
            save(fit(piece, max_h=200), 'ui/%s.png' % label)

    for name, (mw, mh) in UI_SOLO.items():
        p = os.path.join(src, name + '.png')
        if not os.path.exists(p):
            continue
        im = clean_background(load(p), tol=70)
        if name != 'ui_vignette':
            im = trim(im)
        save(fit(im, max_w=mw, max_h=mh), 'ui/%s.png' % name)
        log('UI %s' % name)

    # 일시정지 버튼 아이콘은 패널에서 쓰지 않고 따로 만든다 (원본에 없음)
    icon = Image.new('RGBA', (96, 96), (0, 0, 0, 0))
    from PIL import ImageDraw
    d = ImageDraw.Draw(icon)
    d.ellipse((4, 4, 92, 92), fill=(253, 246, 231, 235), outline=(138, 122, 99, 230), width=4)
    d.rectangle((36, 30, 45, 66), fill=(107, 90, 69, 255))
    d.rectangle((52, 30, 61, 66), fill=(107, 90, 69, 255))
    save(icon, 'ui/ui_pause_icon.png', quantize=False)
    log('UI ui_pause_icon (생성)')


# ---------------------------------------------------------------- 오디오

# 길이를 잘라 쓸 것 — (시작초, 길이초)
AUDIO_TRIM = {
    'sfx_steam': (0.4, 1.1),
    'sfx_wave_rush': (0.0, 2.0),
    'sfx_ball': (0.0, 0.5),
    'sfx_splash': (0.0, 0.9),
    'sfx_whine': (0.3, 1.3),
    'sfx_sniff': (0.0, 0.7),
    'sfx_rock_fall': (0.0, 1.3),
    'sfx_car_pass': (0.0, 2.2),
    'sfx_crumble': (0.0, 1.1),
    'sfx_boar_snort': (0.0, 0.9),
    'sfx_scratch_door': (0.0, 1.1),
    'jingle_stage_clear': (0.0, 5.0),
}

# 비트레이트
BITRATE = {'bgm': '96k', 'amb': '80k', 'sfx': '64k', 'jingle': '80k'}


def kind_of(stem):
    if stem.startswith('bgm_'):
        return 'bgm'
    if stem.startswith('amb_'):
        return 'amb'
    if stem.startswith('jingle_'):
        return 'jingle'
    return 'sfx'


def do_audio():
    src = os.path.join(SRC, 'audio')
    if not os.path.isdir(src):
        return
    ensure(os.path.join(OUT, 'audio'))

    for fn in sorted(os.listdir(src)):
        stem, ext = os.path.splitext(fn)
        if ext.lower() not in ('.wav', '.mp3', '.ogg', '.m4a', '.flac'):
            continue
        kind = kind_of(stem)
        dest = os.path.join(OUT, 'audio', stem + '.ogg')

        cmd = ['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y']
        trim = AUDIO_TRIM.get(stem)
        if trim:
            cmd += ['-ss', str(trim[0]), '-t', str(trim[1])]
        cmd += ['-i', os.path.join(src, fn)]

        # 앰비언스와 BGM 은 길게 두되 3분을 넘기지 않는다
        if kind in ('bgm', 'amb'):
            cmd += ['-t', '180']

        cmd += ['-vn', '-ac', '2', '-ar', '44100', '-c:a', 'libvorbis', '-b:a', BITRATE[kind], dest]

        res = subprocess.run(cmd, capture_output=True)
        if res.returncode != 0:
            log('오디오 실패 %s: %s' % (fn, res.stderr.decode('utf-8', 'replace')[:160]))
            continue
        size = os.path.getsize(dest) // 1024
        log('오디오 %-26s %5dKB' % (stem + '.ogg', size))


# ---------------------------------------------------------------- 진입점


def main():
    only = None
    if '--only' in sys.argv:
        only = sys.argv[sys.argv.index('--only') + 1]

    if not os.path.isdir(SRC):
        log('assets-src/ 가 없습니다. 원본 에셋을 그 안에 넣어 주세요.')
        return

    if only in (None, 'images'):
        do_sprites()
        do_backgrounds()
        do_props()
        do_atlases()
        do_ui()
    if only in (None, 'audio'):
        do_audio()

    total = 0
    for root, _, files in os.walk(OUT):
        for f in files:
            total += os.path.getsize(os.path.join(root, f))
    log('완료. public/assets 총 %.1fMB' % (total / 1024.0 / 1024.0))


if __name__ == '__main__':
    main()
