# Design Pattern: Decision (populated)

**Intent:** The eligibility Decision of the Top-Level Plan. It weighs the Enquiry's data items and chooses between candidates (e.g. Eligible / Not Eligible). A Decision with candidates but **no arguments or criteria** is a **defect** — Mor flagged exactly this ("the Decision had no candidates/criteria… study the spec and populate the instances"). Populate the candidates **and** the decision criteria.

## PROforma elements

Composer's native decision, candidate and argument properties are listed in `TaskProperties.md` (a Decision is a Task and has all the common task properties). The ones this pattern uses:

- Task: `decision`, with the common task properties (Caption, Description, **Precondition** when the decision applies only to some patients) and its kind-specific **Choice mode** (`choice_mode :: single | multiple`), **Support mode** (`support_mode :: symbolic` default `| numeric`) and **Preselect candidates**
- `candidate`: name, **Caption**, **Description**, **Ontology coding** (only when a real concept fits; `ontology.coding=<prefix>:<code> [<caption>]` in the candidate's own metaprops, `Ontology.md`), `recommendation`, optional `priority`
- `argument :: <support>,<condition>` on a candidate, with optional `argument_name`, a **Caption** that holds the rationale and any evidence grade (e.g. `[I, A]`), a **Description**, and `metaprops` with the `source` + `quote` the criterion came from. Symbolic support: `for` (+1), `against` (−1), `confirming` (+1000), `excluding` (−1000)
- `recommendation` — the rule that recommends the candidate; default `netsupport() > 0` (the candidate's net support)
- Leave structural options such as `Eligible` / `Not_Eligible` uncoded rather than forcing a poor SNOMED match.
- Tools: `add_task`, `add_candidate`, `add_argument`, `set_attribute` (`choice_mode`, candidate `caption`/`description`, argument `metaprops`)

## What to populate (do not leave empty)

For each candidate:

1. The candidate, with a name (identifier), a caption and a description.
2. One or more arguments, each with a support value and a **condition that is a PROforma expression over the Enquiry's data items** — the actual eligibility rule, e.g. `threshold_measure >= 30 and contraindication_present = false`. Not prose: `and`/`or` lower-case, `not(x)` for negation, `<>` for not-equal. `check_expression` each condition against the file. Give each argument a `caption` (the rationale, with the evidence grade when the source gives one) and, in its metaprops, the `source` + verbatim `quote` of the passage that defines the criterion.
3. A recommendation (keep the default `netsupport() > 0` unless the guideline needs another rule). The free-text consequence of choosing the candidate ("start therapy" / "do not start") goes in the candidate's `description`, not in the recommendation.

Support is relative to the candidate it sits on: a condition that describes ineligibility is a `for` argument on `Not_Eligible` (or an `against` argument on `Eligible`). With `netsupport() > 0`, a candidate whose only argument is `against` can never be recommended.

Also set `choice_mode` on the Decision.

## Tool calls

Every call also takes `file`.

```
add_task(plan: "<root>", kind: "decision", name: "Eligibility_Decision",
         caption: "Decide whether the patient is eligible for <therapy>",
         after: ["Get_Eligibility_Data"])
set_attribute(selector: "Eligibility_Decision", attribute: "choice_mode", value: "single")

add_candidate(decision: "Eligibility_Decision", name: "Eligible")
set_attribute(selector: "Eligibility_Decision/candidate:Eligible", attribute: "description",
              value: "start the therapy plan and enroll in monitoring")
add_argument(decision: "Eligibility_Decision", candidate: "Eligible", support: "for", name: "Arg_Eligible",
             condition: "threshold_measure >= 30 and contraindication_present = false",
             caption: "<threshold> met and no contraindication [<guideline> Rec <n>, <strength>]")
set_attribute(selector: "Eligibility_Decision/candidate:Eligible/argument:Arg_Eligible", attribute: "metaprops",
              value: "source=<Guideline name and year>, Recommendation <n> (p.<page>)\nquote=p.<page>, Rec <n>: \"<verbatim clause that states the eligibility criterion>\"")

add_candidate(decision: "Eligibility_Decision", name: "Not_Eligible")
set_attribute(selector: "Eligibility_Decision/candidate:Not_Eligible", attribute: "description",
              value: "do not start the therapy; consider alternatives and re-evaluate")
add_argument(decision: "Eligibility_Decision", candidate: "Not_Eligible", support: "for", name: "Arg_Not_Eligible",
             condition: "threshold_measure < 30 or contraindication_present = true")
```

## `.pf` text (`Eligible` candidate)

```
decision  :: 'Eligibility_Decision' ;
     caption :: 'Decide whether the patient is eligible for <therapy>' ;
     candidate :: 'Eligible' ;
          description :: 'start the therapy plan and enroll in monitoring' ;
          argument :: for,threshold_measure >= 30 and contraindication_present = false attributes
               argument_name :: 'Arg_Eligible' ;
               caption :: '<threshold> met and no contraindication [<guideline> Rec <n>, <strength>]' ;
               metaprops :: 'quote=p.<page>, Rec <n>\\: "<verbatim clause>"
source=<Guideline name and year>, Recommendation <n> (p.<page>)
' ;
          end attributes
          ;
          recommendation ::netsupport() > 0;
     candidate :: 'Not_Eligible' ;
          ...
end decision.
```

## Sequencing and gating

- The Decision component runs after the Enquiry: `add_task(..., after: ["Get_Eligibility_Data"])` → `schedule_constraint :: completed('Get_Eligibility_Data')` (see `skills/cig-monitoring/references/TopLevelPlan.md`).
- The Therapy Plan is gated on the result by its native Precondition: `precondition :: result_of(Eligibility_Decision) = Eligible` (`result_set(D) includes C` for a `multiple` decision).

## Test-ordering Decisions (Monitor Undesired ADEs)

When an ADE monitor recommends two or more tests, its Enquiry is followed by a Decision `Tests_Ordering_Recommendations_<ADE>` (`skills/cig-monitoring/references/ADEMonitoringEnquiry.md`): `choice_mode :: multiple`, metaprops `role=test_ordering` and `ordered_for=Monitor_<ADE>`, a precondition that is true when at least one of the Enquiry's findings is positive, and one candidate per test, named after the test, with its **LOINC** coding in the candidate's metaprops (`ontology.coding=LNC:<code> [<caption>]`, from `loinc_search`) and an argument `for,true()` (a real condition only when the source restricts the test). Every listed test is recommended and the clinician selects which to order. The proposal lists these Decisions in a ```` ```cig-test-decisions ```` block.

## Structural example

In `cig/examples/ccd-antithrombotic-monitoring.pf`, `Antithrombotic_Regimen_Decision` chooses among nine regimen candidates (e.g. `Aspirin_Monotherapy`, `DAPT`, `Aspirin_plus_Vorapaxar`, `DOAC_Monotherapy`), each with a caption, a description and one or more arguments over the Enquiry's typed data items. Each argument's caption cites the recommendation with its class and level of evidence, and its metaprops carry the `source` + `quote` it rests on. It shows all three argument kinds:

- `for`: `Arg_Aspirin_SAPT`, "Rec 1 [1, A]", `requires_oral_anticoagulation = false and pci_within_12_months = false and acs_within_12_months = false and cabg_within_12_months = false and aspirin_intolerance = false`.
- `against`: a Class 3 No Benefit recommendation, `Arg_DAPT_No_Benefit`, "Rec 7 [3: No benefit, A]", `pci_within_12_months = false and acs_within_12_months = false and cabg_within_12_months = false`.
- `excluding`: a Class 3 Harm recommendation, `Arg_Vorapaxar_Harm`, "Rec 8 [3: Harm, A]", `prior_stroke_or_tia = true or prior_ich = true`.

The rule stays the default `netsupport() > 0`, so several candidates can be recommended at once and the clinician commits one; the Decision's description says so. A second Decision, `P2Y12_Agent_Decision`, is nested in the therapy plan (`skills/cig-monitoring/references/TherapyPlan.md`) with its own precondition on the first Decision's result; its assistant-proposed arguments say so in their captions, and a label contraindication (ticagrelor after intracranial hemorrhage) and Rec 9 [3: Harm] (prasugrel after stroke, TIA or ICH) are `excluding` arguments. Use it to see how a Decision is populated; its clinical rules are not a template. Never emit a Decision whose candidates have no arguments or criteria.

## Related patterns

- `Enquiry.md` (produces the data the criteria reference), `TaskProperties.md`, `Ontology.md`; in `skills/cig-monitoring/references/`: `ADEMonitoringEnquiry.md` (test-ordering Decisions), `TopLevelPlan.md`.
