# Worked PROforma CIG

The kit has one worked example, `ccd-antithrombotic-monitoring`. It is a lint-clean PROforma guideline that passes the Step 7 gates (`scripts/check_cig.mjs` with 0 FAIL, and every CQ in `scripts/run_cqs.mjs`) against its latest approved proposal. It comes as:

| File | What it is |
|---|---|
| `<name>.pf` | the guideline (PROforma 1.9; opens in Deontics Composer) |
| `<name>.html` | a self-contained viewer, built with the proforma skill's `scripts/build_report.mjs` (one file, nothing fetched). It has a task tree, a plan canvas (pan, zoom, double-click a plan to open it), a properties panel, and data, decision, lint and source views |
| `<name>.mmd` | Mermaid diagram of the plan structure |
| `<name>.cqs.mjs` | competency-question queries |
| `<name>-build/` | the build record: extraction, proposals and gate reports |

**Use it as a structural example only.** It shows the full top-level plan, how an Enquiry's data items and a Decision's candidates and arguments are populated, the ADE Enquiry pattern (`skills/cig-monitoring/references/ADEMonitoringEnquiry.md`), and the task contract in `skills/cig-monitoring/references/MetapropsSyntax.md`: Composer's native task properties first (caption, description, procedure, precondition, Ontology coding; see `cig/know-how/proforma/TaskProperties.md`), the monitoring order as an HL7 FHIR `ServiceRequest` (the `ServiceRequest.*` metaprops, repeated in `goal.noun_phrase` and stated in the native `procedure`, or in the description of an ADE Enquiry), a verbatim `quote.N` with every `source.N`, and terminology coding (SNOMED CT with `snomed_search`, LOINC with `loinc_search`, RxNorm with `rxnorm_search`).

Its clinical content (antiplatelet and oral anticoagulant therapy in chronic coronary disease) is **not** a template for which monitors a new CIG should model, and its task names are not names to reuse: those come from the user's own guidelines (in `projects/<project_dir>/resources/`) and the approved proposal. The design patterns to follow are in `skills/cig-monitoring/references/`.

To re-run the gates on it:

```bash
node scripts/check_cig.mjs cig/examples/ccd-antithrombotic-monitoring.pf --proposal cig/examples/ccd-antithrombotic-monitoring-build/PROPOSAL-20261105-234339.md
node scripts/run_cqs.mjs cig/examples/ccd-antithrombotic-monitoring.pf cig/examples/ccd-antithrombotic-monitoring.cqs.mjs --proposal cig/examples/ccd-antithrombotic-monitoring-build/PROPOSAL-20261105-234339.md
```

## `ccd-antithrombotic-monitoring`: antithrombotic therapy in chronic coronary disease

Antiplatelet and oral anticoagulant therapy for adults with chronic coronary disease (CCD), with monitoring of regimen completion, ischemic events and adverse drug effects. Sources:

- **Guideline:** 2023 AHA/ACC/ACCP/ASPC/NLA/PCNA Guideline for the Management of Patients With Chronic Coronary Disease (Virani et al., Circulation 2023;148:e9–e119, doi:10.1161/CIR.0000000000001168), **§4.3.1 only** (pp. e50–e55): Recs 1–16, the Synopsis, Figure 9 and the supportive text.
- **Package inserts:** the 11 FDA labels of the drugs §4.3.1 names: aspirin (OTC low-dose and DURLAZA), clopidogrel, ticagrelor, prasugrel, vorapaxar, rivaroxaban, apixaban, edoxaban, dabigatran and pantoprazole. Every Boxed Warning, contraindication and Warnings and Precautions section is accounted for in the extraction. The labels are in `ccd-antithrombotic-monitoring-build/resources/`, as retrieved with `scripts/fetch_package_insert.mjs`; each file's header gives its source and date. The guideline itself is copyrighted and is not in the repository; get it from the DOI.
- Case reports and mechanism-of-action harms were not opted in.

