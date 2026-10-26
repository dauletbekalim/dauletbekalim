// inventory: the stack, as the game's inventory screen. on the left the player preview
// (an inset box, alim's sprite under his nametag) and the xp bar with his level (his
// age, like the site's "level 18"); on the right every tool an item in its slot with its
// name beside it, white over its kind in the lore grey (the site's before section sets
// items the same way). two cuts: the wide one (820 at g 3, two columns of items, 24px
// words) and a phone one (410 at g 2, one column, 16px) for the readme's <picture>, so
// a phone column of ~300px still gets ~12px words.
// motion: the items drop into their slots one by one, the xp bar fills.

import { MOTION, measure, nametag, panel, pxText, slot, xpBar } from "../lib/frames.mjs";
import { INK, MC, UI } from "../lib/palette.mjs";
import { drawSprite, sprite } from "../lib/sprites.mjs";
import { svgDoc } from "../lib/svg.mjs";
import { INVENTORY } from "./copy.mjs";
import { delay, item, POP } from "./kit.mjs";

const CUTS = {
  // box: the preview's width in g. tall: its height in g (the wide one runs it down to
  // the xp bar; the phone's column of items is long, so its box fits him and stops)
  wide: { file: "inventory", W: 820, g: 3, cols: 2, box: 48, k: 8 },
  phone: { file: "inventory-phone", W: 410, g: 2, cols: 1, box: 46, tall: 75, k: 6 },
};

const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;

function draw({ file, W, g, cols, box, tall, k }) {
  const M = (cols > 1 ? 4 : 2) * g;
  const P = 6 * g;
  const SLOT = 18 * g;
  const ROW = SLOT + 5 * g; // a slot and the gap under it
  const SIZE = 8 * g; // 24 wide, 16 on the phone: whole units of the pixel face
  const lineH = SIZE * 1.25;

  const rows = Math.ceil(INVENTORY.items.length / cols);
  const L = M + P + 3 * g;
  const top = M + P;
  const gy = top + lineH + 4 * g;
  const gridH = rows * ROW - 5 * g;
  const H = gy + gridH + P + M + 2 * g;

  const parts = [panel({ x: M, y: M, w: W - 2 * M, h: H - 2 * M, g })];
  parts.push(pxText(INVENTORY.label, { x: L, y: top, size: SIZE, color: INK.dim, shadow: false }));

  // the player preview: an inset box, black inside like the game's, alim standing in it
  // with his nametag over him; the xp bar and his level under it
  const bw = box * g;
  const bh = tall ? tall * g : gridH - 18 * g;
  parts.push(
    `<g shape-rendering="crispEdges"><path fill="#000" d="${R(L, gy, bw, bh)}"/>` +
      `<path fill="${UI.slotHi}" d="${R(L, gy + bh - g, bw, g)}${R(L + bw - g, gy, g, bh)}"/>` +
      `<path fill="${UI.slotLo}" d="${R(L, gy, bw, g)}${R(L, gy, g, bh)}"/></g>`,
  );
  const pl = sprite("player/stand");
  const px = L + Math.round((bw - pl.w * k) / 2);
  const py = gy + bh - pl.h * k - 4 * g;
  parts.push(drawSprite("player/stand", { x: px, y: py, scale: k }));
  parts.push(nametag({ x: L + bw / 2, y: py - 14 * g, text: INVENTORY.name, g, align: "center" }));
  const xy = tall ? gy + bh + 12 * g : gy + gridH - 7 * g;
  parts.push(xpBar({ x: L, y: xy, w: bw, value: 0.62, g, level: INVENTORY.level, fillCls: "xp-grow" }));

  // the items, each a slot with its name and kind beside it
  const ix = L + bw + 10 * g;
  const colW = (W - M - P - 3 * g - ix) / cols;
  INVENTORY.items.forEach((it, i) => {
    const x = Math.round(ix + (i % cols) * colW);
    const y = gy + Math.floor(i / cols) * ROW;
    parts.push(slot({ x, y, g, size: SLOT }));
    const s = sprite(item(it.item));
    const kk = Math.floor((SLOT - 2 * g) / s.w);
    const art = drawSprite(item(it.item), { x: x + (SLOT - s.w * kk) / 2, y: y + (SLOT - s.h * kk) / 2, scale: kk });
    parts.push(`<g class="pop"${delay(0.2 + i * 0.12)}>${art}</g>`);
    const lx = x + SLOT + 4 * g;
    for (const t of [it.name, it.kind]) {
      if (lx + measure(t, SIZE) > x + colW + (i % cols === cols - 1 ? 3 * g : 0)) console.warn(`  ! ${file}: "${t}" runs past its column`);
    }
    parts.push(pxText(it.name, { x: lx, y: y - g, size: SIZE, color: INK.paper }));
    parts.push(pxText(it.kind, { x: lx, y: y + 9 * g, size: SIZE, color: MC.gray }));
  });

  const title = `inventory: ${INVENTORY.items.map((i) => i.name).join(", ")}. level ${INVENTORY.level}.`;
  const svg = svgDoc({ w: W, h: H, body: parts.join("\n"), motion: [POP, MOTION.xp].join("\n"), corners: g, title });
  return { file, svg, w: W, h: H };
}

export const inventory = () => Object.values(CUTS).map(draw);
