// the profile's first thing: alim.wtf's title screen (public/og.jpg there), alive. black,
// a dim field of glyphs, alim in white ascii in the middle, his nametag over his head with
// the yellow splash tilted beside it, the prompt typing itself in top left, his chat line
// bottom left and ~/alim.wtf bottom right. the readme links it to alim.wtf.
//
// what moves (only for people who haven't asked for less motion): the prompt types
// whoami and its caret blinks, the portrait decodes in row by row out of noise and stays,
// the chat line arrives once he's there, the field twinkles slowly, the nametag bobs and
// the splash pulses. with motion off it's the finished frame, same as the og card.
//
// two cuts of the same screen: the wide one for the readme column, and a taller one for
// phones (the readme's <picture> swaps it in under 600px), where the wide one would shrink
// its words to ~8px. the phone cut stacks it: the prompt and ~/alim.wtf on top, the splash
// across the corner, then the nametag, him, and his chat line, every word 12px or more.
//
// run: node scripts/header.mjs  ->  assets/header.svg, assets/header-phone.svg
// the portrait's glyphs come from scripts/data/portrait.json (python scripts/portrait.py)

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { MOTION, inkWidth, monoText, monoWidth, nametag, pxText, splash } from "./lib/frames.mjs";
import { INK, UI } from "./lib/palette.mjs";
import { ASSETS, ROOT } from "./lib/paths.mjs";
import { esc, svgDoc, writeSvg } from "./lib/svg.mjs";

// the copy, word for word from alim.wtf (content/site.ts HERO and NAV)
const PROMPT = "alim@wtf:~$ ";
const COMMAND = "whoami";
const NAME = "alim dauletbek";
const SPLASH = "delusional self-believer!";
const CHAT_NAME = "alim";
const STATEMENT = "co-founder & ceo @ agentmash.";
const HOME = "~/alim.wtf";

// the wide cut fills the readme column. the text is big on purpose: github shrinks it
// to ~340px on a phone that skips the <picture>, and 40 to 48 here still reads there.
// the phone cut is 720 wide, ~0.45 on a 324px column: 28 here is ~12.6px there
const LAYOUTS = {
  wide: {
    file: "header.svg",
    W: 1600,
    H: 640,
    EDGE: 48,
    TAG: 48, // the nametag, pixel face (one unit is 6)
    SPLASH_SIZE: 40,
    PROMPT_SIZE: 40, // mono
    WHO: 48, // <alim>, pixel
    CHAT: 44, // the message, mono
    HOME_SIZE: 40,
    BOX_H: 700, // the cutout's height on the card; he runs off the bottom like on the og
    plateY: 36,
    promptY: 40,
    // the splash, tilted beside the plate's top right and rising, as on the title screen
    splashAt: { x: 1244, y: 166, angle: -20 },
    home: "chat", // ~/alim.wtf on the chat line, bottom right
    field: 18,
  },
  phone: {
    file: "header-phone.svg",
    W: 720,
    H: 800,
    EDGE: 28,
    TAG: 40,
    SPLASH_SIZE: 28,
    PROMPT_SIZE: 28,
    WHO: 32,
    CHAT: 28,
    HOME_SIZE: 28,
    BOX_H: 600,
    // the splash crosses the top right corner under ~/alim.wtf, so the plate drops below it
    plateY: 280,
    promptY: 28,
    splashAt: { x: 484, y: 172, angle: -20 },
    home: "top", // ~/alim.wtf on the prompt's row, top right
    field: 16,
  },
};

// the neutral greys (INK) and the cover's own two: the plate and the chat strip
const DIM = INK.dim;
const DIMMER = INK.dimmer;
const STRIP = "#1c1c1c"; // rgb(28 28 28), drawn at .86 like the cover's --chat-strip

// a small seeded generator (mulberry32, as glyphField.ts), so every build is the same
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---- the portrait ------------------------------------------------------------------------

const P = JSON.parse(readFileSync(join(ROOT, "scripts", "data", "portrait.json"), "utf8"));

// the decode (alim.wtf lib/scramble.ts, as frames): each row prints as noise, resolves
// left to right over a few frames, then holds. blanks never scramble, so his outline
// holds from the first frame
const DECODE_GLYPHS = "01<>/\\{}[]#$%&*";
function hash(i, frame, seed) {
  let h = (i * 374761393 + frame * 668265263 + seed * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function decodeFrame(text, p, { frames = 14, jitter = 0.25, seed = 7, cols = text.length } = {}) {
  if (p >= 1) return text;
  const frame = Math.floor(Math.max(0, p) * frames);
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === " ") {
      out += ch;
      continue;
    }
    const at = (i / cols) * (1 - jitter) + hash(i, 0, seed + 1) * jitter;
    out += p >= at && p > 0 ? ch : DECODE_GLYPHS[Math.floor(hash(i, frame, seed) * DECODE_GLYPHS.length)];
  }
  return out;
}

