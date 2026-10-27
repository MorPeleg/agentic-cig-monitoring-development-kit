# Design Pattern: Action Enactment Goal

**Intent:** The goal of a **monitoring** `action`. It expresses that some measurement/order should be *enacted*, with `goal.verb=order` plus a `goal.noun_phrase` that states the order as an HL7 FHIR `ServiceRequest`. This is how the Monitoring Plan operationalizes monitoring of action completion and of desired/undesired states.

## PROforma elements

- Task: `action` (created with `add_task` in a Monitoring sub-plan; see `ActionComponent.md`)
- Native task properties (`TaskProperties.md`): `caption` (one line), `description` (what is monitored and why it was modelled), `procedure` (the order as the instruction Composer shows), **`precondition`** (when the source scopes it to a sub-population), and the **Ontology coding** (the disorder, finding or measurement watched). Use Wait condition, Event trigger or the component's repeat properties only when the guideline needs them.
- Goal: metaprops keys `goal.verb` and `goal.noun_phrase` on the action (no separate Goal object; one goal per task)
- `goal.verb` = **`order`** for Action Enactment Goals (the verb list also allows `start`/`stop`; prefer `order` for monitoring orders). `check_cig.mjs` treats every action with `goal.verb=order` as a monitoring action.

## The order: HL7 FHIR ServiceRequest (required fields)

Encode the order so the *what / when / how* are always explicit. **Always include all of these** (never stop at intent + code):

- `ServiceRequest.intent` — always `order`. **Required.**
- `ServiceRequest.code` — what is measured or done (e.g. a named lab panel, a validated questionnaire, a symptom review with a triggered test). **Required.**
- `ServiceRequest.occurrenceTiming` — the schedule (e.g. `baseline, then each follow-up visit`). **Required**, and it must name a real cadence or trigger. If the guideline omits frequency, propose one and justify it (record the justification in `monitoring_frequency_basis`, see below and `MonitoringFrequency.md`).
- `ServiceRequest.patientInstruction` — what the patient reports, does or measures (e.g. report a warning symptom; measure at home under standardized conditions). **Required.**
- `ServiceRequest.performerInstruction` — clinician/lab actions, especially **triggered** tests (e.g. if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes, urinalysis). **Required** whenever there is a triggered lab or an urgent step; otherwise omit.

**The same order is stated three ways, which must agree:**

1. the `ServiceRequest.*` keys (queryable alongside the provenance);
2. `goal.noun_phrase` = `ServiceRequest.intent = order; ServiceRequest.code = …; ServiceRequest.occurrenceTiming = …; ServiceRequest.patientInstruction = …` plus `; ServiceRequest.performerInstruction = …` when present, with values identical to the keys (so no `;` inside a `ServiceRequest` value; use commas);
3. the native `procedure` = `<code>, <occurrenceTiming>. Patient: <patientInstruction>. Clinician: <performerInstruction>.` (the last sentence only when there is a performer instruction).

The gate checks that every `ServiceRequest` field agrees between the keys and `goal.noun_phrase`, and that `procedure` states the code and the occurrenceTiming. The intermediate `order.*` keys are not part of the contract (the gate fails them); convert an older guideline with `node scripts/migrate_metaprops.mjs <guideline.pf>`.

## Tool calls

