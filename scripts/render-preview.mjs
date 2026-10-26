// renders svgs to pngs the way github shows them: as an <img> at a given width, on
// github's page colour, in headless edge. for looking at what we make before it ships.
//
//   node scripts/render-preview.mjs                  every assets/*.svg at 830 and 340
//   node scripts/render-preview.mjs hero cards.svg   just these (names in assets/, or paths)
//   flags: --width 830,340   display widths (the readme column, and a phone)
//          --scale 2         device pixel ratio (2 = a retina screen)
//          --light           github's light page instead of dark
//          --reduced         the still frame: what someone with reduced motion sees
//                            (cdp's media emulation doesn't reach inside an <img>, so
//                            this renders a copy with the motion rules switched off)
//          --wait 1500       ms after load before the shot (let animations settle)
//          --out dir         where the pngs go (default: PREVIEW_DIR, scripts/lib/paths.mjs)
// prints each png's path. one edge per run, always killed at the end.

import { spawn, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, isAbsolute, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { ASSETS, PREVIEW_DIR } from "./lib/paths.mjs";

const EDGE = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/microsoft-edge",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].find(existsSync);

// args
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf(`--${name}`);
  if (i < 0) return dflt;
  const v = args[i + 1];
  args.splice(i, v === undefined || v.startsWith("--") ? 1 : 2);
  return v === undefined || v.startsWith("--") ? true : v;
};
const widths = String(flag("width", "830,340")).split(",").map(Number);
const scale = Number(flag("scale", 1));
const light = !!flag("light", false);
const reduced = !!flag("reduced", false);
const wait = Number(flag("wait", 1500));
const out = String(flag("out", PREVIEW_DIR));
const files = (args.length ? args : readdirSync(ASSETS).filter((f) => f.endsWith(".svg"))).map((f) => {
  const name = f.endsWith(".svg") ? f : `${f}.svg`;
  return isAbsolute(name) || existsSync(name) ? resolve(name) : join(ASSETS, name);
});
if (!EDGE) throw new Error("render-preview: no edge or chrome found");
if (!files.length) throw new Error("render-preview: no svgs to render");
mkdirSync(out, { recursive: true });

// the svg's own aspect, so the viewport fits it
const aspect = (file) => {
  const m = /viewBox="\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(readFileSync(file, "utf8"));
  return m ? +m[2] / +m[1] : 1;
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const profile = mkdtempSync(join(tmpdir(), "readme-edge-"));
const edge = spawn(
  EDGE,
  ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${profile}`, "--hide-scrollbars", "--no-first-run",
    "--disable-extensions", "--force-color-profile=srgb", "--allow-file-access-from-files", "about:blank"],
  { stdio: "ignore" },
);

async function main() {
  // edge writes the port it picked into the profile
  let port;
  for (let i = 0; i < 100 && !port; i++) {
    await sleep(100);
    try {
      port = readFileSync(join(profile, "DevToolsActivePort"), "utf8").split("\n")[0].trim();
    } catch {}
  }
  if (!port) throw new Error("render-preview: edge didn't start");
  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json`)).json()).find((t) => t.type === "page");
    } catch {}
    if (!target) await sleep(100);
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener("open", r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener("message", (m) => {
    const msg = JSON.parse(m.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((res) => {
      const i = ++id;
      pending.set(i, res);
      ws.send(JSON.stringify({ id: i, method, params }));
    });
  const evaluate = async (expression) => (await send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true })).result?.result?.value;

  // a file:// page, so it may show file:// images
  const page = join(profile, "preview.html");
  const bg = light ? "#ffffff" : "#0d1117";
  writeFileSync(page, `<!doctype html><meta charset="utf-8"><body style="margin:0;padding:16px;background:${bg}"></body>`);
  await send("Page.enable");

  for (const file of files) {
    for (const w of widths) {
      const h = Math.ceil(w * aspect(file));
      await send("Emulation.setDeviceMetricsOverride", { width: w + 32, height: h + 32, deviceScaleFactor: scale, mobile: false });
      await send("Page.navigate", { url: pathToFileURL(page).href });
      await sleep(150);
      let shown = file;
      if (reduced) {
        shown = join(profile, `still-${basename(file)}`);
        const still = readFileSync(file, "utf8").replace(/@media\s*\(\s*prefers-reduced-motion\s*:\s*no-preference\s*\)/g, "@media not all");
        writeFileSync(shown, still);
      }
      const src = `${pathToFileURL(shown).href}?t=${Date.now()}`;
      const ok = await evaluate(`new Promise((res) => {
        const img = new Image();
        img.width = ${w};
        img.style.display = "block";
        img.onload = () => img.decode().then(() => res(true), () => res(true));
        img.onerror = () => res(false);
        img.src = ${JSON.stringify(src)};
        document.body.append(img);
      })`);
      if (!ok) {
        console.error(`  ! ${basename(file)} failed to load as an image (invalid svg?)`);
        continue;
      }
      await sleep(wait);
      const shot = await send("Page.captureScreenshot", { format: "png", clip: { x: 16, y: 16, width: w, height: h, scale: 1 } });
      const tag = `${w}${light ? "-light" : ""}${reduced ? "-reduced" : ""}${scale !== 1 ? `@${scale}x` : ""}`;
      const png = join(out, `${basename(file, ".svg")}-${tag}.png`);
      writeFileSync(png, Buffer.from(shot.result.data, "base64"));
      console.log(png);
    }
  }
  try {
    await Promise.race([send("Browser.close"), sleep(1500)]);
  } catch {}
  ws.close();
}

try {
  await main();
} finally {
  // the whole process tree: a plain kill leaves edge's children running
  if (process.platform === "win32") spawnSync("taskkill", ["/PID", String(edge.pid), "/T", "/F"], { stdio: "ignore" });
  else edge.kill("SIGKILL");
  await sleep(300);
  try {
    rmSync(profile, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  } catch {}
}
