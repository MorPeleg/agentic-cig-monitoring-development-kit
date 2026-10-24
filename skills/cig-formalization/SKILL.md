---
name: cig-formalization
description: >-
  Deterministic Step 6 emitter that materializes an APPROVED PROforma CIG
  monitoring proposal into a PROforma 1.9 guideline file
  (`projects/<project_dir>/guideline/<name>.pf`) via the proforma-editor tools.
  Default is a fresh-file full re-emit (snapshot to guideline/baseline/, delete,
  create_guideline, rebuild). Coding-only requests (add SNOMED/OMOP/LOINC/RxNorm
  codes) use coding-patch mode: do not delete the .pf; add the typed coding keys
  on existing monitoring Actions only. Use this skill — alongside
  proforma-editor — whenever an approved
  `projects/<project_dir>/plans/PROPOSAL-*.md` must be turned into (or
  regenerated as) the project guideline, or when the user asks only to add
  terminology codes to an existing CIG. Treat formalization as a
  near-mechanical transcription, not a creative step.
---

# CIG Formalization (Step 6 — deterministic emit)

You convert an **approved** CIG monitoring proposal into a PROforma 1.9
guideline file (`.pf`) built entirely with the proforma MCP tools. You do
**Step 6 and nothing else** — scope, extraction, clinical judgement, and the
action set were all settled in Steps 1–5 and are frozen in the approved proposal.

## Why this skill exists (read once)

Across real runs, *planning was reliably good but emission broke mechanically*:
the agent built on top of a stale artifact (16 then 20 actions, two
disconnected plan roots), gave one ADE two different names across runs
(`Monitor_AKI` vs `Monitor_Acute_Kidney_Injury`), left a hand-written count in
the guideline description that drifted from the real action set, or dropped a
`ServiceRequest.*` field. None of these are clinical mistakes — they are
bookkeeping mistakes. So this skill is deliberately small and rule-shaped: it
removes the room for merges, duplicates, renames, and stale prose. Follow it
literally and the emit becomes reproducible.

## The single source of truth