Every call also takes `file` (the project's `guideline/<name>.pf`). Names are illustrative; the proposal's §6 fixes the real ones.

```
add_task(plan: "Monitor_Undesired_State", kind: "action", name: "Monitor_<Harm>",
         caption: "Monitor for <harm>")
set_attribute(selector: "Monitor_<Harm>", attribute: "description", value: "Monitors <monitored_target>. <literature_basis>.")
set_attribute(selector: "Monitor_<Harm>", attribute: "procedure", value: "<Code>, <occurrenceTiming>. Patient: <patientInstruction>. Clinician: <performerInstruction>.")
set_attribute(selector: "Monitor_<Harm>", attribute: "precondition", value: "on_interacting_medication = true")   # only for a sub-population
set_attribute(selector: "Monitor_<Harm>", attribute: "metaprops", value: "<all lines, plain>")
```

The worked block at the end of this file shows the full value.

## Metaprops on the action (provenance + operationalization)

Every monitoring action **must** carry a full `metaprops` attribute: Java-properties text, one `key=value` per line, set in one `set_attribute` call (numbered `source.1`, `source.2`, … for several citations, each with its `quote.1`, `quote.2`, …). This is how the CIG documents *what is monitored, how, when, what triggers escalation, and where the knowledge came from* — so a reviewer can tell guideline-sourced facts apart from your own design.

> **The required keys, controlled vocabulary, and value constraints are defined in `MetapropsSyntax.md` — that file is authoritative; this section summarizes it.** Write **no placeholder values** (`source=s`, `instrument=i`): the gate rejects them. Keep each value on one line, write it plain (the tools escape), and never write a second metaprops — to patch, read the map, change it, write it back whole.

**Canonical keys** (include every applicable one):

- **Goal**: `goal.verb=order`, `goal.noun_phrase=ServiceRequest.intent = order; ServiceRequest.code = …; …` (the `ServiceRequest` string above).
- **Order**: `ServiceRequest.intent=order`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, and `ServiceRequest.performerInstruction` (for triggered labs/clinician steps), matching `goal.noun_phrase` and the native `procedure`.
- `category` = `action_completion` | `desired_outcome` | `undesired_ade`.
- `monitored_target` = the state/harm/action this monitors **and the therapy task it traces back to, by name** (traceability — answers "which task relates to this source/harm?").
- `applies_when` = the population/condition the **source** attaches to this harm (e.g. *only with a concomitant interacting medication*); `all_patients_on_therapy` only when the source applies it universally. A sub-population action must also carry an executable `precondition` over an Enquiry data item (e.g. `on_interacting_medication = true`). **Do not make a conditional ADE universal.**
- `provenance_type` = e.g. `guideline_specified` | `assistant_completed_from_guidelines` | `package_insert_specified` | `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized` | `assistant_independent_literature_search_and_operationalized`.
- `source_kind` = `clinical_guideline` | `package_insert` | `case_report` | `screening_instrument` | `safety_source` …
- `source` / `source.1..n` = each citation (include a stable id where possible, e.g. PMID/PMC + title, or the guideline/label section and page).
- `quote` / `quote.1..n` = the **verbatim passage** of the matching source that the action was modelled from: at most about 25 words, in double quotes, prefixed with its page or section, copied exactly from the source document (`...` marks an omission). An action that cites sources but quotes none FAILs; a citation without its own quote is a WARN (for works not among the provided sources).
- `knowledge_origin` = where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
- `guideline_status` = `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance` = `recommended` | `symptom_triggered_only` | `routine_not_recommended` | `proposed_by_assistant`. Capture **negative** recommendations faithfully: if the source says routine surveillance of X is not recommended, use `routine_not_recommended` and do not invent a routine schedule.
- `literature_basis` = what the source(s) actually say, in your words. When the action reflects the source's own monitoring instruction (e.g. a label's "Monitor <measure> at regular intervals"), paraphrase that instruction, not just an incidence figure.
- `assistant_invention` = what **you** designed yourself (vs. sourced); use `none` if fully source-based. **Always state this explicitly** so source-based and self-designed parts are separable.
- `instrument` = how it is measured (patient symptom report | named lab test(s) | named validated questionnaire | physical exam | clinician interview).
- `monitoring_frequency_basis` = justification for the chosen `ServiceRequest.occurrenceTiming`.
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

A name like `Monitor_<Harm>` does **not** say *how* to monitor. For each ADE you must specify, in the `ServiceRequest.*` keys (and so in `goal.noun_phrase` and `procedure`) and the other metaprops:

1. **What to ask/observe** — map the syndrome to observable manifestations (e.g. acute pancreatitis → severe persistent abdominal pain radiating to the back) → `ServiceRequest.patientInstruction`.
2. **Which instrument/exam** — patient symptom report, named lab test, validated questionnaire, or clinician exam → `instrument` (+ `ServiceRequest.performerInstruction` for labs).
3. **When** — frequency with justification → `ServiceRequest.occurrenceTiming` + `monitoring_frequency_basis`.
4. **What triggers urgent/same-day assessment** → `trigger`.
5. **Source vs. invention** — cite and quote a source for each choice where possible; mark anything you designed as `assistant_invention`.

**Worked block (labeled ADE — acute pancreatitis from a package insert)**, the generic value from `MetapropsSyntax.md` as it lands in the `.pf` (`\\:` is the escape `format` writes, read back as `:`). It illustrates the contract; it is not a monitor every CIG needs.

