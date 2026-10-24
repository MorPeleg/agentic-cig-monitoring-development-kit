# Reference: metaprops contract (canonical)

This is the **single, authoritative contract** for the `metaprops` attribute on every monitoring `action` in a PROforma CIG (`.pf`). The worked example (`cig/examples/obesity-glp1-monitoring.pf`), the `cig-monitoring` skill, `scripts/check_cig.mjs`, and the `cig-monitoring-review` reviewer all use **this** contract. If you change it, change it here first.

> Why this exists: in an earlier iteration the agent wrote placeholder metaprops (`source=s; instrument=i; provenance_type=p`) and a presence-only check still passed. This contract makes values explicit and checkable, so placeholders fail review.

## Grammar (Java properties)

```
metaprops := line ( NEWLINE line )*
line      := key "=" value
```

- **One `key=value` per line.** No line breaks inside a value. Everything after the first `=` is the value (a value may itself contain `=`, `;` and `:`).
- **Key order is not significant.** Composer and `format` sort the keys and escape `=` / `:` on save (`\=`, `\:`, which appear doubled as `\\=` inside the quoted `.pf` string). The tools read the escapes back as `=` and `:`. Write plain values; do not hand-escape. What matters is the required key *set* and the values.
- **Repeatable keys are numbered.** A bare key written twice collapses to the last value. Use `source.1=…`, `source.2=…` for several citations (a single citation may be the bare `source=…`). Number any other repeated key the same way.
- **Set it in one call.** `set_attribute(selector: "<action>", attribute: "metaprops", value: "<all lines>")` replaces the whole metaprops. Never write a second metaprops. To patch, read the current map (`get_component` or `export_json`), change it, and write the whole map back.
- The four `ServiceRequest.supportingInfo.*Codes` keys are **optional**; omit them until a coding pass, then add them to the map.

## Required keys

A monitoring `action` (its `goal.verb` is `order`) MUST carry all of these:

