// every word the cards set, in one place, from alim.wtf's content/site.ts and
// content/stories.ts. voice: lowercase, short, plain. no em dashes, and the game is never
// named. the pixel face has no é or cyrillic: "bezier", and the russian headline is drawn
// by lib/pixel-cyrillic.mjs. change a fact here and on the site together.

// the order keeps the long names apart: "x" sits between agentmash and telegram
export const LINKS = [
  { file: "link-alim", label: "alim.wtf", href: "https://alim.wtf", item: "hud/bed" },
  { file: "link-agentmash", label: "agentmash", href: "https://agentmash.dev", item: "hud/pickaxe" },
  { file: "link-x", label: "x", href: "https://x.com/alimwtf", item: "hud/x" },
  { file: "link-telegram", label: "telegram", href: "https://t.me/alimwtf", item: "hud/plane" },
  { file: "link-linkedin", label: "linkedin", href: "https://www.linkedin.com/in/alim-dauletbek/", item: "hud/in" },
  { file: "link-instagram", label: "instagram", href: "https://instagram.com/alim.wtf", item: "hud/camera" },
];

// site.ts AGENTMASH and NOW.facts, word for word
export const AGENTMASH = {
  name: "agentmash",
  oneLiner: "one app for your team’s AI coding agents.",
  facts: [
    // the site adds "request early access on agentmash.dev."; here the button says it
    { label: "status", value: "closed beta." },
    { label: "works with", value: "claude code, codex, cursor, github copilot, gemini and more" },
    { label: "pricing", value: "free for two developers. $20 per developer a month for a team, agents never counted." },
  ],
  // the crafting grid, as the site lays it: three agents, your team between two empty
  // slots, two more agents and "and more"
  grid: ["art/terminal", "art/book", "art/cursor", null, "art/team", null, "art/plane", "art/gem", "art/more"],
  label: "crafting",
};

// one toast each, title (the event) over text (what happened). two columns: school and
// olympiads, then the work. the last is the one not made yet, from the story's last line
export const ADVANCEMENTS = [
  { icon: "flag", title: "IOAI 2025", text: "kazakhstan national team" },
  { icon: "story/robotics", title: "INFOMATRIX-ASIA 2025", text: "2nd place in hardware control" },
  { icon: "bronze", title: "WRO 2025, national stage", text: "3rd place" },
  { icon: "gold", title: "NIS science projects contest", text: "1st place in engineering" },
  { icon: "route", title: "registered scientific patent", text: "bezier localization for a rover" },
  { icon: "trophy", title: "harvard summer program", text: "best overall solution, with jobee" },
  { icon: "art/bee", title: "jobee", text: "$12K raised as cto" },
  { icon: "story/astana-hub", title: "astana hub", text: "youngest swe it has ever had" },
  { icon: "emerald", title: "auditing studio", text: "projected $150K ARR, no ads" },
  { icon: "story/digital-bridge", title: "next stop", text: "san francisco", locked: true },
];

// the stack: content/site.ts SEO.knowsAbout and the terminal's boot line, plus java (the
// rover) and postgres (the old readme)
export const INVENTORY = {
  label: "inventory",
  name: "alim",
  level: 18,
  items: [
    { item: "art/terminal", name: "claude code", kind: "agent" },
    { item: "ts", name: "typescript", kind: "language" },
    { item: "atom", name: "react / next", kind: "frontend" },
    { item: "gear", name: "rust", kind: "language" },
    { item: "snake", name: "python", kind: "language" },
    { item: "art/potion", name: "ML", kind: "my own models" },
    { item: "mug", name: "java", kind: "the rover" },
    { item: "db", name: "postgres", kind: "database" },
  ],
};

// public repos, each its own card and link, two to a row
export const QUESTS = [
  {
    file: "quest-motion-ui-videos",
    name: "motion-ui-videos",
    line: "a claude code skill that makes product videos from your app’s repo.",
    lang: "javascript",
    item: "clapper",
    color: "aqua",
    href: "https://github.com/dauletbekalim/motion-ui-videos",
  },
  {
    file: "quest-active-rover",
    name: "A.C.T.I.V.E.-Rover-code",
    line: "the rover’s pose estimation and control. our INFOMATRIX-ASIA project.",
    lang: "java",
    item: "story/robotics",
    color: "yellow",
    href: "https://github.com/dauletbekalim/A.C.T.I.V.E.-Rover-code",
  },
  {
    file: "quest-narkesken",
    name: "narkesken",
    line: "kazakh speech recognition, a fine-tuned wav2vec2.",
    lang: "python",
    item: "mic",
    color: "lightPurple",
    href: "https://github.com/dauletbekalim/narkesken",
  },
  {
    // this repo: the fourth card squares the grid off, and it's the one place that says
    // nothing here is a hosted card
    file: "quest-profile",
    name: "dauletbekalim",
    line: "this readme. every image on it is drawn by my own scripts.",
    lang: "javascript",
    item: "hud/table",
    color: "green",
    href: "https://github.com/dauletbekalim/dauletbekalim",
  },
];

// site.ts PRESS.items[0]
export const PRESS = {
  outlet: "digital business",
  date: "23 oct 2026",
  page: "page 1 of 1",
  headline: "Парень из Астаны в 18 лет зарабатывает миллионы тенге в месяц на ИТ",
  gloss: "a guy from astana earns millions of tenge a month in IT, at 18",
  quote: "the most important decision was to start taking real orders back in school.",
  also: "also on bitpress.kz and newtimes.kz",
  read: "read the article ↗",
  href: "https://digitalbusiness.kz/2026-10-23/paren-iz-astani-v-18-let-zarabativaet-millioni-tenge-v-mesyats-na-it/",
};
