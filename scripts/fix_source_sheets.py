# -*- coding: utf-8 -*-
"""생성기가 잘못 그려 준 시트를 자리에서 고친다.

다시 뽑는 게 정석이지만, 칸 하나 때문에 시트 한 장을 다시 뽑는 건 아까운 경우가 있다.
여기 적힌 것은 **어느 칸이 어떻게 어긋났는지**의 기록이기도 하다.
여러 번 돌려도 결과가 같도록 이미 고쳐진 시트는 건드리지 않는다.

    python scripts/fix_source_sheets.py
"""
import os

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'assets-src')


def background(a):
    return np.median(a.reshape(-1, 3), axis=0).astype(np.uint8)


def fix_props_home_bed(path):
    """props_home 3번 칸(침대)이 2번 칸(문에서 쏟아지는 빛)을 침범한 것을 고친다.

    침대 머리판 바깥 기둥이 칸 경계보다 37px 왼쪽에서 시작한다. 그대로 두면
    빛 칸에 나무 기둥이 하나 딸려 나오고, 침대 칸은 기둥이 잘린 채 나온다.
    침대를 통째로 오려서 3번 칸 안에 다시 앉힌다.
    """
    im = Image.open(path).convert('RGB')
    cw, ch = im.width / 4.0, im.height / 2.0
    bed = (1049, 271, 1416, 542)  # 침대가 실제로 차지한 자리
    cell3 = (int(3 * cw), 0, int(4 * cw), int(ch))

    a = np.asarray(im).astype(np.int16)
    bg = background(a)

    # 이미 고쳐 놓았으면 침대가 경계 왼쪽에 남아 있지 않다
    strip = a[bed[1]:bed[3], bed[0]:cell3[0]]
    if np.count_nonzero(np.abs(strip - bg).max(axis=2) > 55) < 200:
        print('props_home - 이미 고쳐져 있다')
        return False

    piece = im.crop(bed)
    out = np.asarray(im).copy()
    out[bed[1]:bed[3], bed[0]:bed[2]] = bg
    im = Image.fromarray(out)

    limit = int((cell3[2] - cell3[0]) * 0.98)
    scale = limit / float(piece.width)
    piece = piece.resize((limit, max(1, round(piece.height * scale))), Image.LANCZOS)
    x = cell3[0] + (cell3[2] - cell3[0] - piece.width) // 2
    im.paste(piece, (x, bed[3] - piece.height))
    im.save(path)
    print('props_home - 침대를 3번 칸 안으로 옮겼다')
    return True


def main():
    p = os.path.join(SRC, 'props', 'props_home.png')
    if os.path.exists(p):
        fix_props_home_bed(p)
    else:
        print('없음 %s' % p)


if __name__ == '__main__':
    main()
