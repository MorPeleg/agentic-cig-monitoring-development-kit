# CIG Builder — Agent Guidance

These are your instructions when building and iterating on computer-interpretable guidelines (CIGs). You act as a collaborative partner: you do not generate an entire guideline in one shot, you always work top-down (the plan structure first, then the tasks inside it), and you keep the user in the loop at key decision points.

---

## Primary Use Case — CIG Monitoring

The primary purpose of this kit is to **formalize a clinical guideline as an executable PROforma CIG** (a PROforma 1.9 guideline file, `.pf`), focusing on **monitoring completion of therapy recommendations** (Action Enactment goals) and **monitoring desired/undesired effects of therapy** (State Achievement goals).

When the task is to turn a clinical guideline into a CIG, or to build a therapy + monitoring plan, **follow the `cig-monitoring` skill** (`skills/cig-monitoring/SKILL.md`). It encodes the domain know-how in `cig/know-how/README.md` and specializes the 7-step methodology below: Mor's Steps 1–3 (scope, locate guidelines, extract therapy/goals/monitoring) map onto Steps 1–3 here, and Mor's Steps 4–6 (PROforma formalization) map onto Steps 4 and 6 here.

The CIG is authored and validated with the **proforma** MCP server/CLI (npm `proforma-mcp`; the **`proforma-editor`** skill describes its tools). Shared CIG reference material lives under `cig/`: `cig/know-how/` (the domain know-how) and `cig/examples/` (one worked PROforma CIG, `ccd-antithrombotic-monitoring`, with its diagram, viewer, CQ queries and build record). That example is a **structural** reference only (plan layout, Enquiry/Decision population, the ADE Enquiry pattern, the metaprops contract); its clinical content (antiplatelet and oral anticoagulant therapy in chronic coronary disease) is not a template for which monitors to model. The design patterns to follow are in `skills/cig-monitoring/references/`. The clinical guidelines for a CIG come **only** from `projects/<project_dir>/resources/` (the user places the guideline PDFs or text for that project there) or from files the user names in chat. Per-CIG working output goes under `projects/<project_dir>/`.

---

## Guiding Principles

