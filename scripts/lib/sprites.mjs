// our pixel art, ported from alim.wtf and drawn by hand there; nothing is taken from any
// game. four sets, all in one registry by "set/name":
//   hud/*     the hotbar's items, 12 x 12 (components/chrome/items.tsx). crisp at 24, 36, 48
//   art/*     the crafting grid's items, 16 x 16 (components/sections/ItemArt.tsx)
//   story/*   the story's chapter items, 16 x 16, and player/* (12 x 16, four poses)
//             (components/sections/story/pixels.tsx)
//   block/*   16 x 16 block textures from the story's seeded generator (story/blocks.ts),
//             the same seeds, so they match the site texel for texel
// plus commitBlock(): the commit wall's five blocks (Commits.module.css), 5 x 5 texels.
// a sprite is { w, h, px } with px a row-major list of rows, each pixel a #hex or null.
// drawSprite() turns one into a few <path>s, one per colour, runs of a colour merged
// across and down, so a 16 x 16 item is a handful of nodes.

import { deflateSync } from "node:zlib";
import { MC, SHADE, INK, mix, rgb, hex } from "./palette.mjs";

// a grid of characters (one per pixel) and a colour per character -> a sprite
export function fromRows(rows, colours) {
  const w = Math.max(...rows.map((r) => r.length));
  return { w, h: rows.length, px: rows.map((r) => Array.from({ length: w }, (_, x) => colours[r[x]] ?? null)) };
}

// hud: 12 x 12 ---------------------------------------------------------------------------
// "." clear, "1" to "6" dark grey to white, "k" black; each item names its own colours
const GREYS12 = { 1: "#3a3a3a", 2: "#5c5c5c", 3: "#8a8a8a", 4: "#b8b8b8", 5: "#e0e0e0", 6: "#ffffff", k: "#000000" };

const HUD = {
  // home: the bed, where you spawn
  bed: ["............", "............", "............", "2...........", "2...........", "2.66........", "2.6644444444", "255555555555", "233333333333", "22........22", "............", "............"],
  // the thing being built right now
  pickaxe: ["............", "...666666...", "..54444446..", "........346.", ".......3.46.", "......3..46.", ".....3...46.", "....3....46.", "...3.....46.", "..3......5..", ".3..........", "............"],
  // a map, a path and an x
  map: ["............", ".3333333333.", ".3444444443.", ".344444r4r3.", ".3444444r43.", ".344444r4r3.", ".3444144443.", ".3441444443.", ".3414444443.", ".3444444443.", ".3333333333.", "............"],
  chest: ["............", "............", ".2222222222.", ".2333333332.", ".2333333332.", ".2222552222.", ".2333553332.", ".2333333332.", ".2333333332.", ".2333333332.", ".2222222222.", "............"],
  // one block of the wall: grass on dirt
  block: ["............", ".....55.....", "...555555...", ".5555555555.", ".gg555555hh.", ".33gg55hh22.", ".3333gh2222.", ".3333322222.", ".3333322222.", ".3333322222.", "...333222...", ".....32....."],
  // a written book
  book: ["............", "..24444445..", "..24444445..", "..24111145..", "..24444445..", "..24444445..", "..24444445..", "..24444445..", "..24444445..", "..24444445..", "..26666665..", "............"],
  // the crafting table
  table: ["............", ".2222222222.", ".2552552552.", ".2552552552.", ".2222222222.", ".3333333333.", ".3111331113.", ".3131331313.", ".3111331113.", ".3333333333.", ".2222222222.", "............"],
  // a paper plane (say hi, telegram)
  plane: ["............", "..........6.", ".......6634.", "....6666344.", ".6666663444.", "..66663444..", "...6634444..", "....44444...", ".....4444...", "......44....", ".......4....", "............"],
  // email
  letter: ["............", "............", ".5555555555.", ".5255555525.", ".5525555255.", ".5552552555.", ".5555rr5555.", ".5555rr5555.", ".5555555555.", ".5555555555.", "............", "............"],
  // github: a branch and its merge
  branch: ["............", "..666..666..", "..6.6..6.6..", "..666..666..", "...6....6...", "...6....6...", "...6...6....", "...6666.....", "..666.......", "..6.6.......", "..666.......", "............"],
  // linkedin: the two letters
  in: ["............", "............", "..66........", "..66........", "............", "..66.66666..", "..66.66..66.", "..66.66..66.", "..66.66..66.", "..66.66..66.", "............", "............"],
  // x: the letter
  x: ["............", "............", "..66....66..", "...66..66...", "....6666....", ".....66.....", ".....66.....", "....6666....", "...66..66...", "..66....66..", "............", "............"],
  // instagram: a camera
  camera: ["............", "..66666666..", ".6........6.", ".6......6.6.", ".6..llll..6.", ".6.ll..ll.6.", ".6.ll..ll.6.", ".6..llll..6.", ".6........6.", "..66666666..", "............", "............"],
};

