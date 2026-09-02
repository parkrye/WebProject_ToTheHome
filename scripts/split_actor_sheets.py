# -*- coding: utf-8 -*-
"""actors_<스테이지>.png (4열 1행) 을 낱장 레퍼런스 16장으로 쪼갠다.

8프레임 애니메이션 시트를 만들 때 생성기에 물려 줄 **기준 그림**이라,
배경은 게임용처럼 투명하게 만들지 않고 원본과 같은 마젠타로 둔다.

    python scripts/split_actor_sheets.py [원본_디렉터리]

결과: assets-src/_ref/actors/actor_<스테이지>_<역할>.png (1024x1024)
"""
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'assets-src', 'props')
OUT = os.path.join(ROOT, 'assets-src', '_ref', 'actors')

CANVAS = 1024
MARGIN = 0.06
MAGENTA = (255, 0, 255)

# 스테이지별 칸 = ACTOR 상수 순서 (MOVER / FALLER / PUFF / FLYER)
# 앵커: bottom = 칸 바닥에 세움, center = 가운데 띄움
SHEETS = {
    'city': [('mover', 'bottom'), ('faller', 'center'), ('puff', 'bottom'), ('flyer', 'center')],
    'coast': [('mover', 'bottom'), ('faller', 'bottom'), ('puff', 'bottom'), ('flyer', 'center')],
    'mountain': [('mover', 'bottom'), ('faller', 'bottom'), ('puff', 'bottom'), ('flyer', 'bottom')],
    'field': [('mover', 'center'), ('faller', 'center'), ('puff', 'center'), ('flyer', 'center')],
}


def content_box(cell, inset_ratio=0.03, tol=55, min_run=3):
    """칸 안에서 물체가 차지한 사각형을 찾는다.

    배경 마젠타가 칸마다 조금씩 다르고 칸 테두리에 얇은 선이 남아 있어서,
    안쪽으로 조금 들어가 중앙값 색을 배경으로 잡고 거기서 멀리 떨어진 픽셀만 센다.
    한 줄에 min_run 개 미만이면 잡티로 보고 버린다.
    """
    ins = int(cell.width * inset_ratio)
    inner = cell.crop((ins, ins, cell.width - ins, cell.height - ins))
    a = np.asarray(inner).astype(np.int16)
    bg = np.median(a.reshape(-1, 3), axis=0)
    mask = np.abs(a - bg).max(axis=2) > tol

    cols = np.where(mask.sum(axis=0) >= min_run)[0]
    rows = np.where(mask.sum(axis=1) >= min_run)[0]
    if not len(cols) or not len(rows):
        return None
    return inner, (int(cols[0]), int(rows[0]), int(cols[-1]) + 1, int(rows[-1]) + 1)


def flatten_background(im):
    """칸마다 톤이 다른 배경 마젠타를 순수 #FF00FF 로 통일한다.

    얼룩진 배경을 그대로 물려 주면 다음 생성 때 그 얼룩까지 따라 그린다.
    마젠타로만 보이는 픽셀만 골라 한 색으로 눕히므로 물보라·안개·홀씨는 남는다.
    """
    a = np.asarray(im).copy()
    r, g, b = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    a[(r > 190) & (b > 170) & (g < 90)] = MAGENTA
    return Image.fromarray(a)


def main():
    os.makedirs(OUT, exist_ok=True)
    for theme, slots in SHEETS.items():
        path = os.path.join(SRC, 'actors_%s.png' % theme)
        if not os.path.exists(path):
            print('없음 %s' % path)
            continue

        sheet = Image.open(path).convert('RGB')
        cw = sheet.width // len(slots)

        for i, (slot, anchor) in enumerate(slots):
            found = content_box(sheet.crop((i * cw, 0, (i + 1) * cw, sheet.height)))
            if found is None:
                print('빈 칸 %s %d' % (theme, i))
                continue

            inner, box = found
            obj = flatten_background(inner.crop(box))

            limit = int(CANVAS * (1 - MARGIN * 2))
            scale = min(limit / obj.width, limit / obj.height)
            nw, nh = max(1, round(obj.width * scale)), max(1, round(obj.height * scale))
            obj = obj.resize((nw, nh), Image.LANCZOS)

            out = Image.new('RGB', (CANVAS, CANVAS), MAGENTA)
            y = CANVAS - int(CANVAS * MARGIN) - nh if anchor == 'bottom' else (CANVAS - nh) // 2
            out.paste(obj, ((CANVAS - nw) // 2, y))

            name = 'actor_%s_%s.png' % (theme, slot)
            out.save(os.path.join(OUT, name), optimize=True)
            print('%-26s %4dx%-4d' % (name, box[2] - box[0], box[3] - box[1]))


if __name__ == '__main__':
    main()
