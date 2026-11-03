#!/usr/bin/env node
// export_composer_project.mjs: turn a kit guideline (.pf) into a Deontics Composer PROJECT
// folder that Composer opens with every ontology code and every task caption visible.
//
// Usage:
//   node scripts/export_composer_project.mjs <guideline.pf> <outDir>
//        [--name <GuidelineName>] [--display-name "..."] [--description "..."] [--force]
//
// Why a project (cig/know-how/proforma/Ontology.md): Composer READS an element's ontology term
// from the project's .deo file, not from the .pf. "Open individual PROforma file" never reads a
// .deo, and Composer drops the `ontology.coding` of every element whose term it does not hold, so a
// standalone .pf loses its codes. The `ontology.coding` line in the .pf is what Composer EXPORTS
// on save; the exporter keeps it.
//
// It writes
//   <outDir>/project.metadata          {"displayName":..,"description":..,"mpwProject":false}
//   <outDir>/proforma/<Name>.pf         a copy of the guideline, edited through the proforma CLI:
//                                       `ae.private.component.id` merged into the metaprops of every
//                                       component, candidate, argument, data item and enquiry source,
//                                       and each component given its task's caption and description
//   <outDir>/proforma/<Name>.deo        the Alium model: one task per component, one claim per
//                                       candidate, one rule per argument, one data entry per data item,
//                                       each with the five ontology keys when the element is coded
// The source .pf is never modified. The .deo/.pf link and entry shapes match the projects
// Composer itself saves:
// - Composer maps each component to the .deo task with the same id and requires the same name,
//   type and CAPTION: the component's caption (not the task definition's) must
//   equal the .deo caption, or be absent with a "" .deo caption. One mismatch clears the whole task
//   model and every task loses its term. Composer also shows the component's caption and
//   description as the task's Caption and Description, so the exporter copies the definition's
//   caption and description onto each component and writes the same caption into the .deo.
// - Ids have the form Composer uses: current time in ms + a counter. Ids already in the
//   source .pf, or in an earlier export at the same path (with --force), are reused, so a re-export
//   keeps them.
// - A source carries the id of its data item, as in projects Composer saves.

import fs from "node:fs";
import path from "node:path";
import { exportGuideline, lintGuideline, parseCoding, pfText, proforma } from "./lib/proforma.mjs";

const ID_KEY = "ae.private.component.id";

// Composer's terminology providers: Deontics prefix -> FHIR code-system UID.
// LOINC's UID carries a trailing dot, as Composer writes it.
const SYSTEM_UID = {
  SCT: "2.16.840.1.113883.6.96",
  LNC: "2.16.840.1.113883.6.1.",
  IC0: "2.16.840.1.113883.6.90",
  IC9: "2.16.840.1.113883.6.42",
};

// .pf type name -> .deo data type (1 text, 2 integer, 3 real,
// 4 boolean, 5 date; every other PROforma type is reported as text).
const ALIUM_TYPE = { text: 1, integer: 2, real: 3, boolean: 4, date: 5 };

const ICON = {
  plan: "planIcon",
  action: "actionIcon",
  enquiry: "enquiryIcon",
  decision: "decisionIcon",
  keystone: "keystoneIcon",
};

// ---------------------------------------------------------------- arguments

const argv = process.argv.slice(2);
const opts = {};
const pos = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--force") opts.force = true;
  else if (["--name", "--display-name", "--description"].includes(a)) opts[a.slice(2)] = argv[++i];
  else if (a.startsWith("--")) usage(`unknown option ${a}`);
  else pos.push(a);
}
if (pos.length !== 2) usage();
function usage(msg) {
  if (msg) console.error(msg);
  console.error('usage: node scripts/export_composer_project.mjs <guideline.pf> <outDir> [--name <GuidelineName>] [--display-name "..."] [--description "..."] [--force]');
  process.exit(2);
}

