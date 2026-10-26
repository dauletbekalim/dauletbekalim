// the game ui kit from alim.wtf (app/globals.css, "the game ui kit"), drawn as svg: text
// in the pixel face, the raised panel, the inset slot, the item tooltip, the
// advancement toast, the nametag, the xp bar, the bevelled button, the splash. drawn by
// us in the game's colours; none of it is a picture of the game.
//
// g is one gui pixel in svg px (the site's --mc-u is 2): bevels, frames and corners are
// g wide, and text defaults to 8g, the size where the pixel face's 8 units land on
// whole pixels (16 at g 2, 24 at g 3, 32 at g 4). every piece takes x, y (its top left)
// and returns { svg, w, h }; ${piece} in a template is its svg.

import { PIXEL_ADVANCE } from "./pixel-metrics.mjs";
import { INK, MC, UI, shadowOf } from "./palette.mjs";
import { cutCorners, esc, uid } from "./svg.mjs";
import { drawSprite, sprite } from "./sprites.mjs";

export const piece = (svg, w, h) => ({ svg, w, h, toString: () => svg });

const R = (x, y, w, h) => `M${x} ${y}h${w}v${h}h${-w}z`;
const crisp = (inner) => `<g shape-rendering="crispEdges">${inner}</g>`;

// text: the pixel face ------------------------------------------------------------------
// 8 units to the em, a line box of 10 (ascent 8, descent 2, so line-height 1.25). from the
// top of the line box: capitals start 1 unit down, the baseline is 8 down (one em),
// descenders end at 10. a glyph's advance is its drawing plus one unit after it

const warned = new Set();
export function advance(ch) {
  const a = PIXEL_ADVANCE[ch];
  if (a !== undefined) return a;
  if (!warned.has(ch)) {
    warned.add(ch);
    console.warn(`frames: the pixel face has no "${ch}" (U+${ch.codePointAt(0).toString(16)}), it falls back to the mono`);
  }
  return 6;
}

// the face's j hooks three units left of where it starts, kerned under the letter before.
// after a space that hook reads as a comma ("with,jobee") and at the start of a line it
// pokes past the edge, so pxText gives it room: two units after a space, three at the
// start. jRoom is that room in units, which measure counts
const J_SPACE = 2;
const J_LEAD = 3;
const jRoom = (text) => (text.startsWith("j") ? J_LEAD : 0) + (text.match(/ j/g)?.length ?? 0) * J_SPACE;

// the text as <text> content: escaped, every " j" nudged right by its room (a dx on the
// j carries the rest of the line along with it). the leading room is the caller's x
export const jNudge = (size = 16) => (J_SPACE * size) / 8;
export const pxMarkup = (text, size = 16) => esc(text).replace(/ j/g, ` <tspan dx="${jNudge(size)}">j</tspan>`);
export const pxLead = (text, size = 16) => (String(text).startsWith("j") ? (J_LEAD * size) / 8 : 0);

// the line's advance in px, trailing unit included (what css max-content gives), and
// the j's room
export const measure = (text, size = 16) =>
  (([...String(text)].reduce((s, c) => s + advance(c), 0) + jRoom(String(text))) * size) / 8;

// the ink: the advance less the trailing unit, what to centre on
export const inkWidth = (text, size = 16) => (String(text).length ? measure(text, size) - size / 8 : 0);