1. `goal.verb` — always `order` on a monitoring action.
2. `goal.noun_phrase` — the full order as one string: `ServiceRequest.intent = order; ServiceRequest.code = …; ServiceRequest.occurrenceTiming = …; ServiceRequest.patientInstruction = …` (`; ServiceRequest.performerInstruction = …` when present). See "Consistency with the goal".
3. `ServiceRequest.intent` — always `order`.
4. `ServiceRequest.code` — what is measured/ordered (e.g. `acute pancreatitis symptom screen with triggered lipase`).
5. `ServiceRequest.occurrenceTiming` — the schedule (e.g. `baseline, monthly x3, then q3mo`). Must name a real cadence/trigger, never a placeholder.
6. `ServiceRequest.patientInstruction` — what to ask/observe or how the patient measures.
7. `ServiceRequest.performerInstruction` — clinician/lab actions; **required when there is a triggered lab or urgent step**, otherwise omit.
8. `ServiceRequest.supportingInfo.findingCodes` — **optional, coding pass.** Observable findings (symptoms/signs) as `SYSTEM:code (label)` values, comma-separated. Example: `SNOMEDCT:422587007 (Nausea), SNOMEDCT:422400008 (Vomiting)`.
9. `ServiceRequest.supportingInfo.labCodes` — **optional, coding pass.** Laboratory observations (LOINC preferred; SNOMED when that is the project coding system). Same `SYSTEM:code (label)` form.
10. `ServiceRequest.supportingInfo.conditionCodes` — **optional, coding pass.** Diagnoses / conditions / ADEs being monitored.
11. `ServiceRequest.supportingInfo.medicationCodes` — **optional, coding pass.** Drugs / drug classes in scope (RxNorm or SNOMED).
12. `category` — one of `action_completion` | `desired_outcome` | `undesired_ade`.
13. `monitored_target` — the state/harm/action monitored **and the therapy task it traces back to, by its PROforma name** (e.g. `… (achieve goal of Prescribe_GLP1)`). Goals have no names of their own, so the task name is the traceability link (answers "which task relates to this source/harm?").
14. `applies_when` — the **population/condition under which this monitoring applies**, faithful to the cited source. If the source qualifies the harm to a sub-population (e.g. the label flags hypoglycemia *only with concomitant insulin or an insulin secretagogue*, or retinopathy *only in type 2 diabetes*), state that condition here — do **not** make the action unconditional. Use `all_patients_on_therapy` only when the source genuinely applies it to everyone on the drug. A population-scoped action MUST also carry an executable `precondition` (see below).
15. `provenance_type` — controlled vocab (below).
16. `source_kind` — controlled vocab (below).
17. `source` / `source.1..n` — one citation per key. Each value must contain a real identifier (PMID/PMC/DOI) or a named guideline/label/instrument — not a single letter.
18. `knowledge_origin` — where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
19. `guideline_status` — `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
20. `monitoring_stance` — the **cited source's stance on monitoring this**, controlled vocab (below). Critically, this captures *negative* recommendations: if a source says routine monitoring of X is of uncertain value / not recommended (e.g. routine serum calcitonin or thyroid ultrasound for C-cell risk), use `routine_not_recommended` and do **not** invent a routine surveillance schedule — scope the action to `symptom_triggered_only` or omit it. The chosen `occurrenceTiming`/`instrument` must not contradict this stance.
21. `literature_basis` — what the source(s) actually say (a real sentence, not `s`). When the action reflects the source's *own* monitoring instruction (e.g. label §5.9 "Monitor heart rate at regular intervals"), quote/paraphrase that instruction here rather than only an incidence statistic.
22. `assistant_invention` — what you designed yourself; `none` if fully source-based. Never a single letter.
23. `instrument` — how it is measured (patient symptom report | named lab test(s) | named questionnaire e.g. PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
24. `monitoring_frequency_basis` — justification for the chosen `occurrenceTiming`.
25. `trigger` — what prompts urgent/same-day assessment; `none` for routine surveillance.
26. `cq` — the competency-question id(s) this action supports.

## Controlled vocabularies

- `category`: `action_completion`, `desired_outcome`, `undesired_ade`.
- `provenance_type`: `guideline_specified`, `assistant_completed_from_guidelines`, `package_insert_specified`, `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized`, `assistant_independent_literature_search_and_operationalized`.
- `source_kind`: `clinical_guideline`, `package_insert`, `case_report`, `screening_instrument`, `safety_source`, `mechanism_reasoning`. Combine with `_plus_` (or `+`) when several apply (e.g. `safety_source_plus_screening_instrument`).
- `guideline_status`: `specified_as_a_guideline_monitoring_task`, `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance`: `recommended` (source recommends this monitoring), `symptom_triggered_only` (assess only on symptoms / events, no routine schedule), `routine_not_recommended` (source states routine surveillance is of uncertain value or not recommended), `proposed_by_assistant` (no source stance; assistant proposes the monitoring and justifies it).

## Value constraints (what the gate enforces — anti-placeholder)

A value FAILS review if any of these hold:

- It is empty, a single character, or an obvious placeholder (`o`, `p`, `s`, `i`, `t`, `tbd`, `xxx`, `...`).
- `ServiceRequest.intent` is not `order`.
- `ServiceRequest.occurrenceTiming` does not name a cadence/trigger (must contain a time unit such as `daily/weekly/monthly/q3mo/baseline/visit/escalation`).
- A triggered/urgent step has no `ServiceRequest.performerInstruction`.
- A `ServiceRequest.*` value differs between `goal.noun_phrase` and its own key, or is present on one side only.
- A `source` value contains no citation token (no PMID/PMC/DOI and no named guideline/label/instrument).
- `assistant_invention` is neither `none` nor a descriptive phrase.
- `provenance_type` / `source_kind` / `guideline_status` / `category` / `monitoring_stance` are outside the controlled vocab.
- `monitored_target` does not name both what is monitored and a task of this guideline it traces to.
- `applies_when` is missing, or is `all_patients_on_therapy` even though the cited source qualifies the harm to a sub-population (source-fidelity failure — see the `cig-monitoring-review` source-fidelity phase).
- `applies_when` names a sub-population but the action has no precondition, or the precondition uses no data item, or uses a data item no Enquiry asks for.
- `monitoring_stance=routine_not_recommended` but `occurrenceTiming` still names a routine schedule (a `baseline`/`monthly`/`q3mo` cadence) rather than being symptom/event-triggered — the operationalization contradicts the cited stance.

## Consistency with the goal

The `ServiceRequest.*` keys MUST match the same fields inside `goal.noun_phrase`, value for value (the goal states the order; the separate keys make it queryable alongside provenance). Both live in the same metaprops map. See `ActionEnactmentGoal.md`.

## Population-scoped monitoring → executable `precondition`

When `applies_when` names a sub-population rather than `all_patients_on_therapy`, also gate the monitoring action with a `precondition` that is a PROforma expression over a data item the eligibility/baseline Enquiry asks for, so the scoping is executable, not only documented in the text. Add the data item and its source if they do not exist yet. A sentence such as "concomitant insulin or insulin secretagogue therapy = true" is not a precondition. Example for the label's concomitant-insulin qualification on hypoglycemia (every call also takes `file`):

```
add_data_item(name: "on_insulin_or_secretagogue", type: "boolean", caption: "On concomitant insulin or an insulin secretagogue?")
set_attribute(selector: "on_insulin_or_secretagogue", attribute: "description",
              value: "Concomitant insulin or insulin secretagogue (sulfonylurea, meglitinide) therapy; scopes hypoglycemia monitoring per the semaglutide label (Warnings and Precautions 5.4)")
