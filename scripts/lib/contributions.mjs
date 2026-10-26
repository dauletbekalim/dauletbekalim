// the github contributions graph, read from the public calendar fragment github's own
// profile page loads: no token, no api. ported from alim.wtf (lib/github.ts), same
// parser, same stats. unlike the site, a failure throws: the wall's action would rather
// keep yesterday's good svg than draw an empty one.

const TIMEOUT_MS = 15_000;
const MIN_DAYS = 50; // fewer parsed days than this means the markup changed under us
const DAY_MS = 86_400_000;

// a cell, its tooltip, the total in the heading above the graph
const CELL = /<td\b[^>]*?\bdata-date="(\d{4}-\d{2}-\d{2})"[^>]*>/g;
const TIP = /<tool-tip\b[^>]*?\bfor="([^"]+)"[^>]*>([\s\S]*?)<\/tool-tip>/g;
const TOTAL = /id="js-contribution-activity-description"[^>]*>([\s\S]*?)<\/h2>/;
const COUNT = /^\s*(no|[\d,]+)\s+contributions?\b/i;

const attr = (tag, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1];
const toInt = (s) => Number.parseInt(s.replace(/,/g, ""), 10);

// "YYYY-MM-DD" as a whole UTC day number, so weekdays and gaps never meet a timezone
const dayNumber = (date) => Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY_MS);

const MONTH = new Intl.DateTimeFormat("en-US", { month: "short", timeZone: "UTC" });
const SHORT = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

// "oct 5": the site's lowercase short date, from "YYYY-MM-DD" or a Date
export const shortDay = (d) => SHORT.format(typeof d === "string" ? new Date(`${d}T00:00:00Z`) : d).toLowerCase();

// the graph from github's markup: weeks (columns of 7 slots, sunday first, null outside
// the year), month labels, the year's total, the current streak and the busiest day.
// `now` anchors the streak. throws when the markup doesn't parse
export function parseContributions(html, now) {
  // tooltips first: "12 contributions on July 5th." / "No contributions on October 19th."
  const counts = new Map();
  for (const m of html.matchAll(TIP)) {
    const c = COUNT.exec(m[2].replace(/<[^>]*>/g, ""));
    if (c) counts.set(m[1], c[1].toLowerCase() === "no" ? 0 : toInt(c[1]));
  }

  const byDate = new Map();
  for (const m of html.matchAll(CELL)) {
    const tag = m[0];
    const n = dayNumber(m[1]);
    const level = Number(attr(tag, "data-level"));
    if (!Number.isFinite(n) || !Number.isInteger(level) || level < 0 || level > 4) continue;
    const id = attr(tag, "id");
    const tipped = id === undefined ? undefined : counts.get(id);
    // a cell with no tooltip: an empty one is surely 0, a lit one has an unknown count
    const count = tipped ?? (level === 0 ? 0 : null);
    byDate.set(n, { date: m[1], count, level });
  }
  if (byDate.size < MIN_DAYS) throw new Error(`only ${byDate.size} days in the markup`);

  const nums = [...byDate.keys()].sort((a, b) => a - b);
  const first = nums[0];
  // the first column starts on the sunday on or before the first day, like github's
  const offset = new Date(first * DAY_MS).getUTCDay();
  const cols = Math.floor((nums[nums.length - 1] - first + offset) / 7) + 1;
  const weeks = Array.from({ length: cols }, () => Array(7).fill(null));
  for (const n of nums) {
    const i = n - first + offset;
    weeks[Math.floor(i / 7)][i % 7] = byDate.get(n);
  }

  // a label where a column's first day starts a new month (every start, unfiltered: the
  // wall drops the ones that would collide once it knows where it breaks the year)
  const months = [];
  let last = -1;
  weeks.forEach((week, col) => {
    const day = week.find((d) => d !== null);
    if (!day) return;
    const month = Number(day.date.slice(5, 7));
    if (month !== last) {
      months.push({ col, label: MONTH.format(new Date(`${day.date}T00:00:00Z`)).toLowerCase() });
      last = month;
    }
  });

  let sum = 0;
  let best = null;
  let active = 0;
  for (const n of nums) {
    const d = byDate.get(n);
    if (d.count === null ? d.level > 0 : d.count > 0) active += 1;
    if (d.count === null) continue;
    sum += d.count;
    if (d.count > 0 && (best === null || d.count >= best.count)) best = { date: d.date, count: d.count };
  }

  const heading = TOTAL.exec(html)?.[1].replace(/<[^>]*>/g, " ");
  const stated = heading ? /([\d,]+)\s+contributions?/i.exec(heading)?.[1] : undefined;
  const total = stated !== undefined && Number.isFinite(toInt(stated)) ? toInt(stated) : sum;

  // a streak survives a today with nothing yet: it counts back from yesterday then
  const lit = (n) => {
    const d = byDate.get(n);
    return d !== undefined && (d.count === null ? d.level > 0 : d.count > 0);
  };
  const today = Math.floor(now.getTime() / DAY_MS);
  let cursor = lit(today) ? today : today - 1;
  let streak = 0;
  while (lit(cursor)) {
    streak += 1;
    cursor -= 1;
  }

  return { weeks, months, total, active, streak, best };
}

// fetches and parses a user's graph. the date is github's own (its date header), so
// "updated" says when github served it. throws on any failure
export async function getContributions(user) {
  const url = `https://github.com/users/${encodeURIComponent(user)}/contributions`;
  const res = await fetch(url, {
    headers: { "user-agent": `${user}-profile-wall` },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`github answered ${res.status}`);
  const served = new Date(res.headers.get("date") ?? Date.now());
  const at = Number.isNaN(served.getTime()) ? new Date() : served;
  return { ...parseContributions(await res.text(), at), fetchedAt: at };
}
