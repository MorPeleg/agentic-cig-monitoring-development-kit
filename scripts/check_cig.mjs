#!/usr/bin/env node
// check_cig.mjs: deterministic Step 7 gate for a PROforma CIG monitoring build.
//
// Usage:
//   node scripts/check_cig.mjs <guideline.pf> [--proposal plans/PROPOSAL-*.md]
//        [--baseline <previous.pf>] [--coding-patch] [--report <file.md>] [--json]
//
// Runs `proforma lint` and `proforma export`, then checks the rules in
// skills/cig-monitoring-review/SKILL.md that need no clinical judgment:
// structure and scope, the monitoring metaprops contract
// (skills/cig-monitoring/references/MetapropsSyntax.md) on every monitoring
// task (Actions and ADE Enquiries), the ADE Enquiry pattern and its test steps
// (skills/cig-monitoring/references/ADEMonitoringEnquiry.md), executable
// preconditions, the approved action set (cig-actions, cig-test-decisions),
// baseline regressions and the coding-patch freeze. Exit code 0 = PASS, 1 = FAIL, 2 = usage/input error.
// The judgment phases (case-report harm, source fidelity, label coverage) are
// added to the report by the reviewer.

import fs from "node:fs";
import path from "node:path";
import { exportGuideline, inCp1252, lintGuideline, metaValues } from "./lib/proforma.mjs";

// ------------------------------------------------------------------ args

const opts = { file: null, proposal: null, baseline: null, codingPatch: false, report: null, json: false };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  const next = () => {
    if (i + 1 >= argv.length) usage(`missing value for ${a}`);
    return argv[++i];
  };
  if (a === "--proposal") opts.proposal = next();
  else if (a === "--baseline") opts.baseline = next();
  else if (a === "--coding-patch") opts.codingPatch = true;
  else if (a === "--report") opts.report = next();
  else if (a === "--json") opts.json = true;
  else if (a === "-h" || a === "--help") usage(null, 0);
  else if (a.startsWith("--")) usage(`unknown option ${a}`);
  else if (!opts.file) opts.file = a;
  else usage(`unexpected argument ${a}`);
}
if (!opts.file) usage("missing <guideline.pf>");
if (opts.codingPatch && !opts.baseline) usage("--coding-patch needs --baseline <previous.pf>");

function usage(msg, code = 2) {
  if (msg) console.error(`check_cig: ${msg}`);
  console.error(
    "usage: node scripts/check_cig.mjs <guideline.pf> [--proposal PROPOSAL.md] [--baseline previous.pf] [--coding-patch] [--report out.md] [--json]"
  );
  process.exit(code);
}

// ------------------------------------------------------------ contract

const VOCAB = {
  category: ["action_completion", "desired_outcome", "undesired_ade"],
  provenance_type: [
    "guideline_specified",
    "assistant_completed_from_guidelines",
    "package_insert_specified",
    "mechanism_prompted_then_assistant_independent_literature_search_and_operationalized",
    "assistant_independent_literature_search_and_operationalized",
  ],
  source_kind: [
    "clinical_guideline",
    "package_insert",
    "case_report",
    "screening_instrument",
    "safety_source",
    "mechanism_reasoning",
  ],
  guideline_status: ["specified_as_a_guideline_monitoring_task", "not_specified_as_a_guideline_monitoring_task"],
  monitoring_stance: ["recommended", "symptom_triggered_only", "routine_not_recommended", "proposed_by_assistant"],
};
const REQUIRED = [
  "ServiceRequest.intent",
  "ServiceRequest.code",
  "ServiceRequest.occurrenceTiming",
  "ServiceRequest.patientInstruction",
  "category",
  "monitored_target",
  "applies_when",
  "provenance_type",
  "source_kind",
  "knowledge_origin",
  "guideline_status",
  "monitoring_stance",
  "literature_basis",
  "assistant_invention",
  "instrument",
  "monitoring_frequency_basis",
  "trigger",
  "cq",
];
// the HL7 FHIR ServiceRequest block of a monitoring order (keys and goal.noun_phrase)
const SR_FIELDS = ["intent", "code", "occurrenceTiming", "patientInstruction", "performerInstruction"];
// Composer's native "Ontology coding" property (metaprop ontology.coding, SCHEME:code) and its
// preferred term. These are the only keys a coding-only run may add or change.
const ONTOLOGY_KEYS = /^ontology\.(coding|label)$/;
const CODING = /^[A-Za-z][A-Za-z0-9_-]*:[A-Za-z0-9][A-Za-z0-9.-]*$/;
const SNOMED_CODE = /^\d{6,18}$/;
const LOINC_CODE = /^\d{1,7}-\d$/;
// roles of the ADE Enquiry pattern (ADEMonitoringEnquiry.md); these tasks have their own rules
const ROLE_DISPLAY = "ade_display";
const ROLE_TEST_ORDER = "test_order";
const ROLE_TEST_DECISION = "test_ordering";
const ADE_PLAN = "Monitor_Undesired_State";
// keys of an intermediate contract that held the order outside the ServiceRequest block
const ORDER_KEYS = /^order\./;
// a quote is a verbatim excerpt in double quotes, normally prefixed by its page or section
const QUOTED = /"[^"]{3,}"|“[^”]{3,}”/;
const QUOTE_MAX_WORDS = 40;
const PLACEHOLDERS = new Set(["", "o", "p", "s", "i", "t", "x", "tbd", "todo", "xxx", "...", "n/a", "na", "none?", "?"]);
const CADENCE = /baseline|visit|daily|weekly|monthly|quarterly|annual|yearly|q\d|every|escalat|event|symptom|trigger|onset|dose|day|week|month|year|hour/i;
const ROUTINE = /baseline|daily|weekly|monthly|quarterly|annual|yearly|\bq\d|every \d/i;
const TRIGGERED = /triggered|on symptoms|if symptom|symptom-triggered|when symptomatic|testing on symptom|urgent|same-day/i;
const CITATION = /PMID|PMC\d|doi|10\.\d{4,}\/|guideline|label|prescribing information|insert|standards|CPG|recommendation|NICE|WHO|ADA|AGA|ESMO|instrument|questionnaire|scale|§|\b(19|20)\d\d\b/i;
const HAND_COUNT = /\b\d+\s+(?:\w+\s+){0,2}(?:actions?|monitors?|monitoring items?|tasks?)\b/i;

// ------------------------------------------------------------- inputs