const HUD_COLOURS = {
  bed: { 2: MC.log, 3: MC.planks, 4: "#c8322a", 5: "#8a1e19", 6: "#f0f0f0" },
  pickaxe: { 3: MC.planks, 4: MC.diamond, 5: SHADE.diamondDark, 6: SHADE.diamondLit },
  map: { 1: MC.dirt2, 3: SHADE.paperDark, 4: MC.paper, r: MC.redstone2 },
  chest: { 2: MC.dirt3, 3: MC.planks, 5: SHADE.ironItem },
  block: { 5: MC.grass3, g: MC.grass, h: MC.grass2, 3: MC.dirt, 2: MC.dirt3 },
  book: { 1: MC.paper, 2: SHADE.leatherDark, 4: SHADE.leather, 5: MC.paperEdge, 6: MC.paper },
  table: { 1: MC.ink, 2: MC.dirt3, 3: MC.planks, 5: SHADE.plankLit },
  plane: { 3: SHADE.diamondDark, 4: "#bdeef2", 6: "#ffffff" },
  letter: { 2: SHADE.paperDark, 5: MC.paper, r: MC.redstone2 },
  in: { 6: SHADE.lapisLit },
  camera: { l: MC.gold },
};

// art: 16 x 16 ---------------------------------------------------------------------------
// "." clear, "0" black, "1" to "7" dark grey to white
const GREYS16 = { 0: "#000000", 1: "#2e2e2e", 2: "#4a4a4a", 3: "#6b6b6b", 4: "#8f8f8f", 5: "#b4b4b4", 6: "#d6d6d6", 7: "#ffffff" };

const ART = {
  // claude code: a terminal window, a prompt and a cursor
  terminal: ["................", "................", ".57575755555555.", ".55555555555553.", ".60000000000003.", ".60000000000003.", ".60g00000000003.", ".600g0000000003.", ".60g00000000003.", ".60000000000003.", ".600000gggg0003.", ".60000000000003.", ".60000000000003.", ".33333333333333.", "................", "................"],
  // codex: a book
  book: ["................", "...3366666665...", "...3355555557...", "...3355555557...", "...3357777757...", "...3357777757...", "...3355555557...", "...3356666557...", "...3355555557...", "...3355555557...", "...3355555557...", "...3355555557...", "...3355555557...", "...3355555557...", "....366666666...", "................"],
  // cursor: the pointer
  cursor: ["....2...........", "....22..........", "....272.........", "....2772........", "....27772.......", "....277772......", "....2777772.....", "....27777772....", "....277777772...", "....2777722222..", "....27727.2.....", "....272.272.....", "....22...272....", "....2....272....", "..........22....", "................"],
  // github copilot: a paper plane
  plane: ["................", "................", ".............77.", "...........7776.", ".........777766.", ".......77777566.", ".....7777775566.", "...777777755566.", ".7777777755.566.", "......3355.566..", "......335..56...", "......35...6....", "......3.........", "................", "................", "................"],
  // gemini: a cut gem
  gem: ["................", "................", "................", "....66777766....", "...6677777766...", "..667755557766..", "..555555555555..", "...4555555554...", "....45555554....", ".....455554.....", "......4554......", ".......44.......", "................", "................", "................", "................"],
  // and more
  more: ["................", "................", "................", "................", "................", "................", "................", "..77...77...77..", "..75...75...75..", "................", "................", "................", "................", "................", "................", "................"],
  // your team: two people, one in front
  team: ["................", "................", "...hh...........", "..hhhh..........", "..hhhh....HH....", "...hh....HHHH...", ".........HHHH...", "..bbbb....HH....", ".bbbbbb.........", ".bbbbbb...BBBB..", ".bbbbbb..BBBBBB.", ".bbbbbb..BBBBBB.", ".bbbbbb..BBBBBB.", ".........BBBBBB.", "................", "................"],
  // astana hub, lead engineer: an iron pickaxe
  pickaxe: ["................", ".....66666......", "...667777766....", "..67755555776...", "..75......5577..", ".6........4657..", ".........43..57.", "........43....6.", ".......43.....6.", "......43........", ".....43.........", "....43..........", "...43...........", "..43............", ".43.............", "................"],
  // auditing studio: a chest
  chest: ["................", "................", "................", ".35555555555553.", ".35555555555553.", ".35555555555553.", ".35555577555553.", ".32222277222223.", ".34444477444443.", ".3444447l444443.", ".34444444444443.", ".34444444444443.", ".34444444444443.", ".34444444444443.", ".32222222222223.", "................"],
  // ml integration: a potion
  potion: ["................", "................", ".......cc.......", ".......kk.......", "......6666......", ".......66.......", "......6..6......", ".....6....6.....", "....6.7....6....", "....6.....56....", "....67555556....", "....65555556....", ".....655556.....", "......6666......", "................", "................"],
  // jobee: a bee
  bee: ["................", "................", "................", "......55..55....", ".....5665566.5..", ".....5665.665...", "......55..55....", "..3..7272727....", ".3337272727277..", ".3e33272727277.3", ".3333272727277..", "..33..7272727...", ".......3...3....", "................", "................", "................"],
  // side projects: a copper wrench
  wrench: ["................", "..........66..6.", ".........677..76", ".........677.776", ".........677776.", "........67776...", ".......677......", "......677.......", ".....677........", "....677.........", "...677..........", "..677...........", ".6776...........", ".666............", "................", "................"],
  // the crafting arrow
  arrow: ["................", "................", "................", "..........3.....", "..........33....", "..........333...", ".33333333333333.", ".333333333333333", ".33333333333333.", "..........333...", "..........33....", "..........3.....", "................", "................", "................", "................"],
};

