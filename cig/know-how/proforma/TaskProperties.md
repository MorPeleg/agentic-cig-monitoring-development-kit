# Reference: native task properties (Deontics Composer)

What Composer's property sheet shows for each element of a PROforma guideline. Each row gives the `.pf` attribute it is stored as, and the tool call that sets it. Fill these native properties before reaching for free metaprops. Preconditions and the ontology coding matter most: they make a task's scoping executable and its clinical concept explicit.

The property names and the quoted descriptions come from Composer's own property sheets (the PROforma connector module of the installed Composer). The full user guide and tutorial are on the Deontics author portal (`https://portal.deontics.com/authors/composer-manual/`, task properties under `proformaconnector/proforma_task_properties.php`). The portal needs an author login, so its pages are not bundled here.

Set a text property with `set_attribute(selector, attribute, value)`. Set a condition the same way, then type-check it with `check_expression`. The ontology coding and other metaprops go in through `set_attribute(attribute: "metaprops")`: the coding contract is `Ontology.md`, the kit's monitoring and therapy metaprops are `skills/cig-monitoring/references/MetapropsSyntax.md`. Data items are described in `Data.md`.

## Every Plan, Action, Enquiry and Decision is a Task

PROforma has one task class with four kinds: **Plan**, **Action**, **Enquiry** and **Decision**. Each kind is a Task, so each inherits all the common task properties below (caption, description, ontology coding, metaproperties, precondition, wait condition, postcondition, event trigger, context, and the scheduling and repeat properties of its component). A kind then adds only its own properties (next section): a Plan its components and its termination and abort conditions, an Action its procedure, an Enquiry its sources, a Decision its candidates, arguments and choice mode.

A task appears in a guideline twice: as a **definition** (the `plan`, `action`, `enquiry` or `decision` block) and as a **component** of its parent plan (`component :: '<name>'` inside the plan block), which places the definition in that plan. The definition holds what the task is; the component holds how the plan runs it (scheduling, cycles, flags) and, in Composer, the task's ontology coding. The root plan has no parent plan, so it has no component.

Composer shows the **component's** caption and description, not the definition's. So every component carries the same `caption` and `description` as its task definition: set both on the definition and on the component (`set_attribute(selector: "<plan>/component:<task>", attribute: "caption" | "description")`; CLI `set --selector <plan>/component:<task> --attribute caption`). `add_task(caption:, description:)` sets them on the definition only. `check_cig.mjs` fails a component whose caption or description is missing or differs from its definition's.

## Common task properties (all four kinds)

**Task common properties.** "Important properties common to all task types."