let g;
let lint;
try {
  lint = lintGuideline(opts.file);
  g = exportGuideline(opts.file);
} catch (e) {
  console.error(`check_cig: ${e.message}`);
  process.exit(2);
}
const proposal = opts.proposal ? readProposal(opts.proposal) : null;
if (proposal?.mode === "coding-patch") opts.codingPatch = true;
if (opts.codingPatch && !opts.baseline) {
  console.error("check_cig: a coding-patch run needs --baseline <snapshot taken before the patch>");
  process.exit(2);
}
let base = null;
if (opts.baseline) {
  try {
    base = exportGuideline(opts.baseline);
  } catch (e) {
    console.error(`check_cig: baseline: ${e.message}`);
    process.exit(2);
  }
}

function readProposal(file) {
  const text = fs.readFileSync(file, "utf8");
  const block = (tag) => {
    const m = new RegExp("```" + tag + "\\s*\\n([\\s\\S]*?)```").exec(text);
    if (!m) return null;
    return m[1]
      .split(/\r?\n/)
      .map((l) => l.replace(/#.*$/, "").trim())
      .filter(Boolean);
  };
  // accepts "status: approved" (front matter) and markdown such as "**Status:** approved"
  const header = (key) =>
    new RegExp("^\\s*(?:[-*]\\s+)?\\**" + key + "\\**\\s*:\\s*\\**\\s*\x60?([A-Za-z][\\w-]*)", "im").exec(text)?.[1]?.toLowerCase() || null;
  const status = header("status");
  const mode = header("mode");
  return {
    file,
    status,
    mode,
    actions: block("cig-actions"),
    testDecisions: block("cig-test-decisions"),
    excluded: block("cig-excluded") || [],
  };
}

// ------------------------------------------------------------- checks

const findings = []; // {level: FAIL|WARN, area, where, message}
const fail = (area, where, message) => findings.push({ level: "FAIL", area, where, message });
const warn = (area, where, message) => findings.push({ level: "WARN", area, where, message });

const tasks = g.tasks;
const byName = new Map(tasks.map((t) => [t.name, t]));
const actions = tasks.filter((t) => t.kind === "action");
const verb = (t) => (t.metaprops["goal.verb"] || "").trim().toLowerCase();
const GOAL_VERBS = ["diagnose", "treat", "prevent_primary", "prevent_secondary", "prevent", "avoid", "start", "stop", "order", "achieve"];
const role = (t) => (t.metaprops?.role || "").trim().toLowerCase();
const hasServiceRequest = (t) => Object.keys(t.metaprops || {}).some((k) => k.startsWith("ServiceRequest."));
// Monitoring tasks: Actions with an Action Enactment goal, plus the ADE Enquiries that keep the
// monitor contract (goal.verb=order and a ServiceRequest block). The ADE display Action and the
// test-order Actions also carry goal.verb=order but follow their own rules (ADE pattern below).
const displayActions = actions.filter((t) => role(t) === ROLE_DISPLAY);
const testOrders = actions.filter((t) => role(t) === ROLE_TEST_ORDER);
const testDecisions = tasks.filter((t) => t.kind === "decision" && role(t) === ROLE_TEST_DECISION);
const monitorActions = actions.filter((t) => verb(t) === "order" && ![ROLE_DISPLAY, ROLE_TEST_ORDER].includes(role(t)));
const monitorEnquiries = tasks.filter((t) => t.kind === "enquiry" && verb(t) === "order" && hasServiceRequest(t));
const monitors = [...monitorActions, ...monitorEnquiries];
const therapy = actions.filter((t) => ["achieve", "avoid"].includes(verb(t)));
// what a monitor may trace to: therapy actions, and plans that hold therapy actions but no monitors
const below = (plan, seen = new Set()) =>
  (plan.components || []).flatMap((c) => {
    const t = byName.get(c.task);
    if (!t || seen.has(t.name)) return [];
    seen.add(t.name);
    return [t, ...(t.kind === "plan" ? below(t, seen) : [])];
  });
const therapyTargets = [
  ...therapy.map((t) => t.name),
  ...tasks
    .filter((p) => p.kind === "plan" && p.name !== g.root)
    .filter((p) => {
      const d = below(p);
      return d.some((x) => therapy.includes(x)) && !d.some((x) => monitors.includes(x));
    })
    .map((p) => p.name),
];
const askedData = new Set(g.data.filter((d) => d.asked_by.length).map((d) => d.name));
const dataNames = new Set(g.data.map((d) => d.name));

// lint; these warnings mean a condition can never work as written, so they FAIL:
// unknown candidate (X061) or task (X062), result_of/result_set on a non-decision
// (V051/V053), untypeable expression (V034), unknown function (V030)
const BROKEN = new Set(["PF-X061", "PF-X062", "PF-V051", "PF-V053", "PF-V034", "PF-V030"]);
for (const d of lint) {
  const where = d.component || "guideline";
  if (d.severity === "error" || BROKEN.has(d.code)) fail("lint", where, `${d.code}: ${d.message}`);
  else if (d.severity === "warning") warn("lint", where, `${d.code}: ${d.message}`);
}

// encoding: Composer (Java 8 on Windows) reads a .pf as windows-1252. The CLI keeps that
// encoding while every character fits, and switches the whole file to UTF-8 otherwise, which
// Composer then misreads. Text attributes must spell such characters in ASCII (>=, <=, ...);
// metaprops escape them as \uXXXX (scripts/lib/proforma.mjs does both).
{
  const bytes = fs.readFileSync(opts.file);
  let text = null;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    /* not UTF-8: a windows-1252 file, which is what Composer expects */
  }
  const outside = text ? [...new Set([...text].filter((ch) => !inCp1252(ch)))] : [];
  if (outside.length) {
    const holders = tasks
      .filter((t) => [t.caption, t.description, t.procedure, ...Object.values(t.metaprops)].some((v) => v && [...String(v)].some((ch) => outside.includes(ch))))
      .map((t) => t.name);
    fail("structure", "guideline", `the file holds characters outside windows-1252 (${outside.map((c) => `"${c}" U+${c.codePointAt(0).toString(16).toUpperCase()}`).join(", ")}), so it is saved as UTF-8 and Composer will misread it${holders.length ? `; found in ${holders.slice(0, 8).join(", ")}${holders.length > 8 ? ", ..." : ""}` : ""}. Spell them in ASCII in text attributes; metaprops values take \\uXXXX escapes`);
  }
}

// structure and scope
if (!g.root) fail("structure", "guideline", "no root plan");
for (const t of tasks) {
  if (!t.reachable) fail("structure", t.name, `${t.kind} is not reachable from the root plan (residue or a missing component)`);
  if (t.kind === "plan" && t.components.length === 0) fail("structure", t.name, "empty plan (no components)");
  if (t.kind === "enquiry" && t.sources.length === 0) fail("structure", t.name, "Enquiry with no data items (sources)");
  if (t.kind === "decision") {
    if (t.candidates.length === 0) fail("structure", t.name, "Decision with no candidates");
    for (const c of t.candidates) {
      if (c.arguments.length === 0) fail("structure", `${t.name}/${c.name}`, "candidate with no arguments (criteria)");
    }
  }
  if (t.kind === "action" && !verb(t)) fail("structure", t.name, "Action without a goal (metaprops goal.verb)");
  if (verb(t) && !GOAL_VERBS.includes(verb(t))) fail("structure", t.name, `goal.verb outside the vocabulary: ${verb(t)}`);
  else if (t.kind === "action" && verb(t) && !["order", "achieve", "avoid"].includes(verb(t))) {
    warn("structure", t.name, `Action goal.verb ${verb(t)} is neither a monitoring (order) nor a therapy (achieve/avoid) goal; it is not graded`);
  }
  if ((t.kind === "action" || monitorEnquiries.includes(t)) && verb(t) && !(t.metaprops["goal.noun_phrase"] || "").trim()) {
    fail("structure", t.name, "goal.verb without goal.noun_phrase");
  }
  for (const k of Object.keys(t.metaprops)) {
    if (k.startsWith("owl.")) fail("structure", t.name, `migration leftover ${k}: formalize it as PROforma or remove it`);
  }
  const orderKeys = Object.keys(t.metaprops).filter((k) => ORDER_KEYS.test(k));
  if (orderKeys.length) fail("structure", t.name, `keys ${orderKeys.join(", ")}: the order lives in the ServiceRequest.* block; convert with scripts/migrate_metaprops.mjs`);
}
for (const d of g.data) {
  if (!d.type) fail("structure", d.name, "data item without a type");
  if (!d.asked_by.length && !d.derivation) warn("structure", d.name, "data item no Enquiry asks for and nothing derives");
}

// ontology coding (Composer's native field) on every element that can carry it, and quotes
// wherever a citation is given
const codedElements = [
  ...tasks.map((t) => [t.name, t.metaprops]),
  ...g.data.map((d) => [d.name, d.metaprops]),
  ...tasks.flatMap((t) =>
    t.candidates.flatMap((c) => [
      [`${t.name}/${c.name}`, c.metaprops],
      ...c.arguments.map((a, i) => [`${t.name}/${c.name}/${a.name || i + 1}`, a.metaprops]),
    ])
  ),
];
const RXNORM_CODE = /^\d{1,10}$/;
function rxnormProblems(mp) {
  const v = (mp?.["rxnorm.coding"] || "").trim();
  if (!v) return mp?.["rxnorm.label"] ? ["rxnorm.label without rxnorm.coding"] : [];
  const m = v.match(/^RXNORM:(.*)$/i);
  if (!m || !RXNORM_CODE.test(m[1])) return [`rxnorm.coding must be RXNORM:<rxcui> (digits), is "${v}"`];
  if (!(mp?.["rxnorm.label"] || "").trim()) return ["rxnorm.coding without rxnorm.label"];
  return [];
}
function codingProblems(mp) {
  const rx = rxnormProblems(mp);
  if (rx.length) return rx;
  const v = (mp?.["ontology.coding"] || "").trim();
  if (!v) return mp?.["ontology.label"] ? ["ontology.label without ontology.coding"] : [];
  if (!CODING.test(v)) return [`ontology.coding must be SCHEME:code (e.g. SNOMED:197456007), is "${v}"`];
  const [scheme, code] = v.split(":");
  if (/^SNOMED(CT)?$/i.test(scheme) && !SNOMED_CODE.test(code)) return [`ontology.coding ${v} is not a SNOMED CT concept id (6-18 digits)`];
  if (/^LOINC$/i.test(scheme) && !LOINC_CODE.test(code)) return [`ontology.coding ${v} is not a LOINC code (LOINC:<1-7 digits>-<check digit>)`];
  return [];
}
// An element that cites sources must quote at least one of them verbatim (FAIL); a citation
// without its own quote is a WARN, since some cited works (e.g. an instrument's validation
// paper) are not among the provided sources.
function quoteProblems(mp) {
  const out = [];
  const keys = Object.keys(mp || {});
  const cited = keys.filter((k) => /^source(?:\.\d+)?$/.test(k));
  const quoted = keys.filter((k) => /^quote(?:\.\d+)?$/.test(k) && (mp[k] || "").trim());
  if (cited.length && !quoted.length) out.push({ level: "FAIL", message: "cites sources but quotes none (add quote.N: the verbatim passage it was modelled from)" });
  for (const k of keys) {
    const s = /^source(?:\.(\d+))?$/.exec(k);
    if (s && quoted.length) {
      const qk = s[1] ? `quote.${s[1]}` : "quote";
      if (!(mp[qk] || "").trim()) out.push({ level: "WARN", message: `${k} has no ${qk}; quote it if the cited document is available` });
    }
    const q = /^quote(?:\.(\d+))?$/.exec(k);
    if (q) {
      const v = (mp[k] || "").trim();
      const sk = q[1] ? `source.${q[1]}` : "source";
      if (!(mp[sk] || "").trim()) out.push({ level: "FAIL", message: `${k} has no matching ${sk} citation` });
      if (!QUOTED.test(v)) out.push({ level: "FAIL", message: `${k} holds no verbatim excerpt in double quotes: ${v}` });
      else if (v.split(/\s+/).length > QUOTE_MAX_WORDS) out.push({ level: "WARN", message: `${k} is longer than ${QUOTE_MAX_WORDS} words; quote the passage, not the section` });
    }
  }
  return out;
}
for (const [where, mp] of codedElements) {
  for (const p of codingProblems(mp)) fail("annotation", where, p);
  if (mp?.["ontology.coding"] && !mp["ontology.label"]) warn("annotation", where, "ontology.coding without ontology.label (the term's preferred name)");
  for (const p of quoteProblems(mp)) (p.level === "FAIL" ? fail : warn)("annotation", where, p.message);
}
if (!g.metadata.title) fail("annotation", "metadata", "no metadata title");
if (g.metadata.desc && HAND_COUNT.test(g.metadata.desc)) {
  fail("annotation", "metadata", `desc contains a hand-written count ("${HAND_COUNT.exec(g.metadata.desc)[0]}"); describe the build qualitatively`);
}

// unknown names in conditions: PROforma reads an unknown bare word as a text literal, so a
// misspelt or missing data item makes the condition silently false. A bare word is accepted
// only as the value side of a comparison (e.g. contraindications = none).
const known = new Set([
  ...tasks.map((t) => t.name.toLowerCase()),
  ...g.data.map((d) => d.name.toLowerCase()),
  ...g.functions.map((x) => x.name.toLowerCase()),
  ...tasks.flatMap((t) => t.candidates.map((c) => c.name.toLowerCase())),
]);
const OPERATORS = new Set(["and", "or", "includes", "includesall", "includesany", "oneof", "matches", "matchesall", "matchesany", "true", "false", "yes", "no", "unknown"]);
function unknownNames(expr) {
  const text = expr.replace(/"(?:[^"\\]|\\.)*"/g, '""');
  const out = [];
  const re = /'([^']+)'|\b([A-Za-z_][A-Za-z0-9_]*)\b/g;
  let m;
  while ((m = re.exec(text))) {
    const name = m[1] ?? m[2];
    const before = text.slice(0, m.index).trimEnd();
    const after = text.slice(m.index + m[0].length).trimStart();
    if (after.startsWith("(")) continue; // function call
    if (/^\d/.test(name) || OPERATORS.has(name.toLowerCase()) || known.has(name.toLowerCase())) continue;
    if (/(?:<>|<=|>=|=|<|>)$/.test(before)) continue; // compared value (text atom)
    if (/\b(?:days|weeks|hours|minutes|seconds)$/.test(name)) continue;
    out.push(name);
  }
  return [...new Set(out)];
}
const conditionsOf = (t) => [
  ["precondition", t.precondition],
  ["wait_condition", t.wait_condition],
  ["abort", t.abort],
  ["terminate", t.terminate],
  ...t.candidates.flatMap((c) => [
    [`candidate ${c.name} recommendation`, c.recommendation],
    ...c.arguments.map((a, i) => [`candidate ${c.name} argument ${a.name || i + 1}`, a.condition]),
  ]),
];
for (const t of tasks) {
  for (const [where, expr] of conditionsOf(t)) {
    if (!expr) continue;
    const names = unknownNames(expr);
    if (names.length) fail("structure", t.name, `${where} uses ${names.join(", ")}, which is not a data item, task or candidate (misspelt or missing; PROforma would read it as text)`);
  }
}
for (const d of g.data) {
  if (!d.derivation) continue;
  const names = unknownNames(d.derivation);
  if (names.length) fail("structure", d.name, `derivation uses unknown name(s) ${names.join(", ")}`);
}