// words onto lines no wider than maxW px (a word longer than that gets a line to itself)
export function wrap(text, maxW, size = 16) {
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && inkWidth(next, size) > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// one line in the pixel face. y is the top of the line box. align left (x is the left
// edge), center (x is the middle of the ink) or right (x is the ink's right edge).
// shadow: the hard one-unit drop in the text's own colour at a quarter (true), a colour,
// or false (dark text on a light ground). outline: a one-unit black ring instead of the
// drop (the xp level). cls lands on every <text> (for animation)
export function pxText(text, { x = 0, y = 0, size = 16, color = INK.paper, shadow = true, outline = false, align = "left", cls = "" } = {}) {
  const u = size / 8;
  const w = inkWidth(text, size);
  const x0 = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
  const base = y + size;
  const c = cls ? `px ${cls}` : "px";
  const lead = pxLead(text, size);
  const t = (dx, dy, fill) =>
    `<text class="${c}" x="${x0 + lead + dx}" y="${base + dy}" font-size="${size}" fill="${fill}">${pxMarkup(text, size)}</text>`;
  let svg = "";
  if (outline) for (const [dx, dy] of [[u, 0], [-u, 0], [0, u], [0, -u]]) svg += t(dx, dy, outline === true ? "#000" : outline);
  else if (shadow) svg += t(u, u, shadow === true ? shadowOf(color) : shadow);
  svg += t(0, 0, color);
  return piece(svg, w + (shadow && !outline ? u : 0), size * 1.25);
}

// several lines, each a string or { text, color }. lh: line height in px (1.25 x size)
export function pxLines(lines, { x = 0, y = 0, size = 16, lh = size * 1.25, ...rest } = {}) {
  let svg = "";
  let w = 0;
  lines.forEach((l, i) => {
    const { text, ...own } = typeof l === "string" ? { text: l } : l;
    const p = pxText(text, { x, y: y + i * lh, size, ...rest, ...own });
    svg += p.svg;
    w = Math.max(w, p.w);
  });
  return piece(svg, w, lines.length * lh);
}

// text: the mono (jetbrains mono, every glyph 0.6em wide) ----------------------------------
export const monoWidth = (text, size = 14) => [...String(text)].length * 0.6 * size;

// one line of mono. y is the top of a line box lh x size tall, the baseline where css would
// put it. weight 400 to 800 (each weight is embedded on its own)
export function monoText(text, { x = 0, y = 0, size = 14, color = INK.text, weight = 400, lh = 1.5, align = "left", cls = "" } = {}) {
  const w = monoWidth(text, size);
  const x0 = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
  const base = y + ((lh - 1.32) / 2 + 1.02) * size;
  const fw = weight !== 400 ? ` font-weight="${weight}"` : "";
  const svg = `<text class="mono${cls ? ` ${cls}` : ""}" x="${+x0.toFixed(2)}" y="${+base.toFixed(2)}" font-size="${size}"${fw} fill="${color}">${esc(text)}</text>`;
  return piece(svg, w, lh * size);
}

// frames --------------------------------------------------------------------------------

// a raised panel: the fill, a lit edge top and left, a shaded one bottom and right, g
// wide. frame: a colour for a g-wide outline inside w x h (the game's black one).
// corners: cut the outer corners by g
export function panel({ x = 0, y = 0, w, h, g = 2, fill = UI.panel, hi = UI.panelHi, lo = UI.panelLo, frame = null, corners = false } = {}) {
  let svg = "";
  let [ix, iy, iw, ih] = [x, y, w, h];
  if (frame) {
    svg += `<path fill="${frame}" d="${cutCorners(x, y, w, h, corners ? g : 0)}"/>`;
    [ix, iy, iw, ih] = [x + g, y + g, w - 2 * g, h - 2 * g];
  }
  const body = frame || !corners ? R(ix, iy, iw, ih) : cutCorners(ix, iy, iw, ih, g);
  svg += `<path fill="${fill}" d="${body}"/>`;
  svg += `<path fill="${lo}" d="${R(ix, iy + ih - g, iw, g)}${R(ix + iw - g, iy, g, ih)}"/>`;
  svg += `<path fill="${hi}" d="${R(ix, iy, iw, g)}${R(ix, iy, g, ih)}"/>`;
  return piece(crisp(svg), w, h);
}

// an inset slot, size px square (20g, the site's 40). item: a sprite name, drawn at the
// largest whole scale that fits inside the bevel, centred. selected: the hotbar's frame
// (black then white, 2g outside the slot). count: the stack count, bottom right
export function slot({ x = 0, y = 0, g = 2, size = 20 * g, item, scale, selected = false, count, fill = UI.slot } = {}) {
  let svg = "";
  if (selected) svg += `<path fill="${INK.paper}" d="${R(x - 2 * g, y - 2 * g, size + 4 * g, size + 4 * g)}"/><path fill="#000" d="${R(x - g, y - g, size + 2 * g, size + 2 * g)}"/>`;
  svg += `<path fill="${fill}" d="${R(x, y, size, size)}"/>`;
  svg += `<path fill="${UI.slotHi}" d="${R(x, y + size - g, size, g)}${R(x + size - g, y, g, size)}"/>`;
  svg += `<path fill="${UI.slotLo}" d="${R(x, y, size, g)}${R(x, y, g, size)}"/>`;
  svg = crisp(svg);
  if (item) {
    const s = sprite(item);
    const k = scale ?? Math.max(1, Math.floor((size - 4 * g) / Math.max(s.w, s.h)));
    svg += drawSprite(item, { x: x + Math.round((size - s.w * k) / 2), y: y + Math.round((size - s.h * k) / 2), scale: k }).svg;
  }
  if (count != null) {
    const fs = 8 * g;
    svg += pxText(String(count), { x: x + size - g, y: y + size - fs * 1.25, size: fs, align: "right" }).svg;
  }
  return piece(svg, size, size);
}

// a row of slots with no gap between them, each keeping its own bevel (the hotbar).
// items: sprite names (or null for an empty slot). selected: the index to frame
export function hotbar({ x = 0, y = 0, g = 2, size = 20 * g, items = [], selected = -1 } = {}) {
  const slots = items.map((item, i) => slot({ x: x + i * size, y, g, size, item, selected: i === selected }));
  // the selected one last, so its frame sits over its neighbours
  const order = [...slots.filter((_, i) => i !== selected), ...(slots[selected] ? [slots[selected]] : [])];
  return piece(order.join(""), items.length * size, size);
}

// the item tooltip: near-black purple, a purple frame shading top to bottom, corners cut.
// title (white, or titleColor: aqua for something enchanted), then lines: a string is
// grey lore, or { text, kind: "lore" | "attr" (blue) | "dim" | "title" } or { text, color }.
// maxWidth wraps lore that runs long. size defaults to 8g
export function tooltip({ x = 0, y = 0, title, lines = [], g = 2, size = 8 * g, titleColor = INK.paper, maxWidth, edge = 0.45 } = {}) {
  const u = g;
  const lh = size * 1.25;
  const KIND = { lore: MC.gray, attr: UI.attr, dim: INK.dimmer, title: titleColor };
  const rows = [];
  for (const l of lines) {
    const { text, kind = "lore", color } = typeof l === "string" ? { text: l } : l;
    const parts = maxWidth ? wrap(text, maxWidth, size) : [text];
    for (const p of parts.length ? parts : [""]) rows.push({ text: p, color: color ?? KIND[kind] ?? MC.gray });
  }
  const textW = Math.max(measure(title, size), ...rows.map((r) => measure(r.text, size)));
  const w = 10 * u + textW;
  const h = 8 * u + lh + (rows.length ? 2 * u + rows.length * lh : 0);
  const id = uid("tip");
  let svg = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${UI.tipEdgeTop}"/><stop offset="1" stop-color="${UI.tipEdgeBottom}"/></linearGradient></defs>`;
  svg += crisp(
    `<path fill="${UI.tipBg}" fill-opacity=".94" d="${cutCorners(x, y, w, h, u)}"/>` +
      `<path fill="url(#${id})" fill-opacity="${edge}" d="${R(x + w - 2 * u, y + u, u, h - 2 * u)}"/>` +
      `<path fill="url(#${id})" fill-opacity="${edge}" d="${R(x + u, y + u, u, h - 2 * u)}"/>` +
      `<path fill="${UI.tipEdgeBottom}" fill-opacity="${edge}" d="${R(x + u, y + h - 2 * u, w - 2 * u, u)}"/>` +
      `<path fill="${UI.tipEdgeTop}" fill-opacity="${edge}" d="${R(x + u, y + u, w - 2 * u, u)}"/>`,
  );
  const tx = x + 5 * u;
  svg += pxText(title, { x: tx, y: y + 4 * u, size, color: titleColor }).svg;
  rows.forEach((r, i) => (svg += pxText(r.text, { x: tx, y: y + 6 * u + lh * (i + 1), size, color: r.color }).svg));
  return piece(svg, w, h);
}

// the advancement toast: an icon (a sprite name, centred in a 16g square) over two lines,
// the title in the game's yellow and the text in white. one unit (g) of grey edge, one of
// black inside it, the panel's fill, corners cut. 32g tall
export function toast({ x = 0, y = 0, icon, title = "advancement made!", text = "", g = 2, titleColor = MC.yellow, textColor = INK.paper } = {}) {
  const t = g;
  const size = 8 * g;
  const textW = Math.max(measure(title, size), measure(text, size));
  const w = t + 6 * t + 16 * t + 5 * t + textW + 8 * t + t;
  const h = 32 * t;
  let svg = crisp(
    `<path fill="${UI.toastEdge}" d="${cutCorners(x, y, w, h, t)}"/>` +
      `<path fill="#000" d="${R(x + t, y + t, w - 2 * t, h - 2 * t)}"/>` +
      `<path fill="${UI.panel}" d="${R(x + 2 * t, y + 2 * t, w - 4 * t, h - 4 * t)}"/>`,
  );
  if (icon) {
    const s = sprite(icon);
    const k = Math.max(1, Math.floor((16 * t) / Math.max(s.w, s.h)));
    const ix = x + 7 * t + Math.round((16 * t - s.w * k) / 2);
    const iy = y + 8 * t + Math.round((16 * t - s.h * k) / 2);
    svg += drawSprite(icon, { x: ix, y: iy, scale: k }).svg;
  }
  const tx = x + 28 * t;
  svg += pxText(title, { x: tx, y: y + 6 * t, size, color: titleColor }).svg;
  svg += pxText(text, { x: tx, y: y + 16 * t, size, color: textColor }).svg;
  return piece(svg, w, h);
}

// the plate over a player's head: translucent grey, square, the name in white. one unit
// of plate above the line box, none below, two units either side. align center: x is the
// middle
export function nametag({ x = 0, y = 0, text, g = 2, size = 8 * g, align = "left", color = INK.paper } = {}) {
  const u = size / 8;
  const w = 2 * u + measure(text, size) + u;
  const h = size * 1.25 + u;
  const x0 = Math.round(align === "center" ? x - w / 2 : align === "right" ? x - w : x);
  const svg =
    crisp(`<path fill="${UI.tag}" fill-opacity="${UI.tagOpacity}" d="${R(x0, y, w, h)}"/>`) +
    pxText(text, { x: x0 + 2 * u, y: y + u, size, color }).svg;
  return piece(svg, w, h);
}

// the xp bar: a black unit round a 5g track, dark green, filled xp green to value (0..1),
// notched into segments. level: the number over it, xp green outlined in black, sitting
// on the bar (it draws above y). fillCls lands on the fill rect (animate it with
// MOTION.xp: class "xp-grow")
export function xpBar({ x = 0, y = 0, w, value = 0, g = 2, segments = 10, level, fillCls = "" } = {}) {
  const iw = w - 2 * g;
  const fw = Math.round(Math.max(0, Math.min(1, value)) * iw);
  const seg = iw / segments;
  let notches = "";
  for (let i = 1; i <= segments; i++) notches += R(+(x + g + i * seg - g).toFixed(2), y + g, g, 5 * g);
  let svg = crisp(
    `<path fill="#000" d="${R(x, y, w, 7 * g)}"/>` +
      `<path fill="${UI.xpDark}" d="${R(x + g, y + g, iw, 5 * g)}"/>` +
      `<path${fillCls ? ` class="${fillCls}"` : ""} fill="${UI.xp}" d="${R(x + g, y + g, fw, 5 * g)}"/>` +
      `<path fill="#000" fill-opacity=".55" d="${notches}"/>`,
  );
  if (level != null) svg += pxText(String(level), { x: x + w / 2, y: y - 8 * g + g, size: 8 * g, color: UI.xp, outline: true, align: "center" }).svg;
  return piece(svg, w, 7 * g);
}

// the bevelled button: a g-wide frame (black, white when hovered), a fill with a lit
// top-left edge and a shaded bottom-right one, the label centred. variant dark (white
// label, pale yellow when hovered) or light (dark label, no drop). 20g tall by default
export function button({ x = 0, y = 0, label, g = 2, size = 8 * g, h = 20 * g, w, variant = "dark", hover = false } = {}) {
  w ??= measure(label, size) + 18 * g + 2 * g;
  const light = variant === "light";
  const fill = light ? (hover ? UI.btnLightHover : UI.btnLight) : hover ? UI.btnHover : UI.btn;
  const hi = light ? UI.btnLightHi : UI.btnHi;
  const lo = light ? UI.btnLightLo : UI.btnLo;
  let svg = crisp(
    `<path fill="${hover ? INK.paper : UI.frame}" d="${R(x, y, w, h)}"/>` +
      `<path fill="${fill}" d="${R(x + g, y + g, w - 2 * g, h - 2 * g)}"/>` +
      `<path fill="${lo}" d="${R(x + g, y + h - 2 * g, w - 2 * g, g)}${R(x + w - 2 * g, y + g, g, h - 2 * g)}"/>` +
      `<path fill="${hi}" d="${R(x + g, y + g, w - 2 * g, g)}${R(x + g, y + g, g, h - 2 * g)}"/>`,
  );
  const color = light ? UI.btnInk : hover ? UI.hoverText : INK.paper;
  svg += pxText(label, { x: x + w / 2, y: y + Math.round((h - size * 1.25) / 2), size, color, shadow: !light, align: "center" }).svg;
  return piece(svg, w, h);
}

// the title screen's splash: yellow, tilted, pulsing (MOTION.splash, class "splash").
// x, y: the middle of the text
export function splash({ x = 0, y = 0, text, size = 24, angle = -20, color = UI.splash, shadow = UI.splashShadow, pulse = true } = {}) {
  const t = pxText(text, { x: 0, y: -size * 0.625, size, color, shadow, align: "center" });
  const svg = `<g transform="translate(${x} ${y}) rotate(${angle})"><g${pulse ? ` class="splash"` : ""}>${t.svg}</g></g>`;
  return piece(svg, t.w, t.h);
}

// animation rules for svgDoc({ motion }), which only plays them for people who haven't
// asked for reduced motion. add the class to what should move. css transforms on svg
// need transform-box: fill-box to turn round the element's own box
export const MOTION = {
  // the splash's pulse, about once a second
  splash: `.splash{transform-box:fill-box;transform-origin:center;animation:splash .5s ease-in-out infinite alternate}
@keyframes splash{to{transform:scale(1.07)}}`,
  // a terminal cursor
  blink: `.blink{animation:blink 1.06s steps(1) infinite}
@keyframes blink{50%{opacity:0}}`,
  // the xp bar filling once, from the left
  xp: `.xp-grow{transform-box:fill-box;transform-origin:left;animation:xp 1.6s cubic-bezier(.22,1,.36,1) both}
@keyframes xp{from{transform:scaleX(0)}}`,
};
