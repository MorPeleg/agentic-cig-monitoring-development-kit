# Design Pattern: Action Enactment Goal

**Intent:** The goal of a **monitoring** `Action`. It expresses that some measurement/order should be *enacted*, with a verb of `order` plus a `noun_phrase` that references an HL7 FHIR `ServiceRequest`. This is how the Monitoring Plan operationalizes monitoring of action completion and of desired/undesired states.

## PROforma elements

- Class: `Goal`
- Properties: `goal` (Task→Goal), data properties `verb` and `noun_phrase`
- `verb` = **`order`** for Action Enactment Goals (the verb enum also allows `start`/`stop`; prefer `order` for ServiceRequest-style monitoring orders).

## FHIR `ServiceRequest` (required fields)

Encode the order using FHIR `ServiceRequest` fields so the *what / intent / frequency / how* are always explicit. **Always include all of these** (do not stop at `code` + `patientInstruction`):

- `ServiceRequest.intent = order` — **required**.
- `ServiceRequest.code` — what is measured (e.g. body weight measurement via BIA scale; lipid panel; CoEQ questionnaire). **Required.**
- `ServiceRequest.occurrenceTiming` — frequency (e.g. `monthly x3 then q3mo`). **Required.** If the guideline omits frequency, propose one and justify it (record the justification in `monitoring_frequency_basis`, see below).
- `ServiceRequest.patientInstruction` — what to ask/observe or how the patient measures (e.g. report dark urine; use home BIA scale under standardized conditions). **Required.**
- `ServiceRequest.performerInstruction` — clinician/lab actions, especially **triggered** tests (e.g. if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes, urinalysis). Include whenever there is a lab/clinician step or an urgent trigger.

**These same `ServiceRequest.*` fields must appear in BOTH places:** the Action Enactment **Goal's `noun_phrase`** *and* the monitoring **Action's `metaprops`** (see next section). The Goal states the order; the Action's metaprops makes the order self-contained alongside its provenance.

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, `:` = project namespace.

```
# Monitoring action inside a Monitoring sub-plan (via a Component; see ActionComponent.md)
ObjectPropertyAssertion(pf:components :Monitor_Desired_State :Weight_Monitoring_Component)
ClassAssertion(pf:Component :Weight_Monitoring_Component)
ObjectPropertyAssertion(pf:taskref :Weight_Monitoring_Component :Monitor_Weight)
ClassAssertion(pf:Action :Monitor_Weight)

# Action Enactment Goal: order a FHIR ServiceRequest (all four ServiceRequest fields present)
ObjectPropertyAssertion(pf:goal :Monitor_Weight :Goal_order_weight_BIA)
ClassAssertion(pf:Goal :Goal_order_weight_BIA)
DataPropertyAssertion(pf:verb :Goal_order_weight_BIA "order")
DataPropertyAssertion(pf:noun_phrase :Goal_order_weight_BIA "ServiceRequest.intent = order; ServiceRequest.code = body weight measurement / body composition measurement via BIA scale; ServiceRequest.occurrenceTiming = baseline, monthly x3, then q3mo; ServiceRequest.patientInstruction = use home BIA scale under standardized conditions (morning, fasting, after voiding)")

# metaprops on the ACTION: the same ServiceRequest order PLUS provenance & operationalization (one string)
DataPropertyAssertion(pf:metaprops :Monitor_Weight "category=desired_outcome; monitored_target=body-weight reduction of 5-10 percent and body-composition/muscle-mass; ServiceRequest.intent=order; ServiceRequest.code=body weight/body composition via BIA scale; ServiceRequest.occurrenceTiming=baseline, monthly x3, then q3mo; ServiceRequest.patientInstruction=use home BIA scale under standardized conditions; instrument=home BIA scale; provenance_type=guideline_specified; source_kind=clinical_guideline; source=Endocrine Society 2016 Obesity Pharmacotherapy CPG; guideline_status=specified_as_a_guideline_monitoring_task; knowledge_origin=guideline; literature_basis=guideline recommends body-weight/body-composition monitoring on this schedule; assistant_invention=none; monitoring_frequency_basis=Endocrine Society follow-up monthly x3 then q3mo; trigger=excessive/rapid weight loss prompts earlier review; cq=CQ6,CQ9")
```

## `metaprops` on the Action (provenance + operationalization)

Every monitoring `Action` **must** carry a `pf:metaprops` assertion (PROforma `metaprops` has domain `Source ∪ Task`, so it is valid on an `Action`). Use **one string** of `key=value` pairs separated by `; ` (repeat `source=` for multiple sources). This is how the CIG documents *what is monitored, how, when, what triggers escalation, and where the knowledge came from* — so a reviewer can tell guideline-sourced facts apart from your own design.

