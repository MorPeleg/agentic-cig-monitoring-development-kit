# Design Pattern: Monitoring Plan

**Intent:** A sub-`Plan` of the Top-Level Plan composed of **three parallel** sub-`Plan`s:

1. **Monitor Actions** — monitor completion/enactment of the therapy recommendations.
2. **Monitor Desired Outcome States** — monitor whether desired states are achieved (the `achieve` goals from the Therapy Plan).
3. **Monitor Undesired ADEs** — monitor undesired states / adverse drug effects (the `avoid` goals, plus labeled ADEs, mechanism-of-action harms, and — only if the user opted in — case-report risks).

The three sub-plans are parallel: they are all `components` of the Monitoring Plan with **no** `scheduled_constraints` between them.

## PROforma elements

- Classes: `Plan`, `Component`, `Action`, `Goal`
- Properties: `components`, `taskref`, `goal`

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, `:` = project namespace.

```
# Monitoring plan (referenced from the top-level plan's Monitoring_Component)
Declaration(NamedIndividual(:Monitoring_Plan))
ClassAssertion(pf:Plan :Monitoring_Plan)

# --- parallel sub-plan 1: Monitor Actions ---
ObjectPropertyAssertion(pf:components :Monitoring_Plan :MonitorActions_Component)
ClassAssertion(pf:Component :MonitorActions_Component)
ObjectPropertyAssertion(pf:taskref :MonitorActions_Component :Monitor_Actions)
ClassAssertion(pf:Plan :Monitor_Actions)

# --- parallel sub-plan 2: Monitor Desired Outcome States ---
ObjectPropertyAssertion(pf:components :Monitoring_Plan :MonitorDesired_Component)
ClassAssertion(pf:Component :MonitorDesired_Component)
ObjectPropertyAssertion(pf:taskref :MonitorDesired_Component :Monitor_Desired_State)
ClassAssertion(pf:Plan :Monitor_Desired_State)

# --- parallel sub-plan 3: Monitor Undesired ADEs ---
ObjectPropertyAssertion(pf:components :Monitoring_Plan :MonitorUndesired_Component)
ClassAssertion(pf:Component :MonitorUndesired_Component)
ObjectPropertyAssertion(pf:taskref :MonitorUndesired_Component :Monitor_Undesired_State)
ClassAssertion(pf:Plan :Monitor_Undesired_State)
```

Each of the three sub-plans then contains monitoring `Action`s (one per item to monitor), each with an Action Enactment Goal — see `ActionEnactmentGoal.md`.

## Mapping Step-3 findings to the three sub-plans

- **Monitor Actions** ← therapy recommendations whose *enactment* is tracked (e.g. did the patient fill/take the GLP-1; did they do the prescribed activity).
- **Monitor Desired Outcome States** ← `achieve` goals and clinical goals (e.g. 5–10% weight reduction; reduced cardiometabolic risk computed from BP, lipids, glucose, A1C).
- **Monitor Undesired ADEs** ← `avoid` goals, ADEs from package inserts (e.g. acute pancreatitis), mechanism-of-action harms (e.g. reduced enjoyment of life / anhedonia), and case-report risks **only when the user explicitly includes them in scope**.

## Operationalizing the Undesired-ADE sub-plan (required)

Each action in **Monitor Undesired ADEs** must be **operationalized**, not just named. For every harm:

1. Map the harm/syndrome to **observable manifestations** (e.g. acute pancreatitis → severe persistent abdominal pain radiating to the back; anhedonia/depression → loss of interest/motivation, possible suicidality).
2. Choose an **instrument**: patient symptom report, named lab test, validated questionnaire (e.g. PHQ-9 and C-SSRS for mood/suicidality; CoEQ for cravings), or clinician exam.
3. Set a **frequency** with justification, and an **urgent trigger** for same-day assessment.
4. **Document provenance on the Action via `pf:metaprops`** (full schema in `ActionEnactmentGoal.md`): `source` (cite each), `knowledge_origin`, `guideline_status`, `literature_basis`, `assistant_invention` (separate source-based from self-designed), `monitoring_frequency_basis`, `trigger`, and the `ServiceRequest.*` order — plus `monitored_target` linking the action back to the harm/therapy it addresses (**traceability**: a reviewer can see which monitoring task each source drove).

**Case-report sources are opt-in.** Do not instantiate them unless the user (or approved proposal) includes them. When used, they must document a harm *caused by/occurring during* the drug — not merely that symptoms resolve after stopping it (see the source-quality rule in `ActionEnactmentGoal.md`).

## Worked example (`cig/examples/obesity-glp1.owl`)

`Monitoing` (Plan) has three parallel components → `Monitor_Actions` (goal `achieve "actions monitored"`), `Monitor_Desired_State`, and `Monitor_Undesired_State`. The standalone `Monitor_Weight` Action (with a FHIR ServiceRequest goal) illustrates a monitoring action that would sit inside one of these sub-plans.

## Related patterns

- `ActionComponent.md`, `ActionEnactmentGoal.md`, `TopLevelPlan.md`.
