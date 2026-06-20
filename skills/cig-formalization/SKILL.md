---
name: cig-formalization
description: >-
  Deterministic Step 6 emitter that materializes an APPROVED PROforma CIG
  monitoring proposal into a fresh OWL ABox via the ontology-editor (OWL-MCP)
  tools. Use this skill — alongside ontology-editor — whenever an approved
  `projects/<project_dir>/plans/PROPOSAL-*.md` must be turned into (or
  regenerated as) the project ontology: "formalize the approved proposal",
  "emit the OWL", "build the CIG ontology", "run Step 6", or when the
  cig-formalizer subagent is invoked. This is the HOW-to-emit half of the CIG
  workflow; the clinical WHAT-to-model decisions are already fixed in the
  approved proposal, which is the single source of truth. Treat formalization
  as a near-mechanical transcription, not a creative step — its job is to make
  the emit reproducible and free of the recurring mechanical failures (building
  on a stale file, duplicate/renamed IRIs, residual or missing actions,
  ServiceRequest fields dropped, a hand-written count that drifts).
---

# CIG Formalization (Step 6 — deterministic emit)

You convert an **approved** CIG monitoring proposal into a formal OWL **ABox** that
reuses the PROforma classes/properties from `cig/proforma.owl` by IRI. You do
**Step 6 and nothing else** — scope, extraction, clinical judgement, and the
action set were all settled in Steps 1–5 and are frozen in the approved proposal.

## Why this skill exists (read once)

Across real runs, *planning was reliably good but emission broke mechanically*:
the agent built on top of a stale ontology file (16 then 20 actions, two
disconnected plan roots), gave one ADE two different IRIs across runs
(`Monitor_AKI` vs `Monitor_Acute_Kidney_Injury`), left a hand-written count in
`rdfs:comment` that drifted from the real action set, or dropped a
`ServiceRequest.*` field. None of these are clinical mistakes — they are
bookkeeping mistakes. So this skill is deliberately small and rule-shaped: it
removes the room for merges, duplicates, renames, and stale prose. Follow it
literally and the emit becomes reproducible.

## The single source of truth

The **approved** `projects/<project_dir>/plans/PROPOSAL-*.md` (`status: approved`)
is authoritative. Read it in full before emitting, and treat its
**§6 Individuals tables** as the verbatim, canonical IRI list — you emit exactly
those individuals with exactly those local names, no more, no fewer, never
renamed. The proposal also fixes, per action: the goal `verb`, the
conditionality (whether it carries a `precondition`), the `applies_when`
sub-population, and the `monitoring_stance`. Where the proposal gives a
`noun_phrase` *summary* rather than the full string, you compose the full
`ServiceRequest`/`metaprops` strings from the proposal's §3 extraction + §6
rows, formatted to the canonical grammar (see References) — that formatting is
deterministic, not a new decision.

If the proposal is missing or its `status` is not `approved`, **stop** and report
that — do not emit from an unapproved draft.

## Inputs and references

- **Proposal:** `projects/<project_dir>/plans/PROPOSAL-*.md` (approved).
- **Worked example to imitate (authoritative):** `cig/examples/obesity-glp1-monitoring.owl`.
- **Meta-ontology (reuse by IRI; never edit):** `cig/proforma.owl`, prefix
  `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`.
- **Canonical `pf:metaprops` grammar (ordered keys, controlled vocab, anti-placeholder rules):**
  `skills/cig-monitoring/references/MetapropsSyntax.md` — this file is the single
  source for the metaprops contract; do not re-invent or duplicate it.
- **Goal side + case-report source rule + rare-harm skeletons:**
  `skills/cig-monitoring/references/ActionEnactmentGoal.md`.
- **Structural patterns (only when the approved scope includes them):**
  `references/TopLevelPlan.md`, `MonitoringPlan.md`, `ActionComponent.md`,
  `StateAchievementGoal.md`, `Enquiry.md`, `Decision.md` (all under
  `skills/cig-monitoring/references/`).

Do all OWL editing through the **ontology-editor** tools (OWL-MCP). Read
`skills/ontology-editor/SKILL.md` and `setup_tools(skills: ["ontology-editor"])`
first. **Never edit an OWL file by hand.** If a tool call fails, diagnose and
retry — never fall back to writing the file manually.

## Prime directive: regenerate from empty

**Build into a fresh/empty ontology file every time.** If a project ontology
already exists at the output path, **delete it first** and regenerate from
scratch. Never append to, merge into, or extend an ontology produced by a
different plan or a prior run — *even if its content looks "well implemented" or
"came from a previous session."* Every observed merge failure came from editing a
pre-existing artifact. A clean rebuild from the approved proposal is impossible to
corrupt with residue, and makes the emit idempotent (running it twice yields the
same ontology, with no duplicates).

