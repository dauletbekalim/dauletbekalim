// the svg document every image in the readme is: a black panel of its own (so it reads
// the same on github's light and dark themes), its fonts cut to the text it sets and
// embedded, and its animations only for people who haven't asked for less motion.
// github shows it through camo in an <img>: no scripts, no external anything, no
// foreignObject. css @keyframes do run.

import { mkdirSync, writeFileSync } from "node:fs";
import { basename, dirname } from "node:path";
import { fontCss } from "./fonts.mjs";

// text and attribute values, safe for xml
export const esc = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const unesc = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(+d))
    .replace(/&(lt|gt|quot|apos|amp);/g, (_, n) => ({ lt: "<", gt: ">", quot: '"', apos: "'", amp: "&" })[n]);

// the smallest font size (in viewBox px) that still reads at ~10px when github squeezes
// an svg this wide into a 340px phone column
export const minText = (w) => Math.ceil((10 * w) / 340);

// a unique id for a gradient or a clip path inside one document
let ids = 0;
export const uid = (p = "i") => `${p}${(ids++).toString(36)}`;

// which face (and weight) each <text> is set in, by its class (px, mono or glyphs, the
// text helpers set it) and its font-weight attribute, with the characters it sets
export function textFaces(body) {
  const faces = new Map();
  const add = (font, weight, text) => {
    const k = `${font}|${weight}`;
    faces.set(k, { font, weight, text: (faces.get(k)?.text ?? "") + text });
  };
  for (const m of body.matchAll(/<text\b([^>]*)>([\s\S]*?)<\/text>/g)) {
    const at = m[1];
    const text = unesc(m[2].replace(/<[^>]+>/g, ""));
    const cls = /\bclass="([^"]*)"/.exec(at)?.[1].split(/\s+/) ?? [];
    const weight = +(/\bfont-weight="(\d+)"/.exec(at)?.[1] ?? 400);
    if (cls.includes("px")) add("pixel", 400, text);
    else if (cls.includes("glyphs")) add("glyphs", 400, text);
    else {
      // mono, and anything unmarked: the mono, with the glyphs face behind it
      add("mono", weight, text);
      add("glyphs", 400, text);
    }
  }
  return [...faces.values()];
}

const BASE_CSS = `text{white-space:pre;font-kerning:none;font-variant-ligatures:none;font-synthesis:none}
.px{font-family:pixel,mono,monospace;font-weight:400}
.mono{font-family:mono,glyphs,monospace}
.glyphs{font-family:glyphs,mono,monospace}`;

// one-step pixel corners: a w x h box with a c x c square cut from each corner
export const cutCorners = (x, y, w, h, c) =>
  c
    ? `M${x + c} ${y}h${w - 2 * c}v${c}h${c}v${h - 2 * c}h${-c}v${c}h${-(w - 2 * c)}v${-c}h${-c}v${-(h - 2 * c)}h${c}z`
    : `M${x} ${y}h${w}v${h}h${-w}z`;

// the whole document. w, h: the viewBox (and the intrinsic size, so an <img width="w">
// shows it 1:1 on desktop and max-width shrinks it on a phone). body: the drawing.
// css: static rules. motion: animation rules, wrapped in prefers-reduced-motion:
// no-preference. bg: the panel colour (null for none). corners: cut the panel's corners
// by this many px (a gui pixel looks right). title: the accessible name. faces: extra
// [{ font, text, weight }] on top of what the <text> elements set
export function svgDoc({ w, h, body, css = "", motion = "", bg = "#000", corners = 0, title = "", faces = [] }) {
  const fonts = fontCss([...textFaces(body), ...faces]);
  const style = [fonts, BASE_CSS, css, motion && `@media (prefers-reduced-motion:no-preference){\n${motion}\n}`]
    .filter(Boolean)
    .join("\n");
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img"${title ? ` aria-label="${esc(title)}"` : ""}>`,
    title && `<title>${esc(title)}</title>`,
    `<style>\n${style}\n</style>`,
    bg && `<path d="${cutCorners(0, 0, w, h, corners)}" fill="${bg}"/>`,
    body,
    `</svg>`,
  ]
    .filter(Boolean)
    .join("\n");
}

// writes an svg, says how big it came out, and warns past github's comfortable size
export function writeSvg(file, svg, { limitKb = 150 } = {}) {
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, svg);
  const kb = Buffer.byteLength(svg) / 1024;
  console.log(`${basename(file).padEnd(28)} ${kb.toFixed(1).padStart(6)} kb`);
  if (kb > limitKb) console.warn(`  ! ${basename(file)} is over ${limitKb} kb`);
  return kb;
}
