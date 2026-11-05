# Design Pattern: Enquiry (populated)

**Intent:** The first task of the Top-Level Plan: retrieve the **data items** needed to decide eligibility and to set monitoring baselines. An Enquiry with no sources is a **defect** — the agent must study the data the guideline needs and populate the items (this was a concrete failure Mor flagged: "the Enquiry had no data items").

## PROforma elements

Composer's native properties for an enquiry are listed in `TaskProperties.md` (an Enquiry is a Task and has all the common task properties) and those of its data items in `Data.md`. The ones this pattern uses:

- Task: `enquiry`, with the common task properties (Caption, Description, **Ontology coding** on its component in the parent plan, **Precondition** when the enquiry applies only to some patients) and its kind-specific **Sources**: a `source` whose `data_definition` names the data item it asks for, with `mandatory :: no` unless a plan's precondition reads the item (see Mandatory sources and defaults).
- Data item: `data` block with the native **Type** (`real`, `integer`, `text`, `date`, …; never `boolean`), **Caption** (the question as asked), **Description**, **Default Value** (`default_value`, on every item an Enquiry asks for), and when they apply **Units** (`unit`), **Range** (`range`; `"yes||yes", "no||no"` for a yes/no item), **Derivation** (`derivation`, an expression computing the value) and **Dynamic**. A dynamic data item cannot be an Enquiry source.
- Data item **Ontology coding**: the observable or finding the item records, in the data item's own metaprops as `ontology.coding=SCT:<id> [<caption>]` (the concept id and the term exactly as `snomed_search` returns them; `Ontology.md`). Set it on every item that names a clinical concept; leave an item uncoded only when no single concept fits (e.g. a composite flag), and say so in its description.
- Data item metaprops: a `source` + `quote` when the item comes from a specific passage (e.g. a contraindication or a sub-population flag).
- Tools: `add_task`, `add_data_item`, `add_source` (can create the data item itself with `create_type`), `set_attribute` (data item `caption`, `description`, `metaprops`), `snomed_search`

## Types matter

The data items are what the Decision's arguments and the monitoring preconditions compute over, so give each a real type:

- `real` (or `integer`) for numeric thresholds, with `unit` (e.g. a measured value in its unit);
- `text` with the range `"yes||yes", "no||no"` for yes/no facts (e.g. `qualifying_comorbidity`, `on_interacting_medication`), compared with `= "yes"` / `= "no"`. Composer and the Deontics engine have no `boolean` type, so `type :: boolean` is a gate FAIL;
- `text` with a `range` for a fixed value set (e.g. a planned regimen class), compared with `=`.

A data item that a precondition or argument uses must be asked for by an Enquiry; `check_cig.mjs` fails a sub-population precondition over a data item no Enquiry asks for.

## Mandatory sources and defaults

The engine does not complete an Enquiry while a mandatory value is missing, and a source with no `mandatory` line is mandatory. So:

- every source is `mandatory :: no` (`add_source(..., mandatory: false)`), except a **plan-gating** item, one a plan's precondition reads (e.g. `active_pathological_bleeding` for the therapy plan). That source stays mandatory, and the gate fails a mandatory source no plan precondition reads;
- every data item an Enquiry asks for has a `default_value`, so the guideline runs without every answer typed in: `"no"` for a yes/no item; for a baseline item, a value on the main path (the therapy plan is entered and the Decision recommends a candidate); a plausible adult value for a number (age 65). A plan-gating item's default meets the plan's precondition. A derived item has none;
- the description states the default: "Default <value> for running and testing; the clinician confirms the actual value." A default can hide a question never asked, so the clinician must confirm a plan-gating item.

The gate fails a mandatory item without a default and warns on any other Enquiry item without one.

## What to populate (do not leave empty)

Enumerate every item the eligibility Decision and the monitoring baselines need, from the guidelines the user provided:

- **Eligibility**: the indication thresholds (`<threshold_measure>`), qualifying comorbidities, contraindications named by the guideline or the label, and current medications that scope a harm (e.g. `on_interacting_medication`).
- **Safety baselines**: the organ functions and histories the label or guideline says to check before starting.
- **Monitoring baselines**: the baseline value of every measure a desired-outcome monitor later compares against.

Each baseline item should have a corresponding desired/undesired monitoring action later, so the Enquiry, the Decision, and the Monitoring Plan stay consistent.

## Tool calls

Every call also takes `file`. One data item:

```
add_task(plan: "<root>", kind: "enquiry", name: "Get_Eligibility_Data",
         caption: "Retrieve the data needed to judge eligibility and to set monitoring baselines")
add_data_item(name: "threshold_measure", type: "real", unit: "<unit>")
set_attribute(selector: "threshold_measure", attribute: "caption", value: "<the measure, as asked>")
set_attribute(selector: "threshold_measure", attribute: "description", value: "<what it is>; primary eligibility threshold")
set_attribute(selector: "threshold_measure", attribute: "metaprops",
              value: "ontology.coding=SCT:<id> [<preferred term, as returned by snomed_search>]")
set_attribute(selector: "threshold_measure", attribute: "default_value", value: "<a value on the main path>")
add_source(task: "Get_Eligibility_Data", data: "threshold_measure", mandatory: false)
```