// therapy actions: goal, native fields, and the source passage the recommendation came from
for (const t of therapy) {
  if (!(t.metaprops["goal.noun_phrase"] || "").trim()) fail("therapy", t.name, "State Achievement goal without goal.noun_phrase");
  if (!(t.caption || "").trim()) fail("therapy", t.name, "therapy action without a caption");
  if (!(t.description || "").trim()) fail("therapy", t.name, "therapy action without a description (why it was modelled)");
  if (!(t.procedure || "").trim()) warn("therapy", t.name, "therapy action without a procedure (what to do, e.g. the dose and titration)");
  const sources = metaValues(t.metaprops, "source");
  if (!sources.length) fail("therapy", t.name, "therapy action without a source / source.N citation and its quote");
  for (const s of sources) {
    if (s.trim().length < 6 || !CITATION.test(s)) fail("therapy", t.name, `source without a citation token (PMID/DOI or a named guideline/label/instrument): ${s}`);
  }
  if (!t.metaprops["ontology.coding"]) warn("therapy", t.name, "no ontology.coding (SNOMED CT concept for the procedure or substance)");
}

// monitoring tasks (Actions and ADE Enquiries): the metaprops contract
const rows = [];
for (const t of monitors) {
  const m = t.metaprops;
  const row = { action: t.name, kind: t.kind, category: m.category || "", checks: {}, verdict: "PASS" };
  const bad = (check, message) => {
    row.checks[check] = false;
    fail("metaprops", t.name, message);
  };
  const ok = (check) => {
    if (row.checks[check] === undefined) row.checks[check] = true;
  };

  // required keys with real content, no placeholders
  for (const k of REQUIRED) {
    const v = (m[k] || "").trim();
    if (!v) bad("required", `missing ${k}`);
    else if (PLACEHOLDERS.has(v.toLowerCase()) || v.length < 2) bad("placeholders", `placeholder value ${k}=${v}`);
  }
  for (const [k, v] of Object.entries(m)) {
    if (k.startsWith("goal.") || REQUIRED.includes(k)) continue;
    if (PLACEHOLDERS.has(String(v).trim().toLowerCase())) bad("placeholders", `placeholder value ${k}=${v}`);
  }
  ok("required");
  ok("placeholders");

  // the order: the HL7 FHIR ServiceRequest on the Action
  if (m["ServiceRequest.intent"] && m["ServiceRequest.intent"].trim() !== "order") {
    bad("serviceRequest", `ServiceRequest.intent must be order (is ${m["ServiceRequest.intent"]})`);
  }
  const code = (m["ServiceRequest.code"] || "").trim();
  const timing = (m["ServiceRequest.occurrenceTiming"] || "").trim();
  if (timing && !CADENCE.test(timing)) bad("serviceRequest", `occurrenceTiming names no cadence or trigger: ${timing}`);
  const triggered = TRIGGERED.test(`${code} ${timing}`);
  if (triggered && !m["ServiceRequest.performerInstruction"]) {
    bad("serviceRequest", "triggered/urgent step without ServiceRequest.performerInstruction");
  } else if (!m["ServiceRequest.performerInstruction"] && m.trigger && m.trigger.trim().toLowerCase() !== "none") {
    warn("metaprops", t.name, `trigger is set ("${m.trigger}") but there is no ServiceRequest.performerInstruction; confirm none is needed`);
  }
  ok("serviceRequest");

  // native fields: what Composer shows on the task itself. An Enquiry has no procedure, so its
  // description carries the order instead (ADEMonitoringEnquiry.md).
  if (!(t.caption || "").trim()) bad("native", "no caption");
  if (!(t.description || "").trim()) bad("native", "no description (what is monitored and why it was modelled)");
  if (t.kind === "enquiry") {
    const desc = (t.description || "").trim().toLowerCase();
    const why = "(an Enquiry has no procedure: its description carries the order)";
    if (desc && code && !desc.includes(code.toLowerCase())) bad("native", `description does not state ServiceRequest.code ${why}`);
    else if (desc && timing && !desc.includes(timing.toLowerCase())) bad("native", `description does not state ServiceRequest.occurrenceTiming ${why}`);
  } else {
    const proc = (t.procedure || "").trim();
    if (!proc) bad("native", "no procedure (the order as the instruction Composer shows on the action)");
    else if (code && !proc.toLowerCase().includes(code.toLowerCase())) bad("native", "procedure does not state ServiceRequest.code");
    else if (timing && !proc.toLowerCase().includes(timing.toLowerCase())) bad("native", "procedure does not state ServiceRequest.occurrenceTiming");
  }
  ok("native");

  // the ServiceRequest on the Goal, consistent with the Action. goal.noun_phrase joins the
  // fields with "; ", so a value containing ";" cannot round-trip.
  for (const f of SR_FIELDS) {
    if ((m[`ServiceRequest.${f}`] || "").includes(";")) {
      bad("goalConsistency", `ServiceRequest.${f} contains ";" (the goal.noun_phrase field separator); use commas inside the value`);
    }
  }
  const goalSR = {};
  for (const part of (m["goal.noun_phrase"] || "").split(/;\s*/)) {
    const mm = /^ServiceRequest\.([A-Za-z.]+)\s*=\s*([\s\S]*)$/.exec(part.trim());
    if (mm) goalSR[mm[1]] = mm[2].trim();
  }
  for (const f of SR_FIELDS) {
    const onAction = (m[`ServiceRequest.${f}`] || "").trim();
    const onGoal = goalSR[f];
    if (onAction && onGoal === undefined) bad("goalConsistency", `goal.noun_phrase lacks ServiceRequest.${f}`);
    else if (!onAction && onGoal !== undefined) bad("goalConsistency", `goal.noun_phrase has ServiceRequest.${f} but the metaprops do not`);
    else if (onAction && onGoal !== onAction) bad("goalConsistency", `ServiceRequest.${f} differs between goal.noun_phrase and metaprops`);
  }
  ok("goalConsistency");

  // citations, each with the verbatim passage it came from
  const sources = metaValues(m, "source");
  if (!sources.length) bad("citations", "no source / source.N citation");
  for (const s of sources) {
    if (s.trim().length < 6 || !CITATION.test(s)) bad("citations", `source without a citation token (PMID/DOI or a named guideline/label/instrument): ${s}`);
  }
  ok("citations");
  const qp = quoteProblems(m).filter((p) => p.level === "FAIL");
  if (qp.length) {
    row.checks.quotes = false; // already reported as annotation FAILs above
    row.verdictNote = qp.map((p) => p.message).join("; ");
  }
  ok("quotes");

  // ontology coding: optional (added by the coding pass), but checked when present
  row.checks.coding = !codingProblems(m).length;
  if (!m["ontology.coding"]) warn("metaprops", t.name, "no ontology.coding (SNOMED CT concept for the monitored condition or measurement); run the coding pass");

  // controlled vocabularies
  for (const [k, vocab] of Object.entries(VOCAB)) {
    const v = (m[k] || "").trim();
    if (!v) continue;
    if (k === "source_kind") {
      const parts = v.split(/\+|_plus_/).map((p) => p.trim()).filter(Boolean);
      const unknown = parts.filter((p) => !vocab.some((w) => p.includes(w)));
      if (unknown.length) bad("vocab", `source_kind outside the vocabulary: ${unknown.join(", ")}`);
    } else if (!vocab.includes(v)) bad("vocab", `${k} outside the vocabulary: ${v}`);
  }
  ok("vocab");

  // traceability: monitored_target names an existing task
  const target = m.monitored_target || "";
  const traced = therapyTargets.some((x) => new RegExp(`(^|[^A-Za-z0-9_])${x}([^A-Za-z0-9_]|$)`).test(target));
  if (target && !traced) {
    if (therapyTargets.length) bad("traceability", "monitored_target names no therapy action (goal achieve/avoid) or therapy plan of this guideline");
    else warn("metaprops", t.name, "no therapy action or plan in this guideline (e.g. ADE-only scope): the reviewer must confirm monitored_target against the approved proposal");
  }
  ok("traceability");

  // applicability: a sub-population needs an executable precondition
  const applies = (m.applies_when || "").trim();
  if (applies && applies !== "all_patients_on_therapy") {
    if (!t.precondition) bad("appliesWhen", `applies_when is a sub-population (${applies}) but there is no precondition`);
    else {
      const refs = (t.precondition.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).filter((n) => dataNames.has(n));
      if (!refs.length) bad("appliesWhen", `precondition "${t.precondition}" uses no data item`);
      else if (!refs.some((n) => askedData.has(n))) bad("appliesWhen", `precondition data (${refs.join(", ")}) is not asked by any Enquiry`);
    }
  } else if (t.precondition && applies === "all_patients_on_therapy") {
    warn("metaprops", t.name, `precondition "${t.precondition}" on an action that applies to all patients on therapy`);
  }
  ok("appliesWhen");

  // stance <-> schedule
  if ((m.monitoring_stance || "").trim() === "routine_not_recommended" && ROUTINE.test(timing) && !/symptom|trigger|event/i.test(timing)) {
    bad("stance", `monitoring_stance=routine_not_recommended but occurrenceTiming is a routine schedule (${timing})`);
  }
  ok("stance");

  // case reports need explicit proposal scope
  if (/case_report/.test(m.source_kind || "")) {
    if (!proposal?.actions) bad("caseReport", "case-report action: pass --proposal with a cig-actions block that lists it");
    else if (!proposal.actions.includes(t.name)) bad("caseReport", "case-report action not in the approved proposal's action set");
  }
  ok("caseReport");

  row.verdict = Object.values(row.checks).every(Boolean) ? "PASS" : "FAIL";
  rows.push(row);
}

