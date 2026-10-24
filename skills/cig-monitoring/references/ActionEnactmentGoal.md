# Design Pattern: Action Enactment Goal

**Intent:** The goal of a **monitoring** `action`. It expresses that some measurement/order should be *enacted*, with `goal.verb=order` plus a `goal.noun_phrase` that states an HL7 FHIR `ServiceRequest`. This is how the Monitoring Plan operationalizes monitoring of action completion and of desired/undesired states.

## PROforma elements

- Task: `action` (created with `add_task` in a Monitoring sub-plan; see `ActionComponent.md`)
- Goal: metaprops keys `goal.verb` and `goal.noun_phrase` on the action (no separate Goal object; one goal per task)
- `goal.verb` = **`order`** for Action Enactment Goals (the verb list also allows `start`/`stop`; prefer `order` for ServiceRequest-style monitoring orders). `check_cig.mjs` treats every action with `goal.verb=order` as a monitoring action.

## FHIR `ServiceRequest` (required fields)

Encode the order using FHIR `ServiceRequest` fields so the *what / intent / frequency / how* are always explicit. **Always include all of these** (do not stop at `code` + `patientInstruction`):

- `ServiceRequest.intent = order` — **required**.
- `ServiceRequest.code` — what is measured (e.g. body weight measurement; lipid panel; CoEQ questionnaire). **Required.**
- `ServiceRequest.occurrenceTiming` — frequency (e.g. `monthly x3 then q3mo`). **Required.** If the guideline omits frequency, propose one and justify it (record the justification in `monitoring_frequency_basis`, see below).
- `ServiceRequest.patientInstruction` — what to ask/observe or how the patient measures (e.g. report dark urine; use home BIA scale under standardized conditions). **Required.**
- `ServiceRequest.performerInstruction` — clinician/lab actions, especially **triggered** tests (e.g. if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes, urinalysis). Include whenever there is a lab/clinician step or an urgent trigger.

**These same `ServiceRequest.*` fields must appear in BOTH places, with identical values:** inside `goal.noun_phrase` (one string, `ServiceRequest.x = …; ServiceRequest.y = …`) *and* as separate `ServiceRequest.*` keys in the same metaprops. The goal states the order; the separate keys make it queryable alongside its provenance.

## Tool calls and `.pf` text

