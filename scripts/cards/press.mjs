// press: the interview as a page of a written book, the one light thing in the readme,
// like on the site (components/sections/Press.tsx): the game's warm paper in its brown
// ink, inside the book's leather. the outlet and date, "page 1 of 1" as the game's book
// sets it, the headline in russian as it ran (drawn by lib/pixel-cyrillic.mjs, the pixel
// face has no cyrillic), the english gloss, the one quote, where else it ran, and the way
// to the article as the dark gui button. 410 wide at g 2.

import { button, monoText, pxText, wrap } from "../lib/frames.mjs";
import { MC, SHADE } from "../lib/palette.mjs";
import { cyrText, cyrWrap } from "../lib/pixel-cyrillic.mjs";
import { cutCorners, svgDoc } from "../lib/svg.mjs";
import { PRESS } from "./copy.mjs";
import { wrapChars } from "./kit.mjs";

const g = 2;
const W = 410;
const SIZE = 16;
const HEAD = 24; // the headline, a step up
const MONO = 16;
const INK = MC.ink;
const INK2 = MC.dirt2; // the paler brown, for what's around the words

const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;

export function press() {
  const C = 3 * g; // the leather showing round the page
  const pad = 8 * g;
  const x = C + pad;
  const textW = W - 2 * x;

  // lay the words out first, to know how tall the page is
  const head = cyrWrap(PRESS.headline, textW, HEAD);
  const gloss = wrap(PRESS.gloss, textW, SIZE);
  const quote = wrapChars(PRESS.quote, Math.floor((textW - 6 * g) / (0.6 * MONO)));
  const lines = [];
  // "page 1 of 1" top right, as the game's book sets it, the outlet and date under it
  let y = C + 5 * g;
  lines.push(pxText(PRESS.page, { x: W - x, y, size: SIZE, color: INK2, shadow: false, align: "right" }));
  y += 20 + 2 * g;
  lines.push(pxText(`${PRESS.outlet} · ${PRESS.date}`, { x, y, size: SIZE, color: INK2, shadow: false }));
  y += 20 + 5 * g;
  for (const l of head) {
    lines.push(cyrText(l, { x, y, size: HEAD, color: INK }));
    y += HEAD * 1.25 + g;
  }
  y += 2 * g;
  for (const l of gloss) {
    lines.push(pxText(l, { x, y, size: SIZE, color: INK2, shadow: false }));
    y += 20;
  }
  y += 5 * g;
  // the quote, with a rule down its left like a pull quote
  const qy = y;
  for (const l of quote) {
    lines.push(monoText(l, { x: x + 6 * g, y, size: MONO, color: INK, lh: 22 / MONO }));
    y += 22;
  }
  lines.push(`<path fill="${MC.paperEdge}" shape-rendering="crispEdges" d="${R(x, qy + g, 2 * g, y - qy - 2 * g)}"/>`);
  y += 5 * g;
  lines.push(pxText(PRESS.also, { x, y, size: SIZE, color: INK2, shadow: false }));
  y += 20 + 6 * g;
  const btn = button({ x, y, g, label: PRESS.read });
  lines.push(btn);
  y += btn.h + 7 * g;
  const H = y + C;

  // the book: leather, lit along the top and left, dark along the bottom and right; the
  // page inside it, lit the same way, its edge a darker paper
  const book =
    `<g shape-rendering="crispEdges">` +
    `<path fill="${SHADE.leather}" d="${cutCorners(0, 0, W, H, g)}"/>` +
    `<path fill="${SHADE.leatherLit}" d="${R(g, g, W - 2 * g, g)}${R(g, g, g, H - 2 * g)}"/>` +
    `<path fill="${SHADE.leatherDark}" d="${R(g, H - 2 * g, W - 2 * g, g)}${R(W - 2 * g, g, g, H - 2 * g)}"/>` +
    `<path fill="${MC.paper}" d="${R(C, C, W - 2 * C, H - 2 * C)}"/>` +
    `<path fill="#f6ecd0" d="${R(C, C, W - 2 * C, g)}${R(C, C, g, H - 2 * C)}"/>` +
    `<path fill="${MC.paperEdge}" d="${R(C, H - C - g, W - 2 * C, g)}${R(W - C - g, C, g, H - 2 * C)}"/>` +
    `</g>`;

  const title = `press: ${PRESS.outlet}, ${PRESS.date}. "${PRESS.headline}" (${PRESS.gloss}).`;
  const svg = svgDoc({ w: W, h: H, body: book + lines.join("\n"), corners: g, title });
  return [{ file: "press", svg, w: W, h: H }];
}