- **Iterative and incremental**: Propose changes, get the user's review, and apply only after approval.
- **Top-down construction**: Establish the plan structure (top-level plan and sub-plans) before the tasks, data items and metaprops inside it.
- **Executable, not just descriptive**: The output is a guideline an engine can run. Conditions (preconditions, decision arguments) are PROforma expressions over data items the guideline collects, never free-text sentences. Every condition is type-checked (`check_expression`) and the file must lint with zero errors.
- **Scope discipline (CQ-bounded modeling)**: The guideline should contain **only** the tasks, data items and decisions needed to cover the approved scope and answer the competency questions. Do not model something merely because it appears in a source. When in doubt, leave it out; it is easier to add a task later than to justify one no CQ or recommendation needs.
- **Reuse over reinvention**: Code what is monitored, delivered or recorded with SNOMED CT concepts (Composer's native Ontology coding, found with the `snomed_search` tool) and every ordered test with its LOINC code (`loinc_search`); follow the design patterns in `skills/cig-monitoring/references/`.
- **Native fields first, sources quoted**: Use Composer's native task properties for what they are for (Caption, Description, procedure, Precondition, Ontology coding and the others listed in `cig/know-how/proforma/TaskProperties.md`) and keep `metaprops` for the goal, the HL7 FHIR `ServiceRequest` order and provenance. Fill the Precondition and the Ontology coding wherever they apply. Every cited source is paired with the verbatim passage the element was modelled from. The task contract is `skills/cig-monitoring/references/MetapropsSyntax.md`.
- **Draft approval before formalization**: In Step 4, **write the proposal to `projects/<project_dir>/plans/PROPOSAL-<timestamp>.md` immediately** (with `status: draft`) and present it in the conversation at the same time. The user reviews and may edit the file directly. Do **not** proceed to Step 6 (formalization) until the user has **explicitly approved** the draft. On approval, update the file's status to `approved`.
- **Do not hand-edit guideline files**: Never edit a `.pf` file by hand. Use the **proforma-editor** tools for every change (each edit is re-parsed and refused if it would break the file), and the proforma validation tools (`lint`, `check_expression`, `export_json`) plus the kit's gate scripts for checks — not ad-hoc shell edits.
- **User-provided context**: Always check **`projects/<project_dir>/resources`** at the start of a task to see if the user has placed any files there for context (e.g. PDFs, guidelines, spreadsheets). For CIG work these files are the **only** source of the guideline documents, together with files the user names in chat: do not search other projects or the web for the primary guideline unless the user asks (completing vague recommendations from other sources, as described in `cig/know-how/README.md`, stays allowed). The package inserts of the drugs in scope are saved there too: when the user has not provided one, retrieve it with `node scripts/fetch_package_insert.mjs` (Step 2). Also read `cig/know-how/` and the design patterns in `skills/cig-monitoring/references/`; `cig/examples/` is a structural reference, not a clinical one.
- **Long-term memory**: Use the **semlocal** skill (with `--collection <project_dir>`) to store and retrieve knowledge, user decisions, and provenance across sessions. Always scope to the project's collection so each project's knowledge is isolated. Store summaries after extraction (Step 2), organization (Step 3), user feedback (Step 5), and formalization (Step 6).

---

## Development Workflow

Follow these steps when creating or extending a CIG. Align your suggestions with this workflow.

**Path convention**: Throughout this document, `<project_dir>` refers to the **project name only** (e.g. `ccd-antiplatelet-monitoring`), not a full path. All paths starting with `projects/` are **relative to the workspace root**. A project looks like this:

```
projects/<project_dir>/
  guideline/<name>.pf          # the CIG
  guideline/<name>.mmd         # its Mermaid diagram (regenerated after every emit)
  guideline/<name>.html        # self-contained interactive viewer (proforma skill, regenerated after every emit)
  guideline/baseline/          # snapshot of the previous .pf, taken before every re-emit or coding patch
  plans/PROPOSAL-<YYYYMMDD-HHmmss>.md
  cqs/cq-queries.mjs           # competency-question queries
  reviews/                     # Step 7 reports
  resources/                   # files the user provides
```

`projects/` is not tracked by git, so the `guideline/baseline/` snapshot is the only record of the previous emit. Take it before touching an existing guideline.

### Step 0 — Iteration Baseline (mandatory when a project already exists or a source is added)

**Before re-scoping, decide whether this is a new build or an iteration, and never silently start over.** A task is an **iteration** whenever a `projects/<project_dir>/` already exists, an approved `PROPOSAL-*.md` exists, a project guideline exists, or the user is adding/replacing a guideline for a topic that has been modeled before. For iterations:

1. **Do not fork the project.** Reuse the **existing** `<project_dir>` and its canonical task names. Do **not** invent a new project name (e.g. renaming `ccd-antiplatelet-monitoring` → `ccd-antithrombotic-adverse-effects`) — a rename discards the baseline and is the most common cause of regressions. Write the new draft to `projects/<project_dir>/plans/PROPOSAL-<timestamp>.md`, never to a scratch/Downloads location.
2. **Load the baseline.** Read the latest approved `projects/<project_dir>/plans/PROPOSAL-*.md`, the current project guideline (`export_json` / `outline`), and recall prior extractions with `semlocal search … --collection <project_dir>`. If the collection is empty, treat the newest approved proposal and the current project guideline as the baseline.
3. **Build a carry-forward checklist.** Enumerate every previously-modeled element: each therapy Action and its **State Achievement goal (including every `avoid` goal and the top-plan `treat` goal)**, every Enquiry data item, every Decision candidate/argument/recommendation, and every monitoring Action (with its canonical name). This checklist is an input to the Step 4 pruning checkpoint's regression check.

**A new source may only add or refine.** Adding a guideline must never drop a baseline element. Every checklist item must reappear in the new draft (retained or refined) **or** be listed in §10 Excluded Candidates with an explicit, source-grounded reason (and in the proposal's `cig-excluded` block). Re-anchoring scope on the newest guideline alone is a defect.

### Step 1 — Scope Definition

Help clarify the change the user wants. Analyze and structure it. Search semlocal for prior scope, CQs, or decisions from earlier sessions.

**Target output:**
- Population, condition and therapy class of the CIG, and which part of the design pattern is in scope (full top-level plan, or e.g. ADE monitoring only)
- **Competency questions (CQs)** — natural-language questions the guideline must answer when the change is complete (acceptance criteria; each becomes a query in Step 7)
- The project directory name and the guideline name

### Step 2 — Knowledge Exploration

Gather domain knowledge from the user's data sources (PDFs, Word, Excel/CSV, URLs). Always check `projects/<project_dir>/resources` for user-provided files. Use subagents to explore data sources — provide scope and CQs so each subagent can focus extraction.

**CIG monitoring (per the `cig-monitoring` skill):** read the guidelines in `projects/<project_dir>/resources/` as primary sources and extract therapy recommendations (completing vague ones from other guidelines or the web), clinical goals (defining clinical abstractions such as cardiometabolic risk from measurable components), monitoring recommendations aligned to goals (classifying each as an achieve-state or avoid-state), monitoring frequency (proposing one with justification when the guidelines omit it), measurement method (lab, questionnaire, device, or clinician interview), ADEs from package inserts, unmentioned harms/benefits derived from the mechanism of action only when the user explicitly includes them in scope, and rare effects from case reports only when the user explicitly includes them in scope.

**Package inserts (CIG monitoring).** Save the package insert (US FDA label) of every drug in scope with the project's guidelines. When the user has not provided it, retrieve it with `node scripts/fetch_package_insert.mjs projects/<project_dir>/resources <drug-key> --brand <Brand>` (or `--generic <name>`, or `--setid <DailyMed set id>`): it queries openFDA (DailyMed as the fallback) and writes `projects/<project_dir>/resources/<effective-year>-<drug-key>-package-insert.md` with a provenance header (brand, generic, manufacturer, SPL set id, effective date, DailyMed URL, retrieval source and date) and the label sections. Verify from what it prints (brand, manufacturer, effective date, title, the other matching labels) that it saved the **adult label of the right product**, not a repackager's, pediatric-only, OTC or other-dosage-form label; if not, rerun with `--setid`. Then read, cite and quote it like any other source.

**Per source, extract:** recommendations, conditions (eligibility criteria, sub-populations, triggers), data the conditions depend on, and monitoring instructions. Cite each finding and copy the verbatim excerpt that justifies it (with its page or section); these excerpts become the elements' `quote.N` in Step 6. Note confidence where the source is ambiguous.

**When the user story or task description is the only source:** Do not skip Steps 2–3. Treat it as a document source and produce an **extraction table** (element | source quote | kind: task/data item/decision criterion | CQ link | confidence) that maps each sentence or clause to what it implies.

The extraction table must include a **"CQ link"** column mapping each element to the CQ(s) or recommendation(s) that require it. Elements with no link are excluded from the draft unless the user overrides this.

### Step 3 — Knowledge Organization

Synthesize findings. Do not propose guideline changes yet — only organize.

- Deduplicate overlapping findings
- Decide which facts the guideline must **collect** as data items (everything a condition depends on: eligibility thresholds, sub-population flags such as a concomitant interacting medication, contraindications) and give each a type (`real`, `integer`, `boolean`, `text`, …) and unit
- Draft each condition as a PROforma expression over those data items (e.g. `threshold_measure >= 30 and on_interacting_medication = false and contraindication_present = false`)
- Map what is monitored, delivered or recorded to terminology. The kit codes **SNOMED CT** for clinical concepts (disorders, findings, observables, procedures, substances; the `snomed_search` tool) and **LOINC** for the laboratory and imaging tests an ADE monitor orders (the `loinc_search` tool, NLM Clinical Tables). The coding pass of the `cig-formalization` skill (Step 6) writes them into Composer's native Ontology coding (`ontology.coding=SCT:<id> [<caption>]` or `ontology.coding=LNC:<LOINC_NUM> [<caption>]`, code and caption exactly as returned; a task's coding on its component in the parent plan, a data item's or candidate's in its own metaprops; `cig/know-how/proforma/Ontology.md`), one concept per element. Therapy actions that prescribe a specific drug also carry the drug ingredient's **RxNorm** code (`rxnorm.coding=RXNORM:<rxcui>` + `rxnorm.label` on the task definition, the `rxnorm_search` tool, NLM RxNav; Composer has no RxNorm provider and shows them as ordinary metaproperties).
- For each ADE, separate the findings collected on the spot (patient-reported symptoms, bedside exam values: the data items of its ADE Enquiry) from the tests ordered when a finding is positive (its test step), per `skills/cig-monitoring/references/ADEMonitoringEnquiry.md`
- Flag gaps where a recommendation has no measurable condition or no monitoring instruction

**Output — knowledge summary with:** (1) the task list (plans, enquiries, decisions, actions), (2) the data items with types, (3) the conditions as expressions, (4) open questions for the user.

### Step 4 — Draft Change Proposal (Plan Mode)

Produce an informal, structured proposal and **simultaneously** write it to `projects/<project_dir>/plans/PROPOSAL-<YYYYMMDD-HHmmss>.md` and present it in the conversation. Use a Mermaid diagram for the plan structure. Do **not** write PROforma into the guideline in this step.

**Where the plan file is:** always `projects/<project_dir>/plans/PROPOSAL-<YYYYMMDD-HHmmss>.md`, one file per draft; the newest approved one is the baseline of the next iteration. `projects/` is gitignored, so proposals are per-user working files, not part of the kit. `cig/examples/ccd-antithrombotic-monitoring-build/` holds a real example: the extraction, the first approved proposal with its revisions, the iteration proposal that followed it, and the review record from the build of the kit's example CIG.

**CIG monitoring:** draft the PROforma plan structure — a Top-Level Plan with an Enquiry, a Decision, a Therapy Plan, and a Monitoring Plan in sequence; the Monitoring Plan with parallel Monitor Actions / Monitor Desired State / Monitor Undesired ADEs sub-plans. List the therapy interventions (each an Action with a State Achievement goal) and the monitoring items (each a monitoring task with an Action Enactment goal: an Action in Monitor Actions and Monitor Desired State; in Monitor Undesired ADEs an ADE Enquiry with its data items and test step, after a `Display_Potential_ADEs` Action, per `references/ADEMonitoringEnquiry.md`), with proposed frequencies and justifications. See the `cig-monitoring` skill's `references/` for the design patterns.

**Make the proposal an executable spec (mandatory for CIG monitoring).** Step 6 is a near-mechanical transcription, so the proposal must fix everything Step 6 needs to be deterministic: assign **one canonical PROforma name per task** — exactly one stable name per ADE, keyed to its label section / Boxed Warning (e.g. one name for §5.5 Acute Kidney Injury; never two such as `Monitor_AKI` and `Monitor_Acute_Kidney_Injury`) — and list the **exact, final action set**, each with its goal verb, its conditionality (and the executable `precondition` it needs, with the data item it reads), and its `monitoring_stance`. The §6 task table is the authoritative name list Step 6 emits verbatim; do not invent or rename tasks at formalization time.

**Machine-readable action set (mandatory).** The proposal MUST contain a fenced block listing every Action name (therapy, monitoring, `Display_Potential_ADEs`, every `Order_<Test>`) **and every monitoring Enquiry** (`Monitor_<ADE>`), one per line, and a block listing every test-ordering Decision. The Step 7 gate compares the built guideline to them:

````
```cig-actions
Prescribe_Drug
Display_Potential_ADEs
Monitor_<Harm>
Order_<Test>
```

```cig-test-decisions
Tests_Ordering_Recommendations_<Other_Harm>
```
````

On iterations, name every baseline element that is intentionally removed (task, data item, or `Decision/Candidate`) in a ```` ```cig-excluded ```` block, each also explained in §10.

**Scope the design pattern to the request (CIG monitoring).** The full four-component top-level plan is the shape of a *complete* CIG. Confirm the requested scope/hierarchy with the user before formalizing and build **only** the requested sub-structure, fully populated. An "ADE monitoring only" request must produce just the Monitor-Undesired-ADEs structure — **never** the full plan with empty Enquiry/Decision/Therapy/Monitor-Actions/Monitor-Desired placeholders. Never emit empty placeholder components (an Action without a goal or metaprops, an Enquiry with no data items, a Decision with no candidates/criteria, or a sub-plan with no actions).

**Draft pruning checkpoint (mandatory — run before presenting the draft):**

1. **CQ / recommendation justification** — For each proposed task and data item, name the CQ or source recommendation that requires it. If none → remove.
2. **Data items over free text** — Every condition must read data items the guideline collects. A condition that can only be written as a sentence means a data item is missing: add it (with a source) or drop the condition.
3. **One task per recommendation** — Do not split one monitoring recommendation into several actions, or merge two label sections into one action, unless the source does.
4. **No empty structure** — Remove sub-plans, enquiries and decisions that would have nothing in them.
5. **Regression check (iterations only — mandatory)** — Walk the Step 0 carry-forward checklist against the new draft. Every baseline element (each therapy Action and its goal, **every `avoid` goal and the top-plan `treat` goal**, each Enquiry data item, each Decision candidate/argument/recommendation, each monitoring Action + canonical name) must be **retained/refined in the draft** or **listed in §10 (and `cig-excluded`) with a source-grounded reason**. A baseline element that is neither retained nor explicitly excluded is a **silent drop and a defect** — restore it. Pruning removes unjustified *new* candidates; it may never quietly delete previously-approved content.

List all removed candidates in section 10 (Excluded Candidates) with the check number that eliminated them (e.g. "Removed by check 1: no CQ or recommendation needs it"; "Removed by check 5: baseline element dropped and restored").

**Precision review (recommended):** After pruning, delegate a final review to a fast subagent. Provide it with the CQs and pruned element lists; ask it to flag any element not tied to a specific CQ or recommendation.

**Plan file must include these sections:** (1) Scope, (2) Competency Questions, (3) PROforma Structure (top-level plan and sub-plans in scope), (4) Plan Diagram (Mermaid), (5) Data Items table (name, type, unit, source, used by), (6) Tasks table (canonical name, kind, parent plan, after, goal verb + noun phrase, precondition, monitoring_stance; for each ADE its Enquiry, data items and test step) plus the `cig-actions` and `cig-test-decisions` blocks, (7) Terminology Reuse (SNOMED CT concept per monitoring task, therapy action and data item; LOINC code per ordered test), (8) Open Questions, (9) Sources (each with the verbatim passage it supports), (10) Excluded Candidates.

**Candidate tracking:** Every candidate identified in Steps 1–3 must be accounted for: it either appears in the draft **with a justification**, or is listed in section 10 with a reason for exclusion.

Close the draft with a **"What I need from you"** list. State clearly that you will not proceed to Step 6 until the user approves.

### Step 5 — User Feedback Loop

**Wait for the user to review and approve the draft.** Do not proceed to Step 6 until the user has explicitly confirmed. Support revisions (rejections, renames, restructuring), blanket approvals (resolve open questions and present all resolutions as a numbered list), and direct file edits. Store significant user decisions via semlocal. When revising, always update the plan file in place. On approval, update the plan file's `status` to `approved`, then proceed.

### Step 6 — Formalization

Build the approved draft as a PROforma guideline with the **proforma-editor** tools. **NEVER write or edit a `.pf` file by hand** — if a tool call fails, diagnose the error and retry. Do not fall back to manual file creation under any circumstances; report the error to the user instead.

**CIG monitoring — delegate to the `cig-formalizer` subagent.** Formalization of a CIG monitoring build is a **deterministic, regenerate-from-empty transcription** of the approved proposal, not a creative step. Hand it to the **`cig-formalizer`** subagent (configured in `capabilities.yaml`, runs the `cig-formalization` skill) with the project directory, the approved proposal path, and the guideline output path (`projects/<project_dir>/guideline/<name>.pf`). The deterministic rules below are what that subagent enforces; they apply whether the subagent or the main agent does the emit.

**Deterministic emit rules (CIG monitoring — MUST / MUST NOT):**

1. **Fresh file only.** Snapshot any existing guideline to `guideline/baseline/<name>-<YYYYMMDD-HHmmss>.pf`, delete it, and start from `create_guideline`. **NEVER append to, merge into, or extend** a guideline produced by a different plan or a prior run — even one that looks "well implemented." (Every observed merge failure came from editing a pre-existing artifact.) Coding-only requests are the exception: they patch the existing file (see the `cig-formalization` skill).
2. **Proposal is the single source of truth.** The built set of Actions and monitoring Enquiries MUST **equal the approved proposal's `cig-actions` block exactly**, and the test-ordering Decisions its `cig-test-decisions` block — no extra tasks, none missing.
3. **Canonical names, no renames.** Emit the names fixed in the proposal's §6 verbatim — **one task per ADE/label section**. Never invent a second name for an ADE already named.
4. **Idempotent.** Running the emit twice MUST give the same guideline: no duplicate tasks, exactly one `metaprops` per task (set in one call), and **a single root plan**.
5. **One fixed bundle per action.** For each approved monitoring action create exactly: one Action in its sub-plan (with its component and scheduling), one `caption`, one `description` (what is monitored and why it was modelled), one `procedure`, one metaprops (with `goal.verb=order`, `goal.noun_phrase`, the `ServiceRequest.*` block, provenance and `source.N` + `quote.N`), plus a `precondition` when the proposal marks it conditional, and its Ontology coding from the coding pass (on its component). In Monitor Undesired ADEs the monitor is an Enquiry with the same bundle except the `procedure` (its `description` carries the order), plus its SNOMED CT coded finding data items and its LOINC coded test step, after `Display_Potential_ADEs` (`skills/cig-monitoring/references/ADEMonitoringEnquiry.md`). A therapy action gets its State Achievement goal, `caption`, `description`, `procedure` (dose, titration), `source.N` + `quote.N` and its Ontology coding, plus a `precondition` when the source scopes it. The native task properties (Caption, Description, Ontology coding, Precondition, Wait condition, Postcondition, Event trigger, procedure, cycles, ...) are listed in `cig/know-how/proforma/TaskProperties.md`.
6. **The order: the HL7 FHIR ServiceRequest, stated three ways that agree (the recurring failure).** The metaprops MUST carry `ServiceRequest.intent=order`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming` and `ServiceRequest.patientInstruction`, plus **`ServiceRequest.performerInstruction` whenever there is a triggered lab or an urgent/escalation step** — e.g. `ServiceRequest.performerInstruction=if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes including potassium and phosphate, urinalysis for blood/myoglobin pattern, and assess hydration/AKI risk`. `goal.noun_phrase` is the same order as one string, `ServiceRequest.intent = order; ServiceRequest.code = …; ServiceRequest.occurrenceTiming = …; ServiceRequest.patientInstruction = …[; ServiceRequest.performerInstruction = …]`, with values identical to the keys (no `;` inside a `ServiceRequest` value). The native `procedure` is `<code>, <occurrenceTiming>. Patient: <patientInstruction>. Clinician: <performerInstruction>.` **Never stop at intent + code.** The intermediate `order.*` keys are not part of the contract (the gate fails any that remain; convert an older guideline with `node scripts/migrate_metaprops.mjs <guideline.pf>`, which also fills an empty `procedure` and `description`).
7. **Quote every source.** Each `source.N` on a monitoring or therapy action is paired with `quote.N`: the verbatim passage (at most about 25 words, in double quotes, prefixed with page/section) copied from the source document. Never paraphrase inside the quotation marks.
8. **Executable conditions.** Every `precondition` and decision argument is a PROforma expression over data items the guideline collects; check each with `check_expression` before setting it. A population-scoped monitoring action (`applies_when` other than `all_patients_on_therapy`) reads a data item the Enquiry asks for (e.g. `on_interacting_medication = true`).

**CIG monitoring:** follow the design patterns in `skills/cig-monitoring/references/` (`cig/examples/ccd-antithrombotic-monitoring.pf` shows them in a complete guideline, as a structural reference only; do not copy its clinical content or task names). Create the plan skeleton with `add_task` (sequence with `after`, parallelism by sharing a parent plan), the Enquiry's data items with `add_data_item` + `add_source`, the Decision's candidates and criteria with `add_candidate` + `add_argument`, and each action with `add_task` + `set_attribute` (`caption`, `description`, `procedure`, `precondition`, `metaprops`). Record the goal on every Action as `goal.verb` (`achieve`/`avoid` for State Achievement goals, `order` for Action Enactment goals) and `goal.noun_phrase` (for monitoring orders, the HL7 FHIR `ServiceRequest` string). Fill each task's native properties from `cig/know-how/proforma/TaskProperties.md` where they apply, above all the **Precondition** and the **Ontology coding**. **Set the metaprops of every monitoring Action** following the canonical contract in `skills/cig-monitoring/references/MetapropsSyntax.md`: Java-properties lines holding the `ServiceRequest.*` block and documenting provenance and operationalization (`category`, `monitored_target`, `applies_when`, `provenance_type`, `source_kind`, `source.1..n` + `quote.1..n`, `knowledge_origin`, `guideline_status`, `monitoring_stance`, `literature_basis`, `assistant_invention`, `instrument`, `monitoring_frequency_basis`, `trigger`, `cq`) — with **no placeholder values** — so guideline-sourced facts are separable from self-designed ones and each action traces to the task it monitors (`monitored_target` names that task). Populate the Enquiry's data items and the Decision's candidates+criteria (`cig/know-how/proforma/Enquiry.md`, `cig/know-how/proforma/Decision.md`), with `source` + `quote` on data items and arguments that come from a specific passage; never emit empty placeholders. Finish with the **coding pass**: look up each monitoring task's monitored condition or measurement, each therapy action's procedure or substance and each data item's observable or finding with `snomed_search`, and set `ontology.coding=SCT:<id> [<label>]` exactly as returned (candidates and arguments only when a real concept fits); look up each ordered test (an `Order_<Test>` Action, each candidate of a test-ordering Decision) with `loinc_search` and set `ontology.coding=LNC:<LOINC_NUM> [<LONG_COMMON_NAME>]` exactly as returned. A task's coding is written on its **component** in the parent plan (`set_attribute(selector: "<plan>/component:<task>", attribute: "metaprops")`), never on the task definition; a data item or candidate carries it in its own metaprops; there is no `ontology.label` (`cig/know-how/proforma/Ontology.md`).

**Procedure:**

1. **Activate tools**: Read the **proforma-editor** skill (`skills/proforma-editor/SKILL.md`), then call `setup_tools(skills: ["proforma-editor"])`.
2. **Create the guideline**: `create_guideline` at `projects/<project_dir>/guideline/<name>.pf`, then `set_metadata` (title, version, author, and a qualitative `desc` with no hand-written counts).
3. **Build top-down**: plans first, then the Enquiry data items, the Decision, therapy actions, monitoring tasks (in Monitor Undesired ADEs: `Display_Potential_ADEs`, then each ADE Enquiry with its data items and test step), then the coding pass (`snomed_search`, `loinc_search`).
4. **Finish**: `format`, `lint` (zero errors), `to_mermaid` → `projects/<project_dir>/guideline/<name>.mmd`, the Deontics Composer project with `node scripts/export_composer_project.mjs projects/<project_dir>/guideline/<name>.pf projects/<project_dir>/composer-project --name <name> --force` (Composer reads ontology terms only from a project's `.deo`; `cig/know-how/proforma/Ontology.md`), and then the **proforma** skill's `scripts/build_report.mjs projects/<project_dir>/guideline/<name>.pf --attach-dir projects/<project_dir>/composer-project --attach-name <name>-composer-project.zip` → `guideline/<name>.html`, a self-contained viewer (task tree, plan canvas with pan/zoom/drill-down, properties, data and decision views) with a **Download Composer project** button, for the user and reviewers.
5. **Verify**: `outline` and `export_json` to spot-check the result against the proposal.

**End-of-Step-6 determinism checklist (CIG monitoring — self-apply before handing off to Step 7).** Run `node scripts/check_cig.mjs projects/<project_dir>/guideline/<name>.pf --proposal <approved proposal>` and confirm:

- The Action + monitoring-Enquiry set **==** the proposal's `cig-actions` block, and the test-ordering Decisions **==** its `cig-test-decisions` block (no residue, none missing).
- In Monitor Undesired ADEs: `Display_Potential_ADEs` first, listing one item per ADE Enquiry; every ADE monitor an Enquiry after it, with SNOMED CT coded findings; every test step after its Enquiry, gated on its findings, LOINC coded.
- Every Action has a goal (`goal.verb` + `goal.noun_phrase`) and exactly one metaprops; there is a **single root plan** and no unreachable task.
- Every monitoring Action has a `caption`, `description` and `procedure`, and the metaprops carry `ServiceRequest.intent=order`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction` (plus `ServiceRequest.performerInstruction` for any triggered/urgent step); `goal.noun_phrase` repeats the same `ServiceRequest.*` values; `procedure` states the code and the occurrenceTiming; no `order.*` key remains.
- Every monitoring task and therapy Action pairs its `source.N` with a verbatim `quote.N`; every `ontology.coding` is Composer's `SCT:<id> [<caption>]` (an ordered test: `LNC:<code> [<caption>]`), a task's on its component in the parent plan.
- Every population-scoped action carries an executable precondition over an Enquiry data item.
- `lint` reports zero errors; the metadata has a title and a qualitative `desc` (no hand-written counts, no stale drug/indication lists).

### Step 7 — Automated Review

Run automated checks using the actual tools — **never fabricate or assume results**. Every check below must produce real tool output that you report to the user.

**Step 7 is a BLOCKING gate (CIG monitoring), not advisory.** The gate **PASSes if and only if there are zero FAILs across the full check set**. A re-review after a fix MUST **re-run the entire check set** — it may never re-verify only a subset, inherit a prior PASS, or drop a previously reported FAIL from the verdict. There is **no "keep it because it is well implemented"** and **no "human confirmation needed"** path to PASS: the artifact conforms to the approved plan or it FAILs. Delegate the CIG gate to the dedicated subagents (`cig-monitoring-reviewer` for the value-quality + structural gate, `cig-cq-verifier` for CQ verification) so the review is independent of the build.

**Procedure:**

1. **Lint**: `lint` on the guideline — zero errors (warnings are reported).
2. **Deterministic gate** (`cig-monitoring-reviewer`, runs the **`cig-monitoring-review`** skill): `node scripts/check_cig.mjs projects/<project_dir>/guideline/<name>.pf --proposal <approved proposal> [--baseline <newest guideline/baseline snapshot>] [--coding-patch] --report projects/<project_dir>/reviews/cig-monitoring-review-<YYYYMMDD-HHmmss>.md`. It checks structure and scope (unreachable tasks, empty plans, unpopulated Enquiry/Decision, Actions without goals, migration leftovers), the native fields and metaprops contract (caption, description, procedure; required keys, placeholders, the `ServiceRequest.*` order agreeing between the keys, `goal.noun_phrase` and `procedure`, leftover intermediate `order.*` keys, citations and their quotes, ontology coding format, vocabularies, traceability, executable preconditions for sub-populations, stance↔schedule), therapy actions (goal, caption, description, source + quote), the ADE Enquiry pattern (ADE monitors as Enquiries, the `Display_Potential_ADEs` list, SNOMED CT coded findings, LOINC coded test steps gated on the findings), the approved `cig-actions` and `cig-test-decisions` sets, baseline regressions and the coding-only freeze (only `ontology.coding` / `ontology.label` may change). Exit code 1 = FAIL; a missing coding or a citation without its own quote is a WARN.
3. **Judgment phases** (same reviewer, same report): case-report harm and scope, source fidelity (applicability, negative recommendations, the label's own monitoring instructions, and that each `quote.N` is verbatim in the cited source), label coverage, whether each `monitored_target` names both what is monitored and the goal it traces to, and whether each ADE Enquiry's data items are the findings its metaprops name and its test step orders the right tests with the right LOINC codes. A missing `ServiceRequest` field (on either the keys or `goal.noun_phrase`), procedure or quote is a **FAIL**.
4. **Competency question verification (mandatory — every CQ must be verified)** (`cig-cq-verifier`, runs the **cq-verification** skill): write a query for every CQ in `projects/<project_dir>/cqs/cq-queries.mjs` and run `node scripts/run_cqs.mjs projects/<project_dir>/guideline/<name>.pf projects/<project_dir>/cqs/cq-queries.mjs --proposal <approved proposal> --report projects/<project_dir>/reviews/cq-verification-<YYYYMMDD-HHmmss>.md`. Every CQ must appear in the results; if a CQ fails because the guideline lacks the content, return to Step 6.

When a check fails, **report the specific error** and return to Step 6 (hand the fix list to `cig-formalizer`), then re-run the **full** gate. Do not mark the build done until the gate PASSes with zero FAILs.

---

## Modeling quality

Apply these when drafting (Step 4) and formalizing (Step 6). Do not add complexity for its own sake.

- **Data items carry the logic.** Anything a decision or precondition depends on is a typed data item collected by an Enquiry (or derived with `derivation`). Prefer `boolean` for yes/no facts and `real` for measured values with a `unit`; use `range` for fixed value sets.
- **Conditions are minimal and readable.** One expression per criterion, using the data item names; decision arguments use `for`/`against` (or `confirming`/`excluding` when the source makes a criterion decisive). Keep the recommendation rule at the default `netsupport() > 0` unless the source specifies otherwise; put the rationale in the candidate's `description`.
- **Structure follows the guideline.** Sequence only what the source orders (`after`); everything else runs in parallel inside its plan. Do not add intermediate plans that hold a single task unless the design pattern requires that level.
- **Names are stable identifiers.** One canonical name per task, data item and candidate; never two names for one concept, never one name reused for two.
- **Metadata describes, not counts.** Captions are one line; descriptions explain; the guideline `desc` is qualitative. Counts come from the guideline itself (`export_json`), never from prose.
- **Diagram after every emit.** Regenerate `guideline/<name>.mmd` with `to_mermaid` and `guideline/<name>.html` with the proforma skill's `scripts/build_report.mjs`, so reviewers see the current structure.