const t0 = Date.now();
const src = path.resolve(pos[0]);
const outDir = path.resolve(pos[1]);
if (!fs.existsSync(src)) usage(`no such file: ${src}`);
const name = opts.name || path.basename(src).replace(/\.pf$/i, "");
if (!/^[A-Za-z0-9_][A-Za-z0-9_.-]*$/.test(name)) usage(`--name must be a plain file basename: ${name}`);
const pfDir = path.join(outDir, "proforma");
const pfOut = path.join(pfDir, `${name}.pf`);
const deoOut = path.join(pfDir, `${name}.deo`);
const metaOut = path.join(outDir, "project.metadata");
if (path.resolve(pfOut) === src) usage("the output .pf would overwrite the source guideline");
const existing = [metaOut, pfOut, deoOut].filter((f) => fs.existsSync(f));
if (existing.length && !opts.force) usage(`${existing.join(", ")} already exist(s); pass --force to overwrite`);

// ---------------------------------------------------------------- the model

const source = exportGuideline(src);
const lint0 = lintGuideline(src).filter((d) => d.severity === "error");
if (lint0.length) {
  console.error(`the source guideline has ${lint0.length} lint error(s); fix them first`);
  process.exit(1);
}
const previous = opts.force && fs.existsSync(pfOut) ? exportGuideline(pfOut) : null;

const taskByName = new Map(source.tasks.map((t) => [t.name, t]));
const rootPlan = taskByName.get(source.root);
if (!rootPlan) throw new Error(`root plan ${source.root} not found in the export`);

// Java Properties.load for one metaprops string (logical lines, `\` escapes, `\uXXXX`).
function parseProps(text) {
  const out = {};
  const lines = String(text || "").split(/\r\n|\r|\n/);
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].replace(/^[ \t\f]+/, "");
    while (/(^|[^\\])(\\\\)*\\$/.test(line) && i + 1 < lines.length) line = line.slice(0, -1) + lines[++i].replace(/^[ \t\f]+/, "");
    if (!line || line[0] === "#" || line[0] === "!") continue;
    let k = 0;
    while (k < line.length && !"=: \t\f".includes(line[k])) k += line[k] === "\\" ? 2 : 1;
    let v = k;
    while (v < line.length && " \t\f".includes(line[v])) v++;
    if (v < line.length && "=:".includes(line[v])) v++;
    while (v < line.length && " \t\f".includes(line[v])) v++;
    out[unescapeProps(line.slice(0, k))] = unescapeProps(line.slice(v));
  }
  return out;
}
function unescapeProps(s) {
  return s.replace(/\\(u[0-9a-fA-F]{4}|.)/g, (_, e) =>
    e[0] === "u" && e.length === 5 ? String.fromCharCode(parseInt(e.slice(1), 16)) : { t: "\t", n: "\n", r: "\r", f: "\f" }[e] ?? e,
  );
}

// The export lists a source's data item but not its metaprops: read them with `get`.
function sourceMetaprops(file, selector) {
  const r = proforma(["get", "--file", file, "--selector", selector, "--format", "json"]);
  if (r.status !== 0) throw new Error(`proforma get ${selector}: ${(r.stderr || r.stdout).trim()}`);
  const attr = (JSON.parse(r.stdout).value?.attrs || []).find((a) => a.attr === "metaprops");
  return attr ? parseProps(attr.value) : {};
}

/** Every linked element of a guideline, keyed by a stable path: {key -> {kind, selector, metaprops, ...}}. */
function elements(g, file) {
  const byName = new Map(g.tasks.map((t) => [t.name, t]));
  const out = new Map();
  const seen = new Set();
  const walk = (plan, parentKey) => {
    for (const c of plan.components || []) {
      const key = `${plan.name}/component:${c.name}`;
      if (seen.has(key)) throw new Error(`plan ${plan.name} is used by more than one component; Composer cannot map a shared plan definition`);
      seen.add(key);
      const def = byName.get(c.task);
      if (!def) throw new Error(`component ${key} has no task definition ${c.task}`);
      out.set(key, { kind: "component", selector: key, component: c, def, parentKey });
      if (def.kind === "plan") walk(def, key);
    }
  };
  walk(byName.get(g.root), "root");
  for (const t of g.tasks) {
    (t.candidates || []).forEach((c) => {
      const ck = `${t.name}/candidate:${c.name}`;
      out.set(ck, { kind: "candidate", selector: ck, candidate: c, decision: t });
      (c.arguments || []).forEach((a, i) => {
        const ak = `${ck}/argument:${i + 1}`;
        out.set(ak, { kind: "argument", selector: ak, argument: a, candidateKey: ck });
      });
    });
    for (const s of t.sources || []) {
      const sk = `${t.name}/source:${s.data}`; // the kit (and Composer) name a source after its data item
      out.set(sk, { kind: "source", selector: sk, source: { ...s, metaprops: sourceMetaprops(file, sk) }, task: t });
    }
  }
  for (const d of g.data) out.set(`data:${d.name}`, { kind: "data", selector: d.name, data: d });
  return out;
}
const metapropsOf = (e) => (e.component || e.candidate || e.argument || e.source || e.data).metaprops || {};

