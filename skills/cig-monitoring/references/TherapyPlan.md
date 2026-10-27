# Design Pattern: Therapy Plan

**Intent:** A sub-`plan` of the Top-Level Plan that holds the therapy recommendations. Its components are therapy `action`s (one per intervention), each with a State Achievement Goal. It is usually gated by a `precondition` on the eligibility decision.

## PROforma elements

Composer's native task properties are listed in `TaskProperties.md`. The ones this pattern uses:

- Tasks: `plan` (the therapy plan), `action` (one per intervention)
- On the plan: Caption, Description, the **Precondition** (an executable expression, usually on the eligibility decision), and a Termination or Abort condition when the guideline gives a stopping rule
- On each action: Caption, Description, procedure, a **Precondition** when the source scopes the intervention to a sub-population, the **Ontology coding** of the procedure or substance (`ontology.coding` + `ontology.label`), and the `metaprops` (`goal.verb` / `goal.noun_phrase`, `source.N` + `quote.N`)
- On each component: the repeat properties (`cycle_repeat`, `number_of_cycles` or `cycle_until`) when the guideline gives a cyclic regimen
- Tools: `add_task`, `set_attribute`, `check_expression`, `snomed_search` (the coding pass)

## Tool calls

Every call also takes `file`. Names are illustrative; the proposal's §6 fixes the real ones.

```
# Therapy plan in the root plan, after the decision, gated by eligibility
add_task(plan: "<root>", kind: "plan", name: "Therapy_Plan",
         caption: "<the drug therapy plus the accompanying non-drug recommendations>",
         after: ["Eligibility_Decision"], precondition: "result_of(Eligibility_Decision) = Eligible")

# One therapy intervention = one action (add_task also creates its component; see ActionComponent.md)
add_task(plan: "Therapy_Plan", kind: "action", name: "Prescribe_Drug",
         caption: "Prescribe <drug> with the label dose titration")

# Native properties: the recommendation and why it was modelled, what to do, and when it applies
set_attribute(selector: "Prescribe_Drug", attribute: "description", value: "Prescribes <drug> with the label dose titration ... (<source>)")
set_attribute(selector: "Prescribe_Drug", attribute: "procedure", value: "<starting dose, route and frequency>, then <titration steps> to the <maintenance dose>")
# only when the source scopes the intervention to a sub-population:
set_attribute(selector: "Prescribe_Drug", attribute: "precondition", value: "<expression over Enquiry data items>")

# Each therapy action gets a State Achievement Goal (see StateAchievementGoal.md), its quoted
# source and its Ontology coding
set_attribute(selector: "Prescribe_Drug", attribute: "metaprops",
              value: "goal.verb=achieve\ngoal.noun_phrase=<the guideline's treatment target>\nsource=<Drug> US Prescribing Information, §2 Dosage and Administration\nquote=§2: \"<verbatim sentence giving the recommended starting dosage>\"\nontology.coding=SNOMED:<id>\nontology.label=<substance or procedure, as returned by snomed_search>")
```

## `.pf` text

```
plan  :: 'Therapy_Plan' ;
     caption :: '<the drug therapy plus the accompanying non-drug recommendations>' ;
     precondition ::result_of(Eligibility_Decision) = Eligible;
     component :: 'Prescribe_Drug' ;
          task_definition :: 'Prescribe_Drug' ;
          ltwh :: 40,40,0,0;
     component :: 'Prescribe_Lifestyle' ;
          task_definition :: 'Prescribe_Lifestyle' ;
          ltwh :: 240,40,0,0;
     component :: 'Prescribe_Protective_Measure' ;
          task_definition :: 'Prescribe_Protective_Measure' ;
          ltwh :: 440,40,0,0;
end plan.
```

## Guidance

- Create **one action per therapy intervention** (drug, diet, physical activity, etc.) with `add_task` in the therapy plan. The therapy actions are parallel (no `after`) unless the guideline orders them.
- Complete vague recommendations from other guidelines or the web, and record the source with its verbatim passage (`source.N` + `quote.N`; Step 3 of the skill). The recommendation and why it was modelled go in `description`; the concrete instruction (dose and titration, activity minutes, grams of protein) in `procedure`.
- Give every therapy action a State Achievement Goal (`achieve` for desired states, `avoid` for undesired states) and, in the coding pass, the SNOMED CT concept of the procedure or substance it delivers.
- Set a **Precondition** wherever the source limits an intervention to some patients; it must be an executable expression over Enquiry data items. `check_expression` it against the file.

## Structural example

In `cig/examples/ici-irae-monitoring.pf`, the therapy plan `ICI_Therapy` runs after the Decision and is gated by a precondition on its result. It holds a patient-education action, a specialist-review action that only runs when its own precondition on the Decision's result holds, and the drug action scheduled after both; each has an `achieve` or `avoid` goal, a description, a procedure, a quoted source and its SNOMED CT coding. Use it to see the shape; its interventions are not a template.

## Related patterns

- `ActionComponent.md`, `StateAchievementGoal.md`, `TopLevelPlan.md`, `TaskProperties.md`.
