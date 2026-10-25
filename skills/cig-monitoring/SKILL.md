---
name: cig-monitoring
description: Build a PROforma computer-interpretable guideline (CIG) as a `.pf` file for a clinical guideline, focusing on monitoring completion of therapy recommendations (Action Enactment goals) and monitoring desired/undesired effects of therapy (State Achievement goals). Use whenever the user wants to formalize a clinical guideline as a PROforma CIG, build a therapy + monitoring plan, model therapy recommendations/clinical goals/ADEs as PROforma plans, actions, enquiries, decisions and goals, or asks "turn this guideline into a CIG", "model monitoring for this therapy", "instantiate PROforma for X", "build a .pf for X". This is the primary workflow of this kit.
---

# CIG Monitoring Skill

Use this skill to build a **PROforma 1.9 guideline file** (`projects/<project_dir>/guideline/<name>.pf`) for a clinical guideline within a defined scope, authored and validated with the **proforma MCP tools** (capa ids `pf_<tool>`; CLI `npx -y proforma-mcp@0.2.0 <subcommand>`). It focuses on:

- **monitoring completion of therapy recommendations** — modeled as **Action Enactment Goals** (`goal.verb=order`), and
- **monitoring desired and undesired effects of therapy** — modeled as **State Achievement Goals** (`goal.verb=achieve` / `goal.verb=avoid`).

It encodes the domain know-how in `cig/know-how/README.md` (authored by Mor Peleg) and specializes the generic 7-step methodology in `WORKFLOW.md`. The full domain narrative with examples lives in `cig/know-how/README.md`; this file is the operational procedure.

## Inputs and shared reference area

All CIG reference material is shared across projects under `cig/`:

- `cig/examples/obesity-glp1-monitoring.pf` — the **authoritative** worked example (lint clean, passes the gate). Also `obesity-glp1-monitoring.mmd` (diagram) and `obesity-glp1-monitoring.cqs.mjs` (CQ queries).
- `cig/guidelines/` — the shared clinical guideline PDF library (e.g. AGA 2022, Canadian Adult Obesity CPG, Endocrine Society 2016, NICE Tirzepatide, semaglutide package insert, WHO). Read these as primary sources.
- `cig/know-how/README.md` — the domain know-how this skill operationalizes.
- The `proforma_reference` tool — the PROforma language reference. Read it before writing PROforma text or expressions.

Per-CIG working output goes under `projects/<project_dir>/`: `guideline/<name>.pf` (the CIG), `guideline/<name>.mmd`, `guideline/baseline/` (snapshots), `plans/PROPOSAL-<ts>.md`, `cqs/cq-queries.mjs`, `reviews/`, following `WORKFLOW.md`.

## PROforma model

