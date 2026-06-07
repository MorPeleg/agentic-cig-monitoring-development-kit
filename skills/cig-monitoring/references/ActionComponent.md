# Design Pattern: Action + Component

**Intent:** The reusable building block for putting a task into a plan. Every task that appears in a plan does so through a `Component` that `taskref`s it; the plan lists the component under `components`. Used for both therapy actions (Therapy Plan) and monitoring actions (Monitoring sub-plans).

## PROforma elements

- Classes: `Component`, `Action` (or any `Task`: `Plan`, `Decision`, `Enquiry`), `Schedule_Constraint`
- Properties: `components` (Plan→Component), `taskref` (Component→Task, functional), `goal` (Task→Goal), `scheduled_constraints` (Component→Schedule_Constraint), `conref` (Schedule_Constraint→Task)

## Rule of thumb

- The **Component** carries plan-membership and scheduling (`scheduled_constraints`/`conref`, `param_values`, `number_of_cycles`).
- The **Task** (`Action`, sub-`Plan`, `Decision`, `Enquiry`) carries clinical meaning (`goal`, `precondition`, `name`, `caption`).
- `taskref` is functional: one component points to exactly one task.

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, `:` = project namespace.

```
# Add an Action to a Plan via a Component
ObjectPropertyAssertion(pf:components :Some_Plan :Prescribe_GLP1_Component)
ClassAssertion(pf:Component :Prescribe_GLP1_Component)
ObjectPropertyAssertion(pf:taskref :Prescribe_GLP1_Component :Prescribe_GLP1)
ClassAssertion(pf:Action :Prescribe_GLP1)
DataPropertyAssertion(pf:caption :Prescribe_GLP1 "Prescribe GLP-1 analog")

# The action's goal (State Achievement for therapy, Action Enactment for monitoring)
ObjectPropertyAssertion(pf:goal :Prescribe_GLP1 :Goal_achieve_bw_reduction)

# Optional ordering: this component runs after another task
ObjectPropertyAssertion(pf:scheduled_constraints :Prescribe_GLP1_Component :SC_x)
ClassAssertion(pf:Schedule_Constraint :SC_x)
ObjectPropertyAssertion(pf:conref :SC_x :Some_Earlier_Task)
```

## Worked example (`cig/examples/obesity-glp1.owl`)

`GLP1_Prescription_Component` (Component) `taskref` → `Prescribe_GLP1` (Action), added to `Obesity_Therapy` via `components`. The same shape is used for `Weight_Monitoring_Component` → `Monitor_Weight` (Action).

## Related patterns

- `TherapyPlan.md`, `MonitoringPlan.md`, `StateAchievementGoal.md`, `ActionEnactmentGoal.md`.
