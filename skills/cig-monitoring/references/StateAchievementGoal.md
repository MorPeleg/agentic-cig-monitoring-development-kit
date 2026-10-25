# Design Pattern: State Achievement Goal

**Intent:** The goal of a **therapy** `action` (and the target that desired/undesired monitoring assesses). It expresses a target *state* with `goal.verb=achieve` (desired state) or `goal.verb=avoid` (undesired state) plus a `goal.noun_phrase`.

## PROforma elements

- Task: `action` in the Therapy Plan
- Goal: metaprops keys `goal.verb` and `goal.noun_phrase` on the action (optional `goal.evidence_grade`). There is no separate Goal object, so each task has exactly one goal.
- `goal.verb` is one of: `diagnose, treat, prevent_primary, prevent_secondary, prevent, avoid, start, stop, order, achieve`. State Achievement Goals use **`achieve`** or **`avoid`**.

## Tool calls

Every call also takes `file`. Set both keys in one `set_attribute` call (it replaces the whole metaprops).

```
# Desired state (achieve)
set_attribute(selector: "Prescribe_GLP1", attribute: "metaprops",
              value: "goal.verb=achieve\ngoal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months")

# Undesired state (avoid)
set_attribute(selector: "Prescribe_Resistance_Exercise", attribute: "metaprops",
              value: "goal.verb=avoid\ngoal.noun_phrase=muscle / lean-mass loss (sarcopenia) during rapid weight loss")
```

## `.pf` text (from the example)

```
action  :: 'Prescribe_Resistance_Exercise' ;
     caption :: 'Prescribe resistance training and adequate protein intake to preserve lean mass' ;
     metaprops :: 'goal.noun_phrase=muscle / lean-mass loss (sarcopenia) during rapid weight loss
goal.verb=avoid
' ;
end action.
```

## Guidance

- Attach a State Achievement Goal to **each therapy action** created in the Therapy Plan.
- `achieve` ⇒ the desired clinical goals from Step 3 (e.g. 5–10% weight reduction; reduction in cardiometabolic risk; QoL improvement). For abstraction goals (e.g. cardiometabolic risk), define the abstraction from measurable components (BP, lipids, glucose, A1C) and monitor those.
- `avoid` ⇒ undesired states from Step 3 (e.g. muscle loss/sarcopenia, ADEs, mechanism-of-action harms such as reduced enjoyment of life).
- Each desired/undesired state here is what the Monitoring Plan's "Monitor Desired/Undesired State" sub-plans assess (via Action Enactment Goals — see `ActionEnactmentGoal.md`). Because goals have no names, a monitor's `monitored_target` names the **therapy action** whose goal it traces to (e.g. `(avoid goal of Prescribe_Resistance_Exercise)`).
- `goal.noun_phrase` should be a concise, quantified phrase where the guideline gives numbers (e.g. "body-weight reduction of 5-10 percent within 6-12 months").

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

`Prescribe_GLP1` → `goal.verb=achieve`, `goal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months`; `Prescribe_Lifestyle` → `achieve` reduced cardiometabolic risk; `Prescribe_Resistance_Exercise` → `avoid` muscle / lean-mass loss.

## Related patterns

- `ActionComponent.md`, `TherapyPlan.md`, `ActionEnactmentGoal.md`.
