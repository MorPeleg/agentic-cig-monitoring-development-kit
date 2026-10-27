# Design Pattern: State Achievement Goal

**Intent:** The goal of a **therapy** `action` (and the target that desired/undesired monitoring assesses). It expresses a target *state* with `goal.verb=achieve` (desired state) or `goal.verb=avoid` (undesired state) plus a `goal.noun_phrase`.

## PROforma elements

- Task: `action` in the Therapy Plan
- Native properties (`TaskProperties.md`): `caption`, `description` (the recommendation and why it was modelled, with its citations), `procedure` when there is something concrete to do (dose and titration, minutes of activity, grams of protein), a `precondition` when the source scopes it, and the Ontology coding
- Goal: metaprops keys `goal.verb` and `goal.noun_phrase` on the action (optional `goal.evidence_grade`). There is no separate Goal object, so each task has exactly one goal.
- `goal.verb` is one of: `diagnose, treat, prevent_primary, prevent_secondary, prevent, avoid, start, stop, order, achieve`. State Achievement Goals use **`achieve`** or **`avoid`**.
- Provenance: at least one `source.N` + `quote.N` pair (the verbatim passage the recommendation was modelled from), and the Ontology coding of the procedure or substance (`ontology.coding=SNOMED:<id>` + `ontology.label`, found with `snomed_search`). The gate fails a therapy action without a goal, caption, description or source (and a source without a quote); it warns on a missing procedure or coding.

## Tool calls

Every call also takes `file`. Set all keys in one `set_attribute` call (it replaces the whole metaprops).

```
# Desired state (achieve)
set_attribute(selector: "Prescribe_Drug", attribute: "metaprops",
              value: "goal.verb=achieve\ngoal.noun_phrase=<the guideline's treatment target>\nsource=...\nquote=...\nontology.coding=SNOMED:<id>\nontology.label=<substance>")

# Undesired state (avoid), with its native properties
set_attribute(selector: "Prescribe_Protective_Measure", attribute: "description", value: "Prescribes <the measure> to minimize <the harm of therapy> (<guideline> Rec <n>).")
set_attribute(selector: "Prescribe_Protective_Measure", attribute: "procedure", value: "<what to do, how often>")
set_attribute(selector: "Prescribe_Protective_Measure", attribute: "metaprops",
              value: "goal.verb=avoid\ngoal.noun_phrase=<the harm of therapy the guideline recommends preventing>\nsource=...\nquote=...\nontology.coding=SNOMED:<id>\nontology.label=<procedure>")
```

## `.pf` text

```
action  :: 'Prescribe_Protective_Measure' ;
     caption :: 'Prescribe <the measure> to prevent <the harm>' ;
     description :: 'Prescribes <the measure> to minimize <the harm of therapy> (<guideline> Rec <n>).' ;
     metaprops :: 'goal.noun_phrase=<the harm of therapy the guideline recommends preventing>
goal.verb=avoid
ontology.coding=SNOMED\\:<id>
ontology.label=<procedure>
quote=p.<page>, Rec <n>\\: "<verbatim clause>"
source=<Guideline name and year>, Rec <n> (p.<page>)
' ;
     procedure :: '<what to do, how often>' ;
end action.
```

## Guidance

- Attach a State Achievement Goal to **each therapy action** created in the Therapy Plan.
- `achieve` ⇒ the desired clinical goals from Step 3 (the guideline's treatment targets, e.g. a measured reduction, remission, improved quality of life). For abstraction goals (e.g. cardiometabolic risk), define the abstraction from measurable components (BP, lipids, glucose, A1C) and monitor those.
- `avoid` ⇒ undesired states from Step 3 (harms of therapy the guideline recommends preventing, ADEs; mechanism-of-action harms only when the user has put them in scope).
- Each desired/undesired state here is what the Monitoring Plan's "Monitor Desired/Undesired State" sub-plans assess (via Action Enactment Goals — see `ActionEnactmentGoal.md`). Because goals have no names, a monitor's `monitored_target` names the **therapy action** whose goal it traces to (e.g. `(avoid goal of Prescribe_Protective_Measure)`).
- `goal.noun_phrase` should be a concise, quantified phrase where the guideline gives numbers (e.g. "<measure> reduction of <n> percent within <period>").
- Copy each `quote.N` exactly from the source document (at most about 25 words, in double quotes, prefixed with page/section; `...` marks an omission). Put the concrete instruction (dose, titration, activity minutes) in `procedure`, not in the goal.

## Structural example

In `cig/examples/ici-irae-monitoring.pf`, the therapy plan has one `achieve` goal (the drug action) and two `avoid` goals (patient education and specialist review, each avoiding a harm the guideline names), each with a quoted source and its SNOMED CT coding.

## Related patterns

- `ActionComponent.md`, `TherapyPlan.md`, `ActionEnactmentGoal.md`, `TaskProperties.md`.
