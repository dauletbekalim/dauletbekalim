// the items the cards need that alim.wtf doesn't draw yet, painted in the same hand as
// lib/sprites.mjs: 16 x 16, a few flat colours, a lit edge top-left. sprites, not names,
// so the kit's drawSprite / slot / toast take them as they are. plus the agentmash mark,
// the one picture that isn't pixels (it's agentmash's own art, same as the site uses).

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { MC, SHADE } from "../lib/palette.mjs";
import { fromRows, paint } from "../lib/sprites.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));

// paint() with our own colours: one letter per colour, "." clear
const painted = (draw, colours) => paint(16, 16, draw, (g) => colours[g] ?? null);

// the medal from the story's olympiad chapter, in any metal and ribbon
const medal = ({ ribbon, ribbonLit, dark, mid, lit }) =>
  painted(
    (p) => {
      p.rows(0, ["...vvw....wvv...", "....vvw..wvv....", "....vvw..wvv....", ".....vvwwvv.....", "......vwwv......"]);
      p.disc(8, 10.5, 4.6, "Y");
      p.disc(8, 10.5, 3.6, "y");
      p.rect(6, 8, 2, 2, "z");
      p.rect(7, 12, 3, 1, "Y");
    },
    { v: ribbon, w: ribbonLit, Y: dark, y: mid, z: lit },
  );

// a quadratic bezier, sampled finely and snapped to pixels, in order, no repeats
function bezier([x0, y0], [x1, y1], [x2, y2]) {
  const out = [];
  for (let i = 0; i <= 64; i++) {
    const t = i / 64;
    const a = (1 - t) ** 2;
    const b = 2 * (1 - t) * t;
    const c = t * t;
    const x = Math.round(a * x0 + b * x1 + c * x2);
    const y = Math.round(a * y0 + b * y1 + c * y2);
    const last = out[out.length - 1];
    if (!last || last[0] !== x || last[1] !== y) out.push([x, y]);
  }
  return out;
}