// duplicate monitors (two actions for one order)
const seenOrder = new Map();
for (const t of monitors) {
  const m = t.metaprops;
  const keys = [
    (m["goal.noun_phrase"] || "").trim().toLowerCase(),
    `${(m["ServiceRequest.code"] || "").trim().toLowerCase()}|${(m["ServiceRequest.occurrenceTiming"] || "").trim().toLowerCase()}`,
  ];
  for (const k of keys) {
    if (!k || k === "|") continue;
    if (seenOrder.has(k)) fail("structure", t.name, `duplicates ${seenOrder.get(k)} (same order); one monitoring task per monitored item`);
    else seenOrder.set(k, t.name);
  }
}

// ADE monitoring as Enquiries with test ordering (ADEMonitoringEnquiry.md)
// The ADE plan is Monitor_Undesired_State; a guideline without it (e.g. an ADE-only build whose
// root has another name) is checked wherever it uses the pattern (an ADE Enquiry or the display).
const componentsOf = (p) => (p?.components || []).map((c) => ({ ...c, t: byName.get(c.task) })).filter((c) => c.t);
const componentIn = (taskName) => {
  for (const p of tasks.filter((x) => x.kind === "plan")) {
    const c = (p.components || []).find((cc) => cc.task === taskName);
    if (c) return { plan: p, component: c };
  }
  return null;
};
const adePlans = byName.get(ADE_PLAN)?.kind === "plan"
  ? [byName.get(ADE_PLAN)]
  : tasks.filter((p) => p.kind === "plan" && componentsOf(p).some((c) => monitorEnquiries.includes(c.t) || displayActions.includes(c.t)));
