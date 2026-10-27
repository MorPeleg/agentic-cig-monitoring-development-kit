# Design Pattern: Enquiry (populated)

**Intent:** The first task of the Top-Level Plan: retrieve the **data items** needed to decide eligibility and to set monitoring baselines. An Enquiry with no sources is a **defect** — the agent must study the data the guideline needs and populate the items (this was a concrete failure Mor flagged: "the Enquiry had no data items").

## PROforma elements

Composer's native properties for an enquiry and its data items are listed in `TaskProperties.md`. The ones this pattern uses:

- Task: `enquiry`, with the common task properties (Caption, Description, **Ontology coding**, **Precondition** when the enquiry applies only to some patients) and its kind-specific **Sources**: a `source` whose `data_definition` names the data item it asks for (optional `mandatory :: yes`).
- Data item: `data` block with the native **Type** (`real`, `integer`, `boolean`, `text`, `date`, …), **Caption** (the question as asked), **Description**, and when they apply **Units** (`unit`), **Range and Default Value** (`range`, `default_value`), **Derivation** (`derivation`, an expression computing the value) and **Dynamic**. A dynamic data item cannot be an Enquiry source.
- Data item **Ontology coding**: the observable or finding the item records (`ontology.coding=SNOMED:<id>` + `ontology.label`, found with `snomed_search`). Set it on every item that names a clinical concept; leave an item uncoded only when no single concept fits (e.g. a composite flag), and say so in its description.
- Data item metaprops: a `source` + `quote` when the item comes from a specific passage (e.g. a contraindication or a sub-population flag).
- Tools: `add_task`, `add_data_item`, `add_source` (can create the data item itself with `create_type`), `set_attribute` (data item `caption`, `description`, `metaprops`), `snomed_search`

## Types matter

The data items are what the Decision's arguments and the monitoring preconditions compute over, so give each a real type:

- `real` (or `integer`) for numeric thresholds, with `unit` (e.g. a measured value in its unit);
- `boolean` for yes/no facts (e.g. `qualifying_comorbidity`, `on_interacting_medication`);
- `text` with a `range` for a fixed value set (e.g. a planned regimen class), compared with `=`.

A data item that a precondition or argument uses must be asked for by an Enquiry; `check_cig.mjs` fails a sub-population precondition over a data item no Enquiry asks for.

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
              value: "ontology.coding=SNOMED:<id>\nontology.label=<preferred term, as returned by snomed_search>")
add_source(task: "Get_Eligibility_Data", data: "threshold_measure")
```

A data item modelled from a specific passage also carries that passage:

```
add_data_item(name: "on_interacting_medication", type: "boolean")
set_attribute(selector: "on_interacting_medication", attribute: "caption", value: "On <the interacting medication class>?")
set_attribute(selector: "on_interacting_medication", attribute: "metaprops",
              value: "ontology.coding=SNOMED:<id>\nontology.label=<preferred term>\nsource=<Drug> US Prescribing Information, §<n> <Warning>\nquote=§<n>: \"<verbatim sentence that scopes the harm to patients on the interacting medication>\"")
add_source(task: "Get_Eligibility_Data", data: "on_interacting_medication")
```

## `.pf` text

```
enquiry  :: 'Get_Eligibility_Data' ;
     caption :: 'Retrieve the data needed to judge eligibility and to set monitoring baselines' ;
     description :: '...' ;
     source :: 'threshold_measure' ;
          data_definition :: 'threshold_measure' ;
     source :: 'on_interacting_medication' ;
          data_definition :: 'on_interacting_medication' ;
     ...
end enquiry.

data  :: 'threshold_measure' ;
     type :: real ;
     caption :: '<the measure, as asked>' ;
     description :: '<what it is>; primary eligibility threshold' ;
     metaprops :: 'ontology.coding=SNOMED\\:<id>
ontology.label=<preferred term>
' ;
     unit :: '<unit>' ;
end data.
```

## Structural example

In `cig/examples/ici-irae-monitoring.pf`, the Enquiry `Get_Baseline_Data` asks for four typed data items (three `boolean` risk flags and one `text` item with a `range`). Each carries a caption phrased as the question, a description saying which Decision argument or precondition reads it, its SNOMED CT coding, and the `source` + `quote` it came from; the baseline values no condition reads are listed in the Enquiry's description. Use it to see how an Enquiry is populated; its clinical items are not a template. Prefer wiring every item the Decision or a precondition uses as a typed data item over listing it only in the description.

## Related patterns

- `Decision.md` (consumes these data items), `TopLevelPlan.md`, `MonitoringPlan.md`, `TaskProperties.md` (all native data-item properties), `MetapropsSyntax.md` (population-scoped preconditions).
