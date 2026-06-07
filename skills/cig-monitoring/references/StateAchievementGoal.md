# Design Pattern: State Achievement Goal

**Intent:** The goal of a **therapy** `Action` (and the target that desired/undesired monitoring assesses). It expresses a target *state* with a verb of `achieve` (desired state) or `avoid` (undesired state) plus a `noun_phrase`.

## PROforma elements

- Class: `Goal`
- Properties: `goal` (Task→Goal, links the action to its goal), data properties `verb` and `noun_phrase`
- `verb` is a `Goal` data property restricted to: `diagnose, treat, prevent_primary, prevent_secondary, prevent, avoid, start, stop, order, achieve`. State Achievement Goals use **`achieve`** or **`avoid`**.

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, `:` = project namespace.

```
# Desired state (achieve)
ObjectPropertyAssertion(pf:goal :Prescribe_GLP1 :Goal_achieve_bw_reduction)
ClassAssertion(pf:Goal :Goal_achieve_bw_reduction)
DataPropertyAssertion(pf:verb :Goal_achieve_bw_reduction "achieve")
DataPropertyAssertion(pf:noun_phrase :Goal_achieve_bw_reduction "body-weight reduction of 5-10 percent")

# Undesired state (avoid)
ObjectPropertyAssertion(pf:goal :Prescribe_Physical_Exercise :Goal_avoid_muscle_loss)
ClassAssertion(pf:Goal :Goal_avoid_muscle_loss)
DataPropertyAssertion(pf:verb :Goal_avoid_muscle_loss "avoid")
DataPropertyAssertion(pf:noun_phrase :Goal_avoid_muscle_loss "muscle loss")
```

## Guidance

- Attach a State Achievement Goal to **each therapy action** created in the Therapy Plan.
- `achieve` ⇒ the desired clinical goals from Step 3 (e.g. 5–10% weight reduction; reduction in cardiometabolic risk; QoL improvement). For abstraction goals (e.g. cardiometabolic risk), define the abstraction from measurable components (BP, lipids, glucose, A1C) and monitor those.
- `avoid` ⇒ undesired states from Step 3 (e.g. muscle loss/sarcopenia, ADEs, mechanism-of-action harms such as reduced enjoyment of life).
- Each desired/undesired state here is what the Monitoring Plan's "Monitor Desired/Undesired State" sub-plans assess (via Action Enactment Goals — see `ActionEnactmentGoal.md`).
- `noun_phrase` should be a concise, quantified phrase where the guideline gives numbers (e.g. "body-weight reduction of 5-10 percent").

## Worked example (`cig/examples/obesity-glp1.owl`)

`Prescribe_GLP1` → goal `Goal_achieve_body-weight_reduction_of_5-10_percent` (`verb=achieve`, `noun_phrase="body-weight reduction of 5-10 percent"`).

## Related patterns

- `ActionComponent.md`, `TherapyPlan.md`, `ActionEnactmentGoal.md`.
