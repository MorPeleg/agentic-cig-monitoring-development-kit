---
name: cig-monitoring
description: Instantiate the PROforma computer-interpretable guideline (CIG) ontology for a clinical guideline, focusing on monitoring completion of therapy recommendations (Action Enactment goals) and monitoring desired/undesired effects of therapy (State Achievement goals). Use whenever the user wants to formalize a clinical guideline as a PROforma CIG, build a therapy + monitoring plan, model therapy recommendations/clinical goals/ADEs as PROforma Plans, Actions, Components and Goals, or asks "turn this guideline into a CIG", "model monitoring for this therapy", "instantiate PROforma for X". This is the primary workflow of this kit.
---

# CIG Monitoring Skill

Use this skill to instantiate the **PROforma CIG OWL ontology** (`cig/proforma.owl`) for a clinical guideline within a defined scope, focusing on:

- **monitoring completion of therapy recommendations** — modeled as **Action Enactment Goals** (`verb = order`), and
- **monitoring desired and undesired effects of therapy** — modeled as **State Achievement Goals** (`verb = achieve` / `verb = avoid`).

It encodes the domain know-how in `cig/know-how/SKILL.md` (authored by Mor Peleg) and specializes the generic 7-step methodology in `WORKFLOW.md`. The full domain narrative with examples lives in `cig/know-how/SKILL.md`; this file is the operational procedure.

## Inputs and shared reference area

All CIG reference material is shared across projects under `cig/`:

- `cig/proforma.owl` — the PROforma CIG meta-ontology to instantiate/import (do not edit it).
- `cig/examples/obesity-glp1.owl` — a worked obesity/GLP-1 example to imitate.
- `cig/guidelines/` — the shared clinical guideline PDF library (e.g. AGA 2022, Canadian Adult Obesity CPG, Endocrine Society 2016, NICE Tirzepatide, semaglutide package insert, WHO). Read these as primary sources.
- `cig/know-how/SKILL.md` — the domain know-how this skill operationalizes.

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
- `references/TherapyPlan.md`
- `references/MonitoringPlan.md`
- `references/ActionComponent.md`
- `references/StateAchievementGoal.md`
- `references/ActionEnactmentGoal.md`

## Procedure

Follow Mor's 6 steps, which map onto the `WORKFLOW.md` engine (Step 1→Step 1; Steps 2–3→Steps 2–3; Steps 4–6→Steps 4 & 6). Stay iterative and keep the user in the loop; draft and get approval (Step 4/5 of `WORKFLOW.md`) before formalizing.

### Step 1 — Define the scope of the CIG

State the population, condition, and therapy class (e.g. "obesity management in adults using GLP-1 analogs"). Capture this as the scope and competency questions per `WORKFLOW.md` Step 1.

### Step 2 — Locate the clinical guidelines

Use the PDFs the user has placed in `cig/guidelines/` as primary sources (no external links are required). Prefer guidelines that also cover indications, mechanism of action, related ADEs, and how to monitor for success and for risks. If coverage is thin, ask the user to add more PDFs to `cig/guidelines/`.

### Step 3 — Extract recommendations, goals, and monitoring

From the guideline collection extract, citing the source PDF and page/section for each finding:

1. **Therapy recommendations.** If a recommendation is vague (e.g. "offer pharmacotherapy with health behaviour changes"), complete it from other guidelines in the collection or the web (e.g. "hypocaloric diet 500–600 kcal/d deficit; 150 min/week activity + 2×/week strengthening"). Mark completions as proposed and cite the source.
2. **Clinical goals of therapy** (e.g. 5–10% body-weight reduction; reduced cardiometabolic risk; QoL improvement). For goals that are **clinical abstractions** (e.g. "cardiometabolic risk"), define the abstraction from measurable raw components found in the guidelines (e.g. BP, lipid panel, blood glucose, A1C).
3. **Monitoring recommendations**, aligned to the goals. Classify each goal/state as **achieve-state** (desired, e.g. achieve reduced weight) or **avoid-state** (undesired, e.g. avoid muscle loss).
4. **Monitoring frequency.** Use the frequency stated in a guideline if present (e.g. "monthly for first 3 months, then every 3 months"). If absent, **propose** a frequency and present it to the user **with a justification and source**.
5. **Measurement method.** Capture how each item is measured (lab test, questionnaire — e.g. CoEQ for cravings, SF-36 / IWQOL-Lite for QoL, BIA scale for body composition, clinician interview). Recommend a measuring frequency where the guideline omits one.
6. **Recommendations without matching monitoring.** Where a recommendation has no monitoring instruction (e.g. diet and exercise), propose monitoring and justify it with sources.
7. **Side effects and ADEs** from the guidelines and drug package inserts (e.g. `cig/guidelines/semaglutide drug Info from Package.pdf`). Add a monitoring action for each.
8. **Case reports** of rare undesired effects from the literature. Summarize each for the user with a monitoring suggestion, a frequency, and the monitoring mode (lab test vs. clinician asking about symptoms). Example: GLP-1 → extreme vomiting/weight loss → Wernicke encephalopathy (confusion, ataxia, ophthalmoplegia).
9. **Unmentioned harms and benefits**, derived from the **mechanism of action**. Propose monitoring plans and note cost, danger, and prevalence. Example: GLP-1 appetite regulation is linked to reward circuits, so anhedonia/reduced enjoyment of life is a candidate harm — decide whether existing QoL questionnaires cover it or a short added instrument is needed, and at what frequency.