const adeEnquiries = new Set();
const tokens = (s) =>
  new Set(
    String(s || "")
      .replace(/\([^)]*\)/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length >= 4 && !["monitor", "monitoring", "with", "from", "drug", "induced", "related", "disorder", "finding"].includes(w))
      .map((w) => w.slice(0, 5))
  );
const LIST_ITEM = /^\s*(?:\d+[.)]|[*+-])\s+(.+?)\s*$/;
for (const p of adePlans) {
  const comps = componentsOf(p);
  const enq = comps.filter((c) => monitorEnquiries.includes(c.t));
  const actMon = comps.filter((c) => monitorActions.includes(c.t));
  enq.forEach((c) => adeEnquiries.add(c.t.name));
  for (const c of actMon) {
    fail("ade", c.t.name, `ADE monitor in ${p.name} is an Action (category=${c.t.metaprops.category || "unset"}); model it as an Enquiry of the same name whose data items are the symptoms and exam findings, followed by its test step (ADEMonitoringEnquiry.md)`);
  }
  for (const c of enq) {
    if ((c.t.metaprops.category || "").trim() !== "undesired_ade") warn("ade", c.t.name, `monitoring Enquiry in ${p.name} has category=${c.t.metaprops.category || "unset"}, expected undesired_ade`);
  }
  for (const c of comps.filter((cc) => cc.t.kind === "decision" && !testDecisions.includes(cc.t))) {
    fail("ade", c.t.name, `Decision in ${p.name} without role=${ROLE_TEST_DECISION}; a test-ordering Decision needs that role (and ordered_for) to be checked as a test step`);
  }
  for (const c of comps.filter((cc) => cc.t.kind === "action" && /^Order_/.test(cc.t.name) && !testOrders.includes(cc.t))) {
    fail("ade", c.t.name, `Order_ Action in ${p.name} without role=${ROLE_TEST_ORDER}; a test order needs that role (and ordered_for)`);
  }
  const adeMonitors = [...enq, ...actMon];
  if (!adeMonitors.length) continue;
  const disp = comps.filter((c) => displayActions.includes(c.t));
  if (!disp.length) {
    fail("ade", p.name, `holds ADE monitors but no Display_Potential_ADEs Action (role=${ROLE_DISPLAY}) listing them as its first component`);
    continue;
  }
  if (disp.length > 1) fail("ade", p.name, `more than one ADE display Action (${disp.map((c) => c.t.name).join(", ")}); keep one Display_Potential_ADEs`);
  const d = disp[0];
  if (d.t.name !== "Display_Potential_ADEs") warn("ade", d.t.name, "the ADE display Action is canonically named Display_Potential_ADEs");
  if (d.after.length) fail("ade", d.t.name, `must be the first component of ${p.name}, but runs after ${d.after.join(", ")}`);
  for (const c of enq) {
    if (!c.after.includes(d.t.name)) fail("ade", c.t.name, `ADE Enquiry is not scheduled after ${d.t.name} (add_task(after: ["${d.t.name}"]))`);
  }
  const items = (d.t.caption || "").split(/\r?\n/).map((l) => LIST_ITEM.exec(l)?.[1]).filter(Boolean);
  if (items.length !== adeMonitors.length) {
    fail("ade", d.t.name, `caption lists ${items.length} ADE(s) but ${p.name} holds ${adeMonitors.length} ADE monitor(s); one Markdown list item per ADE Enquiry, one per line`);
  }
  const monTokens = adeMonitors.map((c) => ({ name: c.t.name, tok: new Set([...tokens(c.t.name), ...tokens(c.t.caption), ...tokens(c.t.metaprops["ontology.label"])]) }));
  const overlaps = (a, b) => [...a].some((x) => b.has(x));
  for (const it of items) {
    if (!monTokens.some((m) => overlaps(tokens(it), m.tok))) warn("ade", d.t.name, `list item "${it}" does not obviously name any ADE Enquiry of ${p.name}; check the list against the Enquiries`);
  }
  for (const m of monTokens) {
    if (items.length && !items.some((it) => overlaps(tokens(it), m.tok))) warn("ade", d.t.name, `no list item obviously names ${m.name}; check the list against the Enquiries`);
  }
}
// the display Action: its own goal; it needs no ServiceRequest block and no source
for (const t of displayActions) {
  if (verb(t) !== "order") fail("ade", t.name, `ADE display Action needs goal.verb=order (is ${verb(t) || "unset"})`);
  if (!(t.caption || "").trim()) fail("ade", t.name, "ADE display Action without a caption (the Markdown list of the ADEs)");
  if (!adePlans.some((p) => componentsOf(p).some((c) => c.t === t))) warn("ade", t.name, `ADE display Action outside ${ADE_PLAN}`);
}
// findings an ADE Enquiry asks for are coded in SNOMED CT
for (const t of monitorEnquiries) if ((t.metaprops.category || "").trim() === "undesired_ade") adeEnquiries.add(t.name);
const findingsOf = (enqName) => (byName.get(enqName)?.sources || []).map((s) => s.data);
for (const e of adeEnquiries) {
  for (const dn of findingsOf(e)) {
    const d = g.data.find((x) => x.name === dn);
    const v = (d?.metaprops?.["ontology.coding"] || "").trim();
    if (!v) fail("ade", dn, `data item asked by the ADE Enquiry ${e} has no ontology.coding (SNOMED:<id> + ontology.label, via snomed_search)`);
    else if (!/^SNOMED(CT)?:/i.test(v)) fail("ade", dn, `data item asked by the ADE Enquiry ${e} is coded ${v}; findings are coded in SNOMED CT (SNOMED:<id>)`);
  }
}
// test steps: Order_<Test> Actions and Tests_Ordering_Recommendations_<ADE> Decisions
const stepsFor = new Map();
for (const t of [...testOrders, ...testDecisions]) {
  const kindName = t.kind === "action" ? "test-order Action" : "test-ordering Decision";
  const target = (t.metaprops.ordered_for || "").trim();
  if (!target) fail("ade", t.name, `${kindName} without ordered_for (the ADE Enquiry it follows)`);
  else if (!monitorEnquiries.some((e) => e.name === target)) fail("ade", t.name, `ordered_for=${target} names no ADE Enquiry of this guideline`);
  else {
    stepsFor.set(target, [...(stepsFor.get(target) || []), t.name]);
    const where = componentIn(t.name);
    const enqWhere = componentIn(target);
    if (!where || !enqWhere || where.plan !== enqWhere.plan) fail("ade", t.name, `${kindName} is not in the same plan as ${target}`);
    else if (!where.component.after.includes(target)) fail("ade", t.name, `${kindName} is not scheduled after ${target} (add_task(after: ["${target}"]))`);
    const pre = (t.precondition || "").trim();
    const asked = new Set(findingsOf(target));
    const reads = (pre.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).filter((n) => asked.has(n));
    if (!pre) fail("ade", t.name, `${kindName} without a precondition (it runs only when at least one finding of ${target} is positive)`);
    else if (!reads.length) fail("ade", t.name, `precondition "${pre}" reads no data item that ${target} asks for`);
  }
  if (t.kind === "action") {
    if (verb(t) !== "order") fail("ade", t.name, `test-order Action needs goal.verb=order (is ${verb(t) || "unset"})`);
    if (!(t.caption || "").trim()) fail("ade", t.name, "test-order Action without a caption");
    if (!(t.description || "").trim()) fail("ade", t.name, "test-order Action without a description (why the test is ordered and for which ADE)");
    if (!(t.procedure || "").trim()) fail("ade", t.name, "test-order Action without a procedure (Order <test> when <finding condition>)");
    if (!/^Order_/.test(t.name)) warn("ade", t.name, "a test-order Action is canonically named Order_<Test>");
    const v = (t.metaprops["ontology.coding"] || "").trim();
    if (!v) fail("ade", t.name, "test-order Action without a LOINC ontology.coding (LOINC:<code> + ontology.label, via loinc_search)");
    else if (!/^LOINC:/i.test(v)) fail("ade", t.name, `test-order Action is coded ${v}; tests are coded in LOINC (LOINC:<code>)`);
  } else {
    if ((t.choice_mode || "").trim().toLowerCase() !== "multiple") fail("ade", t.name, `test-ordering Decision needs choice_mode multiple (is ${t.choice_mode || "single"})`);
    if (!/^Tests_Ordering_Recommendations_/.test(t.name)) warn("ade", t.name, "a test-ordering Decision is canonically named Tests_Ordering_Recommendations_<ADE>");
    if (t.candidates.length === 1) warn("ade", t.name, "test-ordering Decision with a single candidate; one test is an Order_<Test> Action");
    for (const c of t.candidates) {
      const v = (c.metaprops?.["ontology.coding"] || "").trim();
      if (!v) fail("ade", `${t.name}/${c.name}`, "test candidate without a LOINC ontology.coding (LOINC:<code> + ontology.label, via loinc_search)");
      else if (!/^LOINC:/i.test(v)) fail("ade", `${t.name}/${c.name}`, `test candidate is coded ${v}; tests are coded in LOINC (LOINC:<code>)`);
    }
  }
}
for (const [e, steps] of stepsFor) {
  if (steps.length > 1) fail("ade", e, `has ${steps.length} test steps (${steps.join(", ")}); at most one per ADE (an Order_ Action for one test, a Decision for two or more)`);
}