| Composer property | Composer's description | `.pf` attribute |
|---|---|---|
| Name | "The internal name for this component" | the block name, e.g. `action :: 'Monitor_X'` (identifier; `rename` changes it) |
| Caption | "A human-readable caption" | `caption` on the definition and, the same text, on its component (one line, except a Markdown list such as `Display_Potential_ADEs`, `skills/cig-monitoring/references/ADEMonitoringEnquiry.md`) |
| Description | "A short descriptive string" | `description` on the definition and, the same text, on its component |
| **Ontology coding** | "Term in a controlled vocabulary or ontology corresponding to" the task | metaprop `ontology.coding=<SCT\|LNC\|IC0\|IC9>:<code> [<caption>]` on the task's **component** in the parent plan (`set_attribute(selector: "<plan>/component:<task>", attribute: "metaprops", ...)`), e.g. `ontology.coding=SCT:131148009 [Bleeding (finding)]`; an ordered test: `LNC:<code> [<caption>]`. Composer hides the key in its metaprops editor and shows it here. See `Ontology.md` |
| Metaproperties | "The task's metaproperties" | `metaprops` on the definition (the kit's goal, order, provenance and `rxnorm.coding` keys) |

**Control properties.** "Properties concerned with control and data flow."

| Composer property | Composer's description | `.pf` attribute |
|---|---|---|
| **Precondition** | "If present, this condition must evaluate to true at the point when the task becomes active, otherwise the task will immediately be discarded without executing" | `precondition :: <expr>` |
| Wait condition | "Condition that must be met before the task can be activated" | `wait_condition :: <expr>` |
| Postcondition | "Expression that will be asserted when the task completes" | `postcondition :: <assertion>` |
| Event trigger | "Alphanumeric trigger that will activate the task during runtime" | `trigger :: atom` |
| Context | "The task's context" | `context :: atom` |
| Scheduling | sibling order inside the parent plan | component `schedule_constraint :: completed('<sibling>')` (`add_task(after:)` / `schedule_constraint`) |

**Task repeat properties.** "Properties controlling cyclic activation of tasks." These are set on the component.

| Composer property | Composer's description | `.pf` attribute |
|---|---|---|
| Task repeat interval | "Time interval between repetitions. Note that the unit for this interval (seconds, minutes etc) needs to be set too." | `cycle_repeat :: <expr> <unit>` |
| Repeat interval unit | "Unit to use for the cycle repeat interval" | the unit in `cycle_repeat` (`seconds`, `minutes`, `hours`, `days`, `weeks`) |
| Number of repetitions | "Repetition of a cyclic task will stop after this number of repetitions." | `number_of_cycles :: <expr>` |
| Repeat until | "Repetition of a cyclic task will stop when this condition is true." | `cycle_until :: <expr>` |

Composer: "the two are alternative ways to stop cycling and behaviour is undefined if both are set". Use either the number of repetitions or repeat until, never both. The kit's monitoring schedule is authoritative in `ServiceRequest.occurrenceTiming`; component cycles are optional (see `skills/cig-monitoring/references/MonitoringFrequency.md`).

**Agent properties.** "Properties concerned with autonomous operation."

| Composer property | `.pf` attribute |
|---|---|
| Autonomous, optional, terminal | component flags `autonomous :: yes`, `optional :: yes`, `terminal :: yes` |

## Kind-specific properties

Each kind has the common properties above plus these.

| Task kind | Composer property | Composer's description | `.pf` attribute |
|---|---|---|---|
| Plan | Components | the tasks the plan runs | `component :: '<task>'` with its component attributes (`add_task(plan:)`, `add_component`) |
| Plan | Termination condition | | `terminate :: <expr>` |
| Plan | Abort condition | | `abort :: <expr>` |
| Action | Procedure | "The action's procedure" | `procedure :: '<text>'` (in this kit, the instruction to carry out; for a monitoring action, the order) |
| Enquiry | Sources | the data items it asks for | `source :: '<data item>'` (`add_source`) with `mandatory :: yes \| no` (no line means yes). Write `mandatory :: no` (`add_source(mandatory: false)`) except for an item a plan's precondition reads (`Data.md`). An Enquiry has no procedure: an ADE Enquiry states its order in its description (`skills/cig-monitoring/references/ADEMonitoringEnquiry.md`) |
| Decision | Choice mode | single or multiple choice | `choice_mode :: single \| multiple` |
| Decision | Support mode | symbolic or numeric argument support | `support_mode :: symbolic \| numeric` |
| Decision | Preselect candidates | | `preselect_candidates :: yes \| no` |
| Decision candidate | Caption, Description, **Ontology coding** ("Term in a controlled vocabulary or ontology corresponding to this Candidate"), Metaproperties | | candidate `caption`, `description`, `metaprops` (`ontology.coding=<prefix>:<code> [<caption>]` in the candidate's own metaprops) |
| Decision argument | Caption (rationale and evidence grade), Description, Ontology coding, Metaproperties | | argument `caption`, `description`, `metaprops` (`source`/`quote`) |

## Data items

Data items are not tasks; their properties (type, caption, unit, range, default value, derivation, dynamic, ontology coding, metaprops) are in `Data.md`.

## Related

- `Ontology.md`: the ontology coding contract (value form, providers, where each element carries it).
- `Data.md`: data items.
- `Enquiry.md`, `Decision.md`: populating an Enquiry and a Decision.
- `skills/cig-monitoring/references/MetapropsSyntax.md`: which native properties and metaprops a monitoring or therapy action must carry; `skills/cig-monitoring/references/ActionComponent.md`: the pattern that uses them.
- The `proforma_reference` tool: the PROforma language reference (attribute syntax, expressions).