The **approved** `projects/<project_dir>/plans/PROPOSAL-*.md` (`status: approved`)
is authoritative. Read it in full before emitting, and treat its
**§6 task table** and its ```` ```cig-actions ```` block as the verbatim,
canonical name list — you emit exactly those tasks with exactly those names, no
more, no fewer, never renamed. The proposal also fixes, per task: kind, parent
plan, `after` siblings, the goal `verb`, the precondition (whether there is one,
and over which data item), the `applies_when` sub-population, and the
`monitoring_stance`. §5 (data items table) fixes every Enquiry data item: name,
type, unit, source, users. Where the proposal gives a `noun_phrase` *summary*
rather than the full string, you compose the full `ServiceRequest`/metaprops
lines from the proposal's §3 extraction + §6 rows, formatted to the canonical
contract (see References) — that formatting is deterministic, not a new decision.

If the proposal is missing or its `status` is not `approved`, **stop** and report
that — do not emit from an unapproved draft. If the proposal is internally
inconsistent (a `cig-actions` name with no §6 row, a precondition over a data
item §5 does not define, a population-scoped action with no Enquiry asking for
its scoping data item), **stop** and report it — do not repair the proposal
during emission.

## Inputs and references

- **Proposal:** `projects/<project_dir>/plans/PROPOSAL-*.md` (approved).
- **Output:** `projects/<project_dir>/guideline/<name>.pf` and
  `projects/<project_dir>/guideline/<name>.mmd`; snapshots in
  `projects/<project_dir>/guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf`.
  `projects/` is gitignored, so the snapshot is the only record of the previous
  emit — take it before touching an existing guideline.
- **Worked example to imitate (authoritative):** `cig/examples/obesity-glp1-monitoring.pf`
  (lint clean, passes the gate) and its diagram `obesity-glp1-monitoring.mmd`.
- **Canonical metaprops contract (required keys, numbered repeat keys, controlled vocab, anti-placeholder rules, typed coding keys):**
  `skills/cig-monitoring/references/MetapropsSyntax.md` — this file is the single
  source for the metaprops contract; do not re-invent or duplicate it.
- **Goal side + opt-in case-report source rule + labeled-ADE skeleton:**
  `skills/cig-monitoring/references/ActionEnactmentGoal.md`.
- **Structural patterns (only when the approved scope includes them):**
  `references/TopLevelPlan.md`, `MonitoringPlan.md`, `ActionComponent.md`,
  `StateAchievementGoal.md`, `Enquiry.md`, `Decision.md` (all under
  `skills/cig-monitoring/references/`).
- **Language:** the `proforma_reference` tool. Read it before writing any
  expression.

Do all `.pf` editing through the **proforma-editor** tools. Read
`skills/proforma-editor/SKILL.md` and `setup_tools(skills: ["proforma-editor"])`
first. **Never edit a `.pf` file by hand** (no Write/Edit/sed on it). Every
tool edit re-parses the file, refuses to save a broken one, and reports the lint
counts. If a tool call fails, read the error, fix the arguments, and retry —
never fall back to writing the file manually. Pass the `.pf` path as an
**absolute** path in every call (`file`).

## Choose the emit mode first

**Full re-emit (default).** New CIG, first emit of an approved proposal, or any request that changes the clinical action set. Follow *Prime directive: regenerate from empty* below.

**Coding-patch mode.** Use this when the user asks **only** to add terminology codes (SNOMED / OMOP / LOINC / RxNorm / finding codes) to an **existing** CIG — or the proposal header marks `mode: coding-patch`. This is **not** a rebuild. Detect it before touching the file. If the request could be either a rebuild or a patch, **stop and ask**; never assume a full rebuild for a coding request.

Coding-patch rules (MUST / MUST NOT):

1. **Do not delete the `.pf`.** Snapshot it to `guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf` first, then patch the existing file in place.
2. **Do not add, remove, or rename tasks, components, candidates, arguments, sources or data items.** The Action name set, plan structure, scheduling, Decision candidates and Enquiry data items MUST stay identical to the snapshot.
3. **Do not change captions, descriptions, preconditions, `goal.noun_phrase`, `ServiceRequest.occurrenceTiming`, `source.N`, `literature_basis`, `applies_when`, Decision arguments, or the metadata.** Those strings are frozen from the prior approved emit.
4. **Only add or replace the typed coding keys** on existing monitoring Actions: `ServiceRequest.supportingInfo.findingCodes`, `labCodes`, `conditionCodes`, `medicationCodes` (value format in `MetapropsSyntax.md`). Every other key keeps its exact value. Key order does not matter (the tools sort keys on save).
5. **Patch a metaprops map by read → add → write back whole**, in one `set_attribute` per Action:
   - read the current map with `export_json` (the task's `metaprops` object, already unescaped) — or `get_component(selector: "Monitor_X", format: "json")`, which returns the raw properties text;
   - add the coding keys to that map;
   - write every line back with `set_attribute(file, selector: "Monitor_X", attribute: "metaprops", value: "<all key=value lines>")`. It **replaces** the whole metaprops; a key you leave out is deleted.
   Never write a partial map; never write metaprops on the component instead of the task.
6. If the approved proposal's action set **differs** from the existing `.pf`, this is **not** a coding patch — stop and report. Do not silently switch to a full rebuild.
7. Do **not** rename the project directory.

After the patch, run `format` and `lint` (0 errors), regenerate the `.mmd` and the `.html` report, then run the freeze gate:
`node scripts/check_cig.mjs projects/<p>/guideline/<name>.pf --proposal projects/<p>/plans/PROPOSAL-<ts>.md --baseline projects/<p>/guideline/baseline/<snapshot>.pf --coding-patch`.
It FAILs on any change outside the four coding keys.

## Prime directive: regenerate from empty (full re-emit only)

**On a full re-emit, build into a fresh file.** If a guideline already exists at
the output path: **snapshot** it to
`guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf`, **delete** it, and
regenerate with `create_guideline`. Never append to, merge into, or extend a
`.pf` produced by a different plan or a prior run — *even if its content looks
"well implemented" or "came from a previous session."* Every observed merge
failure came from editing a pre-existing artifact. A clean rebuild from the
approved proposal is impossible to corrupt with residue, and makes the emit
idempotent (running it twice yields the same guideline, with no duplicates).
`create_guideline` refuses to overwrite an existing file; do not reach for
`overwrite: true` to skip the snapshot.

**This directive does not apply in coding-patch mode.** Deleting the file to "add SNOMED" is how captions, Decision candidates, and provenance strings drift. Patch; do not rebuild.

## Hard rules (MUST / MUST NOT)

These apply to **full re-emit**. Coding-patch mode uses the stricter freeze rules in *Choose the emit mode first*.

1. **Fresh file (full re-emit only).** Snapshot, delete, `create_guideline`, build.
   MUST NOT append to/merge a prior run's artifact. MUST NOT do this for a coding-only request.
2. **Exact action set.** The emitted `action` set MUST EQUAL the proposal's
   ```` ```cig-actions ```` block exactly — no extras, no prior-session residue,
   none missing.
