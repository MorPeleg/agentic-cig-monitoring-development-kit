# Design Pattern: Action Enactment Goal

**Intent:** The goal of a **monitoring** `action`. It expresses that some measurement/order should be *enacted*, with `goal.verb=order` plus a `goal.noun_phrase` that states the order in plain language. This is how the Monitoring Plan operationalizes monitoring of action completion and of desired/undesired states.

## PROforma elements

- Task: `action` (created with `add_task` in a Monitoring sub-plan; see `ActionComponent.md`)
- Native fields: `caption` (one line), `description` (what is monitored and why it was modelled), `procedure` (the order as the instruction Composer shows), `precondition` (when the source scopes it to a sub-population)
- Goal: metaprops keys `goal.verb` and `goal.noun_phrase` on the action (no separate Goal object; one goal per task)
- `goal.verb` = **`order`** for Action Enactment Goals (the verb list also allows `start`/`stop`; prefer `order` for monitoring orders). `check_cig.mjs` treats every action with `goal.verb=order` as a monitoring action.

## The order (required fields)

Encode the order so the *what / when / how* are always explicit. **Always include all of these** (do not stop at the code):

- `order.code` — what is measured or done (e.g. body weight measurement; lipid panel; CoEQ questionnaire). **Required.**
- `order.timing` — the schedule (e.g. `monthly x3 then q3mo`). **Required**, and it must name a real cadence or trigger. If the guideline omits frequency, propose one and justify it (record the justification in `monitoring_frequency_basis`, see below).
- `order.patient_instruction` — what the patient reports, does or measures (e.g. report dark urine; use home BIA scale under standardized conditions). **Required.**
- `order.performer_instruction` — clinician/lab actions, especially **triggered** tests (e.g. if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes, urinalysis). **Required** whenever there is a triggered lab or an urgent step; otherwise omit.

**The same order is stated three ways, which must agree:** the `order.*` keys (queryable alongside the provenance), `goal.noun_phrase` = `<order.code>, <order.timing>`, and the native `procedure` = `<order.code>, <order.timing>. Patient: <order.patient_instruction>. Clinician: <order.performer_instruction>.` (the last sentence only when there is a performer instruction). The gate checks that `goal.noun_phrase` and `procedure` both state `order.code` and `order.timing`. The old FHIR `ServiceRequest.*` keys are no longer used; convert an older guideline with `node scripts/migrate_metaprops.mjs <guideline.pf>`.

## Tool calls and `.pf` text

