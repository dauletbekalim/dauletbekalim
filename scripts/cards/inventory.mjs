// inventory: the stack, as the game's inventory screen. on the left the player preview
// (an inset box, alim's sprite under his nametag) and the xp bar with his level (his
// age, like the site's "level 18"); on the right every tool an item in its slot with its
// name beside it, white over its kind in the lore grey (the site's before section sets
// items the same way). 830 wide at g 3: the 24px names are ~10px on a phone.
// motion: the items drop into their slots one by one, the xp bar fills.

import { MOTION, nametag, panel, pxText, slot, xpBar } from "../lib/frames.mjs";
import { INK, MC, UI } from "../lib/palette.mjs";
import { drawSprite, sprite } from "../lib/sprites.mjs";
import { svgDoc } from "../lib/svg.mjs";
import { INVENTORY } from "./copy.mjs";
import { delay, item, POP } from "./kit.mjs";

const g = 3;
const W = 830;
const M = 4 * g;
const P = 6 * g;
const SLOT = 18 * g;
const ROW = SLOT + 5 * g; // a slot and the gap under it
const SIZE = 24;

const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;

export function inventory() {
  const rows = Math.ceil(INVENTORY.items.length / 2);
  const L = M + P + 3 * g;
  const top = M + P;
  const gy = top + 30 + 4 * g;
  const gridH = rows * ROW - 5 * g;
  const H = gy + gridH + P + M + 2 * g;

  const parts = [panel({ x: M, y: M, w: W - 2 * M, h: H - 2 * M, g })];
  parts.push(pxText(INVENTORY.label, { x: L, y: top, size: SIZE, color: INK.dim, shadow: false }));

  // the player preview: an inset box, black inside like the game's, alim standing in it
  // with his nametag over him; the xp bar and his level under it
  const bw = 56 * g;
  const bh = gridH - 18 * g;
  parts.push(
    `<g shape-rendering="crispEdges"><path fill="#000" d="${R(L, gy, bw, bh)}"/>` +
      `<path fill="${UI.slotHi}" d="${R(L, gy + bh - g, bw, g)}${R(L + bw - g, gy, g, bh)}"/>` +
      `<path fill="${UI.slotLo}" d="${R(L, gy, bw, g)}${R(L, gy, g, bh)}"/></g>`,
  );
  const k = 8;
  const pl = sprite("player/stand");
  const px = L + Math.round((bw - pl.w * k) / 2);
  const py = gy + bh - pl.h * k - 4 * g;
  parts.push(drawSprite("player/stand", { x: px, y: py, scale: k }));
  parts.push(nametag({ x: L + bw / 2, y: py - 14 * g, text: INVENTORY.name, g, align: "center" }));
  parts.push(xpBar({ x: L, y: gy + gridH - 7 * g, w: bw, value: 0.62, g, level: INVENTORY.level, fillCls: "xp-grow" }));

  // the items, two columns, each a slot with its name and kind beside it
  const ix = L + bw + 10 * g;
  const colW = (W - M - P - 3 * g - ix) / 2;
  INVENTORY.items.forEach((it, i) => {
    const x = Math.round(ix + (i % 2) * colW);
    const y = gy + Math.floor(i / 2) * ROW;
    parts.push(slot({ x, y, g, size: SLOT }));
    const s = sprite(item(it.item));
    const kk = Math.floor((SLOT - 2 * g) / s.w);
    const art = drawSprite(item(it.item), { x: x + (SLOT - s.w * kk) / 2, y: y + (SLOT - s.h * kk) / 2, scale: kk });
    parts.push(`<g class="pop"${delay(0.2 + i * 0.12)}>${art}</g>`);
    const lx = x + SLOT + 4 * g;
    parts.push(pxText(it.name, { x: lx, y: y - g, size: SIZE, color: INK.paper }));
    parts.push(pxText(it.kind, { x: lx, y: y + 9 * g, size: SIZE, color: MC.gray }));
  });

  const title = `inventory: ${INVENTORY.items.map((i) => i.name).join(", ")}. level ${INVENTORY.level}.`;
  const svg = svgDoc({ w: W, h: H, body: parts.join("\n"), motion: [POP, MOTION.xp].join("\n"), corners: g, title });
  return { file: "inventory", svg, w: W, h: H };
}
