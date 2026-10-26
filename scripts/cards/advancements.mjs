// advancements: the toasts the game slides in when you earn one, a stack per column. two
// svgs 410 wide (school and olympiads, then the work), so on a wide readme they stand
// side by side and on a phone they stack, one toast a line, never squeezed below 13px.
// each toast is the kit's: grey edge, black inside it, the panel's fill, corners cut, an
// icon, the event in yellow over what happened in white. the last one isn't earned yet.
// motion: they slide in from the right one after another, the columns taking turns.

import { measure, pxText } from "../lib/frames.mjs";
import { INK, MC, UI } from "../lib/palette.mjs";
import { drawSprite, sprite } from "../lib/sprites.mjs";
import { cutCorners, svgDoc } from "../lib/svg.mjs";
import { ADVANCEMENTS } from "./copy.mjs";
import { delay, item } from "./kit.mjs";

const g = 2;
const t = g;
const W = 410;
const M = 3 * t; // black either side: two columns side by side get a 6t gutter
const TH = 32 * t; // a toast's height
const GAP = 4 * t;
const SIZE = 8 * g;

const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;

function toastAt({ x, y, w, icon, title, text, locked }) {
  const textX = x + 28 * t;
  const room = x + w - 8 * t - textX;
  for (const s of [title, text]) {
    if (measure(s, SIZE) > room) console.warn(`  ! advancements: "${s}" runs ${measure(s, SIZE) - room}px past its toast`);
  }
  let svg =
    `<g shape-rendering="crispEdges">` +
    `<path fill="${UI.toastEdge}" d="${cutCorners(x, y, w, TH, t)}"/>` +
    `<path fill="#000" d="${R(x + t, y + t, w - 2 * t, TH - 2 * t)}"/>` +
    `<path fill="${UI.panel}" d="${R(x + 2 * t, y + 2 * t, w - 4 * t, TH - 4 * t)}"/>` +
    `</g>`;
  const s = sprite(item(icon));
  const k = Math.floor((16 * t) / Math.max(s.w, s.h));
  svg += drawSprite(item(icon), { x: x + 7 * t + (16 * t - s.w * k) / 2, y: y + 8 * t + (16 * t - s.h * k) / 2, scale: k, opacity: locked ? 0.55 : undefined }).svg;
  svg += pxText(title, { x: textX, y: y + 6 * t, size: SIZE, color: locked ? MC.gray : MC.yellow }).svg;
  svg += pxText(text, { x: textX, y: y + 16 * t, size: SIZE, color: locked ? INK.dim : INK.paper }).svg;
  return svg;
}

export function advancements() {
  const half = Math.ceil(ADVANCEMENTS.length / 2);
  const cols = [ADVANCEMENTS.slice(0, half), ADVANCEMENTS.slice(half)];
  const H = half * TH + (half - 1) * GAP + 2 * M;
  return cols.map((list, c) => {
    const body = list
      .map((a, i) => `<g class="toast"${delay(0.3 + i * 0.5 + c * 0.25)}>${toastAt({ x: M, y: M + i * (TH + GAP), w: W - 2 * M, ...a })}</g>`)
      .join("\n");
    const motion = `.toast{transform-box:fill-box;animation:toast .6s cubic-bezier(.2,.8,.2,1) both}
@keyframes toast{from{transform:translateX(105%)}}`;
    const title = `advancements: ${list.map((a) => `${a.title}, ${a.text}`).join("; ")}`;
    // square corners: the columns meet edge to edge, and cut ones would notch the seam
    return { file: `advancements-${c + 1}`, svg: svgDoc({ w: W, h: H, body, motion, title }), w: W, h: H };
  });
}
