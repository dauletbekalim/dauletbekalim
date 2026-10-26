// builds the readme's cards into assets/*.svg: the hotbar links, agentmash's crafting
// grid, the advancements, the inventory, the quests and the press page. every one is a
// self-contained svg (its own black panel, its fonts cut down and embedded, motion only
// for people who haven't asked for less), so github can show it through camo.
//
//   node scripts/cards.mjs            all of them
//   node scripts/cards.mjs press      just the ones whose file name has "press" in it
//
// the header and the commits wall come from their own builders.

import { join } from "node:path";
import { ASSETS } from "./lib/paths.mjs";
import { writeSvg } from "./lib/svg.mjs";
import { advancements } from "./cards/advancements.mjs";
import { agentmash } from "./cards/agentmash.mjs";
import { inventory } from "./cards/inventory.mjs";
import { links } from "./cards/links.mjs";
import { press } from "./cards/press.mjs";
import { quests } from "./cards/quests.mjs";

const only = process.argv.slice(2);
const cards = [links, agentmash, advancements, inventory, quests, press].flatMap((build) => build());

for (const card of cards) {
  if (only.length && !only.some((o) => card.file.includes(o))) continue;
  writeSvg(join(ASSETS, `${card.file}.svg`), card.svg);
}