const ART_COLOURS = {
  terminal: { g: MC.gold },
  book: { 3: SHADE.leatherDark, 5: SHADE.leather, 6: SHADE.leatherLit, 7: MC.paper },
  plane: { 3: SHADE.diamondDark, 5: "#7fd4dc", 6: "#bdeef2", 7: "#ffffff" },
  gem: { 4: SHADE.diamondDark, 5: MC.diamond, 6: SHADE.diamondLit, 7: "#dcfcfd" },
  team: { h: "#a87a56", b: "#6b5bb0", H: "#d8a47a", B: SHADE.diamondDark },
  pickaxe: { 3: MC.log, 4: MC.planks, 5: "#a8a8a8", 6: SHADE.ironItem, 7: "#f4f4f4" },
  chest: { 2: MC.dirt3, 3: MC.ink, 4: MC.planks, 5: SHADE.plankLit, 7: SHADE.ironItem, l: "#8a8a8a" },
  potion: { 5: "#cd5cab", 6: "#c8dce8", 7: "#ffffff", c: SHADE.plankLit, k: MC.planks },
  bee: { 2: MC.ink, 3: MC.dirt3, 5: "#a8cfe4", 6: "#e8f6fc", 7: "#f2c43c", e: "#ffffff" },
  wrench: { 6: "#b4583a", 7: "#e8875f" },
};

// story: painted with a few calls -----------------------------------------------------
// one character per pixel: a hex digit is a grey (0 black, f white), a letter one of
// these, "." clear
const STORY_PALETTE = {
  P: MC.planks, p: MC.planks2, Q: SHADE.plankLit, q: SHADE.plankSeam, h: "#2e2010", L: MC.log, l: SHADE.logDark,
  k: SHADE.leather, j: SHADE.leatherDark, n: MC.paper, m: MC.paperEdge, i: MC.ink,
  y: MC.goldBlock, Y: SHADE.goldDark, z: SHADE.goldLit,
  s: MC.diamond, S: SHADE.diamondDark, v: MC.lapis, w: SHADE.lapisLit, r: MC.redstone, R: MC.redstone2,
  o: MC.gold, t: MC.green, T: MC.darkGreen,
};
const storyColour = (g) => STORY_PALETTE[g] ?? (/^[0-9a-f]$/.test(g) ? `#${g.repeat(6)}` : null);

// paint(w, h, p => { p.rect(..); p.dot(..); p.line(..); p.disc(..); p.rows(..) }), the
// story's painter: draw new sprites in the same hand with it. returns a sprite
export function paint(w, h, draw, colour = storyColour) {
  const grid = Array.from({ length: h }, () => Array(w).fill("."));
  const dot = (x, y, g) => {
    if (x >= 0 && y >= 0 && x < w && y < h) grid[y][x] = g;
  };
  const p = {
    dot,
    rect: (x, y, rw, rh, g) => {
      for (let j = y; j < y + rh; j++) for (let i = x; i < x + rw; i++) dot(i, j, g);
    },
    // bresenham, both ends in
    line: (x0, y0, x1, y1, g) => {
      const dx = Math.abs(x1 - x0);
      const dy = -Math.abs(y1 - y0);
      const sx = x0 < x1 ? 1 : -1;
      const sy = y0 < y1 ? 1 : -1;
      let err = dx + dy;
      for (;;) {
        dot(x0, y0, g);
        if (x0 === x1 && y0 === y1) break;
        const e2 = 2 * err;
        if (e2 >= dy) {
          err += dy;
          x0 += sx;
        }
        if (e2 <= dx) {
          err += dx;
          y0 += sy;
        }
      }
    },
    // every pixel whose centre is inside the circle
    disc: (cx, cy, r, g) => {
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if ((i + 0.5 - cx) ** 2 + (j + 0.5 - cy) ** 2 <= r * r) dot(i, j, g);
    },
    // literal rows, "." leaves what is under it
    rows: (y, lines) => lines.forEach((line, j) => [...line].forEach((g, i) => g !== "." && dot(i, y + j, g))),
  };
  draw(p);
  return { w, h, px: grid.map((row) => row.map((g) => (g === "." ? null : colour(g)))) };
}

