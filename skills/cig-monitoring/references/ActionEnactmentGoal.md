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
- `provenance_type` = e.g. `guideline_specified` | `assistant_completed_from_guidelines` | `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized` | `assistant_independent_literature_search_and_operationalized`.
- `source_kind` = `clinical_guideline` | `package_insert` | `case_report` | `screening_instrument` | `safety_source` …
- `source` = each citation (include a stable id where possible, e.g. PMID/PMC + title). **Repeat the key** for each source.
- `knowledge_origin` = where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
- `guideline_status` = `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
- `literature_basis` = what the source(s) actually say.
- `assistant_invention` = what **you** designed yourself (vs. sourced); use `none` if fully source-based. **Always state this explicitly** so source-based and self-designed parts are separable.
- `instrument` = how it is measured (patient symptom report | named lab test(s) | named questionnaire such as PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
- `monitoring_frequency_basis` = justification for the chosen `occurrenceTiming`.
- `trigger` = what prompts urgent/same-day assessment (for harms); omit or `none` for routine surveillance.
- `cq` = the competency-question ids this action supports.

## Case-report source quality (important)

When you cite a **case report** as evidence of a harm:

- It **must document a harm caused by, or occurring during, the drug** (an adverse drug event). A report whose point is merely that **symptoms resolve/disappear after the drug is stopped** is **not** valid evidence of a monitorable harm — reversibility is not a harm. Reject such a source and search for a better case report that documents the harm itself.
- Prefer reports relevant to the **same drug/class and indication** (e.g. semaglutide/GLP-1 for obesity). You may (and should) find suitable case reports **independently**, beyond any examples the skill provides — record `knowledge_origin=assistant found source independently` and `guideline_status=not_specified_as_a_guideline_monitoring_task`.
- Record the report and what it shows in `source=` and `literature_basis=`, and tie it to the action via `monitored_target=` (traceability).

## Operationalizing rare-harm monitoring (do not just name the action)

A name like `Monitor_Thiamine_Deficiency_Wernicke_Risk` does **not** say *how* to monitor. For each rare harm you must specify, in the Goal `noun_phrase` and the Action `metaprops`:

1. **What to ask/observe** — map the syndrome to observable manifestations (e.g. Wernicke encephalopathy → confusion, ataxia, ophthalmoplegia) → `ServiceRequest.patientInstruction`.
2. **Which instrument/exam** — patient symptom report, named lab test, validated questionnaire, or clinician exam → `instrument` (+ `ServiceRequest.performerInstruction` for labs).
3. **When** — frequency with justification → `ServiceRequest.occurrenceTiming` + `monitoring_frequency_basis`.
4. **What triggers urgent/same-day assessment** → `trigger`.
5. **Source vs. invention** — cite a source for each choice where possible; mark anything you designed as `assistant_invention`.

**Worked skeleton (independently-found rare harm — rhabdomyolysis):**

```
ClassAssertion(pf:Action :Monitor_Rhabdomyolysis_Risk)
ObjectPropertyAssertion(pf:goal :Monitor_Rhabdomyolysis_Risk :Goal_order_rhabdo_screen)
ClassAssertion(pf:Goal :Goal_order_rhabdo_screen)
DataPropertyAssertion(pf:verb :Goal_order_rhabdo_screen "order")
DataPropertyAssertion(pf:noun_phrase :Goal_order_rhabdo_screen "ServiceRequest.intent = order; ServiceRequest.code = rhabdomyolysis symptom screen and triggered CK/renal safety testing; ServiceRequest.occurrenceTiming = at each visit and around dose escalation; ServiceRequest.patientInstruction = report severe/unexpected muscle pain, cramps, weakness, exercise intolerance, muscle swelling, dark tea/cola-colored urine, or reduced urine output urgently; ServiceRequest.performerInstruction = if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes (K, phosphate), urinalysis for blood/myoglobin, assess hydration/AKI")
DataPropertyAssertion(pf:metaprops :Monitor_Rhabdomyolysis_Risk "category=undesired_ade; monitored_target=semaglutide-associated rhabdomyolysis (muscle injury, AKI risk) relating to the GLP-1 therapy recommendation; ServiceRequest.intent=order; ServiceRequest.code=rhabdomyolysis symptom screen + triggered CK/renal testing; ServiceRequest.occurrenceTiming=each visit and around dose escalation; ServiceRequest.patientInstruction=report severe muscle pain/cramps/weakness/dark urine urgently; ServiceRequest.performerInstruction=if symptoms occur, order CK/CPK, creatinine/eGFR, electrolytes, urinalysis; provenance_type=assistant_independent_literature_search_and_operationalized; source_kind=case_report_plus_clinical_safety_source; source=PMC12690205 From weight loss to muscle loss: rhabdomyolysis linked to semaglutide; source=Cureus Rhabdomyolysis Associated With Semaglutide Therapy: A Case Report; source=CDC/NIOSH Signs and Symptoms of Rhabdomyolysis; source=StatPearls Rhabdomyolysis; knowledge_origin=assistant found source independently, not from skill examples; guideline_status=not_specified_as_a_guideline_monitoring_task; literature_basis=case report described bilateral lower-extremity pain/cramping and dark urine days after dose increase 1.7->2.4 mg, advising CK when muscle pain/dark urine occur; CDC: main symptoms muscle pain/dark urine/weakness, CK is the accurate test; instrument=patient symptom report plus triggered serum CK/CPK, creatinine/eGFR, electrolytes, urinalysis; assistant_invention=screening frequency adapted to GLP-1 dose escalation and routine obesity follow-up; monitoring_frequency_basis=case onset shortly after dose increase + Endocrine Society follow-up monthly x3 then q3mo; trigger=severe/unexpected muscle pain/cramps/weakness/dark urine/reduced urine output; cq=CQ7")
```

## Guidance

- Create one monitoring action (+ Action Enactment Goal) **per item to monitor** identified in Step 3, placed in the matching Monitoring sub-plan:
  - completion of a therapy recommendation → **Monitor Actions**
  - a desired state / `achieve` goal → **Monitor Desired Outcome States**
  - an undesired state / `avoid` goal / ADE / case-report risk / mechanism-of-action harm → **Monitor Undesired ADEs**
- Always include a **frequency** (`ServiceRequest.occurrenceTiming`). Use the guideline's frequency if present; otherwise propose one and record the justification in `monitoring_frequency_basis`.
- Capture the **measurement method** in `ServiceRequest.code`/`patientInstruction`/`performerInstruction` and in `instrument` (lab test, questionnaire such as CoEQ/SF-36/IWQOL-Lite/PHQ-9/C-SSRS, BIA scale, or clinician interview).
- **Every monitoring Action gets a `metaprops` string** (schema above): the full ServiceRequest order plus provenance/operationalization. Keep the ServiceRequest fields consistent between the Goal `noun_phrase` and the Action `metaprops`.
- **Document sources and self-found knowledge** in `metaprops` (`source`, `knowledge_origin`, `assistant_invention`) so a reviewer can separate guideline-sourced facts from your own design — and tie each action to what it monitors via `monitored_target` (traceability).

## Worked example (`cig/examples/obesity-glp1-monitoring.owl` — authoritative)

`Monitor_Rhabdomyolysis` (an independently-found case-report harm) and `Monitor_Body_Weight` (a guideline-specified desired outcome) each have an Action Enactment Goal (`verb=order`) whose `noun_phrase` spells out the full `ServiceRequest.*` block, and a matching `pf:metaprops` string that repeats that block and adds the provenance/operationalization keys per `MetapropsSyntax.md`. All ten monitoring Actions in that file pass the `cig-monitoring-review` gate — imitate them. (The older `cig/examples/obesity-glp1.owl` predates the `metaprops` convention and is kept only as a frozen earlier example.)

## Related patterns

- `MetapropsSyntax.md` (the canonical metaprops contract), `MonitoringPlan.md`, `ActionComponent.md`, `StateAchievementGoal.md`.
