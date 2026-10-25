# Design Pattern: Therapy Plan

**Intent:** A sub-`plan` of the Top-Level Plan that holds the therapy recommendations. Its components are therapy `action`s (one per intervention), each with a State Achievement Goal. It is usually gated by a `precondition` on the eligibility decision.

## PROforma elements

- Tasks: `plan` (the therapy plan), `action` (one per intervention)
- Attributes: `precondition` (executable expression) on the plan; `caption` and `metaprops` (`goal.verb` / `goal.noun_phrase`) on each action
- Tools: `add_task`, `set_attribute`

## Tool calls

Every call also takes `file`.

```
# Therapy plan in the root plan, after the decision, gated by eligibility
add_task(plan: "<root>", kind: "plan", name: "Obesity_Therapy",
         caption: "GLP-1 pharmacotherapy plus lifestyle and lean-mass-preserving therapy",
         after: ["Eligibility_Decision"], precondition: "result_of(Eligibility_Decision) = Eligible")

# One therapy intervention = one action (add_task also creates its component; see ActionComponent.md)
add_task(plan: "Obesity_Therapy", kind: "action", name: "Prescribe_GLP1",
         caption: "Prescribe GLP-1 receptor agonist (semaglutide) with dose escalation")

# Each therapy action gets a State Achievement Goal (see StateAchievementGoal.md)
set_attribute(selector: "Prescribe_GLP1", attribute: "metaprops",
              value: "goal.verb=achieve\ngoal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months")
```

## `.pf` text (from the example)

```
plan  :: 'Obesity_Therapy' ;
     caption :: 'GLP-1 pharmacotherapy plus lifestyle and lean-mass-preserving therapy' ;
     precondition ::result_of(Eligibility_Decision) = Eligible;
     component :: 'Prescribe_GLP1' ;
          task_definition :: 'Prescribe_GLP1' ;
          ltwh :: 40,40,0,0;
     component :: 'Prescribe_Lifestyle' ;
          task_definition :: 'Prescribe_Lifestyle' ;
          ltwh :: 240,40,0,0;
     component :: 'Prescribe_Resistance_Exercise' ;
          task_definition :: 'Prescribe_Resistance_Exercise' ;
          ltwh :: 440,40,0,0;
end plan.
```

## Guidance

- Create **one action per therapy intervention** (drug, diet, physical activity, etc.) with `add_task` in the therapy plan. The therapy actions are parallel (no `after`) unless the guideline orders them.
- Complete vague recommendations from the guideline collection or the web, and record the source (Step 3 of the skill). Free-text detail (doses, targets) goes in the action's `caption`, `description` or `procedure`.
- Give every therapy action a State Achievement Goal (`achieve` for desired states, `avoid` for undesired states).
- The precondition must be an executable expression; `check_expression` it against the file.

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

`Obesity_Therapy` (plan, after `Eligibility_Decision`, `precondition :: result_of(Eligibility_Decision) = Eligible`) holds `Prescribe_GLP1` (`achieve` 5-10 percent body-weight reduction), `Prescribe_Lifestyle` (`achieve` reduced cardiometabolic risk) and `Prescribe_Resistance_Exercise` (`avoid` lean-mass loss).

## Related patterns

- `ActionComponent.md`, `StateAchievementGoal.md`, `TopLevelPlan.md`.