const STORY = {
  // it started with games: a pad, its buttons red
  games: paint(16, 16, (p) =>
    p.rows(3, ["...3333333333...", "..3cccccccccc3..", ".3cc4ccccccrcc3.", ".3c444ccccrcrc3.", ".3cc4ccccccrcc3.", ".3cccc2cc2cccc3.", ".3cccccccccccc3.", ".3ccc333333ccc3.", ".3cc3......3cc3.", "..33........33.."]),
  ),
  // the first invoice: a chest, the first loot
  "first-client": paint(16, 16, (p) => {
    p.rect(1, 3, 14, 11, "h");
    p.rect(2, 4, 12, 3, "P");
    p.rect(2, 4, 12, 1, "Q");
    p.rect(2, 8, 12, 5, "p");
    p.rect(2, 11, 12, 1, "q");
    p.rect(1, 7, 14, 1, "h");
    p.rect(7, 6, 2, 3, "d");
    p.rect(7, 7, 2, 1, "6");
  }),
  // olympiads: a gold medal on a blue ribbon
  olympiad: paint(16, 16, (p) => {
    p.rows(0, ["...vvw....wvv...", "....vvw..wvv....", "....vvw..wvv....", ".....vvwwvv.....", "......vwwv......"]);
    p.disc(8, 10.5, 4.6, "Y");
    p.disc(8, 10.5, 3.6, "y");
    p.rect(6, 8, 2, 2, "z");
    p.rect(7, 12, 3, 1, "Y");
  }),
  // robotics: a robot's head, a redstone light on its aerial, diamond eyes
  robotics: paint(16, 16, (p) => {
    p.rect(7, 0, 2, 2, "r");
    p.dot(8, 1, "R");
    p.rect(7, 2, 2, 2, "6");
    p.rect(8, 2, 1, 2, "4");
    p.rect(1, 4, 14, 11, "3");
    p.rect(2, 5, 12, 9, "b");
    p.rect(2, 5, 12, 1, "e");
    p.rect(2, 5, 1, 9, "d");
    p.rect(13, 6, 1, 8, "8");
    p.rect(3, 13, 11, 1, "8");
    p.rect(3, 7, 10, 3, "2");
    p.rect(4, 8, 2, 1, "s");
    p.rect(10, 8, 2, 1, "s");
    p.dot(5, 8, "S");
    p.dot(11, 8, "S");
    p.rect(5, 11, 6, 1, "5");
    p.rect(0, 8, 1, 3, "7");
    p.rect(15, 8, 1, 3, "5");
    p.rect(5, 15, 6, 1, "5");
  }),
  // the academies: a book, brown leather and paper
  harvard: paint(16, 16, (p) => {
    p.rect(3, 1, 10, 14, "h");
    p.rect(4, 2, 8, 11, "k");
    p.rect(4, 2, 1, 11, "j");
    p.rect(4, 13, 8, 1, "n");
    p.rect(6, 4, 5, 2, "n");
    p.rect(6, 7, 4, 1, "m");
  }),
  // a studio: the workbench, with a hammer hung on it
  studio: paint(16, 16, (p) => {
    p.rect(1, 2, 14, 13, "h");
    p.rect(2, 3, 12, 4, "Q");
    p.rect(6, 3, 1, 4, "p");
    p.rect(10, 3, 1, 4, "p");
    p.rect(2, 5, 12, 1, "p");
    p.rect(2, 7, 12, 7, "P");
    p.rect(2, 7, 12, 1, "q");
    p.rect(3, 9, 4, 2, "c");
    p.rect(4, 11, 2, 2, "l");
    p.rect(9, 9, 1, 4, "l");
    p.rect(11, 9, 1, 4, "l");
  }),
  // astana hub: a screen with a green prompt on it
  "astana-hub": paint(16, 16, (p) => {
    p.rect(1, 1, 14, 11, "5");
    p.rect(2, 2, 12, 9, "1");
    p.dot(3, 4, "t");
    p.dot(4, 5, "t");
    p.dot(3, 6, "t");
    p.rect(6, 6, 3, 1, "t");
    p.rect(3, 8, 7, 1, "T");
    p.rect(7, 12, 2, 2, "5");
    p.rect(4, 14, 8, 1, "7");
  }),
  // all in on agentmash: a launch. red nose and fins, a diamond window, a gold flame
  "digital-bridge": paint(16, 16, (p) => {
    p.rect(6, 1, 4, 10, "e");
    p.rect(6, 1, 1, 10, "c");
    p.dot(7, 0, "R");
    p.dot(8, 0, "r");
    p.rect(7, 1, 3, 1, "r");
    p.dot(6, 1, "R");
    p.rect(7, 4, 2, 2, "s");
    p.dot(8, 5, "S");
    p.rect(4, 7, 2, 4, "R");
    p.dot(5, 6, "R");
    p.rect(10, 7, 2, 4, "r");
    p.dot(10, 6, "r");
    p.rect(6, 11, 4, 1, "6");
    p.rect(7, 12, 2, 2, "y");
    p.dot(6, 12, "o");
    p.dot(9, 12, "o");
    p.rect(7, 14, 2, 1, "o");
  }),
  // the pitch in one slide: a sign, planks on a log post
  pitch: paint(16, 16, (p) => {
    p.rect(1, 2, 14, 8, "q");
    p.rect(2, 3, 12, 6, "P");
    p.rect(2, 3, 12, 1, "Q");
    p.rect(3, 4, 9, 1, "i");
    p.rect(3, 6, 7, 1, "i");
    p.rect(7, 10, 2, 5, "L");
    p.rect(8, 10, 1, 5, "l");
  }),
  // off the clock: the guitar, honey wood
  "off-the-clock": paint(16, 16, (p) => {
    p.disc(5, 11, 3.7, "Q");
    p.disc(7.5, 8, 2.7, "Q");
    p.line(8, 7, 13, 2, "L");
    p.line(9, 7, 14, 2, "l");
    p.rect(13, 0, 3, 2, "q");
    p.rect(4, 9, 3, 1, "1");
    p.rect(3, 12, 3, 1, "h");
    p.dot(9, 7, "l");
  }),
  // the stone block with diamond in it, for a chapter with no item of its own
  block: paint(16, 16, (p) => {
    p.rect(1, 1, 14, 14, "7");
    p.rect(1, 1, 14, 1, "9");
    p.rect(1, 14, 14, 1, "5");
    [[3, 4], [9, 3], [12, 7], [5, 9], [10, 11], [3, 12]].forEach(([x, y]) => p.rect(x, y, 2, 1, "5"));
    p.rect(7, 6, 2, 2, "s");
    p.dot(8, 7, "S");
    p.dot(11, 9, "s");
  }),
  // the sign at the end of the walk: planks, an ink arrow, a log post
  "end-sign": paint(16, 16, (p) => {
    p.rect(1, 2, 14, 8, "q");
    p.rect(2, 3, 12, 6, "P");
    p.rect(2, 3, 12, 1, "Q");
    p.rect(3, 6, 8, 1, "i");
    p.line(8, 4, 10, 6, "i");
    p.line(10, 6, 8, 8, "i");
    p.rect(7, 10, 2, 5, "L");
    p.rect(8, 10, 1, 5, "l");
  }),
};

