# Design Pattern: Monitoring Plan

**Intent:** A sub-`plan` of the Top-Level Plan composed of **three parallel** sub-plans:

1. **Monitor Actions** (e.g. `Monitor_Actions`) — monitor completion/enactment of the therapy recommendations.
2. **Monitor Desired Outcome States** (e.g. `Monitor_Desired_State`) — monitor whether desired states are achieved (the `achieve` goals from the Therapy Plan).
3. **Monitor Undesired ADEs** (e.g. `Monitor_Undesired_State`) — monitor undesired states / adverse drug effects (the `avoid` goals and labeled ADEs; mechanism-of-action harms and case-report risks only if the user opted in).

The three sub-plans are parallel: they are all components of the Monitoring Plan with **no** `schedule_constraint` between them.

## PROforma elements

- Tasks: `plan` (monitoring plan and its three sub-plans), `action` (monitoring actions in Monitor Actions and Monitor Desired Outcome States), and in Monitor Undesired ADEs the **ADE Enquiry pattern** (`ADEMonitoringEnquiry.md`): an `action` that displays the ADEs, one `enquiry` per ADE and its test step (`action` or `decision`), or, when the sources name no test, its suspected-ADE alert `action`
- Native task properties (`cig/know-how/proforma/TaskProperties.md`) on each monitoring task: Caption, Description, procedure (the order; an Enquiry has none, so its description carries the order), **Precondition** (for a sub-population), **Ontology coding** (the disorder, finding or measurement watched), and when the guideline needs them Wait condition, Event trigger or the component's repeat properties
- Tools: `add_task` (no `after` between the sub-plans), `set_attribute` (description, procedure, metaprops, precondition), `add_data_item`, `add_source`, `add_candidate`, `add_argument`, `check_expression`, `snomed_search` and `loinc_search` (the coding pass)

## Tool calls

Every call also takes `file`.

```
# Monitoring plan in the root plan, after therapy (see TopLevelPlan.md)
add_task(plan: "<root>", kind: "plan", name: "Monitoring_Plan",
         caption: "Monitor therapy enactment, desired outcomes, and undesired effects in parallel",
         after: ["Therapy_Plan"])

# three parallel sub-plans (no `after`)
add_task(plan: "Monitoring_Plan", kind: "plan", name: "Monitor_Actions",
         caption: "Monitor enactment of the therapy recommendations")
add_task(plan: "Monitoring_Plan", kind: "plan", name: "Monitor_Desired_State",
         caption: "Monitor whether desired outcome states are achieved")
add_task(plan: "Monitoring_Plan", kind: "plan", name: "Monitor_Undesired_State",
         caption: "Monitor undesired states and adverse drug effects")
```

Monitor Actions and Monitor Desired Outcome States then get their monitoring actions (`add_task(plan: "Monitor_Desired_State", kind: "action", ...)`, one per item to monitor), each with an Action Enactment Goal, its native caption / description / procedure / precondition / Ontology coding and the full metaprops — see `ActionEnactmentGoal.md` and `MetapropsSyntax.md`. Monitor Undesired ADEs gets `Display_Potential_ADEs`, one ADE Enquiry per ADE (same goal and metaprops contract) and each Enquiry's test step — see `ADEMonitoringEnquiry.md`. Never leave a sub-plan without monitoring tasks; if a sub-plan has nothing to hold within the requested scope, omit it.

## `.pf` text

```
plan  :: 'Monitoring_Plan' ;
     caption :: 'Monitor therapy enactment, desired outcomes, and undesired effects in parallel' ;
     component :: 'Monitor_Actions' ;
          task_definition :: 'Monitor_Actions' ;
          ltwh :: 40,40,0,0;
     component :: 'Monitor_Desired_State' ;
          task_definition :: 'Monitor_Desired_State' ;
          ltwh :: 240,40,0,0;
     component :: 'Monitor_Undesired_State' ;
          task_definition :: 'Monitor_Undesired_State' ;
          ltwh :: 440,40,0,0;
end plan.
```

## Mapping Step-3 findings to the three sub-plans

