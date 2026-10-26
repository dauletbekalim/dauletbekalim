# cuts fonts down to the glyphs an svg uses, for scripts/lib/fonts.mjs. reads a json list
# of {font, text, weight} on stdin and prints a json list of base64 woff2 (or null when the
# font draws none of the text). a variable font is pinned to the weight first. no layout
# features: the mono's ligatures would merge -> and // into one shape, and every glyph
# should keep its own cell, like on the site.
# needs fontTools and brotli (pip install fonttools brotli).

import base64
import io
import json
import sys

from fontTools import subset
from fontTools.ttLib import TTFont


def cut(req):
    # recalcTimestamp off: the same text cuts the same bytes, so a redrawn svg only
    # changes when its drawing does (the wall's action commits on a change)
    font = TTFont(req["font"], recalcTimestamp=False)
    if "fvar" in font:
        from fontTools.varLib import instancer

        font = instancer.instantiateVariableFont(font, {"wght": req.get("weight") or 400})
    cmap = font.getBestCmap()
    if not any(ord(c) in cmap for c in req["text"]):
        return None
    opts = subset.Options()
    opts.layout_features = []
    opts.name_IDs = [1, 2]
    opts.notdef_outline = False
    sub = subset.Subsetter(opts)
    sub.populate(text=req["text"])
    sub.subset(font)
    font.flavor = "woff2"
    buf = io.BytesIO()
    font.save(buf)
    return base64.b64encode(buf.getvalue()).decode("ascii")


# stdin as utf-8 bytes: windows would read it in its own code page
reqs = json.loads(sys.stdin.buffer.read().decode("utf-8"))
print(json.dumps([cut(r) for r in reqs]))