add_source(task: "Get_Eligibility_Data", data: "on_insulin_or_secretagogue")
set_attribute(selector: "Monitor_Hypoglycemia", attribute: "precondition", value: "on_insulin_or_secretagogue = true")
check_expression(expression: "on_insulin_or_secretagogue = true")
```

In the `.pf` (from the example):

```
     source :: 'on_insulin_or_secretagogue' ;
          data_definition :: 'on_insulin_or_secretagogue' ;
...
action  :: 'Monitor_Hypoglycemia' ;
     ...
     precondition ::on_insulin_or_secretagogue = true;
end action.
...
data  :: 'on_insulin_or_secretagogue' ;
     type :: boolean ;
     description :: 'Concomitant insulin or insulin secretagogue (sulfonylurea, meglitinide) therapy; scopes hypoglycemia monitoring per the semaglutide label (Warnings and Precautions 5.4)' ;
end data.
```

`lint` and `check_expression` type-check the precondition; `check_cig.mjs` fails a sub-population action without one, and the `cig-monitoring-review` source-fidelity phase checks that an action whose cited source qualifies the harm carries both a faithful `applies_when` and the precondition.

## Worked value (labeled ADE — acute pancreatitis)

Coding keys are optional; the first block is the complete `value` for `set_attribute(selector: "Monitor_Pancreatitis", attribute: "metaprops", value: …)` without codes, in the sorted order Composer stores (order does not matter when you write it).

```
ServiceRequest.code=acute pancreatitis symptom screen with triggered lipase
ServiceRequest.intent=order
ServiceRequest.occurrenceTiming=each visit, with testing on symptoms
ServiceRequest.patientInstruction=report severe, persistent abdominal pain that may radiate to the back, with or without vomiting
ServiceRequest.performerInstruction=if suspected, discontinue GLP-1, measure serum lipase, and evaluate for pancreatitis
applies_when=all_patients_on_therapy
assistant_invention=none
category=undesired_ade
cq=CQ7
goal.noun_phrase=ServiceRequest.intent = order; ServiceRequest.code = acute pancreatitis symptom screen with triggered lipase; ServiceRequest.occurrenceTiming = each visit, with testing on symptoms; ServiceRequest.patientInstruction = report severe, persistent abdominal pain that may radiate to the back, with or without vomiting; ServiceRequest.performerInstruction = if suspected, discontinue GLP-1, measure serum lipase, and evaluate for pancreatitis
goal.verb=order
guideline_status=not_specified_as_a_guideline_monitoring_task
instrument=patient symptom report with triggered serum lipase
knowledge_origin=drug label warning
literature_basis=label warns of acute pancreatitis and advises discontinuation and evaluation if suspected; the label does not call for routine pancreatic-enzyme surveillance
monitored_target=acute pancreatitis as a labeled adverse effect of the GLP-1 prescription (Prescribe_GLP1)
monitoring_frequency_basis=symptom-triggered because pancreatitis presents acutely
monitoring_stance=symptom_triggered_only
provenance_type=package_insert_specified
source=Wegovy (semaglutide) US Prescribing Information, Warnings and Precautions: Acute Pancreatitis
source_kind=package_insert
trigger=severe persistent abdominal pain prompts drug hold and lipase testing
```

A coding-only patch reads this map, adds these four lines, and writes the whole map back (names, captions, `source`, and `occurrenceTiming` unchanged; no other line rewritten):

```
ServiceRequest.supportingInfo.findingCodes=SNOMEDCT:197456007 (Acute pancreatitis), SNOMEDCT:21522001 (Abdominal pain)
ServiceRequest.supportingInfo.labCodes=LOINC:2324-2 (Lipase [Enzymatic activity/volume] in Serum or Plasma)
ServiceRequest.supportingInfo.conditionCodes=SNOMEDCT:197456007 (Acute pancreatitis)
ServiceRequest.supportingInfo.medicationCodes=SNOMEDCT:14412009 (Semaglutide)
```

## Related

- `ActionEnactmentGoal.md` (the goal side + opt-in case-report source-quality rule)
- `MonitoringPlan.md` (where the actions live)
- `cig/examples/obesity-glp1-monitoring.pf` (the authoritative instantiation)
