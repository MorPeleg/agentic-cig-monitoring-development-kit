# Design Pattern: Therapy Plan

**Intent:** A sub-`plan` of the Top-Level Plan that holds the therapy recommendations. Its components are therapy `action`s (one per intervention), each with a State Achievement Goal. It is usually gated by a `precondition` on the eligibility decision.

## PROforma elements

Composer's native task properties are listed in `cig/know-how/proforma/TaskProperties.md`. The ones this pattern uses:

- Tasks: `plan` (the therapy plan), `action` (one per intervention)
- On the plan: Caption, Description, the **Precondition** (an executable expression, usually on the eligibility decision), and a Termination or Abort condition when the guideline gives a stopping rule
- On each action: Caption, Description, procedure, a **Precondition** when the source scopes the intervention to a sub-population, and the `metaprops` (`goal.verb` / `goal.noun_phrase`, `source.N` + `quote.N`, `rxnorm.coding` for a single drug)
- On each component: the action's **Ontology coding** of the procedure or substance (`ontology.coding=SCT:<id> [<term>]`, `cig/know-how/proforma/Ontology.md`), and the repeat properties (`cycle_repeat`, `number_of_cycles` or `cycle_until`) when the guideline gives a cyclic regimen
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
# source, and its Ontology coding on its component
set_attribute(selector: "Prescribe_Drug", attribute: "metaprops",
              value: "goal.verb=achieve\ngoal.noun_phrase=<the guideline's treatment target>\nsource=<Drug> US Prescribing Information, §2 Dosage and Administration\nquote=§2: \"<verbatim sentence giving the recommended starting dosage>\"")
set_attribute(selector: "Therapy_Plan/component:Prescribe_Drug", attribute: "metaprops",
              value: "ontology.coding=SCT:<id> [<substance or procedure, as returned by snomed_search>]")
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

In `cig/examples/ccd-antithrombotic-monitoring.pf`, the therapy plan `Antithrombotic_Therapy` runs after the regimen Decision and is gated by `active_pathological_bleeding = false`, the contraindication every candidate regimen shares. Its components:

```
plan Antithrombotic_Therapy                        precondition active_pathological_bleeding = false
  action   Advise_Avoid_Chronic_NSAIDs             goal.verb=avoid; no precondition, runs first
  decision P2Y12_Agent_Decision                    after the advice; precondition result_of(Antithrombotic_Regimen_Decision) = <a regimen with a P2Y12 inhibitor>
  action   Prescribe_Aspirin, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban, Prescribe_DOAC
                                                   after the advice; each gated by result_of(Antithrombotic_Regimen_Decision)
  action   Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel
                                                   after the advice and P2Y12_Agent_Decision; gated by result_of(P2Y12_Agent_Decision)
  action   Prescribe_PPI                           goal.verb=avoid (gastrointestinal bleeding); gated by the DAPT and DOAC-plus-antiplatelet regimens
```

It shows three things the generic calls above do not:

- **A non-drug recommendation as an action.** `Advise_Avoid_Chronic_NSAIDs` models a "should not be used" recommendation (Rec 10, Class 3: Harm) as an advice step with an `avoid` goal. It always completes, so every drug action can be scheduled after it.
- **A nested Decision.** `P2Y12_Agent_Decision` chooses the P2Y12 inhibitor inside the therapy plan, only when the chosen regimen contains one; the three P2Y12 drug actions follow it and read its result.
- **Drug actions gated by decision results.** Each `Prescribe_*` action's precondition is a disjunction of `result_of(...) = <Candidate>` tests over the regimens that contain the drug, so one action serves several regimens without duplication. `Prescribe_Clopidogrel` reads both decisions (`result_of(Antithrombotic_Regimen_Decision) = Clopidogrel_Monotherapy or result_of(P2Y12_Agent_Decision) = Clopidogrel`) because clopidogrel monotherapy skips the P2Y12 decision.

Each drug action has an `achieve` or `avoid` goal, a description citing the recommendation with its class and level, a procedure with the dose and duration, numbered `source.N` + `quote.N`, its SNOMED CT coding and, when the action delivers a single drug ingredient, its RxNorm code (`rxnorm.coding` + `rxnorm.label`; the class-level `Prescribe_DOAC` and the NSAID advice have none). Use it to see the shape; its interventions are not a template.

## Related patterns

- `ActionComponent.md`, `StateAchievementGoal.md`, `TopLevelPlan.md`, `cig/know-how/proforma/TaskProperties.md`.