Every call also takes `file` (the project's `guideline/<name>.pf`).

```
add_task(plan: "Monitor_Desired_State", kind: "action", name: "Monitor_Body_Weight",
         caption: "Monitor body weight and percent weight change")
set_attribute(selector: "Monitor_Body_Weight", attribute: "metaprops", value: "<all lines below, plain>")
```

What lands in the `.pf` (from the example; `\\=` and `\\:` are the escapes `format` writes, read back as `=` and `:`):

```
action  :: 'Monitor_Body_Weight' ;
     caption :: 'Monitor body weight and percent weight change' ;
     metaprops :: 'ServiceRequest.code=body weight measurement and percent change from baseline
ServiceRequest.intent=order
ServiceRequest.occurrenceTiming=baseline, monthly x3, then q3mo
ServiceRequest.patientInstruction=weigh under standardized conditions (morning, after voiding, light clothing)
applies_when=all_patients_on_therapy
assistant_invention=none
category=desired_outcome
cq=CQ5
goal.noun_phrase=ServiceRequest.intent \\= order; ServiceRequest.code \\= body weight measurement and percent change from baseline; ServiceRequest.occurrenceTiming \\= baseline, monthly x3, then q3mo; ServiceRequest.patientInstruction \\= weigh under standardized conditions (morning, after voiding, light clothing)
goal.verb=order
guideline_status=specified_as_a_guideline_monitoring_task
instrument=calibrated clinic scale and home scale
knowledge_origin=guideline-specified efficacy assessment
literature_basis=guidelines assess percent weight loss at intervals and reconsider therapy if less than 5 percent at 3 months
monitored_target=desired outcome of 5-10 percent body-weight reduction (achieve goal of Prescribe_GLP1)
monitoring_frequency_basis=guideline 3-month efficacy checkpoint then quarterly
monitoring_stance=recommended
provenance_type=guideline_specified
source=Endocrine Society Pharmacological Management of Obesity Clinical Practice Guideline (J Clin Endocrinol Metab 2015;100\\:342)
source_kind=clinical_guideline
trigger=weight regain or less than 5 percent loss at 3 months prompts therapy review
' ;
end action.
```

## Metaprops on the action (provenance + operationalization)

Every monitoring action **must** carry a full `metaprops` attribute: Java-properties text, one `key=value` per line, set in one `set_attribute` call (numbered `source.1`, `source.2`, … for several citations). This is how the CIG documents *what is monitored, how, when, what triggers escalation, and where the knowledge came from* — so a reviewer can tell guideline-sourced facts apart from your own design.

> **The required keys, controlled vocabulary, and value constraints are defined in `MetapropsSyntax.md` — that file is authoritative; this section summarizes it.** Write **no placeholder values** (`source=s`, `instrument=i`): the gate rejects them. Keep each value on one line, write it plain (the tools escape), and never write a second metaprops — to patch, read the map, change it, write it back whole.

**Canonical keys** (include every applicable one):

- **Goal**: `goal.verb=order`, `goal.noun_phrase=<the full ServiceRequest order>`.
- **ServiceRequest block** (identical to the values in `goal.noun_phrase`): `ServiceRequest.intent`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, and `ServiceRequest.performerInstruction` (for triggered labs/clinician steps).
- `category` = `action_completion` | `desired_outcome` | `undesired_ade`.
- `monitored_target` = the state/harm/action this monitors **and the therapy task it traces back to, by name** (traceability — answers "which task relates to this source/harm?").
- `applies_when` = the population/condition the **source** attaches to this harm (e.g. hypoglycemia *only with concomitant insulin/secretagogue*); `all_patients_on_therapy` only when the source applies it universally. A sub-population action must also carry an executable `precondition` over an Enquiry data item (e.g. `on_insulin_or_secretagogue = true`). **Do not make a conditional ADE universal.**
- `provenance_type` = e.g. `guideline_specified` | `assistant_completed_from_guidelines` | `package_insert_specified` | `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized` | `assistant_independent_literature_search_and_operationalized`.
- `source_kind` = `clinical_guideline` | `package_insert` | `case_report` | `screening_instrument` | `safety_source` …
- `source` / `source.1..n` = each citation (include a stable id where possible, e.g. PMID/PMC + title).
- `knowledge_origin` = where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
- `guideline_status` = `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance` = `recommended` | `symptom_triggered_only` | `routine_not_recommended` | `proposed_by_assistant`. Capture **negative** recommendations faithfully: if the source says routine surveillance of X is not recommended, use `routine_not_recommended` and do not invent a routine schedule.
- `literature_basis` = what the source(s) actually say. When the action reflects the source's own monitoring instruction (e.g. label "Monitor heart rate at regular intervals"), paraphrase that instruction, not just an incidence figure.
- `assistant_invention` = what **you** designed yourself (vs. sourced); use `none` if fully source-based. **Always state this explicitly** so source-based and self-designed parts are separable.
- `instrument` = how it is measured (patient symptom report | named lab test(s) | named questionnaire such as PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
- `monitoring_frequency_basis` = justification for the chosen `occurrenceTiming`.
- `trigger` = what prompts urgent/same-day assessment (for harms); `none` for routine surveillance.
- `cq` = the competency-question ids this action supports.

## Case-report source quality (opt-in only)

**Do not search for or build case-report monitoring actions unless the user explicitly includes them in scope** (or they are listed in the approved proposal's `cig-actions`). Default sources are clinical guidelines and package inserts. Skill examples are not an action checklist.

When case reports *are* in scope and you cite one as evidence of a harm:

- It **must document a harm caused by, or occurring during, the drug** (an adverse drug event). A report whose point is merely that **symptoms resolve/disappear after the drug is stopped** is **not** valid evidence of a monitorable harm — reversibility is not a harm. Reject such a source and search for a better case report that documents the harm itself.
- Prefer reports relevant to the **same drug/class and indication**. Record `knowledge_origin=assistant found source independently` and `guideline_status=not_specified_as_a_guideline_monitoring_task`.
- Record the report and what it shows in `source` and `literature_basis`, and tie it to the action via `monitored_target` (traceability).

## Operationalizing ADE monitoring (do not just name the action)

A name like `Monitor_Pancreatitis` does **not** say *how* to monitor. For each ADE you must specify, in `goal.noun_phrase` and the metaprops keys:

1. **What to ask/observe** — map the syndrome to observable manifestations (e.g. acute pancreatitis → severe persistent abdominal pain radiating to the back) → `ServiceRequest.patientInstruction`.
2. **Which instrument/exam** — patient symptom report, named lab test, validated questionnaire, or clinician exam → `instrument` (+ `ServiceRequest.performerInstruction` for labs).
3. **When** — frequency with justification → `ServiceRequest.occurrenceTiming` + `monitoring_frequency_basis`.
4. **What triggers urgent/same-day assessment** → `trigger`.
5. **Source vs. invention** — cite a source for each choice where possible; mark anything you designed as `assistant_invention`.

**Worked block (labeled ADE — acute pancreatitis from the package insert), as it appears in the example `.pf`:**

```
action  :: 'Monitor_Pancreatitis' ;
     caption :: 'Monitor for acute pancreatitis' ;
     metaprops :: 'ServiceRequest.code=acute pancreatitis symptom screen with triggered lipase
ServiceRequest.intent=order
ServiceRequest.occurrenceTiming=each visit, with testing on symptoms
ServiceRequest.patientInstruction=report severe, persistent abdominal pain that may radiate to the back, with or without vomiting
ServiceRequest.performerInstruction=if suspected, discontinue GLP-1, measure serum lipase, and evaluate for pancreatitis
applies_when=all_patients_on_therapy
assistant_invention=none
category=undesired_ade
cq=CQ7
goal.noun_phrase=ServiceRequest.intent \\= order; ServiceRequest.code \\= acute pancreatitis symptom screen with triggered lipase; ServiceRequest.occurrenceTiming \\= each visit, with testing on symptoms; ServiceRequest.patientInstruction \\= report severe, persistent abdominal pain that may radiate to the back, with or without vomiting; ServiceRequest.performerInstruction \\= if suspected, discontinue GLP-1, measure serum lipase, and evaluate for pancreatitis
goal.verb=order
guideline_status=not_specified_as_a_guideline_monitoring_task
instrument=patient symptom report with triggered serum lipase
knowledge_origin=drug label warning
literature_basis=label warns of acute pancreatitis and advises discontinuation and evaluation if suspected; the label does not call for routine pancreatic-enzyme surveillance
monitored_target=acute pancreatitis as a labeled adverse effect of the GLP-1 prescription (Prescribe_GLP1)
monitoring_frequency_basis=symptom-triggered because pancreatitis presents acutely
monitoring_stance=symptom_triggered_only
provenance_type=package_insert_specified
source=Wegovy (semaglutide) US Prescribing Information, Warnings and Precautions\\: Acute Pancreatitis
source_kind=package_insert
trigger=severe persistent abdominal pain prompts drug hold and lipase testing
' ;
end action.
```

## Guidance

- Create one monitoring action **per item to monitor** identified in Step 3, placed in the matching Monitoring sub-plan:
  - completion of a therapy recommendation → **Monitor Actions**
  - a desired state / `achieve` goal → **Monitor Desired Outcome States**
  - an undesired state / `avoid` goal / labeled ADE / (opt-in) case-report risk / mechanism-of-action harm → **Monitor Undesired ADEs**
- Always include a **frequency** (`ServiceRequest.occurrenceTiming`). Use the guideline's frequency if present; otherwise propose one and record the justification in `monitoring_frequency_basis`.
- Capture the **measurement method** in `ServiceRequest.code`/`patientInstruction`/`performerInstruction` and in `instrument` (lab test, questionnaire such as CoEQ/SF-36/IWQOL-Lite/PHQ-9/C-SSRS, BIA scale, or clinician interview).
- **Every monitoring action gets the full metaprops** (keys above): the goal, the ServiceRequest order as separate keys, and provenance/operationalization. Keep the ServiceRequest values identical between `goal.noun_phrase` and the keys.
- **Document sources and self-found knowledge** (`source`, `knowledge_origin`, `assistant_invention`) so a reviewer can separate guideline-sourced facts from your own design — and tie each action to what it monitors via `monitored_target` (traceability).

## Worked example (`cig/examples/obesity-glp1-monitoring.pf` — authoritative)

`Monitor_Pancreatitis` (a labeled ADE) and `Monitor_Body_Weight` (a guideline-specified desired outcome) each have `goal.verb=order` with a `goal.noun_phrase` that spells out the full `ServiceRequest.*` block, and the same block as separate keys plus the provenance/operationalization keys per `MetapropsSyntax.md`. All ten monitoring actions in that file pass `check_cig.mjs` — imitate them; `Monitor_Hypoglycemia` shows the conditional `applies_when` + `precondition` pattern, `Monitor_Anhedonia` shows numbered `source.1..3`, and `Monitor_Pancreatitis` shows `monitoring_stance=symptom_triggered_only`. Do **not** add case-report-only actions just because an older example had them.

## Related patterns

- `MetapropsSyntax.md` (the canonical metaprops contract), `MonitoringPlan.md`, `ActionComponent.md`, `StateAchievementGoal.md`.
