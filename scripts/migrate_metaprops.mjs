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
// It also brings every ontology coding onto Composer's form (cig/know-how/proforma/Ontology.md):
// - SNOMED:<id> + ontology.label -> ontology.coding=SCT:<id> [<label>] (LOINC:<code> -> LNC:<code> [<label>]),
//   and removes ontology.label, on data items, candidates, arguments and components;
// - moves each task's coding from its definition's metaprops to the metaprops of its
//   component(s) in the parent plan(s), merged with what the component already holds
//   (the root plan has no component: its coding is removed and reported).
// Every other key and value is kept, and a second run changes nothing. It writes through the
// proforma CLI (never by hand), keeping the file windows-1252 for Composer, then runs `format`.

import { componentsOfTask, exportGuideline, proforma, setAttribute, setMetaprops, upgradeCoding } from "./lib/proforma.mjs";

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
  // (an Enquiry has no procedure: its description carries the order, ADEMonitoringEnquiry.md)
  const procedure = t.kind !== "action" || (t.procedure || "").trim()
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
console.log(`${dry ? "would migrate" : "migrated"} ${changed} action(s) in ${file}`);

// ---------------------------------------------------------------- ontology coding
// Composer's form (cig/know-how/proforma/Ontology.md): ontology.coding = "<SCT|LNC|IC0|IC9>:<code> [<caption>]",
// with no separate ontology.label, on data items and candidates in their own metaprops and on
// tasks in their component(s) in the parent plan(s).
const g2 = !dry && changed ? exportGuideline(file) : g;
const stats = { data: 0, candidates: 0, arguments: 0, components: 0, definitions: 0 };
const notes = [];
const writes = []; // [selector, metaprops map]
const withoutOntology = (mp) => Object.fromEntries(Object.entries(mp || {}).filter(([k]) => k !== "ontology.coding" && k !== "ontology.label"));

// an element's own coding: convert in place and drop ontology.label
function convertInPlace(selector, mp, kind) {
  const v = (mp?.["ontology.coding"] || "").trim();
  const label = (mp?.["ontology.label"] || "").trim();
  if (!v && !label) return;
  if (!v) {
    writes.push([selector, withoutOntology(mp)]);
    notes.push(`${selector}: dropped ontology.label without ontology.coding`);
    stats[kind]++;
    return;
  }
  const next = upgradeCoding(v, label);
  if (!next) {
    notes.push(`${selector}: cannot convert ontology.coding "${v}" (no caption: ontology.label is empty); re-code it with the coding pass`);
    return;
  }
  if (next === v && !("ontology.label" in mp)) return; // already in Composer's form
  writes.push([selector, { ...withoutOntology(mp), "ontology.coding": next }]);
  stats[kind]++;
}

for (const d of g2.data) convertInPlace(d.name, d.metaprops, "data");
for (const t of g2.tasks) {
  for (const c of t.candidates || []) {
    convertInPlace(`${t.name}/candidate:${c.name}`, c.metaprops, "candidates");
    (c.arguments || []).forEach((a, i) => convertInPlace(`${t.name}/candidate:${c.name}/argument:${a.name || i + 1}`, a.metaprops, "arguments"));
  }
}
// tasks: move the coding from the definition to the component(s) that run it
const componentWrites = new Map(); // selector -> metaprops map
for (const t of g2.tasks) {
  const mp = t.metaprops || {};
  const v = (mp["ontology.coding"] || "").trim();
  const label = (mp["ontology.label"] || "").trim();
  if (!v && !label) continue;
  const next = v ? upgradeCoding(v, label) : null;
  if (v && !next) {
    notes.push(`${t.name}: cannot convert ontology.coding "${v}" (no caption: ontology.label is empty); left on the definition, re-code it on its component with the coding pass`);
    continue;
  }
  const comps = componentsOfTask(g2, t.name);
  if (next && !comps.length) notes.push(`${t.name}: removed ontology.coding "${v}" from the root plan's definition (the root plan has no component to carry it)`);
  for (const { component, selector } of comps) {
    const cur = componentWrites.get(selector) || component.metaprops || {};
    const have = upgradeCoding(cur["ontology.coding"], cur["ontology.label"]);
    if (have && next && have !== next) notes.push(`${selector}: kept its own coding "${have}"; dropped the definition's "${next}"`);
    componentWrites.set(selector, { ...withoutOntology(cur), "ontology.coding": have || next });
  }
  writes.push([t.name, withoutOntology(mp)]);
  stats.definitions++;
}
// components that already hold a coding in an older form
for (const p of g2.tasks) {
  for (const c of p.components || []) {
    const selector = `${p.name}/component:${c.name}`;
    if (!componentWrites.has(selector)) convertInPlace(selector, c.metaprops, "components");
  }
}
const componentMetaprops = new Map(g2.tasks.flatMap((p) => (p.components || []).map((c) => [`${p.name}/component:${c.name}`, c.metaprops || {}])));
const sameMap = (a, b) => JSON.stringify(Object.entries(a).sort()) === JSON.stringify(Object.entries(b).sort());
for (const [selector, mp] of componentWrites) {
  if (sameMap(mp, componentMetaprops.get(selector) || {})) continue;
  writes.push([selector, mp]);
  stats.components++;
}

for (const [selector, mp] of writes) {
  if (dry) continue;
  if (Object.keys(mp).length) setMetaprops(file, selector, mp);
  else {
    const r = proforma(["unset", "--file", file, "--selector", selector, "--attribute", "metaprops"]);
    if (r.status !== 0) throw new Error(`proforma unset ${selector} metaprops: ${(r.stderr || r.stdout).trim()}`);
  }
}
const verbDone = dry ? "would convert" : "converted";
console.log(
  `${verbDone} ontology coding to Composer's form: ${stats.data} data item(s), ${stats.candidates} candidate(s), ${stats.arguments} argument(s); ` +
    `${dry ? "would move" : "moved"} ${stats.definitions} task coding(s) off their definitions; ${dry ? "would write" : "wrote"} ${stats.components} component(s)`
);
for (const n of notes) console.log(`  note: ${n}`);

if (!dry && (changed || writes.length)) {
  const r = proforma(["format", "--file", file]);
  if (r.status !== 0) throw new Error(`format failed: ${(r.stderr || r.stdout).trim()}`);
}
