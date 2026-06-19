# Design Pattern: Enquiry (populated)

**Intent:** The first task of the Top-Level Plan: retrieve the **data items** needed to decide eligibility and to set monitoring baselines. An Enquiry that lists no data items is a **defect** — the agent must study the data the guideline needs and populate the items (this was a concrete failure Mor flagged: "the Enquiry had no data items").

## PROforma elements

- Classes: `Enquiry` (a `Task`), `Source`, `Data`
- Properties: `sources` (Enquiry→Source), `sref` (Source→Data, functional), and on `Data`: `name`, `description`, `unit`, `value`, `defaulty_value`, `derivation`
- `Task` data properties usable on the Enquiry: `name`, `caption`, `description`

## How data items attach (PROforma has no direct Enquiry→Data property)

Each retrieved data item is a `Data` individual reached through a `Source`:

```
Enquiry --sources--> Source_X --sref--> Data_X
```

So per data item you assert: a `Source`, `sources` from the Enquiry to it, `sref` to a `Data`, the `Data` class assertion, and at least `name` + `description` on the `Data`.

## What to populate (do not leave empty)

Enumerate every item the eligibility Decision and the monitoring baselines need. For an obesity GLP-1 CIG that is, at minimum:

- **Eligibility**: BMI; weight-related comorbidity (T2DM, hypertension, dyslipidemia, OSA, NAFLD); contraindications (personal/family MTC or MEN2, prior pancreatitis, pregnancy/planned pregnancy); current medications.
- **Safety baselines**: renal function (eGFR); thyroid history; mood/psychiatric history (prior depression/suicidality).
- **Monitoring baselines**: baseline weight; baseline body composition (lean vs fat mass); baseline cardiometabolic labs (HbA1c, fasting glucose, lipid panel, blood pressure); baseline quality of life.

Each baseline item should have a corresponding desired/undesired monitoring action later, so the Enquiry, the Decision, and the Monitoring Plan stay consistent.

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, project prefix shown as `og:`.

```
ObjectPropertyAssertion(pf:taskref og:Eligibility_Data_Component og:Get_Eligibility_Data)
ClassAssertion(pf:Enquiry og:Get_Eligibility_Data)
DataPropertyAssertion(pf:caption og:Get_Eligibility_Data "Retrieve baseline data needed to judge eligibility and set monitoring baselines")

# one data item
ClassAssertion(pf:Source og:Src_BMI)
ObjectPropertyAssertion(pf:sources og:Get_Eligibility_Data og:Src_BMI)
ObjectPropertyAssertion(pf:sref og:Src_BMI og:Data_BMI)
ClassAssertion(pf:Data og:Data_BMI)
DataPropertyAssertion(pf:name og:Data_BMI "BMI")
DataPropertyAssertion(pf:unit og:Data_BMI "kg/m2")
DataPropertyAssertion(pf:description og:Data_BMI "Body mass index; primary eligibility threshold")
```

## Worked example (`cig/examples/obesity-glp1-monitoring.owl`)

`Get_Eligibility_Data` (Enquiry) wires BMI, weight-related comorbidity, contraindications, baseline weight, baseline body composition, and baseline cardiometabolic labs as `Source`→`Data` pairs, and enumerates the full item list in its `description`. Imitate this — never emit an Enquiry with no data items.

## Related patterns

- `Decision.md` (consumes these data items), `TopLevelPlan.md`, `MonitoringPlan.md`.
