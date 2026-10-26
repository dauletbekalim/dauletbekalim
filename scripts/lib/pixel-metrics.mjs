// the pixel face's advance per glyph, in font units (8 to the em), copied from alim.wtf
// (components/primitives/pixelMetrics.ts, which its scripts/pixel-font.py writes with the
// font). an advance is the drawing plus one unit of spacing after it, so a line's ink is
// its advance minus one unit. a character not in here is not in the font either.

const each = (chars, adv) => Object.fromEntries([...chars].map((c) => [c, adv]));

export const PIXEL_ADVANCE = {
  ...each("ij!'‘’,.:;|·", 2),
  ...each("l`", 3),
  ...each("It  \"“”()[]•▶◀", 4),
  ...each("fk<>{}", 5),
  ...each("ABCDEFGHJKLMNOPQRSTUVWXYZabcdeghmnopqrsuvwxyz0123456789#$%&*+-/\\=?^_…×↗↖↘↙→←↑↓●■□▲▼", 6),
  ...each("@~", 7),
  ...each("©♥", 8),
};
