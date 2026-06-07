# Design Pattern: Therapy Plan

**Intent:** A sub-`Plan` of the Top-Level Plan that holds the therapy recommendations. Its components are therapy `Action`s (one per intervention), each with a State Achievement Goal. It is usually gated by a `precondition` on the eligibility decision.

## PROforma elements

- Classes: `Plan`, `Component`, `Action`, `Goal`, `PROforma_Condition`
- Properties: `components` (Plan→Component), `taskref` (Component→Task), `goal` (Task→Goal), `precondition` (Task→PROforma_Condition)

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, `:` = project namespace.

```
# Therapy plan (referenced from the top-level plan's Therapy_Component)
Declaration(NamedIndividual(:Therapy_Plan))
ClassAssertion(pf:Plan :Therapy_Plan)
ObjectPropertyAssertion(pf:precondition :Therapy_Plan :PC_Eligible)
ClassAssertion(pf:PROforma_Condition :PC_Eligible)
DataPropertyAssertion(pf:string_representation :PC_Eligible "result_of(Eligibility_Decision) = Eligible")

# One therapy intervention = one Action + one Component (see ActionComponent.md)
ObjectPropertyAssertion(pf:components :Therapy_Plan :GLP1_Prescription_Component)
ClassAssertion(pf:Component :GLP1_Prescription_Component)
ObjectPropertyAssertion(pf:taskref :GLP1_Prescription_Component :Prescribe_GLP1)
ClassAssertion(pf:Action :Prescribe_GLP1)

# Each therapy action gets a State Achievement Goal (see StateAchievementGoal.md)
ObjectPropertyAssertion(pf:goal :Prescribe_GLP1 :Goal_achieve_bw_reduction)
ClassAssertion(pf:Goal :Goal_achieve_bw_reduction)
DataPropertyAssertion(pf:verb :Goal_achieve_bw_reduction "achieve")
DataPropertyAssertion(pf:noun_phrase :Goal_achieve_bw_reduction "body-weight reduction of 5-10 percent")
```

## Guidance

- Create **one Action + one Component per therapy intervention** (drug, diet, physical activity, etc.). Add each component to the therapy plan with `components`.
- Complete vague recommendations from the guideline collection or the web, and record the source (Step 3 of the skill).
- Give every therapy action a State Achievement Goal (`achieve` for desired states, `avoid` for undesired states).

## Worked example (`cig/examples/obesity-glp1.owl`)

`Obesity_Therapy` (Plan) has component `GLP1_Prescription_Component` → `Prescribe_GLP1` (Action) with goal `achieve "body-weight reduction of 5-10 percent"`, and a precondition `result_of(Eligibility_Decision) = Eligible`.

## Related patterns

- `ActionComponent.md`, `StateAchievementGoal.md`, `TopLevelPlan.md`.