const els = elements(source, src);
const prevEls = previous ? elements(previous, pfOut) : new Map();

// ---------------------------------------------------------------- ids

let counter = 0;
const used = new Set();
const newId = () => {
  for (;;) {
    const id = `${Date.now()}${counter++}`; // current time in ms + counter, as Composer generates ids
    if (!used.has(id)) return id;
  }
};
const keepId = (raw) => {
  const id = unescapeId(raw);
  if (!id || used.has(id)) return null;
  return id;
};
// Composer escapes metaprop values this way: & -> &amp;, LF -> &n;, CR -> &r;
const escapeId = (s) => String(s).replace(/&/g, "&amp;").replace(/\n/g, "&n;").replace(/\r/g, "&r;");
const unescapeId = (s) => (s == null ? null : String(s).trim().replace(/&n;/g, "\n").replace(/&r;/g, "\r").replace(/&amp;/g, "&") || null);

const ids = new Map(); // element key -> id
let reused = 0;
for (const [key, e] of els) {
  if (e.kind === "source") continue; // a source carries its data item's id
  const id = keepId(metapropsOf(e)[ID_KEY]) || (prevEls.has(key) && keepId(metapropsOf(prevEls.get(key))[ID_KEY]));
  if (id) reused++;
  const v = id || newId();
  used.add(v);
  ids.set(key, v);
}
for (const [key, e] of els) {
  if (e.kind !== "source") continue;
  const dataId = ids.get(`data:${e.source.data}`);
  if (!dataId) throw new Error(`source ${key} reads an unknown data item ${e.source.data}`);
  ids.set(key, dataId);
}

// ---------------------------------------------------------------- the .pf copy

// Java Properties.saveConvert, as Composer's PropertyUtils.propsToString writes metaprops.
function propsEscape(s, isKey) {
  let out = "";
  [...String(s)].forEach((ch, i) => {
    const c = ch.codePointAt(0);
    if (ch === "\\") out += "\\\\";
    else if (ch === " ") out += isKey || i === 0 ? "\\ " : " ";
    else if (ch === "\t") out += "\\t";
    else if (ch === "\n") out += "\\n";
    else if (ch === "\r") out += "\\r";
    else if (ch === "\f") out += "\\f";
    else if ("=:#!".includes(ch)) out += "\\" + ch;
    else if (c < 0x20 || c > 0x7e) {
      for (const unit of ch.length === 2 ? [ch.charCodeAt(0), ch.charCodeAt(1)] : [ch.charCodeAt(0)]) {
        out += "\\u" + unit.toString(16).toUpperCase().padStart(4, "0");
      }
    } else out += ch;
  });
  return out;
}
const propsText = (map) =>
  Object.keys(map)
    .sort()
    .map((k) => `${propsEscape(k, true)}=${propsEscape(map[k], false)}\n`)
    .join("");

fs.mkdirSync(pfDir, { recursive: true });
fs.copyFileSync(src, pfOut);