3. **Canonical names, no renames.** Emit the §6 names verbatim, in the exact
   case written there — exactly one task per ADE / label section. MUST NOT
   invent a second name for an ADE already named. Names are unique
   case-insensitively, but references in expressions are matched exactly, so a
   wrong-case reference silently becomes a text literal.
4. **Idempotent / no duplicates.** Every task is created with `add_task` (task +
   its component in one call, so no orphan task definitions, no PF-G004); one
   metaprops per task (`set_attribute` replaces, never appends); exactly one
   root plan for the requested sub-structure; every task reachable from it.
5. **One fixed bundle per action** (see below) — emit it and only it.
6. **ServiceRequest completeness on BOTH sides** (the recurring failure):
   `goal.noun_phrase` AND the separate keys MUST EACH contain all five fields —
   `ServiceRequest.intent`, `ServiceRequest.code`,
   `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, and
   `ServiceRequest.performerInstruction` (required whenever there is a triggered
   lab or an urgent/escalation step) — with identical values on the two sides.
   Never stop at `intent` + `code`.
7. **No placeholders.** Never `source=s`, `instrument=i`, `provenance_type=p`,
   `tbd`, `TODO`, empty values, or a data item typed `text` just to avoid
   choosing. Use the real content and the real type fixed in the proposal.
8. **Scope to the request.** Build only the sub-structure the approved proposal
   asks for, fully populated. MUST NOT emit empty placeholder components — no
   task without a caption and `goal.verb`, no Enquiry with no sources, no
   Decision with no candidates or a candidate with no argument, no plan with no
   components. An "ADE monitoring only" build is a single populated monitoring
   plan as the root — never the full Top-Level Plan with empty
   Enquiry/Decision/Therapy stubs.
9. **Executable conditions only.** Every precondition and argument condition is
   a PROforma expression that `check_expression` types as `truth_value` with
   every name resolving to the intended data item or decision (not to "text
   literal" by accident). A sentence is not a precondition.

## The deterministic recipe

All calls below take `file: "<absolute path to guideline/<name>.pf>"`; it is
omitted from the listings for brevity. Through capa the tool ids are
`pf_<tool>` (see `skills/proforma-editor/SKILL.md`).

1. **Choose the emit mode.** If this is coding-only, follow *Coding-patch mode* and skip steps 3–11. Still read the approved proposal, then run the freeze gate.
2. **Read** the approved proposal, the worked example
   `cig/examples/obesity-glp1-monitoring.pf`, and `proforma_reference`.
   Confirm `status: approved`; note the output path, the §5 data items, the §6
   task table and the `cig-actions` block.
3. **Fresh file.** If `guideline/<name>.pf` exists: copy it to
   `guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf`, then delete it.
4. **`create_guideline`** `(name: "<Root_Plan>", title: "<proposal title>", author: "<author>")`.
   `name` is the root plan's canonical name from §6 (e.g. `Obesity_GLP1_Plan`;
   for an ADE-only build, the monitoring plan's name). The title also becomes
   the root plan caption.
5. **`set_metadata`** `(desc: "<qualitative description>", version: "<proposal version>")`.
   See *Annotation discipline*. Then the root plan's goal, in one call:
   `set_attribute(selector: "<Root_Plan>", attribute: "metaprops", value: "goal.verb=treat\ngoal.noun_phrase=<from proposal>")`
   (the tools mirror root-plan metaprops into the guideline-level metaprops).
6. **Plan skeleton** with `add_task`, top to bottom in §6 order (full CIG shown;
   see *Structural backbone*):
   ```
   add_task(plan: "Obesity_GLP1_Plan", kind: "enquiry",  name: "Get_Eligibility_Data", caption: "...", description: "...")
   add_task(plan: "Obesity_GLP1_Plan", kind: "decision", name: "Eligibility_Decision", caption: "...", after: ["Get_Eligibility_Data"])
   add_task(plan: "Obesity_GLP1_Plan", kind: "plan",     name: "Obesity_Therapy", caption: "...", after: ["Eligibility_Decision"],
            precondition: "result_of(Eligibility_Decision) = Eligible")
   add_task(plan: "Obesity_GLP1_Plan", kind: "plan",     name: "Monitoring_Plan", caption: "...", after: ["Obesity_Therapy"])
   add_task(plan: "Monitoring_Plan",   kind: "plan",     name: "Monitor_Actions", caption: "...")          # parallel: no after
   add_task(plan: "Monitoring_Plan",   kind: "plan",     name: "Monitor_Desired_State", caption: "...")
   add_task(plan: "Monitoring_Plan",   kind: "plan",     name: "Monitor_Undesired_State", caption: "...")
   ```
   `after` lists siblings in the same plan and writes
   `schedule_constraint :: completed('<sibling>')`. Lint warns about the empty
   Enquiry and Decision (and the not-yet-existing `Eligible` candidate) until
   the next steps fill them; it never warns about an empty plan, so step 11 and
   the gate check for those.
7. **Enquiry data items** — one per §5 row, then one source each:
   ```
   add_data_item(name: "BMI", type: "real", caption: "Body mass index", unit: "kg/m2")
   set_attribute(selector: "BMI", attribute: "description", value: "Body mass index; primary eligibility threshold")
   add_data_item(name: "on_insulin_or_secretagogue", type: "boolean", caption: "On insulin or an insulin secretagogue?")
   add_source(task: "Get_Eligibility_Data", data: "BMI")
   add_source(task: "Get_Eligibility_Data", data: "on_insulin_or_secretagogue")
   ```
   Real types: `real` / `integer` for numeric thresholds (with `unit`),
   `boolean` for yes/no facts, `text` (with `range` when the values are a closed
   list, e.g. `range: "\"none\", \"prior_pancreatitis\""`) otherwise.
   `add_data_item` has no `description` parameter; set it with `set_attribute`.
   Create data items **before** any expression that uses them.
8. **Decision** — candidates, then at least one argument each:
   ```
   check_expression(expression: "(BMI >= 30 or (BMI >= 27 and weight_related_comorbidity = true)) and contraindications = none")
   add_candidate(decision: "Eligibility_Decision", name: "Eligible", caption: "...")
   set_attribute(selector: "Eligibility_Decision/candidate:Eligible", attribute: "description", value: "<free-text rationale>")
   add_argument(decision: "Eligibility_Decision", candidate: "Eligible", support: "for",
                condition: "(BMI >= 30 or (BMI >= 27 and weight_related_comorbidity = true)) and contraindications = none",
                name: "Arg_Eligible")
   ```
   Run `check_expression` on every condition first: the type must be
   `truth_value` and each name must resolve to the intended `data (...)` item;
   only values the proposal means as literals (`none`, `true`, a candidate name)
   may resolve to "text literal". Support direction and condition come from the
   proposal verbatim. The recommendation defaults to `netsupport() > 0`; set
   `choice_mode` only when §6 says `multiple`
   (`set_attribute(selector: "Eligibility_Decision", attribute: "choice_mode", value: "multiple")`,
   and then gate with `result_set(D) includes C`).
9. **Therapy actions** (full-CIG scope) — `add_task(plan: "<therapy plan>", kind: "action", name, caption)`
   then one `set_attribute` metaprops with `goal.verb=achieve|avoid` and
   `goal.noun_phrase` (State Achievement Goal, both polarities as the proposal
   fixes them — see `references/StateAchievementGoal.md`).
10. **For each monitoring action in the §6 table (and only those), emit the fixed bundle**
    (next section). Iterate the table top to bottom; do not add or skip rows.
11. **Finish:** `format`, `lint` (0 errors; read every warning and fix the ones
    the proposal does not explain; run once with `include_info: true` and
    confirm every PF-X060 "treated as text literal" is an intended literal, not
    a misspelt data item), `to_mermaid(output: "<abs>/guideline/<name>.mmd")`,
    `node <proforma skill>/scripts/build_report.mjs <guideline.pf>` (writes the
    self-contained `guideline/<name>.html` viewer), then the *End-of-Step-6 determinism check*. Fix any failure before handing
    off to Step 7.

## The fixed per-action bundle

For each monitoring action `Monitor_X` listed in §6, emit exactly these calls:

```
# 1) Task + its component in the right monitoring sub-plan; precondition ONLY if population-scoped
add_task(plan: "Monitor_Undesired_State", kind: "action", name: "Monitor_Hypoglycemia",
         caption: "Monitor for hypoglycemia in patients on concomitant insulin or an insulin secretagogue",
         precondition: "on_insulin_or_secretagogue = true")

