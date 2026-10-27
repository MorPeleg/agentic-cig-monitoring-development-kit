# Reference: task contract (native fields + metaprops), canonical

This is the **single, authoritative contract** for what a monitoring or therapy `action` in a PROforma CIG (`.pf`) carries. The `cig-monitoring` and `cig-formalization` skills, `scripts/check_cig.mjs`, and the `cig-monitoring-review` reviewer all use **this** contract. If you change it, change it here first.

> Why this exists: in an earlier iteration the agent wrote placeholder metaprops (`source=s; instrument=i; provenance_type=p`) and a presence-only check still passed. This contract makes values explicit and checkable, so placeholders fail review.

## Native fields first

Deontics Composer shows a task's **native properties** in its property sheet (see `TaskProperties.md`): caption, description, procedure, precondition and the other conditions, and the **Ontology coding**. Use them for what they are for. Keep `metaprops` for the goal, the HL7 FHIR `ServiceRequest` order and provenance, which have no native property. Write every value with the proforma tools (`set_attribute`), never by hand.

| Content | Native property / key | Monitoring action | Therapy action |
|---|---|---|---|
| One-line label | `caption` | required | required |
| What is monitored and why it was modelled | `description` | required | required |
| The instruction to carry out | `procedure` | required: the order (below) | recommended: dose, titration, how to deliver |
| Population gate | `precondition` | when `applies_when` is a sub-population | when the source scopes it |
| Clinical concept | **Ontology coding**: metaprop `ontology.coding=SNOMED:<id>` + `ontology.label` | coding pass (WARN until set) | coding pass (WARN until set) |
| Why it exists, verbatim | `source.N` + `quote.N` metaprops | at least one quote required | at least one quote required |

## Grammar (Java properties)

```
metaprops := line ( NEWLINE line )*
line      := key "=" value
```

- **One `key=value` per line.** No line breaks inside a value. Everything after the first `=` is the value (a value may itself contain `=` and `:`).
- **`ServiceRequest.*` values must not contain `;`.** `goal.noun_phrase` joins the five fields with `; `, and the gate splits on it to compare them with the keys. Use commas inside a value (e.g. `TSH, FT4, T3 when indicated`). Other keys may contain `;`.
- **Key order is not significant.** Composer and `format` sort the keys and escape `=` / `:` on save (`\=`, `\:`, which appear doubled as `\\=` inside the quoted `.pf` string). The tools read the escapes back. Write plain values; do not hand-escape.
- **Repeatable keys are numbered.** A bare key written twice collapses to the last value. Use `source.1=…`, `source.2=…` for several citations, and `quote.1=…`, `quote.2=…` for their excerpts. A single citation may use the bare `source` / `quote`.
- **Set it in one call.** `set_attribute(selector: "<action>", attribute: "metaprops", value: "<all lines>")` replaces the whole map. Never write a second metaprops. To patch, read the current map (`get_component` or `export_json`), change it, and write the whole map back.
- **Encoding.** Composer reads a `.pf` as windows-1252. In text properties, spell characters outside it in ASCII (`>=`, `<=`). In metaprops values, escape them as `\uXXXX`. `scripts/lib/proforma.mjs` (`setAttribute`, `setMetaprops`) does both, and the gate fails a file Composer cannot read.

## The order (monitoring actions): HL7 FHIR ServiceRequest

A monitoring action's goal is to have something done: an Action Enactment goal, `goal.verb=order`. The order is an **HL7 FHIR `ServiceRequest`**. The block records where the monitoring data item, its timing and its instructions came from, which is why it stays in the metaprops. It is held three ways, which must agree:

1. **The `ServiceRequest.*` keys:**
   - `ServiceRequest.intent`: always `order`.
   - `ServiceRequest.code`: what is measured or ordered (e.g. `acute pancreatitis symptom review with triggered serum lipase`).
   - `ServiceRequest.occurrenceTiming`: the schedule (e.g. `baseline, then each follow-up visit (at least monthly x3, then at least q3mo)`). It must name a real cadence or trigger.
   - `ServiceRequest.patientInstruction`: what the patient reports, does or measures.
   - `ServiceRequest.performerInstruction`: what the clinician or lab does. **Required when there is a triggered test or an urgent step**, otherwise omit it.
