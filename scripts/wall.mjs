// the commits wall: my github year as a wall of blocks, like alim.wtf's (Commits.tsx,
// CommitsGrid.tsx), drawn as an svg for the readme. the scoreboard up top, then the year
// from its first week with anything in it (the empty weeks before only push the blocks
// off the wall), months over it. the blocks are as big as the width lets them be; once
// the weeks don't fit one strip, the year goes into stacked strips, the older on top.
// the blocks go down a column at a time on load, a white outline running ahead of them
// (reduced motion: built). .github/workflows/wall.yml runs this every 6 hours and pushes
// dist/ to the profile-assets branch.
//
// two cuts, like the header: the wide one for the readme column (820, 24px words) and a
// phone one (410, 16px words, the scoreboard over the chat) that the readme's <picture>
// swaps in under 600px, so a ~300px phone column still gets ~12px words.
//
//   dist/wall.svg, dist/wall-phone.svg                  the wall
//   dist/wall-offline.svg, dist/wall-offline-phone.svg  the frame with an unbuilt wall,
//                                                       for a readme with no good one yet
//
//   node scripts/wall.mjs                 fetch github, write dist/
//   node scripts/wall.mjs --html f.html   read a saved contributions page instead
//   node scripts/wall.mjs --out dir       write somewhere else
//
// github not answering (or a page that no longer parses): the offline frames are still
// written, the walls are left alone and the exit code is 1, so the action keeps the last
// good ones.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { monoText, monoWidth, measure, pxText } from "./lib/frames.mjs";
import { getContributions, parseContributions, shortDay } from "./lib/contributions.mjs";
import { INK, MC } from "./lib/palette.mjs";
import { ROOT } from "./lib/paths.mjs";
import { commitBlock } from "./lib/sprites.mjs";
import { svgDoc, writeSvg } from "./lib/svg.mjs";

const USER = "dauletbekalim";

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i < 0 ? undefined : args[i + 1];
};
const OUT = opt("out") ?? join(ROOT, "dist");

// the cuts. W: the width, shown 1:1 on desktop (wide) or squeezed into a phone's ~300px
// column (phone). g: one gui pixel. T: every line of text. PAD: the black round it all.
// TX: the texel sizes a block may use (a block is 5 texels square), the biggest that
// fits wins. GAP: the air between blocks. stacked: the scoreboard over the chat and the
// legend over the live stamp, instead of side by side
const CUTS = {
  wide: { file: "wall", W: 820, g: 3, T: 24, PAD: 20, TX: [5, 6], GAP: 4, stacked: false },
  phone: { file: "wall-phone", W: 410, g: 2, T: 16, PAD: 12, TX: [3, 4], GAP: 2, stacked: true },
};

// the build: a column every STEP_S, the outline TRAIL columns ahead of the blocks
const START_S = 0.4;
const STEP_S = 0.045;
const TRAIL = 2;

const COPY = {
  title: "commits",
  total: "contributions",
  streak: "day streak",
  best: (date) => `best day, ${date}`,
  who: "alim",
  chat: ["every block is a day.", "fresh every 6 hours."],
  legend: ["less", "more"],
  updated: (date) => `updated ${date} · live`,
  offline: ["github didn’t answer this time.", "the wall comes back on the next refresh."],
};

const fmt = (n) => n.toLocaleString("en-US");
const use = (id, x, y) => `<use href="#${id}" x="${x}" y="${y}"/>`;

// the blocks, once each in <defs> (b0 is air, the dim dot), and the builder's outline
function defs({ g, tx }) {
  const cell = 5 * tx;
  return (
    `<defs>${[0, 1, 2, 3, 4].map((l) => `<g id="b${l}">${commitBlock(l, { tx, bevel: g })}</g>`).join("")}` +
    `<path id="gh" fill="${INK.paper}" fill-rule="evenodd" d="M0 0h${cell}v${cell}H0zM${g} ${g}v${cell - 2 * g}h${cell - 2 * g}V${g}z"/></defs>`
  );
}