let calls = 0;
const tEdit = Date.now();
for (const [key, e] of els) {
  const meta = { ...metapropsOf(e), [ID_KEY]: escapeId(ids.get(key)) };
  const attrs = [];
  if (e.kind === "component") {
    // Composer shows (and maps on) the component's caption and description
    if (e.def.caption != null) attrs.push(`caption :: ${pfText(e.def.caption)} ;`);
    if (e.def.description != null) attrs.push(`description :: ${pfText(e.def.description)} ;`);
  }
  attrs.push(`metaprops :: ${pfText(propsText(meta))} ;`);
  const r = proforma(["add-attributes", "--file", pfOut, "--selector", e.selector, "--pf", attrs.join("\n")]);
  calls++;
  if (r.status !== 0) throw new Error(`proforma add-attributes ${e.selector}: ${(r.stderr || r.stdout).trim()}`);
}
for (const cmd of [["format", "--file", pfOut]]) {
  const r = proforma(cmd);
  calls++;
  if (r.status !== 0) throw new Error(`proforma ${cmd[0]}: ${(r.stderr || r.stdout).trim()}`);
}
const editMs = Date.now() - tEdit;
const lint1 = lintGuideline(pfOut);
const lintErrors = lint1.filter((d) => d.severity === "error");
if (lintErrors.length) {
  for (const d of lintErrors) console.error(`  ${d.code} ${d.component || ""} ${d.message}`);
  throw new Error(`the exported .pf has ${lintErrors.length} lint error(s)`);
}

// ---------------------------------------------------------------- the .deo, from the edited .pf

const g = exportGuideline(pfOut);
const out = elements(g, pfOut);
const idOf = (e) => unescapeId(metapropsOf(e)[ID_KEY]);

function ontologyKeys(metaprops, where) {
  const raw = (metaprops?.["ontology.coding"] || "").trim();
  if (!raw) return {};
  const c = parseCoding(raw);
  if (!c || !SYSTEM_UID[c.system]) throw new Error(`${where}: ontology.coding "${raw}" is not Composer's <SCT|LNC|IC0|IC9>:<code> [<caption>]`);
  return {
    ontology_coding_name: c.caption,
    ontology_coding_code: c.code,
    ontology_coding_system: SYSTEM_UID[c.system],
    ontology_system_prefix: c.system,
    ontology_coding_caption: c.caption,
  };
}
const withoutNulls = (o) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined));