The source documents are not included.

### What it demonstrates

- **The full top-level plan.** Root plan `ccd_antithrombotic_monitoring` (`goal.verb=treat`): the Enquiry `Get_Antithrombotic_Data`, the Decision `Antithrombotic_Regimen_Decision`, the therapy plan `Antithrombotic_Therapy` and `Monitoring_Plan`, in sequence (`skills/cig-monitoring/references/TopLevelPlan.md`).
- **A populated Enquiry.** 14 typed baseline data items (e.g. `requires_oral_anticoagulation`, `pci_within_12_months`, `prior_ich`, `age_years`), each with a question caption, a description of what reads it, its SNOMED CT coding and a quoted source (`cig/know-how/proforma/Enquiry.md`).
- **Data items that run in the Deontics engine** (`cig/know-how/proforma/Data.md`). There is no `boolean` item: a yes/no fact is `text` with the range `"yes||yes","no||no"`, compared with `= "yes"` / `= "no"`. Every data item has a `default_value`, so the guideline runs without every answer typed in (with the defaults it recommends aspirin monotherapy and enters the therapy plan). Only `active_pathological_bleeding`, which gates the therapy plan, is a mandatory source; every other source is `mandatory :: no`. Every component carries its task's caption and description, which is what Composer shows.
- **A multi-candidate Decision.** Nine regimen candidates along the Figure 9 pathways, with `for`, `against` and `excluding` arguments over the data items. Each argument's caption carries the recommendation's class and level of evidence (e.g. Rec 7 [3: No benefit] as an `against` argument, Rec 8 [3: Harm] as an `excluding` one), and its metaprops carry the source and quote (`cig/know-how/proforma/Decision.md`).
- **A nested Decision in the therapy plan.** `P2Y12_Agent_Decision` picks the P2Y12 inhibitor only for the regimens that contain one. The therapy plan is gated by `active_pathological_bleeding = "no"`; each `Prescribe_*` action has an `achieve` or `avoid` goal, a dose and duration procedure, a precondition over `result_of` the decision that chose it, and SNOMED CT and RxNorm codes. A "should not be used" recommendation (chronic NSAIDs) is the advice action `Advise_Avoid_Chronic_NSAIDs` with an `avoid` goal (`TherapyPlan.md`, `StateAchievementGoal.md`).
- **All three monitoring sub-plans.** `Monitor_Actions` (4 action-completion monitors), `Monitor_Desired_State` (`Monitor_Ischemic_Events`) and `Monitor_Undesired_State` (`MonitoringPlan.md`).
- **Drug-gated and sub-population monitors.** A monitor of one drug's harm keeps `applies_when=all_patients_on_therapy` and is gated by a `result_of` precondition on the regimens containing the drug. `Monitor_PPI_Hypomagnesemia` (reads `on_digoxin_or_diuretic`) and `Monitor_PPI_Bone_Fracture` (reads `previous_mi`) are narrowed to a sub-population over Enquiry data items.
- **The ADE Enquiry pattern.** `Display_Potential_ADEs` lists the 17 ADEs; each ADE monitor is an Enquiry collecting SNOMED CT coded symptoms and bedside findings, followed when a test is named by an `Order_<Test>` Action or a `Tests_Ordering_Recommendations_<ADE>` Decision with LOINC coded tests, gated on a positive finding. The 7 ADEs whose sources name no test ask instead whether the ADE is suspected (`suspected_<ade>`) and are followed by an `Alert_Further_Examination_<ADE>` Action gated on `suspected_<ade> = "yes"` (`ADEMonitoringEnquiry.md`).

### How it was built

