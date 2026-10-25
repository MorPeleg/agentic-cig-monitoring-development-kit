#!/usr/bin/env node
// migrate_metaprops.mjs: move a CIG's monitoring actions off the FHIR ServiceRequest
// contract onto the current one (skills/cig-monitoring/references/MetapropsSyntax.md).
//
// Usage:
//   node scripts/migrate_metaprops.mjs <guideline.pf> [--dry-run]
//
// For every action with ServiceRequest.* metaprops it
// - moves code, occurrenceTiming, patientInstruction and performerInstruction to
//   order.code, order.timing, order.patient_instruction and order.performer_instruction,
//   and drops ServiceRequest.intent (always "order", the goal verb already says so);
// - rewrites goal.noun_phrase as the plain order sentence "<order.code>, <order.timing>";
// - writes the native procedure: "<order.code>, <order.timing>. Patient: ... Clinician: ...";
// - fills an empty native description with "Monitors <monitored_target>. <literature_basis>."
// Every other key and value is kept. The old ServiceRequest.supportingInfo.*Codes keys are
// dropped and listed, so the coding pass can record them as ontology.coding instead.
// It writes through the proforma CLI (never by hand), then runs `format`.

import { exportGuideline, proforma, setAttribute, setMetaprops } from "./lib/proforma.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry-run");
if (!file) {
  console.error("usage: node scripts/migrate_metaprops.mjs <guideline.pf> [--dry-run]");
  process.exit(2);
}

const clause = (s) => String(s || "").trim().replace(/[.;\s]+$/, "");
const sentence = (s) => {
  const c = clause(s);
  return c ? c[0].toUpperCase() + c.slice(1) : c;
};

const g = exportGuideline(file);
let changed = 0;
const droppedCodes = [];
for (const t of g.tasks) {
  const m = t.metaprops || {};
  if (!Object.keys(m).some((k) => k.startsWith("ServiceRequest."))) continue;
  const order = {
    "order.code": m["ServiceRequest.code"],
    "order.timing": m["ServiceRequest.occurrenceTiming"],
    "order.patient_instruction": m["ServiceRequest.patientInstruction"],
    "order.performer_instruction": m["ServiceRequest.performerInstruction"],
  };
  for (const k of Object.keys(order)) if (!order[k]) delete order[k];
  const next = {};
  for (const [k, v] of Object.entries(m)) {
    if (k.startsWith("ServiceRequest.supportingInfo.")) {
      droppedCodes.push(`${t.name}: ${k}=${v}`);
      continue;
    }
    if (k.startsWith("ServiceRequest.")) continue;
    next[k] = v;
  }
  Object.assign(next, order);
  const code = clause(order["order.code"]);
  const timing = clause(order["order.timing"]);
  // (a comma, not parentheses: timings often carry their own, e.g. "each visit (monthly x3, then q3mo)")
  if (code) next["goal.noun_phrase"] = timing ? `${code}, ${timing}` : code;

  const procedure = [
    code && (timing ? `${sentence(code)}, ${timing}.` : `${sentence(code)}.`),
    order["order.patient_instruction"] && `Patient: ${clause(order["order.patient_instruction"])}.`,
    order["order.performer_instruction"] && `Clinician: ${clause(order["order.performer_instruction"])}.`,
  ].filter(Boolean).join(" ");
  const description = (t.description || "").trim()
    ? null
    : [m.monitored_target && `Monitors ${clause(m.monitored_target)}.`, m.literature_basis && `${sentence(m.literature_basis)}.`].filter(Boolean).join(" ");

  console.log(`${dry ? "would migrate" : "migrating"} ${t.name}`);
  if (dry) continue;
  setMetaprops(file, t.name, next);
  if (procedure && !(t.procedure || "").trim()) setAttribute(file, t.name, "procedure", procedure);
  if (description) setAttribute(file, t.name, "description", description);
  changed++;
}
if (!dry && changed) {
  const r = proforma(["format", "--file", file]);
  if (r.status !== 0) throw new Error(`format failed: ${(r.stderr || r.stdout).trim()}`);
}
console.log(`${dry ? "would migrate" : "migrated"} ${dry ? "" : changed + " "}action(s) in ${file}`);
if (droppedCodes.length) {
  console.log("dropped FHIR coding keys (record them as ontology.coding in the coding pass):");
  for (const d of droppedCodes) console.log(`  ${d}`);
}
