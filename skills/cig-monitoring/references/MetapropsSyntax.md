# Reference: task contract (native fields + metaprops), canonical

This is the **single, authoritative contract** for what a monitoring or therapy `action` in a PROforma CIG (`.pf`) carries. The worked examples (`cig/examples/*.pf`), the `cig-monitoring` and `cig-formalization` skills, `scripts/check_cig.mjs`, and the `cig-monitoring-review` reviewer all use **this** contract. If you change it, change it here first.

> Why this exists: in an earlier iteration the agent wrote placeholder metaprops (`source=s; instrument=i; provenance_type=p`) and a presence-only check still passed. This contract makes values explicit and checkable, so placeholders fail review.

## Native fields first

Deontics Composer shows a task's **native fields** in its properties panel: caption, description, procedure, conditions, and the **Ontology coding** field. Use them for what they are for, and keep `metaprops` for the goal, the structured order and provenance, which have no native field. Every value is written with the proforma tools (`set_attribute`), never by hand.

| Content | Native field / key | Monitoring action | Therapy action |
|---|---|---|---|
| One-line label | `caption` | required | required |
| What is monitored and why it was modelled | `description` | required | required |
| The instruction to carry out | `procedure` | required: the order (below) | recommended: dose, titration, how to deliver |
| Population gate | `precondition` | when `applies_when` is a sub-population | when the source scopes it |
| Clinical concept | **Ontology coding**: metaprop `ontology.coding=SNOMED:<id>` + `ontology.label` | coding pass (WARN until set) | coding pass (WARN until set) |
| Why it exists, verbatim | `source.N` + `quote.N` metaprops | at least one quote required | at least one quote required |

**No FHIR.** The old `ServiceRequest.*` keys (intent, code, occurrenceTiming, patientInstruction, performerInstruction, supportingInfo.*Codes) are no longer part of the contract; the gate fails any that remain. Convert an older guideline with `node scripts/migrate_metaprops.mjs <guideline.pf>`.

## Grammar (Java properties)

```
metaprops := line ( NEWLINE line )*
line      := key "=" value
```

- **One `key=value` per line.** No line breaks inside a value. Everything after the first `=` is the value (a value may itself contain `=`, `:` and `;`).
- **Key order is not significant.** Composer and `format` sort the keys and escape `=` / `:` on save (`\=`, `\:`, which appear doubled as `\\=` inside the quoted `.pf` string). The tools read the escapes back. Write plain values; do not hand-escape.
- **Repeatable keys are numbered.** A bare key written twice collapses to the last value. Use `source.1=…`, `source.2=…` for several citations, and `quote.1=…`, `quote.2=…` for their excerpts (a single citation may be the bare `source` / `quote`).
- **Set it in one call.** `set_attribute(selector: "<action>", attribute: "metaprops", value: "<all lines>")` replaces the whole map. Never write a second metaprops. To patch, read the current map (`get_component` or `export_json`), change it, and write the whole map back.

## The order (monitoring actions)

A monitoring action's goal is to have something done: an Action Enactment goal, `goal.verb=order`. The order is held three ways, which must agree:

1. **Structured keys** (queryable by the gate and the CQs):
   - `order.code` — what is measured or done (e.g. `acute pancreatitis symptom review with triggered serum lipase`).
   - `order.timing` — the schedule (e.g. `baseline, then each follow-up visit (at least monthly x3, then at least q3mo to month 12, then q6mo)`). Must name a real cadence or trigger.
   - `order.patient_instruction` — what the patient reports, does or measures.
   - `order.performer_instruction` — what the clinician or lab does; **required when there is a triggered test or an urgent step**, otherwise omit.
2. **`goal.noun_phrase`** — the plain-language order: `<order.code>, <order.timing>`.
3. **Native `procedure`** — the instruction Composer shows on the action: `<order.code>, <order.timing>. Patient: <order.patient_instruction>. Clinician: <order.performer_instruction>.` (the last sentence only when there is a performer instruction; capitalize the first letter).

The gate checks that `goal.noun_phrase` and `procedure` both state `order.code` and `order.timing`.

## Required metaprops on a monitoring action