// approved action set: every Action and every monitoring Enquiry (cig-actions), and the test
// Decisions (cig-test-decisions)
if (proposal) {
  if (proposal.status !== "approved") fail("proposal", proposal.file, `proposal status is ${proposal.status || "missing"}, not approved`);
  if (!proposal.actions) fail("proposal", proposal.file, "proposal has no ```cig-actions block (the canonical action set)");
  else {
    const built = new Set([...actions, ...monitorEnquiries].map((t) => t.name));
    const want = new Set(proposal.actions);
    for (const n of want) if (!built.has(n)) fail("proposal", n, "approved action or monitoring Enquiry missing from the guideline");
    for (const n of built) if (!want.has(n)) fail("proposal", n, `${byName.get(n)?.kind === "enquiry" ? "monitoring Enquiry" : "action"} not in the approved proposal's cig-actions (extra or residue)`);
  }
  if (proposal.testDecisions) {
    const built = new Set(testDecisions.map((t) => t.name));
    const want = new Set(proposal.testDecisions);
    for (const n of want) if (!built.has(n)) fail("proposal", n, "approved test-ordering Decision missing from the guideline");
    for (const n of built) if (!want.has(n)) fail("proposal", n, "test-ordering Decision not in the approved proposal's cig-test-decisions (extra or residue)");
  } else if (testDecisions.length) {
    fail("proposal", proposal.file, `the guideline has test-ordering Decisions (${testDecisions.map((t) => t.name).join(", ")}) but the proposal has no \`\`\`cig-test-decisions block listing them`);
  }
  if (opts.codingPatch && proposal.mode && proposal.mode !== "coding-patch") {
    warn("proposal", proposal.file, `--coding-patch given but proposal mode is ${proposal.mode}`);
  }
}

