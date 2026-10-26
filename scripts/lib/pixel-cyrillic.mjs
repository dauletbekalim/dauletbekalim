// cyrillic for the pixel face, which has none. the site lets russian fall to the system
// mono; in an svg that fallback is whatever the viewer's machine has, so here the
// letters are drawn instead, in the face's own grid: 8 units to the em, a line box of 10,
// capitals on rows 1-7, x-height rows 3-7, descenders rows 8-9, every glyph 5 wide plus
// one unit after it, a space 4. drawn as rects, so they need no font at all. covers what
// the cards set (the press headline) plus the letters around it; add more as needed.

import { piece } from "./frames.mjs";

const lc = (...rows) => [".....", ".....", ".....", ...rows.slice(0, 5), rows[5] ?? ".....", rows[6] ?? "....."];
const cap = (...rows) => [".....", ...rows, ".....", "....."];

const GLYPHS = {
  а: lc(".###.", "....#", ".####", "#...#", ".####"),
  б: [".....", ".####", "#....", "#.##.", "##..#", "#...#", "#...#", ".###.", ".....", "....."],
  в: lc("####.", "#...#", "####.", "#...#", "####."),
  г: lc("#####", "#....", "#....", "#....", "#...."),
  д: lc("..##.", ".#.#.", ".#.#.", ".#.#.", "#####", "#...#"),
  е: lc(".###.", "#...#", "#####", "#....", ".####"),
  ж: lc("#.#.#", "#.#.#", ".###.", "#.#.#", "#.#.#"),
  з: lc("####.", "....#", ".###.", "....#", "####."),
  и: lc("#...#", "#..##", "#.#.#", "##..#", "#...#"),
  й: [".....", ".#.#.", "..#..", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".....", "....."],
  к: lc("#...#", "#..#.", "###..", "#..#.", "#...#"),
  л: lc("..###", ".#..#", ".#..#", ".#..#", "#...#"),
  м: lc("#...#", "##.##", "#.#.#", "#...#", "#...#"),
  н: lc("#...#", "#...#", "#####", "#...#", "#...#"),
  о: lc(".###.", "#...#", "#...#", "#...#", ".###."),
  п: lc("#####", "#...#", "#...#", "#...#", "#...#"),
  р: lc("#.##.", "##..#", "#...#", "#...#", "####.", "#....", "#...."),
  с: lc(".###.", "#...#", "#....", "#...#", ".###."),
  т: lc("#####", "..#..", "..#..", "..#..", "..#.."),
  у: lc("#...#", "#...#", "#...#", "#...#", ".####", "....#", "####."),
  х: lc("#...#", ".#.#.", "..#..", ".#.#.", "#...#"),
  ц: lc("#...#", "#...#", "#...#", "#...#", "#####", "....#"),
  ч: lc("#...#", "#...#", ".####", "....#", "....#"),
  ш: lc("#.#.#", "#.#.#", "#.#.#", "#.#.#", "#####"),
  ы: lc("#...#", "#...#", "###.#", "#.#.#", "###.#"),
  ь: lc("#....", "#....", "####.", "#...#", "####."),
  э: lc(".###.", "#...#", "..###", "#...#", ".###."),
  ю: lc("#.##.", "##..#", "##..#", "##..#", "#.##."),
  я: lc(".####", "#...#", ".####", ".#..#", "#...#"),
  А: cap(".###.", "#...#", "#####", "#...#", "#...#", "#...#", "#...#"),
  В: cap("####.", "#...#", "####.", "#...#", "#...#", "#...#", "####."),
  И: cap("#...#", "#...#", "#..##", "#.#.#", "##..#", "#...#", "#...#"),
  К: cap("#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"),
  М: cap("#...#", "##.##", "#.#.#", "#...#", "#...#", "#...#", "#...#"),
  П: cap("#####", "#...#", "#...#", "#...#", "#...#", "#...#", "#...#"),
  Т: cap("#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."),
  0: cap(".###.", "#...#", "#..##", "#.#.#", "##..#", "#...#", ".###."),
  1: cap("..#..", ".##..", "..#..", "..#..", "..#..", "..#..", "#####"),
  2: cap(".###.", "#...#", "....#", "...#.", "..#..", ".#...", "#####"),
  8: cap(".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."),
  ",": [".", ".", ".", ".", ".", ".", ".", "#", "#", "."],
  ".": [".", ".", ".", ".", ".", ".", ".", "#", ".", "."],
  "-": lc(".....", ".....", "####.", ".....", "....."),
};

const SPACE = 4;
const advance = (ch) => (ch === " " ? SPACE : (GLYPHS[ch]?.[0].length ?? 5) + 1);

// the line's ink width in px (no trailing unit), like frames.mjs inkWidth
export const cyrWidth = (text, size = 16) => {
  const units = [...text].reduce((s, c) => s + advance(c), 0);
  return text.length ? ((units - 1) * size) / 8 : 0;
};

// words onto lines no wider than maxW px
export function cyrWrap(text, maxW, size = 16) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line ? `${line} ${word}` : word;
    if (line && cyrWidth(next, size) > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

// one line, y the top of its line box like pxText. no drop shadow: it sets dark ink on
// the book's paper, where the game's book has none either
export function cyrText(text, { x = 0, y = 0, size = 16, color = "#000" } = {}) {
  const u = size / 8;
  let d = "";
  let cx = x;
  for (const ch of text) {
    const rows = GLYPHS[ch];
    if (!rows && ch !== " ") throw new Error(`pixel-cyrillic: no "${ch}" drawn yet`);
    rows?.forEach((row, j) => {
      // runs of ink along a row, one rect each
      let i = 0;
      while (i < row.length) {
        if (row[i] !== "#") {
          i++;
          continue;
        }
        let e = i;
        while (row[e] === "#") e++;
        d += `M${cx + i * u} ${y + j * u}h${(e - i) * u}v${u}h${-(e - i) * u}z`;
        i = e;
      }
    });
    cx += advance(ch) * u;
  }
  return piece(`<path fill="${color}" shape-rendering="crispEdges" d="${d}"/>`, cyrWidth(text, size), size * 1.25);
}
