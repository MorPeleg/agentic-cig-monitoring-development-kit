# Design Pattern: Enquiry (populated)

**Intent:** The first task of the Top-Level Plan: retrieve the **data items** needed to decide eligibility and to set monitoring baselines. An Enquiry with no sources is a **defect** — the agent must study the data the guideline needs and populate the items (this was a concrete failure Mor flagged: "the Enquiry had no data items").

## PROforma elements

- Task: `enquiry` (with `caption`, `description`)
- Data item: `data` block with `type` (`real`, `integer`, `boolean`, `text`, `date`, …), `caption`, `description`, optional `unit`, `range`, `default_value`, `derivation`
- Link: a `source` in the enquiry whose `data_definition` names the data item (the enquiry asks for it)
- Data item metaprops: Composer's Ontology coding of the observable or finding the item records (`ontology.coding=SNOMED:<id>` + `ontology.label`, e.g. BMI → `SNOMED:60621009` Body mass index (observable entity)), and a `source` + `quote` when the item comes from a specific passage (e.g. a contraindication or a sub-population flag). Leave an item uncoded when no single concept fits (e.g. a composite flag).
- Tools: `add_task`, `add_data_item`, `add_source` (can create the data item itself with `create_type`), `set_attribute` (data item `description`, `metaprops`), `snomed_search`

## Types matter

The data items are what the Decision's arguments and the monitoring preconditions compute over, so give each a real type:

- `real` (or `integer`) for numeric thresholds, with `unit` (e.g. `BMI`, kg/m2);
- `boolean` for yes/no facts (e.g. `weight_related_comorbidity`, `on_insulin_or_secretagogue`);
- `text` otherwise (e.g. `contraindications`, compared with `= none`).

A data item that a precondition or argument uses must be asked for by an Enquiry; `check_cig.mjs` fails a sub-population precondition over a data item no Enquiry asks for.

## What to populate (do not leave empty)

Enumerate every item the eligibility Decision and the monitoring baselines need. For an obesity GLP-1 CIG that is, at minimum:

- **Eligibility**: BMI; weight-related comorbidity (T2DM, hypertension, dyslipidemia, OSA, NAFLD); contraindications (personal/family MTC or MEN2, prior pancreatitis, pregnancy/planned pregnancy); current medications (including concomitant insulin or an insulin secretagogue, which scopes hypoglycemia monitoring).
- **Safety baselines**: renal function (eGFR); thyroid history; mood/psychiatric history (prior depression/suicidality).
- **Monitoring baselines**: baseline weight; baseline body composition (lean vs fat mass); baseline cardiometabolic labs (HbA1c, fasting glucose, lipid panel, blood pressure); baseline quality of life.

Each baseline item should have a corresponding desired/undesired monitoring action later, so the Enquiry, the Decision, and the Monitoring Plan stay consistent.

## Tool calls

Every call also takes `file`. One data item:

```
add_task(plan: "<root>", kind: "enquiry", name: "Get_Eligibility_Data",
         caption: "Retrieve baseline data needed to judge GLP-1 eligibility and to set monitoring baselines")
add_data_item(name: "BMI", type: "real", unit: "kg/m2")
set_attribute(selector: "BMI", attribute: "description", value: "Body mass index; primary eligibility threshold")
set_attribute(selector: "BMI", attribute: "metaprops",
              value: "ontology.coding=SNOMED:60621009\nontology.label=Body mass index (observable entity)")
add_source(task: "Get_Eligibility_Data", data: "BMI")
```

A data item modelled from a specific passage also carries that passage:

```
set_attribute(selector: "on_insulin_or_secretagogue", attribute: "metaprops",
              value: "source=Wegovy (semaglutide) US Prescribing Information (revised 02/2026), §5.4 Hypoglycemia\nquote=§5.4: \"Patients with diabetes mellitus taking WEGOVY in combination with insulin or an insulin secretagogue may have an increased risk of hypoglycemia\"")
```

## `.pf` text (from the example)

```
enquiry  :: 'Get_Eligibility_Data' ;
     caption :: 'Retrieve baseline data needed to judge GLP-1 eligibility and to set monitoring baselines' ;
     description :: '...' ;
     source :: 'BMI' ;
          data_definition :: 'BMI' ;
     source :: 'weight_related_comorbidity' ;
          data_definition :: 'weight_related_comorbidity' ;
     ...
end enquiry.

data  :: 'BMI' ;
     type :: real ;
     description :: 'Body mass index; primary eligibility threshold' ;
     metaprops :: 'ontology.coding=SNOMED\\:60621009
ontology.label=Body mass index (observable entity)
' ;
     unit :: 'kg/m2' ;
end data.

data  :: 'weight_related_comorbidity' ;
     type :: boolean ;
     description :: 'Presence of type 2 diabetes, hypertension, dyslipidemia, OSA, or NAFLD; lowers BMI threshold to 27' ;
end data.
```

## Worked example (`cig/examples/obesity-glp1-monitoring.pf`)

`Get_Eligibility_Data` (enquiry) has sources for `BMI`, `weight_related_comorbidity`, `contraindications`, `on_insulin_or_secretagogue`, `baseline_weight`, `baseline_body_composition`, and `baseline_cardiometabolic_labs`, and enumerates the full item list in its `description`; items that name a clinical concept carry their SNOMED CT coding. Imitate this — never emit an Enquiry with no sources. Prefer wiring every item the Decision or a precondition uses as a typed data item over listing it only in the description.

## Related patterns

- `Decision.md` (consumes these data items), `TopLevelPlan.md`, `MonitoringPlan.md`, `MetapropsSyntax.md` (population-scoped preconditions).