const tasks = [];
const claims = [];
const rules = [];
const data = [];
for (const [key, e] of out) {
  if (e.kind === "component") {
    // pre-order walk: a parent plan always precedes its children (Composer expects this order)
    const type = ICON[e.def.kind] ? e.def.kind : "keystone";
    tasks.push(
      withoutNulls({
        class: type === "plan" ? "plan" : "task",
        id: idOf(e),
        name: e.component.name,
        caption: e.component.caption ?? "",
        status: "",
        parent: e.parentKey === "root" ? "root" : idOf(out.get(e.parentKey)),
        type,
        comment: e.component.description,
        icon_path: `com/deontics/proformaconnector/icons/${ICON[type]}.png`,
        ...ontologyKeys(e.component.metaprops, key),
      }),
    );
  } else if (e.kind === "candidate") {
    claims.push({
      id: idOf(e),
      name: e.candidate.name,
      caption: e.candidate.caption ?? "",
      status: "",
      ...ontologyKeys(e.candidate.metaprops, key),
    });
  } else if (e.kind === "argument") {
    const a = e.argument;
    rules.push({
      id: idOf(e),
      name: a.name ?? "",
      caption: (a.caption ?? "").trim(),
      status: "",
      claim: idOf(out.get(e.candidateKey)),
      // no backing: evidence lives in the .pf metaprops (source.N / quote.N), not in .deo recommendations
      condition_gloss: "",
      condition: { expression: "_" },
      weight: { expression: "_" },
    });
  } else if (e.kind === "data") {
    const d = e.data;
    data.push(
      withoutNulls({
        id: idOf(e),
        name: d.name,
        caption: d.caption,
        status: "",
        type: ALIUM_TYPE[d.type] ?? 1,
        ...ontologyKeys(d.metaprops, key),
        default_value: d.default_value,
        units: d.unit,
        range: (d.range || []).map((v) => String(v).replace(/"/g, "")),
      }),
    );
  }
}

const deo = {
  file_format_version: "1.1",
  claims,
  data,
  evidenceSources: [],
  recommendations: [],
  rules,
  tasks,
};

// Gson: pretty printing with 2-space indent, HTML-safe escaping of < > & = ', no trailing newline.
// Non-ASCII is written as \uXXXX so the file reads the same whatever charset Composer's JVM uses.
const gson = (v, pretty) =>
  JSON.stringify(v, null, pretty ? 2 : 0).replace(/[<>&=']|[^\x00-\x7f]/g, (ch) => "\\u" + ch.charCodeAt(0).toString(16).padStart(4, "0"));
fs.writeFileSync(deoOut, gson(deo, true));

const meta = withoutNulls({
  displayName: opts["display-name"] || source.metadata?.title || name,
  description: opts.description ?? source.metadata?.desc ?? null,
  mpwProject: false,
});
fs.writeFileSync(metaOut, gson(meta, false));

// ---------------------------------------------------------------- self-check (round trip)

const problems = [];
const deoIds = {
  component: new Set(tasks.map((t) => t.id)),
  candidate: new Set(claims.map((c) => c.id)),
  argument: new Set(rules.map((r) => r.id)),
  data: new Set(data.map((d) => d.id)),
};
deoIds.source = deoIds.data;
const pfIds = { component: new Set(), candidate: new Set(), argument: new Set(), data: new Set(), source: new Set() };
for (const [key, e] of out) {
  const id = idOf(e);
  if (!id) problems.push(`${key}: no ${ID_KEY} in the exported .pf`);
  else if (!deoIds[e.kind].has(id)) problems.push(`${key}: id ${id} has no .deo ${e.kind === "source" ? "data item" : e.kind} entry`);
  pfIds[e.kind].add(id);
  if (e.kind === "component" && (e.component.caption ?? "") !== (tasks.find((t) => t.id === id)?.caption ?? "")) problems.push(`${key}: component caption differs from its .deo task caption`);
}
for (const k of ["component", "candidate", "argument", "data"]) {
  for (const id of deoIds[k]) if (!pfIds[k].has(id)) problems.push(`.deo ${k} ${id} is not referenced by the .pf`);
}
// every original metaprop is kept unchanged; only the id was added
const before = els;
for (const [key, e] of before) {
  const now = out.get(key);
  if (!now) {
    problems.push(`${key}: missing from the exported .pf`);
    continue;
  }
  const a = { ...metapropsOf(e) };
  const b = { ...metapropsOf(now) };
  delete a[ID_KEY];
  delete b[ID_KEY];
  if (JSON.stringify(Object.entries(a).sort()) !== JSON.stringify(Object.entries(b).sort())) problems.push(`${key}: metaprops changed beyond ${ID_KEY}`);
}
const coded = [...out.values()].filter((e) => e.kind !== "source" && (metapropsOf(e)["ontology.coding"] || "").trim()).length;
const deoCoded = [...tasks, ...claims, ...data].filter((x) => x.ontology_coding_code).length;
if (coded !== deoCoded) problems.push(`${coded} coded elements in the .pf but ${deoCoded} coded .deo entries`);

const secs = (ms) => (ms / 1000).toFixed(1) + "s";
console.log(`exported ${src}`);
console.log(`  -> ${metaOut}`);
console.log(`  -> ${pfOut}  (${lint1.filter((d) => d.severity === "warning").length} lint warning(s), 0 errors)`);
console.log(`  -> ${deoOut}`);
console.log(
  `  ${tasks.length} tasks, ${claims.length} claims, ${rules.length} rules, ${data.length} data items, ${[...out.values()].filter((e) => e.kind === "source").length} sources; ` +
    `${deoCoded} coded (.deo) = ${coded} coded (.pf); ${reused} id(s) reused, ${used.size - reused} new`,
);
console.log(`  ${calls} CLI edits in ${secs(editMs)}; total ${secs(Date.now() - t0)}`);
if (problems.length) {
  for (const p of problems) console.error(`  FAIL ${p}`);
  process.exit(1);
}
console.log("  round trip OK: every .pf id has its .deo entry and vice versa; metaprops unchanged apart from the ids");
