// the commits wall: my github year as a wall of blocks, like alim.wtf's (Commits.tsx,
// CommitsGrid.tsx), drawn as an svg for the readme. the scoreboard up top, then the year
// in two stacked halves, the older on top, months over each: 25px blocks on desktop, so
// a phone (830 squeezed to 340) still gets the site's 10px ones. the blocks go down a
// column at a time on load, a white outline running ahead of them (reduced motion:
// built). .github/workflows/wall.yml runs this every 6 hours and pushes dist/ to the
// profile-assets branch.
//
//   dist/wall.svg          the wall
//   dist/wall-offline.svg  the frame with an unbuilt wall, for a readme with no good one yet
//
//   node scripts/wall.mjs                 fetch github, write dist/
//   node scripts/wall.mjs --html f.html   read a saved contributions page instead
//   node scripts/wall.mjs --out dir       write somewhere else
//
// github not answering (or a page that no longer parses): wall-offline.svg is still
// written, wall.svg is left alone and the exit code is 1, so the action keeps the last
// good one.

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

// 830 wide: the readme column, shown 1:1 on desktop. g: one gui pixel. T: every line of
// text, ~10px when github squeezes 830 into a phone's 340
const W = 830;
const g = 3;
const PAD = 24;
const T = 24;
const LH = T * 1.25;

// the wall. a texel is TX, a block 5 texels (25px), GAP the air between blocks, BEVEL its
// lit and shaded edge. HALVES: how many strips the year is cut into
const TX = 5;
const CELL = 5 * TX;
const GAP = 4;
const STEP = CELL + GAP;
const BEVEL = g;
const HALVES = 2;

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
const DEFS =
  `<defs>${[0, 1, 2, 3, 4].map((l) => `<g id="b${l}">${commitBlock(l, { tx: TX, bevel: BEVEL })}</g>`).join("")}` +
  `<path id="gh" fill="${INK.paper}" fill-rule="evenodd" d="M0 0h${CELL}v${CELL}H0zM${g} ${g}v${CELL - 2 * g}h${CELL - 2 * g}V${g}z"/></defs>`;

