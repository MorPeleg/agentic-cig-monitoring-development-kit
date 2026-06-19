# Reference: `pf:metaprops` Syntax (canonical)

This is the **single, authoritative grammar** for the `pf:metaprops` string asserted on every monitoring `Action`. The worked example (`cig/examples/obesity-glp1-monitoring.owl`), the `cig-monitoring` skill, and the `cig-monitoring-review` verifier all use **this** contract. If you change it, change it here first.

> Why this exists: in an earlier iteration the agent wrote placeholder metaprops (`source=s; instrument=i; provenance_type=p`) and a presence-only check still passed. This syntax makes values explicit and checkable, so placeholders fail review.

## Grammar

```
metaprops      := pair ( "; " pair )*
pair           := key "=" value
```

- **One single-line string.** Do **not** embed raw newlines or double-quote characters in the value. Use `; ` (semicolon + space) as the only separator between pairs.
- Keys appear in the **fixed order** listed below. `source` is the only **repeatable** key (repeat it once per citation).
- Write the literal with the structured assertion tool (`add_data_property_assertion`) so the value is escaped server-side and never truncated. If you must use `add_axioms`, keep the literal single-line and escape `\` and `"`.

## Required keys (in order)

A monitoring `Action` (its goal has `verb=order`) MUST carry all of these:

1. `ServiceRequest.intent` — always `order`.
2. `ServiceRequest.code` — what is measured/ordered (e.g. `serum CK/CPK + renal panel when triggered`).
3. `ServiceRequest.occurrenceTiming` — the schedule (e.g. `baseline, monthly x3, then q3mo`). Must name a real cadence/trigger, never a placeholder.
4. `ServiceRequest.patientInstruction` — what to ask/observe or how the patient measures.
5. `ServiceRequest.performerInstruction` — clinician/lab actions; **required when there is a triggered lab or urgent step**, otherwise omit.
6. `category` — one of `action_completion` | `desired_outcome` | `undesired_ade`.
7. `monitored_target` — the state/harm/action monitored **and the therapy goal or recommendation it traces back to** (traceability: answers "which task relates to this source/harm?").
8. `applies_when` — the **population/condition under which this monitoring applies**, faithful to the cited source. If the source qualifies the harm to a sub-population (e.g. the label flags hypoglycemia *only with concomitant insulin or an insulin secretagogue*, or retinopathy *only in type 2 diabetes*), state that condition here — do **not** make the action unconditional. Use `all_patients_on_therapy` only when the source genuinely applies it to everyone on the drug. A population-scoped action should also carry a PROforma `precondition` (see below).
9. `provenance_type` — controlled vocab (below).
10. `source_kind` — controlled vocab (below).
11. `source` — one citation; **repeat the key** for each source. Each value must contain a real identifier (PMID/PMC/DOI) or a named guideline/label/instrument — not a single letter.
12. `knowledge_origin` — where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
13. `guideline_status` — `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
14. `monitoring_stance` — the **cited source's stance on monitoring this**, controlled vocab (below). Critically, this captures *negative* recommendations: if a source says routine monitoring of X is of uncertain value / not recommended (e.g. routine serum calcitonin or thyroid ultrasound for C-cell risk), use `routine_not_recommended` and do **not** invent a routine surveillance schedule — scope the action to `symptom_triggered_only` or omit it. The chosen `occurrenceTiming`/`instrument` must not contradict this stance.
15. `literature_basis` — what the source(s) actually say (a real sentence, not `s`). When the action reflects the source's *own* monitoring instruction (e.g. label §5.9 "Monitor heart rate at regular intervals"), quote/paraphrase that instruction here rather than only an incidence statistic.
16. `assistant_invention` — what you designed yourself; `none` if fully source-based. Never a single letter.
17. `instrument` — how it is measured (patient symptom report | named lab test(s) | named questionnaire e.g. PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
18. `monitoring_frequency_basis` — justification for the chosen `occurrenceTiming`.
19. `trigger` — what prompts urgent/same-day assessment; `none` for routine surveillance.
20. `cq` — the competency-question id(s) this action supports.

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

## Worked value (independently-found rare harm — rhabdomyolysis)

```
ServiceRequest.intent=order; ServiceRequest.code=rhabdomyolysis symptom screen + triggered CK/renal testing; ServiceRequest.occurrenceTiming=each visit and around dose escalation; ServiceRequest.patientInstruction=report severe/unexpected muscle pain, cramps, weakness, exercise intolerance, swelling, dark tea/cola-colored urine, or reduced urine output urgently; ServiceRequest.performerInstruction=if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes (K, phosphate), urinalysis for blood/myoglobin, assess hydration/AKI; category=undesired_ade; monitored_target=semaglutide-associated rhabdomyolysis (muscle injury, AKI risk), tracing to the GLP-1 prescription therapy recommendation; applies_when=all_patients_on_therapy, with heightened vigilance around dose escalation; provenance_type=assistant_independent_literature_search_and_operationalized; source_kind=case_report_plus_clinical_safety_source; source=PMC12690205 From weight loss to muscle loss: rhabdomyolysis linked to semaglutide; source=Cureus Rhabdomyolysis Associated With Semaglutide Therapy: A Case Report; source=CDC/NIOSH Signs and Symptoms of Rhabdomyolysis; source=StatPearls Rhabdomyolysis NBK448168; knowledge_origin=assistant found source independently, not from skill examples; guideline_status=not_specified_as_a_guideline_monitoring_task; monitoring_stance=symptom_triggered_only; literature_basis=case report described bilateral lower-extremity pain/cramping and dark urine days after a dose increase 1.7->2.4 mg, advising CK when muscle pain/dark urine occur; CDC: main symptoms are muscle pain, dark urine, weakness, and CK is the accurate test; assistant_invention=screening frequency adapted to GLP-1 dose escalation and routine obesity follow-up; monitoring_frequency_basis=case onset shortly after dose increase plus Endocrine Society follow-up monthly x3 then q3mo; trigger=severe/unexpected muscle pain, cramps, weakness, or dark urine; cq=CQ7
```

## Related

- `ActionEnactmentGoal.md` (the Goal side + case-report source-quality rule)
- `MonitoringPlan.md` (where the actions live)
- `cig/examples/obesity-glp1-monitoring.owl` (the authoritative instantiation)
