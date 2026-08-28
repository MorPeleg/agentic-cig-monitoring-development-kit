---
name: cig-monitoring
description: Instantiate the PROforma computer-interpretable guideline (CIG) ontology for a clinical guideline, focusing on monitoring completion of therapy recommendations (Action Enactment goals) and monitoring desired/undesired effects of therapy (State Achievement goals). Use whenever the user wants to formalize a clinical guideline as a PROforma CIG, build a therapy + monitoring plan, model therapy recommendations/clinical goals/ADEs as PROforma Plans, Actions, Components and Goals, or asks "turn this guideline into a CIG", "model monitoring for this therapy", "instantiate PROforma for X". This is the primary workflow of this kit.
---

# CIG Monitoring Skill

Use this skill to instantiate the **PROforma CIG OWL ontology** (`cig/proforma.owl`) for a clinical guideline within a defined scope, focusing on:

- **monitoring completion of therapy recommendations** — modeled as **Action Enactment Goals** (`verb = order`), and
- **monitoring desired and undesired effects of therapy** — modeled as **State Achievement Goals** (`verb = achieve` / `verb = avoid`).

It encodes the domain know-how in `cig/know-how/README.md` (authored by Mor Peleg) and specializes the generic 7-step methodology in `WORKFLOW.md`. The full domain narrative with examples lives in `cig/know-how/README.md`; this file is the operational procedure.

## Inputs and shared reference area

All CIG reference material is shared across projects under `cig/`:

- `cig/proforma.owl` — the PROforma CIG meta-ontology to instantiate/import (do not edit it).
- `cig/examples/obesity-glp1.owl` — a worked obesity/GLP-1 example to imitate.
- `cig/guidelines/` — the shared clinical guideline PDF library (e.g. AGA 2022, Canadian Adult Obesity CPG, Endocrine Society 2016, NICE Tirzepatide, semaglutide package insert, WHO). Read these as primary sources.
- `cig/know-how/README.md` — the domain know-how this skill operationalizes.

Per-CIG working output goes under `projects/<project_dir>/` (ontology, plans, queries), following `WORKFLOW.md`.

## PROforma model (from `cig/proforma.owl`)

Classes (all under `PROforma_Entity`):

- `Task` with subclasses `Plan`, `Action`, `Decision`, `Enquiry`
- `Component`, `Goal`, `Candidate`, `Argument`, `Source`, `Schedule_Constraint`, `Parameter`, `Param_value`, `Data`, `PROforma_Condition`

Key properties:

| Property | Domain → Range | Use |
|----------|----------------|-----|
| `components` | `Plan` → `Component` | A plan's parts |
| `taskref` (functional) | `Component` → `Task` | The task a component points to |
| `goal` (functional) | `Task` → `Goal` | The goal of a task |
| `scheduled_constraints` | `Component` → `Schedule_Constraint` | Ordering constraints |
| `conref` (functional) | `Schedule_Constraint` → `Task` | "this component runs after <task>" (sequence) |
| `precondition` (functional) | `Task` → `PROforma_Condition` | Entry condition |
| `candidates` | `Decision` → `Candidate` | Decision options |

`Goal` data properties: `verb` (one of `diagnose, treat, prevent_primary, prevent_secondary, prevent, avoid, start, stop, order, achieve`), `noun_phrase` (string), plus `ID`, `evidence_grade`, `lifestatus_cycle`, `description`.