## Hard rules (MUST / MUST NOT)

1. **Fresh file.** Delete any existing project ontology and build from empty.
   MUST NOT append to/merge a prior run's artifact.
2. **Exact action set.** The emitted `pf:Action` set MUST EQUAL the approved
   proposal's action set exactly — no extras, no prior-session residue, none
   missing.
3. **Canonical IRIs, no renames.** Emit the §6 local names verbatim — exactly one
   IRI per ADE / label section. MUST NOT invent a second IRI for an ADE already
   named.
4. **Idempotent / no duplicates.** No duplicate individuals; no two Actions
   sharing one Goal; no individual with two `metaprops` or two `noun_phrase`
   assertions; exactly one plan root for the requested sub-structure.
5. **One fixed bundle per action** (see next section) — emit it and only it.
6. **ServiceRequest completeness on BOTH sides** (the recurring failure): the
   Goal `noun_phrase` AND the Action `metaprops` MUST EACH contain all five
   fields — `ServiceRequest.intent`, `ServiceRequest.code`,
   `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, and
   `ServiceRequest.performerInstruction` (required whenever there is a triggered
   lab or an urgent/escalation step). Keep the block consistent between the two.
   Never stop at `intent` + `code`.
7. **No placeholders.** Never `source=s`, `instrument=i`, `provenance_type=p`,
   `tbd`, etc. Use the real content fixed in the proposal.
8. **Scope to the request.** Build only the sub-structure the approved proposal
   asks for, fully populated. MUST NOT emit empty placeholder components — no
   Component whose task lacks a goal/metaprops, no Enquiry with no data items, no
   Decision with no candidates/criteria, no sub-plan with no actions. An
   "ADE monitoring only" build is a single populated `Monitor_Undesired_ADEs`
   plan — never the full Top-Level Plan with empty Enquiry/Decision/Therapy stubs.

## The deterministic recipe

1. **Read** the approved proposal and the worked example `cig/examples/obesity-glp1-monitoring.owl`.
   Confirm `status: approved`; note the output path and the §6 IRI tables.
2. **Fresh file.** Delete any existing ontology at the output path; start empty.
3. **`set_ontology_iri`** with the **full** ontology IRI from the proposal header
   (e.g. `https://w3id.org/agentic-cig-monitoring/<project>`) and a version IRI
   (e.g. `.../1.0`). Never a CURIE, never leave it anonymous.
4. **`add_prefix`** for the PROforma namespace
   (`http://www.owl-ontologies.com/Ontology1779030093.owl#`), the project
   namespace, and `owl`/`rdf`/`rdfs`/`xsd`/`dcterms`. Add
   `Import(<http://www.owl-ontologies.com/Ontology1779030093.owl>)` for PROforma.
5. **Emit the plan skeleton** for the approved scope (root plan; for a full CIG
   also the Enquiry/Decision/Therapy/Monitoring sub-plans and the
   `Schedule_Constraint`/`conref` sequencing — see *Structural backbone* below).
   Reuse PROforma classes/properties by IRI; do not redeclare them.
6. **For each action in the §6 table (and only those), emit the fixed bundle**
   (next section). Iterate the table top to bottom; do not add or skip rows.
7. **Annotations** — exactly one `rdfs:label` and one `rdfs:comment` on the
   ontology IRI; per-individual `rdfs:label`s. See *Annotation discipline*.
8. **Self-verify** with the *End-of-Step-6 determinism check*. Fix any failure
   before handing off to Step 7.

## The fixed per-action bundle

For each monitoring action `:Monitor_X` listed in §6, emit exactly:

```
# 1) Action + its Component, wired into the parent sub-plan
ClassAssertion(pf:Action :Monitor_X)
ClassAssertion(pf:Component :Monitor_X_Component)
ObjectPropertyAssertion(pf:components :Monitor_Undesired_ADEs :Monitor_X_Component)
ObjectPropertyAssertion(pf:taskref :Monitor_X_Component :Monitor_X)

# 2) Exactly one Goal (verb=order), exactly one noun_phrase
ClassAssertion(pf:Goal :Goal_order_x)
ObjectPropertyAssertion(pf:goal :Monitor_X :Goal_order_x)
DataPropertyAssertion(pf:verb :Goal_order_x "order")
DataPropertyAssertion(pf:noun_phrase :Goal_order_x "ServiceRequest.intent = order; ServiceRequest.code = ...; ServiceRequest.occurrenceTiming = ...; ServiceRequest.patientInstruction = ...; ServiceRequest.performerInstruction = ...")

# 3) Exactly one metaprops (full ServiceRequest block + provenance/operationalization) and one caption
DataPropertyAssertion(pf:metaprops :Monitor_X "ServiceRequest.intent=order; ...; category=...; monitored_target=...; applies_when=...; provenance_type=...; source_kind=...; source=...; knowledge_origin=...; guideline_status=...; monitoring_stance=...; literature_basis=...; assistant_invention=...; instrument=...; monitoring_frequency_basis=...; trigger=...; cq=...")
DataPropertyAssertion(pf:caption :Monitor_X "<one-line human caption>")

# 4) Precondition — ONLY if the proposal marks this action conditional
ClassAssertion(pf:PROforma_Condition :PC_Cond)
ObjectPropertyAssertion(pf:precondition :Monitor_X :PC_Cond)
DataPropertyAssertion(pf:string_representation :PC_Cond "<machine-readable condition>")
```

