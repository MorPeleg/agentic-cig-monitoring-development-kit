# Design Pattern: ADE monitoring as Enquiries with test ordering

**Intent:** Make the monitoring of undesired drug effects executable rather than descriptive. Before this pattern, an ADE monitor was an Action whose metaprops held, as text, the symptoms to ask about, the bedside exam to do and the tests to order. With this pattern:

- the symptoms and exam findings become **data items an Enquiry collects** (coded in SNOMED CT);
- the tests become an **Action or Decision that orders them** (coded in LOINC), gated on the collected findings;
- an ADE whose sources name no test gets a **suspected-ADE alert** instead: a `suspected_<ade>` data item and an Action that asks the clinician to examine the patient further;
- a first Action **displays the list of ADEs** the plan monitors.

Every finding is a data item the engine can run on: a yes/no finding is `text` with the range `"yes||yes", "no||no"` (Composer and the Deontics engine have no `boolean`), each has a default value, and each source is non-mandatory (`cig/know-how/proforma/Data.md`).

Source: Mor Peleg's know-how, "New know-how", 30 October 2026, written for the GLP-1 gold standard. The runnable-data rules (yes/no text items, defaults, non-mandatory sources, no check-due items, the suspected-ADE alert) come from her run of the CCD guideline in the Deontics engine, 4 November 2026.

This pattern applies to the **Monitor Undesired ADEs** sub-plan (`Monitor_Undesired_State`). Monitors of action completion (`Monitor_Actions`) and of desired outcomes (`Monitor_Desired_State`) stay Actions, as in `ActionEnactmentGoal.md`.

## Structure

```
plan Monitor_Undesired_State
  action   Display_Potential_ADEs                 (first; caption = Markdown list of the ADEs)
  enquiry  Monitor_<ADE>                          (after Display_Potential_ADEs; one per ADE, in parallel)
     source <finding data items>                  (symptoms, bedside exam values; SNOMED CT coded, with a default, non-mandatory)
  action   Order_<Test>                           (after Monitor_<ADE>; when exactly one test is recommended)
  decision Tests_Ordering_Recommendations_<ADE>   (after Monitor_<ADE>; when two or more tests are recommended)
     candidate <Test>                             (one per test; LOINC coded; argument for,true())
  action   Alert_Further_Examination_<ADE>        (after Monitor_<ADE>; when the sources name no test; gated on suspected_<ade> = "yes")
```

Per ADE there is **exactly one** follow-up step: an `Order_<Test>` Action for a single test, a `Tests_Ordering_Recommendations_<ADE>` Decision for two or more, or, when the monitor's sources name no laboratory or imaging test, the suspected-ADE alert (section 4).

### 1. `Display_Potential_ADEs` (Action, first component of `Monitor_Undesired_State`)

- **caption:** a Markdown list, one numbered item per ADE Enquiry, in the order the Enquiries appear in the plan. Use Composer's formatting: a header line, then one item per line, each line ending with two spaces (a Markdown line break):

  ```
  # *Monitoring for ADEs:*  
  1. Bleeding  
  2. Renal function  
  3. Thrombotic thrombocytopenic purpura  
  ```

  The item text is a short clinical name of the ADE (the caption of its `ontology.coding` without the semantic tag is a good default). Keep each item on its own line. Composer supports `*emphasis*`, `**strong**`, `#`–`####` headers, bulleted (`* item`) and numbered (`1. item`) lists, and a line break of two trailing spaces.
- **description:** "Lists the adverse drug effects monitored in Monitor_Undesired_State; each is assessed by the Enquiry of the same name."
- **metaprops:** `role=ade_display`, `goal.verb=order`, `goal.noun_phrase=display of the potential adverse drug effects monitored for this therapy`. No `ServiceRequest.*` block and no source is required.
- Every ADE Enquiry runs **after** `Display_Potential_ADEs` (`add_task(after: ["Display_Potential_ADEs"])`). The Enquiries run in parallel with each other.

### 2. `Monitor_<ADE>` (Enquiry)