// the scoreboard: a translucent strip, the title row a step brighter and centred, names
// grey on the left, scores in the game's scoreboard red on the right (Commits.module.css).
// x is its right edge
function scoreboard({ x, y, rows }) {
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
const CHAT_H = T * 1.5;
function chatLine(text, { x, y }) {
  const name = `<${COPY.who}>`;
  const tx = x + 2 * g + measure(name, T) + monoWidth(" ", T);
  const w = Math.ceil(tx - x + monoWidth(text, T) + 2 * g);
  return (
    `<path fill="#1c1c1c" fill-opacity=".86" d="M${x} ${y}h${w}v${CHAT_H}h${-w}z"/>` +
    pxText(name, { x: x + 2 * g, y: y + (CHAT_H - LH) / 2 + g / 2, size: T }) +
    monoText(text, { x: tx, y, size: T, color: INK.paper, lh: CHAT_H / T })
  );
}

// less [air] [1] [2] [3] [4] more, at 20px blocks
const LEGEND_H = 20;
function legend({ x, y }) {
  const tx = 4;
  const lh = LEGEND_H / T;
  let svg = monoText(COPY.legend[0], { x, y, size: T, color: INK.dim, lh }).svg;
  let cx = x + monoWidth(COPY.legend[0], T) + 3 * g;
  for (let l = 0; l <= 4; l++) {
    svg += commitBlock(l, { x: cx, y, tx, bevel: 2 }).svg;
    cx += 5 * tx + 4;
  }
  return svg + monoText(COPY.legend[1], { x: cx - 4 + 3 * g, y, size: T, color: INK.dim, lh }).svg;
}

// month labels for weeks [a, b), columns counted from a: every month that starts there,
// the strip's own month at its first column when no other starts close by, and none
// within MIN_COLS columns of the next (it would collide)
const MIN_COLS = Math.ceil((monoWidth("mmm", T) + 2 * g) / STEP);
function monthsIn(all, weeks, a, b) {
  const inside = all.filter((m) => m.col >= a && m.col < b).map((m) => ({ ...m, col: m.col - a }));
  if (!inside.length || inside[0].col >= MIN_COLS) {
    const day = weeks[a].find((d) => d !== null);
    const label = new Date(`${day.date}T00:00:00Z`).toLocaleString("en-US", { month: "short", timeZone: "UTC" });
    inside.unshift({ col: 0, label: label.toLowerCase() });
  }
  return inside.filter((m, i) => i === inside.length - 1 || inside[i + 1].col - m.col >= MIN_COLS);
}

// one strip of the year: month labels, then 7 rows of blocks, column by column. each
// column is three groups: its air and its outline go up as the builder reaches it, its
// blocks TRAIL columns later. from: the strip's first week, for the timing
function strip({ x, y, weeks, months, from }) {
  let svg = "";
  for (const m of months) svg += monoText(m.label, { x: x + m.col * STEP, y, size: T, color: INK.dimmer, lh: 1.25 });
  const top = y + LH + 2 * g;
  const at = (n) => `${(START_S + n * STEP_S).toFixed(3)}s`;
  weeks.forEach((week, c) => {
    let air = "";
    let ghost = "";
    let blocks = "";
    week.forEach((day, r) => {
      if (!day) return;
      const bx = x + c * STEP;
      const by = top + r * STEP;
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
  return { svg, h: top - y + 7 * STEP - GAP };
}

// the outline stays hidden unless the build is playing
const CSS = `.h{opacity:0}`;

// the build, and the live dot's slow blink (svgDoc only plays these for people who
// haven't asked for less motion)
const MOTION = `.a,.b{animation:on .01s steps(1) both}
.h{animation:gh ${(TRAIL * STEP_S).toFixed(3)}s steps(1)}
@keyframes on{from{opacity:0}}
@keyframes gh{from,to{opacity:1}}
.live{animation:live 2.4s ease-in-out infinite}
@keyframes live{0%,45%,100%{opacity:1}70%{opacity:.2}}`;

// the year's columns cut into HALVES strips, each `per` columns, centred, all starting at
// the same left edge so their columns line up
const layout = (n) => {
  const per = Math.ceil(n / HALVES);
  const w = per * STEP - GAP;
  return { per, x: Math.round((W - w) / 2), w };
};

function drawWall(data) {
  const n = data.weeks.length;
  const { per, x, w } = layout(n);
  const right = x + w;
  const rows = [
    { name: COPY.total, score: fmt(data.total) },
    data.streak > 0 ? { name: COPY.streak, score: fmt(data.streak) } : null,
    data.best ? { name: COPY.best(shortDay(data.best.date)), score: fmt(data.best.count) } : null,
  ].filter(Boolean);

  // the header, like the game's screen: the scoreboard on the right, alim's chat bottom
  // left, level with the board's foot
  const board = scoreboard({ x: right, y: PAD, rows });
  const headH = Math.max(board.h, COPY.chat.length * CHAT_H);
  let body = DEFS + board.svg;
  const chatY = PAD + headH - COPY.chat.length * CHAT_H;
  COPY.chat.forEach((line, i) => (body += chatLine(line, { x, y: chatY + i * CHAT_H })));
  let y = PAD + headH + 10 * g;

  for (let a = 0; a < n; a += per) {
    const b = Math.min(n, a + per);
    const s = strip({ x, y, weeks: data.weeks.slice(a, b), months: monthsIn(data.months, data.weeks, a, b), from: a });
    body += s.svg;
    y += s.h + 8 * g;
  }

  // the foot: the legend on the left, under the wall like the site's. the live stamp on
  // the right: a slow blinking dot, then when github served it
  body += legend({ x, y: y + (LH - LEGEND_H) / 2 });
  const stamp = COPY.updated(shortDay(data.fetchedAt));
  const sx = right - monoWidth(stamp, T);
  body += `<rect class="live" x="${Math.round(sx - 5 * g)}" y="${y + 4 * g}" width="${2 * g}" height="${2 * g}" fill="${INK.paper}"/>`;
  body += monoText(stamp, { x: sx, y, size: T, color: INK.dim, lh: 1.25 }).svg;
  const h = y + LH + PAD;

  const title = `${fmt(data.total)} contributions on github in the last year, drawn as a wall of blocks`;
  return svgDoc({ w: W, h, body, css: CSS, motion: MOTION, corners: g, title });
}

// the frame with nothing built: the scoreboard's title, why, and half a year of air
function drawOffline() {
  const { per, x, w } = layout(53);
  const board = scoreboard({ x: x + w, y: PAD, rows: [] });
  let body = DEFS + board.svg;
  COPY.offline.forEach((line, i) => (body += monoText(line, { x, y: PAD + i * LH, size: T, color: INK.dim, lh: 1.25 })));
  const top = PAD + Math.max(board.h, COPY.offline.length * LH) + 10 * g;
  for (let c = 0; c < per; c++) for (let r = 0; r < 7; r++) body += use("b0", x + c * STEP, top + r * STEP);
  return svgDoc({ w: W, h: top + 7 * STEP - GAP + PAD, body, corners: g, title: "github's contributions didn't load this time" });
}

writeSvg(join(OUT, "wall-offline.svg"), drawOffline());

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
writeSvg(join(OUT, "wall.svg"), drawWall(data));
console.log(`wall: ${fmt(data.total)} contributions, ${data.weeks.length} weeks, streak ${data.streak}, best ${data.best?.date} (${data.best?.count})`);
