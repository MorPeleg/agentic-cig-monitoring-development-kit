# Design Pattern: Decision (populated)

**Intent:** The eligibility Decision of the Top-Level Plan. It weighs the Enquiry's data items and chooses between candidates (e.g. Eligible / Not Eligible). A Decision with candidates but **no arguments or criteria** is a **defect** — Mor flagged exactly this ("the Decision had no candidates/criteria… study the spec and populate the instances"). Populate the candidates **and** the decision criteria.

## PROforma elements

Composer's native decision, candidate and argument properties are listed in `TaskProperties.md`. The ones this pattern uses:

- Task: `decision`, with the common task properties (Caption, Description, **Precondition** when the decision applies only to some patients) and its kind-specific **Choice mode** (`choice_mode :: single | multiple`), **Support mode** (`support_mode :: symbolic` default `| numeric`) and **Preselect candidates**
- `candidate`: name, **Caption**, **Description**, **Ontology coding** (only when a real concept fits), `recommendation`, optional `priority`
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

- The Decision component runs after the Enquiry: `add_task(..., after: ["Get_Eligibility_Data"])` → `schedule_constraint :: completed('Get_Eligibility_Data')` (see `TopLevelPlan.md`).
- The Therapy Plan is gated on the result by its native Precondition: `precondition :: result_of(Eligibility_Decision) = Eligible` (`result_set(D) includes C` for a `multiple` decision).

## Structural example

In `cig/examples/ici-irae-monitoring.pf`, `Pretreatment_Decision` has two candidates, each with a caption, a description and one `for` argument whose condition is an expression over the Enquiry's boolean data items, whose description states that the rule is assistant-proposed, and whose metaprops quote the passages it rests on. Use it to see how a Decision is populated; its clinical rule is not a template. Never emit a Decision whose candidates have no arguments or criteria.

## Related patterns

- `Enquiry.md` (produces the data the criteria reference), `TopLevelPlan.md`, `TaskProperties.md`.