The former monitoring Action becomes an **Enquiry with the same canonical name** and **the same metaprops** (the full contract in `MetapropsSyntax.md`: the `ServiceRequest.*` block repeated in `goal.noun_phrase`, `category=undesired_ade`, `monitored_target`, `applies_when`, provenance, `source.N` + `quote.N`, ontology coding of the ADE on its component in `Monitor_Undesired_State`), the same `caption` and the same `precondition`.

- **No `procedure`.** An Enquiry has no procedure attribute. Its **`description`** carries the order instead: `Monitors <monitored_target>. <literature_basis>. Order: <code>, <occurrenceTiming>. Patient: <patientInstruction>. Clinician: <performerInstruction>.`
- **Sources (data items).** One data item for each patient-reported symptom and each bedside finding the monitor's metaprops name (in `ServiceRequest.patientInstruction`, `ServiceRequest.performerInstruction`, `trigger` or `instrument`) that can be collected **on the spot**: a symptom asked of the patient (e.g. red or black tarry stools, vomiting blood) or a physical exam done at the visit (e.g. systolic and diastolic blood pressure, pulse rate). Laboratory and imaging tests are **not** data items here; they are ordered by the test step.
  - **Type:** `text` with the range `"yes||yes", "no||no"` for a symptom or sign that is present or absent (never `boolean`); `real` (with `unit`) or `integer` for a measured exam value (e.g. `systolic_bp`, `real`, `mmHg`).
  - **Default value:** `"no"` for a yes/no finding; for a measured value, a normal value that does not trigger the test step (systolic 120 and diastolic 80 mmHg, heart rate 70/min).
  - **Source:** non-mandatory (`add_source(..., mandatory: false)`, `mandatory :: no`), so the Enquiry completes when a finding is not asked.
  - **Caption:** the question as asked (e.g. "Red or black tarry stools since the last visit?").
  - **Description:** what the finding is, which ADE monitor(s) ask for it, and its default ("Default "no" for running and testing; the clinician records the actual answer.").
  - **Ontology coding (required):** `ontology.coding=SCT:<id> [<term>]` in the data item's metaprops, found with `snomed_search` and recorded exactly as returned (`cig/know-how/proforma/Ontology.md`). Choose the finding or observable entity (e.g. "Melena (disorder)", "Systolic blood pressure (observable entity)").
  - **Source + quote (recommended):** the label or guideline passage that names the finding.
  - **Name:** a lower-case PROforma identifier describing the finding (e.g. `black_tarry_stools`, `vomiting_blood`, `systolic_bp`). A finding several ADEs ask about is **one** data item, sourced by each of those Enquiries (e.g. `fever`).
  - At least one data item per Enquiry. A monitor whose metaprops name no on-the-spot finding still asks for the trigger it names (e.g. `planned_neuraxial_procedure`).
  - **No scheduling items.** A data item records a finding, not when a check is due: no `renal_function_check_due`, `magnesium_check_due` or other `*_due` item (a gate FAIL). A scheduled test stays in the order (`ServiceRequest.occurrenceTiming` and the description).

### 3. Test step after the Enquiry

When the monitor's metaprops name laboratory tests or imaging (typically in `ServiceRequest.code`, `ServiceRequest.performerInstruction` or `instrument`), the Enquiry is followed by a test step that runs **only if at least one collected finding is positive**:

- **precondition:** a disjunction over the Enquiry's data items, true when at least one finding is present: `<item> = "yes"` for each yes/no symptom or sign, and the abnormal range for each measured value, e.g. `black_tarry_stools = "yes" or vomiting_blood = "yes" or systolic_bp < 90`. It reads **only** data items its Enquiry asks for (findings, bedside values), and never `= true`. Type-check it with `check_expression`.
- **after:** the Enquiry (`add_task(after: ["Monitor_<ADE>"])`).

**One test → Action `Order_<Test>`** (e.g. `Order_Serum_Magnesium`, `Order_Hematocrit`).