> **The canonical grammar, ordered keys, controlled vocabulary, and value constraints are defined in `MetapropsSyntax.md` — that file is authoritative; this section summarizes it.** Write **no placeholder values** (`source=s`, `instrument=i`): the `cig-monitoring-review` gate rejects them. Write the long `metaprops`/`noun_phrase` literals with the **structured assertion tool** (`add_data_property_assertion`) so the value is escaped server-side and never truncated; if you must use `add_axioms`, keep each literal single-line.

**Canonical keys** (include every applicable one):

- **ServiceRequest block** (mirror the Goal's `noun_phrase` so the Action is self-contained): `ServiceRequest.intent`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, and `ServiceRequest.performerInstruction` (for triggered labs/clinician steps).
- `category` = `action_completion` | `desired_outcome` | `undesired_ade`.
- `monitored_target` = the state/harm/action this monitors **and the therapy goal or recommendation it traces back to** (traceability — answers "which task relates to this source/harm?").
- `applies_when` = the population/condition the **source** attaches to this harm (e.g. hypoglycemia *only with concomitant insulin/secretagogue*); `all_patients_on_therapy` only when the source applies it universally. A sub-population action must also carry a PROforma `precondition`. **Do not make a conditional ADE universal.**
- `provenance_type` = e.g. `guideline_specified` | `assistant_completed_from_guidelines` | `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized` | `assistant_independent_literature_search_and_operationalized`.
- `source_kind` = `clinical_guideline` | `package_insert` | `case_report` | `screening_instrument` | `safety_source` …
- `source` = each citation (include a stable id where possible, e.g. PMID/PMC + title). **Repeat the key** for each source.
- `knowledge_origin` = where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
- `guideline_status` = `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance` = `recommended` | `symptom_triggered_only` | `routine_not_recommended` | `proposed_by_assistant`. Capture **negative** recommendations faithfully: if the source says routine surveillance of X is not recommended, use `routine_not_recommended` and do not invent a routine schedule.
- `literature_basis` = what the source(s) actually say. When the action reflects the source's own monitoring instruction (e.g. label "Monitor heart rate at regular intervals"), paraphrase that instruction, not just an incidence figure.
- `assistant_invention` = what **you** designed yourself (vs. sourced); use `none` if fully source-based. **Always state this explicitly** so source-based and self-designed parts are separable.
- `instrument` = how it is measured (patient symptom report | named lab test(s) | named questionnaire such as PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
- `monitoring_frequency_basis` = justification for the chosen `occurrenceTiming`.
- `trigger` = what prompts urgent/same-day assessment (for harms); omit or `none` for routine surveillance.
- `cq` = the competency-question ids this action supports.

## Case-report source quality (opt-in only)

**Do not search for or instantiate case-report monitoring actions unless the user explicitly includes them in scope** (or they are listed in the approved proposal). Default sources are clinical guidelines and package inserts. Skill examples are not an action checklist.

When case reports *are* in scope and you cite one as evidence of a harm:

- It **must document a harm caused by, or occurring during, the drug** (an adverse drug event). A report whose point is merely that **symptoms resolve/disappear after the drug is stopped** is **not** valid evidence of a monitorable harm — reversibility is not a harm. Reject such a source and search for a better case report that documents the harm itself.
- Prefer reports relevant to the **same drug/class and indication**. Record `knowledge_origin=assistant found source independently` and `guideline_status=not_specified_as_a_guideline_monitoring_task`.
- Record the report and what it shows in `source=` and `literature_basis=`, and tie it to the action via `monitored_target=` (traceability).

## Operationalizing ADE monitoring (do not just name the action)

A name like `Monitor_Pancreatitis` does **not** say *how* to monitor. For each ADE you must specify, in the Goal `noun_phrase` and the Action `metaprops`:

1. **What to ask/observe** — map the syndrome to observable manifestations (e.g. acute pancreatitis → severe persistent abdominal pain radiating to the back) → `ServiceRequest.patientInstruction`.
2. **Which instrument/exam** — patient symptom report, named lab test, validated questionnaire, or clinician exam → `instrument` (+ `ServiceRequest.performerInstruction` for labs).
3. **When** — frequency with justification → `ServiceRequest.occurrenceTiming` + `monitoring_frequency_basis`.
4. **What triggers urgent/same-day assessment** → `trigger`.
5. **Source vs. invention** — cite a source for each choice where possible; mark anything you designed as `assistant_invention`.

**Worked skeleton (labeled ADE — acute pancreatitis from the package insert):**

```
ClassAssertion(pf:Action :Monitor_Pancreatitis)
ObjectPropertyAssertion(pf:goal :Monitor_Pancreatitis :Goal_order_pancreatitis)
ClassAssertion(pf:Goal :Goal_order_pancreatitis)
DataPropertyAssertion(pf:verb :Goal_order_pancreatitis "order")
DataPropertyAssertion(pf:noun_phrase :Goal_order_pancreatitis "ServiceRequest.intent = order; ServiceRequest.code = acute pancreatitis symptom screen with triggered lipase; ServiceRequest.occurrenceTiming = each visit, with testing on symptoms; ServiceRequest.patientInstruction = report severe, persistent abdominal pain that may radiate to the back, with or without vomiting; ServiceRequest.performerInstruction = if suspected, discontinue GLP-1, measure serum lipase, and evaluate for pancreatitis")
DataPropertyAssertion(pf:metaprops :Monitor_Pancreatitis "ServiceRequest.intent=order; ServiceRequest.code=acute pancreatitis symptom screen with triggered lipase; ServiceRequest.occurrenceTiming=each visit, with testing on symptoms; ServiceRequest.patientInstruction=report severe, persistent abdominal pain that may radiate to the back, with or without vomiting; ServiceRequest.performerInstruction=if suspected, discontinue GLP-1, measure serum lipase, and evaluate for pancreatitis; category=undesired_ade; monitored_target=acute pancreatitis as a labeled adverse effect of the GLP-1 prescription (Prescribe_GLP1); applies_when=all_patients_on_therapy; provenance_type=package_insert_specified; source_kind=package_insert; source=Wegovy (semaglutide) US Prescribing Information, Warnings and Precautions: Acute Pancreatitis; knowledge_origin=drug label warning; guideline_status=not_specified_as_a_guideline_monitoring_task; monitoring_stance=symptom_triggered_only; literature_basis=label warns of acute pancreatitis and advises discontinuation and evaluation if suspected; the label does not call for routine pancreatic-enzyme surveillance; assistant_invention=none; instrument=patient symptom report with triggered serum lipase; monitoring_frequency_basis=symptom-triggered because pancreatitis presents acutely; trigger=severe persistent abdominal pain prompts drug hold and lipase testing; cq=CQ7")
```

## Guidance

- Create one monitoring action (+ Action Enactment Goal) **per item to monitor** identified in Step 3, placed in the matching Monitoring sub-plan:
  - completion of a therapy recommendation → **Monitor Actions**
  - a desired state / `achieve` goal → **Monitor Desired Outcome States**
  - an undesired state / `avoid` goal / labeled ADE / (opt-in) case-report risk / mechanism-of-action harm → **Monitor Undesired ADEs**
- Always include a **frequency** (`ServiceRequest.occurrenceTiming`). Use the guideline's frequency if present; otherwise propose one and record the justification in `monitoring_frequency_basis`.
- Capture the **measurement method** in `ServiceRequest.code`/`patientInstruction`/`performerInstruction` and in `instrument` (lab test, questionnaire such as CoEQ/SF-36/IWQOL-Lite/PHQ-9/C-SSRS, BIA scale, or clinician interview).
- **Every monitoring Action gets a `metaprops` string** (schema above): the full ServiceRequest order plus provenance/operationalization. Keep the ServiceRequest fields consistent between the Goal `noun_phrase` and the Action `metaprops`.
- **Document sources and self-found knowledge** in `metaprops` (`source`, `knowledge_origin`, `assistant_invention`) so a reviewer can separate guideline-sourced facts from your own design — and tie each action to what it monitors via `monitored_target` (traceability).

## Worked example (`cig/examples/obesity-glp1-monitoring.owl` — authoritative)

`Monitor_Pancreatitis` (a labeled ADE) and `Monitor_Body_Weight` (a guideline-specified desired outcome) each have an Action Enactment Goal (`verb=order`) whose `noun_phrase` spells out the full `ServiceRequest.*` block, and a matching `pf:metaprops` string that repeats that block and adds the provenance/operationalization keys per `MetapropsSyntax.md`. All ten monitoring Actions in that file pass the `cig-monitoring-review` gate — imitate them; `Monitor_Hypoglycemia` shows the conditional `applies_when` + `precondition` pattern, and several actions show `monitoring_stance=symptom_triggered_only`. Do **not** add case-report-only actions just because an older example had them. (The older `cig/examples/obesity-glp1.owl` predates the `metaprops` convention and is kept only as a frozen earlier example.)

## Related patterns

- `MetapropsSyntax.md` (the canonical metaprops contract), `MonitoringPlan.md`, `ActionComponent.md`, `StateAchievementGoal.md`.
