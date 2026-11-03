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
import { exportGuideline, metaValues, parseCoding, taskCoding } from "./lib/proforma.mjs";

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
const roleOf = (t) => (t?.metaprops?.role || "").trim().toLowerCase();
// monitoring tasks, as in check_cig.mjs: Actions with goal.verb=order (except the ADE display and
// test-order Actions) and the ADE Enquiries (goal.verb=order with a ServiceRequest block)
const isMonitor = (t) =>
  verbOf(t) === "order" &&
  ((t.kind === "action" && !["ade_display", "test_order"].includes(roleOf(t))) ||
    (t.kind === "enquiry" && Object.keys(t.metaprops || {}).some((k) => k.startsWith("ServiceRequest."))));
// the raw ontology.coding of a task (from its component), a data item or candidate, a name or a value
const isTask = (x) => x && typeof x === "object" && typeof x.kind === "string" && byName.has(x.name);
const codingValue = (x) => {
  if (x == null) return null;
  if (typeof x === "string") {
    if (byName.has(x)) return taskCoding(g, x);
    const d = g.data.find((dd) => dd.name === x);
    return d ? d.metaprops?.["ontology.coding"] ?? null : x;
  }
  if (isTask(x)) return taskCoding(g, x.name);
  return x.metaprops?.["ontology.coding"] ?? null;
};
const h = {
  /** Tasks, optionally of one kind (plan, action, enquiry, decision, task). */
  tasks: (kind) => g.tasks.filter((t) => !kind || t.kind === kind),
  task: (name) => byName.get(name) ?? null,
  data: (name) => (name ? g.data.find((d) => d.name === name) ?? null : g.data),
  /** A metaprops value; repeatable keys (source) come back as an array with meta(t, "source", true). */
  meta: (t, key, all = false) => (all ? metaValues(t?.metaprops, key) : t?.metaprops?.[key] ?? null),
  goal: (t) => ({ verb: t?.metaprops?.["goal.verb"] ?? null, noun_phrase: t?.metaprops?.["goal.noun_phrase"] ?? null }),
  /** Monitoring tasks: monitor Actions and ADE Enquiries (not the ADE display or test-order Actions). */
  monitoringTasks: () => g.tasks.filter(isMonitor),
  /** Alias of monitoringTasks (kept for older query files). */
  monitoringActions: () => g.tasks.filter(isMonitor),
  /** ADE Enquiries: monitoring tasks that are Enquiries. */
  monitorEnquiries: () => g.tasks.filter((t) => t.kind === "enquiry" && isMonitor(t)),
  /** The ADE display Action(s) (role=ade_display), with the list items of the caption. */
  adeDisplay: () =>
    g.tasks
      .filter((t) => t.kind === "action" && roleOf(t) === "ade_display")
      .map((t) => ({ ...t, items: (t.caption || "").split(/\r?\n/).map((l) => /^\s*(?:\d+[.)]|[*+-])\s+(.+?)\s*$/.exec(l)?.[1]).filter(Boolean) })),
  /** The data items an Enquiry asks for (its sources), as data item objects. */
  findingsOf: (enquiry) => (byName.get(enquiry)?.sources ?? []).map((s) => g.data.find((d) => d.name === s.data)).filter(Boolean),
  /** Test steps (Order_<Test> Actions, Tests_Ordering_Recommendations_<ADE> Decisions), optionally for one ADE Enquiry:
   *  {name, kind, ordered_for, precondition, tests: [{name, coding, system, code, caption, label}]}
   *  (coding is the raw Composer value; label is the caption, kept for older query files) */
  testSteps: (enquiry) =>
    g.tasks
      .filter((t) => (t.kind === "action" && roleOf(t) === "test_order") || (t.kind === "decision" && roleOf(t) === "test_ordering"))
      .filter((t) => !enquiry || (t.metaprops.ordered_for || "").trim() === enquiry)
      .map((t) => ({
        name: t.name,
        kind: t.kind,
        ordered_for: (t.metaprops.ordered_for || "").trim() || null,
        precondition: t.precondition,
        choice_mode: t.choice_mode ?? null,
        tests: (t.kind === "action" ? [t] : t.candidates).map((x) => {
          const c = h.coding(x);
          return { name: x.name, coding: codingValue(x), system: c?.system ?? null, code: c?.code ?? null, caption: c?.caption ?? null, label: c?.caption ?? null };
        }),
      })),
  /** The ontology coding of a task (read from its component in the parent plan, as Composer does),
   *  a data item, a candidate or a raw value, parsed from Composer's "<prefix>:<code> [<caption>]":
   *  {system: "SCT"|"LNC"|"IC0"|"IC9", code, caption}, or null when uncoded or not in that form. */
  coding: (x) => parseCoding(codingValue(x)),
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
  /** Monitoring tasks whose monitored_target names the given task. */
  monitorsOf: (taskName) =>
    h.monitoringTasks().filter((t) => new RegExp(`(^|[^A-Za-z0-9_])${taskName}([^A-Za-z0-9_]|$)`).test(t.metaprops.monitored_target || "")),
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