// the scoreboard: a translucent strip, the title row a step brighter and centred, names
// grey on the left, scores in the game's scoreboard red on the right (Commits.module.css).
// x is its right edge
function scoreboard({ x, y, rows }, { g, T }) {
  const LH = T * 1.25;
  const pad = 4 * g;
  const inner = Math.max(measure(COPY.title, T), ...rows.map((r) => measure(r.name, T) + 8 * g + measure(r.score, T)));
  const w = Math.ceil(inner + 2 * pad);
  const x0 = x - w;
  const titleH = LH + 2 * g;
  const h = titleH + (rows.length ? 2 * g + rows.length * LH + 3 * g : 0);
  let svg = `<path fill="#fff" fill-opacity=".05" d="M${x0} ${y}h${w}v${h}h${-w}z"/>`;
  svg += `<path fill="#fff" fill-opacity=".1" d="M${x0} ${y}h${w}v${titleH}h${-w}z"/>`;
  svg += pxText(COPY.title, { x: x0 + w / 2, y: y + g, size: T, align: "center" });
  rows.forEach((r, i) => {
    const ry = y + titleH + 2 * g + i * LH;
    svg += pxText(r.name, { x: x0 + pad, y: ry, size: T, color: MC.gray });
    svg += pxText(r.score, { x: x - pad, y: ry, size: T, color: MC.red, align: "right" });
  });
  return { svg, w, h };
}

// a chat line, like the site's cover: <alim> in the pixel face, white like a player's
// name in the game's chat, the message in the mono, on the chat's translucent strip
function chatLine(text, { x, y }, { g, T }) {
  const h = T * 1.5;
  const name = `<${COPY.who}>`;
  const tx = x + 2 * g + measure(name, T) + monoWidth(" ", T);
  const w = Math.ceil(tx - x + monoWidth(text, T) + 2 * g);
  const svg =
    `<path fill="#1c1c1c" fill-opacity=".86" d="M${x} ${y}h${w}v${h}h${-w}z"/>` +
    pxText(name, { x: x + 2 * g, y: y + (h - T * 1.25) / 2 + g / 2, size: T }) +
    monoText(text, { x: tx, y, size: T, color: INK.paper, lh: 1.5 });
  return { svg, w, h };
}

// less [air] [1] [2] [3] [4] more, its blocks a little smaller than the text is tall
function legend({ x, y }, { g, T, GAP }) {
  const tx = Math.round(T / 6);
  const size = 5 * tx;
  const lh = size / T;
  let svg = monoText(COPY.legend[0], { x, y, size: T, color: INK.dim, lh }).svg;
  let cx = x + monoWidth(COPY.legend[0], T) + 3 * g;
  for (let l = 0; l <= 4; l++) {
    svg += commitBlock(l, { x: cx, y, tx, bevel: g - 1 }).svg;
    cx += size + GAP;
  }
  cx += 3 * g - GAP;
  svg += monoText(COPY.legend[1], { x: cx, y, size: T, color: INK.dim, lh }).svg;
  return { svg, w: cx + monoWidth(COPY.legend[1], T) - x, h: size };
}

// the live stamp: a slow blinking dot, then when github served it. x is its right edge
function stamp(text, { x, y }, { g, T }) {
  const sx = x - monoWidth(text, T);
  const svg =
    `<rect class="live" x="${Math.round(sx - 5 * g)}" y="${y + 4 * g}" width="${2 * g}" height="${2 * g}" fill="${INK.paper}"/>` +
    monoText(text, { x: sx, y, size: T, color: INK.dim, lh: 1.25 }).svg;
  return { svg, w: monoWidth(text, T) + 5 * g, h: T * 1.25 };
}

