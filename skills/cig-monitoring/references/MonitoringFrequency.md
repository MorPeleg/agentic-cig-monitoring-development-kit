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
| Rhabdomyolysis | undesired_ade | each visit and around dose escalation; **CK/renal on symptoms** | severe muscle pain/cramps/weakness or dark urine | case report onset after dose increase + obesity follow-up | assistant_independent_literature_search_and_operationalized |
| Mood / anhedonia / suicidality (PHQ-9, C-SSRS) | undesired_ade | baseline then each visit (monthly x3, then q3mo) | positive depression screen or any suicidal ideation | label monitoring advice; screened whenever drug reviewed | mechanism_prompted_then_assistant_independent_literature_search_and_operationalized |
| Wernicke encephalopathy | undesired_ade | **event-driven** (whenever prolonged vomiting / reduced intake) | persistent vomiting + confusion/ataxia/eye signs | risk follows prolonged vomiting, not time on drug | assistant_independent_literature_search_and_operationalized |

## Choosing a frequency when none is given

1. Tie routine items to the **therapy follow-up cadence** (here: monthly x3, then q3mo) so monitoring happens whenever the drug is reviewed.
2. Make **acute/rare harms event-driven** with an explicit urgent trigger rather than a fixed calendar.
3. Place safety screens **around dose escalation** when the harm clusters there (GI, rhabdomyolysis).
4. Use **slower cadences** (q6mo) for slowly-changing outcomes (QoL).
5. Always write the justification into `monitoring_frequency_basis` in `metaprops` (see `MetapropsSyntax.md`).

## Related

- `MetapropsSyntax.md`, `ActionEnactmentGoal.md`, `MonitoringPlan.md`, `cig/examples/obesity-glp1-monitoring.owl`.