- **Monitor Actions** ← therapy recommendations whose *enactment* is tracked (e.g. was the drug filled and taken as prescribed; was the prescribed lifestyle change carried out).
- **Monitor Desired Outcome States** ← `achieve` goals and clinical goals (the guideline's treatment targets; clinical abstractions computed from their measurable components).
- **Monitor Undesired ADEs** ← `avoid` goals and ADEs from the guidelines and package inserts; mechanism-of-action harms and case-report risks **only when the user explicitly includes them in scope**.

## Operationalizing the Undesired-ADE sub-plan (required)

Each monitoring task in **Monitor Undesired ADEs** must be **operationalized**, not just named, and made executable with the **ADE Enquiry pattern** (`ADEMonitoringEnquiry.md`): the plan starts with `Display_Potential_ADEs` (its caption a Markdown list of the ADEs); each ADE monitor is an **Enquiry** whose data items are the symptoms and bedside findings; a test step (`Order_<Test>` Action or `Tests_Ordering_Recommendations_<ADE>` Decision) after it orders the tests when a finding is positive (`a = "yes" or ...`), and an ADE whose sources name no test gets a `suspected_<ade>` item and an `Alert_Further_Examination_<ADE>` Action instead. For every harm:

1. Map the harm/syndrome to **observable manifestations** (the symptoms, signs or lab changes by which it presents). The symptoms and exam findings become the Enquiry's data items (SNOMED CT coded); the lab and imaging tests become its test step (LOINC coded).
2. Choose an **instrument**: patient symptom report, named lab test, validated questionnaire, or clinician exam.
3. Set a **frequency** with justification, and an **urgent trigger** for same-day assessment (`MonitoringFrequency.md`).
4. **Document provenance in the Enquiry's metaprops** (full contract in `MetapropsSyntax.md`): `source` / `source.1..n` (cite each) with `quote` / `quote.1..n` (the verbatim passage of each), `knowledge_origin`, `guideline_status`, `literature_basis`, `assistant_invention` (separate source-based from self-designed), `monitoring_frequency_basis`, `trigger`, and the `ServiceRequest.*` block (repeated in `goal.noun_phrase` and stated in the Enquiry's `description`, since an Enquiry has no procedure) — plus `monitored_target` naming the therapy task the monitor traces to (**traceability**: a reviewer can see which monitoring task each source drove).
5. If the source limits the harm to a sub-population, set `applies_when` accordingly and add an executable `precondition` over an eligibility/baseline Enquiry data item (e.g. `Monitor_<Harm>` → `on_interacting_medication = "yes"`).
6. **Code the harm** in the coding pass: `ontology.coding=SCT:<id> [<term>]` for the disorder or finding, found with `snomed_search`, on the Enquiry's component in `Monitor_Undesired_State`; code each finding data item with `snomed_search` and each ordered test with `loinc_search` (`LNC:<code> [<term>]`). Value form and locations: `cig/know-how/proforma/Ontology.md`.

**Case-report sources are opt-in.** Do not build them unless the user (or approved proposal) includes them. When used, they must document a harm *caused by/occurring during* the drug — not merely that symptoms resolve after stopping it (see the source-quality rule in `ActionEnactmentGoal.md`).

## Structural example

In `cig/examples/ccd-antithrombotic-monitoring.pf`, `Monitoring_Plan` holds all three parallel sub-plans:

```
plan Monitoring_Plan
  plan Monitor_Actions            4 Actions: Monitor_Antithrombotic_Adherence, Monitor_Regimen_Duration,
                                  Monitor_NSAID_Avoidance, Monitor_PPI_Continued_Need
  plan Monitor_Desired_State      1 Action: Monitor_Ischemic_Events (the absence of ischemic events, the achieve goal of every drug action)
  plan Monitor_Undesired_State    Display_Potential_ADEs, then 17 ADE Enquiries, each with its test step or suspected-ADE alert (ADEMonitoringEnquiry.md)
```

It shows the two kinds of scoped monitor:

- **Drug-gated monitors.** A monitor that watches one drug (e.g. `Monitor_Ticagrelor_Dyspnea`) keeps `applies_when=all_patients_on_therapy`, since it applies to everyone on that drug, and runs only for the regimens that contain the drug through a precondition over the Decision results: `result_of(P2Y12_Agent_Decision) = Ticagrelor`. The gate WARNs on this combination; the example's approved proposal records the convention.
- **Sub-population monitors.** `Monitor_PPI_Hypomagnesemia` narrows `applies_when` to the patients the label names (prolonged pantoprazole, or pantoprazole with digoxin or a diuretic), and its precondition reads the Enquiry data item `on_digoxin_or_diuretic` alongside the regimen results. `Monitor_PPI_Bone_Fracture` does the same with `previous_mi` (long-term pantoprazole during extended DAPT after MI).

Use it to see the shape of the plan and of the monitor contract. Which monitors to model comes from the user's guidelines and the approved proposal.

## Related patterns

- `ADEMonitoringEnquiry.md`, `ActionComponent.md`, `ActionEnactmentGoal.md`, `TopLevelPlan.md`, `cig/know-how/proforma/TaskProperties.md`, `MonitoringFrequency.md`.