// month labels for weeks [a, b), columns counted from a: every month that starts there,
// the strip's own month at its first column when no other starts close by, and none
// within minCols columns of the next (it would collide)
function monthsIn(all, weeks, a, b, minCols) {
  const inside = all.filter((m) => m.col >= a && m.col < b).map((m) => ({ ...m, col: m.col - a }));
  if (!inside.length || inside[0].col >= minCols) {
    const day = weeks[a].find((d) => d !== null);
    const label = new Date(`${day.date}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    inside.unshift({ col: 0, label: label.toLowerCase() });
  }
  return inside.filter((m, i) => i === inside.length - 1 || inside[i + 1].col - m.col >= minCols);
}

// one strip of the year: month labels, then 7 rows of blocks, column by column. each
// column is three groups: its air and its outline go up as the builder reaches it, its
// blocks TRAIL columns later. from: the strip's first week, for the timing
function strip({ x, y, weeks, months, from }, { g, T }, { step, gap }) {
  let svg = "";
  for (const m of months) svg += monoText(m.label, { x: x + m.col * step, y, size: T, color: INK.dimmer, lh: 1.25 });
  const top = y + T * 1.25 + 2 * g;
  const at = (n) => `${(START_S + n * STEP_S).toFixed(3)}s`;
  weeks.forEach((week, c) => {
    let air = "";
    let ghost = "";
    let blocks = "";
    week.forEach((day, r) => {
      if (!day) return;
      const bx = x + c * step;
      const by = top + r * step;
      if (day.level === 0) air += use("b0", bx, by);
      else {
        ghost += use("gh", bx, by);
        blocks += use(`b${day.level}`, bx, by);
      }
    });
    if (air) svg += `<g class="a" style="animation-delay:${at(from + c)}">${air}</g>`;
    if (ghost) svg += `<g class="h" style="animation-delay:${at(from + c)}">${ghost}</g>`;
    if (blocks) svg += `<g class="b" style="animation-delay:${at(from + c + TRAIL)}">${blocks}</g>`;
  });
  return { svg, h: top - y + 7 * step - gap };
}

// the outline stays hidden unless the build is playing
const CSS = `.h{opacity:0}`;

// the build, and the live dot's slow blink (svgDoc only plays these for people who
// haven't asked for less motion). each column fades in over a few columns' time: blink
// stops ticking an svg image once no animation is mid-play, so with instant .01s steps
// the build froze two seconds in. overlapping fades keep one always playing
const FADE_S = 0.15;
const MOTION = `.a,.b{animation:on ${FADE_S}s ease-out both}
.h{animation:gh ${(TRAIL * STEP_S).toFixed(3)}s steps(1)}
@keyframes on{from{opacity:0}}
@keyframes gh{from,to{opacity:1}}
.live{animation:live 2.4s ease-in-out infinite}
@keyframes live{0%,45%,100%{opacity:1}70%{opacity:.2}}`;

// the year from its first week with a contribution (all of it when there's none). the
// scoreboard still counts the whole year
function fromFirst(data) {
  const first = data.weeks.findIndex((w) => w.some((d) => d && d.level > 0));
  if (first <= 0) return data;
  const months = data.months.filter((m) => m.col >= first).map((m) => ({ ...m, col: m.col - first }));
  return { ...data, weeks: data.weeks.slice(first), months };
}

// n weeks into strips: as few as fit the width at the smallest texel, then the biggest
// texel those strips still fit. every strip starts at the same left edge, so their
// columns line up
function layout(n, { W, PAD, TX, GAP }) {
  const room = W - 2 * PAD;
  const fits = (tx, cols) => cols * (5 * tx + GAP) - GAP <= room;
  const [lo, hi] = TX;
  let strips = 1;
  while (!fits(lo, Math.ceil(n / strips))) strips += 1;
  const per = Math.ceil(n / strips);
  let tx = hi;
  while (tx > lo && !fits(tx, per)) tx -= 1;
  const step = 5 * tx + GAP;
  return { per, tx, step, gap: GAP, w: per * step - GAP };
}

function drawWall(all, cut) {
  const { W, g, T, PAD, stacked } = cut;
  const data = fromFirst(all);
  const n = data.weeks.length;
  const L = layout(n, cut);
  const LH = T * 1.25;
  const rows = [
    { name: COPY.total, score: fmt(data.total) },
    data.streak > 0 ? { name: COPY.streak, score: fmt(data.streak) } : null,
    data.best ? { name: COPY.best(shortDay(data.best.date)), score: fmt(data.best.count) } : null,
  ].filter(Boolean);
  const stampText = COPY.updated(shortDay(data.fetchedAt));

  // measure first: the header and the foot can want more room than the wall
  const board0 = scoreboard({ x: 0, y: 0, rows }, cut);
  const chatW = Math.max(...COPY.chat.map((line) => chatLine(line, { x: 0, y: 0 }, cut).w));
  const legend0 = legend({ x: 0, y: 0 }, cut);
  const stamp0 = stamp(stampText, { x: 0, y: 0 }, cut);
  const need = stacked
    ? Math.max(board0.w, chatW, legend0.w, stamp0.w)
    : Math.max(chatW + 8 * g + board0.w, legend0.w + 8 * g + stamp0.w);
  const cw = Math.min(W - 2 * PAD, Math.max(L.w, need));
  const left = Math.round((W - cw) / 2);
  const right = left + cw;
  const x = left + Math.round((cw - L.w) / 2);

  // the header, like the game's screen: the scoreboard on the right, alim's chat bottom
  // left, level with the board's foot (stacked: the chat under the board)
  const board = scoreboard({ x: right, y: PAD, rows }, cut);
  let body = defs({ g, tx: L.tx }) + board.svg;
  const lineH = T * 1.5;
  const chatH = COPY.chat.length * lineH;
  const chatY = stacked ? PAD + board.h + 4 * g : PAD + Math.max(board.h, chatH) - chatH;
  COPY.chat.forEach((line, i) => (body += chatLine(line, { x: left, y: chatY + i * lineH }, cut).svg));
  let y = chatY + chatH + (stacked ? 6 : 10) * g;

  const minCols = Math.ceil((monoWidth("mmm", T) + 2 * g) / L.step);
  for (let a = 0; a < n; a += L.per) {
    const b = Math.min(n, a + L.per);
    const s = strip({ x, y, weeks: data.weeks.slice(a, b), months: monthsIn(data.months, data.weeks, a, b, minCols), from: a }, cut, L);
    body += s.svg;
    y += s.h + 8 * g;
  }

  // the foot: the legend on the left, under the wall like the site's, the live stamp on
  // the right (stacked: under the legend)
  body += legend({ x: left, y: y + Math.round((LH - legend0.h) / 2) }, cut).svg;
  if (stacked) y += LH + 2 * g;
  body += stamp(stampText, { x: right, y }, cut).svg;
  const h = y + LH + PAD;

  const title = `${fmt(data.total)} contributions on github in the last year, drawn as a wall of blocks`;
  return svgDoc({ w: W, h, body, css: CSS, motion: MOTION, corners: g, title });
}

// the frame with nothing built: the scoreboard's title, why, and a strip of air as wide
// as the frame takes at the smallest block
function drawOffline(cut) {
  const { W, g, T, PAD, TX, GAP, stacked } = cut;
  const LH = T * 1.25;
  const L = layout(Math.floor((W - 2 * PAD + GAP) / (5 * TX[0] + GAP)), cut);
  const x = Math.round((W - L.w) / 2);
  const board = scoreboard({ x: x + L.w, y: PAD, rows: [] }, cut);
  let body = defs({ g, tx: L.tx }) + board.svg;
  const textY = stacked ? PAD + board.h + 4 * g : PAD;
  COPY.offline.forEach((line, i) => (body += monoText(line, { x: PAD, y: textY + i * LH, size: T, color: INK.dim, lh: 1.25 })));
  const top = stacked ? textY + COPY.offline.length * LH + 6 * g : PAD + Math.max(board.h, COPY.offline.length * LH) + 10 * g;
  for (let c = 0; c < L.per; c++) for (let r = 0; r < 7; r++) body += use("b0", x + c * L.step, top + r * L.step);
  return svgDoc({ w: W, h: top + 7 * L.step - L.gap + PAD, body, corners: g, title: "github's contributions didn't load this time" });
}

for (const cut of Object.values(CUTS)) writeSvg(join(OUT, `${cut.file.replace("wall", "wall-offline")}.svg`), drawOffline(cut));

let data;
try {
  const file = opt("html");
  data = file
    ? { ...parseContributions(readFileSync(file, "utf8"), new Date()), fetchedAt: new Date() }
    : await getContributions(USER);
} catch (err) {
  console.error(`wall: github offline (${err instanceof Error ? err.message : err}), keeping the last wall`);
  process.exit(1);
}
for (const cut of Object.values(CUTS)) writeSvg(join(OUT, `${cut.file}.svg`), drawWall(data, cut));
const shown = fromFirst(data).weeks.length;
console.log(`wall: ${fmt(data.total)} contributions, ${shown} of ${data.weeks.length} weeks, streak ${data.streak}, best ${data.best?.date} (${data.best?.count})`);