// baseline: regressions (iteration) or the coding-patch freeze
// (a copy of candidates / data items without the ontology keys, which a coding run may change)
const stripCoding = (mp) => Object.fromEntries(Object.entries(mp || {}).filter(([k]) => !ONTOLOGY_KEYS.test(k)));
const uncoded = (items) =>
  JSON.parse(JSON.stringify(items || [])).map((x) => ({
    ...x,
    metaprops: stripCoding(x.metaprops),
    ...(x.arguments ? { arguments: x.arguments.map((a) => ({ ...a, metaprops: stripCoding(a.metaprops) })) } : {}),
  }));
if (base) {
  const names = (gg) => ({
    tasks: new Set(gg.tasks.map((t) => t.name)),
    data: new Set(gg.data.map((d) => d.name)),
    candidates: new Set(gg.tasks.flatMap((t) => t.candidates.map((c) => `${t.name}/${c.name}`))),
    arguments: new Set(
      gg.tasks.flatMap((t) => t.candidates.flatMap((c) => c.arguments.map((a, i) => `${t.name}/${c.name}/${a.name || i + 1}`)))
    ),
  });
  // tasks are matched by name, whatever their kind: a baseline monitoring Action that became an
  // ADE Enquiry of the same name (ADEMonitoringEnquiry.md) is retained, not dropped
  const now = names(g);
  const before = names(base);
  const excluded = new Set(proposal?.excluded || []);
  for (const kind of ["tasks", "data", "candidates", "arguments"]) {
    for (const n of before[kind]) {
      if (now[kind].has(n)) continue;
      const short = n.split("/").pop();
      if (opts.codingPatch) {
        fail("codingPatch", n, `${kind.replace(/s$/, "")} removed in a coding-only run`);
        continue;
      }
      if (excluded.has(n) || excluded.has(short)) continue;
      fail("baseline", n, `${kind.replace(/s$/, "")} present in the baseline is missing (not listed in a cig-excluded block)`);
    }
  }
  // goals of tasks kept from the baseline must not change or disappear
  for (const b of base.tasks) {
    const t = byName.get(b.name);
    const bv = (b.metaprops["goal.verb"] || "").trim().toLowerCase();
    if (!t || !bv || excluded.has(b.name)) continue;
    const nv = verb(t);
    if (nv !== bv) fail("baseline", b.name, `goal.verb changed from ${bv} to ${nv || "(none)"} (list it in cig-excluded with a §10 reason if intended)`);
  }
  if (opts.codingPatch) {
    if (JSON.stringify(g.metadata) !== JSON.stringify(base.metadata)) fail("codingPatch", "metadata", "metadata changed in a coding-only run");
    if (JSON.stringify(g.metaprops) !== JSON.stringify(base.metaprops)) fail("codingPatch", "metaprops", "guideline-level metaprops changed in a coding-only run");
    for (const n of now.tasks) if (!before.tasks.has(n)) fail("codingPatch", n, "task added in a coding-only run");
    const bt = new Map(base.tasks.map((t) => [t.name, t]));
    for (const t of tasks) {
      const b = bt.get(t.name);
      if (!b) continue;
      for (const f of ["kind", "caption", "description", "precondition", "procedure"]) {
        if ((t[f] ?? null) !== (b[f] ?? null)) fail("codingPatch", t.name, `${f} changed in a coding-only run`);
      }
      if (JSON.stringify(t.components) !== JSON.stringify(b.components)) fail("codingPatch", t.name, "plan components/scheduling changed");
      if (JSON.stringify(uncoded(t.candidates)) !== JSON.stringify(uncoded(b.candidates))) fail("codingPatch", t.name, "decision candidates/arguments changed");
      if (JSON.stringify(t.sources) !== JSON.stringify(b.sources)) fail("codingPatch", t.name, "enquiry sources changed");
      const keys = new Set([...Object.keys(t.metaprops), ...Object.keys(b.metaprops)]);
      for (const k of keys) {
        if (ONTOLOGY_KEYS.test(k)) continue;
        if (t.metaprops[k] !== b.metaprops[k]) fail("codingPatch", t.name, `metaprops ${k} changed (only ontology.coding and ontology.label may change)`);
      }
    }
    if (JSON.stringify(uncoded(g.data)) !== JSON.stringify(uncoded(base.data))) fail("codingPatch", "data", "data items changed in a coding-only run");
  }
}

