#!/usr/bin/env node
// migrate_metaprops.mjs: bring a CIG's monitoring actions onto the current task contract
// (skills/cig-monitoring/references/MetapropsSyntax.md).
//
// Usage:
//   node scripts/migrate_metaprops.mjs <guideline.pf> [--dry-run]
//
// For every monitoring action (goal.verb=order) it
// - keeps (or restores) the order as the HL7 FHIR ServiceRequest block: a guideline that held
//   the order in order.code / order.timing / order.patient_instruction /
//   order.performer_instruction gets ServiceRequest.code / occurrenceTiming /
//   patientInstruction / performerInstruction back, with ServiceRequest.intent=order;
// - writes goal.noun_phrase as the ServiceRequest string
//   "ServiceRequest.intent = order; ServiceRequest.code = ...; ..." (values identical to the keys);
// - fills an empty native procedure: "<code>, <occurrenceTiming>. Patient: ... Clinician: ...";
// - fills an empty native description: "Monitors <monitored_target>. <literature_basis>."
// Every other key and value is kept. It writes through the proforma CLI (never by hand),
// keeping the file windows-1252 for Composer, then runs `format`.

import { exportGuideline, proforma, setAttribute, setMetaprops } from "./lib/proforma.mjs";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const dry = args.includes("--dry-run");
if (!file) {
  console.error("usage: node scripts/migrate_metaprops.mjs <guideline.pf> [--dry-run]");
  process.exit(2);
}

const FROM_ORDER = {
  "order.code": "ServiceRequest.code",
  "order.timing": "ServiceRequest.occurrenceTiming",
  "order.patient_instruction": "ServiceRequest.patientInstruction",
  "order.performer_instruction": "ServiceRequest.performerInstruction",
};
const SR_FIELDS = ["intent", "code", "occurrenceTiming", "patientInstruction", "performerInstruction"];
const clause = (s) => String(s || "").trim().replace(/[.;\s]+$/, "");
const sentence = (s) => {
  const c = clause(s);
  return c ? c[0].toUpperCase() + c.slice(1) : c;
};

const g = exportGuideline(file);
let changed = 0;
for (const t of g.tasks) {
  const m = t.metaprops || {};
  if ((m["goal.verb"] || "").trim().toLowerCase() !== "order") continue;
  const next = {};
  for (const [k, v] of Object.entries(m)) {
    if (FROM_ORDER[k]) next[FROM_ORDER[k]] = String(v).replace(/;/g, ",");
    else next[k] = v;
  }
  if (!next["ServiceRequest.code"]) continue; // not an order this script understands
  next["ServiceRequest.intent"] = "order";
  next["goal.noun_phrase"] = SR_FIELDS.filter((f) => next[`ServiceRequest.${f}`])
    .map((f) => `ServiceRequest.${f} = ${String(next[`ServiceRequest.${f}`]).trim()}`)
    .join("; ");
  const metaChanged = JSON.stringify(Object.entries(next).sort()) !== JSON.stringify(Object.entries(m).sort());

  const code = clause(next["ServiceRequest.code"]);
  const timing = clause(next["ServiceRequest.occurrenceTiming"]);
  const procedure = (t.procedure || "").trim()
    ? null
    : [
        timing ? `${sentence(code)}, ${timing}.` : `${sentence(code)}.`,
        next["ServiceRequest.patientInstruction"] && `Patient: ${clause(next["ServiceRequest.patientInstruction"])}.`,
        next["ServiceRequest.performerInstruction"] && `Clinician: ${clause(next["ServiceRequest.performerInstruction"])}.`,
      ].filter(Boolean).join(" ");
  const description = (t.description || "").trim()
    ? null
    : [next.monitored_target && `Monitors ${clause(next.monitored_target)}.`, next.literature_basis && `${sentence(next.literature_basis)}.`].filter(Boolean).join(" ");
  if (!metaChanged && !procedure && !description) continue;

  console.log(`${dry ? "would migrate" : "migrating"} ${t.name}`);
  changed++;
  if (dry) continue;
  if (metaChanged) setMetaprops(file, t.name, next);
  if (procedure) setAttribute(file, t.name, "procedure", procedure);
  if (description) setAttribute(file, t.name, "description", description);
}
if (!dry && changed) {
  const r = proforma(["format", "--file", file]);
  if (r.status !== 0) throw new Error(`format failed: ${(r.stderr || r.stdout).trim()}`);
}
console.log(`${dry ? "would migrate" : "migrated"} ${changed} action(s) in ${file}`);
