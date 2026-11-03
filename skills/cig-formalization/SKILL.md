---
name: cig-formalization
description: >-
  Deterministic Step 6 emitter that materializes an APPROVED PROforma CIG
  monitoring proposal into a PROforma 1.9 guideline file
  (`projects/<project_dir>/guideline/<name>.pf`) via the proforma-editor tools.
  Default is a fresh-file full re-emit (snapshot to guideline/baseline/, delete,
  create_guideline, rebuild with native task properties, the HL7 FHIR
  ServiceRequest metaprops, quoted sources, ADE monitors as Enquiries with
  their findings and test steps, then a coding pass: SNOMED CT with
  snomed_search, LOINC for ordered tests with loinc_search). Coding-only
  requests (add SNOMED CT codes) use coding-patch mode: do not delete the .pf;
  add or change only ontology.coding (Composer's "<SCT|LNC>:<code> [<caption>]",
  on components, data items and candidates). Use this skill —
  alongside proforma-editor — whenever an approved
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
field of the order. None of these are clinical mistakes — they are
bookkeeping mistakes. So this skill is deliberately small and rule-shaped: it
removes the room for merges, duplicates, renames, and stale prose. Follow it
literally and the emit becomes reproducible.

## The single source of truth

The **approved** `projects/<project_dir>/plans/PROPOSAL-*.md` (`status: approved`)
is authoritative. Read it in full before emitting, and treat its
**§6 task table**, its ```` ```cig-actions ```` block (every Action and every
monitoring Enquiry) and its ```` ```cig-test-decisions ```` block (every
test-ordering Decision) as the verbatim, canonical name list — you emit
exactly those tasks with exactly those names, no more, no fewer, never
renamed. The proposal also fixes, per task: kind, parent
plan, `after` siblings, the goal `verb`, the precondition (whether there is one,
and over which data item), the `applies_when` sub-population, and the
`monitoring_stance`. §5 (data items table) fixes every Enquiry data item: name,
type, unit, source, users. §9 (Sources) holds the citation and verbatim passage
behind each element. Where the proposal gives a `noun_phrase` *summary* rather
than the full order, you compose the `ServiceRequest.*` keys, `goal.noun_phrase`,
`procedure`, `description` and the other metaprops lines from the proposal's §3
extraction + §6 rows + §9 quotes, formatted to the canonical contract (see
References) — that formatting is deterministic, not a new decision. Quotes are
copied from the source document, never reworded.

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
- **Structural example (not a clinical template):** `cig/examples/ccd-antithrombotic-monitoring.pf`
  (lint clean, passes the gate) and its diagram `ccd-antithrombotic-monitoring.mmd`. Use it
  to check the shape of an emitted file; never copy its tasks, data items or
  clinical content. What you emit comes only from the approved proposal.
- **Canonical task contract (native fields, the `ServiceRequest` order, required
  keys, source quotes, ontology coding, numbered repeat keys, controlled vocab,
  anti-placeholder rules):** `skills/cig-monitoring/references/MetapropsSyntax.md`
  — this file is the single source for the contract; do not re-invent or
  duplicate it.