1. `goal.verb` — always `order`.
2. `goal.noun_phrase` — see "The order".
3. `order.code`, `order.timing`, `order.patient_instruction` (and `order.performer_instruction` when triggered/urgent).
4. `category` — one of `action_completion` | `desired_outcome` | `undesired_ade`.
5. `monitored_target` — the state/harm/action monitored **and the therapy task it traces back to, by its PROforma name** (e.g. `… (achieve goal of Prescribe_GLP1)`). Goals have no names of their own, so the task name is the traceability link.
6. `applies_when` — the **population/condition under which this monitoring applies**, faithful to the cited source. If the source qualifies the harm to a sub-population (e.g. hypoglycemia *only with concomitant insulin or an insulin secretagogue*, retinopathy *only in type 2 diabetes*), state that condition here and gate the action with an executable `precondition` (below). Use the bare token `all_patients_on_therapy` only when the source applies it to everyone on the drug. Notes that do not narrow the population go in `literature_basis` or `monitoring_frequency_basis`.
7. `provenance_type` — controlled vocab (below).
8. `source_kind` — controlled vocab (below).
9. `source` / `source.1..n` — one citation per key, each with a real identifier (PMID/PMC/DOI) or a named guideline/label/instrument and its location (section, recommendation, table, page).
10. `quote` / `quote.1..n` — the **verbatim passage** of the matching `source.N` that this action was modelled from (see "Source quotes").
11. `knowledge_origin` — where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
12. `guideline_status` — `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
13. `monitoring_stance` — the **cited source's stance on monitoring this**, controlled vocab (below). If a source says routine monitoring of X is of uncertain value / not recommended (e.g. routine serum calcitonin or thyroid ultrasound for C-cell risk), use `routine_not_recommended` and scope the action to symptom-triggered assessment, or omit it. `order.timing` must not contradict the stance.
14. `literature_basis` — what the source(s) actually say, in your words. When the action reflects the source's *own* monitoring instruction (e.g. label §5.9 "Monitor heart rate at regular intervals"), paraphrase that instruction here.
15. `assistant_invention` — what you designed yourself; `none` if fully source-based. Never a single letter.
16. `instrument` — how it is measured (patient symptom report | named lab test(s) | named questionnaire, e.g. PHQ-9 / SARC-F / IWQOL-Lite | physical exam | clinician interview).
17. `monitoring_frequency_basis` — justification for `order.timing`.
18. `trigger` — what prompts urgent/same-day assessment; `none` for routine surveillance.
19. `cq` — the competency-question id(s) this action supports.
20. `ontology.coding` / `ontology.label` — Composer's Ontology coding (below); added by the coding pass.

The native `description` of a monitoring action states what is monitored and why it was modelled: `Monitors <monitored_target>. <literature_basis>.`

## Therapy actions

A therapy action carries a State Achievement goal (`goal.verb=achieve` or `avoid`, plus `goal.noun_phrase`), a `caption`, a `description` (the recommendation and why it was modelled, with its citations), a `procedure` when there is something concrete to do (dose and titration, minutes of activity, grams of protein), at least one `source.N` + `quote.N` pair, and the Ontology coding of the procedure or substance.

## Data items, candidates and arguments

- **Data items**: `caption`, `description`, `type`, `unit`, `range` are native. Add the Ontology coding of the observable or finding a data item records (e.g. BMI, diabetes mellitus), and a `source` + `quote` when the item comes from a specific passage (e.g. a contraindication).
- **Decision candidates and arguments**: `caption` and `description` are native; argument captions hold the rationale and any evidence grade (`[I, A]`). Put the `source` + `quote` the criterion came from in the argument's metaprops. Leave structural options such as `Eligible` / `Not_Eligible` uncoded rather than forcing a poor SNOMED match.

## Ontology coding

Composer stores its native "Ontology coding" property as the metaprop **`ontology.coding`**, written `SCHEME:code`; this kit uses SNOMED CT: `ontology.coding=SNOMED:197456007`. Composer's metaprops editor hides the key and shows the term as a field. Add **`ontology.label`** with the concept's preferred term (e.g. `Acute pancreatitis (disorder)`).

- Find codes with the **`snomed_search`** tool (EBI OLS4, restricted to SNOMED CT by `ontologyId=snomed`). The result's `shortForm` is `SNOMED_<id>` and its IRI `http://snomed.info/id/<id>`; record `SNOMED:<id>` and the label exactly as returned.
- Code what the element is about: the disorder, finding or measurement procedure a monitor watches; the procedure or substance a therapy action delivers; the observable or finding a data item records. One concept per element: pick the closest single concept, and record a narrower or broader choice in `assistant_invention` (monitors) or the description.
- The gate fails a malformed coding (not `SCHEME:code`, or a SNOMED id that is not 6–18 digits) and warns when a monitoring or therapy action has none.

