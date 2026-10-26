// the three faces from alim.wtf, embedded in an svg as data uris (an svg shown through
// an <img> can't load anything, so the font has to live inside it). each face is cut to
// the characters the svg actually sets, by scripts/lib/subset.py (python + fontTools),
// which keeps a whole svg's fonts at a few kb. no python with fontTools around (a bare
// ci box): the whole font goes in instead, with a warning. pixel is 2.3kb either way;
// the mono is 40kb whole, so ci should `pip install fonttools brotli`.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
export const FONT_DIR = join(HERE, "..", "..", "assets", "fonts");

// pixel: our pixel face, the game layer (8 units to the em, crisp at 16/24/32/40px, 400
// only). mono: jetbrains mono, the reading face (variable, 100 to 800). glyphs: the box,
// block, shade and arrow glyphs the mono lacks, cut to its 0.6em cell
export const FONTS = {
  pixel: { file: "pixel.woff2", family: "pixel" },
  mono: { file: "jetbrains-mono.woff2", family: "mono", variable: "100 800" },
  glyphs: { file: "ascii-glyphs.woff2", family: "glyphs" },
};

// the stacks a <text> uses. the mono falls through to the glyphs for ─│█▓░ and arrows
export const STACK = {
  pixel: "pixel, mono, monospace",
  mono: "mono, glyphs, monospace",
  glyphs: "glyphs, mono, monospace",
};

// the python that has fontTools and brotli, found once. null: none does
let python;
function findPython() {
  if (python !== undefined) return python;
  python = null;
  if (process.env.NO_SUBSET) return python;
  const tries = process.platform === "win32" ? ["python", "py", "python3"] : ["python3", "python"];
  for (const cmd of tries) {
    const r = spawnSync(cmd, ["-c", "import fontTools, brotli"], { stdio: "ignore" });
    if (r.status === 0) return (python = cmd);
  }
  console.warn("fonts: no python with fonttools + brotli, embedding whole fonts (pip install fonttools brotli)");
  return python;
}

const memo = new Map(); // "font|weight|chars" -> base64 woff2, or null for none

const uniq = (text) => [...new Set([...text, " "])].sort().join("");

// faces: [{ font: "pixel" | "mono" | "glyphs", text, weight = 400 }]. returns the
// @font-face rules for them, one per face that draws any of its text
export function fontCss(faces) {
  const reqs = faces.map(({ font, text = "", weight = 400 }) => {
    const def = FONTS[font];
    if (!def) throw new Error(`fonts: no face "${font}" (pixel, mono, glyphs)`);
    const w = def.variable ? weight : 400;
    return { font, def, weight: w, chars: uniq(text), key: `${font}|${w}|${uniq(text)}` };
  });
  const todo = reqs.filter((r) => !memo.has(r.key));
  if (todo.length && findPython()) {
    const out = spawnSync(python, [join(HERE, "subset.py")], {
      input: JSON.stringify(todo.map((r) => ({ font: join(FONT_DIR, r.def.file), text: r.chars, weight: r.weight }))),
      maxBuffer: 64 << 20,
    });
    if (out.status !== 0) throw new Error(`fonts: subset.py failed\n${out.stderr}`);
    JSON.parse(out.stdout.toString()).forEach((b64, i) => memo.set(todo[i].key, b64));
  }
  const seen = new Set();
  const rules = [];
  for (const r of reqs) {
    let b64 = memo.get(r.key);
    let weight = r.weight;
    if (b64 === undefined) {
      // no subsetting: the whole file, once per face, every weight the file has
      if (seen.has(r.font)) continue;
      seen.add(r.font);
      b64 = readFileSync(join(FONT_DIR, r.def.file)).toString("base64");
      weight = r.def.variable ?? 400;
    }
    if (b64 === null) continue;
    rules.push(
      `@font-face{font-family:${r.def.family};src:url(data:font/woff2;base64,${b64}) format("woff2");font-weight:${weight};font-display:block}`,
    );
  }
  return rules.join("\n");
}
