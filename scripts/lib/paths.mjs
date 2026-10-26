// where things live. PREVIEW_DIR is a local scratch folder for preview pngs and test
// svgs, never committed; set the env var to put them somewhere else.

import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
export const ASSETS = join(ROOT, "assets");
export const PREVIEW_DIR = process.env.PREVIEW_DIR || join(tmpdir(), "profile-previews");