It was built end to end by the kit's own workflow and subagents (Steps 1–7). `ccd-antithrombotic-monitoring-build/` keeps the record, and is the kit's real example of an extraction, a Step 4 proposal (in a project, `projects/<project_dir>/plans/PROPOSAL-<timestamp>.md`), an iteration proposal and a review record. The record is historical and is not updated: the `projects/ccd-antiplatelet-monitoring/...` paths inside those files refer to the original project directory, where the guideline was `guideline/ccd_antithrombotic_monitoring.pf`.

1. `EXTRACTION-20261029.md`: Steps 2–3. Every recommendation of §4.3.1 and every label section is accounted for, with citations, verbatim quotes (each checked word for word against the source files), data items, draft conditions and open questions.
2. `PROPOSAL-20261029-165226.md`: the first approved proposal (the full top-level plan, CQ1–CQ9), approved with the defaults for its ten open questions. It carries two revisions made after Step 7 reviews:
   - **Revision 2:** the first review passed the deterministic gate but failed six judgment checks (Figure 9 quotes, the ticagrelor dose, a gap in the P2Y12 agent rule, the gating of two monitors). Each fix restored the approved rule or the source; the guideline was rebuilt from a fresh file after a baseline snapshot.
   - **Revision 3:** the re-review failed one judgment check (perioperative interruption must not apply to aspirin monotherapy). After the fix the full gate passed with 9/9 CQs.
3. `PROPOSAL-20261030-191149.md`: the ADE-Enquiry iteration, after Mor Peleg's new know-how of 30 October 2026. The 17 ADE monitors changed from Actions to Enquiries with coded findings and test steps, `Display_Potential_ADEs` was added, the drug actions gained RxNorm codes, and CQ10 was added. Its Step 0 carry-forward check retains every baseline element. Its own Revision 2 fixed three judgment FAILs from the first review of the iteration (the hypotension gate of the bleeding tests, the CYP2C19 genotype gate, a finding's SNOMED CT code).
4. `PROPOSAL-20261105-234339.md`: the runnable-data iteration, after Mor Peleg ran the guideline in the Deontics engine (4 November 2026). Yes/no items became `text` with a yes/no range, every data item got a default, only the plan-gating item stayed mandatory, components got their task's caption and description, the two `*_check_due` items were removed, the 7 suspected-ADE alerts were added, and CQ11–CQ12 were added. Its Revision 2 fixed one judgment FAIL from the first review (the lupus alert's provenance said the label names no test, but PROTONIX §5.6 mentions ANA as a result that may be positive).
5. `reviews/`: the gate reports. The newest are the final full re-run of the runnable-data iteration: `check_cig.mjs` with 0 FAIL, the judgment phases with 0 FAIL, and 12/12 CQs.

Known, non-blocking points (left for a future revision):
- `check_cig.mjs` WARNs on each drug-gated monitor (a precondition on an action that applies to all patients on therapy). The convention was approved in the first proposal's Revision 3: `all_patients_on_therapy` means everyone on the drug, and the precondition selects the regimens containing it.
- Some SNOMED CT codes are the nearest concept rather than an exact one (e.g. `Prescribe_DOAC` is coded as anticoagulant therapy); they were accepted at approval and are listed in the proposals' §7. `on_digoxin_or_diuretic` is uncoded.
- A reviewer advisory (long DAPT after ACS under the `DAPT` candidate does not trigger the fracture monitor, which fires only for extended DAPT) was not adopted and is noted for the next iteration.

Several parts of the design were proposed by the assistant rather than taken from the sources, and each is marked as such in the metaprops, captions and descriptions: the P2Y12 agent rule, the monitoring cadences (§4.3.1 gives none), one class-level DOAC action, and pantoprazole during DOAC plus antiplatelet therapy (off-label).

## Retired example

The kit's earlier example, `ici-irae-monitoring` (immune checkpoint inhibitor toxicity, from the ESMO 2017 toxicity guideline), was retired. It predates the ADE Enquiry pattern: its ADE monitors were Actions with symptoms and tests as metaprops text, so the current gate FAILed it on the `ade` rules. It remains in the git history.
