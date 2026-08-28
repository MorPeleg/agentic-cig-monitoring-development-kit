# Reference: Monitoring Frequency (default-with-justification lookup)

Guidelines often state *what* and *how* to monitor but omit *how often*. When the guideline gives no cadence, **propose one and justify it** — never leave `occurrenceTiming` blank or a placeholder. Record the chosen cadence in the Goal's `noun_phrase` (`ServiceRequest.occurrenceTiming`) and in the Action's `metaprops` (`ServiceRequest.occurrenceTiming` + `monitoring_frequency_basis`).

This table is the **default lookup** for an obesity GLP-1 CIG. Each row gives a frequency, the trigger (if event-driven), the basis, and the `provenance_type` to record. Adapt with justification; do not copy blindly.

## Frequency table

| Monitored item | Category | Default frequency | Urgent trigger | Basis | provenance_type |
|---|---|---|---|---|---|
| GLP-1 prescription / dose-escalation adherence | action_completion | each visit: baseline, monthly x3, then q3mo | none | Endocrine Society obesity-pharmacotherapy follow-up | assistant_completed_from_guidelines |
| Diet / physical-activity adherence | action_completion | each visit (monthly x3, then q3mo) | none | guideline lifestyle co-therapy follow-up | assistant_completed_from_guidelines |
| Body weight / % change | desired_outcome | baseline, monthly x3, then q3mo | weight regain or <5% loss at 3 months | guideline 3-month efficacy checkpoint | guideline_specified |
| Body composition (lean vs fat, BIA) | desired_outcome | baseline then q3mo | disproportionate lean-mass loss | mechanism (rapid loss -> lean-mass loss) + clinic cadence | assistant_completed_from_guidelines |
| Cardiometabolic labs (HbA1c, lipids, glucose, BP) | desired_outcome | baseline then q3-6mo | worsening glycemia/BP | typical metabolic follow-up | guideline_specified |
| Quality of life (IWQOL-Lite / SF-36) | desired_outcome | baseline then q6mo | marked QoL decline | QoL changes slowly | assistant_independent_literature_search_and_operationalized |
| GI adverse effects (nausea/vomiting/diarrhea) | undesired_ade | each visit and around dose escalation | persistent vomiting / dehydration | label: GI effects cluster at titration | package_insert_specified |
| Acute pancreatitis | undesired_ade | each visit; **test on symptoms** | severe persistent abdominal pain | label warning; presents acutely | package_insert_specified |
| Mood / anhedonia / suicidality (PHQ-9, C-SSRS) | undesired_ade | baseline then each visit (monthly x3, then q3mo) | positive depression screen or any suicidal ideation | label monitoring advice; screened whenever drug reviewed | mechanism_prompted_then_assistant_independent_literature_search_and_operationalized |

## Choosing a frequency when none is given

1. Tie routine items to the **therapy follow-up cadence** (here: monthly x3, then q3mo) so monitoring happens whenever the drug is reviewed.
2. Make **acute/rare harms event-driven** with an explicit urgent trigger rather than a fixed calendar.
3. Place safety screens **around dose escalation** when the harm clusters there (GI effects).
4. Use **slower cadences** (q6mo) for slowly-changing outcomes (QoL).
5. Always write the justification into `monitoring_frequency_basis` in `metaprops` (see `MetapropsSyntax.md`).

## When *not* to propose a routine schedule (negative recommendations)

"Always propose a frequency" applies only when monitoring is actually warranted. Two cases override the default:

- **The source advises against routine monitoring.** If a label or guideline states routine surveillance of a marker is of uncertain value or not recommended (classic example: **routine serum calcitonin / thyroid ultrasound** for GLP-1 medullary-thyroid C-cell risk — FDA states its value is uncertain), set `monitoring_stance=routine_not_recommended` and either scope the action to **symptom-triggered only** (neck mass, dysphagia, hoarseness → triggered work-up) or omit it. Do **not** manufacture a baseline/periodic screen the source recommends against.
- **The harm applies only to a sub-population.** Frequency is moot if the action should not exist for the whole cohort. If the label qualifies the ADE (e.g. **hypoglycemia** only with concomitant insulin/secretagogue; **diabetic retinopathy** only in type 2 diabetes), record `applies_when` and gate the action with a `precondition`; choose the frequency for the applicable sub-population, not the whole cohort.

Record the stance and condition in `metaprops` (`monitoring_stance`, `applies_when`) — see `MetapropsSyntax.md`. The `cig-monitoring-review` source-fidelity phase fails an action whose schedule contradicts the cited stance or whose applicability is broader than the source supports.

## Related

- `MetapropsSyntax.md`, `ActionEnactmentGoal.md`, `MonitoringPlan.md`, `cig/examples/obesity-glp1-monitoring.owl`.
