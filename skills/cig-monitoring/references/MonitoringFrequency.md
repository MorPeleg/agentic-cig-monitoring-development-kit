# Reference: Monitoring Frequency (default-with-justification guidance)

Guidelines often state *what* and *how* to monitor but omit *how often*. When the guideline gives no cadence, **propose one and justify it** — never leave `ServiceRequest.occurrenceTiming` blank or a placeholder. Record the chosen cadence in the monitoring action's `ServiceRequest.occurrenceTiming` metaprop, repeat it in `goal.noun_phrase` and state it in the native `procedure`, with the justification in `monitoring_frequency_basis` (and the source passage that sets it, if any, in a `quote.N`). `ServiceRequest.occurrenceTiming` is the authoritative schedule; PROforma component cycles (`cycle_repeat`, `number_of_cycles`, `cycle_until`; see `TaskProperties.md`) are optional and not required by the kit.

This is generic guidance by **category of monitored item**. The cadence of a real CIG comes from its own guidelines and package inserts; adapt with justification, and do not copy a default where the source says something else.

## Defaults by category

| Category of monitored item | `category` | Default frequency (when the source gives none) | Urgent trigger | Typical basis | Typical `provenance_type` |
|---|---|---|---|---|---|
| Adherence to a therapy recommendation (drug taken as prescribed, titration followed, lifestyle change carried out) | `action_completion` | each therapy follow-up visit (the guideline's follow-up cadence) | none, or a missed titration step | the guideline's follow-up schedule | `assistant_completed_from_guidelines` |
| Desired outcome of therapy (the treatment target and its measurable components) | `desired_outcome` | baseline, then at each follow-up visit up to the guideline's efficacy checkpoint, then at the maintenance cadence | target not reached at the efficacy checkpoint | the guideline's efficacy checkpoint | `guideline_specified` when the guideline gives it, else `assistant_completed_from_guidelines` |
| Labeled ADE that presents acutely (symptom-triggered) | `undesired_ade` | symptom review at each visit; **test on symptoms**, no routine test | the label's warning signs | the label's warning and its own monitoring instruction | `package_insert_specified` |
| Labeled ADE that clusters at initiation or dose change | `undesired_ade` | each visit and around each dose change | persistent or severe symptoms | the label's description of when the effect occurs | `package_insert_specified` |
| ADE the source limits to a sub-population | `undesired_ade` | the cadence for that sub-population, gated by a `precondition` (below) | as the source states | the label or guideline passage that scopes it | `package_insert_specified` or `guideline_specified` |
| Slowly changing outcome (quality of life, long-term function) | `desired_outcome` | baseline, then every 6 months | marked decline | slow rate of change of the measure | `assistant_independent_literature_search_and_operationalized` |

## Choosing a frequency when none is given

1. Tie routine items to the **therapy follow-up cadence** the guideline sets, so monitoring happens whenever the therapy is reviewed.
2. Make **acute/rare harms event-driven** with an explicit urgent trigger rather than a fixed calendar.
3. Place safety screens **around initiation and dose changes** when the harm clusters there.
4. Use **slower cadences** (e.g. every 6 months) for slowly changing outcomes.
5. Always write the justification into `monitoring_frequency_basis` in the metaprops (see `MetapropsSyntax.md`), and tell the user that the cadence is proposed.

## When *not* to propose a routine schedule (negative recommendations)

"Always propose a frequency" applies only when monitoring is actually warranted. Two cases override the default:

- **The source advises against routine monitoring.** If a label or guideline states routine surveillance of a marker is of uncertain value or not recommended, set `monitoring_stance=routine_not_recommended` and either scope the action to **symptom-triggered only** (the warning signs → triggered work-up) or omit it. Do **not** manufacture a baseline/periodic screen the source recommends against.
- **The harm applies only to a sub-population.** Frequency is moot if the action should not exist for the whole cohort. If the label qualifies the ADE (e.g. only with a concomitant interacting medication, or only with a given comorbidity), record `applies_when` and gate the action with an executable `precondition` over an Enquiry data item (e.g. `on_interacting_medication = true`); choose the frequency for the applicable sub-population, not the whole cohort.

Record the stance and condition in the metaprops (`monitoring_stance`, `applies_when`) — see `MetapropsSyntax.md`. The `cig-monitoring-review` gate fails an action whose schedule contradicts the cited stance or whose applicability is broader than the source supports (`check_cig.mjs` catches a routine `ServiceRequest.occurrenceTiming` under `routine_not_recommended` and a sub-population without a precondition; the reviewer's source-fidelity phase checks the rest).

## Related

- `MetapropsSyntax.md`, `ActionEnactmentGoal.md`, `MonitoringPlan.md`, `TaskProperties.md`.
