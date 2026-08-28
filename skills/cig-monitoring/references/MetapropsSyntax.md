# Reference: `pf:metaprops` Syntax (canonical)

This is the **single, authoritative grammar** for the `pf:metaprops` string asserted on every monitoring `Action`. The worked example (`cig/examples/obesity-glp1-monitoring.owl`), the `cig-monitoring` skill, and the `cig-monitoring-review` verifier all use **this** contract. If you change it, change it here first.

> Why this exists: in an earlier iteration the agent wrote placeholder metaprops (`source=s; instrument=i; provenance_type=p`) and a presence-only check still passed. This syntax makes values explicit and checkable, so placeholders fail review.

## Grammar

```
metaprops      := pair ( "; " pair )*
pair           := key "=" value
```

- **One single-line string.** Do **not** embed raw newlines or double-quote characters in the value. Use `; ` (semicolon + space) as the only separator between pairs.
- Keys appear in the **fixed order** listed below. `source` is the only **repeatable** key (repeat it once per citation). The four `ServiceRequest.supportingInfo.*Codes` keys are **optional**; omit them until a coding pass, then insert them after `performerInstruction` (or after `patientInstruction` if there is no performer step).
- Write the literal with the structured assertion tool (`add_data_property_assertion`) so the value is escaped server-side and never truncated. If you must use `add_axioms`, keep the literal single-line and escape `\` and `"`.

## Required keys (in order)

A monitoring `Action` (its goal has `verb=order`) MUST carry all of these:

