# Design Pattern: Top-Level Plan

**Intent:** The root of a full CIG. The root `plan` whose components are, **in sequence**, an Enquiry (eligibility data retrieval), a Decision (eligibility), a Therapy Plan, and a Monitoring Plan. (For a narrower request, see the scope rule in the skill: an ADE-only request makes one populated monitoring plan the root.)

## PROforma elements

- Tasks: `plan` (root), `enquiry`, `decision`, `plan` (therapy), `plan` (monitoring)
- Root goal: metaprops `goal.verb=treat` + `goal.noun_phrase=<condition>` on the root plan
- Ordering: `schedule_constraint :: completed('<sibling>') ;` on each later component (from `add_task(after: [...])`)
- Gating: `precondition :: result_of(Eligibility_Decision) = Eligible ;` on the therapy plan
- CIG identity: the `metadata` block (`title`, `desc`, `author`, `version`)
- Tools: `create_guideline`, `set_metadata`, `add_task`, `set_attribute`

## Sequencing

PROforma has no "next" property. A component runs after a sibling when it carries `schedule_constraint :: completed('<sibling>')`:

- Decision component after the Enquiry
- Therapy component after the Decision
- Monitoring component after the Therapy plan

The Therapy plan also carries a `precondition` such as `result_of(<decision>) = Eligible`.

## Tool calls

Every call after `create_guideline` also takes `file`.

```
create_guideline(file: "projects/<p>/guideline/<name>.pf", name: "Obesity_GLP1_Plan",
                 title: "<CIG title>", author: "<author>")
set_metadata(desc: "<what the CIG covers; no hand-written counts>")
set_attribute(selector: "Obesity_GLP1_Plan", attribute: "caption", value: "<root caption>")
set_attribute(selector: "Obesity_GLP1_Plan", attribute: "metaprops",
              value: "goal.verb=treat\ngoal.noun_phrase=<condition>")

# 1. Enquiry: eligibility data (populate it: Enquiry.md)
add_task(plan: "Obesity_GLP1_Plan", kind: "enquiry", name: "Get_Eligibility_Data", caption: "...")
# 2. Decision: eligibility, after the enquiry (populate it: Decision.md)
add_task(plan: "Obesity_GLP1_Plan", kind: "decision", name: "Eligibility_Decision", caption: "...",
         after: ["Get_Eligibility_Data"])
# 3. Therapy plan, after the decision, gated by eligibility (TherapyPlan.md)
add_task(plan: "Obesity_GLP1_Plan", kind: "plan", name: "Obesity_Therapy", caption: "...",
         after: ["Eligibility_Decision"], precondition: "result_of(Eligibility_Decision) = Eligible")
# 4. Monitoring plan, after therapy (MonitoringPlan.md)
add_task(plan: "Obesity_GLP1_Plan", kind: "plan", name: "Monitoring_Plan", caption: "...",
         after: ["Obesity_Therapy"])
```

Do not write a count of actions or tasks in `desc`; the gate flags hand-written counts because they drift from the real build.

## `.pf` text (from the example)

```
metadata  :: 'Obesity_GLP1_Plan' ;
     title :: 'Obesity GLP-1 Therapy and Monitoring CIG (authoritative example)' ;
     desc :: '...' ;
end metadata.

plan  :: 'Obesity_GLP1_Plan' ;
     caption :: 'Manage obesity with GLP-1 therapy and monitor enactment, desired outcomes, and undesired effects' ;
     metaprops :: 'goal.noun_phrase=obesity in adults with BMI >\\= 30, or BMI >\\= 27 with a weight-related comorbidity
goal.verb=treat
' ;
     component :: 'Get_Eligibility_Data' ;
          task_definition :: 'Get_Eligibility_Data' ;
          ltwh :: 40,40,0,0;
     component :: 'Eligibility_Decision' ;
          task_definition :: 'Eligibility_Decision' ;
          schedule_constraint :: completed('Get_Eligibility_Data') ;
          ltwh :: 40,140,0,0;
     component :: 'Monitoring_Plan' ;
          task_definition :: 'Monitoring_Plan' ;
          schedule_constraint :: completed('Obesity_Therapy') ;
          ltwh :: 40,340,0,0;
     component :: 'Obesity_Therapy' ;
          task_definition :: 'Obesity_Therapy' ;
          schedule_constraint :: completed('Eligibility_Decision') ;
          ltwh :: 40,240,0,0;
end plan.
```

(The example also repeats the root goal keys on the file-level `metaprops` line.)

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

`Obesity_GLP1_Plan` (root plan, `goal.verb=treat` obesity) has components `Get_Eligibility_Data` (enquiry), `Eligibility_Decision` (decision with candidates `Eligible`/`Not_Eligible`, after the enquiry), `Obesity_Therapy` (plan, `precondition :: result_of(Eligibility_Decision) = Eligible`, after the decision), and `Monitoring_Plan` (plan, after `Obesity_Therapy`).

## Related patterns

- `Enquiry.md`, `Decision.md`, `TherapyPlan.md`, `MonitoringPlan.md`.
