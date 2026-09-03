"""
전처리를 안 거치고 public/assets/ 에 바로 들어온 파일을 뒤늦게 정리한다.

정상 경로는 이렇다.

    assets-src/  →  npm run assets:prepare  →  public/assets/

그런데 원본이 assets-src/ 에 없이 결과물 자리에 바로 놓인 파일이 생겼다.
정상 경로를 태울 원본이 없으므로, 여기서 **제자리로** 같은 처리를 한다.
규격이 어긋나지 않도록 prepare_assets.py 의 함수를 그대로 빌려 쓴다.

  * 패럴랙스 레이어 : 가로 1920 으로 축소
  * 낱개 소품      : 배경 제거 → 여백 잘라내기 → 높이 맞춤
  * 8프레임 시트    : 가로를 8 로 나뉘게 맞춘 뒤 프레임 크기로 다시 굽기

같은 파일을 다시 돌려도 결과는 같다 (이미 규격에 맞으면 건너뛴다).

사용: python scripts/repair_public_assets.py [--dry-run]
"""

import os
import sys

import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import prepare_assets as pa  # noqa: E402

# 가로 1920 으로만 맞추면 되는 패럴랙스 레이어
PARALLAX = [
    'bg_city_mid', 'bg_city_near',
    'bg_coast_mid', 'bg_coast_near',
    'bg_field_mid', 'bg_field_near',
    'bg_mountain_mid', 'bg_mountain_near',
]

# 낱개 소품 → 목표 높이. prepare_assets.SOLO_PROPS 와 같은 값을 쓴다
SOLO = {
    'prop_sandbox': 520,
    'prop_valley_pond': 700,
    'prop_sign_jumpdown': 300,
    'prop_sign_lookdown': 300,
}

# 8프레임 시트 → 프레임 한 칸 크기. AssetManifest.js 의 w/h 와 같아야 한다
SHEETS = {
    'dog_sniff': 160,
}

BG_MAX_W = 1920

dry_run = '--dry-run' in sys.argv


def report(rel, before, after, note=''):
    tail = ('  ' + note) if note else ''
    pa.log('%-28s %sx%s → %sx%s%s' % (rel, before[0], before[1], after[0], after[1], tail))


def store(im, rel, before):
    if dry_run:
        report(rel, before, im.size, '(미리보기)')
        return
    pa.save(im, rel)
    report(rel, before, im.size)


def repair_parallax(name):
    rel = 'bg/%s.png' % name
    path = os.path.join(pa.OUT, rel)
    if not os.path.exists(path):
        pa.log('%s 없음 — 건너뜀' % rel)
        return

    im = pa.load(path)
    if im.width <= BG_MAX_W:
        pa.log('%-28s 이미 규격 — 건너뜀' % rel)
        return

    before = im.size
    store(pa.fit(im, max_w=BG_MAX_W), rel, before)


def repair_solo(name, target_h):
    rel = 'props/%s.png' % name
    path = os.path.join(pa.OUT, rel)
    if not os.path.exists(path):
        pa.log('%s 없음 — 건너뜀' % rel)
        return

    im = pa.load(path)
    before = im.size
    if im.height <= target_h and _transparent_ratio(im) >= 0.05:
        pa.log('%-28s 이미 규격 — 건너뜀' % rel)
        return

    # clean_background 는 알파가 이미 충분하면 그대로 돌려준다
    im = pa.clean_background(im)
    im = pa.trim(im)
    store(pa.fit(im, max_h=target_h), rel, before)


def repair_sheet(name, cell):
    """
    8프레임 시트를 프레임 크기에 맞춰 다시 굽는다.

    prepare_assets.do_sprites() 와 같은 절차지만, 가로가 8 로 나뉘지 않는 원본을
    그냥 버리지 않고 가장 가까운 8의 배수로 늘려서 처리한다. 어차피 한 프레임
    폭이 몇 px 늘고 마는 정도라 눈에 띄지 않는다.
    """
    rel = 'sprites/%s.png' % name
    path = os.path.join(pa.OUT, rel)
    if not os.path.exists(path):
        pa.log('%s 없음 — 건너뜀' % rel)
        return

    im = pa.load(path)
    before = im.size
    if im.size == (cell * 8, cell):
        pa.log('%-28s 이미 규격 — 건너뜀' % rel)
        return

    if im.width % 8 != 0:
        snapped = max(8, int(round(im.width / 8.0)) * 8)
        im = im.resize((snapped, im.height), Image.LANCZOS)

    fw = im.width // 8

    if pa.looks_magenta(im):
        im = pa.strip_chroma(im)
    im = pa.despill(im)

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

    store(out, rel, before)


def _transparent_ratio(im):
    a = np.asarray(im)[:, :, 3]
    return float((a < 16).sum()) / a.size


def main():
    if not os.path.isdir(pa.OUT):
        pa.log('public/assets/ 가 없습니다.')
        return

    for name in PARALLAX:
        repair_parallax(name)
    for name, target_h in SOLO.items():
        repair_solo(name, target_h)
    for name, cell in SHEETS.items():
        repair_sheet(name, cell)

    pa.log('완료.' + (' (--dry-run 이라 아무것도 쓰지 않았다)' if dry_run else ''))


if __name__ == '__main__':
    main()