**Sequencing convention:** PROforma has no explicit "next" property. Sequence is expressed by giving a `Component` a `Schedule_Constraint` whose `conref` points to the task that must precede it (see the example: the Decision component's constraint conref → the Enquiry; the Therapy component's constraint conref → the Decision; the Monitoring component's constraint conref → the Therapy plan). Parallel sub-plans simply share the same parent plan with no constraints between them.

See `references/` for the design patterns, each with the exact classes/properties and an OWL functional-syntax skeleton:

- `references/TopLevelPlan.md`
- `references/Enquiry.md` — populate the eligibility/baseline data items (do not leave empty)
- `references/Decision.md` — populate candidates + criteria (do not leave empty)
- `references/TherapyPlan.md`
- `references/MonitoringPlan.md`
- `references/ActionComponent.md`
- `references/StateAchievementGoal.md`
- `references/ActionEnactmentGoal.md`
- `references/MetapropsSyntax.md` — the **canonical `pf:metaprops` grammar** (ordered keys, controlled vocab, anti-placeholder value constraints)
- `references/MonitoringFrequency.md` — default-with-justification frequency lookup

## Procedure

Follow Mor's 6 steps, which map onto the `WORKFLOW.md` engine (Step 1→Step 1; Steps 2–3→Steps 2–3; Steps 4–6→Steps 4 & 6). Stay iterative and keep the user in the loop; draft and get approval (Step 4/5 of `WORKFLOW.md`) before formalizing.

### Step 1 — Define the scope of the CIG

State the population, condition, and therapy class (e.g. "obesity management in adults using GLP-1 analogs"). Capture this as the scope and competency questions per `WORKFLOW.md` Step 1.

### Step 2 — Locate the clinical guidelines

Use the PDFs the user has placed in `cig/guidelines/` as primary sources (no external links are required). Prefer guidelines that also cover indications, mechanism of action, related ADEs, and how to monitor for success and for risks. If coverage is thin, ask the user to add more PDFs to `cig/guidelines/`.

### Step 3 — Extract recommendations, goals, and monitoring

**If this is an iteration (WORKFLOW Step 0), start from the baseline.** Load the latest approved proposal + `semlocal --collection <project_dir>` recall and carry every previously-extracted therapy goal, Enquiry/Decision element, and monitoring action forward as a checklist. A newly added guideline extends and refines that set — it does not reset it. Extraction from the newest guideline is *added to* the baseline, not substituted for it.

**Coding-only iteration (SNOMED / OMOP / LOINC / finding codes).** If the user asks only to add terminology codes to an existing CIG, this is **not** a new extraction and **not** a full re-emit. Freeze the baseline action set, IRIs, captions, Decision candidates, `occurrenceTiming`, and `source=` strings. Add or update only the typed coding keys in `MetapropsSyntax.md` (`ServiceRequest.supportingInfo.findingCodes`, `labCodes`, `conditionCodes`, `medicationCodes`). Do **not** fork or rename the project directory. Delegate emission to `cig-formalization` in **coding-patch mode** (do not delete the OWL).

From the guideline collection extract, citing the source PDF and page/section for each finding:

1. **Therapy recommendations.** If a recommendation is vague (e.g. "offer pharmacotherapy with health behaviour changes"), complete it from other guidelines in the collection or the web (e.g. "hypocaloric diet 500–600 kcal/d deficit; 150 min/week activity + 2×/week strengthening"). Mark completions as proposed and cite the source.
2. **Clinical goals of therapy** (e.g. 5–10% body-weight reduction; reduced cardiometabolic risk; QoL improvement). For goals that are **clinical abstractions** (e.g. "cardiometabolic risk"), define the abstraction from measurable raw components found in the guidelines (e.g. BP, lipid panel, blood glucose, A1C).
3. **Monitoring recommendations**, aligned to the goals. Classify each goal/state as **achieve-state** (desired, e.g. achieve reduced weight) or **avoid-state** (undesired, e.g. avoid muscle loss).
4. **Monitoring frequency.** Use the frequency stated in a guideline if present (e.g. "monthly for first 3 months, then every 3 months"). If absent, **propose** a frequency and present it to the user **with a justification and source**.
5. **Measurement method.** Capture how each item is measured (lab test, questionnaire — e.g. CoEQ for cravings, SF-36 / IWQOL-Lite for QoL, BIA scale for body composition, clinician interview). Recommend a measuring frequency where the guideline omits one.
6. **Recommendations without matching monitoring.** Where a recommendation has no monitoring instruction (e.g. diet and exercise), propose monitoring and justify it with sources.
7. **Side effects and ADEs** from the guidelines and drug package inserts (e.g. `cig/guidelines/semaglutide drug Info from Package.pdf`). **Enumerate the label systematically**: list every Boxed Warning and every numbered Warnings & Precautions section, and account for **each** one — either as a monitoring action or as an entry in the proposal's Excluded Candidates (§10) with a reason. Do not cherry-pick a subset. For each labeled ADE capture, faithfully (see the source-fidelity discipline below): (a) the **population/condition** the label attaches to it, (b) the label's **own monitoring instruction** if it states one, and (c) whether the label or guideline says routine monitoring is **not** recommended.
8. **Case reports — opt-in only.** Default sources are clinical guidelines and package inserts. **Do not** search for or instantiate monitoring actions from case reports unless the user **explicitly** includes them in scope (or lists them in the approved proposal). If they are in scope, summarize each for the user with a monitoring suggestion, frequency, and monitoring mode, and apply the source-quality rule in `references/ActionEnactmentGoal.md`. Never treat a skill example as an action that must appear in the CIG.
9. **Unmentioned harms and benefits**, derived from the **mechanism of action**. Propose monitoring plans and note cost, danger, and prevalence. Example: GLP-1 appetite regulation is linked to reward circuits, so anhedonia/reduced enjoyment of life is a candidate harm — decide whether existing QoL questionnaires cover it or a short added instrument is needed, and at what frequency.

**Systematic coverage is not label-only.** The "enumerate and account for each" discipline in item 7 applies equally to **guideline recommendations, therapy goals, and narrative harms/benefits** — not just numbered package-insert sections. When a guideline's prose flags a harm or a therapy goal (e.g. ADA Rec 2.20 muscle loss and, alongside it, lower bone mineral density; nutritional/micronutrient adequacy; cardiometabolic benefit), each must surface as a therapy goal, a desired/undesired monitor, **or** an explicit §10 Excluded Candidate — never dropped by omission. Cover the whole guideline library, not only the newest or most detailed source.

**Source-fidelity discipline (mandatory — the content must match what the cited source actually says).** Generating a populated, well-cited monitoring action is not enough; the action must be *faithful* to the source. For every monitored item record:

- **Applicability condition** → `applies_when`. If the source qualifies the harm to a sub-population (the label flags **hypoglycemia** only with *concomitant insulin or an insulin secretagogue*; **diabetic retinopathy** only in *type 2 diabetes*), the action must carry that condition and a PROforma `precondition` — **never** model a conditional ADE as universal. Use `all_patients_on_therapy` only when the source truly applies it to everyone.
- **Monitoring stance, including negatives** → `monitoring_stance`. If a source states routine monitoring of X is of uncertain value / not recommended (e.g. routine serum calcitonin or thyroid ultrasound for medullary-thyroid C-cell risk), do **not** invent a routine surveillance schedule — set `monitoring_stance=routine_not_recommended` and scope to symptom-triggered, or omit the action. The kit's bias toward "always propose monitoring + a frequency" does **not** override a source that says don't.
- **The source's own monitoring instruction beats incidence data.** When a labeled warning states *how* to monitor (e.g. §5.9 "Monitor heart rate at regular intervals; discontinue if a sustained increase occurs"), that instruction is the authoritative monitoring directive — treat it as `guideline_status=specified_as_a_guideline_monitoring_task` / `monitoring_stance=recommended`. Do not down-rank or relegate a label-mandated monitor to an open question because the mean effect size looks small.

Each of these is checked by the `cig-monitoring-review` source-fidelity phase (Step 7).

**Persist the extraction — non-optional.** After each of Steps 2, 3, 5, and 6, store a summary via `semlocal write … --collection <project_dir>` (therapy goals incl. `avoid`/`treat`, Enquiry/Decision items, and the monitoring action set with canonical IRIs). This is what makes the next run's Step 0 baseline recall possible; skipping it forces the next run to re-derive from scratch and is the root cause of run-to-run regressions. On any iteration, `semlocal search … --collection <project_dir>` **before** extracting.

### Step 4 — Formalize the top-level structure (after draft approval)

Instantiate the PROforma design patterns. Build a **Top-Level Plan** (`Plan` individual) with four components **in sequence** (via `scheduled_constraints`/`conref`):

1. an **Enquiry** task for eligibility data retrieval,
2. a **Decision** task for eligibility (with `Candidate` options),
3. a **Therapy Plan** (sub-`Plan`) for therapy recommendations, gated by a `precondition` such as `result_of(<decision>) = Eligible`,
4. a **Monitoring Plan** (sub-`Plan`).

The **Monitoring Plan** is composed of parallel sub-`Plan`s: **Monitor Actions**, **Monitor Desired Outcome States**, **Monitor Undesired ADEs**. See `references/TopLevelPlan.md` and `references/MonitoringPlan.md`.

**Scope the design pattern to the request (mandatory).** The four-component top-level plan above is the shape of a *full* CIG. Before formalizing, **confirm the requested scope and hierarchy with the user** and build **only** the sub-structure they asked for:

- If the user asks for **ADE monitoring only**, build just the Monitor Undesired ADEs structure (at the correct level — e.g. as the relevant sub-plan), populated with real actions. Do **not** emit the full Top-Level Plan with empty Enquiry/Decision/Therapy/Monitor-Actions/Monitor-Desired placeholders.
- **Never emit empty placeholder components** — a `Component` whose task has no goal/metaprops, an Enquiry with no data items, a Decision with no candidates/criteria, or a sub-plan with no actions. Every individual you create must be populated (this was a concrete failure Mor flagged: an ADE-only request produced the full plan with three empty stubs and a misplaced Monitor-Desired-State).
- If a level of the hierarchy is genuinely needed only to host the requested sub-structure, create it **and populate it** — otherwise omit it. When in doubt about scope, ask before formalizing.

The `cig-monitoring-review` gate (Step 7) flags empty placeholder components and unpopulated Enquiry/Decision as failures.

### Step 5 — Therapy interventions: Actions + Components + State Achievement Goals

For **each therapy intervention**, create an `Action` and a matching `Component` (with `taskref` to the action) and add the component to the **Therapy Plan** via `components`. Give the action a `goal` that is a **State Achievement Goal**: `verb = achieve` or `verb = avoid` plus a `noun_phrase`.

- Example (achieve): action `Prescribe_GLP1` → goal `verb=achieve`, `noun_phrase="body-weight reduction of 5-10 percent"`.
- Example (avoid): action `Prescribe_physical_exercise` → goal `verb=avoid`, `noun_phrase="muscle loss"` (150 min/week activity + 2×/week strengthening).

**Keep both goal polarities and their traceability (mandatory).** A therapy plan almost always needs **both** `achieve` and `avoid` State Achievement Goals — do not collapse it into `achieve`-only actions. Whenever a guideline recommends preventing/minimizing a harm of therapy (e.g. ADA Rec 2.20: adequate protein + muscle-strengthening to minimize muscle loss), model the dedicated therapy action with a `verb=avoid` goal (e.g. `Prescribe_Resistance_Exercise` → `avoid` "lean-mass loss"); do not silently fold it into a lifestyle `achieve` action or demote it to a monitor-only concern. Every desired/undesired **monitor's** `monitored_target` must trace to an existing therapy goal — if you keep a monitor (e.g. lean-mass/body-composition) you must keep the goal it traces to. On an iteration, an `avoid` goal or `treat` top-plan goal present in the baseline may not disappear (WORKFLOW Step 0 / Step 4 check 7).

See `references/ActionComponent.md` and `references/StateAchievementGoal.md`.

### Step 6 — Monitoring Actions + Action Enactment Goals

For each therapy goal and each desired/undesired outcome from Step 5, create a monitoring `Action` (+ `Component`) inside the appropriate Monitoring sub-plan. Give each monitoring action a `goal` that is an **Action Enactment Goal**: `verb = order` plus a `noun_phrase` referencing an HL7 FHIR `ServiceRequest`.

- The `noun_phrase` must include **all** of `ServiceRequest.intent`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, and `ServiceRequest.patientInstruction` (add `ServiceRequest.performerInstruction` for triggered labs) — not just `code`. Example: `"ServiceRequest.intent = order; ServiceRequest.code = body weight via BIA scale; ServiceRequest.occurrenceTiming = baseline, monthly x3, then q3mo; ServiceRequest.patientInstruction = use home BIA scale under standardized conditions"`.
- **Assert `pf:metaprops` on every monitoring Action** following the **canonical grammar in `references/MetapropsSyntax.md`** (one `key=value; …` string). It must repeat the `ServiceRequest.*` fields **and** document provenance and operationalization: `category`, `monitored_target` (traceability to the harm/therapy goal), `applies_when` (the population/condition the source attaches — not universal if the source qualifies it), `provenance_type`, `source` (cite each), `knowledge_origin`, `guideline_status`, `monitoring_stance` (incl. `routine_not_recommended` when a source advises against routine surveillance), `literature_basis`, `assistant_invention` (separate self-designed from sourced; `none` if fully sourced), `instrument`, `monitoring_frequency_basis`, `trigger`, `cq`. This is **required**, not optional. Gate a sub-population action with a PROforma `precondition` as well (see `MetapropsSyntax.md`).
- **No placeholder values** (`source=s`, `instrument=i`, `provenance_type=p`). Use real citations and real content — the `cig-monitoring-review` gate (Step 7) rejects placeholders. Write the long `metaprops`/`noun_phrase` literals with the **structured assertion tool** (`add_data_property_assertion`) so they are escaped server-side and not truncated; if you use `add_axioms`, keep each literal single-line.
- Keep the `ServiceRequest.*` fields consistent between the Goal `noun_phrase` and the Action `metaprops`.

See `references/MetapropsSyntax.md` for the canonical contract (including typed SNOMED/OMOP coding keys) and `references/ActionEnactmentGoal.md` for the Goal/`metaprops` pattern. The worked labeled ADE is gallbladder / cholelithiasis monitoring from the package insert.

## Formalization mechanics

Step 6 (OWL emission) is owned by the dedicated `cig-formalization` skill. **Full re-emit** (new CIG or an approved proposal whose action set changed) is a regenerate-from-empty transcription. **Coding-only requests** use **coding-patch mode**: do not delete the OWL; add coding keys on existing Actions only. **Delegate Step 6 to the `cig-formalizer` subagent**, which loads `cig-formalization` + `ontology-editor`; give it the project directory, the approved proposal path, the ontology output path, and whether this is a full re-emit or a coding patch.

This skill's job is the **WHAT to model** (Steps 1–6 above fix the action set, IRIs, goals, preconditions, stances, and metaprops content in the approved proposal). The proposal is the single source of truth the formalizer transcribes; do not re-specify the emit mechanics here. All OWL editing goes through the **ontology-editor** tools — never edit OWL by hand. The canonical `pf:metaprops` grammar remains defined in `references/MetapropsSyntax.md`.

After the formalizer emits the ABox, run the **Step 7 automated review** from `WORKFLOW.md` (pitfall scan with `test_pitfalls`, quality evaluation with `test_quality`, and CQ verification via the `cq-verification` skill). For CQ verification, pass `cig/proforma.owl` alongside the project ontology to `sparql_query` so the PROforma schema is present in the queried graph.

**Mandatory metaprops value-quality gate (CIG-specific).** Run the **`cig-monitoring-review`** skill as a Step 7 gate (ideally as a subagent). Unlike a presence-only key check — which is **gameable** (placeholder values like `source=s` pass it) — this gate inspects the **values**: it rejects placeholders, requires real citations, requires the `ServiceRequest.*` block on **both** the Goal `noun_phrase` and the Action `metaprops`, checks `monitored_target` traceability, flags empty placeholder components and unpopulated Enquiry/Decision, **fails case-report actions that are not explicitly in the approved proposal scope**, and on coding-only runs **fails if IRIs, captions, Decision candidates, or provenance strings drifted**. It emits a readable pass/fail report under `projects/<project_dir>/reviews/`. Do **not** report the CIG as done while the gate reports any FAIL.

The presence-only query below is a useful **coarse pre-filter** (catches actions missing keys entirely) but is **not** sufficient on its own — the `cig-monitoring-review` gate is what confirms quality:

```sparql
PREFIX pf: <http://www.owl-ontologies.com/Ontology1779030093.owl#>
SELECT ?action ?metaprops WHERE {
  ?action a pf:Action ; pf:goal ?g .
  ?g pf:verb "order" .
  OPTIONAL { ?action pf:metaprops ?metaprops }
  FILTER( !BOUND(?metaprops)
    || !CONTAINS(?metaprops, "ServiceRequest.intent")
    || !CONTAINS(?metaprops, "ServiceRequest.occurrenceTiming")
    || !CONTAINS(?metaprops, "provenance_type")
    || !CONTAINS(?metaprops, "source=")
    || !CONTAINS(?metaprops, "instrument")
    || !CONTAINS(?metaprops, "monitoring_frequency_basis") )
}
```

## Worked reference

`cig/examples/obesity-glp1-monitoring.owl` is the **authoritative** instantiation to imitate: a Top-Level Plan; a **populated** Enquiry (eligibility/baseline data items via `sources`/`sref`) and Decision (Eligible/Not_Eligible with arguments + criteria); a Therapy Plan with `Prescribe_GLP1`/`Prescribe_Lifestyle`/`Prescribe_Resistance_Exercise` carrying State Achievement goals (`achieve`/`avoid`); and a Monitoring Plan whose three parallel sub-plans hold **ten** monitoring Actions — each with an Action Enactment Goal **and** a full `pf:metaprops` string carrying `applies_when` + `monitoring_stance`. Imitate labeled / guideline ADEs (`Monitor_GI_ADE`, `Monitor_Pancreatitis`, `Monitor_Anhedonia`) and `Monitor_Hypoglycemia` (conditional `applies_when` + `precondition`). Do **not** add case-report-only actions just because an older example had them. (The older `cig/examples/obesity-glp1.owl` predates the `metaprops` convention and is kept only as a frozen earlier example — do not imitate its monitoring stubs.)
