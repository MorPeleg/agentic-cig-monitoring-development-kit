# Design Pattern: Monitoring Plan

**Intent:** A sub-`plan` of the Top-Level Plan composed of **three parallel** sub-plans:

1. **Monitor Actions** (`Monitor_Actions`) — monitor completion/enactment of the therapy recommendations.
2. **Monitor Desired Outcome States** (`Monitor_Desired_State`) — monitor whether desired states are achieved (the `achieve` goals from the Therapy Plan).
3. **Monitor Undesired ADEs** (`Monitor_Undesired_State`) — monitor undesired states / adverse drug effects (the `avoid` goals, plus labeled ADEs, mechanism-of-action harms, and — only if the user opted in — case-report risks).

The three sub-plans are parallel: they are all components of the Monitoring Plan with **no** `schedule_constraint` between them.

## PROforma elements

- Tasks: `plan` (monitoring plan and its three sub-plans), `action` (monitoring actions)
- Tools: `add_task` (no `after` between the sub-plans), `set_attribute` (metaprops, precondition)

## Tool calls

Every call also takes `file`.

```
# Monitoring plan in the root plan, after therapy (see TopLevelPlan.md)
add_task(plan: "<root>", kind: "plan", name: "Monitoring_Plan",
         caption: "Monitor therapy enactment, desired outcomes, and undesired effects in parallel",
         after: ["Obesity_Therapy"])

# three parallel sub-plans (no `after`)
add_task(plan: "Monitoring_Plan", kind: "plan", name: "Monitor_Actions",
         caption: "Monitor enactment of the therapy recommendations")
add_task(plan: "Monitoring_Plan", kind: "plan", name: "Monitor_Desired_State",
         caption: "Monitor whether desired outcome states are achieved")
add_task(plan: "Monitoring_Plan", kind: "plan", name: "Monitor_Undesired_State",
         caption: "Monitor undesired states and adverse drug effects")
```

Each sub-plan then gets its monitoring actions (`add_task(plan: "Monitor_Undesired_State", kind: "action", ...)`, one per item to monitor), each with an Action Enactment Goal and the full metaprops — see `ActionEnactmentGoal.md` and `MetapropsSyntax.md`. Never leave a sub-plan without actions; if a sub-plan has nothing to hold within the requested scope, omit it.

## `.pf` text (from the example)

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

- **Monitor Actions** ← therapy recommendations whose *enactment* is tracked (e.g. did the patient fill/take the GLP-1; did they do the prescribed activity).
- **Monitor Desired Outcome States** ← `achieve` goals and clinical goals (e.g. 5–10% weight reduction; reduced cardiometabolic risk computed from BP, lipids, glucose, A1C).
- **Monitor Undesired ADEs** ← `avoid` goals, ADEs from package inserts (e.g. acute pancreatitis), mechanism-of-action harms (e.g. reduced enjoyment of life / anhedonia), and case-report risks **only when the user explicitly includes them in scope**.

## Operationalizing the Undesired-ADE sub-plan (required)

Each action in **Monitor Undesired ADEs** must be **operationalized**, not just named. For every harm:

1. Map the harm/syndrome to **observable manifestations** (e.g. acute pancreatitis → severe persistent abdominal pain radiating to the back; anhedonia/depression → loss of interest/motivation, possible suicidality).
2. Choose an **instrument**: patient symptom report, named lab test, validated questionnaire (e.g. PHQ-9 and C-SSRS for mood/suicidality; CoEQ for cravings), or clinician exam.
3. Set a **frequency** with justification, and an **urgent trigger** for same-day assessment.
4. **Document provenance in the action's metaprops** (full contract in `MetapropsSyntax.md`): `source` / `source.1..n` (cite each), `knowledge_origin`, `guideline_status`, `literature_basis`, `assistant_invention` (separate source-based from self-designed), `monitoring_frequency_basis`, `trigger`, and the `ServiceRequest.*` order — plus `monitored_target` naming the therapy task the action traces to (**traceability**: a reviewer can see which monitoring task each source drove).
5. If the source limits the harm to a sub-population, set `applies_when` accordingly and add an executable `precondition` over an Enquiry data item (e.g. `Monitor_Hypoglycemia` → `on_insulin_or_secretagogue = true`).

**Case-report sources are opt-in.** Do not build them unless the user (or approved proposal) includes them. When used, they must document a harm *caused by/occurring during* the drug — not merely that symptoms resolve after stopping it (see the source-quality rule in `ActionEnactmentGoal.md`).

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

`Monitoring_Plan` has three parallel components → `Monitor_Actions` (`Monitor_GLP1_Adherence`, `Monitor_Lifestyle_Adherence`), `Monitor_Desired_State` (`Monitor_Body_Weight`, `Monitor_Body_Composition`, `Monitor_Cardiometabolic`, `Monitor_QoL`), and `Monitor_Undesired_State` (`Monitor_GI_ADE`, `Monitor_Pancreatitis`, `Monitor_Anhedonia`, `Monitor_Hypoglycemia` with its precondition).

## Related patterns

- `ActionComponent.md`, `ActionEnactmentGoal.md`, `TopLevelPlan.md`.