# 2) Exactly one metaprops: the whole contract in one call (replaces any existing metaprops)
set_attribute(selector: "Monitor_Hypoglycemia", attribute: "metaprops", value:
"ServiceRequest.intent=order
ServiceRequest.code=hypoglycemia symptom screen with self-monitored blood glucose (SMBG) in at-risk patients
ServiceRequest.occurrenceTiming=each visit and on dose change of concomitant insulin or insulin secretagogue
ServiceRequest.patientInstruction=report shakiness, sweating, confusion, palpitations, or hunger and check SMBG when symptomatic
ServiceRequest.performerInstruction=if hypoglycemia is confirmed, reduce or stop the concomitant insulin or insulin secretagogue per protocol
goal.verb=order
goal.noun_phrase=ServiceRequest.intent = order; ServiceRequest.code = hypoglycemia symptom screen with self-monitored blood glucose (SMBG) in at-risk patients; ServiceRequest.occurrenceTiming = each visit and on dose change of concomitant insulin or insulin secretagogue; ServiceRequest.patientInstruction = report shakiness, sweating, confusion, palpitations, or hunger and check SMBG when symptomatic; ServiceRequest.performerInstruction = if hypoglycemia is confirmed, reduce or stop the concomitant insulin or insulin secretagogue per protocol
category=undesired_ade
monitored_target=hypoglycemia as a labeled adverse effect when GLP-1 is combined with insulin or an insulin secretagogue, tracing to the GLP-1 prescription therapy recommendation (Prescribe_GLP1)
applies_when=concomitant insulin or insulin secretagogue therapy (not patients on GLP-1 monotherapy)
provenance_type=package_insert_specified
source_kind=package_insert
source.1=Wegovy (semaglutide) US Prescribing Information, Warnings and Precautions: Hypoglycemia (5.4)
knowledge_origin=drug label warning, which scopes the risk to concomitant insulin/secretagogue use
guideline_status=not_specified_as_a_guideline_monitoring_task
monitoring_stance=recommended
literature_basis=label states concomitant use with insulin or an insulin secretagogue may increase the risk of hypoglycemia and that reducing the insulin/secretagogue dose may be necessary
assistant_invention=SMBG operationalization and visit-based screening cadence for the at-risk subgroup
instrument=patient symptom report plus self-monitored blood glucose (SMBG)
monitoring_frequency_basis=tied to follow-up visits and to insulin/secretagogue dose changes when the interaction risk is highest
trigger=symptomatic hypoglycemia (shakiness, sweating, confusion, palpitations) or low SMBG
cq=CQ7")
```

The resulting `.pf` text (after `format`; keys sorted, `=` and `:` inside
values escaped by the properties writer, shown as `\\=` / `\\:` inside the
quoted PROforma atom; the tools and `export_json` read them back as `=` / `:`):

```
action  :: 'Monitor_Hypoglycemia' ;
     caption :: 'Monitor for hypoglycemia in patients on concomitant insulin or an insulin secretagogue' ;
     metaprops :: 'ServiceRequest.code=hypoglycemia symptom screen with self-monitored blood glucose (SMBG) in at-risk patients
ServiceRequest.intent=order
ServiceRequest.occurrenceTiming=each visit and on dose change of concomitant insulin or insulin secretagogue
ServiceRequest.patientInstruction=report shakiness, sweating, confusion, palpitations, or hunger and check SMBG when symptomatic
ServiceRequest.performerInstruction=if hypoglycemia is confirmed, reduce or stop the concomitant insulin or insulin secretagogue per protocol
applies_when=concomitant insulin or insulin secretagogue therapy (not patients on GLP-1 monotherapy)
assistant_invention=SMBG operationalization and visit-based screening cadence for the at-risk subgroup
category=undesired_ade
cq=CQ7
goal.noun_phrase=ServiceRequest.intent \\= order; ServiceRequest.code \\= hypoglycemia symptom screen ...; ServiceRequest.performerInstruction \\= if hypoglycemia is confirmed, reduce or stop the concomitant insulin or insulin secretagogue per protocol
goal.verb=order
guideline_status=not_specified_as_a_guideline_monitoring_task
instrument=patient symptom report plus self-monitored blood glucose (SMBG)
knowledge_origin=drug label warning, which scopes the risk to concomitant insulin/secretagogue use
literature_basis=label states concomitant use with insulin or an insulin secretagogue may increase the risk of hypoglycemia and that reducing the insulin/secretagogue dose may be necessary
monitored_target=hypoglycemia as a labeled adverse effect when GLP-1 is combined with insulin or an insulin secretagogue, tracing to the GLP-1 prescription therapy recommendation (Prescribe_GLP1)
monitoring_frequency_basis=tied to follow-up visits and to insulin/secretagogue dose changes when the interaction risk is highest
monitoring_stance=recommended
provenance_type=package_insert_specified
source.1=Wegovy (semaglutide) US Prescribing Information, Warnings and Precautions\\: Hypoglycemia (5.4)
source_kind=package_insert
trigger=symptomatic hypoglycemia (shakiness, sweating, confusion, palpitations) or low SMBG
' ;
     precondition ::on_insulin_or_secretagogue = true;
end action.
```
plus, in `Monitor_Undesired_State`, the component the same `add_task` call wrote:
```
     component :: 'Monitor_Hypoglycemia' ;
          task_definition :: 'Monitor_Hypoglycemia' ;
          ltwh :: ...;
```

Rules for the bundle:
- The required key set, value rules and controlled vocabulary are defined in
  `MetapropsSyntax.md` — follow it exactly. Key order is not significant (the
  tools sort keys on save); the key *set* and the values are.
- The `ServiceRequest.*` values inside `goal.noun_phrase` MUST equal the
  separate `ServiceRequest.*` keys, field for field.
- Repeatable keys are numbered: `source.1`, `source.2`, … (one per citation). A
  repeated bare key collapses to its last value. A single citation may be
  `source` or `source.1`.
- `monitored_target` names the task it traces to, e.g. `(Prescribe_GLP1)`.
- Emit a `precondition` **iff** `applies_when` names a sub-population (not
  `all_patients_on_therapy`). It is an executable expression over a data item
  that the eligibility/baseline Enquiry asks for (`add_source`), checked with
  `check_expression` first. Boolean data items are compared with `= true` /
  `= false`. Universal-but-event-triggered actions (e.g. AKI triggered by
  dehydration) do **not** get a precondition — the trigger lives in
  `occurrenceTiming`/`trigger`, per the proposal.
- Therapy interventions (full-CIG scope) carry a **State Achievement Goal**
  (`goal.verb=achieve`/`avoid`) instead of the `order` goal — see
  `references/StateAchievementGoal.md`.
- The coding keys (`ServiceRequest.supportingInfo.*Codes`) are included on a
  full re-emit only when the approved proposal already fixes their values.

## Structural backbone (only when the approved scope includes it)

For an **ADE-only** build the root is a single plan (`create_guideline` with
the monitoring plan's name) holding the action bundles — nothing else, unless a
population-scoped action requires the baseline Enquiry that §6 lists for it
(then the Enquiry is created first and the §6 `after` column sequences the
actions after it). In an ADE-only build the therapy actions are out of
scope, so `monitored_target` names the therapy recommendation it traces to as
the approved proposal states it (e.g. `... (Prescribe_GLP1)`). The gate cannot
resolve that name in the file and reports it as a WARN for the reviewer, who
checks it against the proposal. Never add a therapy stub to satisfy the gate.

For a **full Top-Level Plan**, mirror `cig/examples/obesity-glp1-monitoring.pf`:
a root plan with four components — Enquiry, Decision (after the Enquiry),
Therapy sub-plan (after the Decision, `precondition :: result_of(<decision>) = Eligible`),
Monitoring sub-plan (after the Therapy plan) — sequenced with `after` on
`add_task` (PROforma has no "next" link; the constraint sits on the later
component). Parallel monitoring sub-plans share the Monitoring plan with no
constraints between them. Populate the Enquiry's data items and the Decision's
candidates and arguments (`Enquiry.md`, `Decision.md`) — never leave them empty.

## Writing long values safely

`metaprops` values are long and contain punctuation. Pass them as the `value`
field of `set_attribute` (a JSON string; use `\n` between lines in the JSON):
the tool quotes the PROforma atom and applies the properties escapes itself.
Do not pre-escape `=`, `:` or `'`, and do not wrap the value in quotes. Keep
each value on one line (no line break inside a value). Never put a backslash in
a value — the properties format treats it as an escape and drops it. Avoid a
trailing `;` on the last line (the tool strips it). Captions and descriptions
are plain text in `caption` / `description`. Do not use `upsert_component` or
`add_attributes` for metaprops: those take raw PROforma text and you would have
to escape by hand.

## Annotation discipline (kills the drift bug)

- The guideline is described in its **metadata** only: `title` (set by
  `create_guideline`, change with `set_metadata`), `desc`, `author`, `version`.
  Exactly one of each; PROforma `/** */` comments are not preserved by the tools
  or by Composer, so never rely on them.
- `desc` MUST NOT contain a **hand-written action count** or a
  **hand-maintained drug/section list** (e.g. "10 monitoring Actions … four new
  actions: §5.3, §5.5, §5.8, §5.9"). These silently go stale when the action set
  changes and are a recurring review failure (`check_cig.mjs` FAILs on a count).
  Describe the build qualitatively ("PROforma CIG for GLP-1 adverse-effects
  monitoring; one Action per approved proposal row") and let the tasks carry
  the count. If a count is truly needed, derive it from `export_json` at
  verification time — never type it by hand. The same applies to the root plan
  caption.
- Give every task a concise `caption`; give Enquiry/Decision and data items a
  `description` where the proposal provides one.

## End-of-Step-6 determinism check (self-apply before handoff)

Verify with `export_json`, `outline`, `lint`, `check_expression`, and the
deterministic gate, and report each result. Every item must hold; fix and
re-emit if any fails:

- [ ] `lint` reports **0 errors**; no PF-G004 (orphan task definition);
      `format(check: true)` reports the file already formatted.
- [ ] The `action` set in `export_json` (`tasks` with `kind == "action"`)
      **equals** the proposal's `cig-actions` block (no residue, none missing),
      with names spelled exactly as in §6.
- [ ] **Single** root plan (`export_json.root`) for the requested
      sub-structure; every task has `reachable: true`; the `outline` tree
      matches the §6 parent plans and `after` constraints.
- [ ] Each Action and Plan has **one** metaprops with `goal.verb` and
      `goal.noun_phrase` (monitoring: `order`; therapy: `achieve`/`avoid`; root:
      as the proposal fixes it).
- [ ] Each monitoring action's metaprops has **all five** `ServiceRequest.*`
      keys (incl. `performerInstruction` for any triggered/urgent step), the same
      five fields with identical values inside `goal.noun_phrase`, and every
      required key from `MetapropsSyntax.md` with a real value; citations are
      `source` / `source.1..n`.
- [ ] Every action whose `applies_when` is a sub-population carries a
      `precondition` that `check_expression` types as `truth_value`, over a data
      item asked by an Enquiry (`data[].asked_by` non-empty); no precondition on
      an `all_patients_on_therapy` action.
- [ ] No empty plans, no Enquiry without sources, no Decision without
      candidates, no candidate without an argument; for a full CIG the Enquiry
      and Decision are populated.
- [ ] Metadata `title` set; `desc` qualitative, with no hand-written count or
      stale drug/section list.
- [ ] `guideline/<name>.mmd` regenerated from this file with `to_mermaid`, and `guideline/<name>.html` with the proforma skill's `scripts/build_report.mjs`.
- [ ] `node scripts/check_cig.mjs projects/<p>/guideline/<name>.pf --proposal projects/<p>/plans/PROPOSAL-<ts>.md`
      (add `--baseline projects/<p>/guideline/baseline/<newest>.pf` on an
      iteration) exits 0 with no FAIL.
- [ ] **Coding-patch freeze (coding-only runs):** the same command with
      `--baseline <snapshot> --coding-patch` exits 0: the action set, names,
      captions, preconditions, Decision candidates, `goal.noun_phrase`,
      `source.N` and `occurrenceTiming` equal the snapshot, and the only
      metaprops keys that differ are the four
      `ServiceRequest.supportingInfo.*Codes` keys.

This skill ends at a clean, self-verified `.pf`. Step 7 (the blocking
`cig-monitoring-review` gate and `cq-verification`) is run separately by the
review subagents and re-runs the full check set; do not mark the build done
until that gate passes with zero FAILs.
