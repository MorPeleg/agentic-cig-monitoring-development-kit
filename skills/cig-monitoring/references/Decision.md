# Design Pattern: Decision (populated)

**Intent:** The eligibility Decision of the Top-Level Plan. It weighs the Enquiry's data items and chooses between candidates (e.g. Eligible / Not Eligible). A Decision with candidates but **no arguments or criteria** is a **defect** — Mor flagged exactly this ("the Decision had no candidates/criteria… study the spec and populate the instances"). Populate the candidates **and** the decision criteria.

## PROforma elements

- Classes: `Decision` (a `Task`), `Candidate`, `Argument`, `PROforma_Condition`
- Properties: `candidates` (Decision→Candidate), `arguments` (Candidate→Argument), `proforma_condition` (Argument→PROforma_Condition, functional), `recommendation` (Candidate→PROforma_Condition, functional)
- Decision data properties: `choice_mode` (`single`/`multiple`), `support_mode` (`symbolic`/`numeric`)
- Argument data property: `support` (`for`/`against`/`confirming`/`excluding`)
- Condition data property: `string_representation` (the human-readable rule)

## What to populate (do not leave empty)

For each candidate:

1. The `Candidate` individual with a `name`.
2. One or more `Argument`s (`arguments`), each with a `support` value and a `proforma_condition` whose `string_representation` is the **actual eligibility rule** referencing the Enquiry's data items (e.g. `BMI >= 30 OR (BMI >= 27 AND weight_related_comorbidity)`).
3. A `recommendation` condition describing what happens if the candidate is chosen (e.g. "start therapy" / "do not start").

Also set `choice_mode` and `support_mode` on the Decision.

## OWL functional-syntax skeleton

Prefixes: `pf:` = PROforma, project prefix shown as `og:`.

```
ClassAssertion(pf:Decision og:Eligibility_Decision)
DataPropertyAssertion(pf:choice_mode og:Eligibility_Decision "single")
DataPropertyAssertion(pf:support_mode og:Eligibility_Decision "symbolic")

ObjectPropertyAssertion(pf:candidates og:Eligibility_Decision og:Eligible)
ClassAssertion(pf:Candidate og:Eligible)
DataPropertyAssertion(pf:name og:Eligible "Eligible")
ObjectPropertyAssertion(pf:arguments og:Eligible og:Arg_Eligible)
ClassAssertion(pf:Argument og:Arg_Eligible)
DataPropertyAssertion(pf:support og:Arg_Eligible "for")
ObjectPropertyAssertion(pf:proforma_condition og:Arg_Eligible og:Cond_Eligible)
ClassAssertion(pf:PROforma_Condition og:Cond_Eligible)
DataPropertyAssertion(pf:string_representation og:Cond_Eligible "(BMI >= 30 OR (BMI >= 27 AND weight_related_comorbidity = true)) AND contraindications = none")
ObjectPropertyAssertion(pf:recommendation og:Eligible og:Rec_Start_Therapy)
ClassAssertion(pf:PROforma_Condition og:Rec_Start_Therapy)
DataPropertyAssertion(pf:string_representation og:Rec_Start_Therapy "start GLP-1 obesity therapy plan and enroll in monitoring")
```

## Sequencing and gating

- The Decision component runs after the Enquiry: give it a `Schedule_Constraint` whose `conref` → the Enquiry (see `TopLevelPlan.md`).
- The Therapy Plan is gated on the result: `precondition` `result_of(Eligibility_Decision) = Eligible`.

## Worked example (`cig/examples/obesity-glp1-monitoring.owl`)

`Eligibility_Decision` (`choice_mode=single`, `support_mode=symbolic`) has candidates `Eligible` and `Not_Eligible`, each with a `for`/`against` Argument carrying the real BMI/comorbidity/contraindication rule and a recommendation. Imitate this — never emit a Decision whose candidates have no arguments or criteria.

## Related patterns

- `Enquiry.md` (produces the data the criteria reference), `TopLevelPlan.md`.