const DECODE = {
  start: 0.35, // s: the prompt's had a moment
  step: 0.03, // between one row and the next
  frames: 4, // noise frames per row before it holds
  frame: 0.075, // s each
};
const pt = (s) => `${+s.toFixed(3)}s`;

function drawHeader(L) {
const { W, H, EDGE, TAG, SPLASH_SIZE, PROMPT_SIZE, WHO, CHAT, HOME_SIZE, BOX_H } = L;
const [SW, SH] = P.size;
const k = BOX_H / SH;
const CELL = P.cell[0] * k; // one glyph's advance on the card
const LINE = P.cell[1] * k; // one row
const FS = CELL / 0.6; // the mono's advance is 0.6em
const firstRow = P.rows.findIndex((r) => r.trim());
// the crown: the top of the first row with ink, in source px
const crownSrc = P.origin[1] + firstRow * P.cell[1] - P.cell[1] / 2;

// the nametag sits up top on the centre line, his crown a little under the plate
const plateY = L.plateY;
const plate = nametag({ x: W / 2, y: plateY, text: NAME, size: TAG, align: "center" });
const crownY = plateY + plate.h + 18;
const left = W / 2 - P.head * SW * k;
const top = crownY - crownSrc * k;
// a cell's top-left corner on the card
const cellX = (c) => left + (P.origin[0] + c * P.cell[0]) * k - CELL / 2;
const cellY = (r) => top + (P.origin[1] + r * P.cell[1]) * k - LINE / 2;

const inkRows = P.rows.map((r, i) => ({ r, i })).filter(({ r }) => r.trim());
let portrait = "";
let decodeEnd = 0;
inkRows.forEach(({ r, i }, n) => {
  const lead = r.length - r.trimStart().length;
  const x = +cellX(lead).toFixed(2);
  const y = +(cellY(i) + 0.86 * FS).toFixed(2); // the baseline at line-height 1
  const t0 = DECODE.start + n * DECODE.step;
  const done = t0 + DECODE.frames * DECODE.frame;
  decodeEnd = Math.max(decodeEnd, done);
  const row = (s, cls, style) =>
    `<text class="mono ${cls}" font-weight="${P.weight}" x="${x}" y="${y}" style="${style}">${esc(s.slice(lead).trimEnd())}</text>`;
  for (let f = 0; f < DECODE.frames; f++) {
    const s = decodeFrame(r, f / DECODE.frames, { seed: 7 + i * 31, cols: r.length });
    portrait += row(s, "df", `animation-delay:${pt(t0 + f * DECODE.frame)}`);
  }
  portrait += row(r, "pr", `animation-duration:${pt(done)}`);
});

// where he stands, grown a couple of cells, so the field keeps off him
const GROW = 2;
const body = P.body.map((row) => [...row].map((c) => c === "#"));
const onBody = (x, y) => {
  const c = Math.round(((x + CELL / 2 - left) / k - P.origin[0]) / P.cell[0]);
  const r = Math.round(((y + LINE / 2 - top) / k - P.origin[1]) / P.cell[1]);
  for (let dr = -GROW; dr <= GROW; dr++)
    for (let dc = -GROW; dc <= GROW; dc++) if (body[r + dr]?.[c + dc]) return true;
  // below the cutout's last row he keeps going (the shirt runs off the card)
  if (r >= body.length) return body[body.length - 1][Math.max(0, Math.min(body[0].length - 1, c))];
  return false;
};

// ---- the gui -----------------------------------------------------------------------------

// the splash, tilted beside the plate's top right and rising, as on the title screen
const SPLASH_AT = L.splashAt;
const sp = splash({ ...SPLASH_AT, text: SPLASH, size: SPLASH_SIZE });

// the prompt, top left: the prompt is there, whoami types itself in, one key at a time
const promptY = L.promptY;
const promptLine = monoText(PROMPT, { x: EDGE, y: promptY, size: PROMPT_SIZE, color: DIM });
const ADV = 0.6 * PROMPT_SIZE;
const TYPE = { start: 0.7, key: 0.11 };
let typed = "";
[...COMMAND].forEach((ch, i) => {
  const t = monoText(ch, { x: EDGE + monoWidth(PROMPT, PROMPT_SIZE) + i * ADV, y: promptY, size: PROMPT_SIZE, color: DIM });
  // hidden until its key: the animation holds it at 0, then it lets go
  typed += t.svg.replace('class="mono"', `class="mono key" style="animation-duration:${pt(TYPE.start + (i + 1) * TYPE.key)}"`);
});
const lineEnd = EDGE + monoWidth(PROMPT + COMMAND, PROMPT_SIZE);
const caret = {
  x: +(lineEnd + 0.3 * PROMPT_SIZE).toFixed(2),
  y: +(promptY + (1.5 * PROMPT_SIZE - 1.1 * PROMPT_SIZE) / 2 + 0.06 * PROMPT_SIZE).toFixed(2),
  w: ADV,
  h: 1.1 * PROMPT_SIZE,
};
const typingEnd = TYPE.start + COMMAND.length * TYPE.key;
// the caret rides along while the keys go in: it starts after the prompt, a cell per key
const caretSvg = `<g class="caret-ride"><rect class="caret" x="${caret.x}" y="${caret.y}" width="${caret.w}" height="${caret.h}" fill="${INK.paper}"/></g>`;

// his chat line, bottom left: <alim> in the pixel face, the message in the mono, on the
// game's translucent strip, over him like on the cover
const chatH = Math.round(CHAT * 1.6);
const chatY = H - EDGE - chatH;
const whoText = `<${CHAT_NAME}> `;
const whoW = inkWidth(whoText, WHO) + WHO / 8; // the trailing space's unit too
const pad = 12;
const msgX = EDGE + pad + whoW;
const strip = { x: EDGE, y: chatY, w: Math.ceil(pad + whoW + monoWidth(STATEMENT, CHAT) + pad), h: chatH };
const who = pxText(whoText, { x: EDGE + pad, y: chatY + Math.round((chatH - 1.25 * WHO) / 2), size: WHO, color: INK.paper });
const msg = monoText(STATEMENT, { x: msgX, y: chatY + (chatH - 1.5 * CHAT) / 2, size: CHAT, color: INK.paper });

// ~/alim.wtf: bottom right on the chat line's middle, or top right on the prompt's row
const homeY = L.home === "top" ? promptY : chatY + (chatH - 1.5 * HOME_SIZE) / 2;
const home = monoText(HOME, { x: W - EDGE, y: homeY, size: HOME_SIZE, color: DIMMER, align: "right" });

// ---- the field ---------------------------------------------------------------------------
// the cover's ambient field: a sparse scatter of dim glyphs on a coarse grid, white at four
// low alphas, kept off him and the words. some of them twinkle, slowly, out of step

const FIELD = { size: L.field, chars: ".:'+*01/\\<>", levels: ["#242424", "#383838", "#525252", "#7a7a7a"] };
const pitchX = 26;
const pitchY = 27;
const AIR = 16;
const boxes = [
  { x: EDGE, y: promptY, w: monoWidth(PROMPT + COMMAND, PROMPT_SIZE) + 0.9 * PROMPT_SIZE, h: 1.5 * PROMPT_SIZE },
  { x: W / 2 - plate.w / 2, y: plateY - 6, w: plate.w, h: plate.h + 6 },
  strip,
  L.home === "top" ? { x: W - EDGE - home.w, y: homeY, w: home.w, h: 1.5 * HOME_SIZE } : { x: W - EDGE - home.w, y: chatY, w: home.w, h: chatH },
];
const inBox = (x, y) => boxes.some((b) => x > b.x - AIR && x < b.x + b.w + AIR && y > b.y - AIR && y < b.y + b.h + AIR);
// the splash's own tilted box (a little bigger, for the pulse)
const inSplash = (x, y) => {
  const a = (-SPLASH_AT.angle * Math.PI) / 180;
  const dx = x - SPLASH_AT.x;
  const dy = y - SPLASH_AT.y;
  const lx = dx * Math.cos(a) - dy * Math.sin(a);
  const ly = dx * Math.sin(a) + dy * Math.cos(a);
  return Math.abs(lx) < sp.w * 0.54 + AIR && Math.abs(ly) < sp.h * 0.6 + AIR;
};

const TWINKLES = 6; // groups that twinkle, each on its own clock; group 0 holds still
const rand = rng(0x2f6b);
const cols = Math.floor((W - 24) / pitchX);
const rows = Math.floor((H - 24) / pitchY);
const want = Math.round((W * H) / 5200);
const taken = new Set();
const groups = new Map(); // "level|group" -> [{ x, y, ch }]
let placed = 0;
for (let tries = 0; tries < want * 8 && placed < want; tries++) {
  const c = Math.floor(rand() * cols);
  const r = Math.floor(rand() * rows);
  if (taken.has(r * cols + c)) continue;
  taken.add(r * cols + c);
  const x = 12 + c * pitchX;
  const y = 12 + r * pitchY;
  const cx = x + 0.3 * FIELD.size;
  const cy = y + 0.5 * FIELD.size;
  const ch = FIELD.chars[Math.floor(rand() * FIELD.chars.length)];
  const lv = Math.floor(rand() * FIELD.levels.length);
  const tw = rand() < 0.4 ? 1 + Math.floor(rand() * TWINKLES) : 0;
  if (onBody(cx, cy) || inBox(cx, cy) || inSplash(cx, cy)) continue;
  const key = `${lv}|${tw}`;
  if (!groups.has(key)) groups.set(key, []);
  groups.get(key).push({ x, y: y + 0.86 * FIELD.size, ch });
  placed++;
}
// one <text> per level and clock, every glyph placed by its own x and y
let field = "";
for (const [key, list] of groups) {
  const [lv, tw] = key.split("|").map(Number);
  const xs = list.map((g) => g.x).join(" ");
  const ys = list.map((g) => +g.y.toFixed(1)).join(" ");
  field += `<text class="mono${tw ? ` tw tw${tw}` : ""}" x="${xs}" y="${ys}" font-size="${FIELD.size}" fill="${FIELD.levels[lv]}">${esc(list.map((g) => g.ch).join(""))}</text>`;
}

// ---- motion ------------------------------------------------------------------------------

// the twinkle: a glyph dims, drops out, comes back, in steps like the site's ticks. each
// clock has its own length and phase, so they never line up
const twinkle = Array.from({ length: TWINKLES }, (_, i) => {
  const dur = 5 + i * 1.3;
  return `.tw${i + 1}{animation-duration:${dur.toFixed(1)}s;animation-delay:${(-(i * 2.7) % dur).toFixed(1)}s}`;
}).join("\n");

const motion = [
  // the typing: each key held hidden until its moment, the caret a cell behind
  `.key{animation:hold 1s steps(1) backwards}`,
  `@keyframes hold{from,to{opacity:0}}`,
  `.caret-ride{animation:ride ${pt(COMMAND.length * TYPE.key)} steps(${COMMAND.length},end) ${pt(TYPE.start)} backwards}`,
  `@keyframes ride{from{transform:translateX(${-COMMAND.length * ADV}px)}to{transform:none}}`,
  `.caret{animation:blink 1.06s steps(1) ${pt(typingEnd + 0.4)} infinite}`,
  `@keyframes blink{50%{opacity:0}}`,
  // the portrait: every row hidden until its decode is done; the noise frames each show
  // for one beat
  `.pr{animation:hold 1s steps(1) backwards}`,
  `.df{animation:beat ${pt(DECODE.frame)} steps(1)}`,
  `@keyframes beat{from,to{opacity:1}}`,
  // the chat line arrives once he's there
  `.chat{animation:hold ${pt(decodeEnd + 0.25)} steps(1) backwards}`,
  // the nametag's idle bob, a step at a time (the cover's 4.8s)
  `.bob{animation:bob 4.8s steps(1,end) infinite}`,
  `@keyframes bob{25%{transform:translateY(-2px)}50%{transform:translateY(-4px)}75%{transform:translateY(-2px)}}`,
  MOTION.splash,
  `.tw{animation-name:tw;animation-iteration-count:infinite;animation-timing-function:steps(1,end)}`,
  `@keyframes tw{0%{opacity:1}38%{opacity:.45}52%{opacity:0}66%{opacity:.45}80%{opacity:1}}`,
  twinkle,
].join("\n");

// ---- the card ----------------------------------------------------------------------------

const css = [
  // the decode's noise frames are only ever seen mid-animation
  `.df{opacity:0}`,
  `.pt text{font-size:${+FS.toFixed(3)}px;fill:${INK.paper}}`,
].join("\n");

const bodySvg = [
  `<g>${field}</g>`,
  // xml:space too: a row's inner spaces are his shape, and not every viewer reads white-space
  `<g class="pt" xml:space="preserve">${portrait}</g>`,
  `<g class="bob">${plate.svg}</g>`,
  sp.svg,
  `${promptLine.svg}${typed}${caretSvg}`,
  `<g class="chat"><rect x="${strip.x}" y="${strip.y}" width="${strip.w}" height="${strip.h}" fill="${STRIP}" fill-opacity=".86"/>${who.svg}${msg.svg}</g>`,
  home.svg,
].join("\n");

const svg = svgDoc({
  w: W,
  h: H,
  body: bodySvg,
  css,
  motion,
  corners: TAG / 8, // one of the nametag's pixels off each corner
  title: `${NAME}: ${STATEMENT.replace(/\.$/, "")}. ${SPLASH}`,
});
return svg;
}

for (const L of Object.values(LAYOUTS)) writeSvg(join(ASSETS, L.file), drawHeader(L));
