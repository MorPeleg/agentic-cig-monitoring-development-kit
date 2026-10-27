# Design Pattern: Top-Level Plan

**Intent:** The root of a full CIG. The root `plan` whose components are, **in sequence**, an Enquiry (eligibility data retrieval), a Decision (eligibility), a Therapy Plan, and a Monitoring Plan. (For a narrower request, see the scope rule in the skill: an ADE-only request makes one populated monitoring plan the root.)

## PROforma elements

- Tasks: `plan` (root), `enquiry`, `decision`, `plan` (therapy), `plan` (monitoring)
- Root goal: metaprops `goal.verb=treat` + `goal.noun_phrase=<condition>` on the root plan
- Ordering: `schedule_constraint :: completed('<sibling>') ;` on each later component (from `add_task(after: [...])`)
- Gating: the native **Precondition** `precondition :: result_of(Eligibility_Decision) = Eligible ;` on the therapy plan
- Other native plan properties (`TaskProperties.md`): Caption, Description, Ontology coding, Termination condition (`terminate`), Abort condition (`abort`); set them when the guideline gives a stopping rule
- CIG identity: the `metadata` block (`title`, `desc`, `author`, `version`)
- Tools: `create_guideline`, `set_metadata`, `add_task`, `set_attribute`

## Sequencing

PROforma has no "next" property. A component runs after a sibling when it carries `schedule_constraint :: completed('<sibling>')`:

- Decision component after the Enquiry
- Therapy component after the Decision
- Monitoring component after the Therapy plan

The Therapy plan also carries a `precondition` such as `result_of(<decision>) = Eligible`.

## Tool calls

Every call after `create_guideline` also takes `file`. Names are illustrative; the proposal's §6 fixes the real ones.

```
create_guideline(file: "projects/<p>/guideline/<name>.pf", name: "Condition_Therapy_Plan",
                 title: "<CIG title>", author: "<author>")
set_metadata(desc: "<what the CIG covers; no hand-written counts>")
set_attribute(selector: "Condition_Therapy_Plan", attribute: "caption", value: "<root caption>")
set_attribute(selector: "Condition_Therapy_Plan", attribute: "metaprops",
              value: "goal.verb=treat\ngoal.noun_phrase=<condition and population>")

# 1. Enquiry: eligibility data (populate it: Enquiry.md)
add_task(plan: "Condition_Therapy_Plan", kind: "enquiry", name: "Get_Eligibility_Data", caption: "...")
# 2. Decision: eligibility, after the enquiry (populate it: Decision.md)
add_task(plan: "Condition_Therapy_Plan", kind: "decision", name: "Eligibility_Decision", caption: "...",
         after: ["Get_Eligibility_Data"])
# 3. Therapy plan, after the decision, gated by eligibility (TherapyPlan.md)
add_task(plan: "Condition_Therapy_Plan", kind: "plan", name: "Therapy_Plan", caption: "...",
         after: ["Eligibility_Decision"], precondition: "result_of(Eligibility_Decision) = Eligible")
# 4. Monitoring plan, after therapy (MonitoringPlan.md)
add_task(plan: "Condition_Therapy_Plan", kind: "plan", name: "Monitoring_Plan", caption: "...",
         after: ["Therapy_Plan"])
```

Do not write a count of actions or tasks in `desc`; the gate flags hand-written counts because they drift from the real build.

## `.pf` text

```
metadata  :: 'Condition_Therapy_Plan' ;
     title :: '<CIG title>' ;
     desc :: '...' ;
end metadata.

plan  :: 'Condition_Therapy_Plan' ;
     caption :: '<root caption>' ;
     metaprops :: 'goal.noun_phrase=<condition and population>
goal.verb=treat
' ;
     component :: 'Get_Eligibility_Data' ;
          task_definition :: 'Get_Eligibility_Data' ;
          ltwh :: 40,40,0,0;
     component :: 'Eligibility_Decision' ;
          task_definition :: 'Eligibility_Decision' ;
          schedule_constraint :: completed('Get_Eligibility_Data') ;
          ltwh :: 40,140,0,0;
     component :: 'Therapy_Plan' ;
          task_definition :: 'Therapy_Plan' ;
          schedule_constraint :: completed('Eligibility_Decision') ;
          ltwh :: 40,240,0,0;
     component :: 'Monitoring_Plan' ;
          task_definition :: 'Monitoring_Plan' ;
          schedule_constraint :: completed('Therapy_Plan') ;
          ltwh :: 40,340,0,0;
end plan.
```

The root goal keys may also be repeated on the file-level `metaprops` line.

## Structural example

`cig/examples/ici-irae-monitoring.pf` has this shape: a root plan (`goal.verb=treat`) with a baseline Enquiry, a pre-treatment Decision after it, a therapy plan after the Decision and gated by its result, and a monitoring plan after the therapy plan. Use it to see the layout; its clinical content and task names are not a template.

## Related patterns

- `Enquiry.md`, `Decision.md`, `TherapyPlan.md`, `MonitoringPlan.md`, `TaskProperties.md`.