## Source quotes

Each `quote.N` is the verbatim passage of `source.N` that justifies the element, prefixed with its page or section:

```
source.1=ADA 2026 Standards of Care in Overweight and Obesity, Pharmacologic Treatment of Obesity in Adults, Rec 2.29a (p.21)
quote.1=p.21, Rec 2.29a: "arrange for follow-up with individuals at least monthly during the first 3 months of treatment"
```

- **Copy exactly** from the source document (`cig/guidelines/*.md`, the PDF in `cig/guidelines/source/`, or `projects/<p>/resources/`). Mark omissions with `...`. Never paraphrase inside the quotation marks.
- **Keep it short**: the sentence or clause that carries the recommendation, at most about 25 words (the gate warns above 40). The quote is there to find and check the passage, not to reproduce the source.
- An element that cites sources must quote at least one of them (FAIL). A citation without its own quote is a WARN, for cited works that are not in the source library (e.g. an instrument's validation paper).

## Controlled vocabularies

- `category`: `action_completion`, `desired_outcome`, `undesired_ade`.
- `provenance_type`: `guideline_specified`, `assistant_completed_from_guidelines`, `package_insert_specified`, `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized`, `assistant_independent_literature_search_and_operationalized`.
- `source_kind`: `clinical_guideline`, `package_insert`, `case_report`, `screening_instrument`, `safety_source`, `mechanism_reasoning`. Combine with `_plus_` (or `+`) when several apply (e.g. `safety_source_plus_screening_instrument`).
- `guideline_status`: `specified_as_a_guideline_monitoring_task`, `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance`: `recommended` (source recommends this monitoring), `symptom_triggered_only` (assess only on symptoms / events, no routine schedule), `routine_not_recommended` (source states routine surveillance is of uncertain value or not recommended), `proposed_by_assistant` (no source stance; assistant proposes the monitoring and justifies it).

## Value constraints (what the gate enforces — anti-placeholder)

A monitoring action FAILS review if any of these hold:

- A required key is missing, empty, a single character, or an obvious placeholder (`o`, `p`, `s`, `i`, `t`, `tbd`, `xxx`, `...`).
- A `ServiceRequest.*` key remains (FHIR is no longer part of the contract).
- `caption`, `description` or `procedure` is empty, or `procedure` / `goal.noun_phrase` does not state `order.code` and `order.timing`.
- `order.timing` does not name a cadence or trigger (it must contain a time unit or trigger word such as `daily/weekly/monthly/q3mo/baseline/visit/escalation/symptom`).
- A triggered/urgent step has no `order.performer_instruction`.
- A `source` value contains no citation token (no PMID/PMC/DOI and no named guideline/label/instrument), or the action cites sources but quotes none, or a `quote.N` has no `source.N` or holds no text in double quotes.
- `ontology.coding` is malformed.
- `assistant_invention` is neither `none` nor a descriptive phrase.
- `provenance_type` / `source_kind` / `guideline_status` / `category` / `monitoring_stance` are outside the controlled vocab.
- `monitored_target` does not name both what is monitored and a task of this guideline it traces to.
- `applies_when` is missing, or is `all_patients_on_therapy` even though the cited source qualifies the harm to a sub-population (source-fidelity failure — see the `cig-monitoring-review` source-fidelity phase).
- `applies_when` names a sub-population but the action has no precondition, or the precondition uses no data item, or uses a data item no Enquiry asks for.
- `monitoring_stance=routine_not_recommended` but `order.timing` names a routine schedule (a `baseline`/`monthly`/`q3mo` cadence) rather than symptom/event-triggered assessment.

## Population-scoped monitoring → executable `precondition`

When `applies_when` names a sub-population rather than `all_patients_on_therapy`, also gate the monitoring action with a `precondition` that is a PROforma expression over a data item the eligibility/baseline Enquiry asks for, so the scoping is executable, not only documented. Add the data item and its source if they do not exist yet. A sentence such as "concomitant insulin or insulin secretagogue therapy = true" is not a precondition. Example (every call also takes `file`):

```
add_data_item(name: "on_insulin_or_secretagogue", type: "boolean", caption: "On concomitant insulin or an insulin secretagogue?")
set_attribute(selector: "on_insulin_or_secretagogue", attribute: "description",
              value: "Concomitant insulin or insulin secretagogue (sulfonylurea, meglitinide) therapy; scopes hypoglycemia monitoring per the semaglutide label (Warnings and Precautions 5.4)")
add_source(task: "Get_Eligibility_Data", data: "on_insulin_or_secretagogue")
set_attribute(selector: "Monitor_Hypoglycemia", attribute: "precondition", value: "on_insulin_or_secretagogue = true")
check_expression(expression: "on_insulin_or_secretagogue = true")
```

`lint` and `check_expression` type-check the precondition; `check_cig.mjs` fails a sub-population action without one, and the `cig-monitoring-review` source-fidelity phase checks that an action whose cited source qualifies the harm carries both a faithful `applies_when` and the precondition.

## Worked value (labeled ADE — acute pancreatitis)

The three calls for `Monitor_Pancreatitis` (every call also takes `file`). The metaprops are shown in the sorted order Composer stores; order does not matter when you write them.

```
set_attribute(selector: "Monitor_Pancreatitis", attribute: "description",
  value: "Monitors acute pancreatitis as a labeled adverse effect of semaglutide (Prescribe_Semaglutide). The label says to observe patients carefully for signs and symptoms after initiation and to discontinue if pancreatitis is suspected; lipase rises without symptoms are of unknown significance, so there is no routine enzyme surveillance.")
set_attribute(selector: "Monitor_Pancreatitis", attribute: "procedure",
  value: "Acute pancreatitis symptom review with triggered serum lipase, each follow-up visit, with testing on symptoms. Patient: stop semaglutide and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting. Clinician: if pancreatitis is suspected, discontinue semaglutide, measure serum lipase and initiate appropriate management.")
set_attribute(selector: "Monitor_Pancreatitis", attribute: "metaprops", value: <the lines below>)
```

```
applies_when=all_patients_on_therapy
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
ontology.coding=SNOMED:197456007
ontology.label=Acute pancreatitis (disorder)
order.code=acute pancreatitis symptom review with triggered serum lipase
order.patient_instruction=stop semaglutide and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting
order.performer_instruction=if pancreatitis is suspected, discontinue semaglutide, measure serum lipase and initiate appropriate management
order.timing=each follow-up visit, with testing on symptoms
provenance_type=package_insert_specified
quote=§5.2: "If pancreatitis is suspected, discontinue WEGOVY and initiate appropriate management."
source=Wegovy (semaglutide) US Prescribing Information (revised 02/2026), §5.2 Acute Pancreatitis
source_kind=package_insert
trigger=severe persistent abdominal pain prompts drug discontinuation and lipase testing
```

A **coding-only patch** reads this map, adds or changes only `ontology.coding` and `ontology.label`, and writes the whole map back; names, captions, descriptions, procedures, `order.*`, `source`/`quote` strings and Decision candidates stay unchanged (`check_cig.mjs --coding-patch` enforces this against the snapshot).

## Related

- `ActionEnactmentGoal.md` (the goal side + opt-in case-report source-quality rule)
- `MonitoringPlan.md` (where the actions live)
- `cig/examples/obesity-glp1-monitoring.pf` (the authoritative instantiation)
- `scripts/migrate_metaprops.mjs` (convert a guideline built on the old FHIR ServiceRequest contract)