// the player, 12 x 16, facing right, in greys with a diamond pick. four poses
const body = (p) => {
  p.rect(3, 0, 5, 2, "6");
  p.rect(3, 2, 1, 2, "6");
  p.rect(4, 2, 4, 3, "c");
  p.dot(3, 4, "c");
  p.dot(6, 2, "1");
  p.rect(4, 5, 3, 5, "e");
  p.rect(4, 10, 3, 2, "5");
};
const feet = (p) => {
  p.rect(4, 12, 3, 3, "5");
  p.rect(4, 15, 4, 1, "3");
};
const PLAYER = {
  stand: paint(12, 16, (p) => {
    body(p);
    feet(p);
    p.rect(5, 7, 1, 2, "a");
    p.dot(5, 9, "c");
  }),
  stride: paint(12, 16, (p) => {
    body(p);
    p.rect(3, 12, 2, 1, "4");
    p.rect(2, 13, 2, 2, "4");
    p.rect(1, 15, 3, 1, "2");
    p.rect(5, 12, 2, 1, "5");
    p.rect(6, 13, 2, 2, "5");
    p.rect(6, 15, 3, 1, "3");
    p.dot(6, 7, "a");
    p.dot(7, 8, "a");
    p.dot(8, 9, "c");
  }),
  up: paint(12, 16, (p) => {
    body(p);
    feet(p);
    p.dot(6, 5, "a");
    p.dot(7, 4, "a");
    p.dot(8, 3, "c");
    p.line(8, 3, 10, 1, "P");
    p.rect(8, 0, 3, 1, "s");
    p.dot(11, 1, "S");
    p.dot(7, 1, "S");
  }),
  down: paint(12, 16, (p) => {
    body(p);
    feet(p);
    p.rect(6, 7, 2, 1, "a");
    p.dot(8, 7, "c");
    p.rect(9, 7, 2, 1, "P");
    p.rect(11, 5, 1, 5, "s");
    p.dot(10, 5, "S");
    p.dot(10, 9, "S");
  }),
};

