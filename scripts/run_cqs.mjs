#!/usr/bin/env node
// run_cqs.mjs: verify competency questions against a PROforma guideline.
//
// Usage:
//   node scripts/run_cqs.mjs <guideline.pf> <cq-queries.mjs> [--proposal plans/PROPOSAL-*.md] [--report <file.md>]
//
// <cq-queries.mjs> default-exports an array of
//   { id: "CQ1", question: "...", query: (g, h) => rows | boolean, expect?: (rows) => boolean }
// where g is the `proforma export` JSON model (format proforma-export/1) and h
// the helpers below. A CQ passes when `expect(rows)` is true, or, without
// `expect`, when the query returns a non-empty array or `true`. With
// --proposal, every CQ id mentioned in the proposal must have a query.
// Exit code 0 = all CQs pass, 1 = a CQ fails, 2 = usage/input error.

import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { exportGuideline, metaValues } from "./lib/proforma.mjs";

const argv = process.argv.slice(2);
const opts = { file: null, queries: null, proposal: null, report: null };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => {
    if (i + 1 >= argv.length) usage(`missing value for ${a}`);
    return argv[++i];
  };
  if (a === "--proposal") opts.proposal = next();
  else if (a === "--report") opts.report = next();
  else if (a === "-h" || a === "--help") usage(null, 0);
  else if (a.startsWith("--")) usage(`unknown option ${a}`);
  else if (!opts.file) opts.file = a;
  else if (!opts.queries) opts.queries = a;
  else usage(`unexpected argument ${a}`);
}
if (!opts.file || !opts.queries) usage("missing arguments");

function usage(msg, code = 2) {
  if (msg) console.error(`run_cqs: ${msg}`);
  console.error("usage: node scripts/run_cqs.mjs <guideline.pf> <cq-queries.mjs> [--proposal PROPOSAL.md] [--report out.md]");
  process.exit(code);
}

let g;
let cqs;
try {
  g = exportGuideline(opts.file);
  const mod = await import(pathToFileURL(path.resolve(opts.queries)).href);
  cqs = mod.default ?? mod.cqs;
  if (!Array.isArray(cqs)) throw new Error(`${opts.queries} must default-export an array of CQs`);
} catch (e) {
  console.error(`run_cqs: ${e.message}`);
  process.exit(2);
}

// ---------------------------------------------------------------- helpers

const byName = new Map(g.tasks.map((t) => [t.name, t]));
const verbOf = (t) => (t?.metaprops?.["goal.verb"] || "").trim().toLowerCase();
const h = {
  /** Tasks, optionally of one kind (plan, action, enquiry, decision, task). */
  tasks: (kind) => g.tasks.filter((t) => !kind || t.kind === kind),
  task: (name) => byName.get(name) ?? null,
  data: (name) => (name ? g.data.find((d) => d.name === name) ?? null : g.data),
  /** A metaprops value; repeatable keys (source) come back as an array with meta(t, "source", true). */
  meta: (t, key, all = false) => (all ? metaValues(t?.metaprops, key) : t?.metaprops?.[key] ?? null),
  goal: (t) => ({ verb: t?.metaprops?.["goal.verb"] ?? null, noun_phrase: t?.metaprops?.["goal.noun_phrase"] ?? null }),
  monitoringActions: () => g.tasks.filter((t) => t.kind === "action" && verbOf(t) === "order"),
  therapyActions: () => g.tasks.filter((t) => t.kind === "action" && ["achieve", "avoid"].includes(verbOf(t))),
  /** Tasks run by the components of a plan (one level). */
  children: (plan) => (byName.get(plan)?.components ?? []).map((c) => byName.get(c.task)).filter(Boolean),
  /** All tasks below a plan. */
  descendants: (plan) => {
    const out = [];
    const seen = new Set();
    const walk = (p) => {
      for (const t of h.children(p)) {
        if (seen.has(t.name)) continue;
        seen.add(t.name);
        out.push(t);
        if (t.kind === "plan") walk(t.name);
      }
    };
    walk(plan);
    return out;
  },
  /** Components of a plan that wait for `name` (direct successors). */
  after: (plan, name) => (byName.get(plan)?.components ?? []).filter((c) => c.after.includes(name)).map((c) => c.task),
  /** Monitoring actions whose monitored_target names the given task. */
  monitorsOf: (taskName) =>
    h.monitoringActions().filter((t) => new RegExp(`(^|[^A-Za-z0-9_])${taskName}([^A-Za-z0-9_]|$)`).test(t.metaprops.monitored_target || "")),
};

// ---------------------------------------------------------------- run

const results = [];
for (const cq of cqs) {
  const r = { id: cq.id, question: cq.question || "", pass: false, rows: 0, sample: "", error: null };
  try {
    const out = await cq.query(g, h);
    const rows = Array.isArray(out) ? out : out === true ? [true] : out ? [out] : [];
    r.rows = rows.length;
    r.pass = cq.expect ? Boolean(cq.expect(rows)) : rows.length > 0;
    r.sample = rows
      .slice(0, 3)
      .map((x) => (typeof x === "string" ? x : x?.name ?? JSON.stringify(x)))
      .join(", ")
      .slice(0, 160);
  } catch (e) {
    r.error = e.message;
  }
  results.push(r);
}

const missing = [];
if (opts.proposal) {
  const text = fs.readFileSync(opts.proposal, "utf8");
  // CQ1, CQ-1, CQ01 and cq1 are the same id
  const norm = (s) => "CQ" + parseInt(String(s).replace(/^CQ-?/i, ""), 10);
  const ids = [...new Set((text.match(/\bCQ-?\d+\b/gi) || []).map(norm))];
  const have = new Set(cqs.map((c) => norm(c.id)));
  for (const id of ids) if (!have.has(id)) missing.push(id);
}

const failed = results.filter((r) => !r.pass);
const verdict = failed.length || missing.length ? "FAIL" : "PASS";
console.log(`${verdict}: ${results.length - failed.length}/${results.length} CQs pass on ${opts.file}`);
for (const r of results) {
  console.log(`  ${r.pass ? "PASS" : "FAIL"} ${r.id} (${r.error ? `error: ${r.error}` : `${r.rows} row(s)`})${r.sample ? `: ${r.sample}` : ""}`);
}
for (const id of missing) console.log(`  FAIL ${id}: in the proposal but has no query`);

if (opts.report) {
  const L = [`# CQ verification: ${path.basename(opts.file)}`, ""];
  L.push(`**${verdict}**: ${results.length - failed.length}/${results.length} CQs pass. Queries: \`${opts.queries}\`. Generated by \`scripts/run_cqs.mjs\` on ${new Date().toISOString()}.`, "");
  L.push("| CQ | Question | Result | Rows | Sample / error |", "|---|---|---|---|---|");
  const esc = (s) => String(s).replace(/\|/g, "\\|");
  for (const r of results) L.push(`| ${r.id} | ${esc(r.question)} | ${r.pass ? "PASS" : "FAIL"} | ${r.rows} | ${esc(r.error || r.sample)} |`);
  for (const id of missing) L.push(`| ${id} | (in the proposal) | FAIL | 0 | no query written |`);
  L.push("");
  fs.mkdirSync(path.dirname(path.resolve(opts.report)), { recursive: true });
  fs.writeFileSync(opts.report, L.join("\n"));
  console.log(`report: ${opts.report}`);
}
process.exit(verdict === "PASS" ? 0 : 1);