Store extraction summaries via `semlocal --collection <project_dir>` per `WORKFLOW.md`.

### Step 4 — Formalize the top-level structure (after draft approval)

Instantiate the PROforma design patterns. Build a **Top-Level Plan** (`Plan` individual) with four components **in sequence** (via `scheduled_constraints`/`conref`):

1. an **Enquiry** task for eligibility data retrieval,
2. a **Decision** task for eligibility (with `Candidate` options),
3. a **Therapy Plan** (sub-`Plan`) for therapy recommendations, gated by a `precondition` such as `result_of(<decision>) = Eligible`,
4. a **Monitoring Plan** (sub-`Plan`).

The **Monitoring Plan** is composed of parallel sub-`Plan`s: **Monitor Actions**, **Monitor Desired Outcome States**, **Monitor Undesired ADEs**. See `references/TopLevelPlan.md` and `references/MonitoringPlan.md`.

### Step 5 — Therapy interventions: Actions + Components + State Achievement Goals

For **each therapy intervention**, create an `Action` and a matching `Component` (with `taskref` to the action) and add the component to the **Therapy Plan** via `components`. Give the action a `goal` that is a **State Achievement Goal**: `verb = achieve` or `verb = avoid` plus a `noun_phrase`.

- Example (achieve): action `Prescribe_GLP1` → goal `verb=achieve`, `noun_phrase="body-weight reduction of 5-10 percent"`.
- Example (avoid): action `Prescribe_physical_exercise` → goal `verb=avoid`, `noun_phrase="muscle loss"` (150 min/week activity + 2×/week strengthening).

See `references/ActionComponent.md` and `references/StateAchievementGoal.md`.

### Step 6 — Monitoring Actions + Action Enactment Goals

For each therapy goal and each desired/undesired outcome from Step 5, create a monitoring `Action` (+ `Component`) inside the appropriate Monitoring sub-plan. Give each monitoring action a `goal` that is an **Action Enactment Goal**: `verb = order` plus a `noun_phrase` referencing an HL7 FHIR `ServiceRequest`.

- Example: `verb=order`, `noun_phrase="ServiceRequest.code = body weight measurement via BIA scale"`.
- Encode frequency and instructions in the `noun_phrase` using FHIR fields where useful, e.g. `ServiceRequest.occurrenceTiming = monthly x3 then q3mo`, `ServiceRequest.patientInstruction = use home BIA scale under standardized conditions`.

See `references/ActionEnactmentGoal.md`.

## Formalization mechanics

Do all OWL editing through the **ontology-editor** tools (never by hand), per `WORKFLOW.md` Step 6:

1. Read `skills/ontology-editor/SKILL.md`, then `setup_tools(skills: ["ontology-editor"])`.
2. Create the project ontology at `projects/<project_dir>/ontology/<name>.owl`; `set_ontology_iri` to a full IRI; `add_prefix` for the PROforma namespace `http://www.owl-ontologies.com/Ontology1779030093.owl#` and the project namespace.
3. Reuse PROforma classes/properties by IRI (do not redeclare them). The instantiation is an **ABox**: `Plan`, `Component`, `Action`, `Decision`, `Enquiry`, `Goal`, `Candidate`, `Schedule_Constraint` individuals connected by `components`, `taskref`, `goal`, `scheduled_constraints`, `conref`, `precondition`, `candidates`, with `verb` and `noun_phrase` data assertions on goals.
4. Verify with `find_axioms`/`get_all_axioms` (`include_labels: true`).

Then run the **Step 7 automated review** from `WORKFLOW.md` (pitfall scan with `test_pitfalls`, quality evaluation with `test_quality`, and CQ verification via the `cq-verification` skill). For CQ verification, pass `cig/proforma.owl` alongside the project ontology to `sparql_query` so the PROforma schema is present in the queried graph.

## Worked reference

`cig/examples/obesity-glp1.owl` is a complete, small instantiation showing the Top-Level Plan, Enquiry, Decision (Eligible/Not_Eligible), Therapy Plan with `Prescribe_GLP1` (achieve goal), Monitoring Plan (Monitor_Actions / Monitor_Desired_State / Monitor_Undesired_State), and a `Monitor_Weight` action with a FHIR ServiceRequest goal. Mirror its structure and naming.