- `caption`: "Order <test>"; `description`: why the test is ordered and for which ADE; `procedure`: "Order <test> when <the finding condition in words>."
- `metaprops`: `role=test_order`, `ordered_for=Monitor_<ADE>`, `goal.verb=order`, `goal.noun_phrase=<test name>`, and optionally `source.N` + `quote.N`.
- Ontology coding on its **component** in `Monitor_Undesired_State` (not on the task definition): `ontology.coding=LNC:<code> [<LOINC long common name>]`, found with `loinc_search` and recorded exactly as returned.
- If the same single test is ordered for two ADEs, suffix the ADE to keep names unique: `Order_Serum_Creatinine_for_PPI_Interstitial_Nephritis`.

**Two or more tests → Decision `Tests_Ordering_Recommendations_<ADE>`** (e.g. `Tests_Ordering_Recommendations_Bleeding`). The know-how names the decision `Tests_Ordering_Recommendations`; the `_<ADE>` suffix is required because PROforma task names must be unique and several ADEs order tests.

- `choice_mode :: multiple` (the clinician may order several tests); support mode symbolic (the default).
- `caption`: "Which tests to order for suspected <ADE>?"; `description`: the clinical question and the ADE it serves.
- `metaprops`: `role=test_ordering`, `ordered_for=Monitor_<ADE>`.
- One **candidate per test**, named after the test (e.g. `Hemoglobin`, `Hematocrit`), with a `caption`, the **LOINC** ontology coding of the test in the candidate's metaprops (`ontology.coding=LNC:<code> [<long common name>]`), at least one argument and the default recommendation `netsupport() > 0`.
  - The argument is `for,true()` when nothing restricts the test, so every listed test is recommended and the clinician selects which to order. Use a real condition over data items when the source restricts the test (e.g. a test only in a sub-population).

### 4. Suspected-ADE alert (an ADE with no test)

When the monitor's sources name no laboratory or imaging test, the Enquiry gets a suspected-ADE item and an alert Action instead of a test step. A test the sources do not name (e.g. MRI for a spinal hematoma) stays out of scope.

- **Data item `suspected_<ade>`:** `<ade>` is the Enquiry name without `Monitor_`, in lower-case snake (`Monitor_Spinal_Epidural_Hematoma` -> `suspected_spinal_epidural_hematoma`). Yes/no `text`, default `"no"`, caption "Is <ADE> suspected?", SNOMED CT coded with the ADE's concept, asked by the Enquiry as a non-mandatory source.
- **Action `Alert_Further_Examination_<ADE>`** (`<ADE>` = the Enquiry name without `Monitor_`) in `Monitor_Undesired_State`, `after` the Enquiry, with `precondition :: suspected_<ade> = "yes"`.
  - `caption`: "Alert: further examination of <ADE>"; `description`: why the alert is raised and for which ADE; `procedure`: the order, as for any monitoring Action.
  - `metaprops`: `role=ade_alert` and the full monitor contract of `MetapropsSyntax.md`: `goal.verb=order`, `ServiceRequest.code=further clinical examination for suspected <ADE>`, `ServiceRequest.occurrenceTiming=when <ADE> is suspected`, `ServiceRequest.patientInstruction`, `ServiceRequest.performerInstruction=examine the patient for <ADE> and decide on further work-up` (the sources name no test, so none is ordered), repeated in `goal.noun_phrase`; `category=undesired_ade`, `monitored_target=Monitor_<ADE>`, `assistant_invention=yes` with provenance that names Mor Peleg's know-how, and the `source.N` + `quote.N` of the ADE.
  - Ontology coding on its **component** in `Monitor_Undesired_State`: the ADE's SNOMED CT concept.
- The proposal lists every `Alert_Further_Examination_<ADE>` in `cig-actions`.

## Tool calls (every call also takes `file`)