Rules for the bundle:
- The `metaprops` key order and controlled vocabulary are defined in
  `MetapropsSyntax.md` — follow it exactly. The `ServiceRequest.*` block in
  `metaprops` MUST match the Goal's `noun_phrase`.
- Emit a `precondition` **iff** `applies_when` names a sub-population (not
  `all_patients_on_therapy`). Universal-but-event-triggered actions
  (e.g. AKI triggered by dehydration) do **not** get a precondition — the trigger
  lives in `occurrenceTiming`/`trigger`, per the proposal.
- Therapy interventions (full-CIG scope) use a **State Achievement Goal**
  (`verb = achieve`/`avoid`) instead of the `order` goal — see
  `references/StateAchievementGoal.md`.

## Structural backbone (only when the approved scope includes it)

For an **ADE-only** build the root is a single `pf:Plan` (e.g.
`Monitor_Undesired_ADEs`) holding the action bundles — nothing else.

For a **full Top-Level Plan**, mirror `cig/examples/obesity-glp1-monitoring.owl`:
a root `Plan` with four Components (Enquiry, Decision, Therapy sub-`Plan`,
Monitoring sub-`Plan`) sequenced via `Schedule_Constraint` individuals attached
with `scheduled_constraints` and pointing back with `conref`
(PROforma has no "next" property); parallel monitoring sub-plans share the
Monitoring plan with no constraints between them. Populate the Enquiry's data
items and the Decision's candidates+criteria (`Enquiry.md`, `Decision.md`) — never
leave them empty. Gate the Therapy plan with a `precondition` such as
`result_of(<decision>) = Eligible`.

## Writing long literals safely

`metaprops` and `noun_phrase` strings are long and contain punctuation. Write
them with **`add_data_property_assertion`** (the literal is a separate field,
escaped server-side, never truncated). If you must use `add_axioms`, keep each
literal **single-line** (no raw newlines) and escape `\` and `"`. Use
`add_annotation_assertion` for long `rdfs:comment` literals.

## Annotation discipline (kills the drift bug)

- Exactly **one** `rdfs:label` and **one** `rdfs:comment` on the ontology IRI
  (subject = the full ontology IRI, not a bare CURIE).
- The `rdfs:comment` MUST NOT contain a **hand-written action count** or a
  **hand-maintained drug/section list** (e.g. "10 monitoring Actions … four new
  actions: §5.3, §5.5, §5.8, §5.9"). These silently go stale when the action set
  changes and are a recurring review failure. Describe the build qualitatively
  ("PROforma ABox for GLP-1 adverse-effects monitoring; one Action per approved
  §6 row") and let the actual axioms carry the count. If a count is truly needed,
  derive it from the emitted action set at verification time — never type it by
  hand.
- Give every individual a concise `rdfs:label`.

## End-of-Step-6 determinism check (self-apply before handoff)

Run these with `find_axioms`/`get_all_axioms` and report each result. Every item
must hold; fix and re-emit if any fails:

- [ ] `count(pf:Action)` **==** the action count in the approved §6 table (no
      residue, none missing).
- [ ] Each `Action` has **exactly one** `metaprops` and **exactly one** `Goal`
      with **exactly one** `noun_phrase`.
- [ ] **No two `Action`s share a `Goal`**; **single** plan root for the requested
      sub-structure.
- [ ] Each monitoring Goal `noun_phrase` and Action `metaprops` contains **all
      five** `ServiceRequest.*` fields (incl. `performerInstruction` for any
      triggered/urgent step), consistent between the two sides.
- [ ] Every action whose `applies_when` is a sub-population carries a matching
      `precondition`.
- [ ] Ontology IRI **and** version IRI are set (no anonymous `Ontology(` header).
- [ ] **Exactly one** `rdfs:label` and **exactly one** `rdfs:comment`; no
      hand-written count or stale drug/section list in prose.
- [ ] No empty placeholder components; for a full CIG the Enquiry and Decision
      are populated.

This skill ends at a clean, self-verified ABox. Step 7 (the blocking
`cig-monitoring-review` value-quality gate and `cq-verification`) is run
separately by the review subagents and re-runs the full check set; do not mark
the build done until that gate passes with zero FAILs.
