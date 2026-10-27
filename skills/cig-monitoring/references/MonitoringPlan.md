# Design Pattern: Monitoring Plan

**Intent:** A sub-`plan` of the Top-Level Plan composed of **three parallel** sub-plans:

1. **Monitor Actions** (e.g. `Monitor_Actions`) — monitor completion/enactment of the therapy recommendations.
2. **Monitor Desired Outcome States** (e.g. `Monitor_Desired_State`) — monitor whether desired states are achieved (the `achieve` goals from the Therapy Plan).
3. **Monitor Undesired ADEs** (e.g. `Monitor_Undesired_State`) — monitor undesired states / adverse drug effects (the `avoid` goals and labeled ADEs; mechanism-of-action harms and case-report risks only if the user opted in).

The three sub-plans are parallel: they are all components of the Monitoring Plan with **no** `schedule_constraint` between them.

## PROforma elements

- Tasks: `plan` (monitoring plan and its three sub-plans), `action` (monitoring actions)
- Native task properties (`TaskProperties.md`) on each monitoring action: Caption, Description, procedure (the order), **Precondition** (for a sub-population), **Ontology coding** (the disorder, finding or measurement watched), and when the guideline needs them Wait condition, Event trigger or the component's repeat properties
- Tools: `add_task` (no `after` between the sub-plans), `set_attribute` (description, procedure, metaprops, precondition), `check_expression`, `snomed_search` (the coding pass)

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

Each sub-plan then gets its monitoring actions (`add_task(plan: "Monitor_Undesired_State", kind: "action", ...)`, one per item to monitor), each with an Action Enactment Goal, its native caption / description / procedure / precondition / Ontology coding and the full metaprops — see `ActionEnactmentGoal.md` and `MetapropsSyntax.md`. Never leave a sub-plan without actions; if a sub-plan has nothing to hold within the requested scope, omit it.

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

Each action in **Monitor Undesired ADEs** must be **operationalized**, not just named. For every harm:

1. Map the harm/syndrome to **observable manifestations** (the symptoms, signs or lab changes by which it presents).
2. Choose an **instrument**: patient symptom report, named lab test, validated questionnaire, or clinician exam.
3. Set a **frequency** with justification, and an **urgent trigger** for same-day assessment (`MonitoringFrequency.md`).
4. **Document provenance in the action's metaprops** (full contract in `MetapropsSyntax.md`): `source` / `source.1..n` (cite each) with `quote` / `quote.1..n` (the verbatim passage of each), `knowledge_origin`, `guideline_status`, `literature_basis`, `assistant_invention` (separate source-based from self-designed), `monitoring_frequency_basis`, `trigger`, and the `ServiceRequest.*` block (repeated in `goal.noun_phrase` and stated in the native `procedure`) — plus `monitored_target` naming the therapy task the action traces to (**traceability**: a reviewer can see which monitoring task each source drove).
5. If the source limits the harm to a sub-population, set `applies_when` accordingly and add an executable `precondition` over an Enquiry data item (e.g. `Monitor_<Harm>` → `on_interacting_medication = true`).
6. **Code the harm** in the coding pass: `ontology.coding=SNOMED:<id>` + `ontology.label` for the disorder or finding, found with `snomed_search`.

**Case-report sources are opt-in.** Do not build them unless the user (or approved proposal) includes them. When used, they must document a harm *caused by/occurring during* the drug — not merely that symptoms resolve after stopping it (see the source-quality rule in `ActionEnactmentGoal.md`).

## Structural example

In `cig/examples/ici-irae-monitoring.pf`, `Monitoring_Plan` holds two parallel sub-plans, `Monitor_Actions` and `Monitor_Undesired_State`; its scope (a toxicity guideline) has no desired-outcome monitors, so that sub-plan is omitted rather than left empty. Two of its ADE monitors are scoped to a sub-population by a precondition over Enquiry data items. Use it to see the shape; which monitors to model comes from the user's guidelines and the approved proposal.

## Related patterns

- `ActionComponent.md`, `ActionEnactmentGoal.md`, `TopLevelPlan.md`, `TaskProperties.md`, `MonitoringFrequency.md`.