export const ART = {
  // IOAI national team: the flag on its pole, sky blue, the sun and the ornament in gold
  flag: fromRows(
    [
      "................",
      ".y..............",
      ".LssssssssssssS.",
      ".LSoSSSSSSSSSSS.",
      ".LSSSSSSSySSSSS.",
      ".LSoSSSYSSSYSSS.",
      ".LSSSSSSyyySSSS.",
      ".LSoSSYSyyySYSS.",
      ".LSSSSSSyyySSSS.",
      ".LSoSSSYSSSYSSS.",
      ".LSSSSSSSySSSSS.",
      ".LSoSSSSSSSSSSS.",
      ".LddddddddddddD.",
      ".L..............",
      ".L..............",
      ".l..............",
    ],
    { y: MC.goldBlock, Y: SHADE.goldDark, o: MC.goldBlock, L: MC.log, l: SHADE.logDark, s: "#5fd3e6", S: "#00afca", d: "#00809a", D: "#006a80" },
  ),

  // 1st place: the story's gold medal. silver: the same on a white ribbon. 3rd: in
  // bronze, on a red ribbon
  gold: medal({ ribbon: MC.lapis, ribbonLit: SHADE.lapisLit, dark: SHADE.goldDark, mid: MC.goldBlock, lit: SHADE.goldLit }),
  silver: medal({ ribbon: "#b8b8c4", ribbonLit: "#ffffff", dark: "#6e6e7a", mid: "#c4c4cf", lit: "#f4f4fa" }),
  bronze: medal({ ribbon: MC.redstone2, ribbonLit: "#e04040", dark: "#7a4519", mid: "#c0773a", lit: "#f0b27a" }),

  // best overall solution: a gold cup on a dark wood base
  trophy: fromRows(
    [
      "................",
      "..YYYYYYYYYYYY..",
      "YYYzzyyyyyyyyYYY",
      "Y..Yzyyyyyyyy..Y",
      "Y..Yzyyyyyyyy..Y",
      ".Y.Yzyyyyyyyy.Y.",
      "..YYyyyyyyyyYYY.",
      "....YyyyyyyyY...",
      ".....YyyyyyY....",
      "......YyyyY.....",
      ".......yyY......",
      ".......yyY......",
      ".....YyyyyyY....",
      "....hhhhhhhhh...",
      "....LLLLLLLLL...",
      "................",
    ],
    { y: MC.goldBlock, Y: SHADE.goldDark, z: SHADE.goldLit, h: "#2e2010", L: MC.log },
  ),

  // the patent: a map with the rover's path on it, a bezier curve (drawn with one), and
  // the x where it ends up
  route: painted(
    (p) => {
      p.rect(1, 1, 14, 14, "m");
      p.rect(2, 2, 12, 12, "n");
      p.rect(2, 13, 12, 1, "M");
      bezier([3, 12], [12, 13], [10, 5]).forEach(([x, y], i) => i % 2 === 0 && p.dot(x, y, "i"));
      p.rows(2, ["..........R.R...", "...........R....", "..........R.R..."]);
    },
    { m: MC.paperEdge, n: MC.paper, M: SHADE.paperDark, i: MC.ink, R: MC.redstone2 },
  ),

  // projected ARR: an emerald, the gem cut like the crafting grid's
  emerald: fromRows(
    [
      "................",
      "................",
      "................",
      "....66777766....",
      "...6677777766...",
      "..667755557766..",
      "..555555555555..",
      "...4555555554...",
      "....45555554....",
      ".....455554.....",
      "......4554......",
      ".......44.......",
      "................",
      "................",
      "................",
      "................",
    ],
    { 4: "#0b7a33", 5: MC.emerald, 6: "#7ef5a9", 7: "#d5fde3" },
  ),

  // motion-ui-videos: a clapperboard
  clapper: fromRows(
    [
      "................",
      "................",
      ".wwkkwwkkwwkkww.",
      ".kwwkkwwkkwwkkw.",
      ".g..............",
      ".kkwwkkwwkkwwkk.",
      ".wkkwwkkwwkkwwk.",
      ".11111111111111.",
      ".12222222222221.",
      ".12777772222221.",
      ".12222222222221.",
      ".12777777772221.",
      ".12222222222221.",
      ".12777222222221.",
      ".11111111111111.",
      "................",
    ],
    { k: "#1a1a1a", w: "#f0f0f0", g: "#8f8f8f", 1: "#2e2e2e", 2: "#4a4a4a", 7: "#d6d6d6" },
  ),

  // narkesken: a microphone in its cradle
  mic: fromRows(
    [
      "................",
      "......5665......",
      ".....567765.....",
      ".....576675.....",
      "...3.567765.3...",
      "...3.576675.3...",
      "...3.567765.3...",
      "....3.5555.3....",
      ".....33yy33.....",
      ".......44.......",
      ".......44.......",
      ".......44.......",
      ".....333333.....",
      "....33333333....",
      "................",
      "................",
    ],
    { 3: "#6b6b6b", 4: "#8f8f8f", 5: "#8a8a8a", 6: "#b4b4b4", 7: "#e6e6e6", y: MC.goldBlock },
  ),

  // typescript: a blue tile, the two letters in our pixel face
  ts: fromRows(
    [
      "................",
      ".llllllllllllll.",
      ".lbbbbbbbbbbbbd.",
      ".lbbbbbbbbbbbbd.",
      ".lbbbbbbbbbbbbd.",
      ".lbbbbbbbbbbbbd.",
      ".lbwwwwwbbwwwwd.",
      ".lbbbwbbbwbbbbd.",
      ".lbbbwbbbwbbbbd.",
      ".lbbbwbbbbwwwbd.",
      ".lbbbwbbbbbbbwd.",
      ".lbbbwbbbbbbbwd.",
      ".lbbbwbbbwwwwbd.",
      ".lbbbbbbbbbbbbd.",
      ".dddddddddddddd.",
      "................",
    ],
    { l: "#4f93dc", b: "#3178c6", d: "#1f5591", w: "#ffffff" },
  ),

  // react / next: an atom, three orbits round a nucleus
  atom: painted(
    (p) => {
      const cx = 7.5;
      const cy = 7.5;
      for (const deg of [0, 60, 120]) {
        const a = (deg * Math.PI) / 180;
        for (let i = 0; i < 360; i += 2) {
          const t = (i * Math.PI) / 180;
          const ex = 6.6 * Math.cos(t);
          const ey = 2.5 * Math.sin(t);
          p.dot(Math.round(cx + ex * Math.cos(a) - ey * Math.sin(a)), Math.round(cy + ex * Math.sin(a) + ey * Math.cos(a)), "s");
        }
      }
      p.disc(8, 8, 1.6, "S");
      p.dot(7, 7, "w");
    },
    { s: MC.diamond, S: SHADE.diamondDark, w: "#dcfcfd" },
  ),

  // rust: a gear, rusted. eight square teeth on a ring, the hole through the middle
  gear: fromRows(
    [
      "................",
      ".......ll.......",
      "...ll..ll..oo...",
      "...lllllllooo...",
      "....llllooooo...",
      "...llllooooooo..",
      ".lllllo..oooooo.",
      ".lllll....ooooo.",
      ".lllll....ooodd.",
      ".llooo...oooodd.",
      "...oooooooooodd.",
      "....ooooooodd...",
      "...ooooooooddd..",
      "...oo..dd..dd...",
      ".......dd.......",
      "................",
    ],
    { l: "#e8875f", o: "#c4561d", d: "#8a3a12" },
  ),

  // python: a snake in an s, blue on top and yellow below, its head up top
  snake: fromRows(
    [
      "................",
      "......bbbbbb....",
      ".....bbbbwbbb...",
      ".....bbbbbbbbr..",
      ".....bbb..bbb.r.",
      ".....bbb........",
      "......bbbb......",
      ".......Bbbby....",
      "........Byyyy...",
      "..........yyy...",
      "...........yyy..",
      "...yy......yyy..",
      "...yyy....yyyY..",
      "....yyyyyyyyY...",
      ".....YYYYYYY....",
      "................",
    ],
    { b: "#3d7fc0", B: "#2a5d8f", y: "#ffd43b", Y: "#c9a227", w: "#ffffff", r: MC.redstone },
  ),

  // java: a mug, steam over it
  mug: fromRows(
    [
      "................",
      "......5...5.....",
      ".....5...5......",
      "......5...5.....",
      ".....5...5......",
      "................",
      "..77777777777...",
      "..7ccccccccc7...",
      "..666666666667..",
      "..66666666666.6.",
      "..66666666666.6.",
      "..666666666667..",
      "...666666666....",
      "....4444444.....",
      "................",
      "................",
    ],
    { 4: "#8f8f8f", 5: "#6b6b6b", 6: "#d6d6d6", 7: "#ffffff", c: MC.dirt2 },
  ),
};

// the agentmash mark, as agentmash.dev draws it (a png: its glow is the point). kept in
// scripts/art so ci can build without the portfolio checked out
export const MARK_PNG = `data:image/png;base64,${readFileSync(join(HERE, "..", "art", "agentmash-mark-128.png")).toString("base64")}`;