2. **`goal.noun_phrase`**: the same order as one string, `ServiceRequest.intent = order; ServiceRequest.code = …; ServiceRequest.occurrenceTiming = …; ServiceRequest.patientInstruction = …`, plus `; ServiceRequest.performerInstruction = …` when present. The values must be identical to the keys.
3. **Native `procedure`**: the instruction Composer shows on the action, `<code>, <occurrenceTiming>. Patient: <patientInstruction>. Clinician: <performerInstruction>.` Include the last sentence only when there is a performer instruction, and capitalize the first letter.

## Required metaprops on a monitoring action

1. `goal.verb`: always `order`.
2. `goal.noun_phrase`: see "The order".
3. `ServiceRequest.intent`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, plus `ServiceRequest.performerInstruction` when the step is triggered or urgent.
4. `category`: one of `action_completion` | `desired_outcome` | `undesired_ade`.
5. `monitored_target`: the state, harm or action monitored, **and the therapy task it traces back to, by its PROforma name** (e.g. `… (achieve goal of Prescribe_X)`). Goals have no names of their own, so the task name is the traceability link.
6. `applies_when`: the **population or condition under which this monitoring applies**, faithful to the cited source.
   - If the source qualifies the harm to a sub-population (e.g. a harm the label attaches *only to patients on an interacting medication*, or *only to patients with a given comorbidity*), state that condition here and gate the action with an executable `precondition` (below).
   - Use the bare token `all_patients_on_therapy` only when the source applies it to everyone on the drug.
   - Notes that do not narrow the population go in `literature_basis` or `monitoring_frequency_basis`.
7. `provenance_type`: controlled vocab (below).
8. `source_kind`: controlled vocab (below).
9. `source` / `source.1..n`: one citation per key. Each has a real identifier (PMID/PMC/DOI) or a named guideline, label or instrument, with its location (section, recommendation, table, page).
10. `quote` / `quote.1..n`: the **verbatim passage** of the matching `source.N` this action was modelled from (see "Source quotes").
11. `knowledge_origin`: where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
12. `guideline_status`: `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
13. `monitoring_stance`: the **cited source's stance on monitoring this**, controlled vocab (below).
    - If a source says routine monitoring of X is of uncertain value or not recommended (e.g. a label stating that routine screening with a marker or an imaging test is of uncertain value), use `routine_not_recommended`. Then scope the action to symptom-triggered assessment, or omit it.
    - `ServiceRequest.occurrenceTiming` must not contradict the stance.
14. `literature_basis`: what the sources actually say, in your words. When the action reflects the source's *own* monitoring instruction (e.g. a label's "Monitor <measurement> at regular intervals"), paraphrase that instruction here.
15. `assistant_invention`: what you designed yourself; `none` if fully source-based. Never a single letter.
16. `instrument`: how it is measured (patient symptom report | named lab test(s) | named questionnaire | physical exam | clinician interview).
17. `monitoring_frequency_basis`: the justification for `ServiceRequest.occurrenceTiming`.
18. `trigger`: what prompts urgent or same-day assessment; `none` for routine surveillance.
19. `cq`: the competency-question id(s) this action supports.
20. `ontology.coding` / `ontology.label`: Composer's Ontology coding (below), added by the coding pass.

The native `description` of a monitoring action states what is monitored and why it was modelled: `Monitors <monitored_target>. <literature_basis>.`

## Therapy actions

A therapy action carries:
- a State Achievement goal (`goal.verb=achieve` or `avoid`, plus `goal.noun_phrase`);
- a `caption`;
- a `description` (the recommendation and why it was modelled, with its citations);
- a `procedure` when there is something concrete to do (dose and titration, minutes of activity, grams of protein);
- at least one `source.N` + `quote.N` pair;
- the Ontology coding of the procedure or substance.

## Data items, candidates and arguments

- **Data items:** `caption`, `description`, `type`, `unit`, `range`, `derivation` and the Ontology coding are native (see `TaskProperties.md`). Add the Ontology coding of the observable or finding a data item records. Add a `source` + `quote` when the item comes from a specific passage, e.g. a contraindication.
- **Decision candidates and arguments:** `caption`, `description` and the Ontology coding are native. Argument captions hold the rationale and any evidence grade (`[I, A]`). Put the `source` + `quote` the criterion came from in the argument's metaprops. Leave structural options such as `Eligible` / `Not_Eligible` uncoded rather than forcing a poor match.

## Ontology coding

Composer stores its native "Ontology coding" property as the metaprop **`ontology.coding`**, written `SCHEME:code`. This kit uses SNOMED CT: `ontology.coding=SNOMED:197456007`. Composer's metaprops editor hides the key and shows the term as a property of its own. Add **`ontology.label`** with the concept's preferred term (e.g. `Acute pancreatitis (disorder)`).

- **Finding codes:** use the **`snomed_search`** tool (EBI OLS4, restricted to SNOMED CT by `ontologyId=snomed`). The result's `shortForm` is `SNOMED_<id>` and its IRI `http://snomed.info/id/<id>`. Record `SNOMED:<id>` and the label exactly as returned.
- **What to code:** what the element is about:
  - the disorder, finding or measurement a monitor watches;
  - the procedure or substance a therapy action delivers;
  - the observable or finding a data item records.