```
add_task(plan: "Monitor_Undesired_State", kind: "action", name: "Display_Potential_ADEs",
         caption: "# *Monitoring for ADEs:*  \n1. Bleeding  \n2. Renal function  ")
set_attribute(selector: "Display_Potential_ADEs", attribute: "metaprops",
              value: "role=ade_display\ngoal.verb=order\ngoal.noun_phrase=display of the potential adverse drug effects monitored for this therapy")

add_task(plan: "Monitor_Undesired_State", kind: "enquiry", name: "Monitor_Bleeding",
         caption: "...", after: ["Display_Potential_ADEs"])
set_attribute(selector: "Monitor_Bleeding", attribute: "description", value: "Monitors ... Order: ... Patient: ... Clinician: ...")
set_attribute(selector: "Monitor_Bleeding", attribute: "metaprops", value: "<the full monitor contract>")
set_attribute(selector: "Monitor_Undesired_State/component:Monitor_Bleeding", attribute: "metaprops",
              value: "ontology.coding=SCT:131148009 [Bleeding (finding)]")
add_data_item(name: "black_tarry_stools", type: "text", range: "\"yes||yes\", \"no||no\"", default_value: "\"no\"",
              caption: "Red or black tarry stools since the last visit?")
set_attribute(selector: "black_tarry_stools", attribute: "metaprops",
              value: "ontology.coding=SCT:<id> [<term>]\nsource=...\nquote=...")
add_source(task: "Monitor_Bleeding", data: "black_tarry_stools", mandatory: false)
add_data_item(name: "systolic_bp", type: "real", unit: "mmHg", default_value: "120", caption: "Systolic blood pressure")
add_source(task: "Monitor_Bleeding", data: "systolic_bp", mandatory: false)

add_task(plan: "Monitor_Undesired_State", kind: "decision", name: "Tests_Ordering_Recommendations_Bleeding",
         caption: "Which tests to order for suspected bleeding?", after: ["Monitor_Bleeding"],
         precondition: "black_tarry_stools = \"yes\" or vomiting_blood = \"yes\" or systolic_bp < 90")
set_attribute(selector: "Tests_Ordering_Recommendations_Bleeding", attribute: "choice_mode", value: "multiple")
add_candidate(decision: "Tests_Ordering_Recommendations_Bleeding", name: "Hemoglobin", caption: "Hemoglobin")
set_attribute(selector: "Tests_Ordering_Recommendations_Bleeding/candidate:Hemoglobin", attribute: "metaprops",
              value: "ontology.coding=LNC:<code> [<long common name>]")
add_argument(decision: "Tests_Ordering_Recommendations_Bleeding", candidate: "Hemoglobin",
             support: "for", condition: "true()", name: "Arg_Order_Hemoglobin")

add_data_item(name: "suspected_spinal_epidural_hematoma", type: "text", range: "\"yes||yes\", \"no||no\"",
              default_value: "\"no\"", caption: "Is spinal or epidural hematoma suspected?")
add_source(task: "Monitor_Spinal_Epidural_Hematoma", data: "suspected_spinal_epidural_hematoma", mandatory: false)
add_task(plan: "Monitor_Undesired_State", kind: "action", name: "Alert_Further_Examination_Spinal_Epidural_Hematoma",
         caption: "Alert: further examination of spinal or epidural hematoma", after: ["Monitor_Spinal_Epidural_Hematoma"],
         precondition: "suspected_spinal_epidural_hematoma = \"yes\"")
set_attribute(selector: "Alert_Further_Examination_Spinal_Epidural_Hematoma", attribute: "metaprops",
              value: "role=ade_alert\ngoal.verb=order\n<the full monitor contract>")
```

Every component also carries its task's caption and description (`set_attribute(selector: "Monitor_Undesired_State/component:<task>", attribute: "caption" | "description")`), since Composer shows the component's (`cig/know-how/proforma/TaskProperties.md`).

Multi-line captions: pass the newlines as real line breaks in the value. On Windows, call the proforma binary directly (as `scripts/lib/proforma.mjs` does), not through `npx`: the `npx.cmd` wrapper drops everything after the first newline of an argument.

## The proposal

The proposal's §6 task table lists, for each ADE: the Enquiry, its data items (name, type, unit, default, SNOMED CT concept), and its follow-up step (`Order_<Test>` with its LOINC code, `Tests_Ordering_Recommendations_<ADE>` with one candidate and LOINC code per test, or `suspected_<ade>` + `Alert_Further_Examination_<ADE>`) and the step's precondition. The machine-readable blocks:

