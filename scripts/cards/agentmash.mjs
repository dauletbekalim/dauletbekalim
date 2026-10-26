// now: agentmash, as the site's crafting gui (components/sections/Craft.tsx). the agents
// agentmash works with and your team go in a 3 x 3 grid, the arrow fills, agentmash comes
// out enchanted (the purple glint), and the pointer on it holds its tooltip open beside
// the recipe: the name in the enchanted aqua, the one-liner, then status, works with and
// pricing. the lore is set in the mono like the site's (sentences read better in it).
// motion: the ingredients drop in, the arrow fills, the output lands, the tooltip opens,
// then the glint sweeps every few seconds. reduced motion: the finished recipe, still.
//
// two cuts: the wide one (820 at g 3, the tooltip beside the recipe, 24px words), and a
// phone one (410 at g 2, the tooltip under the recipe, 16px words) that the readme's
// <picture> swaps in under 600px, where the wide one would shrink its words to ~9px.

import { button, panel, pxText, slot } from "../lib/frames.mjs";
import { INK, MC } from "../lib/palette.mjs";
import { drawSprite, sprite } from "../lib/sprites.mjs";
import { svgDoc, uid } from "../lib/svg.mjs";
import { MARK_PNG } from "./art.mjs";
import { AGENTMASH } from "./copy.mjs";
import { delay, factLines, monoRuns, POP, tipFrame, wrapChars } from "./kit.mjs";

const CUTS = {
  wide: { file: "agentmash", W: 820, g: 3, m: 4, MONO: 24, LH: 31, SIZE: 24, stacked: false },
  phone: { file: "agentmash-phone", W: 410, g: 2, m: 2, MONO: 16, LH: 21, SIZE: 16, stacked: true },
};

// the order the ingredients drop in: the ring's corners, its edges, the team last
const DROP = [0, 2, 6, 8, 1, 7, 4];

// a sprite with every pixel white: the arrow once it's filled
const white = (s) => ({ ...s, px: s.px.map((row) => row.map((c) => (c ? "#ffffff" : null))) });

