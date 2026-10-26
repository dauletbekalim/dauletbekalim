# turns the cover photo (alim on stage with the mic, the cutout alim.wtf uses) into the
# ascii grid the header draws: one mono glyph per cell, light prints, the ramp from light
# to dense. the same maths as alim.wtf's lib/halftone.ts and scripts/og.py, with the
# numbers from its content/photos.ts (COVER.halftone). writes scripts/data/portrait.json,
# which header.mjs reads, so the header itself needs nothing but node.
# re-run only for a new photo:
#   python scripts/portrait.py [path/to/alim-stage.webp] [cols]
# needs python 3 with pillow (webp) and numpy.
import json
import os
import sys

import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# the site's repo sits next to this one on alim's machine
SRC = sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, "..", "portfolio", "public", "cover", "alim-stage.webp")
COLS = int(sys.argv[2]) if len(sys.argv) > 2 else 76
OUT = os.path.join(ROOT, "scripts", "data", "portrait.json")

# content/photos.ts COVER, copied
W0, H0 = 560, 600
PUPIL = (0.373, 0.227)
HEAD_X = 0.388
ADVANCE = 0.6
WEIGHT = 700
RAMP = " .'`^\",:;Il!i><~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$"
BLACK, WHITE, GAMMA, EXP, FLOOR = 0.06, 0.96, 0.9, 0.75, 1
UNSHARP = (3, 0.6)
GATE = (0.35, 0.8)
EDGE_FADE = 0.02


def box_blur(a, r):
    # one separable box pass, edges clamped, like halftone.ts boxBlur
    win = 2 * r + 1
    p = np.pad(a, ((0, 0), (r, r)), mode="edge")
    c = np.cumsum(np.pad(p, ((0, 0), (1, 0))), axis=1)
    a = (c[:, win:] - c[:, :-win]) / win
    p = np.pad(a, ((r, r), (0, 0)), mode="edge")
    c = np.cumsum(np.pad(p, ((1, 0), (0, 0))), axis=0)
    return (c[win:, :] - c[:-win, :]) / win


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def main():
    img = Image.open(SRC).convert("RGBA").resize((W0, H0), Image.LANCZOS)
    px = np.asarray(img, dtype=np.float32) / 255
    L = 0.2126 * px[..., 0] + 0.7152 * px[..., 1] + 0.0722 * px[..., 2]
    A = px[..., 3]

    # unsharp on L, the blur alpha-weighted so the clear surround adds no halo
    radius, amount = UNSHARP
    bLA, bA = L * A, A
    for _ in range(3):
        bLA, bA = box_blur(bLA, radius), box_blur(bA, radius)
    blur = np.where(bA > 1e-4, bLA / np.maximum(bA, 1e-4), L)
    Ls = L + amount * (L - blur)

    # the lattice: cells centred on the pupil, each source pixel in exactly one
    cw = W0 / COLS
    ch = cw / ADVANCE
    ox, oy = PUPIL[0] * W0, PUPIL[1] * H0
    i = np.floor((np.arange(W0) + 0.5 - ox) / cw + 0.5).astype(int)
    j = np.floor((np.arange(H0) + 0.5 - oy) / ch + 0.5).astype(int)
    i0, j0 = i.min(), j.min()
    ni, nj = i.max() - i0 + 1, j.max() - j0 + 1
    idx = (j[:, None] - j0) * ni + (i[None, :] - i0)
    cnt = np.bincount(idx.ravel(), minlength=ni * nj)
    sA = np.bincount(idx.ravel(), weights=A.ravel(), minlength=ni * nj)
    sL = np.bincount(idx.ravel(), weights=(Ls * A).ravel(), minlength=ni * nj)
    Lc = np.where(sA > 0, sL / np.maximum(sA, 1e-9), 1)
    Ac = np.where(cnt > 0, sA / np.maximum(cnt, 1), 0)

    # tone: light prints, the ramp's index from the levelled lightness
    top = len(RAMP) - 1
    cx = ox + (np.arange(ni * nj) % ni + i0) * cw
    fx = cx / W0
    fade = smoothstep(0, EDGE_FADE, fx) * smoothstep(1, 1 - EDGE_FADE, fx)
    lp = np.clip((Lc - BLACK) / (WHITE - BLACK), 0, 1) ** GAMMA
    D = lp * smoothstep(GATE[0], GATE[1], Ac) * fade
    n = np.where(D > 0, np.round(D ** EXP * top), 0).astype(int)
    n = np.where((n < FLOOR) & (Ac >= 0.5) & (fade > 0.5), FLOOR, n)
    n = np.minimum(n, top)

    # the pupil's cell is a space: the darkest solid cell next to it, as on the cover
    best, focal = None, (0 - j0) * ni + (0 - i0)
    for dj in (-1, 0, 1):
        for di in (-1, 0, 1):
            k = (dj - j0) * ni + (di - i0)
            if Ac[k] > 0.9 and (best is None or Lc[k] < best):
                best, focal = Lc[k], k
    n[focal] = 0

    n = n.reshape(nj, ni)
    body = (Ac > 0.2).reshape(nj, ni)
    out = {
        "cols": COLS,
        "ramp": RAMP,
        "weight": WEIGHT,
        "size": [W0, H0],
        "cell": [cw, ch],  # source px, across and down
        # the centre of cell (0, 0) in source px
        "origin": [ox + i0 * cw, oy + j0 * ch],
        "head": HEAD_X,
        "rows": ["".join(RAMP[k] for k in row) for row in n],
        # where the figure stands (alpha past .2), so the glyph field keeps off him
        "body": ["".join("#" if b else "." for b in row) for row in body],
    }
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=0)
    print("wrote %s, %d x %d cells" % (OUT, ni, nj))


main()
