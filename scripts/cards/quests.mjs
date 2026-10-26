// quests: the public repos, one card each (each its own link). a card is an item in its
// slot with its tooltip open beside it, the way the site's before section shows one: the
// repo's name in a rarity colour, one plain line as its lore (in the mono, a sentence to
// read), and the language as its attribute line in the game's blue. 410 wide at g 2, so
// two sit side by side on a wide readme and a phone gets them one to a line at ~13px.

import { pxText, slot } from "../lib/frames.mjs";
import { INK, MC, UI } from "../lib/palette.mjs";
import { svgDoc } from "../lib/svg.mjs";
import { QUESTS } from "./copy.mjs";
import { item, monoRuns, pxRuns, tipFrame, wrapChars } from "./kit.mjs";

const g = 2;
const W = 410;
const SIZE = 16;
const MONO = 16;
const LH = 21;

export function quests() {
  const M = 2 * g; // the black round it all
  const tipX = M + 20 * g + 4 * g;
  const tipW = W - tipX - M;
  const n = Math.floor((tipW - 10 * g) / (0.6 * MONO));
  // every card as tall as the tallest, so a row of them lines up
  const lore = QUESTS.map((q) => wrapChars(q.line, n));
  const most = Math.max(...lore.map((l) => l.length));
  const tipH = 4 * g + 20 + 3 * g + most * LH + 2 * g + 20 + 4 * g;
  const H = tipH + 2 * M;

  return QUESTS.map((q, i) => {
    const parts = [slot({ x: M, y: M, g, item: item(q.item) })];
    parts.push(tipFrame({ x: tipX, y: M, w: tipW, h: tipH, g }));
    const tx = tipX + 5 * g;
    let y = M + 4 * g;
    parts.push(pxText(q.name, { x: tx, y, size: SIZE, color: MC[q.color] }));
    y += 20 + 3 * g;
    for (const l of lore[i]) {
      parts.push(monoRuns([[l, MC.gray]], { x: tx, y, size: MONO, lh: LH / MONO }));
      y += LH;
    }
    y = M + tipH - 4 * g - 20;
    parts.push(pxRuns([["language: ", INK.dimmer], [q.lang, UI.attr]], { x: tx, y, size: SIZE }));
    // square corners: the cards sit edge to edge, and cut ones would notch the seam
    const svg = svgDoc({ w: W, h: H, body: parts.join("\n"), title: `${q.name}: ${q.line} ${q.lang}.` });
    return { file: q.file, svg, w: W, h: H };
  });
}
