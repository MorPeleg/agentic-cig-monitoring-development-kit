#!/usr/bin/env node
// fetch_package_insert.mjs: save a drug's US package insert (FDA label) as markdown next to the
// project's guidelines, so it can be read and quoted like any other source.
//
// Usage:
//   node scripts/fetch_package_insert.mjs <out_dir> <drug-key> (--brand <Brand> | --generic <name> | --setid <DailyMed set id>) [--force]
//
// <out_dir> is normally projects/<project_dir>/resources/. The file is written as
// <out_dir>/<effective-year>-<drug-key>-package-insert.md, with a provenance header (brand,
// generic, manufacturer, SPL set id, effective date, DailyMed URL, retrieval source and date).
//
// Sources: the openFDA drug label API (https://api.fda.gov/drug/label.json, newest label first);
// when openFDA has no match, or --setid is given, the DailyMed SPL web services
// (https://dailymed.nlm.nih.gov/dailymed/services/v2/). No API key is needed.
//
// The script prints the brand, manufacturer, effective date and title of the label it saved, and
// the other labels that matched: check that it is the adult label of the right product (the
// newest label for a generic name may be a repackager's or another dosage form) and rerun with
// --setid <set id> to pick another one.
// Exit code 0 = saved, 1 = no label found or the file exists (without --force), 2 = usage error.

import fs from "node:fs";
import path from "node:path";

const OPENFDA = "https://api.fda.gov/drug/label.json";
const DAILYMED = "https://dailymed.nlm.nih.gov/dailymed/services/v2";
// openFDA label sections written to the file, in this order (prescription, then OTC sections)
const SECTIONS = [
  "boxed_warning",
  "indications_and_usage",
  "dosage_and_administration",
  "contraindications",
  "warnings_and_cautions",
  "warnings",
  "adverse_reactions",
  "drug_interactions",
  "use_in_specific_populations",
  "information_for_patients",
  "do_not_use",
  "ask_doctor",
  "ask_doctor_or_pharmacist",
  "stop_use",
  "when_using",
  "directions",
];

// ------------------------------------------------------------------ args

const opts = { outDir: null, key: null, brand: null, generic: null, setid: null, force: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => {
    if (i + 1 >= argv.length) usage(`missing value for ${a}`);
    return argv[++i];
  };
  if (a === "--brand") opts.brand = next();
  else if (a === "--generic") opts.generic = next();
  else if (a === "--setid") opts.setid = next();
  else if (a === "--force") opts.force = true;
  else if (a === "-h" || a === "--help") usage(null, 0);
  else if (a.startsWith("--")) usage(`unknown option ${a}`);
  else if (!opts.outDir) opts.outDir = a;
  else if (!opts.key) opts.key = a;
  else usage(`unexpected argument ${a}`);
}
if (!opts.outDir || !opts.key) usage("missing <out_dir> or <drug-key>");
if ([opts.brand, opts.generic, opts.setid].filter(Boolean).length !== 1) usage("give exactly one of --brand, --generic, --setid");

function usage(msg, code = 2) {
  if (msg) console.error(`fetch_package_insert: ${msg}`);
  console.error(
    "usage: node scripts/fetch_package_insert.mjs <out_dir> <drug-key> (--brand <Brand> | --generic <name> | --setid <DailyMed set id>) [--force]"
  );
  process.exit(code);
}

// ------------------------------------------------------------------ helpers

// openFDA is intermittently overloaded (HTTP 500, and sometimes a spurious 404): retry with
// backoff. A 404 that persists means no match.
async function get(url, as = "json", attempts = 5) {
  let last = null;
  for (let i = 0; i < attempts; i++) {
    if (i) await new Promise((res) => setTimeout(res, 1000 * 2 ** (i - 1)));
    const r = await fetch(url, { headers: { "User-Agent": "agentic-cig-monitoring-development-kit (fetch_package_insert.mjs)" } });
    if (r.ok) return as === "json" ? r.json() : r.text();
    await r.arrayBuffer().catch(() => {});
    last = r.status;
    if (r.status === 404 && i >= 1) return null;
    if (r.status !== 404 && r.status !== 429 && r.status < 500) break;
  }
  if (last === 404) return null;
  throw new Error(`${url}: HTTP ${last}`);
}
const isoDate = (yyyymmdd) => (/^\d{8}$/.test(yyyymmdd || "") ? `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}` : yyyymmdd || "unknown");
const first = (v) => (Array.isArray(v) ? v[0] : v) || "";
const list = (v) => (Array.isArray(v) ? [...new Set(v)].join(", ") : v || "");
const dailymedUrl = (setid) => `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${setid}`;
const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s) =>
  s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m);