// blocks: the story's seeded textures ----------------------------------------------------

// mulberry32, as on the site
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

const T = 16;
const sc = ([r, g, b], k) => [r * k, g * k, b * k];
const mx = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const STONE = [MC.stone, MC.stone2, MC.stone3].map(rgb);
const DIRT = [MC.dirt, MC.dirt2, MC.dirt3].map(rgb);
const GRASS = [MC.grass, MC.grass2, MC.grass3].map(rgb);
const fleck = (h) => {
  const c = rgb(h);
  return [mx(c, [255, 255, 255], 0.35), c, sc(c, 0.62)];
};
const ORES = {
  coal: ["#4a4a4a", "#2c2c2c", "#151515"].map(rgb),
  iron: fleck(MC.iron),
  gold: fleck(MC.goldBlock),
  diamond: fleck(MC.diamond),
  emerald: fleck(MC.emerald),
  redstone: [rgb("#ff5050"), rgb(MC.redstone), rgb(MC.redstone2)],
  lapis: [rgb(SHADE.lapisLit), rgb(MC.lapis), rgb("#143579")],
};
export const BLOCK_KINDS = ["stone", "dirt", "grass", ...Object.keys(ORES)];

// one block's 16 x 16 texture: texels from the block's shades, darker streaks, lighter
// flecks or an ore's clusters, a ragged grass fringe on a grass side, and a one-texel
// bevel (lit top-left, shaded bottom-right). same seed, same block, every time
export function blockTexture(kind, seed = 101) {
  if (!BLOCK_KINDS.includes(kind)) throw new Error(`sprites: no block "${kind}" (${BLOCK_KINDS.join(", ")})`);
  const r = rng(seed);
  const px = new Float32Array(T * T * 3);
  const set = (x, y, c) => px.set([c[0], c[1], c[2]], (y * T + x) * 3);
  const get = (x, y) => {
    const i = (y * T + x) * 3;
    return [px[i], px[i + 1], px[i + 2]];
  };
  const soil = kind === "dirt" || kind === "grass";
  const shades = soil ? DIRT : STONE;
  for (let y = 0; y < T; y++) {
    for (let x = 0; x < T; x++) {
      const n = r();
      const c = n < 0.55 ? shades[0] : n < 0.82 ? shades[1] : soil && n < 0.92 ? sc(shades[0], 1.12) : shades[2];
      set(x, y, sc(c, 0.97 + r() * 0.06));
    }
  }
  const streaks = soil ? 6 : 5;
  for (let s = 0; s < streaks; s++) {
    const y = Math.floor(r() * T);
    const x0 = Math.floor(r() * T);
    const len = 2 + Math.floor(r() * 4);
    for (let x = x0; x < Math.min(T, x0 + len); x++) set(x, y, sc(get(x, y), soil ? 0.86 : 0.82));
  }
  if (kind === "stone" || kind === "dirt") {
    for (let f = 0; f < 6; f++) {
      const x = Math.floor(r() * T);
      const y = Math.floor(r() * T);
      set(x, y, sc(get(x, y), 1.14));
    }
  } else if (kind !== "grass") {
    const [lit, mid, dark] = ORES[kind];
    const cells = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    for (const cell of cells.slice(0, 5)) {
      const x = Math.max(1, Math.min(T - 3, 2 + (cell % 3) * 5 + Math.floor(r() * 3) - 1));
      const y = Math.max(1, Math.min(T - 3, 2 + Math.floor(cell / 3) * 5 + Math.floor(r() * 3) - 1));
      set(x, y, lit);
      set(x + 1, y, mid);
      set(x, y + 1, mid);
      set(x + 1, y + 1, r() < 0.6 ? dark : mid);
      if (r() < 0.5) set(x - 1, y + (r() < 0.5 ? 0 : 1), dark);
      if (r() < 0.4) set(x + 2, y + 1, mid);
    }
  }
  if (kind === "grass") {
    for (let x = 0; x < T; x++) {
      const n = r();
      const depth = 2 + (n < 0.75 ? 1 : 0) + (n < 0.35 ? 1 : 0) + (n < 0.08 ? 1 : 0);
      for (let y = 0; y < depth; y++) {
        const g = r();
        set(x, y, g < 0.5 ? GRASS[0] : g < 0.8 ? GRASS[1] : GRASS[2]);
      }
    }
  }
  for (let i = 0; i < T; i++) {
    set(i, 0, sc(get(i, 0), 1.12));
    set(0, i, sc(get(0, i), 1.07));
    set(i, T - 1, sc(get(i, T - 1), 0.78));
    set(T - 1, i, sc(get(T - 1, i), 0.85));
  }
  return { w: T, h: T, px: Array.from({ length: T }, (_, y) => Array.from({ length: T }, (_, x) => hex(get(x, y)))) };
}