// ------------------------------------------------------------- report

const fails = findings.filter((f) => f.level === "FAIL");
const warns = findings.filter((f) => f.level === "WARN");
const verdict = fails.length ? "FAIL" : "PASS";
const result = {
  file: opts.file,
  verdict,
  counts: {
    tasks: tasks.length,
    actions: actions.length,
    monitoring_tasks: monitors.length,
    monitoring_actions: monitorActions.length,
    monitoring_enquiries: monitorEnquiries.length,
    test_steps: testOrders.length + testDecisions.length,
    therapy_actions: therapy.length,
    data_items: g.data.length,
    fails: fails.length,
    warnings: warns.length,
  },
  actions: rows,
  findings,
};

if (opts.json) console.log(JSON.stringify(result, null, 2));
else {
  console.log(`${verdict}: ${opts.file}`);
  const c = result.counts;
  const enq = c.monitoring_enquiries ? ` (${c.monitoring_actions} actions, ${c.monitoring_enquiries} ADE enquiries; ${c.test_steps} test steps)` : "";
  console.log(`  ${c.monitoring_tasks} monitoring${enq} + ${c.therapy_actions} therapy actions, ${c.data_items} data items; ${c.fails} FAIL, ${c.warnings} WARN`);
  for (const f of findings) console.log(`  ${f.level} [${f.area}] ${f.where}: ${f.message}`);
}

if (opts.report) {
  const yes = (v) => (v === false ? "no" : "yes");
  const cols = ["required", "placeholders", "serviceRequest", "native", "goalConsistency", "citations", "quotes", "coding", "vocab", "traceability", "appliesWhen", "stance", "caseReport"];
  const L = [];
  L.push(`# CIG monitoring review: ${path.basename(opts.file)}`, "");
  L.push(`**Deterministic gate: ${verdict}** (${fails.length} FAIL, ${warns.length} WARN). Generated by \`scripts/check_cig.mjs\` on ${new Date().toISOString()}.`, "");
  L.push(`Guideline: \`${opts.file}\`${proposal ? `; proposal: \`${proposal.file}\` (status ${proposal.status})` : ""}${base ? `; baseline: \`${opts.baseline}\`${opts.codingPatch ? " (coding-patch freeze)" : ""}` : ""}.`, "");
  L.push("## Monitoring tasks", "");
  L.push(`| Task | category | ${cols.join(" | ")} | verdict |`);
  L.push(`|---|---|${cols.map(() => "---").join("|")}|---|`);
  for (const r of rows) L.push(`| ${r.action}${r.kind === "enquiry" ? " (enquiry)" : ""} | ${r.category} | ${cols.map((k) => yes(r.checks[k])).join(" | ")} | ${r.verdict} |`);
  L.push("");
  const section = (title, areas) => {
    const fs_ = findings.filter((f) => areas.includes(f.area));
    L.push(`## ${title}`, "");
    if (!fs_.length) L.push("No findings.", "");
    else {
      for (const f of fs_) L.push(`- **${f.level}** \`${f.where}\`: ${f.message}`);
      L.push("");
    }
  };
  section("Structure, scope and lint", ["lint", "structure", "annotation", "therapy"]);
  section("Metaprops value quality", ["metaprops"]);
  section("ADE Enquiries and test steps", ["ade"]);
  section("Approved action set and baseline", ["proposal", "baseline"]);
  if (opts.codingPatch) section("Coding-only freeze", ["codingPatch"]);
  L.push("## Judgment phases (reviewer)", "");
  L.push("To be completed by the reviewer (see `skills/cig-monitoring-review/SKILL.md`): case-report harm judgment, source fidelity (applicability, negative recommendations, label monitoring instructions), label coverage, whether each `monitored_target` names both what is monitored and the goal it traces to, whether each ADE Enquiry's data items are faithful to its metaprops, and whether each test step orders the right tests with the right LOINC codes.", "");
  L.push("## Fix list", "");
  if (!fails.length) L.push("Nothing to fix from the deterministic gate.");
  else for (const f of fails) L.push(`- [ ] \`${f.where}\`: ${f.message}`);
  L.push("");
  fs.mkdirSync(path.dirname(path.resolve(opts.report)), { recursive: true });
  fs.writeFileSync(opts.report, L.join("\n"));
  if (!opts.json) console.log(`report: ${opts.report}`);
}

process.exit(fails.length ? 1 : 0);