- **One concept per element:** pick the closest single concept. Record a narrower or broader choice in `assistant_invention` (monitors) or the description.
- **Gate:** it fails a malformed coding (not `SCHEME:code`, or a SNOMED id that is not 6–18 digits). It warns when a monitoring or therapy action has none.

## Source quotes

Each `quote.N` is the verbatim passage of `source.N` that justifies the element, prefixed with its page or section:

```
source.1=<Guideline name and year>, Rec 2.29a (p.21)
quote.1=p.21, Rec 2.29a: "arrange for follow-up with individuals at least monthly during the first 3 months of treatment"
```

- **Copy exactly** from the source document the user provided (`projects/<project_dir>/resources/`). Mark omissions with `...`. Never paraphrase inside the quotation marks.
- **Keep it short:** the sentence or clause that carries the recommendation, at most about 25 words. The gate warns above 40. The quote is there to find and check the passage, not to reproduce the source.
- **At least one quote per element.** An element that cites sources must quote at least one of them, or the gate FAILs. A citation without its own quote is only a WARN; this covers cited works that are not among the provided sources, such as an instrument's validation paper.

## Controlled vocabularies

- `category`: `action_completion`, `desired_outcome`, `undesired_ade`.
- `provenance_type`: `guideline_specified`, `assistant_completed_from_guidelines`, `package_insert_specified`, `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized`, `assistant_independent_literature_search_and_operationalized`.
- `source_kind`: `clinical_guideline`, `package_insert`, `case_report`, `screening_instrument`, `safety_source`, `mechanism_reasoning`. Combine with `_plus_` (or `+`) when several apply (e.g. `safety_source_plus_screening_instrument`).
- `guideline_status`: `specified_as_a_guideline_monitoring_task`, `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance`:
  - `recommended`: the source recommends this monitoring.
  - `symptom_triggered_only`: assess only on symptoms or events, with no routine schedule.
  - `routine_not_recommended`: the source states routine surveillance is of uncertain value or not recommended.
  - `proposed_by_assistant`: the source takes no stance; the assistant proposes the monitoring and justifies it.

## Value constraints (what the gate enforces — anti-placeholder)

A monitoring action FAILS review if any of these hold:

- **Missing or placeholder values:** a required key is missing, empty, a single character, or an obvious placeholder (`o`, `p`, `s`, `i`, `t`, `tbd`, `xxx`, `...`).
- **The order:**
  - `ServiceRequest.intent` is not `order`.
  - `ServiceRequest.occurrenceTiming` does not name a cadence or trigger. It must contain a time unit or trigger word, such as `daily/weekly/monthly/q3mo/baseline/visit/escalation/symptom`.
  - A triggered or urgent step has no `ServiceRequest.performerInstruction`.
  - A `ServiceRequest.*` value differs between `goal.noun_phrase` and its own key, is present on one side only, or contains `;`.
- **Native properties:** `caption`, `description` or `procedure` is empty, or `procedure` does not state `ServiceRequest.code` and `ServiceRequest.occurrenceTiming`.
- **Citations and quotes:**
  - A `source` value contains no citation token (no PMID/PMC/DOI, and no named guideline, label or instrument).
  - The action cites sources but quotes none.
  - A `quote.N` has no matching `source.N`, or holds no text in double quotes.