1. `ServiceRequest.intent` — always `order`.
2. `ServiceRequest.code` — what is measured/ordered (e.g. `acute pancreatitis symptom screen with triggered lipase`).
3. `ServiceRequest.occurrenceTiming` — the schedule (e.g. `baseline, monthly x3, then q3mo`). Must name a real cadence/trigger, never a placeholder.
4. `ServiceRequest.patientInstruction` — what to ask/observe or how the patient measures.
5. `ServiceRequest.performerInstruction` — clinician/lab actions; **required when there is a triggered lab or urgent step**, otherwise omit.
6. `ServiceRequest.supportingInfo.findingCodes` — **optional, coding pass.** Observable findings (symptoms/signs) as `SYSTEM:code (label)` values, comma-separated. Example: `SNOMEDCT:422587007 (Nausea), SNOMEDCT:422400008 (Vomiting)`.
7. `ServiceRequest.supportingInfo.labCodes` — **optional, coding pass.** Laboratory observations (LOINC preferred; SNOMED when that is the project coding system). Same `SYSTEM:code (label)` form.
8. `ServiceRequest.supportingInfo.conditionCodes` — **optional, coding pass.** Diagnoses / conditions / ADEs being monitored.
9. `ServiceRequest.supportingInfo.medicationCodes` — **optional, coding pass.** Drugs / drug classes in scope (RxNorm or SNOMED).
10. `category` — one of `action_completion` | `desired_outcome` | `undesired_ade`.
11. `monitored_target` — the state/harm/action monitored **and the therapy goal or recommendation it traces back to** (traceability: answers "which task relates to this source/harm?").
12. `applies_when` — the **population/condition under which this monitoring applies**, faithful to the cited source. If the source qualifies the harm to a sub-population (e.g. the label flags hypoglycemia *only with concomitant insulin or an insulin secretagogue*, or retinopathy *only in type 2 diabetes*), state that condition here — do **not** make the action unconditional. Use `all_patients_on_therapy` only when the source genuinely applies it to everyone on the drug. A population-scoped action should also carry a PROforma `precondition` (see below).
13. `provenance_type` — controlled vocab (below).
14. `source_kind` — controlled vocab (below).
15. `source` — one citation; **repeat the key** for each source. Each value must contain a real identifier (PMID/PMC/DOI) or a named guideline/label/instrument — not a single letter.
16. `knowledge_origin` — where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
17. `guideline_status` — `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
18. `monitoring_stance` — the **cited source's stance on monitoring this**, controlled vocab (below). Critically, this captures *negative* recommendations: if a source says routine monitoring of X is of uncertain value / not recommended (e.g. routine serum calcitonin or thyroid ultrasound for C-cell risk), use `routine_not_recommended` and do **not** invent a routine surveillance schedule — scope the action to `symptom_triggered_only` or omit it. The chosen `occurrenceTiming`/`instrument` must not contradict this stance.
19. `literature_basis` — what the source(s) actually say (a real sentence, not `s`). When the action reflects the source's *own* monitoring instruction (e.g. label §5.9 "Monitor heart rate at regular intervals"), quote/paraphrase that instruction here rather than only an incidence statistic.
20. `assistant_invention` — what you designed yourself; `none` if fully source-based. Never a single letter.
21. `instrument` — how it is measured (patient symptom report | named lab test(s) | named questionnaire e.g. PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
22. `monitoring_frequency_basis` — justification for the chosen `occurrenceTiming`.
23. `trigger` — what prompts urgent/same-day assessment; `none` for routine surveillance.
24. `cq` — the competency-question id(s) this action supports.

## Controlled vocabularies

- `category`: `action_completion`, `desired_outcome`, `undesired_ade`.
- `provenance_type`: `guideline_specified`, `assistant_completed_from_guidelines`, `package_insert_specified`, `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized`, `assistant_independent_literature_search_and_operationalized`.
- `source_kind`: `clinical_guideline`, `package_insert`, `case_report`, `screening_instrument`, `safety_source`, `mechanism_reasoning`. Combine with `+` when several apply (e.g. `case_report_plus_clinical_safety_source`).
- `guideline_status`: `specified_as_a_guideline_monitoring_task`, `not_specified_as_a_guideline_monitoring_task`.
- `monitoring_stance`: `recommended` (source recommends this monitoring), `symptom_triggered_only` (assess only on symptoms / events, no routine schedule), `routine_not_recommended` (source states routine surveillance is of uncertain value or not recommended), `proposed_by_assistant` (no source stance; assistant proposes the monitoring and justifies it).

## Value constraints (what the verifier enforces — anti-placeholder)

A value FAILS review if any of these hold:

- It is empty, a single character, or an obvious placeholder (`o`, `p`, `s`, `i`, `t`, `tbd`, `xxx`, `...`).
- `ServiceRequest.intent` is not `order`.
- `ServiceRequest.occurrenceTiming` does not name a cadence/trigger (must contain a time unit such as `daily/weekly/monthly/q3mo/baseline/visit/escalation`).
- `source=` value contains no citation token (no PMID/PMC/DOI and no named guideline/label/instrument).
- `assistant_invention` is neither `none` nor a descriptive phrase.
- `provenance_type` / `source_kind` / `guideline_status` / `category` / `monitoring_stance` are outside the controlled vocab.
- `monitored_target` does not name both what is monitored and the goal/recommendation it traces to.
- `applies_when` is missing, or is `all_patients_on_therapy` even though the cited source qualifies the harm to a sub-population (source-fidelity failure — see the `cig-monitoring-review` source-fidelity phase).
- `monitoring_stance=routine_not_recommended` but `occurrenceTiming` still names a routine schedule (a `baseline`/`monthly`/`q3mo` cadence) rather than being symptom/event-triggered — the operationalization contradicts the cited stance.

## Consistency with the Goal

The `ServiceRequest.*` block in `metaprops` MUST match the same fields in the **Action Enactment Goal's `noun_phrase`** (the Goal states the order; the Action's metaprops makes it self-contained alongside provenance). See `ActionEnactmentGoal.md`.

## Population-scoped monitoring → assert a `precondition`

When `applies_when` names a sub-population rather than `all_patients_on_therapy`, also gate the monitoring `Action` with a PROforma `precondition` (a `PROforma_Condition` whose `string_representation` encodes the condition), so the scoping is machine-readable, not only documented in the string. Example for the label's concomitant-insulin qualification on hypoglycemia:

```
ObjectPropertyAssertion(pf:precondition Monitor_Hypoglycemia PC_On_Insulin_Or_Secretagogue)
ClassAssertion(pf:PROforma_Condition PC_On_Insulin_Or_Secretagogue)
DataPropertyAssertion(pf:string_representation PC_On_Insulin_Or_Secretagogue "concomitant insulin or insulin secretagogue therapy = true")
```

The `cig-monitoring-review` source-fidelity phase checks that an action whose cited source qualifies the harm carries both a faithful `applies_when` and (for a sub-population) a `precondition`.

## Worked value (labeled ADE — acute pancreatitis)

Coding keys are optional; the first line is a complete Action without codes. The second line shows the same Action after a coding-only patch (IRIs, captions, `source=`, and `occurrenceTiming` unchanged).

```
ServiceRequest.intent=order; ServiceRequest.code=acute pancreatitis symptom screen with triggered lipase; ServiceRequest.occurrenceTiming=each visit, with testing on symptoms; ServiceRequest.patientInstruction=report severe, persistent abdominal pain that may radiate to the back, with or without vomiting; ServiceRequest.performerInstruction=if suspected, discontinue GLP-1, measure serum lipase, and evaluate for pancreatitis; category=undesired_ade; monitored_target=acute pancreatitis as a labeled adverse effect of the GLP-1 prescription (Prescribe_GLP1); applies_when=all_patients_on_therapy; provenance_type=package_insert_specified; source_kind=package_insert; source=Wegovy (semaglutide) US Prescribing Information, Warnings and Precautions: Acute Pancreatitis; knowledge_origin=drug label warning; guideline_status=not_specified_as_a_guideline_monitoring_task; monitoring_stance=symptom_triggered_only; literature_basis=label warns of acute pancreatitis and advises discontinuation and evaluation if suspected; the label does not call for routine pancreatic-enzyme surveillance; assistant_invention=none; instrument=patient symptom report with triggered serum lipase; monitoring_frequency_basis=symptom-triggered because pancreatitis presents acutely; trigger=severe persistent abdominal pain prompts drug hold and lipase testing; cq=CQ7
```

After a coding-only patch, insert the typed keys after `performerInstruction` (do not rewrite any other pair):

```
ServiceRequest.supportingInfo.findingCodes=SNOMEDCT:197456007 (Acute pancreatitis), SNOMEDCT:21522001 (Abdominal pain); ServiceRequest.supportingInfo.labCodes=LOINC:2324-2 (Lipase [Enzymatic activity/volume] in Serum or Plasma); ServiceRequest.supportingInfo.conditionCodes=SNOMEDCT:197456007 (Acute pancreatitis); ServiceRequest.supportingInfo.medicationCodes=SNOMEDCT:14412009 (Semaglutide)
```

## Related

- `ActionEnactmentGoal.md` (the Goal side + opt-in case-report source-quality rule)
- `MonitoringPlan.md` (where the actions live)
- `cig/examples/obesity-glp1-monitoring.owl` (the authoritative instantiation)
