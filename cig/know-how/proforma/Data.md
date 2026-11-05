# Reference: data items (Deontics Composer)

How a PROforma guideline represents the data it collects or computes. Data items carry the guideline's logic: every precondition, decision argument and derivation reads them, so anything a condition depends on is a typed data item. Data items are not tasks; an Enquiry asks for them (its sources), and a Decision may also list them as sources.

The property names and quoted descriptions come from Composer's data item property sheet (the PROforma connector module of the installed Composer).

## Properties

"Data item properties."

| Composer property | Composer's description | `.pf` attribute | Set with |
|---|---|---|---|
| Name | "The internal name for this data item" | block name, `data :: '<name>'` (identifier) | `add_data_item(name:)`; `rename` |
| Type | "The type of this data item" | `type` (comes first in the block) | `add_data_item(type:)` |
| Caption | "A human-readable caption for this data item" | `caption` | `set_attribute(attribute: "caption")` |
| Description | "A short human-readable description" | `description` | `set_attribute(attribute: "description")` |
| Display name | "Short name or caption to be used in reports generated from patient data" | a metaprop (Composer's display-name key) | |
| **Ontology coding** | "Term in a controlled vocabulary or ontology corresponding to this data item" | metaprop `ontology.coding=<prefix>:<code> [<caption>]` in the data item's own metaprops (`Ontology.md`) | `set_attribute(attribute: "metaprops")` |
| Units | "Units this data item is expressed in" | `unit` | `add_data_item(unit:)` |
| Range and Default Value | "Allowed values for the data item." | `range`, `default_value` | `add_data_item(range:, default_value:)`; `set_attribute` |
| Derivation | "An expression used to calculate the value of this data item at the moment it becomes requested." | `derivation :: <expr>` | `add_data_item(derivation:)` |
| Dynamic | "A dynamic data item has its value calculated from other data rather than directly set." | `dynamic :: yes` | `set_attribute(attribute: "dynamic", value: "yes")` |
| Metaproperties | "The data item's metaproperties" | `metaprops` | `set_attribute(attribute: "metaprops")` |

Other attributes the language reference lists: `mandatory_validation :: <expr>`, `true_value` / `false_value` (the captions of a boolean's two values; the kit does not use `boolean`, see Type) and `warning_condition :: <n>, <expr>` with its own caption.

## Type

`integer`, `real`, `text`, `date`, `time`, `datetime`, and the set types `setof_text`, `setof_integer`, `setof_real`. The language also has `boolean`, but Composer and the Deontics engine do not (the engine passes every value as a string), so the kit never uses it: `type :: boolean` is a gate FAIL.

- `text` with the range `"yes||yes", "no||no"` for a yes/no fact (a symptom, a contraindication, a sub-population flag such as `on_interacting_medication`); conditions compare it with `= "yes"` / `= "no"`, never `= true`, `= false` or `not(...)`.
- `real` (or `integer`) with a `unit` for a measured value (`systolic_bp`, mmHg; `age_years`, years); conditions compare it with `<`, `>=`, ...
- `text` with a `range` for a fixed value set, compared with `=`.
- `setof_text` for a multiple selection, tested with `includes`.

## Caption, description

The **caption** is what the user is asked or shown: phrase an Enquiry source as the question (`Does the patient have an indication for long-term oral anticoagulation (e.g. atrial fibrillation)?`). The **description** says what the item records and which decision argument or precondition reads it; when the ontology coding is a near match, it also says what the concept records instead.

## Range and default value

`range :: v1, v2, ... ;` lists the allowed values: numbers (`range :: 0, 120;` for an integer bounded 0 to 120) or strings. For captioned choices Composer writes each value as `"<value>||<Caption>"`: the part before `||` is the value conditions compare against, the part after it is what Composer shows.

```
data  :: 'regimen_class' ;
     type :: text ;
     caption :: 'Planned antithrombotic regimen' ;
     range :: "sapt||Single antiplatelet therapy", "dapt||Dual antiplatelet therapy";
end data.
```

A condition compares the value: `regimen_class = "dapt"`. A yes/no item is the same pattern with two values:

```
data  :: 'active_pathological_bleeding' ;
     type :: text ;
     caption :: 'Does the patient have active pathological bleeding?' ;
     range :: "yes||yes", "no||no";
     default_value :: "no" ;
end data.
```

`default_value :: <expr> ;` gives the value used until the item is set. Every data item an Enquiry asks for has one, so the guideline runs in the engine without every answer typed in:

- findings (symptoms, signs, the `suspected_` item of an ADE Enquiry): `"no"`;
- numeric bedside values: a normal value that does not trigger the test step (systolic 120 and diastolic 80 mmHg, heart rate 70/min);
- baseline items: a value on the guideline's main path (the therapy plan is entered and the regimen decision recommends a candidate); numeric ones a plausible adult value (age 65).

The description says so: "Default <value> for running and testing; the clinician confirms the actual value." A derived item has no default. `check_cig.mjs` warns on an Enquiry data item without one (FAIL for a mandatory item).

## Derivation and dynamic

`derivation :: <expr> ;` computes the item from other data when it is requested, e.g. a body mass index from weight and height. With `dynamic :: yes ;` the value is recomputed continuously. A dynamic item cannot be an Enquiry source; derive it instead of asking for it. A derivation is an expression like any condition: type-check it with `check_expression`.

## Enquiry sources and mandatory

An Enquiry asks for a data item through a source: `source :: '<item>' ;` followed by `data_definition :: '<item>' ;` and `mandatory :: yes|no ;`. A source with no `mandatory` line is mandatory, and the engine does not complete an Enquiry while a mandatory value is missing. So every source is written `mandatory :: no ;` (`add_source(task:, data:, mandatory: false)`), except a **plan-gating** item: one a plan's precondition reads (e.g. `active_pathological_bleeding`, read by the therapy plan's precondition). Its source stays mandatory, and its `default_value` meets the plan's precondition (`"no"` here), so a test run enters the plan instead of discarding it; its description says the clinician must confirm the value, since a default can hide a question never asked. `add_source` can also create the item with `create_type`. A data item a precondition or argument reads must be asked for by an Enquiry (or derived); `check_cig.mjs` reports items nothing asks for or derives. One finding several Enquiries ask about is one data item, sourced by each.

## Ontology coding and source quotes

Both live in the data item's own metaprops, written in one call:

- `ontology.coding=SCT:<id> [<caption>]`: the observable or finding the item records, found with `snomed_search` (`Ontology.md`). Code every item that names a clinical concept; leave a composite flag uncoded and say so in its description.
- `source=<citation>` + `quote=<page or section>: "<verbatim passage>"` when the item was modelled from a specific passage (a threshold, a contraindication, a sub-population flag).

## Tool calls

Every call also takes `file`.

```
add_data_item(name: "systolic_bp", type: "real", unit: "mmHg",
              caption: "Systolic blood pressure (mmHg)")
set_attribute(selector: "systolic_bp", attribute: "description",
              value: "Bedside systolic blood pressure; below 90 mmHg triggers the bleeding test step")
set_attribute(selector: "systolic_bp", attribute: "metaprops",
              value: "ontology.coding=SCT:271649006 [Systolic blood pressure (observable entity)]")
set_attribute(selector: "systolic_bp", attribute: "default_value", value: "120")
add_source(task: "Monitor_Bleeding", data: "systolic_bp", mandatory: false)

add_data_item(name: "melena", type: "text", range: "\"yes||yes\", \"no||no\"",
              default_value: "\"no\"", caption: "Black, tarry stools?")
add_source(task: "Monitor_Bleeding", data: "melena", mandatory: false)

add_data_item(name: "regimen_class", type: "text",
              range: "\"sapt||Single antiplatelet therapy\", \"dapt||Dual antiplatelet therapy\"")
add_data_item(name: "bmi", type: "real", unit: "kg/m2", derivation: "weight_kg / (height_m * height_m)")
check_expression(expression: "systolic_bp < 90 or melena = \"yes\"")
```

## `.pf` text

```
data  :: 'systolic_bp' ;
     type :: real ;
     caption :: 'Systolic blood pressure (mmHg)' ;
     description :: 'Bedside systolic blood pressure; below 90 mmHg triggers the bleeding test step' ;
     metaprops :: 'ontology.coding=SCT\\:271649006 [Systolic blood pressure (observable entity)]
' ;
     unit :: 'mmHg' ;
     default_value :: 120 ;
end data.
```

## Related

- `Enquiry.md` (populating an Enquiry's data items), `Decision.md` (arguments over them), `Ontology.md` (coding), `TaskProperties.md` (task properties).
- `skills/cig-monitoring/references/ADEMonitoringEnquiry.md` (the findings an ADE Enquiry asks for).