- **Coding:** `ontology.coding` is malformed.
- **Provenance values:**
  - `assistant_invention` is neither `none` nor a descriptive phrase.
  - `provenance_type`, `source_kind`, `guideline_status`, `category` or `monitoring_stance` is outside the controlled vocab.
  - `monitored_target` does not name both what is monitored and a task of this guideline it traces to.
- **Applicability:**
  - `applies_when` is missing, or is `all_patients_on_therapy` even though the cited source qualifies the harm to a sub-population.
  - `applies_when` names a sub-population, but the action has no precondition, the precondition uses no data item, or it uses a data item no Enquiry asks for.
- **Stance:** `monitoring_stance=routine_not_recommended`, but `ServiceRequest.occurrenceTiming` names a routine schedule rather than symptom- or event-triggered assessment.

## Population-scoped monitoring → executable `precondition`

`precondition` is a native task property: "If present, this condition must evaluate to true at the point when the task becomes active, otherwise the task will immediately be discarded without executing" (Composer property sheet).

When `applies_when` names a sub-population rather than `all_patients_on_therapy`, gate the monitoring action with a `precondition`. It must be a PROforma expression over a data item that the eligibility/baseline Enquiry asks for, so the scoping is executable and not only documented. Add the data item and its source if they do not exist yet. A sentence such as "patient takes an interacting medication = true" is not a precondition.

Example (every call also takes `file`):

```
add_data_item(name: "on_interacting_medication", type: "boolean", caption: "On the interacting medication the label names?")
add_source(task: "Get_Eligibility_Data", data: "on_interacting_medication")
set_attribute(selector: "Monitor_<Harm>", attribute: "precondition", value: "on_interacting_medication = true")
check_expression(expression: "on_interacting_medication = true")
```

`lint` and `check_expression` type-check the precondition. `check_cig.mjs` fails a sub-population action without one. The `cig-monitoring-review` source-fidelity phase checks that an action whose cited source qualifies the harm carries both a faithful `applies_when` and the precondition.

## Worked value (labeled ADE — acute pancreatitis)

These are the three calls for one monitoring action (every call also takes `file`). The metaprops are shown in the sorted order Composer stores; order does not matter when you write them.

```
set_attribute(selector: "Monitor_Pancreatitis", attribute: "description",
  value: "Monitors acute pancreatitis as a labeled adverse effect of the drug (Prescribe_Drug). The label says to observe patients carefully for signs and symptoms after initiation and to discontinue if pancreatitis is suspected; lipase rises without symptoms are of unknown significance, so there is no routine enzyme surveillance.")
set_attribute(selector: "Monitor_Pancreatitis", attribute: "procedure",
  value: "Acute pancreatitis symptom review with triggered serum lipase, each follow-up visit, with testing on symptoms. Patient: stop the drug and contact your clinician for severe or persistent abdominal pain that may spread to the back, with or without vomiting. Clinician: if pancreatitis is suspected, discontinue the drug, measure serum lipase and initiate appropriate management.")
set_attribute(selector: "Monitor_Pancreatitis", attribute: "metaprops", value: <the lines below>)
```

```
ServiceRequest.code=acute pancreatitis symptom review with triggered serum lipase
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
ontology.coding=SNOMED:197456007
ontology.label=Acute pancreatitis (disorder)
provenance_type=package_insert_specified
quote=§5.2: "If pancreatitis is suspected, discontinue ... and initiate appropriate management."
source=<Drug> US Prescribing Information, §5.2 Acute Pancreatitis
source_kind=package_insert
trigger=severe persistent abdominal pain prompts drug discontinuation and lipase testing
```

A **coding-only patch** reads this map, adds or changes only `ontology.coding` and `ontology.label`, and writes the whole map back. Names, captions, descriptions, procedures, the `ServiceRequest.*` block, the `source`/`quote` strings and the Decision candidates stay unchanged; `check_cig.mjs --coding-patch` enforces this against the snapshot.

## Related

- `TaskProperties.md`: Composer's native task, candidate and data-item properties.
- `ActionEnactmentGoal.md`: the goal side, plus the opt-in case-report source-quality rule.
- `MonitoringPlan.md`: where the actions live.
- `cig/examples/ici-irae-monitoring.pf`: a complete instantiation (structure only; its clinical content is immune checkpoint inhibitor toxicity).
- `scripts/migrate_metaprops.mjs`: brings an older guideline onto this contract.
