// Collects every translatable English string in the patient area into
// src/i18n/catalog/en.json (sorted). Run: bun scripts/extract-patient-strings.ts
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { walkStrings } from "../src/i18n/localize";
import { patientContentSources } from "../src/i18n/content-sources";

const out = new Set<string>();
walkStrings(patientContentSources, (s) => out.add(s));

const TX = /\b(?:tx|msg)\(\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g;
function scan(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) scan(p);
    else if (/\.tsx?$/.test(f) && !/\.test\./.test(f)) {
      for (const m of readFileSync(p, "utf8").matchAll(TX)) out.add(JSON.parse(m[1]!.startsWith("'") ? `"${m[1]!.slice(1, -1).replace(/"/g, '\\"')}"` : m[1]!));
    }
  }
}
scan("src");
const list = [...out].sort();
writeFileSync("src/i18n/catalog/en.json", JSON.stringify(list, null, 1) + "\n");
console.log(list.length, "strings");
