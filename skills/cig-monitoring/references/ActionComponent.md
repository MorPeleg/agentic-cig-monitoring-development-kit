# Design Pattern: Action + Component

**Intent:** The reusable building block for putting a task into a plan. Every task that appears in a plan does so through a `component` in that plan whose `task_definition` names the task. Used for both therapy actions (Therapy Plan) and monitoring actions (Monitoring sub-plans).

## PROforma elements

- Task blocks: `action` (or any task: `plan`, `decision`, `enquiry`)
- In the parent plan: `component :: 'X' ;` with `task_definition :: 'X' ;`, optional `schedule_constraint :: completed('Y') ;`
- Tools: `add_task` (creates the task **and** its component in the given plan; component name = task name), `add_component` (instantiates an existing task definition in another plan; rarely needed), `schedule_constraint` / `after` for ordering

## Rule of thumb

- The **component** carries plan membership and scheduling (`schedule_constraint`, `optional`, `cycle_repeat`, `number_of_cycles`, `ltwh` layout).
- The **task** (`action`, sub-`plan`, `decision`, `enquiry`) carries clinical meaning (`caption`, `description`, `metaprops` with `goal.verb` / `goal.noun_phrase`, `precondition`).
- One component points to exactly one task. Let `add_task` create both so the names match.

## Tool calls

Every call also takes `file`.

```
# Add an action to a plan (task + component in one call)
add_task(plan: "Obesity_Therapy", kind: "action", name: "Prescribe_GLP1",
         caption: "Prescribe GLP-1 receptor agonist (semaglutide) with dose escalation")

# The action's goal (State Achievement for therapy, Action Enactment for monitoring)
set_attribute(selector: "Prescribe_GLP1", attribute: "metaprops",
              value: "goal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months\ngoal.verb=achieve")

# Optional ordering: this component runs after a sibling in the same plan
add_task(plan: "<plan>", kind: "action", name: "<later_task>", after: ["<earlier_sibling>"])
```

## `.pf` text (from the example)

```
action  :: 'Prescribe_GLP1' ;
     caption :: 'Prescribe GLP-1 receptor agonist (semaglutide) with dose escalation' ;
     metaprops :: 'goal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months
goal.verb=achieve
' ;
end action.

plan  :: 'Obesity_Therapy' ;
     ...
     component :: 'Prescribe_GLP1' ;
          task_definition :: 'Prescribe_GLP1' ;
          ltwh :: 40,40,0,0;
     ...
end plan.
```

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

Component `Prescribe_GLP1` in `Obesity_Therapy` → action `Prescribe_GLP1`. The same shape is used for component `Monitor_Body_Weight` in `Monitor_Desired_State` → action `Monitor_Body_Weight`. A sequenced component looks like `Eligibility_Decision` in the root plan, which carries `schedule_constraint :: completed('Get_Eligibility_Data') ;`.

## Related patterns

- `TherapyPlan.md`, `MonitoringPlan.md`, `StateAchievementGoal.md`, `ActionEnactmentGoal.md`.