- **Native task properties (Composer's property sheet):**
  `cig/know-how/proforma/TaskProperties.md` — Caption, Description,
  Ontology coding, Precondition, Wait condition, Postcondition, Event trigger,
  procedure, cycles, and the candidate properties, each with its `.pf`
  attribute; data items in `cig/know-how/proforma/Data.md`. Emit every native
  property the proposal fixes; the Precondition and the Ontology coding are the
  ones most often missed.
- **Ontology coding (value form and location):** `cig/know-how/proforma/Ontology.md`
  — `ontology.coding=<SCT|LNC>:<code> [<caption>]`, on a task's **component**
  in its parent plan, in a data item's or candidate's own metaprops.
- **Goal side + opt-in case-report source rule + labeled-ADE skeleton:**
  `skills/cig-monitoring/references/ActionEnactmentGoal.md`.
- **ADE monitoring in `Monitor_Undesired_State` (display Action, ADE Enquiries,
  finding data items, test steps, with their tool calls):**
  `skills/cig-monitoring/references/ADEMonitoringEnquiry.md`.
- **Structural patterns (only when the approved scope includes them):**
  `TopLevelPlan.md`, `MonitoringPlan.md`, `ActionComponent.md`,
  `StateAchievementGoal.md` (all under `skills/cig-monitoring/references/`),
  and `cig/know-how/proforma/Enquiry.md`, `cig/know-how/proforma/Decision.md`.
- **Language:** the `proforma_reference` tool. Read it before writing any
  expression.
- **SNOMED CT lookup:** the `snomed_search` tool (EBI OLS4, restricted to
  SNOMED CT). It returns `shortForm` `SNOMED_<id>` and the preferred label;
  record `SCT:<id> [<label>]` with the id and label exactly as returned.
- **LOINC lookup (ordered tests):** the `loinc_search` tool (NLM Clinical
  Tables). Each row starts with `LOINC_NUM` and `LONG_COMMON_NAME`; record
  `LNC:<LOINC_NUM> [<LONG_COMMON_NAME>]` exactly as returned. Use the
  proposal's §7 code when it fixes one.
- **RxNorm lookup (prescribed drugs):** the `rxnorm_search` tool (NLM RxNav).
  For a therapy action that prescribes one drug, record the ingredient as
  `rxnorm.coding=RXNORM:<rxcui>` + `rxnorm.label=<name>` exactly as returned,
  on the task definition (Composer has no RxNorm provider and shows these as
  ordinary metaproperties), in addition to the SNOMED CT `ontology.coding` on
  its component. Drug-class actions get none.
- **Older guidelines:** `node scripts/migrate_metaprops.mjs <guideline.pf>`
  brings a `.pf` onto the current contract: it converts the intermediate
  `order.code` / `order.timing` / `order.patient_instruction` /
  `order.performer_instruction` keys back to the `ServiceRequest.*` block (with
  `ServiceRequest.intent=order`), rewrites `goal.noun_phrase` as the
  `ServiceRequest` string, and fills an empty native `procedure` and
  `description` (which also completes a guideline on the older
  `ServiceRequest`-only contract). It also converts the kit's older coding
  (`SNOMED:<id>` / `LOINC:<code>` + `ontology.label`, on the task definition)
  to Composer's `SCT:<id> [<label>]` / `LNC:<code> [<label>]` and moves each
  task's coding to its component. It does not add quotes or new codes; add the
  quotes from the sources and run the coding pass.

Do all `.pf` editing through the **proforma-editor** tools. Read
`skills/proforma-editor/SKILL.md` and `setup_tools(skills: ["proforma-editor"])`
first. **Never edit a `.pf` file by hand** (no Write/Edit/sed on it). Every
tool edit re-parses the file, refuses to save a broken one, and reports the lint
counts. If a tool call fails, read the error, fix the arguments, and retry —
never fall back to writing the file manually. Pass the `.pf` path as an
**absolute** path in every call (`file`).

## Choose the emit mode first

**Full re-emit (default).** New CIG, first emit of an approved proposal, or any request that changes the clinical action set. Follow *Prime directive: regenerate from empty* below.

**Coding-patch mode.** Use this when the user asks **only** to add terminology codes (SNOMED CT) to an **existing** CIG — or the proposal header marks `mode: coding-patch`. This is **not** a rebuild. Detect it before touching the file. If the request could be either a rebuild or a patch, **stop and ask**; never assume a full rebuild for a coding request.

Coding-patch rules (MUST / MUST NOT):

1. **Do not delete the `.pf`.** Snapshot it to `guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf` first, then patch the existing file in place.
2. **Do not add, remove, or rename tasks, components, candidates, arguments, sources or data items.** The Action name set, plan structure, scheduling, Decision candidates and Enquiry data items MUST stay identical to the snapshot.
3. **Do not change captions, descriptions, procedures, preconditions, `goal.noun_phrase`, the `ServiceRequest.*` keys, `source.N` / `quote.N`, `literature_basis`, `applies_when`, Decision arguments, or the metadata.** Those strings are frozen from the prior approved emit.
4. **Only add or replace `ontology.coding`** (Composer's form `<SCT|LNC>:<code> [<caption>]`, `cig/know-how/proforma/Ontology.md`): for monitoring tasks and therapy actions on their **component** in the parent plan, for data items in their own metaprops (candidates and arguments only when a real concept fits), with the code and term `snomed_search` returns, and on test steps (the component of an `Order_<Test>` action, each test-ordering candidate) with the LOINC code and name `loinc_search` returns. Remove a leftover `ontology.label`, and move a coding found on a task definition to its component (`node scripts/migrate_metaprops.mjs` does both). Every other key keeps its exact value. Key order does not matter (the tools sort keys on save).
5. **Patch a metaprops map by read → add → write back whole**, in one `set_attribute` per element:
   - read the current map with `export_json` (the element's `metaprops` object, already unescaped; a task's component is in its parent plan's `components[]`) — or `get_component(selector: "<plan>/component:Monitor_X", format: "json")`, which returns the raw properties text;
   - add the coding key to that map (a component may already hold keys Composer wrote, e.g. `ae.private.component.id`: keep them);
   - write every line back with `set_attribute(file, selector: "<plan>/component:Monitor_X", attribute: "metaprops", value: "<all key=value lines>")` (a data item: `selector: "<item>"`; a candidate: `"<decision>/candidate:<name>"`). It **replaces** the whole metaprops; a key you leave out is deleted.
   Never write a partial map; never write a task's `ontology.coding` on the task definition (Composer does not read it there).
6. If the approved proposal's action set **differs** from the existing `.pf`, this is **not** a coding patch — stop and report. Do not silently switch to a full rebuild.
7. Do **not** rename the project directory.

After the patch, run `format` and `lint` (0 errors), regenerate the `.mmd` and the `.html` report, then run the freeze gate:
`node scripts/check_cig.mjs projects/<p>/guideline/<name>.pf --proposal projects/<p>/plans/PROPOSAL-<ts>.md --baseline projects/<p>/guideline/baseline/<snapshot>.pf --coding-patch`.
It FAILs on any change other than `ontology.coding` / `ontology.label` (on components, data items, candidates, and their removal from task definitions).

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
2. **Exact action set.** The emitted set of `action`s plus monitoring
   `enquiry`s MUST EQUAL the proposal's ```` ```cig-actions ```` block exactly,
   and the test-ordering `decision`s its ```` ```cig-test-decisions ```` block —
   no extras, no prior-session residue, none missing.
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
6. **The order: the HL7 FHIR ServiceRequest, stated three ways that agree**
   (the recurring failure): the metaprops MUST carry `ServiceRequest.intent=order`,
   `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`,
   `ServiceRequest.patientInstruction`, and `ServiceRequest.performerInstruction`
   (required whenever there is a triggered lab or an urgent/escalation step);
   `goal.noun_phrase` is the same order as one string,
   `ServiceRequest.intent = order; ServiceRequest.code = …; ServiceRequest.occurrenceTiming = …; ServiceRequest.patientInstruction = …[; ServiceRequest.performerInstruction = …]`,
   with values identical to the keys (no `;` inside a `ServiceRequest` value);
   the native `procedure` is `<code>, <occurrenceTiming>. Patient: <...>. Clinician: <...>.`
   Never stop at intent + code. MUST NOT write any intermediate `order.*` key
   (the gate FAILs them).
7. **Native task properties filled** (`cig/know-how/proforma/TaskProperties.md`). Every monitoring
   and therapy action has a `caption` and a `description` (monitoring:
   `Monitors <monitored_target>. <literature_basis>.`; therapy: the
   recommendation and why it was modelled); every monitoring action has its
   `procedure` (an ADE Enquiry has none: its `description` ends with the
   order), and every therapy action has one when the proposal gives
   something concrete to do (dose, titration). Every task the proposal scopes
   to a sub-population has its **Precondition**, and every action and
   concept-bearing data item gets its **Ontology coding** in the coding pass
   (an action's on its component, `cig/know-how/proforma/Ontology.md`).
   Emit the other native properties (Wait condition, Postcondition, Event
   trigger, cycles, a plan's termination/abort condition) exactly when the
   proposal fixes them.
8. **Every citation quoted.** Each `source.N` on a monitoring or therapy action
   is paired with `quote.N`: the verbatim passage (at most about 25 words, in
   double quotes, prefixed with page/section, `...` for omissions) copied from
   the source document the user provided (`projects/<p>/resources/`, or a file
   the user named). An action that cites sources but quotes none FAILs.
9. **No placeholders.** Never `source=s`, `instrument=i`, `provenance_type=p`,
   `tbd`, `TODO`, empty values, or a data item typed `text` just to avoid
   choosing. Use the real content and the real type fixed in the proposal.
10. **Scope to the request.** Build only the sub-structure the approved proposal
    asks for, fully populated. MUST NOT emit empty placeholder components — no
    task without a caption and `goal.verb`, no Enquiry with no sources, no
    Decision with no candidates or a candidate with no argument, no plan with no
    components. An "ADE monitoring only" build is a single populated monitoring
    plan as the root — never the full Top-Level Plan with empty
    Enquiry/Decision/Therapy stubs.
11. **Executable conditions only.** Every precondition and argument condition is
    a PROforma expression that `check_expression` types as `truth_value` with
    every name resolving to the intended data item or decision (not to "text
    literal" by accident). A sentence is not a precondition.
12. **ADE monitors are Enquiries** (`ADEMonitoringEnquiry.md`). In
    `Monitor_Undesired_State`: `Display_Potential_ADEs` first; every ADE monitor
    an `enquiry` (never an `action`) after it, with the monitor metaprops and
    the order in its `description`; its finding data items (SNOMED CT coded);
    and at most one test step after it, gated on the findings: an
    `Order_<Test>` action (LOINC coded on its component) or a
    `Tests_Ordering_Recommendations_<ADE>` decision (`choice_mode multiple`,
    one LOINC-coded candidate per test, each with an argument).

## The deterministic recipe

All calls below take `file: "<absolute path to guideline/<name>.pf>"`; it is
omitted from the listings for brevity. Through capa the tool ids are
`pf_<tool>` (see `skills/proforma-editor/SKILL.md`).

1. **Choose the emit mode.** If this is coding-only, follow *Coding-patch mode* and skip steps 3–12. Still read the approved proposal, then run the freeze gate.
2. **Read** the approved proposal, `skills/cig-monitoring/references/`
   (`MetapropsSyntax.md`, `cig/know-how/proforma/TaskProperties.md` and the patterns the scope uses),
   and `proforma_reference`.
   Confirm `status: approved`; note the output path, the §5 data items, the §6
   task table, the §9 sources and quotes, and the `cig-actions` block.
3. **Fresh file.** If `guideline/<name>.pf` exists: copy it to
   `guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf`, then delete it.
4. **`create_guideline`** `(name: "<Root_Plan>", title: "<proposal title>", author: "<author>")`.
   `name` is the root plan's canonical name from §6 (e.g. `Condition_Therapy_Plan`;
   for an ADE-only build, the monitoring plan's name). The title also becomes
   the root plan caption.
5. **`set_metadata`** `(desc: "<qualitative description>", version: "<proposal version>")`.
   See *Annotation discipline*. Then the root plan's goal, in one call:
   `set_attribute(selector: "<Root_Plan>", attribute: "metaprops", value: "goal.verb=treat\ngoal.noun_phrase=<from proposal>")`
   (the tools mirror root-plan metaprops into the guideline-level metaprops).
6. **Plan skeleton** with `add_task`, top to bottom in §6 order (full CIG shown;
   see *Structural backbone*):
   ```
   add_task(plan: "Condition_Therapy_Plan", kind: "enquiry",  name: "Get_Eligibility_Data", caption: "...", description: "...")
   add_task(plan: "Condition_Therapy_Plan", kind: "decision", name: "Eligibility_Decision", caption: "...", after: ["Get_Eligibility_Data"])
   add_task(plan: "Condition_Therapy_Plan", kind: "plan",     name: "Therapy_Plan", caption: "...", after: ["Eligibility_Decision"],
            precondition: "result_of(Eligibility_Decision) = Eligible")
   add_task(plan: "Condition_Therapy_Plan", kind: "plan",     name: "Monitoring_Plan", caption: "...", after: ["Therapy_Plan"])
   add_task(plan: "Monitoring_Plan",        kind: "plan",     name: "Monitor_Actions", caption: "...")          # parallel: no after
   add_task(plan: "Monitoring_Plan",        kind: "plan",     name: "Monitor_Desired_State", caption: "...")
   add_task(plan: "Monitoring_Plan",        kind: "plan",     name: "Monitor_Undesired_State", caption: "...")
   ```
   `after` lists siblings in the same plan and writes
   `schedule_constraint :: completed('<sibling>')`. Lint warns about the empty
   Enquiry and Decision (and the not-yet-existing `Eligible` candidate) until
   the next steps fill them; it never warns about an empty plan, so step 12 and
   the gate check for those.
7. **Enquiry data items** — one per §5 row, then one source each:
   ```
   add_data_item(name: "threshold_measure", type: "real", caption: "<the measure, as asked>", unit: "<unit>")
   set_attribute(selector: "threshold_measure", attribute: "description", value: "<what it is>; primary eligibility threshold")
   add_data_item(name: "on_interacting_medication", type: "boolean", caption: "On <the interacting medication class>?")
   set_attribute(selector: "on_interacting_medication", attribute: "metaprops",
                 value: "source=<Drug> US Prescribing Information, §<n> <Warning>\nquote=§<n>: \"<verbatim sentence that scopes the harm to patients on the interacting medication>\"")
   add_source(task: "Get_Eligibility_Data", data: "threshold_measure")
   add_source(task: "Get_Eligibility_Data", data: "on_interacting_medication")
   ```
   Real types: `real` / `integer` for numeric thresholds (with `unit`),
   `boolean` for yes/no facts, `text` (with `range` when the values are a closed
   list, e.g. `range: "\"none\", \"<named_contraindication>\""`) otherwise.
   Set every native data-item property the proposal fixes (`cig/know-how/proforma/Data.md`:
   caption, description, type, unit, range, default value, derivation).
   `add_data_item` has no `description` parameter; set it with `set_attribute`.
   A data item modelled from a specific passage (a contraindication, a
   sub-population flag) gets that `source` + `quote` in its metaprops; its
   Ontology coding is added in step 11. Create data items **before** any
   expression that uses them.
8. **Decision** — candidates, then at least one argument each:
   ```
   check_expression(expression: "threshold_measure >= 30 and contraindication_present = false")
   add_candidate(decision: "Eligibility_Decision", name: "Eligible", caption: "...")
   set_attribute(selector: "Eligibility_Decision/candidate:Eligible", attribute: "description", value: "<free-text rationale>")
   add_argument(decision: "Eligibility_Decision", candidate: "Eligible", support: "for",
                condition: "threshold_measure >= 30 and contraindication_present = false",
                name: "Arg_Eligible", caption: "<rationale, with the evidence grade if the source gives one>")
   set_attribute(selector: "Eligibility_Decision/candidate:Eligible/argument:Arg_Eligible", attribute: "metaprops",
                 value: "source=<guideline, recommendation, page>\nquote=<page/section>: \"<verbatim criterion passage>\"")
   ```
   Run `check_expression` on every condition first: the type must be
   `truth_value` and each name must resolve to the intended `data (...)` item;
   only values the proposal means as literals (`none`, `true`, a candidate name)
   may resolve to "text literal". Support direction and condition come from the
   proposal verbatim. The recommendation defaults to `netsupport() > 0`; set
   `choice_mode` only when §6 says `multiple`
   (`set_attribute(selector: "Eligibility_Decision", attribute: "choice_mode", value: "multiple")`,
   and then gate with `result_set(D) includes C`).
9. **Therapy actions** (full-CIG scope) — `add_task(plan: "<therapy plan>", kind: "action", name, caption)`,
   then `set_attribute` for `description`, (when the proposal gives one)
   `procedure`, and (when the proposal scopes it) `precondition`, then one
   `set_attribute` metaprops with `goal.verb=achieve|avoid`,
   `goal.noun_phrase` (State Achievement Goal, both polarities as the proposal
   fixes them — see `references/StateAchievementGoal.md`) and at least one
   `source.N` + `quote.N`.
10. **For each monitoring task in the §6 table (and only those), emit the fixed bundle**
    (next section). Iterate the table top to bottom; do not add or skip rows.
    In `Monitor_Undesired_State`, emit `Display_Potential_ADEs` first, then
    each ADE as the *ADE bundle* (below): the Enquiry, its data items and its
    test step.
11. **Coding pass.** For each monitoring task (the disorder, finding or
    measurement it watches), each therapy action (the procedure or substance
    it delivers) and each data item that names a clinical concept (the
    observable or finding it records; **required** on every finding of an ADE
    Enquiry), run `snomed_search` with the concept's plain name, pick the
    closest single concept, and write it as one key,
    `ontology.coding=SCT:<id> [<label as returned>]` (Composer's form, the
    caption required; `cig/know-how/proforma/Ontology.md`), read → add →
    write whole, **where Composer reads it**:
    - a task (monitoring task, therapy action, test-order action): on its
      **component** in the parent plan,
      `set_attribute(selector: "<parent plan>/component:<task>", attribute: "metaprops", value: "ontology.coding=SCT:<id> [<label>]")`
      (keep any key the component already holds); never on the task
      definition;
    - a data item or candidate: in its own metaprops, with its other keys
      (`source`, `quote`).
    For each ordered test (the component of an `Order_<Test>` action, each
    candidate of a test-ordering decision) run `loinc_search` and write
    `ontology.coding=LNC:<LOINC_NUM> [<LONG_COMMON_NAME>]` (**required**).
    No `ontology.label` key: the term is the caption inside the value. For
    each therapy action that prescribes a single drug, run `rxnorm_search` and
    add `rxnorm.coding=RXNORM:<rxcui>` + `rxnorm.label` (the ingredient) to the
    task definition's metaprops. Use the proposal's §7
    Terminology Reuse choice when it fixes one. Code other candidates and
    arguments only when a real concept fits; leave structural options such
    as `Eligible` / `Not_Eligible` uncoded. Record a narrower or broader
    choice in `assistant_invention` (monitors) or the description.
12. **Finish:** `format`, `lint` (0 errors; read every warning and fix the ones
    the proposal does not explain; run once with `include_info: true` and
    confirm every PF-X060 "treated as text literal" is an intended literal, not
    a misspelt data item), `to_mermaid(output: "<abs>/guideline/<name>.mmd")`,
    `node scripts/export_composer_project.mjs <guideline.pf> projects/<project_dir>/composer-project --name <name> --force`
    (the Deontics Composer project: Composer reads every ontology term from the
    project's `.deo`, so a standalone `.pf` opens without its codes; see
    `cig/know-how/proforma/Ontology.md`),
    `node <proforma skill>/scripts/build_report.mjs <guideline.pf> --attach-dir projects/<project_dir>/composer-project --attach-name <name>-composer-project.zip`
    (writes the self-contained `guideline/<name>.html` viewer, with a Download
    Composer project button), then the *End-of-Step-6 determinism check*. Fix any failure before handing
    off to Step 7.

## The fixed per-action bundle

For each monitoring action `Monitor_X` listed in §6, emit exactly these calls.
The values below are the desired-outcome monitor `Monitor_Ischemic_Events`
from the structural example `cig/examples/ccd-antithrombotic-monitoring.pf`;
they show the shape of the bundle, not a monitor to add. Your values come from
the approved proposal. In `Monitor_Undesired_State` the same metaprops go on
an Enquiry instead (see *The ADE bundle* below).

```
# 1) Task + its component in the right monitoring sub-plan; precondition ONLY if population-scoped
#    (this monitor applies to all patients on therapy, so it has none; in the same example
#    Monitor_PPI_Hypomagnesemia is population-scoped and its precondition reads on_digoxin_or_diuretic)
add_task(plan: "Monitor_Desired_State", kind: "action", name: "Monitor_Ischemic_Events",
         caption: "Monitor for ischemic events (angina, MI, stroke or TIA, stent thrombosis)")

# 2) Native properties: what is monitored and why, and the order as Composer's instruction
set_attribute(selector: "Monitor_Ischemic_Events", attribute: "description", value:
"Monitors MACE and atherosclerotic events (achieve goals of Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban and Prescribe_DOAC). Every antithrombotic in §4.3.1 is recommended to reduce MACE or atherosclerotic events, so the desired outcome is the absence of ischemic events, and the vorapaxar and prasugrel labels require stopping the drug if a stroke, TIA or ICH occurs.")
set_attribute(selector: "Monitor_Ischemic_Events", attribute: "procedure", value:
"Ischemic event review (angina or equivalent symptoms, myocardial infarction, stroke or TIA, stent thrombosis, unplanned revascularization), each follow-up visit, at 1, 3, 6 and 12 months after starting or changing the regimen, then every 6 to 12 months, with same-day assessment of new symptoms. Patient: call emergency services for chest pain or pressure at rest, sudden weakness or numbness, trouble speaking or loss of vision, and report any change in your usual angina at each visit. Clinician: assess suspected ACS or stroke urgently with ECG, troponin or neuroimaging, discontinue vorapaxar or prasugrel if a stroke, TIA or ICH occurs on it, and reassess the antithrombotic regimen after any ischemic event.")

# 3) Exactly one metaprops: the whole contract in one call (replaces any existing metaprops)
set_attribute(selector: "Monitor_Ischemic_Events", attribute: "metaprops", value:
"goal.verb=order
goal.noun_phrase=ServiceRequest.intent = order; ServiceRequest.code = ischemic event review (angina or equivalent symptoms, myocardial infarction, stroke or TIA, stent thrombosis, unplanned revascularization); ServiceRequest.occurrenceTiming = each follow-up visit, at 1, 3, 6 and 12 months after starting or changing the regimen, then every 6 to 12 months, with same-day assessment of new symptoms; ServiceRequest.patientInstruction = call emergency services for chest pain or pressure at rest, sudden weakness or numbness, trouble speaking or loss of vision, and report any change in your usual angina at each visit; ServiceRequest.performerInstruction = assess suspected ACS or stroke urgently with ECG, troponin or neuroimaging, discontinue vorapaxar or prasugrel if a stroke, TIA or ICH occurs on it, and reassess the antithrombotic regimen after any ischemic event
ServiceRequest.intent=order
ServiceRequest.code=ischemic event review (angina or equivalent symptoms, myocardial infarction, stroke or TIA, stent thrombosis, unplanned revascularization)
ServiceRequest.occurrenceTiming=each follow-up visit, at 1, 3, 6 and 12 months after starting or changing the regimen, then every 6 to 12 months, with same-day assessment of new symptoms
ServiceRequest.patientInstruction=call emergency services for chest pain or pressure at rest, sudden weakness or numbness, trouble speaking or loss of vision, and report any change in your usual angina at each visit
ServiceRequest.performerInstruction=assess suspected ACS or stroke urgently with ECG, troponin or neuroimaging, discontinue vorapaxar or prasugrel if a stroke, TIA or ICH occurs on it, and reassess the antithrombotic regimen after any ischemic event
category=desired_outcome
monitored_target=MACE and atherosclerotic events (achieve goals of Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban and Prescribe_DOAC)
applies_when=all_patients_on_therapy
provenance_type=assistant_completed_from_guidelines
source_kind=clinical_guideline_plus_package_insert
source.1=2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), §4.3.1 Rec 1 (p.e50)
quote.1=p.e50, Rec 1: \"low-dose aspirin 81 mg (75-100 mg) is recommended to reduce atherosclerotic events\"
source.2=ZONTIVITY (vorapaxar) US Prescribing Information 2022, §4.1
quote.2=§4.1: \"Discontinue ZONTIVITY in patients who experience a stroke, TIA, or ICH\"
source.3=EFFIENT (prasugrel) US Prescribing Information 2022, §4.2
quote.3=§4.2: \"Patients who experience a stroke or TIA while on Effient generally should have therapy discontinued\"
knowledge_origin=the therapy goals of the guideline, and the vorapaxar and prasugrel label stop rules
guideline_status=not_specified_as_a_guideline_monitoring_task
monitoring_stance=proposed_by_assistant
literature_basis=every antithrombotic in §4.3.1 is recommended to reduce MACE or atherosclerotic events, so the desired outcome is the absence of ischemic events, and the vorapaxar and prasugrel labels require stopping the drug if a stroke, TIA or ICH occurs
assistant_invention=the event review at each visit, the visit cadence, and ECG, troponin or neuroimaging as triggered tests; the SNOMED CT concept Cardiovascular event (event) is broader than the monitored MI, covering stroke as well
instrument=clinician interview with ECG, troponin or neuroimaging on suspected events
monitoring_frequency_basis=proposed, at the Figure 9 transition points then routine CCD follow-up; the guideline gives no cadence in §4.3.1
trigger=new or worsening chest pain, or stroke or TIA symptoms
cq=CQ4, CQ5, CQ8")

# 4) Coding pass (step 11): snomed_search(query: "cardiovascular event") -> SNOMED_405617006,
#    then read the component's map, add the coding, write it back whole
set_attribute(selector: "Monitor_Desired_State/component:Monitor_Ischemic_Events", attribute: "metaprops",
              value: "ontology.coding=SCT:405617006 [Cardiovascular event (event)]")
```

The resulting `.pf` text (after `format`; keys sorted, `=` and `:` inside
values escaped by the properties writer, shown as `\\=` / `\\:` inside the
quoted PROforma atom, and non-ASCII characters such as `§` written as
`\\u00A7`; the tools and `export_json` read them back unescaped).
The metaprops lines are abbreviated here; the file holds every line written in
step 3:

```
action  :: 'Monitor_Ischemic_Events' ;
     caption :: 'Monitor for ischemic events (angina, MI, stroke or TIA, stent thrombosis)' ;
     description :: 'Monitors MACE and atherosclerotic events (achieve goals of Prescribe_Aspirin, ...). ...' ;
     metaprops :: 'ServiceRequest.code=ischemic event review (angina or equivalent symptoms, myocardial infarction, stroke or TIA, stent thrombosis, unplanned revascularization)
ServiceRequest.intent=order
ServiceRequest.occurrenceTiming=each follow-up visit, at 1, 3, 6 and 12 months after starting or changing the regimen, then every 6 to 12 months, with same-day assessment of new symptoms
ServiceRequest.patientInstruction=call emergency services for chest pain or pressure at rest, sudden weakness or numbness, trouble speaking or loss of vision, and report any change in your usual angina at each visit
ServiceRequest.performerInstruction=assess suspected ACS or stroke urgently with ECG, troponin or neuroimaging, discontinue vorapaxar or prasugrel if a stroke, TIA or ICH occurs on it, and reassess the antithrombotic regimen after any ischemic event
applies_when=all_patients_on_therapy
...
goal.noun_phrase=ServiceRequest.intent \\= order; ServiceRequest.code \\= ischemic event review (angina or equivalent symptoms, myocardial infarction, stroke or TIA, stent thrombosis, unplanned revascularization); ...
goal.verb=order
...
quote.1=p.e50, Rec 1\\: "low-dose aspirin 81 mg (75-100 mg) is recommended to reduce atherosclerotic events"
quote.2=\\u00A74.1\\: "Discontinue ZONTIVITY in patients who experience a stroke, TIA, or ICH"
...
source.1=2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), \\u00A74.3.1 Rec 1 (p.e50)
...
' ;
     procedure :: 'Ischemic event review (angina or equivalent symptoms, myocardial infarction, stroke or TIA, stent thrombosis, unplanned revascularization), each follow-up visit, ... Patient: ... Clinician: ...' ;
end action.
```
plus, in `Monitor_Desired_State`, the component the same `add_task` call wrote,
which carries the task's Ontology coding from the coding pass:
```
     component :: 'Monitor_Ischemic_Events' ;
          metaprops :: 'ontology.coding=SCT\\:405617006 [Cardiovascular event (event)]
' ;
          task_definition :: 'Monitor_Ischemic_Events' ;
          ltwh :: ...;
```

Rules for the bundle:
- The required key set, value rules and controlled vocabulary are defined in
  `MetapropsSyntax.md` — follow it exactly. Key order is not significant (the
  tools sort keys on save); the key *set* and the values are.
- `goal.noun_phrase` is the `ServiceRequest` string
  `ServiceRequest.intent = order; ServiceRequest.code = <code>; ServiceRequest.occurrenceTiming = <timing>; ServiceRequest.patientInstruction = <patient>`
  plus `; ServiceRequest.performerInstruction = <performer>` when there is one,
  with every value identical to its `ServiceRequest.*` key. No `;` inside a
  `ServiceRequest` value (use commas).
- `procedure` is `<code>, <occurrenceTiming>. Patient: <patientInstruction>. Clinician: <performerInstruction>.`
  (capitalize the first letter; the `Clinician:` sentence only when there is a
  performer instruction). It MUST contain the code and the occurrenceTiming
  verbatim.
- `description` is `Monitors <monitored_target>. <literature_basis>.`
- Repeatable keys are numbered: `source.1`, `source.2`, … (one per citation),
  each with its `quote.1`, `quote.2`, …. A repeated bare key collapses to its
  last value. A single citation may be `source` + `quote` or `source.1` +
  `quote.1`.
- Each `quote.N` is copied verbatim from the cited document and kept short
  (the gate warns above 40 words). A citation whose document is not among the
  provided sources (e.g. an instrument's validation paper) may stand without
  its own quote (WARN), but the action must quote at least one source.
- `monitored_target` names the task it traces to, e.g. `(Prescribe_Drug)`.
- Emit a `precondition` **iff** `applies_when` names a sub-population (not
  `all_patients_on_therapy`). It is an executable expression over a data item
  that the eligibility/baseline Enquiry asks for (`add_source`), checked with
  `check_expression` first. Boolean data items are compared with `= true` /
  `= false`. Universal-but-event-triggered actions (e.g. AKI triggered by
  dehydration) do **not** get a precondition — the trigger lives in
  `ServiceRequest.occurrenceTiming`/`trigger`, per the proposal.
- **Drug-gated monitors** are the one other case with a precondition. A monitor
  that traces only to therapy actions with their own precondition (e.g. a
  drug chosen by a Decision) keeps `applies_when=all_patients_on_therapy`
  (all patients on *that* drug). It carries the precondition the proposal
  gives, normally the traced drugs' own `result_of(...)` gate. The gate
  reports this as an expected WARN, not a FAIL (see the CCD example).
- Therapy interventions (full-CIG scope) carry a **State Achievement Goal**
  (`goal.verb=achieve`/`avoid`) instead of the `order` goal, no
  `ServiceRequest.*` keys, and their own caption, description, procedure,
  precondition (when scoped) and quoted source — see
  `references/StateAchievementGoal.md`.
- `ontology.coding` is added in the coding pass (step 11), on the component,
  not guessed: always from a `snomed_search` result (a `loinc_search` result
  for an ordered test), as `<SCT|LNC>:<code> [<term as returned>]`.

## The ADE bundle (Monitor_Undesired_State)

Follow `skills/cig-monitoring/references/ADEMonitoringEnquiry.md` ("Tool
calls") literally; the proposal's §6 fixes each name, data item and test.

1. Once per plan, first: `add_task(plan: "Monitor_Undesired_State", kind:
   "action", name: "Display_Potential_ADEs", caption: "<Markdown list>")`, one
   numbered item per ADE Enquiry in plan order, each line ending with two
   spaces; then its `description` and metaprops (`role=ade_display`,
   `goal.verb=order`, `goal.noun_phrase=display of the potential adverse drug
   effects monitored for this therapy`).
2. Per ADE: `add_task(kind: "enquiry", name: "Monitor_<ADE>", caption,
   precondition (only when scoped), after: ["Display_Potential_ADEs"])`; its
   `description` = `Monitors <monitored_target>. <literature_basis>. Order:
   <code>, <occurrenceTiming>. Patient: <...>. Clinician: <...>.` (an Enquiry
   has no `procedure`); its metaprops = the full monitor contract above, in
   one call.
3. Its findings: `add_data_item` (lower-case name, real type, unit for a
   measured value, caption phrased as the question), `set_attribute`
   description and metaprops (SNOMED CT coding from the coding pass, `source`
   + `quote` when the proposal gives one), `add_source(task: "Monitor_<ADE>")`.
   A finding shared by two ADEs is one data item sourced by both Enquiries.
4. Its test step, `after: ["Monitor_<ADE>"]`, with the precondition the
   proposal fixes (a disjunction over the Enquiry's findings, checked with
   `check_expression`):
   - one test: `add_task(kind: "action", name: "Order_<Test>")`, `caption`,
     `description`, `procedure`, metaprops `role=test_order`,
     `ordered_for=Monitor_<ADE>`, `goal.verb=order`, `goal.noun_phrase=<test>`,
     and the LOINC coding on its component
     (`Monitor_Undesired_State/component:Order_<Test>`);
   - two or more: `add_task(kind: "decision", name:
     "Tests_Ordering_Recommendations_<ADE>")`, `set_attribute(attribute:
     "choice_mode", value: "multiple")`, metaprops `role=test_ordering`,
     `ordered_for=Monitor_<ADE>`; per test `add_candidate` (caption), its
     LOINC metaprops (`<decision>/candidate:<Test>`) and
     `add_argument(support: "for", condition: "true()", name:
     "Arg_Order_<Test>")` unless the proposal gives a restricting condition.

**Multi-line captions.** The display caption is the one value with line
breaks: pass real newlines in the `caption` value (in JSON, `\n`). On Windows
call the proforma binary directly (MCP tools, or `scripts/lib/proforma.mjs`),
never through `npx`: the `npx.cmd` wrapper drops everything after the first
newline of an argument.

## Structural backbone (only when the approved scope includes it)

For an **ADE-only** build the root is a single plan (`create_guideline` with
the monitoring plan's name) holding `Display_Potential_ADEs` and the ADE
bundles — nothing else, unless a
population-scoped action requires the baseline Enquiry that §6 lists for it
(then the Enquiry is created first and the §6 `after` column sequences the
actions after it). In an ADE-only build the therapy actions are out of
scope, so `monitored_target` names the therapy recommendation it traces to as
the approved proposal states it (e.g. `... (Prescribe_Drug)`). The gate cannot
resolve that name in the file and reports it as a WARN for the reviewer, who
checks it against the proposal. Never add a therapy stub to satisfy the gate.

For a **full Top-Level Plan**, follow `references/TopLevelPlan.md` (the
structural example `cig/examples/ccd-antithrombotic-monitoring.pf` has this shape):
a root plan with four components — Enquiry, Decision (after the Enquiry),
Therapy sub-plan (after the Decision, `precondition :: result_of(<decision>) = Eligible`,
or, when the Decision chooses among several regimens, a shared contraindication
with each therapy action gated by `result_of` its regimen; see `references/TherapyPlan.md`),
Monitoring sub-plan (after the Therapy plan) — sequenced with `after` on
`add_task` (PROforma has no "next" link; the constraint sits on the later
component). Parallel monitoring sub-plans share the Monitoring plan with no
constraints between them. Populate the Enquiry's data items and the Decision's
candidates and arguments (`cig/know-how/proforma/Enquiry.md`, `cig/know-how/proforma/Decision.md`) — never leave them empty.

## Writing long values safely

`metaprops`, `description` and `procedure` values are long and contain
punctuation. Pass them as the `value` field of `set_attribute` (a JSON string;
use `\n` between metaprops lines in the JSON): the tool quotes the PROforma
atom and applies the properties escapes itself. Do not pre-escape `=`, `:` or
`'`, and do not wrap the value in quotes; the double quotes of a `quote.N` are
plain characters inside the value (escape them only as JSON requires). Keep
each value on one line (no line break inside a value; the only multi-line
value is the `Display_Potential_ADEs` caption, see *The ADE bundle*). Never put a backslash in
a value — the properties format treats it as an escape and drops it. Never put
a `;` inside a `ServiceRequest.*` value (it is the `goal.noun_phrase` field
separator; use commas). Avoid a
trailing `;` on the last line (the tool strips it). Captions, descriptions and
procedures are plain text in `caption` / `description` / `procedure`. Do not
use `upsert_component` or `add_attributes` for metaprops: those take raw
PROforma text and you would have to escape by hand.

## Annotation discipline (kills the drift bug)

- The guideline is described in its **metadata** only: `title` (set by
  `create_guideline`, change with `set_metadata`), `desc`, `author`, `version`.
  Exactly one of each; PROforma `/** */` comments are not preserved by the tools
  or by Composer, so never rely on them.
- `desc` MUST NOT contain a **hand-written action count** or a
  **hand-maintained drug/section list** (e.g. "10 monitoring Actions … four new
  actions: §5.3, §5.5, §5.8, §5.9"). These silently go stale when the action set
  changes and are a recurring review failure (`check_cig.mjs` FAILs on a count).
  Describe the build qualitatively ("PROforma CIG for <therapy> adverse-effects
  monitoring; one Action per approved proposal row") and let the tasks carry
  the count. If a count is truly needed, derive it from `export_json` at
  verification time — never type it by hand. The same applies to the root plan
  caption.
- Give every task a concise `caption`; give every action, the Enquiry/Decision
  and data items a `description` (for data items and the Enquiry/Decision,
  where the proposal provides one).

## End-of-Step-6 determinism check (self-apply before handoff)

Verify with `export_json`, `outline`, `lint`, `check_expression`, and the
deterministic gate, and report each result. Every item must hold; fix and
re-emit if any fails:

- [ ] `lint` reports **0 errors**; no PF-G004 (orphan task definition);
      `format(check: true)` reports the file already formatted.
- [ ] The `action` set plus the monitoring `enquiry`s in `export_json`
      **equals** the proposal's `cig-actions` block, and the test-ordering
      `decision`s its `cig-test-decisions` block (no residue, none missing),
      with names spelled exactly as in §6.
- [ ] `Monitor_Undesired_State` starts with `Display_Potential_ADEs`, whose
      caption lists one item per ADE Enquiry; every ADE monitor is an
      `enquiry` after it, whose description states the order and whose
      findings carry SNOMED CT coding (`SCT:<id> [<caption>]`); the component
      of every `Order_<Test>` action and every test-ordering candidate carries
      `LNC:<code> [<caption>]`; each
      test step runs after its Enquiry with a precondition over its findings,
      and each test-ordering decision has `choice_mode multiple`.
- [ ] **Single** root plan (`export_json.root`) for the requested
      sub-structure; every task has `reachable: true`; the `outline` tree
      matches the §6 parent plans and `after` constraints.
- [ ] Each Action and Plan has **one** metaprops with `goal.verb` and
      `goal.noun_phrase` (monitoring: `order`; therapy: `achieve`/`avoid`; root:
      as the proposal fixes it).
- [ ] Each monitoring action has a `caption`, `description` and `procedure`
      (each ADE Enquiry a `caption` and a `description` that states the order);
      its metaprops have `ServiceRequest.intent=order`, `ServiceRequest.code`,
      `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`
      (plus `ServiceRequest.performerInstruction` for any triggered/urgent
      step) and every required key from `MetapropsSyntax.md` with a real
      value; `goal.noun_phrase` repeats the same `ServiceRequest.*` values;
      `procedure` states the code and the occurrenceTiming; no intermediate
      `order.*` key anywhere.
- [ ] Each therapy action has a goal, `caption`, `description` (and a
      `procedure` and `precondition` where the proposal gives one) and at
      least one source.
- [ ] Every monitoring and therapy action pairs its `source` / `source.1..n`
      with `quote` / `quote.1..n` holding a verbatim passage in double quotes.
- [ ] Every `ontology.coding` is Composer's `SCT:<id> [<caption>]` (an
      ordered test: `LNC:<code> [<caption>]`), code and caption as returned by
      `snomed_search` / `loinc_search`, with no `ontology.label`; a task's
      coding is on its component in the parent plan, never on the task
      definition; monitoring tasks, therapy actions, concept-bearing data items
      and ordered tests are coded.
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
      iteration) exits 0 with no FAIL; review its WARNs (missing coding, a
      citation without its own quote, an over-long quote).
- [ ] **Coding-patch freeze (coding-only runs):** the same command with
      `--baseline <snapshot> --coding-patch` exits 0: the action set, names,
      captions, descriptions, procedures, preconditions, Decision candidates,
      data items, `goal.noun_phrase`, `ServiceRequest.*` and `source`/`quote` strings
      equal the snapshot, and the only metaprops keys that differ are
      `ontology.coding` and `ontology.label` (on components, data items and
      candidates, and their removal from task definitions).

This skill ends at a clean, self-verified `.pf`. Step 7 (the blocking
`cig-monitoring-review` gate and `cq-verification`) is run separately by the
review subagents and re-runs the full check set; do not mark the build done
until that gate passes with zero FAILs.
