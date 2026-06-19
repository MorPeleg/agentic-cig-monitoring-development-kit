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
8. `provenance_type` — controlled vocab (below).
9. `source_kind` — controlled vocab (below).
10. `source` — one citation; **repeat the key** for each source. Each value must contain a real identifier (PMID/PMC/DOI) or a named guideline/label/instrument — not a single letter.
11. `knowledge_origin` — where the knowledge came from (guideline / skill-suggested mechanism / assistant found independently).
12. `guideline_status` — `specified_as_a_guideline_monitoring_task` | `not_specified_as_a_guideline_monitoring_task`.
13. `literature_basis` — what the source(s) actually say (a real sentence, not `s`).
14. `assistant_invention` — what you designed yourself; `none` if fully source-based. Never a single letter.
15. `instrument` — how it is measured (patient symptom report | named lab test(s) | named questionnaire e.g. PHQ-9 / C-SSRS / CoEQ / SF-36 / IWQOL-Lite | physical exam | clinician interview).
16. `monitoring_frequency_basis` — justification for the chosen `occurrenceTiming`.
17. `trigger` — what prompts urgent/same-day assessment; `none` for routine surveillance.
18. `cq` — the competency-question id(s) this action supports.

## Controlled vocabularies

- `category`: `action_completion`, `desired_outcome`, `undesired_ade`.
- `provenance_type`: `guideline_specified`, `assistant_completed_from_guidelines`, `package_insert_specified`, `mechanism_prompted_then_assistant_independent_literature_search_and_operationalized`, `assistant_independent_literature_search_and_operationalized`.
- `source_kind`: `clinical_guideline`, `package_insert`, `case_report`, `screening_instrument`, `safety_source`, `mechanism_reasoning`. Combine with `+` when several apply (e.g. `case_report_plus_clinical_safety_source`).
- `guideline_status`: `specified_as_a_guideline_monitoring_task`, `not_specified_as_a_guideline_monitoring_task`.

## Value constraints (what the verifier enforces — anti-placeholder)

A value FAILS review if any of these hold:

- It is empty, a single character, or an obvious placeholder (`o`, `p`, `s`, `i`, `t`, `tbd`, `xxx`, `...`).
- `ServiceRequest.intent` is not `order`.
- `ServiceRequest.occurrenceTiming` does not name a cadence/trigger (must contain a time unit such as `daily/weekly/monthly/q3mo/baseline/visit/escalation`).
- `source=` value contains no citation token (no PMID/PMC/DOI and no named guideline/label/instrument).
- `assistant_invention` is neither `none` nor a descriptive phrase.
- `provenance_type` / `source_kind` / `guideline_status` / `category` are outside the controlled vocab.
- `monitored_target` does not name both what is monitored and the goal/recommendation it traces to.

## Consistency with the Goal

The `ServiceRequest.*` block in `metaprops` MUST match the same fields in the **Action Enactment Goal's `noun_phrase`** (the Goal states the order; the Action's metaprops makes it self-contained alongside provenance). See `ActionEnactmentGoal.md`.

## Worked value (independently-found rare harm — rhabdomyolysis)

```
ServiceRequest.intent=order; ServiceRequest.code=rhabdomyolysis symptom screen + triggered CK/renal testing; ServiceRequest.occurrenceTiming=each visit and around dose escalation; ServiceRequest.patientInstruction=report severe/unexpected muscle pain, cramps, weakness, exercise intolerance, swelling, dark tea/cola-colored urine, or reduced urine output urgently; ServiceRequest.performerInstruction=if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes (K, phosphate), urinalysis for blood/myoglobin, assess hydration/AKI; category=undesired_ade; monitored_target=semaglutide-associated rhabdomyolysis (muscle injury, AKI risk), tracing to the GLP-1 prescription therapy recommendation; provenance_type=assistant_independent_literature_search_and_operationalized; source_kind=case_report_plus_clinical_safety_source; source=PMC12690205 From weight loss to muscle loss: rhabdomyolysis linked to semaglutide; source=Cureus Rhabdomyolysis Associated With Semaglutide Therapy: A Case Report; source=CDC/NIOSH Signs and Symptoms of Rhabdomyolysis; source=StatPearls Rhabdomyolysis NBK448168; knowledge_origin=assistant found source independently, not from skill examples; guideline_status=not_specified_as_a_guideline_monitoring_task; literature_basis=case report described bilateral lower-extremity pain/cramping and dark urine days after a dose increase 1.7->2.4 mg, advising CK when muscle pain/dark urine occur; CDC: main symptoms are muscle pain, dark urine, weakness, and CK is the accurate test; assistant_invention=screening frequency adapted to GLP-1 dose escalation and routine obesity follow-up; monitoring_frequency_basis=case onset shortly after dose increase plus Endocrine Society follow-up monthly x3 then q3mo; trigger=severe/unexpected muscle pain, cramps, weakness, or dark urine; cq=CQ7
```

## Related

- `ActionEnactmentGoal.md` (the Goal side + case-report source-quality rule)
- `MonitoringPlan.md` (where the actions live)
- `cig/examples/obesity-glp1-monitoring.owl` (the authoritative instantiation)