// the site's atlas: stone x4, dirt x2, grass x2, one stone per ore, seeds 101 + 17i
const ATLAS = ["stone", "stone", "stone", "stone", "dirt", "dirt", "grass", "grass", ...Object.keys(ORES)];
const BLOCKS = {};
ATLAS.forEach((kind, i) => {
  const n = ATLAS.slice(0, i).filter((k) => k === kind).length;
  const tex = blockTexture(kind, 101 + i * 17);
  if (!BLOCKS[kind]) BLOCKS[kind] = tex;
  if (ATLAS.filter((k) => k === kind).length > 1) BLOCKS[`${kind}-${n}`] = tex;
});

// the registry ---------------------------------------------------------------------------

const reg = (set, entries, f) => Object.entries(entries).map(([k, v]) => [`${set}/${k}`, f(k, v)]);
export const SPRITES = Object.fromEntries([
  ...reg("hud", HUD, (k, rows) => fromRows(rows, { ...GREYS12, ...HUD_COLOURS[k] })),
  ...reg("art", ART, (k, rows) => fromRows(rows, { ...GREYS16, ...ART_COLOURS[k] })),
  ...reg("story", STORY, (_, s) => s),
  ...reg("player", PLAYER, (_, s) => s),
  ...reg("block", BLOCKS, (_, s) => s),
]);

export const SPRITE_NAMES = Object.keys(SPRITES);

export function sprite(name) {
  if (typeof name !== "string") return name;
  const s = SPRITES[name];
  if (!s) throw new Error(`sprites: no "${name}". there are: ${SPRITE_NAMES.join(" ")}`);
  return s;
}

// a sprite as rects: runs of one colour along a row, then runs stacked straight down
// merged into one taller rect. [{ x, y, w, h, fill }] in sprite pixels
export function rects(s) {
  const out = [];
  let open = new Map(); // "x,w,fill" -> the rect still growing down
  s.px.forEach((row, y) => {
    const next = new Map();
    let x = 0;
    while (x < row.length) {
      const fill = row[x];
      let end = x + 1;
      while (end < row.length && row[end] === fill) end++;
      if (fill) {
        const k = `${x},${end - x},${fill}`;
        const r = open.get(k);
        if (r && r.y + r.h === y) {
          r.h++;
          next.set(k, r);
        } else {
          const nr = { x, y, w: end - x, h: 1, fill };
          out.push(nr);
          next.set(k, nr);
        }
      }
      x = end;
    }
    open = next;
  });
  return out;
}

// one path per colour, in sprite pixels
function paths(s) {
  const byFill = new Map();
  for (const r of rects(s)) byFill.set(r.fill, `${byFill.get(r.fill) ?? ""}M${r.x} ${r.y}h${r.w}v${r.h}h-${r.w}z`);
  return [...byFill].map(([fill, d]) => `<path fill="${fill}" d="${d}"/>`).join("");
}
const pathCache = new Map();

