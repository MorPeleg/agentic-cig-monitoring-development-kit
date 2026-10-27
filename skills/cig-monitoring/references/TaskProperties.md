# Reference: native task properties (Deontics Composer)

What Composer's property sheet shows for each element of a PROforma guideline. Each row gives the `.pf` attribute it is stored as, and the tool call that sets it. Fill these native properties before reaching for free metaprops. Preconditions and the ontology coding matter most: they make a task's scoping executable and its clinical concept explicit.

The property names and the quoted descriptions come from Composer's own property sheets (the PROforma connector module of the installed Composer). The full user guide and tutorial are on the Deontics author portal (`https://portal.deontics.com/authors/composer-manual/`, task properties under `proformaconnector/proforma_task_properties.php`). The portal needs an author login, so its pages are not bundled here.

Set a text property with `set_attribute(selector, attribute, value)`. Set a condition the same way, then type-check it with `check_expression`. The ontology coding and other metaprops go in through `set_attribute(attribute: "metaprops")` (see `MetapropsSyntax.md`).

## All task kinds (plan, action, enquiry, decision)

**Task common properties.** "Important properties common to all task types."

| Composer property | Composer's description | `.pf` attribute |
|---|---|---|
| Name | "The internal name for this component" | the block name, e.g. `action :: 'Monitor_X'` (identifier; `rename` changes it) |
| Caption | "A human-readable caption" | `caption` |
| Description | "A short descriptive string" | `description` |
| **Ontology coding** | "Term in a controlled vocabulary or ontology corresponding to" the task | metaprop `ontology.coding=SNOMED:<id>` (+ `ontology.label`); Composer hides the key in its metaprops editor and shows it here |
| Metaproperties | "The task's metaproperties" | `metaprops` |

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

Composer: "the two are alternative ways to stop cycling and behaviour is undefined if both are set". Use either the number of repetitions or repeat until, never both. The kit's monitoring schedule is authoritative in `ServiceRequest.occurrenceTiming`; component cycles are optional (see `MonitoringFrequency.md`).

**Agent properties.** "Properties concerned with autonomous operation."

| Composer property | `.pf` attribute |
|---|---|
| Autonomous, optional, terminal | component flags `autonomous :: yes`, `optional :: yes`, `terminal :: yes` |

## Kind-specific properties

| Task kind | Composer property | Composer's description | `.pf` attribute |
|---|---|---|---|
| Action | Procedure | "The action's procedure" | `procedure :: '<text>'` (in this kit, the instruction to carry out; for a monitoring action, the order) |
| Decision | Choice mode | single or multiple choice | `choice_mode :: single \| multiple` |
| Decision | Support mode | symbolic or numeric argument support | `support_mode :: symbolic \| numeric` |
| Decision | Preselect candidates | | `preselect_candidates :: yes \| no` |
| Decision candidate | Caption, Description, **Ontology coding** ("Term in a controlled vocabulary or ontology corresponding to this Candidate"), Metaproperties | | candidate `caption`, `description`, `metaprops` (`ontology.coding`) |
| Decision argument | Caption (rationale and evidence grade), Description, Ontology coding, Metaproperties | | argument `caption`, `description`, `metaprops` (`source`/`quote`) |
| Plan | Termination condition | | `terminate :: <expr>` |
| Plan | Abort condition | | `abort :: <expr>` |
| Enquiry | Sources | the data items it asks for | `source :: '<data item>'` (`add_source`), optional `mandatory :: yes \| no` |

## Data items

"Data item properties."

| Composer property | Composer's description | `.pf` attribute |
|---|---|---|
| Name | "The internal name for this data item" | block name |
| Caption | "A human-readable caption for this data item" | `caption` |
| Description | "A short human-readable description" | `description` |
| Display name | "Short name or caption to be used in reports generated from patient data" | metaprop (Composer's display-name key) |
| **Ontology coding** | "Term in a controlled vocabulary or ontology corresponding to this data item" | metaprop `ontology.coding` (+ `ontology.label`) |
| Type | "The type of this data item" | `type` (`boolean`, `integer`, `real`, `text`, `date`, ...) |
| Units | "Units this data item is expressed in" | `unit` |
| Range and Default Value | "Allowed values for the data item." | `range`, `default_value` (Composer writes captioned choices as `"value\|\|Caption"`) |
| Derivation | "An expression used to calculate the value of this data item at the moment it becomes requested." | `derivation :: <expr>` |
| Dynamic | "A dynamic data item has its value calculated from other data rather than directly set." | `dynamic :: yes` (dynamic items cannot be Enquiry sources) |
| Metaproperties | "The data item's metaproperties" | `metaprops` |

## Related

- `MetapropsSyntax.md`: which native properties and metaprops a monitoring or therapy action must carry.
- `Enquiry.md`, `Decision.md`, `ActionComponent.md`: the patterns that use these properties.
- The `proforma_reference` tool: the PROforma language reference (attribute syntax, expressions).
