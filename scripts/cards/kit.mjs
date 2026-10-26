// bits more than one card uses, on top of the kit in scripts/lib

import { measure, piece } from "../lib/frames.mjs";
import { INK, UI, shadowOf } from "../lib/palette.mjs";
import { cutCorners, esc, uid } from "../lib/svg.mjs";
import { ART } from "./art.mjs";

// an item by name: one of ours (art.mjs), or one of the site's (lib/sprites.mjs)
export const item = (name) => ART[name] ?? name;

const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;

// the tooltip's frame alone, any size (frames.mjs tooltip() sizes itself to its text):
// the near-black purple, corners cut, a purple ring shading top to bottom
export function tipFrame({ x = 0, y = 0, w, h, g = 2, edge = 0.45 }) {
  const u = g;
  const id = uid("tf");
  const svg =
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${UI.tipEdgeTop}"/><stop offset="1" stop-color="${UI.tipEdgeBottom}"/></linearGradient></defs>` +
    `<g shape-rendering="crispEdges">` +
    `<path fill="${UI.tipBg}" fill-opacity=".94" d="${cutCorners(x, y, w, h, u)}"/>` +
    `<path fill="url(#${id})" fill-opacity="${edge}" d="${R(x + w - 2 * u, y + u, u, h - 2 * u)}${R(x + u, y + u, u, h - 2 * u)}"/>` +
    `<path fill="${UI.tipEdgeBottom}" fill-opacity="${edge}" d="${R(x + u, y + h - 2 * u, w - 2 * u, u)}"/>` +
    `<path fill="${UI.tipEdgeTop}" fill-opacity="${edge}" d="${R(x + u, y + u, w - 2 * u, u)}"/>` +
    `</g>`;
  return piece(svg, w, h);
}

// mono words onto lines of at most n characters (every mono glyph is one cell)
export function wrapChars(text, n) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && next.length > n) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// one line of mono in several colours: runs = [[text, colour], ...]. y is the top of a
// line box lh x size tall, the baseline where monoText puts it
export function monoRuns(runs, { x = 0, y = 0, size = 14, lh = 1.5, weight = 400, cls = "" } = {}) {
  const base = y + ((lh - 1.32) / 2 + 1.02) * size;
  const fw = weight !== 400 ? ` font-weight="${weight}"` : "";
  const spans = runs.map(([t, c]) => `<tspan fill="${c}">${esc(t)}</tspan>`).join("");
  const n = runs.reduce((s, [t]) => s + [...t].length, 0);
  return piece(`<text class="mono${cls ? ` ${cls}` : ""}" x="${x}" y="${+base.toFixed(2)}" font-size="${size}"${fw}>${spans}</text>`, n * 0.6 * size, lh * size);
}

// one line of the pixel face in several colours, each run with its own hard drop, set as
// one <text> so the font's own spaces sit between the runs (a "j" hooks left into a gap
// measured by hand)
export function pxRuns(runs, { x = 0, y = 0, size = 16 } = {}) {
  const u = size / 8;
  const t = (dx, dy, shade) =>
    `<text class="px" x="${x + dx}" y="${y + size + dy}" font-size="${size}">` +
    runs.map(([s, c]) => `<tspan fill="${shade ? shadowOf(c) : c}">${esc(s)}</tspan>`).join("") +
    `</text>`;
  const text = runs.map(([s]) => s).join("");
  return piece(t(u, u, true) + t(0, 0, false), measure(text, size), size * 1.25);
}

// a "key: value" fact wrapped to n characters a line, the key in the lore grey on the
// first line, the rest in the body colour
export function factLines({ label, value }, n) {
  const lines = wrapChars(`${label}: ${value}`, n);
  return lines.map((l, i) => (i === 0 ? [[`${label}:`, "#aaaaaa"], [l.slice(label.length + 1), INK.text]] : [[l, INK.text]]));
}

// things that pop into place once (an item dropping into its slot): the class "pop", and
// its turn as a delay. the delay is an inline style, so it only matters while the
// motion rule (svgDoc's motion, reduced-motion guarded) gives it an animation
export const POP = `.pop{transform-box:fill-box;transform-origin:center;animation:pop .45s cubic-bezier(.3,1.6,.5,1) both}
@keyframes pop{from{opacity:0;transform:scale(.3)}}`;
export const delay = (s) => ` style="animation-delay:${s.toFixed(2)}s"`;