- ```` ```cig-actions ```` lists every **Action** (therapy actions, Action monitors, `Display_Potential_ADEs`, every `Order_<Test>`, every `Alert_Further_Examination_<ADE>`) **and every monitoring Enquiry** (`Monitor_<ADE>`).
- ```` ```cig-test-decisions ```` lists every `Tests_Ordering_Recommendations_<ADE>` Decision.

## What the gate checks (`scripts/check_cig.mjs`)

- `Monitor_Undesired_State`, when it holds ADE monitors, starts with `Display_Potential_ADEs` (`role=ade_display`), whose caption lists exactly one item per ADE Enquiry; every ADE Enquiry runs after it.
- Every ADE monitor in `Monitor_Undesired_State` is an **Enquiry** carrying the full monitor contract, with a description that states the order (code and timing), and at least one data item source.
- Every data item an ADE Enquiry asks for carries a SNOMED CT ontology coding (`SCT:<id> [<caption>]`). No data item is `boolean` or named `*_due` / `*_check_due` (FAIL); a text item compared with `"yes"`/`"no"` has the yes/no range (FAIL); an Enquiry data item without a default is a WARN.
- The component of every `Order_<Test>` Action (`role=test_order`) and every candidate of a `Tests_Ordering_Recommendations_<ADE>` Decision (`role=test_ordering`) carries a **LOINC** ontology coding (`LNC:<digits>-<check digit> [<caption>]`); the step runs after its Enquiry (`ordered_for`) and has a precondition that reads that Enquiry's data items and no other data item; every candidate has at least one argument; the Decision's `choice_mode` is `multiple`.
- Every ADE Enquiry has a test step, or a `suspected_<ade>` item and an `Alert_Further_Examination_<ADE>` Action (`role=ade_alert`, the full monitor contract, after the Enquiry, gated on `suspected_<ade> = "yes"`); otherwise FAIL.
- Every component's caption and description equal its definition's (FAIL).
- The built Action + monitoring-Enquiry set equals `cig-actions`; the test Decisions equal `cig-test-decisions`.

## Structural example

In `cig/examples/ccd-antithrombotic-monitoring.pf`, `Monitor_Undesired_State` starts with `Display_Potential_ADEs` (a numbered Markdown list of the 17 ADEs), followed by 17 ADE Enquiries in parallel. They show each kind of test step:

- **No test (alert):** `Monitor_Antiplatelet_Hypersensitivity` collects four yes/no findings (hives, facial or throat swelling, wheezing, widespread rash) and `suspected_antiplatelet_hypersensitivity`; its sources name no test, so `Alert_Further_Examination_Antiplatelet_Hypersensitivity` follows, gated on `suspected_antiplatelet_hypersensitivity = "yes"`.
- **One test:** `Monitor_Ticagrelor_Bradyarrhythmia` collects `syncope`, `dizziness` and `pulse_rate` (`integer`, default 70), and `Order_ECG` (LOINC 12-lead EKG panel) runs after it with the precondition `syncope = "yes" or dizziness = "yes" or pulse_rate < 50`.
- **Two or more tests:** `Monitor_TTP` is followed by `Tests_Ordering_Recommendations_TTP`, a `multiple` Decision with four LOINC-coded candidates (platelet count, schistocytes on the blood smear, LDH, serum creatinine), each with the argument `for,true()`.

Shared findings are one data item: `fever` is asked by `Monitor_TTP`, `Monitor_PPI_CDAD` and `Monitor_PPI_Interstitial_Nephritis`. A measured exam value is a typed item with a unit (`systolic_bp`, `real`, mmHg, read by the bleeding test step's precondition). Every ADE Enquiry keeps the full monitor contract and its own drug-gating precondition (`MonitoringPlan.md`). Use it to see the shape; which ADEs and tests to model comes from the user's labels and the approved proposal.

## Related

- `MonitoringPlan.md` (where the sub-plan sits), `cig/know-how/proforma/Enquiry.md` (data items), `cig/know-how/proforma/Decision.md` (candidates and arguments), `MetapropsSyntax.md` (the monitor contract the Enquiry keeps), `cig/know-how/proforma/TaskProperties.md`.
