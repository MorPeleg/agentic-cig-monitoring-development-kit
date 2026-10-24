# Design Pattern: Decision (populated)

**Intent:** The eligibility Decision of the Top-Level Plan. It weighs the Enquiry's data items and chooses between candidates (e.g. Eligible / Not Eligible). A Decision with candidates but **no arguments or criteria** is a **defect** — Mor flagged exactly this ("the Decision had no candidates/criteria… study the spec and populate the instances"). Populate the candidates **and** the decision criteria.

## PROforma elements

- Task: `decision`, with `choice_mode` (`single` / `multiple`) and `support_mode` (`symbolic` default / `numeric`)
- `candidate` (name, `caption`, `description`, `recommendation`, optional `priority`)
- `argument :: <support>,<condition>` on a candidate, with optional `argument_name`. Symbolic support: `for` (+1), `against` (−1), `confirming` (+1000), `excluding` (−1000)
- `recommendation` — the rule that recommends the candidate; default `netsupport() > 0` (the candidate's net support)
- Tools: `add_task`, `add_candidate`, `add_argument`, `set_attribute` (`choice_mode`, candidate `description`)

## What to populate (do not leave empty)

For each candidate:

1. The candidate, with a name (identifier) and a caption or description.
2. One or more arguments, each with a support value and a **condition that is a PROforma expression over the Enquiry's data items** — the actual eligibility rule, e.g. `(BMI >= 30 or (BMI >= 27 and weight_related_comorbidity = true)) and contraindications = none`. Not prose: `and`/`or` lower-case, `not(x)` for negation, `<>` for not-equal. `check_expression` each condition against the file.
3. A recommendation (keep the default `netsupport() > 0` unless the guideline needs another rule). The free-text consequence of choosing the candidate ("start therapy" / "do not start") goes in the candidate's `description`, not in the recommendation.

Support is relative to the candidate it sits on: a condition that describes ineligibility is a `for` argument on `Not_Eligible` (or an `against` argument on `Eligible`). With `netsupport() > 0`, a candidate whose only argument is `against` can never be recommended.

Also set `choice_mode` on the Decision.

## Tool calls

Every call also takes `file`.

```
add_task(plan: "<root>", kind: "decision", name: "Eligibility_Decision",
         caption: "Decide whether the patient is eligible for GLP-1 obesity therapy",
         after: ["Get_Eligibility_Data"])
set_attribute(selector: "Eligibility_Decision", attribute: "choice_mode", value: "single")

add_candidate(decision: "Eligibility_Decision", name: "Eligible")
set_attribute(selector: "Eligibility_Decision/candidate:Eligible", attribute: "description",
              value: "start GLP-1 obesity therapy plan and enroll in monitoring")
add_argument(decision: "Eligibility_Decision", candidate: "Eligible", support: "for", name: "Arg_Eligible",
             condition: "(BMI >= 30 or (BMI >= 27 and weight_related_comorbidity = true)) and contraindications = none")

add_candidate(decision: "Eligibility_Decision", name: "Not_Eligible")
set_attribute(selector: "Eligibility_Decision/candidate:Not_Eligible", attribute: "description",
              value: "do not start GLP-1 therapy; consider alternatives and re-evaluate")
add_argument(decision: "Eligibility_Decision", candidate: "Not_Eligible", support: "for", name: "Arg_Not_Eligible",
             condition: "BMI < 27 or (BMI < 30 and weight_related_comorbidity = false) or contraindications <> none")
```

## `.pf` text (from the example, `Eligible` candidate)

```
decision  :: 'Eligibility_Decision' ;
     caption :: 'Decide whether the patient is eligible for GLP-1 obesity therapy' ;
     candidate :: 'Eligible' ;
          description :: 'start GLP-1 obesity therapy plan and enroll in monitoring' ;
          argument :: for,(BMI >= 30 or (BMI >= 27 and weight_related_comorbidity = true)) and contraindications = none attributes
               argument_name :: 'Arg_Eligible' ;
          end attributes
          ;
          recommendation ::netsupport() > 0;
     candidate :: 'Not_Eligible' ;
          ...
end decision.
```

## Sequencing and gating

- The Decision component runs after the Enquiry: `add_task(..., after: ["Get_Eligibility_Data"])` → `schedule_constraint :: completed('Get_Eligibility_Data')` (see `TopLevelPlan.md`).
- The Therapy Plan is gated on the result: `precondition :: result_of(Eligibility_Decision) = Eligible` (`result_set(D) includes C` for a `multiple` decision).

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

`Eligibility_Decision` has candidates `Eligible` and `Not_Eligible`, each with a description and an argument whose condition is the real BMI/comorbidity/contraindication rule over the Enquiry's data items. Imitate this — never emit a Decision whose candidates have no arguments or criteria.

## Related patterns

- `Enquiry.md` (produces the data the criteria reference), `TopLevelPlan.md`.