// inline SPL markup (styled runs, superscripts, cross-reference links) is dropped without a space
const INLINE_TAGS = /<\/?(?:content|sup|sub|linkHtml|span|b|i|u|em|strong)\b[^>]*>/g;
const inline = (s) => decode(s.replace(INLINE_TAGS, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// ------------------------------------------------------------------ openFDA

async function fromOpenFda() {
  const field = opts.brand ? "openfda.brand_name" : "openfda.generic_name";
  const term = (opts.brand || opts.generic).replace(/"/g, "");
  const q = new URLSearchParams({ search: `${field}:"${term}"`, sort: "effective_time:desc", limit: "10" });
  const url = `${OPENFDA}?${q}`;
  const j = await get(url);
  if (!j?.results?.length) return null;
  const alternatives = j.results.map((r) => ({
    setid: r.set_id,
    brand: list(r.openfda?.brand_name),
    manufacturer: list(r.openfda?.manufacturer_name),
    effective: isoDate(r.effective_time),
    route: list(r.openfda?.route),
  }));
  const r = j.results[0];
  const brand = list(r.openfda?.brand_name) || opts.brand || opts.generic;
  const generic = list(r.openfda?.generic_name);
  const manufacturer = list(r.openfda?.manufacturer_name);
  const body = [];
  for (const s of SECTIONS) {
    if (!r[s]) continue;
    body.push(`## ${s}`, "", ...[].concat(r[s]).map((t) => String(t).trim()).flatMap((t) => [t, ""]));
  }
  return {
    brand,
    generic,
    manufacturer,
    setid: r.set_id,
    version: r.version || "",
    effective: r.effective_time,
    title: `${brand}${generic ? ` (${generic})` : ""}${r.openfda?.route ? `, ${list(r.openfda.route).toLowerCase()}` : ""} [${manufacturer}], ${list(r.openfda?.product_type) || "drug label"}`,
    source: `openFDA drug label API (${url})`,
    body: body.join("\n"),
    total: j.meta?.results?.total ?? j.results.length,
    alternatives,
  };
}

// ------------------------------------------------------------------ DailyMed

async function findSetId() {
  const name = opts.brand || opts.generic;
  const j = await get(`${DAILYMED}/spls.json?drug_name=${encodeURIComponent(name)}&pagesize=10`);
  const data = j?.data || [];
  return { setid: data[0]?.setid || null, alternatives: data.map((d) => ({ setid: d.setid, title: d.title, published: d.published_date })) };
}

function splToMarkdown(xml) {
  const tag = (re) => (re.exec(xml)?.[1] || "").trim();
  const title = inline(tag(/<document[\s\S]*?<title[^>]*>([\s\S]*?)<\/title>/));
  const effective = /<effectiveTime\s+value="(\d{8})/.exec(xml)?.[1] || "";
  const version = /<versionNumber\s+value="(\d+)"/.exec(xml)?.[1] || "";
  const manufacturer = inline(tag(/<representedOrganization>[\s\S]*?<name>([\s\S]*?)<\/name>/));
  const brand = inline(tag(/<manufacturedProduct>\s*<manufacturedProduct>[\s\S]*?<name>([\s\S]*?)<\/name>/));
  const generic = inline(tag(/<genericMedicine>\s*<name>([\s\S]*?)<\/name>/));
  const form = /<formCode[^>]*displayName="([^"]+)"/.exec(xml)?.[1] || "";
  let body = (/<structuredBody>([\s\S]*)<\/structuredBody>/.exec(xml) || [null, xml])[1];
  body = body
    .replace(/<title[^>]*>([\s\S]*?)<\/title>/g, (_, t) => `\n\n## ${inline(t)}\n\n`)
    .replace(/<br\s*\/?>/g, "\n")
    .replace(/<\/(paragraph|item|tr|caption)>/g, "\n")
    .replace(/<\/t[dh]>/g, " | ")
    .replace(INLINE_TAGS, "")
    .replace(/<[^>]+>/g, " ");
  body = decode(body)
    .split("\n")
    .map((l) => l.replace(/[ \t\u00a0]+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return { title, effective, version, manufacturer, brand, generic, form, body };
}

async function fromDailyMed(setid, alternatives = []) {
  const url = `${DAILYMED}/spls/${setid}.xml`;
  const xml = await get(url, "text");
  if (!xml) return null;
  const m = splToMarkdown(xml);
  return {
    brand: m.brand || opts.brand || opts.generic || opts.key,
    generic: m.generic,
    manufacturer: m.manufacturer,
    setid,
    version: m.version,
    effective: m.effective,
    title: m.title + (m.form ? ` [dosage form: ${m.form}]` : ""),
    source: `DailyMed SPL web service (${url})`,
    body: m.body,
    total: alternatives.length || 1,
    alternatives,
  };
}

// ------------------------------------------------------------------ main

// (no process.exit after a fetch: on Windows it can abort Node while sockets are closing)
async function main() {
  let label = null;
  try {
    if (opts.setid) label = await fromDailyMed(opts.setid);
    else {
      try {
        label = await fromOpenFda();
        if (!label) console.error(`fetch_package_insert: openFDA has no label for ${opts.brand ? "brand" : "generic"} "${opts.brand || opts.generic}"; searching DailyMed`);
      } catch (e) {
        console.error(`fetch_package_insert: openFDA unavailable (${e.message}); searching DailyMed`);
      }
      if (!label) {
        const found = await findSetId();
        if (found.setid) label = await fromDailyMed(found.setid, found.alternatives);
      }
    }
  } catch (e) {
    console.error(`fetch_package_insert: ${e.message}`);
    return 1;
  }
  if (!label) {
    console.error(`fetch_package_insert: no label found for ${opts.setid ? `set id ${opts.setid}` : `"${opts.brand || opts.generic}"`}`);
    return 1;
  }
  return save(label);
}

function save(label) {
  const key = opts.key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const year = /^\d{4}/.exec(label.effective || "")?.[0] || "undated";
  const file = path.join(opts.outDir, `${year}-${key}-package-insert.md`);
  if (fs.existsSync(file) && !opts.force) {
    console.error(`fetch_package_insert: ${file} exists; pass --force to overwrite it`);
    return 1;
  }
  const today = new Date().toISOString().slice(0, 10);
  const header = [
    `# ${label.brand}${label.generic ? ` (${label.generic})` : ""}: US package insert`,
    "",
    `- Brand: ${label.brand}`,
    `- Generic: ${label.generic || "unknown"}`,
    `- Manufacturer: ${label.manufacturer || "unknown"}`,
    `- SPL set id: ${label.setid}${label.version ? ` (version ${label.version})` : ""}`,
    `- Effective date: ${isoDate(label.effective)}`,
    `- DailyMed: ${dailymedUrl(label.setid)}`,
    `- Title: ${label.title}`,
    `- Retrieved from: ${label.source}`,
    `- Retrieved on: ${today}`,
    "",
    "Label text as published, one `##` block per label section. Quote it verbatim (with the section) in `quote.N`; cite it in `source.N` as the brand's US Prescribing Information with the section, e.g. `<Brand> US Prescribing Information (effective <date>), §5.2 <title>`.",
    "",
  ];
  fs.mkdirSync(opts.outDir, { recursive: true });
  fs.writeFileSync(file, header.join("\n") + "\n" + label.body.trim() + "\n");

  console.log(`saved ${file}`);
  console.log(`  brand: ${label.brand}`);
  console.log(`  generic: ${label.generic || "unknown"}`);
  console.log(`  manufacturer: ${label.manufacturer || "unknown"}`);
  console.log(`  effective date: ${isoDate(label.effective)}`);
  console.log(`  title: ${label.title}`);
  console.log(`  set id: ${label.setid} (${dailymedUrl(label.setid)})`);
  console.log(`  source: ${label.source}`);
  if (label.alternatives.length > 1) {
    console.log(`  other matching labels (${label.total} in all); rerun with --setid <set id> if this is not the adult label of the right product:`);
    for (const a of label.alternatives.filter((x) => x.setid !== label.setid).slice(0, 8)) {
      console.log(`    ${a.setid}  ${a.title || `${a.brand} [${a.manufacturer}] ${a.route}`}  ${a.effective || a.published || ""}`);
    }
  }
  return 0;
}

process.exitCode = await main();