A yes/no data item modelled from a specific passage also carries that passage:

```
add_data_item(name: "on_interacting_medication", type: "text",
              range: "\"yes||yes\", \"no||no\"", default_value: "\"no\"")
set_attribute(selector: "on_interacting_medication", attribute: "caption", value: "On <the interacting medication class>?")
set_attribute(selector: "on_interacting_medication", attribute: "metaprops",
              value: "ontology.coding=SCT:<id> [<preferred term>]\nsource=<Drug> US Prescribing Information, §<n> <Warning>\nquote=§<n>: \"<verbatim sentence that scopes the harm to patients on the interacting medication>\"")
add_source(task: "Get_Eligibility_Data", data: "on_interacting_medication", mandatory: false)
```

A plan-gating item keeps its mandatory source (the default) and a default that meets the plan's precondition:

```
add_data_item(name: "contraindication_present", type: "text",
              range: "\"yes||yes\", \"no||no\"", default_value: "\"no\"")
add_source(task: "Get_Eligibility_Data", data: "contraindication_present")
```

## `.pf` text

```
enquiry  :: 'Get_Eligibility_Data' ;
     caption :: 'Retrieve the data needed to judge eligibility and to set monitoring baselines' ;
     description :: '...' ;
     source :: 'threshold_measure' ;
          data_definition :: 'threshold_measure' ;
          mandatory :: no ;
     source :: 'on_interacting_medication' ;
          data_definition :: 'on_interacting_medication' ;
          mandatory :: no ;
     ...
end enquiry.

data  :: 'threshold_measure' ;
     type :: real ;
     caption :: '<the measure, as asked>' ;
     description :: '<what it is>; primary eligibility threshold. Default <v> for running and testing; the clinician confirms the actual value.' ;
     metaprops :: 'ontology.coding=SCT\\:<id> [<preferred term>]
' ;
     unit :: '<unit>' ;
     default_value :: <v> ;
end data.

data  :: 'on_interacting_medication' ;
     type :: text ;
     caption :: 'On <the interacting medication class>?' ;
     range ::"yes||yes","no||no";
     default_value :: "no" ;
end data.
```

## ADE Enquiries (Monitor Undesired ADEs)

Enquiries have a second use: each ADE monitor in `Monitor_Undesired_State` is an Enquiry (`Monitor_<ADE>`) that keeps the monitor's goal and metaprops contract and asks for the symptoms and bedside exam findings of that ADE, one data item each (yes/no `text` for a symptom or sign, `real`/`integer` with a `unit` for a measured value; caption phrased as the question; default `"no"` or a normal value; non-mandatory source; **SNOMED CT coding required**, `SCT:<id> [<caption>]`). A finding several ADEs ask about is one data item, sourced by each of those Enquiries. Its test step reads only these items in its precondition (`a = "yes" or b = "yes" ...`, never a scheduling item such as `renal_function_check_due`). An ADE with no test in its sources asks for a `suspected_<ade>` item instead, read by its alert Action. The full pattern is `skills/cig-monitoring/references/ADEMonitoringEnquiry.md`.

## Structural example

In `cig/examples/ccd-antithrombotic-monitoring.pf`, the Enquiry `Get_Antithrombotic_Data` asks for 14 typed data items: 13 yes/no `text` flags (e.g. `requires_oral_anticoagulation`, `pci_within_12_months`, `prior_ich`, `active_pathological_bleeding`, `on_digoxin_or_diuretic`) and one `integer` with a unit (`age_years`, years). Each carries a caption phrased as the question, a description saying which Decision argument or precondition reads it (e.g. `prior_ich` "excludes vorapaxar (Rec 8), prasugrel (Rec 9) and ticagrelor"; `active_pathological_bleeding` gates the therapy plan, so its source is mandatory, with default `"no"`; `on_digoxin_or_diuretic` widens a monitor's population), a default value, its SNOMED CT coding (left uncoded, and said so in the approved proposal, where no concept fits), and the `source` + `quote` it came from; the baseline values no condition reads (hemoglobin, platelet count, creatinine clearance, body weight, the medication list) are listed in the Enquiry's description. Use it to see how an Enquiry is populated; its clinical items are not a template. Prefer wiring every item the Decision or a precondition uses as a typed data item over listing it only in the description.

## Related patterns

- `Decision.md` (consumes these data items), `Data.md` (all native data-item properties), `TaskProperties.md`, `Ontology.md`; in `skills/cig-monitoring/references/`: `ADEMonitoringEnquiry.md` (ADE monitors as Enquiries), `TopLevelPlan.md`, `MonitoringPlan.md`, `MetapropsSyntax.md` (population-scoped preconditions).
