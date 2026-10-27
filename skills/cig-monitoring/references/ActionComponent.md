# Design Pattern: Action + Component

**Intent:** The reusable building block for putting a task into a plan. Every task that appears in a plan does so through a `component` in that plan whose `task_definition` names the task. Used for both therapy actions (Therapy Plan) and monitoring actions (Monitoring sub-plans).

## PROforma elements

- Task blocks: `action` (or any task: `plan`, `decision`, `enquiry`)
- In the parent plan: `component :: 'X' ;` with `task_definition :: 'X' ;`, optional `schedule_constraint :: completed('Y') ;`
- Tools: `add_task` (creates the task **and** its component in the given plan; component name = task name), `add_component` (instantiates an existing task definition in another plan; rarely needed), `schedule_constraint` / `after` for ordering

## Task properties (Composer's property sheet)

Fill the native properties first; `TaskProperties.md` lists each with its `.pf` attribute and tool call.

| Group | Properties | Where |
|---|---|---|
| Common | Name, **Caption**, **Description**, **Ontology coding**, Metaproperties | task |
| Control | **Precondition**, Wait condition, Postcondition, Event trigger, Context | task |
| Scheduling | sibling order (`schedule_constraint`) | component |
| Repeat | Task repeat interval + unit (`cycle_repeat`), Number of repetitions (`number_of_cycles`) or Repeat until (`cycle_until`) | component |
| Agent | autonomous, optional, terminal | component |
| Action-specific | **procedure** (the instruction to carry out; for a monitoring action, the order) | task |

**Precondition and Ontology coding are the two most often missing.** Set a Precondition on every task the source limits to some patients (an executable expression over Enquiry data items, checked with `check_expression`), and give every action the SNOMED CT concept it delivers or watches.

## Rule of thumb

- The **component** carries plan membership and scheduling (`schedule_constraint`, `optional`, `cycle_repeat`, `number_of_cycles`, `cycle_until`, `ltwh` layout).
- The **task** (`action`, sub-`plan`, `decision`, `enquiry`) carries clinical meaning: the native properties (`caption`, `description`, `procedure`, `precondition` and the other conditions) and the `metaprops` (`goal.verb` / `goal.noun_phrase`, the `ServiceRequest.*` block of a monitoring action, `source.N` + `quote.N`, and the Ontology coding `ontology.coding` + `ontology.label`).
- One component points to exactly one task. Let `add_task` create both so the names match.

## Tool calls

Every call also takes `file`. Names are illustrative.

```
# Add an action to a plan (task + component in one call)
add_task(plan: "Therapy_Plan", kind: "action", name: "Prescribe_Drug",
         caption: "Prescribe <drug> with the label dose titration")

# Native properties: why it was modelled, what to do, when it applies
set_attribute(selector: "Prescribe_Drug", attribute: "description", value: "Prescribes <drug> ...")
set_attribute(selector: "Prescribe_Drug", attribute: "procedure", value: "<dose, route, frequency, titration>")
set_attribute(selector: "Prescribe_Drug", attribute: "precondition", value: "<expression>")   # only when the source scopes it

# The action's goal (State Achievement for therapy, Action Enactment for monitoring),
# its source + verbatim quote, and its Ontology coding (snomed_search "<drug>")
set_attribute(selector: "Prescribe_Drug", attribute: "metaprops",
              value: "goal.noun_phrase=<the guideline's treatment target>\ngoal.verb=achieve\nontology.coding=SNOMED:<id>\nontology.label=<substance>\nquote=§2: \"<verbatim sentence giving the recommended dosage>\"\nsource=<Drug> US Prescribing Information, §2 Dosage and Administration")

# Optional ordering: this component runs after a sibling in the same plan
add_task(plan: "<plan>", kind: "action", name: "<later_task>", after: ["<earlier_sibling>"])
```

## `.pf` text

```
action  :: 'Prescribe_Drug' ;
     caption :: 'Prescribe <drug> with the label dose titration' ;
     description :: 'Prescribes <drug> ... (<source>).' ;
     metaprops :: 'goal.noun_phrase=<the guideline's treatment target>
goal.verb=achieve
ontology.coding=SNOMED\\:<id>
ontology.label=<substance>
quote=§2\\: "<verbatim sentence>"
source=<Drug> US Prescribing Information, §2 Dosage and Administration
' ;
     procedure :: '<dose, route, frequency, titration>' ;
end action.

plan  :: 'Therapy_Plan' ;
     ...
     component :: 'Prescribe_Drug' ;
          task_definition :: 'Prescribe_Drug' ;
          ltwh :: 40,40,0,0;
     ...
end plan.
```

The same shape holds for a monitoring action: component `Monitor_<Harm>` in `Monitor_Undesired_State` → action `Monitor_<Harm>`. A sequenced component looks like `Eligibility_Decision` in the root plan, which carries `schedule_constraint :: completed('Get_Eligibility_Data') ;`.

## Related patterns

- `TaskProperties.md`, `TherapyPlan.md`, `MonitoringPlan.md`, `StateAchievementGoal.md`, `ActionEnactmentGoal.md`.
