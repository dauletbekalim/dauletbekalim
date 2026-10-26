// the links under the header, as the site's hotbar: one slot per place to find me, each
// its own svg (github allows one link per image), the item drawn in the slot and its name
// under it. the first wears the selected slot's white frame, the way the hotbar marks
// what's in hand. the slots are g 3 (60px, a 48px item) and the names 16px. every tile is
// the same width, so six make one bar on desktop and a phone wraps them into a neat 3 + 3
// (3 x 104 fits github's ~310px phone column) instead of a ragged row.

import { pxText, slot } from "../lib/frames.mjs";
import { INK } from "../lib/palette.mjs";
import { svgDoc } from "../lib/svg.mjs";
import { LINKS } from "./copy.mjs";
import { item } from "./kit.mjs";

const g = 3;
const SLOT = 20 * g;
const SIZE = 16; // the name, in the pixel face
const TILE = 104;

export function linkTile({ label, item: name }, selected) {
  const text = pxText(label, { size: SIZE });
  // one width for all: the widest name ("agentmash", 102px of ink) and a hair either side
  const w = TILE;
  if (text.w > w) throw new Error(`"${label}" is wider than a hotbar tile`);
  const sx = Math.round((w - SLOT) / 2);
  const sy = 3 * g;
  const ty = sy + SLOT + 2 * g + 3 * g;
  const h = ty + SIZE * 1.25 + 3 * g;
  const body = [
    slot({ x: sx, y: sy, g, item: item(name), selected }),
    pxText(label, { x: w / 2, y: ty, size: SIZE, color: selected ? INK.paper : INK.dim, align: "center" }),
  ].join("");
  // square corners: the tiles sit edge to edge as one bar, and cut ones would notch it
  return { file: null, svg: svgDoc({ w, h, body, title: label }), w, h };
}

export const links = () => LINKS.map((l, i) => ({ ...linkTile(l, i === 0), file: l.file }));
