// a test card for the kit: one panel holding a nametag, a toast, a tooltip, a hotbar, the
// xp bar, the buttons, the splash and a shelf of sprites. not part of the readme; it
// lands in PREVIEW_DIR. run: node scripts/demo.mjs, then render-preview the path it prints

import { join } from "node:path";
import { button, hotbar, MOTION, monoText, nametag, panel, pxText, splash, toast, tooltip, xpBar } from "./lib/frames.mjs";
import { INK, MC } from "./lib/palette.mjs";
import { PREVIEW_DIR } from "./lib/paths.mjs";
import { commitBlock, drawSprite, spriteDef, useSprite } from "./lib/sprites.mjs";
import { svgDoc, writeSvg } from "./lib/svg.mjs";

// 830 wide (the readme column) at g 3, so the 24px text still reads at ~10px on a phone
const W = 830;
const H = 690;
const g = 3;
const L = 48; // the left column
const RX = 500; // the right one
const parts = [panel({ x: 24, y: 24, w: W - 48, h: H - 48, g })];

// the terminal line, the nametag, the splash
const prompt = monoText("alim@wtf:~$ ", { x: L, y: 44, size: 24, color: INK.dim });
const cmd = monoText("whoami", { x: L + prompt.w, y: 44, size: 24, color: INK.paper, weight: 700 });
parts.push(prompt, cmd, monoText("█", { x: L + prompt.w + cmd.w + 14.4, y: 44, size: 24, color: INK.paper, cls: "blink" }));
parts.push(nametag({ x: L, y: 92, text: "alim dauletbek", g: 4 }));
parts.push(splash({ x: 596, y: 90, text: "delusional self-believer!", size: 24, angle: -10 }));

// a toast, and a shelf of items beside it
parts.push(toast({ x: L, y: 168, icon: "story/digital-bridge", text: "all in on agentmash", g }));
let x = RX;
for (const name of ["art/terminal", "art/gem", "story/olympiad", "story/robotics", "player/stand", "hud/camera"]) {
  const s = drawSprite(name, { x, y: 176, scale: 2 });
  parts.push(s);
  x += s.w + 10;
}
x = RX;
for (const name of ["block/grass", "block/stone", "block/diamond", "block/emerald", "block/redstone"]) {
  const s = drawSprite(name, { x, y: 228, scale: 2, png: true });
  parts.push(s);
  x += s.w + 10;
}

// a tooltip, and the commit wall's five blocks beside it
parts.push(
  tooltip({
    x: L,
    y: 290,
    g,
    maxWidth: 380,
    title: "agentmash",
    titleColor: MC.aqua,
    lines: ["one app for your team’s AI coding agents", { text: "closed beta", kind: "attr" }, { text: "agentmash.dev", kind: "dim" }],
  }),
);
for (let l = 0; l <= 4; l++) parts.push(commitBlock(l, { x: RX + l * 40, y: 300, tx: 6 }));
parts.push(pxText("less → more", { x: RX, y: 340, size: 24, color: INK.dimmer, shadow: false }));

// a strip of one block, defined once and used six times
parts.push(`<defs>${spriteDef("block/dirt", "dirt", { scale: 2, png: true })}</defs>`);
for (let i = 0; i < 6; i++) parts.push(useSprite("dirt", RX + i * 32, 400));

// the xp bar over the hotbar, then the buttons
const items = ["hud/bed", "hud/pickaxe", "hud/map", "hud/chest", "hud/block", "hud/book", "hud/table", "hud/plane", "hud/branch"];
const bar = hotbar({ x: L, y: 512, g, items, selected: 1 });
parts.push(xpBar({ x: L, y: 482, w: bar.w, value: 0.72, g, level: 18, fillCls: "xp-grow" }), bar);
x = L;
for (const b of [{ label: "alim.wtf", variant: "light" }, { label: "agentmash.dev" }, { label: "hovered", hover: true }]) {
  const p = button({ x, y: 596, g, ...b });
  parts.push(p);
  x += p.w + 12;
}

const svg = svgDoc({ w: W, h: H, body: parts.join("\n"), title: "kit demo", motion: [MOTION.splash, MOTION.blink, MOTION.xp].join("\n"), corners: g });
const file = join(PREVIEW_DIR, "demo.svg");
writeSvg(file, svg);
console.log(file);