| Concept | In the `.pf` | Tool |
|---|---|---|
| Plan / Action / Enquiry / Decision | `plan`, `action`, `enquiry`, `decision` task blocks | `add_task` (kind `plan\|action\|enquiry\|decision`) |
| Plan membership | `component :: 'X' ; task_definition :: 'X' ;` in the parent plan | created by `add_task` (component name = task name) |
| Sequence | `schedule_constraint :: completed('Earlier') ;` on the component | `add_task(after: ["Earlier"])` |
| Label, explanation, instruction of a task | native `caption`, `description`, `procedure` | `add_task(caption:)`, `set_attribute` |
| Goal of a task | metaprops keys `goal.verb` + `goal.noun_phrase` (optional `goal.evidence_grade`) | `set_attribute(attribute: "metaprops")` |
| Monitoring order | metaprops `order.code`, `order.timing`, `order.patient_instruction`, `order.performer_instruction` + native `procedure` | `set_attribute` |
| Source and verbatim passage | metaprops `source.N` + `quote.N` | `set_attribute(attribute: "metaprops")` |
| Clinical concept (Composer's Ontology coding) | metaprops `ontology.coding=SNOMED:<id>` + `ontology.label` | `snomed_search`, then `set_attribute` |
| Entry condition | `precondition :: <expression> ;` — executable | `add_task(precondition:)` or `set_attribute` |
| Data the Enquiry asks for | `data` block + `source` in the enquiry | `add_data_item`, `add_source` |
| Decision options and criteria | `candidate`, `argument :: for,<expression>`, `recommendation` | `add_candidate`, `add_argument` |
| Title / description of the CIG | `metadata` block (`title`, `desc`, `author`, `version`) | `create_guideline`, `set_metadata` |

There are no Goal objects: each task carries exactly one goal through its `goal.verb` / `goal.noun_phrase` metaprops keys. `goal.verb` is one of `diagnose, treat, prevent_primary, prevent_secondary, prevent, avoid, start, stop, order, achieve`. Names are PROforma identifiers (`[A-Za-z_][A-Za-z0-9_]*`, unique case-insensitively); the proposal's §6 fixes the canonical names and the build uses exactly those.

**Sequencing convention:** a component runs after a sibling when it has `schedule_constraint :: completed('<sibling>')` (from `add_task(after: [...])`). In the example the Decision runs after the Enquiry, the Therapy plan after the Decision, and the Monitoring plan after the Therapy plan. Parallel sub-plans share the same parent plan with no constraints between them.

**Expressions** (preconditions, argument conditions) are PROforma, not prose: `and`/`or` lower-case, `not(x)` for negation, `<>` for not-equal, `result_of(D) = C` for a single-choice decision, `result_set(D) includes C` for multiple. Type-check with `check_expression` against the file.

See `references/` for the design patterns, each with the `.pf` text from the example and the tool calls that create it:

- `references/TopLevelPlan.md`
- `references/Enquiry.md` — populate the eligibility/baseline data items (do not leave empty)
- `references/Decision.md` — populate candidates + criteria (do not leave empty)
- `references/TherapyPlan.md`
- `references/MonitoringPlan.md`
- `references/ActionComponent.md`
- `references/StateAchievementGoal.md`
- `references/ActionEnactmentGoal.md`
- `references/MetapropsSyntax.md` — the **canonical task contract** (native fields, the order, required metaprops, source quotes, ontology coding, controlled vocab, anti-placeholder value constraints)
- `references/MonitoringFrequency.md` — default-with-justification frequency lookup

## Procedure

Follow Mor's 6 steps, which map onto the `WORKFLOW.md` engine (Step 1→Step 1; Steps 2–3→Steps 2–3; Steps 4–6→Steps 4 & 6). Stay iterative and keep the user in the loop; draft and get approval (Step 4/5 of `WORKFLOW.md`) before formalizing.

### Step 1 — Define the scope of the CIG

State the population, condition, and therapy class (e.g. "obesity management in adults using GLP-1 analogs"). Capture this as the scope and competency questions per `WORKFLOW.md` Step 1.

### Step 2 — Locate the clinical guidelines

Use the PDFs the user has placed in `cig/guidelines/` as primary sources (no external links are required). Prefer guidelines that also cover indications, mechanism of action, related ADEs, and how to monitor for success and for risks. If coverage is thin, ask the user to add more PDFs to `cig/guidelines/`.

### Step 3 — Extract recommendations, goals, and monitoring

**If this is an iteration (WORKFLOW Step 0), start from the baseline.** Load the latest approved proposal + `semlocal --collection <project_dir>` recall and carry every previously-extracted therapy goal, Enquiry/Decision element, and monitoring action forward as a checklist. A newly added guideline extends and refines that set — it does not reset it. Extraction from the newest guideline is *added to* the baseline, not substituted for it.

**Coding-only iteration (SNOMED CT codes).** If the user asks only to add terminology codes to an existing CIG, this is **not** a new extraction and **not** a full re-emit. Freeze the baseline action set, task names, captions, descriptions, procedures, Decision candidates, `order.*` values, and `source`/`quote` strings. Add or update only `ontology.coding` and `ontology.label` (`MetapropsSyntax.md`, "Ontology coding"), with codes found by `snomed_search`. Do **not** fork or rename the project directory. Delegate emission to `cig-formalization` in **coding-patch mode** (snapshot the `.pf` to `guideline/baseline/`; do not delete it).

From the guideline collection extract, citing the source PDF and page/section for each finding and copying the **verbatim passage** (the sentence or clause, at most about 25 words) it comes from — that passage becomes the element's `quote.N`:

1. **Therapy recommendations.** If a recommendation is vague (e.g. "offer pharmacotherapy with health behaviour changes"), complete it from other guidelines in the collection or the web (e.g. "hypocaloric diet 500–600 kcal/d deficit; 150 min/week activity + 2×/week strengthening"). Mark completions as proposed and cite the source.
2. **Clinical goals of therapy** (e.g. 5–10% body-weight reduction; reduced cardiometabolic risk; QoL improvement). For goals that are **clinical abstractions** (e.g. "cardiometabolic risk"), define the abstraction from measurable raw components found in the guidelines (e.g. BP, lipid panel, blood glucose, A1C).
3. **Monitoring recommendations**, aligned to the goals. Classify each goal/state as **achieve-state** (desired, e.g. achieve reduced weight) or **avoid-state** (undesired, e.g. avoid muscle loss).
4. **Monitoring frequency.** Use the frequency stated in a guideline if present (e.g. "monthly for first 3 months, then every 3 months"). If absent, **propose** a frequency and present it to the user **with a justification and source**.
5. **Measurement method.** Capture how each item is measured (lab test, questionnaire — e.g. CoEQ for cravings, SF-36 / IWQOL-Lite for QoL, BIA scale for body composition, clinician interview). Recommend a measuring frequency where the guideline omits one.
6. **Recommendations without matching monitoring.** Where a recommendation has no monitoring instruction (e.g. diet and exercise), propose monitoring and justify it with sources.
7. **Side effects and ADEs** from the guidelines and drug package inserts (e.g. `cig/guidelines/semaglutide drug Info from Package.pdf`). **Enumerate the label systematically**: list every Boxed Warning and every numbered Warnings & Precautions section, and account for **each** one — either as a monitoring action or as an entry in the proposal's Excluded Candidates (§10) with a reason. Do not cherry-pick a subset. For each labeled ADE capture, faithfully (see the source-fidelity discipline below): (a) the **population/condition** the label attaches to it, (b) the label's **own monitoring instruction** if it states one, and (c) whether the label or guideline says routine monitoring is **not** recommended.
8. **Case reports — opt-in only.** Default sources are clinical guidelines and package inserts. **Do not** search for or build monitoring actions from case reports unless the user **explicitly** includes them in scope (or lists them in the approved proposal). If they are in scope, summarize each for the user with a monitoring suggestion, frequency, and monitoring mode, and apply the source-quality rule in `references/ActionEnactmentGoal.md`. Never treat a skill example as an action that must appear in the CIG.
9. **Unmentioned harms and benefits**, derived from the **mechanism of action**. Propose monitoring plans and note cost, danger, and prevalence. Example: GLP-1 appetite regulation is linked to reward circuits, so anhedonia/reduced enjoyment of life is a candidate harm — decide whether existing QoL questionnaires cover it or a short added instrument is needed, and at what frequency.

**Systematic coverage is not label-only.** The "enumerate and account for each" discipline in item 7 applies equally to **guideline recommendations, therapy goals, and narrative harms/benefits** — not just numbered package-insert sections. When a guideline's prose flags a harm or a therapy goal (e.g. ADA Rec 2.20 muscle loss and, alongside it, lower bone mineral density; nutritional/micronutrient adequacy; cardiometabolic benefit), each must surface as a therapy goal, a desired/undesired monitor, **or** an explicit §10 Excluded Candidate — never dropped by omission. Cover the whole guideline library, not only the newest or most detailed source.

**Source-fidelity discipline (mandatory — the content must match what the cited source actually says).** Generating a populated, well-cited monitoring action is not enough; the action must be *faithful* to the source. For every monitored item record:

- **Applicability condition** → `applies_when`. If the source qualifies the harm to a sub-population (the label flags **hypoglycemia** only with *concomitant insulin or an insulin secretagogue*; **diabetic retinopathy** only in *type 2 diabetes*), the action must carry that condition and an **executable** `precondition` over a data item the eligibility/baseline Enquiry asks for (e.g. `on_insulin_or_secretagogue = true`) — **never** model a conditional ADE as universal, and never write the precondition as a sentence. Use `all_patients_on_therapy` only when the source truly applies it to everyone.
- **Monitoring stance, including negatives** → `monitoring_stance`. If a source states routine monitoring of X is of uncertain value / not recommended (e.g. routine serum calcitonin or thyroid ultrasound for medullary-thyroid C-cell risk), do **not** invent a routine surveillance schedule — set `monitoring_stance=routine_not_recommended` and scope to symptom-triggered, or omit the action. The kit's bias toward "always propose monitoring + a frequency" does **not** override a source that says don't.
- **The source's own monitoring instruction beats incidence data.** When a labeled warning states *how* to monitor (e.g. §5.9 "Monitor heart rate at regular intervals; discontinue if a sustained increase occurs"), that instruction is the authoritative monitoring directive — treat it as `guideline_status=specified_as_a_guideline_monitoring_task` / `monitoring_stance=recommended`. Do not down-rank or relegate a label-mandated monitor to an open question because the mean effect size looks small.

Each of these is checked by the `cig-monitoring-review` gate (Step 7): the deterministic part in `scripts/check_cig.mjs`, the rest in the reviewer's source-fidelity phase.

**Persist the extraction — non-optional.** After each of Steps 2, 3, 5, and 6, store a summary via `semlocal write … --collection <project_dir>` (therapy goals incl. `avoid`/`treat`, Enquiry data items and Decision candidates, and the monitoring action set with canonical PROforma names). This is what makes the next run's Step 0 baseline recall possible; skipping it forces the next run to re-derive from scratch and is the root cause of run-to-run regressions. On any iteration, `semlocal search … --collection <project_dir>` **before** extracting.

### Step 4 — Formalize the top-level structure (after draft approval)

Use the PROforma design patterns. Build a **Top-Level Plan** (the root plan from `create_guideline`) with four components **in sequence** (via `after`):

1. an **Enquiry** task for eligibility data retrieval (`Get_Eligibility_Data`),
2. a **Decision** task for eligibility with candidates and arguments (`Eligibility_Decision`, after the Enquiry),
3. a **Therapy Plan** (sub-plan) for therapy recommendations, after the Decision and gated by `precondition :: result_of(Eligibility_Decision) = Eligible`,
4. a **Monitoring Plan** (sub-plan, `Monitoring_Plan`), after the Therapy Plan.

The **Monitoring Plan** is composed of parallel sub-plans: **Monitor Actions**, **Monitor Desired Outcome States**, **Monitor Undesired ADEs** (`Monitor_Actions`, `Monitor_Desired_State`, `Monitor_Undesired_State` in the example). See `references/TopLevelPlan.md` and `references/MonitoringPlan.md`.

**The proposal fixes the build.** Besides its sections (§6 task table with canonical names, kind, parent plan, `after`, goal verb, precondition, `monitoring_stance`), the approved proposal MUST contain a fenced ```` ```cig-actions ```` block listing every Action name (therapy + monitoring), one per line; `check_cig.mjs --proposal` compares the built action set to it. On iterations, a ```` ```cig-excluded ```` block names baseline elements intentionally removed, each also explained in §10.

**Scope the design pattern to the request (mandatory).** The four-component top-level plan above is the shape of a *full* CIG. Before formalizing, **confirm the requested scope and hierarchy with the user** and build **only** the sub-structure they asked for:

- If the user asks for **ADE monitoring only**, build just the Monitor Undesired ADEs structure (one populated monitoring plan as the root), with real actions. Do **not** emit the full Top-Level Plan with empty Enquiry/Decision/Therapy/Monitor-Actions/Monitor-Desired placeholders.
- **Never emit empty placeholder components** — a task with no `goal.verb`/metaprops, an Enquiry with no sources, a Decision with no candidates or arguments, or a plan with no components. Every task you create must be populated (this was a concrete failure Mor flagged: an ADE-only request produced the full plan with three empty stubs and a misplaced Monitor-Desired-State).
- If a level of the hierarchy is genuinely needed only to host the requested sub-structure, create it **and populate it** — otherwise omit it. When in doubt about scope, ask before formalizing.

The `cig-monitoring-review` gate (Step 7) flags empty plans, unreachable tasks, and unpopulated Enquiry/Decision as failures.

### Step 5 — Therapy interventions: Actions + State Achievement Goals

For **each therapy intervention**, `add_task` an `action` in the **Therapy Plan** (this creates the task and its component) with a `caption`, a `description` (the recommendation and why it was modelled, with its citations) and a `procedure` when there is something concrete to do (dose and titration, minutes of activity, grams of protein). Set its metaprops to a **State Achievement Goal** — `goal.verb=achieve` or `goal.verb=avoid` plus `goal.noun_phrase` — with at least one `source.N` + verbatim `quote.N` pair, and add the Ontology coding of the procedure or substance in the coding pass.

- Example (achieve): `Prescribe_GLP1` → `goal.verb=achieve`, `goal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months`.
- Example (avoid): `Prescribe_Resistance_Exercise` → `goal.verb=avoid`, `goal.noun_phrase=muscle / lean-mass loss (sarcopenia) during rapid weight loss`.

**Keep both goal polarities and their traceability (mandatory).** A therapy plan almost always needs **both** `achieve` and `avoid` State Achievement Goals — do not collapse it into `achieve`-only actions. Whenever a guideline recommends preventing/minimizing a harm of therapy (e.g. ADA Rec 2.20: adequate protein + muscle-strengthening to minimize muscle loss), model the dedicated therapy action with a `goal.verb=avoid` goal (e.g. `Prescribe_Resistance_Exercise` → `avoid` lean-mass loss); do not silently fold it into a lifestyle `achieve` action or demote it to a monitor-only concern. Every desired/undesired **monitor's** `monitored_target` must name the therapy task it traces to — if you keep a monitor (e.g. lean-mass/body-composition) you must keep the goal it traces to. On an iteration, an `avoid` goal or `treat` top-plan goal present in the baseline may not disappear (WORKFLOW Step 0 / Step 4 check 7).

See `references/ActionComponent.md` and `references/StateAchievementGoal.md`.

### Step 6 — Monitoring Actions + Action Enactment Goals

For each therapy goal and each desired/undesired outcome from Step 5, `add_task` a monitoring `action` inside the appropriate Monitoring sub-plan. Give it an **Action Enactment Goal** (`goal.verb=order`) and the order it enacts.

- **The order** is held three ways that must agree: the metaprops `order.code` (what is measured or done), `order.timing` (a real cadence or trigger), `order.patient_instruction` and — for triggered labs / urgent steps — `order.performer_instruction`; the plain-language `goal.noun_phrase` `<order.code>, <order.timing>`; and the native `procedure` `<order.code>, <order.timing>. Patient: <...>. Clinician: <...>.` Example: `order.code=body weight measurement and percent change from baseline`, `order.timing=baseline, monthly x3, then q3mo`, `order.patient_instruction=weigh under standardized conditions (morning, after voiding, light clothing)`, `goal.noun_phrase=body weight measurement and percent change from baseline, baseline, monthly x3, then q3mo`. There are no FHIR `ServiceRequest.*` keys any more; an older guideline is converted with `node scripts/migrate_metaprops.mjs <guideline.pf>`.
- **Native fields:** a one-line `caption`, a `description` stating what is monitored and why it was modelled (`Monitors <monitored_target>. <literature_basis>.`), the `procedure` above, and a `precondition` for a sub-population.
- **Every monitoring action carries the full metaprops** per the **canonical contract in `references/MetapropsSyntax.md`**: Java-properties text, one `key=value` per line, set in **one** `set_attribute(selector: "<action>", attribute: "metaprops", value: "<all lines>")` call. It holds the goal keys, the `order.*` keys, **and** provenance and operationalization: `category`, `monitored_target` (names the therapy task it traces to), `applies_when` (the population/condition the source attaches — not universal if the source qualifies it), `provenance_type`, `source_kind`, `source` / `source.1..n` (cite each) with `quote` / `quote.1..n` (the verbatim passage of each, prefixed with page/section), `knowledge_origin`, `guideline_status`, `monitoring_stance` (incl. `routine_not_recommended` when a source advises against routine surveillance), `literature_basis`, `assistant_invention` (separate self-designed from sourced; `none` if fully sourced), `instrument`, `monitoring_frequency_basis`, `trigger`, `cq`. This is **required**, not optional. Gate a sub-population action with an executable `precondition` as well (see `MetapropsSyntax.md`).
- **No placeholder values** (`source=s`, `instrument=i`, `provenance_type=p`). Use real citations and real content — the gate rejects placeholders. Quotes are copied exactly from the source document, never paraphrased. Keep each value on one line; let the tool and `format` handle escaping. Never write a second metaprops: to change one key, read the current map (`get_component` or `export_json`), change it, and write the whole map back.
- **Ontology coding** (coding pass): `ontology.coding=SNOMED:<id>` + `ontology.label` for the disorder, finding or measurement procedure the action watches, chosen with `snomed_search` and recorded exactly as returned.

See `references/MetapropsSyntax.md` for the canonical contract and its worked value, and `references/ActionEnactmentGoal.md` for the goal/metaprops pattern. The worked labeled ADE is acute pancreatitis monitoring from the package insert.

## Formalization mechanics

Step 6 (emitting the `.pf`) is owned by the dedicated `cig-formalization` skill. **Delegate Step 6 to the `cig-formalizer` subagent** (skill `cig-formalization`); give it the project directory, the approved proposal path, the output path `projects/<project_dir>/guideline/<name>.pf`, and whether this is a full re-emit or a coding patch.

- **Full re-emit** (new CIG, or an approved proposal whose action set changed): snapshot the existing `.pf` to `guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf`, delete it, `create_guideline`, then build exactly the approved task set in a fresh file — never append to a prior run — and finish with the coding pass (`snomed_search`). Then `format`, `lint` (0 errors), `to_mermaid` → `guideline/<name>.mmd`.
- **Coding patch** (coding-only request): snapshot, then only add/replace `ontology.coding` and `ontology.label` (via `snomed_search`) on existing actions and data items. Nothing else may change.

This skill's job is the **WHAT to model** (Steps 1–6 above fix the action set, canonical names, goals, preconditions, stances, and metaprops content in the approved proposal). The proposal is the single source of truth the formalizer transcribes; do not re-specify the emit mechanics here. All edits go through the proforma tools — never edit the `.pf` by hand (each tool edit re-parses and refuses to save a broken file). The canonical metaprops contract remains defined in `references/MetapropsSyntax.md`.

**Step 7 gates (blocking).** After the formalizer emits the guideline, run both gates; the CIG passes only with zero FAILs across the full set, and a re-check re-runs everything:

1. **`cig-monitoring-review`** (ideally as a subagent), which runs the deterministic gate
   `node scripts/check_cig.mjs projects/<p>/guideline/<name>.pf --proposal projects/<p>/plans/PROPOSAL-<ts>.md [--baseline projects/<p>/guideline/baseline/<newest>.pf] [--coding-patch] --report projects/<p>/reviews/cig-monitoring-review-<ts>.md`
   and then adds the judgment phases (case-report harm, source fidelity, label coverage, `monitored_target` semantics) to the same report. Unlike a presence-only key check — which is **gameable** (placeholder values like `source=s` pass it) — this gate inspects the **values**: it rejects placeholders and leftover `ServiceRequest.*` keys, requires real citations each with a verbatim quote, requires `caption`, `description` and a `procedure` and `goal.noun_phrase` that state `order.code` and `order.timing`, checks the `ontology.coding` format, checks that `monitored_target` names a task, requires an executable precondition on an Enquiry data item for sub-population actions, flags empty plans and unpopulated Enquiry/Decision, compares the action set to `cig-actions`, **fails case-report actions that are not explicitly in the approved proposal scope**, flags baseline regressions not listed in `cig-excluded`, and on coding-only runs **fails if anything other than `ontology.coding` / `ontology.label` changed** (names, captions, descriptions, procedures, Decision candidates, `order.*`, source or quote strings).
2. **`cq-verification`**: `node scripts/run_cqs.mjs projects/<p>/guideline/<name>.pf projects/<p>/cqs/cq-queries.mjs --proposal <PROPOSAL> --report projects/<p>/reviews/cq-verification-<ts>.md`. Every CQ in the proposal needs a query; queries are plain JS over the `export_json` model (see `cig/examples/obesity-glp1-monitoring.cqs.mjs`).

Do **not** report the CIG as done while either gate reports any FAIL. While building, `lint` after each batch of edits and `check_expression` for each precondition and argument condition are cheap pre-checks; they do not replace the gates.

## Worked reference

`cig/examples/obesity-glp1-monitoring.pf` is the **authoritative** instantiation to imitate: a root plan `Obesity_GLP1_Plan` (`goal.verb=treat`); a **populated** Enquiry `Get_Eligibility_Data` (typed data items such as `BMI` (real, kg/m2), `weight_related_comorbidity` and `on_insulin_or_secretagogue` (boolean), each with a `source` and its Ontology coding) and Decision `Eligibility_Decision` (`Eligible` / `Not_Eligible`, each with an argument over those data items whose caption holds the rationale and whose metaprops hold the `source` + `quote`); a Therapy Plan `Obesity_Therapy` gated by `result_of(Eligibility_Decision) = Eligible`, holding `Prescribe_GLP1` / `Prescribe_Lifestyle` / `Prescribe_Resistance_Exercise` with State Achievement goals (`achieve`/`avoid`), descriptions, procedures and quoted sources; and a `Monitoring_Plan` whose three parallel sub-plans hold the monitoring actions — each with `goal.verb=order`, the order in `order.*`, `procedure` and `goal.noun_phrase`, a description, quoted sources, SNOMED CT coding, and the full metaprops including `applies_when` + `monitoring_stance`. Imitate labeled / guideline ADEs (`Monitor_GI_ADE`, `Monitor_Pancreatitis`, `Monitor_Anhedonia`) and `Monitor_Hypoglycemia` (conditional `applies_when` + `precondition :: on_insulin_or_secretagogue = true`). Its CQ queries are in `cig/examples/obesity-glp1-monitoring.cqs.mjs`. Do **not** add case-report-only actions just because an older example had them.
