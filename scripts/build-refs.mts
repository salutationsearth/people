import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CACHE = path.join(".cache", "refs");
const OUT = path.join("scripts", "data");
const GLOTTOLOG = "https://raw.githubusercontent.com/glottolog/glottolog-cldf/master/cldf";
const M49 = "https://raw.githubusercontent.com/lukes/ISO-3166-Countries-with-Regional-Codes/master/all/all.csv";
const BRANCH_MAX_LANGUAGES = 250;
const PASS_THROUGH = new Set(["Italic", "Latino-Faliscan", "Latinic", "Imperial Latin", "Iranian-Nuristani", "Balto-Slavic", "Common Turkic", "Athabaskan-Eyak"]);
const NOT_A_FAMILY = new Set(["Bookkeeping", "Unclassifiable", "Unattested"]);

async function cached(url: string, file: string): Promise<string> {
  const target = path.join(CACHE, file);
  try {
    return await readFile(target, "utf8");
  } catch {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    const text = await res.text();
    await mkdir(CACHE, { recursive: true });
    await writeFile(target, text);
    return text;
  }
}

function parseCsv(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += c;
  }
  if (field || row.length) rows.push([...row, field]);
  const [header, ...body] = rows;
  return body.filter((r) => r.length === header.length).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i]])));
}

async function buildLanguages() {
  const languoids = parseCsv(await cached(`${GLOTTOLOG}/languages.csv`, "glottolog-languages.csv"));
  const values = parseCsv(await cached(`${GLOTTOLOG}/values.csv`, "glottolog-values.csv"));
  const name = new Map(languoids.map((l) => [l.ID, l.Name]));
  const classification = new Map(
    values.filter((v) => v.Parameter_ID === "classification").map((v) => [v.Language_ID, v.Value ? v.Value.split("/") : []]),
  );
  const languageCount = new Map<string, number>();
  for (const l of languoids) {
    if (l.Level !== "language") continue;
    for (const ancestor of classification.get(l.ID) ?? []) languageCount.set(ancestor, (languageCount.get(ancestor) ?? 0) + 1);
  }
  const out: Record<string, [string | null, string | null]> = {};
  for (const l of languoids) {
    if (!l.ISO639P3code) continue;
    const lineage = classification.get(l.ID) ?? [];
    if (lineage.length === 0) {
      out[l.ISO639P3code] = [l.Name, null];
      continue;
    }
    const family = name.get(lineage[0])!;
    if (NOT_A_FAMILY.has(family)) {
      out[l.ISO639P3code] = [null, null];
      continue;
    }
    const below = lineage.slice(1);
    let branch = below.find((g) => (languageCount.get(g) ?? 0) <= BRANCH_MAX_LANGUAGES && !PASS_THROUGH.has(name.get(g)!));
    branch ??= below.find((g) => !PASS_THROUGH.has(name.get(g)!));
    out[l.ISO639P3code] = [family, branch ? name.get(branch)! : null];
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

async function buildRegions() {
  const rows = parseCsv(await cached(M49, "m49.csv"));
  const out: Record<string, { continent: string; region: string }> = {};
  for (const r of rows) {
    if (!r.region) continue;
    const region = r["intermediate-region"] || r["sub-region"];
    const continent = r.region !== "Americas" ? r.region : region === "South America" ? "South America" : "North America";
    out[r["alpha-3"]] = { continent, region };
  }
  out.TWN = { continent: "Asia", region: "Eastern Asia" };
  out.XKV = { continent: "Europe", region: "Southern Europe" };
  return out;
}

await mkdir(OUT, { recursive: true });
const [languages, regions] = await Promise.all([buildLanguages(), buildRegions()]);
await writeFile(path.join(OUT, "languages.json"), JSON.stringify(languages) + "\n");
await writeFile(path.join(OUT, "regions.json"), JSON.stringify(regions) + "\n");
console.log(`languages: ${Object.keys(languages).length} ISO 639-3 codes, regions: ${Object.keys(regions).length} countries`);