```
action  :: 'Monitor_Pancreatitis' ;
     caption :: 'Monitor for acute pancreatitis' ;
     description :: 'Monitors acute pancreatitis as a labeled adverse effect of the drug (Prescribe_Drug). The label says to observe patients carefully for signs and symptoms after initiation and to discontinue if pancreatitis is suspected; lipase rises without symptoms are of unknown significance, so there is no routine enzyme surveillance.' ;
     metaprops :: 'ServiceRequest.code=acute pancreatitis symptom review with triggered serum lipase
ServiceRequest.intent=order
ServiceRequest.occurrenceTiming=each follow-up visit, with testing on symptoms
ServiceRequest.patientInstruction=stop the drug and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting
ServiceRequest.performerInstruction=if pancreatitis is suspected, discontinue the drug, measure serum lipase and initiate appropriate management
applies_when=all_patients_on_therapy
assistant_invention=serum lipase as the triggered confirmatory test
category=undesired_ade
cq=CQ7
goal.noun_phrase=ServiceRequest.intent = order; ServiceRequest.code = acute pancreatitis symptom review with triggered serum lipase; ServiceRequest.occurrenceTiming = each follow-up visit, with testing on symptoms; ServiceRequest.patientInstruction = stop the drug and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting; ServiceRequest.performerInstruction = if pancreatitis is suspected, discontinue the drug, measure serum lipase and initiate appropriate management
goal.verb=order
guideline_status=not_specified_as_a_guideline_monitoring_task
instrument=patient symptom report with triggered serum lipase
knowledge_origin=drug label warning
literature_basis=the label says to observe patients carefully for signs and symptoms of pancreatitis after initiation and to discontinue if pancreatitis is suspected
monitored_target=acute pancreatitis as a labeled adverse effect of the drug (Prescribe_Drug)
monitoring_frequency_basis=symptom-triggered because pancreatitis presents acutely
monitoring_stance=symptom_triggered_only
ontology.coding=SNOMED\\:197456007
ontology.label=Acute pancreatitis (disorder)
provenance_type=package_insert_specified
quote=§5.2\\: "If pancreatitis is suspected, discontinue ... and initiate appropriate management."
source=<Drug> US Prescribing Information, §5.2 Acute Pancreatitis
source_kind=package_insert
trigger=severe persistent abdominal pain prompts drug discontinuation and lipase testing
' ;
     procedure :: 'Acute pancreatitis symptom review with triggered serum lipase, each follow-up visit, with testing on symptoms. Patient: stop the drug and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting. Clinician: if pancreatitis is suspected, discontinue the drug, measure serum lipase and initiate appropriate management.' ;
end action.
```

## Guidance

- Create one monitoring action **per item to monitor** identified in Step 3, placed in the matching Monitoring sub-plan:
  - completion of a therapy recommendation → **Monitor Actions**
  - a desired state / `achieve` goal → **Monitor Desired Outcome States**
  - an undesired state / `avoid` goal / labeled ADE / (opt-in) case-report risk / (opt-in) mechanism-of-action harm → **Monitor Undesired ADEs**
- Always include a **frequency** (`ServiceRequest.occurrenceTiming`). Use the guideline's frequency if present; otherwise propose one and record the justification in `monitoring_frequency_basis`.
- Capture the **measurement method** in `ServiceRequest.code` / `ServiceRequest.patientInstruction` / `ServiceRequest.performerInstruction` and in `instrument` (lab test, validated questionnaire, home device, or clinician interview).
- **Every monitoring action gets the native properties and the full metaprops** (keys above): caption, description, procedure, a precondition where it applies, the Ontology coding; the goal, the `ServiceRequest.*` block, and provenance/operationalization with quoted sources. Keep `goal.noun_phrase` identical to the `ServiceRequest.*` values and `procedure` consistent with them.
- **Document sources and self-found knowledge** (`source` + `quote`, `knowledge_origin`, `assistant_invention`) so a reviewer can separate guideline-sourced facts from your own design — and tie each action to what it monitors via `monitored_target` (traceability).
- **Code it** in the coding pass: `ontology.coding=SNOMED:<id>` + `ontology.label` from `snomed_search` (one concept; note a narrower or broader choice in `assistant_invention`).

## Structural example

Every monitoring action in `cig/examples/ici-irae-monitoring.pf` passes `check_cig.mjs` and shows this pattern in a complete guideline: the `ServiceRequest.*` block on both the keys and `goal.noun_phrase`, the native procedure and description, numbered `source.N` + `quote.N`, SNOMED CT coding, and two sub-population monitors gated by a precondition. Use it to check the shape; which monitors to model comes from the user's guidelines and the approved proposal, not from the example.

## Related patterns

- `MetapropsSyntax.md` (the canonical task contract), `TaskProperties.md`, `MonitoringPlan.md`, `MonitoringFrequency.md`, `ActionComponent.md`, `StateAchievementGoal.md`.
