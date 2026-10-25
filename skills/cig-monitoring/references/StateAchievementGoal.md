# Design Pattern: State Achievement Goal

**Intent:** The goal of a **therapy** `action` (and the target that desired/undesired monitoring assesses). It expresses a target *state* with `goal.verb=achieve` (desired state) or `goal.verb=avoid` (undesired state) plus a `goal.noun_phrase`.

## PROforma elements

- Task: `action` in the Therapy Plan
- Native fields: `caption`, `description` (the recommendation and why it was modelled, with its citations), `procedure` when there is something concrete to do (dose and titration, minutes of activity, grams of protein)
- Goal: metaprops keys `goal.verb` and `goal.noun_phrase` on the action (optional `goal.evidence_grade`). There is no separate Goal object, so each task has exactly one goal.
- `goal.verb` is one of: `diagnose, treat, prevent_primary, prevent_secondary, prevent, avoid, start, stop, order, achieve`. State Achievement Goals use **`achieve`** or **`avoid`**.
- Provenance: at least one `source.N` + `quote.N` pair (the verbatim passage the recommendation was modelled from), and the Ontology coding of the procedure or substance (`ontology.coding=SNOMED:<id>` + `ontology.label`, found with `snomed_search`). The gate fails a therapy action without a goal, caption, description or source (and a source without a quote); it warns on a missing procedure or coding.

## Tool calls

Every call also takes `file`. Set all keys in one `set_attribute` call (it replaces the whole metaprops).

```
# Desired state (achieve)
set_attribute(selector: "Prescribe_GLP1", attribute: "metaprops",
              value: "goal.verb=achieve\ngoal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months\nsource=...\nquote=...\nontology.coding=SNOMED:764283003\nontology.label=Semaglutide (substance)")

# Undesired state (avoid), with its native fields
set_attribute(selector: "Prescribe_Resistance_Exercise", attribute: "description", value: "Prescribes muscle-strengthening ...")
set_attribute(selector: "Prescribe_Resistance_Exercise", attribute: "procedure", value: "Muscle-strengthening activities ...")
set_attribute(selector: "Prescribe_Resistance_Exercise", attribute: "metaprops",
              value: "goal.verb=avoid\ngoal.noun_phrase=muscle / lean-mass loss (sarcopenia) during rapid weight loss\nsource=...\nquote=...\nontology.coding=SNOMED:386291006\nontology.label=Exercise promotion: strength training (procedure)")
```

## `.pf` text

```
action  :: 'Prescribe_Resistance_Exercise' ;
     caption :: 'Prescribe resistance training and adequate protein intake to preserve lean mass' ;
     description :: 'Prescribes muscle-strengthening activity and adequate protein intake to minimize the muscle loss that occurs with weight reduction on obesity medication (ADA 2026 Rec 2.20).' ;
     metaprops :: 'goal.noun_phrase=muscle / lean-mass loss (sarcopenia) during rapid weight loss
goal.verb=avoid
ontology.coding=SNOMED\\:386291006
ontology.label=Exercise promotion\\: strength training (procedure)
quote=p.19, Rec 2.20\\: "Counsel individuals treated with obesity medications on the need for adequate protein intake ... and muscle-strengthening activities ... to minimize muscle loss"
source=ADA 2026 Standards of Care in Overweight and Obesity, Pharmacologic Treatment of Obesity in Adults, Rec 2.20 (p.19)
' ;
     procedure :: 'Muscle-strengthening activities on at least 2 days per week, with adequate dietary protein during active weight reduction; refer to a registered dietitian nutritionist when intake is inadequate.' ;
end action.
```

## Guidance

- Attach a State Achievement Goal to **each therapy action** created in the Therapy Plan.
- `achieve` ⇒ the desired clinical goals from Step 3 (e.g. 5–10% weight reduction; reduction in cardiometabolic risk; QoL improvement). For abstraction goals (e.g. cardiometabolic risk), define the abstraction from measurable components (BP, lipids, glucose, A1C) and monitor those.
- `avoid` ⇒ undesired states from Step 3 (e.g. muscle loss/sarcopenia, ADEs, mechanism-of-action harms such as reduced enjoyment of life).
- Each desired/undesired state here is what the Monitoring Plan's "Monitor Desired/Undesired State" sub-plans assess (via Action Enactment Goals — see `ActionEnactmentGoal.md`). Because goals have no names, a monitor's `monitored_target` names the **therapy action** whose goal it traces to (e.g. `(avoid goal of Prescribe_Resistance_Exercise)`).
- `goal.noun_phrase` should be a concise, quantified phrase where the guideline gives numbers (e.g. "body-weight reduction of 5-10 percent within 6-12 months").
- Copy each `quote.N` exactly from the source document (at most about 25 words, in double quotes, prefixed with page/section; `...` marks an omission). Put the concrete instruction (dose, titration, activity minutes) in `procedure`, not in the goal.

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

`Prescribe_GLP1` → `goal.verb=achieve`, `goal.noun_phrase=body-weight reduction of 5-10 percent within 6-12 months`; `Prescribe_Lifestyle` → `achieve` reduced cardiometabolic risk; `Prescribe_Resistance_Exercise` → `avoid` muscle / lean-mass loss.

## Related patterns

- `ActionComponent.md`, `TherapyPlan.md`, `ActionEnactmentGoal.md`.