Every call also takes `file` (the project's `guideline/<name>.pf`).

```
add_task(plan: "Monitor_Desired_State", kind: "action", name: "Monitor_Body_Weight",
         caption: "Monitor body weight and percent weight change")
set_attribute(selector: "Monitor_Body_Weight", attribute: "description", value: "Monitors desired outcome of ...")
set_attribute(selector: "Monitor_Body_Weight", attribute: "procedure", value: "Body weight measurement and percent change from baseline, ...")
set_attribute(selector: "Monitor_Body_Weight", attribute: "metaprops", value: "<all lines below, plain>")
```

What lands in the `.pf` (`\\=` and `\\:` are the escapes `format` writes, read back as `=` and `:`):

```
action  :: 'Monitor_Body_Weight' ;
     caption :: 'Monitor body weight and percent weight change' ;
     description :: 'Monitors desired outcome of 5-10 percent body-weight reduction (achieve goal of Prescribe_GLP1). The ADA Standards recommend follow-up at least monthly for the first 3 months to assess efficacy, then at least every 3 months for the rest of the first year.' ;
     metaprops :: 'applies_when=all_patients_on_therapy
assistant_invention=standardized weighing conditions
category=desired_outcome
cq=CQ5
goal.noun_phrase=body weight measurement and percent change from baseline, baseline, monthly x3, then q3mo
goal.verb=order
guideline_status=specified_as_a_guideline_monitoring_task
instrument=calibrated clinic scale and home scale
knowledge_origin=guideline-specified efficacy assessment
literature_basis=the ADA Standards recommend follow-up at least monthly for the first 3 months to assess efficacy, then at least every 3 months for the rest of the first year
monitored_target=desired outcome of 5-10 percent body-weight reduction (achieve goal of Prescribe_GLP1)
monitoring_frequency_basis=ADA follow-up cadence (Rec 2.29a monthly x3, Rec 2.29b at least every 3 months)
monitoring_stance=recommended
ontology.coding=SNOMED\\:27113001
ontology.label=Body weight (observable entity)
order.code=body weight measurement and percent change from baseline
order.patient_instruction=weigh under standardized conditions (morning, after voiding, light clothing)
order.timing=baseline, monthly x3, then q3mo
provenance_type=guideline_specified
quote.1=p.21, Rec 2.29a\\: "arrange for follow-up with individuals at least monthly during the first 3 months of treatment"
quote.2=p.21, Rec 2.29b\\: "follow-up visits at least every 3 months with trained health care professionals to continue monitoring efficacy and safety"
source.1=ADA 2026 Standards of Care in Overweight and Obesity, Pharmacologic Treatment of Obesity in Adults, Rec 2.29a (p.21)
source.2=ADA 2026 Standards of Care in Overweight and Obesity, Pharmacologic Treatment of Obesity in Adults, Rec 2.29b (p.21)
source_kind=clinical_guideline
trigger=weight regain or less than 5 percent loss at 3 months prompts therapy review
' ;
     procedure :: 'Body weight measurement and percent change from baseline, baseline, monthly x3, then q3mo. Patient: weigh under standardized conditions (morning, after voiding, light clothing).' ;
end action.
```

## Metaprops on the action (provenance + operationalization)

Every monitoring action **must** carry a full `metaprops` attribute: Java-properties text, one `key=value` per line, set in one `set_attribute` call (numbered `source.1`, `source.2`, … for several citations, each with its `quote.1`, `quote.2`, …). This is how the CIG documents *what is monitored, how, when, what triggers escalation, and where the knowledge came from* — so a reviewer can tell guideline-sourced facts apart from your own design.

> **The required keys, controlled vocabulary, and value constraints are defined in `MetapropsSyntax.md` — that file is authoritative; this section summarizes it.** Write **no placeholder values** (`source=s`, `instrument=i`): the gate rejects them. Keep each value on one line, write it plain (the tools escape), and never write a second metaprops — to patch, read the map, change it, write it back whole.

**Canonical keys** (include every applicable one):

- **Goal**: `goal.verb=order`, `goal.noun_phrase=<order.code>, <order.timing>`.
- **Order**: `order.code`, `order.timing`, `order.patient_instruction`, and `order.performer_instruction` (for triggered labs/clinician steps), matching the native `procedure`.
- `category` = `action_completion` | `desired_outcome` | `undesired_ade`.
- `monitored_target` = the state/harm/action this monitors **and the therapy task it traces back to, by name** (traceability — answers "which task relates to this source/harm?").
- `applies_when` = the population/condition the **source** attaches to this harm (e.g. hypoglycemia *only with concomitant insulin/secretagogue*); `all_patients_on_therapy` only when the source applies it universally. A sub-population action must also carry an executable `precondition` over an Enquiry data item (e.g. `on_insulin_or_secretagogue = true`). **Do not make a conditional ADE universal.**
- `provenance_type` = e.g. `guideline_specified` | `assistant_completed_from_guidelines` | `package_insert_specified` | `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized` | `assistant_independent_literature_search_and_operationalized`.
- `source_kind` = `clinical_guideline` | `package_insert` | `case_report` | `screening_instrument` | `safety_source` …
- `source` / `source.1..n` = each citation (include a stable id where possible, e.g. PMID/PMC + title, or the guideline/label section and page).
- `quote` / `quote.1..n` = the **verbatim passage** of the matching source that the action was modelled from: at most about 25 words, in double quotes, prefixed with its page or section, copied exactly from the source document (`...` marks an omission). An action that cites sources but quotes none FAILs; a citation without its own quote is a WARN (for works not in the source library).
- `knowledge_origin` = where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
- `guideline_status` = `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance` = `recommended` | `symptom_triggered_only` | `routine_not_recommended` | `proposed_by_assistant`. Capture **negative** recommendations faithfully: if the source says routine surveillance of X is not recommended, use `routine_not_recommended` and do not invent a routine schedule.
- `literature_basis` = what the source(s) actually say, in your words. When the action reflects the source's own monitoring instruction (e.g. label "Monitor heart rate at regular intervals"), paraphrase that instruction, not just an incidence figure.
- `assistant_invention` = what **you** designed yourself (vs. sourced); use `none` if fully source-based. **Always state this explicitly** so source-based and self-designed parts are separable.
- `instrument` = how it is measured (patient symptom report | named lab test(s) | named questionnaire such as PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
- `monitoring_frequency_basis` = justification for the chosen `order.timing`.
- `trigger` = what prompts urgent/same-day assessment (for harms); `none` for routine surveillance.
- `cq` = the competency-question ids this action supports.
- `ontology.coding` / `ontology.label` = Composer's Ontology coding of the disorder, finding or measurement the action watches (`SNOMED:<id>` and the preferred term), found with `snomed_search` in the coding pass.

## Case-report source quality (opt-in only)

**Do not search for or build case-report monitoring actions unless the user explicitly includes them in scope** (or they are listed in the approved proposal's `cig-actions`). Default sources are clinical guidelines and package inserts. Skill examples are not an action checklist.

When case reports *are* in scope and you cite one as evidence of a harm:

- It **must document a harm caused by, or occurring during, the drug** (an adverse drug event). A report whose point is merely that **symptoms resolve/disappear after the drug is stopped** is **not** valid evidence of a monitorable harm — reversibility is not a harm. Reject such a source and search for a better case report that documents the harm itself.
- Prefer reports relevant to the **same drug/class and indication**. Record `knowledge_origin=assistant found source independently` and `guideline_status=not_specified_as_a_guideline_monitoring_task`.
- Record the report and what it shows in `source`, `quote` and `literature_basis`, and tie it to the action via `monitored_target` (traceability).

## Operationalizing ADE monitoring (do not just name the action)

A name like `Monitor_Pancreatitis` does **not** say *how* to monitor. For each ADE you must specify, in the `order.*` keys (and so in `procedure` and `goal.noun_phrase`) and the other metaprops:

1. **What to ask/observe** — map the syndrome to observable manifestations (e.g. acute pancreatitis → severe persistent abdominal pain radiating to the back) → `order.patient_instruction`.
2. **Which instrument/exam** — patient symptom report, named lab test, validated questionnaire, or clinician exam → `instrument` (+ `order.performer_instruction` for labs).
3. **When** — frequency with justification → `order.timing` + `monitoring_frequency_basis`.
4. **What triggers urgent/same-day assessment** → `trigger`.
5. **Source vs. invention** — cite and quote a source for each choice where possible; mark anything you designed as `assistant_invention`.

**Worked block (labeled ADE — acute pancreatitis from the package insert)**, the value from `MetapropsSyntax.md` as it lands in the `.pf`:

```
action  :: 'Monitor_Pancreatitis' ;
     caption :: 'Monitor for acute pancreatitis' ;
     description :: 'Monitors acute pancreatitis as a labeled adverse effect of semaglutide (Prescribe_Semaglutide). The label says to observe patients carefully for signs and symptoms after initiation and to discontinue if pancreatitis is suspected; lipase rises without symptoms are of unknown significance, so there is no routine enzyme surveillance.' ;
     metaprops :: 'applies_when=all_patients_on_therapy
assistant_invention=serum lipase as the triggered confirmatory test
category=undesired_ade
cq=CQ7, CQ8
goal.noun_phrase=acute pancreatitis symptom review with triggered serum lipase, each follow-up visit, with testing on symptoms
goal.verb=order
guideline_status=not_specified_as_a_guideline_monitoring_task
instrument=patient symptom report with triggered serum lipase
knowledge_origin=drug label warning
literature_basis=the label says to observe patients carefully for signs and symptoms of pancreatitis after initiation and to discontinue if pancreatitis is suspected
monitored_target=acute pancreatitis as a labeled adverse effect of semaglutide (Prescribe_Semaglutide)
monitoring_frequency_basis=symptom-triggered because pancreatitis presents acutely
monitoring_stance=symptom_triggered_only
ontology.coding=SNOMED\\:197456007
ontology.label=Acute pancreatitis (disorder)
order.code=acute pancreatitis symptom review with triggered serum lipase
order.patient_instruction=stop semaglutide and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting
order.performer_instruction=if pancreatitis is suspected, discontinue semaglutide, measure serum lipase and initiate appropriate management
order.timing=each follow-up visit, with testing on symptoms
provenance_type=package_insert_specified
quote=§5.2\\: "If pancreatitis is suspected, discontinue WEGOVY and initiate appropriate management."
source=Wegovy (semaglutide) US Prescribing Information (revised 02/2026), §5.2 Acute Pancreatitis
source_kind=package_insert
trigger=severe persistent abdominal pain prompts drug discontinuation and lipase testing
' ;
     procedure :: 'Acute pancreatitis symptom review with triggered serum lipase, each follow-up visit, with testing on symptoms. Patient: stop semaglutide and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting. Clinician: if pancreatitis is suspected, discontinue semaglutide, measure serum lipase and initiate appropriate management.' ;
end action.
```

## Guidance

- Create one monitoring action **per item to monitor** identified in Step 3, placed in the matching Monitoring sub-plan:
  - completion of a therapy recommendation → **Monitor Actions**
  - a desired state / `achieve` goal → **Monitor Desired Outcome States**
  - an undesired state / `avoid` goal / labeled ADE / (opt-in) case-report risk / mechanism-of-action harm → **Monitor Undesired ADEs**
- Always include a **frequency** (`order.timing`). Use the guideline's frequency if present; otherwise propose one and record the justification in `monitoring_frequency_basis`.
- Capture the **measurement method** in `order.code` / `order.patient_instruction` / `order.performer_instruction` and in `instrument` (lab test, questionnaire such as CoEQ/SF-36/IWQOL-Lite/PHQ-9/C-SSRS, BIA scale, or clinician interview).
- **Every monitoring action gets the native fields and the full metaprops** (keys above): caption, description and procedure; the goal, the `order.*` keys, and provenance/operationalization with quoted sources. Keep `procedure` and `goal.noun_phrase` consistent with `order.code` and `order.timing`.
- **Document sources and self-found knowledge** (`source` + `quote`, `knowledge_origin`, `assistant_invention`) so a reviewer can separate guideline-sourced facts from your own design — and tie each action to what it monitors via `monitored_target` (traceability).
- **Code it** in the coding pass: `ontology.coding=SNOMED:<id>` + `ontology.label` from `snomed_search` (one concept; note a narrower or broader choice in `assistant_invention`).

## Worked example (`cig/examples/obesity-glp1-monitoring.pf` — authoritative)

`Monitor_Pancreatitis` (a labeled ADE) and `Monitor_Body_Weight` (a guideline-specified desired outcome) each have `goal.verb=order`, the order in the `order.*` keys, the native `procedure` and `goal.noun_phrase`, a description, quoted sources, SNOMED CT coding, and the provenance/operationalization keys per `MetapropsSyntax.md`. Every monitoring action in that file passes `check_cig.mjs` — imitate them; `Monitor_Hypoglycemia` shows the conditional `applies_when` + `precondition` pattern, `Monitor_Anhedonia` shows numbered `source.1..3` with their quotes, and `Monitor_Pancreatitis` shows `monitoring_stance=symptom_triggered_only`. Do **not** add case-report-only actions just because an older example had them.

## Related patterns

- `MetapropsSyntax.md` (the canonical task contract), `MonitoringPlan.md`, `ActionComponent.md`, `StateAchievementGoal.md`.
