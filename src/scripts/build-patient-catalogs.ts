// Merges translator parts into src/i18n/catalog/<lang>.json, keeping only
// strings that still exist in en.json, and records the missing count.
// Run: bun scripts/build-patient-catalogs.ts
import { readFileSync, writeFileSync, readdirSync } from "node:fs";

const dir = "src/i18n/catalog";
const en: string[] = JSON.parse(readFileSync(`${dir}/en.json`, "utf8"));
for (const lang of ["hi", "kn", "mr", "ur"]) {
  const merged: Record<string, string> = {};
  try { Object.assign(merged, JSON.parse(readFileSync(`${dir}/${lang}.json`, "utf8"))); } catch { /* first run */ }
  for (const f of readdirSync(`${dir}/parts`).filter((f) => f.startsWith(`${lang}.`)).sort()) {
    Object.assign(merged, JSON.parse(readFileSync(`${dir}/parts/${f}`, "utf8")));
  }
  const out: Record<string, string> = {};
  let missing = 0;
  for (const s of en) {
    const v = merged[s];
    if (typeof v === "string" && v.trim()) out[s] = v; else missing++;
  }
  out["__missing"] = String(missing);
  writeFileSync(`${dir}/${lang}.json`, JSON.stringify(out, null, 1) + "\n");
  console.log(lang, `${en.length - missing}/${en.length}`, "missing", missing);
}