function draw({ file, W, g, m, MONO, LH, SIZE, stacked }) {
  const M = m * g; // the black round the panel
  const P = 6 * g; // the panel's padding
  const SLOT = 18 * g; // the game's crafting slot, a 16-unit item inside a 1-unit bevel
  const OUT = 26 * g; // the output slot
  const lineH = SIZE * 1.25;

  // the left side (or, stacked, the top, centred): the label, the recipe, the button
  const recipeW = 3 * SLOT + 5 * g + 16 * g + 5 * g + OUT;
  const leftH = lineH + 4 * g + 3 * SLOT + 8 * g + 20 * g;
  const L = stacked ? Math.round((W - recipeW) / 2) : M + P + 3 * g;

  // the tooltip: beside the recipe, or under it across the panel when stacked (a phone
  // line gets every character it can). its text sets the height
  const tipX = stacked ? M + 2 * g : L + recipeW + 6 * g;
  const tipW = stacked ? W - 2 * tipX : W - M - P - tipX + 3 * g;
  const n = Math.floor((tipW - 8 * g) / (0.6 * MONO));
  const rows = [
    ...wrapChars(AGENTMASH.oneLiner, n).map((l) => [[l, INK.text]]),
    null,
    ...AGENTMASH.facts.flatMap((f, i) => [...(i ? [null] : []), ...factLines(f, n)]),
  ];
  const gap = 2 * g;
  const tipH = 4 * g + lineH + 3 * g + rows.reduce((h, r) => h + (r ? LH : gap), 0) + 4 * g;
  const top = stacked ? M + P : null;
  const tipY = stacked ? M + P + leftH + 8 * g : M + P - g;
  const H = stacked ? tipY + tipH + 2 * g + M : M + P + tipH + P + M - 2 * g;

  const parts = [panel({ x: M, y: M, w: W - 2 * M, h: H - 2 * M, g })];

  // wide: the recipe centred down the panel. stacked: at the top
  const y0 = top ?? Math.round(M + (H - 2 * M - leftH) / 2);
  parts.push(pxText(AGENTMASH.label, { x: L, y: y0, size: SIZE, color: INK.dim, shadow: false }));
  const gy = y0 + lineH + 4 * g;

  // the grid: slots first, then the items over them so each can pop on its own
  AGENTMASH.grid.forEach((name, i) => {
    const x = L + (i % 3) * SLOT;
    const y = gy + Math.floor(i / 3) * SLOT;
    parts.push(slot({ x, y, g, size: SLOT }));
    if (!name) return;
    const s = sprite(name);
    const k = Math.floor((SLOT - 2 * g) / s.w);
    const art = drawSprite(name, { x: x + (SLOT - s.w * k) / 2, y: y + (SLOT - s.h * k) / 2, scale: k });
    parts.push(`<g class="pop"${delay(0.25 + DROP.indexOf(i) * 0.14)}>${art}</g>`);
  });

  // the arrow, grey, and a white copy over it that fills from the left
  const ax = L + 3 * SLOT + 5 * g;
  const ay = gy + (3 * SLOT) / 2 - 8 * g;
  const clip = uid("fill");
  parts.push(drawSprite("art/arrow", { x: ax, y: ay, scale: g }));
  parts.push(
    `<clipPath id="${clip}"><rect class="fill" x="${ax}" y="${ay}" width="${16 * g}" height="${16 * g}"/></clipPath>` +
      `<g clip-path="url(#${clip})">${drawSprite(white(sprite("art/arrow")), { x: ax, y: ay, scale: g })}</g>`,
  );

  // the output: agentmash's own mark, its glint clipped to the mark's rounded tile
  const ox = ax + 16 * g + 5 * g;
  const oy = gy + (3 * SLOT - OUT) / 2;
  const mk = 20 * g;
  const mx = ox + (OUT - mk) / 2;
  const my = oy + (OUT - mk) / 2;
  const gid = uid("glint");
  const tile = uid("tile");
  parts.push(slot({ x: ox, y: oy, g, size: OUT }));
  parts.push(
    `<g class="pop out">` +
      `<image x="${mx}" y="${my}" width="${mk}" height="${mk}" href="${MARK_PNG}"/>` +
      `<defs><clipPath id="${tile}"><rect x="${mx}" y="${my}" width="${mk}" height="${mk}" rx="${mk / 4}"/></clipPath>` +
      `<linearGradient id="${gid}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8040ff" stop-opacity="0"/><stop offset=".35" stop-color="#8040ff" stop-opacity=".5"/><stop offset=".5" stop-color="#be8cff" stop-opacity=".7"/><stop offset=".65" stop-color="#8040ff" stop-opacity=".5"/><stop offset="1" stop-color="#8040ff" stop-opacity="0"/></linearGradient></defs>` +
      `<g clip-path="url(#${tile})"><g class="glint"><rect x="${mx + mk / 2 - 14}" y="${my - 20}" width="28" height="${mk + 40}" fill="url(#${gid})" transform="rotate(25 ${mx + mk / 2} ${my + mk / 2})"/></g></g>` +
      `</g>`,
  );

  // the pointer resting on it (the cursor art's tip is its pixel 4, 0)
  parts.push(drawSprite("art/cursor", { x: ox + OUT - 6 * g - 4 * 2, y: oy + OUT - 8 * g, scale: 2 }));

  // the way in, under the recipe
  parts.push(button({ x: L, y: gy + 3 * SLOT + 8 * g, g, size: SIZE, label: "agentmash.dev ↗", variant: "light" }));

  // the tooltip, open
  const tip = [tipFrame({ x: tipX, y: tipY, w: tipW, h: tipH, g })];
  const tx = tipX + 5 * g;
  let y = tipY + 4 * g;
  tip.push(pxText(AGENTMASH.name, { x: tx, y, size: SIZE, color: MC.aqua }));
  y += lineH + 3 * g;
  for (const r of rows) {
    if (!r) {
      y += gap;
      continue;
    }
    tip.push(monoRuns(r, { x: tx, y, size: MONO, lh: LH / MONO }));
    y += LH;
  }
  parts.push(`<g class="tipin">${tip.join("")}</g>`);

  const motion = [
    POP,
    `.out{animation-delay:1.55s}`,
    `.fill{transform-box:fill-box;transform-origin:left;animation:fill .6s linear 1.05s both}
@keyframes fill{from{transform:scaleX(0)}}`,
    `.tipin{animation:tipin .5s cubic-bezier(.2,.8,.2,1) 1.85s both}
@keyframes tipin{from{opacity:0;transform:translateY(${2 * g}px)}}`,
    // a band of purple light across the mark, then a rest, like an enchanted item
    `.glint{opacity:1;animation:glint 3.6s linear 2.2s infinite both}
@keyframes glint{from{transform:translateX(${-mk - 20}px)}70%,to{transform:translateX(${mk + 20}px)}}`,
  ].join("\n");

  const svg = svgDoc({
    w: W,
    h: H,
    body: parts.join("\n"),
    css: `.glint{opacity:0}`,
    motion,
    corners: g,
    title: "agentmash, crafted from your team and its AI coding agents",
  });
  return { file, svg, w: W, h: H };
}

export const agentmash = () => Object.values(CUTS).map(draw);