// a sprite as a png (rgba, clear stays clear), for the noisy ones: a block texture is ~5kb
// as paths and ~0.6kb as a png. no deps: node's zlib and a crc table
const CRC = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const out = Buffer.alloc(td.length + 8);
  out.writeUInt32BE(data.length, 0);
  td.copy(out, 4);
  out.writeUInt32BE(crc32(td), td.length + 4);
  return out;
};
export function spritePng(name) {
  const s = sprite(name);
  const stride = 1 + s.w * 4;
  const raw = Buffer.alloc(s.h * stride);
  s.px.forEach((row, y) => row.forEach((c, x) => c && raw.set([...rgb(c), 255], y * stride + 1 + x * 4)));
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(s.w, 0);
  ihdr.writeUInt32BE(s.h, 4);
  ihdr[8] = 8; // bits per channel
  ihdr[9] = 6; // rgba
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
const pngCache = new Map();

// draws a sprite (a name from SPRITES, or a sprite) at x, y, each pixel scale px square.
// whole-number scales stay crisp. flip mirrors it (the player walking left). png: true
// embeds it as a pixelated png <image> instead of paths (use it for block textures).
// cls and opacity land on the group. returns { svg, w, h }, and ${it} is the svg
export function drawSprite(name, { x = 0, y = 0, scale = 2, flip = false, png = false, cls, opacity } = {}) {
  const s = sprite(name);
  const key = typeof name === "string" ? name : null;
  const w = s.w * scale;
  const h = s.h * scale;
  const extra = `${cls ? ` class="${cls}"` : ""}${opacity != null ? ` opacity="${opacity}"` : ""}`;
  let svg;
  if (png) {
    let uri = key && pngCache.get(key);
    if (!uri) {
      uri = `data:image/png;base64,${spritePng(s).toString("base64")}`;
      if (key) pngCache.set(key, uri);
    }
    const t = flip ? ` transform="translate(${2 * x + w} 0) scale(-1 1)"` : "";
    svg = `<image x="${x}" y="${y}" width="${w}" height="${h}" href="${uri}" style="image-rendering:pixelated"${t}${extra}/>`;
  } else {
    let inner = key && pathCache.get(key);
    if (!inner) {
      inner = paths(s);
      if (key) pathCache.set(key, inner);
    }
    const t = flip ? `translate(${x + w} ${y}) scale(${-scale} ${scale})` : `translate(${x} ${y}) scale(${scale})`;
    svg = `<g transform="${t}" shape-rendering="crispEdges"${extra}>${inner}</g>`;
  }
  return { svg, w, h, toString: () => svg };
}

// a sprite drawn many times: put spriteDef() once inside <defs>, then useSprite() it
// wherever it goes. the copies cost a few bytes each
export const spriteDef = (name, id, opts = {}) => `<g id="${id}">${drawSprite(name, { ...opts, x: 0, y: 0 }).svg}</g>`;
export const useSprite = (id, x = 0, y = 0, cls) => `<use href="#${id}" x="${x}" y="${y}"${cls ? ` class="${cls}"` : ""}/>`;

// the commit wall's blocks (Commits.module.css), five levels, the busier the day the
// richer the block: 0 air (a dim dot), 1 grass on dirt, 2 leaves, 3 emerald ore,
// 4 a block of emerald. 5 x 5 texels of tx px each, plus the wall's bevel (a white
// lift top and left, a shade bottom and right, bevel px wide)
export const COMMIT_LEVELS = ["air", "grass", "leaves", "emerald ore", "emerald block"];
const COMMIT = [
  null,
  fromRows(["ggggg", "ggggg", "dgdgd", "ddDdd", "ddddd"], { g: MC.grass, d: MC.dirt, D: MC.dirt3 }),
  fromRows(["LLLLL", "LLLSL", "LLLLL", "LHLLL", "LLLLL"], { L: MC.leaves, S: mix(MC.leaves, "#ffffff", 0.22), H: mix(MC.leaves, "#000000", 0.3) }),
  fromRows(["sssts", "slsss", "ssses", "sksss", "sssss"], {
    s: MC.stone,
    t: MC.stone2,
    e: MC.emerald,
    l: mix(MC.emerald, "#ffffff", 0.35),
    k: mix(MC.emerald, "#000000", 0.38),
  }),
  fromRows(["eeeee", "eleke", "eeeee", "eeeke", "eeeee"], {
    e: MC.emerald,
    l: mix(MC.emerald, "#ffffff", 0.35),
    k: mix(MC.emerald, "#000000", 0.38),
  }),
];

export function commitBlock(level, { x = 0, y = 0, tx = 2, bevel = Math.max(1, Math.round(tx / 2)), cls } = {}) {
  const size = 5 * tx;
  const c = cls ? ` class="${cls}"` : "";
  let svg;
  if (!level) {
    svg = `<rect${c} x="${x + 2 * tx}" y="${y + 2 * tx}" width="${tx}" height="${tx}" fill="${INK.border2}" shape-rendering="crispEdges"/>`;
  } else {
    const b = bevel;
    svg =
      `<g${c} shape-rendering="crispEdges">` +
      drawSprite(COMMIT[Math.min(4, level)], { x, y, scale: tx }).svg +
      `<path fill="#000" fill-opacity=".32" d="M${x} ${y + size - b}h${size}v${b}h-${size}zM${x + size - b} ${y}h${b}v${size - b}h-${b}z"/>` +
      `<path fill="#fff" fill-opacity=".22" d="M${x} ${y}h${size}v${b}h-${size}zM${x} ${y + b}h${b}v${size - b}h-${b}z"/>` +
      `</g>`;
  }
  return { svg, w: size, h: size, toString: () => svg };
}
