// the colours, copied from alim.wtf (lib/palette.ts and the --mc-* tokens in
// app/globals.css). black and white underneath; the game's colours only go on game
// things (items, blocks, the xp bar, the tooltip frame, toast titles, the splash).
// change one here, change it on the site too.

// chat and text codes, then the blocks (top, mid, deep), then the written book
export const MC = {
  green: "#55ff55",
  darkGreen: "#00aa00",
  yellow: "#ffff55",
  gold: "#ffaa00",
  aqua: "#55ffff",
  blue: "#5555ff",
  red: "#ff5555",
  lightPurple: "#ff55ff",
  gray: "#aaaaaa",
  darkGray: "#555555",
  grass: "#5d9c3a",
  grass2: "#4a7f2c",
  grass3: "#6fb244",
  dirt: "#866043",
  dirt2: "#6b4a30",
  dirt3: "#5a3d27",
  stone: "#7d7d7d",
  stone2: "#6b6b6b",
  stone3: "#8f8f8f",
  planks: "#9c7f4e",
  planks2: "#7a5f37",
  log: "#6b5233",
  leaves: "#3b7a1f",
  diamond: "#5decf5",
  emerald: "#17dd62",
  goldBlock: "#fcee4b",
  iron: "#d8af93", // the ore's flecks
  redstone: "#ff0000",
  redstone2: "#aa0000",
  lapis: "#1f4fb0",
  paper: "#e8d9b0",
  paperEdge: "#c9b78a",
  ink: "#3a2a17",
};

// the lit and shaded steps more than one drawing needs
export const SHADE = {
  plankLit: "#b39462",
  plankSeam: "#4f3b20",
  logDark: "#4c3a24",
  leather: "#8a5a33",
  leatherLit: "#a8703f",
  leatherDark: "#4a2e18",
  paperDark: "#a88c5a",
  diamondDark: "#2aa8b0",
  diamondLit: "#a4f4f8",
  goldDark: "#b8961c",
  goldLit: "#fffbb0",
  lapisLit: "#3b6fd8",
  ironItem: "#d8d8d8", // an iron tool or latch, not the ore
};

// the page: greys only (r = g = b)
export const INK = {
  bg: "#000",
  bg2: "#050505",
  panel: "#0a0a0a",
  panel2: "#111",
  border: "#262626",
  border2: "#3d3d3d",
  paper: "#fff", // titles
  text: "#e6e6e6", // body copy
  dim: "#a3a3a3",
  dimmer: "#7a7a7a", // 4.9:1 on black, the dimmest text allowed
};

// the game ui kit's own tokens (the dark gui on the black page)
export const UI = {
  panel: "#1c1c1c", // a raised panel's fill
  panelHi: "#3a3a3a", // its lit edge, top and left
  panelLo: "#000", // its shaded edge, bottom and right
  slot: "#0e0e0e", // an inset slot
  slotHi: "#3a3a3a", // lit edge, bottom and right
  slotLo: "#000", // shaded edge, top and left
  btn: "#2e2e2e", // the dark button
  btnHover: "#424242",
  btnHi: "#5c5c5c",
  btnLo: "#161616",
  btnLight: "#c6c6c6", // the light button
  btnLightHover: "#e2e2e2",
  btnLightHi: "#f4f4f4",
  btnLightLo: "#6b6b6b",
  btnInk: "#141414", // dark text on the light button
  frame: "#000", // a button's outer frame (white when hovered)
  tag: "#303030", // the nametag plate, drawn at TAG_OPACITY
  tagOpacity: 0.72,
  barNotch: "#000", // the xp bar's notches, drawn at .55
  toastEdge: "#5a5a5a",
  xp: "#80ff20", // the xp bar's fill and its level number
  xpDark: "#2b4a0e", // the empty track
  tipBg: "#100010", // the tooltip's near-black purple, drawn at .94
  tipEdgeTop: "#5000ff", // its frame, shading top to bottom, drawn at .45
  tipEdgeBottom: "#28007f",
  attr: "#6a6aff", // an attribute line, the game's blue lifted to read
  splash: "#ffff00", // the title screen's splash
  splashShadow: "#3f3f00",
  hoverText: "#ffffa0", // a hovered button's label
  ping: "#00ff21",
};

// colour maths, on #rrggbb strings ----------------------------------------------------

export const rgb = (hex) => {
  let h = hex.replace("#", "");
  if (h.length === 3) h = [...h].map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

export const hex = ([r, g, b]) =>
  "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");

// a toward b by t (0..1), like color-mix(in srgb, a, b t)
export const mix = (a, b, t) => {
  const A = rgb(a);
  const B = rgb(b);
  return hex(A.map((v, i) => v + (B[i] - v) * t));
};

// every channel times k (0.62 shades an ore's fleck, 1.12 lights a block's top edge)
export const scale = (c, k) => hex(rgb(c).map((v) => v * k));

// the pixel text's hard drop: the text's own colour at a quarter brightness (white
// drops #404040), like the game's
export const shadowOf = (c) => scale(c, 0.25);
