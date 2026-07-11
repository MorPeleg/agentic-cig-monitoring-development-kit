# Ontology Builder — Agent Guidance

These are your instructions when building and iterating on ontologies. You act as a collaborative partner: you do not generate an entire ontology in one shot, you always work top-down (upper-level concepts first), and you keep the user in the loop at key decision points.

---

## Primary Use Case — CIG Monitoring

The primary purpose of this kit is to **instantiate the PROforma computer-interpretable guideline (CIG) ontology** (`cig/proforma.owl`) for a clinical guideline, focusing on **monitoring completion of therapy recommendations** (Action Enactment goals) and **monitoring desired/undesired effects of therapy** (State Achievement goals).

When the task is to turn a clinical guideline into a CIG, or to build a therapy + monitoring plan, **follow the `cig-monitoring` skill** (`skills/cig-monitoring/SKILL.md`). It encodes the domain know-how in `cig/know-how/README.md` and specializes the generic 7-step methodology below: Mor's Steps 1–3 (scope, locate guidelines, extract therapy/goals/monitoring) map onto Steps 1–3 here, and Mor's Steps 4–6 (PROforma formalization) map onto Steps 4 and 6 here. The 7-step methodology below remains the underlying engine for all ontology work.

Shared CIG reference material lives under `cig/`: `cig/proforma.owl` (the meta-ontology to instantiate — do not edit), `cig/examples/` (worked instantiations to imitate), `cig/guidelines/` (shared clinical guideline PDF library), and `cig/know-how/`. Per-CIG working output goes under `projects/<project_dir>/`.

---

## Guiding Principles

- **Iterative and incremental**: Propose changes, get the user's review, and apply only after approval.
- **Top-down construction**: Establish upper-level concepts and relations before mid- and lower-level detail.
- **Reuse over reinvention**: Search existing ontologies and registries (OBO Foundry, BioPortal, OntoBee, LOV) before defining new terms.
- **Scope discipline (CQ-bounded modeling)**: The ontology should contain **only** the classes, properties, and axioms needed to answer the competency questions. Do not model concepts merely because they appear in the user story or data source — only model what a CQ explicitly requires. Narrative examples (specific people, places, events mentioned in a user story) are ABox individuals, not TBox structure. When in doubt, leave a concept out; it is easier to add a class later than to justify one that no CQ needs. This principle takes precedence over taxonomic tidiness, ODP elegance, or extensibility concerns.
- **Foundational ontology (PROforma)**: Every project is built on top of the **PROforma CIG ontology** (`cig/proforma.owl`). **Reuse its existing classes, object properties, and data properties by IRI** — do not redeclare them, and **do not define new object or data properties** unless the user explicitly instructs otherwise. Add the PROforma prefix (`http://www.owl-ontologies.com/Ontology1779030093.owl#`) to the project ontology.
- **Draft approval before formalization**: In Step 4, **write the proposal to `projects/<project_dir>/plans/PROPOSAL-<timestamp>.md` immediately** (with `status: draft`) and present it in the conversation at the same time. The user reviews and may edit the file directly. Do **not** proceed to Step 6 (formalization) until the user has **explicitly approved** the draft. On approval, update the file's status to `approved`.
- **Do not modify OWL files**: Never directly edit OWL files by hand. Use the **ontology-editor** tools (OWL-MCP) for all axiom, prefix, and metadata changes, and the OWL-MCP review tools (`test_pitfalls`, `test_quality`, `sparql_query`) for quality checks and competency-question verification—not raw shell commands.
- **User-provided context**: Always check **`projects/<project_dir>/resources`** at the start of a task to see if the user has placed any files there for context (e.g. PDFs, guidelines, spreadsheets). For CIG work, also check the shared **`cig/`** reference area — `cig/guidelines/` (clinical guideline PDFs), `cig/proforma.owl`, `cig/examples/`, and `cig/know-how/`. Treat these as primary sources for scope and knowledge exploration alongside any files the user attaches in the conversation.
- **Long-term memory**: Use the **semlocal** skill (with `--collection <project_dir>`) to store and retrieve knowledge, user decisions, and provenance across sessions. Always scope to the project's collection so each project's knowledge is isolated. Store summaries after extraction (Step 2), organization (Step 3), user feedback (Step 5), and formalization (Step 6).

---

## Development Workflow

Follow these steps when extending or creating an ontology. Align your suggestions with this workflow.

**Path convention**: Throughout this document, `<project_dir>` refers to the **project name only** (e.g. `conference-management`), not a full path. All paths starting with `projects/` are **relative to the workspace root**. For example, `projects/<project_dir>/queries/` means `projects/conference-management/queries/` at the workspace root — never nested inside the project directory itself.

### Step 0 — Iteration Baseline (mandatory when a project already exists or a source is added)

**Before re-scoping, decide whether this is a new build or an iteration, and never silently start over.** A task is an **iteration** whenever a `projects/<project_dir>/` already exists, an approved `PROPOSAL-*.md` exists, a project ontology exists, or the user is adding/replacing a guideline for a topic that has been modeled before. For iterations:

1. **Do not fork the project.** Reuse the **existing** `<project_dir>` and its namespace/prefix. Do **not** invent a new project name (e.g. renaming `glp1-ade-monitoring` → `glp1-adverse-effects`) — a rename discards the baseline and is the most common cause of regressions. Write the new draft to `projects/<project_dir>/plans/PROPOSAL-<timestamp>.md`, never to a scratch/Downloads location.
2. **Load the baseline.** Read the latest approved `projects/<project_dir>/plans/PROPOSAL-*.md`, the current project ontology, and recall prior extractions with `semlocal search … --collection <project_dir>`. If the collection is empty, treat the newest approved proposal (and the authoritative example) as the baseline.
3. **Build a carry-forward checklist.** Enumerate every previously-modeled element: each therapy `Action` and its **State Achievement Goal (including every `avoid` goal and the top-plan `treat` goal)**, every Enquiry `Data`/`Source` item, every Decision `Candidate`/`Argument`/criterion/recommendation, and every monitoring `Action` (with its canonical IRI). This checklist is an input to the Step 4 pruning checkpoint's regression check.

**A new source may only add or refine.** Adding a guideline must never drop a baseline element. Every checklist item must reappear in the new draft (retained or refined) **or** be listed in §10 Excluded Candidates with an explicit, source-grounded reason. Re-anchoring scope on the newest guideline alone is a defect.

### Step 1 — Scope Definition

Help clarify the change the user wants. Analyze and structure it. Search semlocal for prior scope, CQs, or decisions from earlier sessions.

**Target output:**
- Domain and subject matter of the change
- **Competency questions (CQs)** — natural language questions the ontology must answer when the change is complete (acceptance criteria)
- **Foundational ontology**: All work reuses the PROforma CIG ontology (`cig/proforma.owl`) by IRI — there is no separate upper-ontology choice to make.
- Target namespace and prefix (for new ontologies)

### Step 2 — Knowledge Exploration

Gather domain knowledge from the user's data sources (PDFs, Word, Excel/CSV, URLs, SPARQL endpoints, or database schemas). Always check `projects/<project_dir>/resources` for user-provided files. Use subagents to explore data sources — provide scope and CQs so each subagent can focus extraction.

**CIG monitoring (per the `cig-monitoring` skill):** read the guideline PDFs in `cig/guidelines/` as primary sources and extract therapy recommendations (completing vague ones from other guidelines or the web), clinical goals (defining clinical abstractions such as cardiometabolic risk from measurable components), monitoring recommendations aligned to goals (classifying each as an achieve-state or avoid-state), monitoring frequency (proposing one with justification when the guidelines omit it), measurement method (lab, questionnaire, device, or clinician interview), ADEs from package inserts, rare effects from case reports, and unmentioned harms/benefits derived from the mechanism of action.

**Per source, extract:** concepts, relations, and constraints. Quote or cite excerpts that justify each finding. Note confidence where the source is ambiguous.

**When the user story or task description is the only source:** Do not skip Steps 2–3. Treat the user story as a document source and produce an **extraction table** (concept | source quote | type | CQ link | confidence) that systematically maps each sentence or clause to the concepts, relations, and constraints it implies.

**Classify each extracted concept into one of three categories:**
- **Structural** — a recurring type or pattern that a CQ explicitly asks about (e.g. "a certain X" in a CQ implies X is a candidate class) → candidate TBox class
- **Narrative instance** — a specific named entity used as a story example (e.g. a person's name, a specific city mentioned once) → ABox individual, not a class
- **Background context** — mentioned in the source but no CQ asks about it → exclude from TBox unless the user explicitly requests it

The extraction table must include a **"CQ link"** column mapping each concept to the CQ(s) that require it. Concepts with no CQ link default to the "background context" category and are excluded from the draft unless the user overrides this.

### Step 3 — Knowledge Organization

Synthesize findings and map them to existing terminology. Do not propose ontology changes yet — only organize.

- Deduplicate overlapping findings
- Search ontology registries (OBO Foundry, BioPortal, OntoBee, LOV) for existing terms that match discovered concepts. Search **at least one** registry even if you expect no matches. For domains with well-known ontologies (e.g. FOAF, Schema.org, FoodOn), explicitly check those.
- Flag gaps where no suitable existing term was found
- Identify candidate axiom patterns (subclass relations, domain/range, cardinality, and where applicable defined classes, inverses, value partitions — see **Modeling quality and enrichment**)
- **Check Ontology Design Patterns (ODPs):** Use the **odp-pattern-selector** skill to scan the ODP catalogue for established design patterns that match the discovered concepts and relations.

**ODP complexity gating:** Only apply an ODP when the CQs require the pattern's specific structural complexity:
  - **Simple binary relationships** (e.g. "What X belongs to Y?") → a direct object property suffices. Do not introduce Participation or ParticipantRole patterns.
  - **Temporal qualification** (e.g. "at a certain point in time") → may warrant reification, but only if the CQ asks about the time of the relationship itself, not just the endpoints.
  - **N-ary relations** → only when a CQ requires recording 3+ attributes of a single relationship instance.
  
  Do not apply ODPs for structural elegance or extensibility when a simpler model answers all CQs. Each ODP class and property adds to the ontology's footprint — prefer the simplest model that satisfies the CQs.

**Import-over-reinvention:** When a registry search finds an existing ontology or ODP that covers 3+ concepts from the extraction, prefer **importing** it rather than recreating equivalent classes and properties locally.

**Output — knowledge summary with:** (1) terms to reuse from existing ontologies (with source IRI), (2) terms to define as new classes, properties, or individuals, (3) open questions for the user, (4) import candidates.

### Step 4 — Draft Change Proposal (Plan Mode)

Produce an informal, structured proposal and **simultaneously** write it to `projects/<project_dir>/plans/PROPOSAL-<YYYYMMDD-HHmmss>.md` and present it in the conversation. Use mermaid diagrams for the class hierarchy. Do **not** output formal OWL/RDF in this step.

**CIG monitoring:** draft the PROforma plan structure rather than a class hierarchy — a Top-Level Plan with an Enquiry, a Decision, a Therapy Plan, and a Monitoring Plan in sequence; the Monitoring Plan with parallel Monitor Actions / Monitor Desired State / Monitor Undesired ADEs sub-plans. List the therapy interventions (each becoming an Action + Component with a State Achievement Goal) and the monitoring items (each becoming an Action + Component with an Action Enactment Goal), with proposed frequencies and justifications. See the `cig-monitoring` skill's `references/` for the design patterns.

**Make the proposal an executable spec (mandatory for CIG monitoring).** Step 6 is a near-mechanical transcription, so the proposal must fix everything Step 6 needs to be deterministic: assign **one canonical IRI per individual** — exactly one stable local name per ADE, keyed to its label section / Boxed Warning (e.g. one name for §5.5 Acute Kidney Injury; never two such as `Monitor_AKI` and `Monitor_Acute_Kidney_Injury`) — and list the **exact, final action set**, each with its `verb=order` Goal, its conditionality (and the `precondition` it needs), and its `monitoring_stance`. The §6 Individuals table is the authoritative IRI list Step 6 emits verbatim; do not invent or rename IRIs at formalization time.

**Scope the design pattern to the request (CIG monitoring).** The full four-component top-level plan is the shape of a *complete* CIG. Confirm the requested scope/hierarchy with the user before formalizing and build **only** the requested sub-structure, fully populated. An "ADE monitoring only" request must produce just the Monitor-Undesired-ADEs structure — **never** the full plan with empty Enquiry/Decision/Therapy/Monitor-Actions/Monitor-Desired placeholders. Never emit empty placeholder components (a component whose task has no goal/metaprops, an Enquiry with no data items, a Decision with no candidates/criteria, or a sub-plan with no actions).

**Consult the odp-pattern-selector skill during drafting** — it provides both the ODP catalogue and a **Modeling Checklist** (`references/ModelingChecklist.md`) that catches over-classification and anti-patterns.

**Draft pruning checkpoint (mandatory — run before presenting the draft):**

Before presenting the draft to the user, apply these checks to every proposed element. Remove elements that fail:

1. **CQ justification** — For each proposed class: name the specific CQ that requires it to exist as a class. If no CQ needs it → remove from the class hierarchy (or demote to individual). For each proposed property: name the CQ. If none → remove.
2. **Individuals vs. subclasses** — For each proposed subclass: "Would this subclass have its own distinct instances with different axioms from the parent?" If not → model as a NamedIndividual of the parent class. Fixed enumerated values with no distinguishing axioms (e.g. named options in a dataset column, rating categories, gender values, status labels) are **always** individuals, even if the task input calls them "subclasses" or "types" — use your modeling expertise to override imprecise terminology.
3. **Reification necessity** — For each reification class (an intermediary linking 3+ entities): "Does a CQ ask about **multiple attributes** of this relationship?" If the CQ only asks about the endpoints or a single temporal attribute → use a direct object property plus a data property on one endpoint instead of introducing a reification class.
4. **Abstract parent necessity** — For each abstract parent class that was not mentioned in any CQ or user story: remove it. Let children be direct subclasses of their nearest ancestor that IS mentioned, or of owl:Thing. Do not fabricate grouping classes for taxonomic neatness when no CQ references the group.
5. **Property necessity** — Do not create inverse properties, cardinality constraints, disjointness axioms, or property chains unless a CQ explicitly requires them. Each axiom must be traceable to a CQ.
6. **Class count sanity** — For N competency questions, expect roughly N ± 5 classes. If the draft significantly exceeds this, revisit each class against the CQs. The goal is the **minimum viable TBox** — the smallest set of classes and properties that answers all CQs.
7. **Regression check (iterations only — mandatory)** — Walk the Step 0 carry-forward checklist against the new draft. Every baseline element (each therapy Action and its goal, **every `avoid` goal and the top-plan `treat` goal**, each Enquiry `Data`/`Source`, each Decision `Candidate`/`Argument`/criterion/recommendation, each monitoring Action + canonical IRI) must be **retained/refined in the draft** or **listed in §10 with a source-grounded reason**. A baseline element that is neither retained nor explicitly excluded is a **silent drop and a defect** — restore it. Pruning removes CQ-unjustified *new* candidates; it may never quietly delete previously-approved content.

List all removed candidates in section 10 (Excluded Candidates) with the check number that eliminated them (e.g. "Removed by check 4: no CQ references this grouping concept"; "Removed by check 7: baseline element dropped and restored").

**Precision review (recommended):** After pruning, delegate a final review to a fast subagent. Provide it with the CQs and pruned element lists; ask it to flag any element not tied to a specific CQ.

**Plan file must include these sections:** (1) Scope, (2) Competency Questions, (3) Upper Ontology, (4) Class Hierarchy (Mermaid diagram), (5) Properties table (name, type, domain, range, inverse, CQ served, source), (6) Individuals, (7) External Term Reuse, (8) Open Questions, (9) Sources, (10) Excluded Candidates.

**Candidate tracking:** Every candidate concept identified in Steps 1–3 must be accounted for: it either appears in the draft **with a CQ justification**, or is listed in section 10 (Excluded Candidates) with a reason for exclusion. Exclusion is the **expected default** for concepts that no CQ requires — it indicates proper scope discipline, not an oversight. Most extraction tables will produce more excluded candidates than included ones — this is normal and desirable.

Close the draft with a **"What I need from you"** list. State clearly that you will not proceed to Step 6 until the user approves.

### Step 5 — User Feedback Loop

**Wait for the user to review and approve the draft.** Do not proceed to Step 6 until the user has explicitly confirmed. Support revisions (rejections, renames, restructuring), blanket approvals (resolve open questions and present all resolutions as a numbered list), and direct file edits. Store significant user decisions via semlocal. When revising, always update the plan file in place. On approval, update the plan file's `status` to `approved`, then proceed.

### Step 6 — Formalization

Convert the approved draft into formal ontology using the **ontology-editor** tools. **NEVER write or edit OWL files directly** — if a tool call fails, diagnose the error and retry. Do not fall back to manual file creation under any circumstances; report the error to the user instead.

**CIG monitoring — delegate to the `cig-formalizer` subagent.** Formalization of a CIG monitoring build is a **deterministic, regenerate-from-empty transcription** of the approved proposal, not a creative step. Hand it to the **`cig-formalizer`** subagent (configured in `capabilities.yaml`) with the project directory, the approved proposal path, and the ontology output path. The deterministic rules below are what that subagent enforces; they apply whether the subagent or the main agent does the emit.

**Deterministic emit rules (CIG monitoring — MUST / MUST NOT):**

1. **Fresh file only.** Build into a **fresh/empty** ontology file. If a project ontology already exists, **delete it first** (or regenerate from scratch). **NEVER append to, merge into, or extend** an ontology produced by a different plan or a prior run — even one that looks "well implemented." (Every observed merge failure came from editing a pre-existing artifact.)
2. **Proposal is the single source of truth.** The final ABox action set MUST **equal the approved proposal's action set exactly** — no extra actions, none missing.
3. **Canonical IRIs, no renames.** Emit the IRIs fixed in the proposal's §6 Individuals table verbatim — **one IRI per ADE/label section**. Never invent a second IRI for an ADE already named.
4. **Idempotent.** Running the emit twice MUST NOT create duplicates: no duplicate individuals, **no two Actions sharing one Goal**, **no individual with two `metaprops` or two `noun_phrase` assertions**, and **no two plan roots**.
5. **One fixed bundle per action.** For each approved monitoring action emit exactly: one `Action` + one `Component` (`taskref` + `components` into its sub-plan) + one `Goal` (`verb=order`) with exactly one `noun_phrase`, one `metaprops`, one `caption`, plus a `precondition` when the proposal marks it conditional.
6. **Full ServiceRequest block on BOTH sides (the recurring failure).** The Goal `noun_phrase` AND the Action `metaprops` MUST EACH contain **all five** `ServiceRequest.*` fields, kept consistent between the two: `ServiceRequest.intent`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, and `ServiceRequest.performerInstruction`. **`performerInstruction` is required** whenever there is a triggered lab or an urgent/escalation step — e.g. `ServiceRequest.performerInstruction = if symptoms occur, order serum CK/CPK, creatinine/eGFR, electrolytes including potassium and phosphate, urinalysis for blood/myoglobin pattern, and assess hydration/AKI risk`. **Never stop at `intent` + `code`.**

**CIG monitoring:** the instantiation is an **ABox** that reuses the PROforma classes/properties from `cig/proforma.owl` by IRI (do not redeclare them). Add the PROforma prefix (`http://www.owl-ontologies.com/Ontology1779030093.owl#`). Create `Plan`/`Action`/`Decision`/`Enquiry`/`Component`/`Goal`/`Candidate`/`Schedule_Constraint` individuals connected via `components`, `taskref`, `goal`, `scheduled_constraints`, `conref`, `precondition`, and `candidates`. Express sequence with `Schedule_Constraint`/`conref` (PROforma has no "next" property) and parallelism by sharing a parent plan with no constraints. Assert `verb` (`achieve`/`avoid` for State Achievement goals, `order` for Action Enactment goals) and `noun_phrase` (referencing an HL7 FHIR `ServiceRequest` — `intent`, `code`, `occurrenceTiming`, `patientInstruction`, and `performerInstruction` for triggered labs — for monitoring orders) on each `Goal`. **Assert `metaprops` on every monitoring `Action`** following the canonical grammar in `skills/cig-monitoring/references/MetapropsSyntax.md`: one `key=value; …` string that repeats the `ServiceRequest.*` order and documents provenance and operationalization (`category`, `monitored_target`, `provenance_type`, `source`, `knowledge_origin`, `guideline_status`, `literature_basis`, `assistant_invention`, `instrument`, `monitoring_frequency_basis`, `trigger`, `cq`) — with **no placeholder values** and the `ServiceRequest.*` block on **both** the Goal `noun_phrase` and the Action `metaprops` — so guideline-sourced facts are separable from self-designed ones and each action traces to the harm/goal it monitors (see `skills/cig-monitoring/references/ActionEnactmentGoal.md`). Populate the Enquiry's data items and the Decision's candidates+criteria (`references/Enquiry.md`, `references/Decision.md`); never emit empty placeholders. Write long `metaprops`/`noun_phrase` literals with the structured assertion tool (`add_data_property_assertion`) so they are not truncated. Imitate `cig/examples/obesity-glp1-monitoring.owl` (the authoritative example; the older `cig/examples/obesity-glp1.owl` is a frozen earlier example). When verifying in Step 7, pass `cig/proforma.owl` alongside the project ontology to `sparql_query` so the PROforma schema is available in the queried graph.

**Procedure:**

1. **Activate tools**: Read the **ontology-editor** skill (`skills/ontology-editor/SKILL.md`), then call `setup_tools(skills: ["ontology-editor"])` to activate the tools.
2. **Set ontology IRI**: Call `set_ontology_iri` with the **full IRI** (e.g. `"http://example.org/ontology/my-ontology/"`) — never a CURIE (e.g. `"ex:"`). Same for the version IRI. CURIEs in the `Ontology(...)` header produce invalid OWL that parsers reject.
3. **Add prefixes**: Call `add_prefix` for each namespace prefix (the ontology's own prefix, `owl`, `rdf`, `rdfs`, `xsd`, and any imported namespaces).
4. **Add axioms**: Use `add_axioms` to batch declarations, subclass axioms, property axioms, domain/range, cardinality restrictions, disjointness, equivalent classes, and annotation assertions. Group related axioms into logical batches (e.g. all class declarations, then property declarations, then restrictions).
5. **Verify**: Call `find_axioms` or `get_all_axioms` with `include_labels: true` to spot-check the result.

**Modeling guidance (apply during axiom construction):**

- Mint IRIs following the ontology's naming convention.
- **Reuse PROforma**: Use only the **existing classes, object, and data properties** from PROforma (`cig/proforma.owl`); reference them by IRI and do not define new object or data properties unless the user explicitly instructs otherwise.
- Assert subclass axioms, property chains, domain/range, cardinality. Where scope and CQs support it, add defined classes, inverse properties, and value partitions (see **Modeling quality and enrichment**).
- Add annotation properties (labels, definitions, synonyms, provenance).
- **Imports**: If you add any `owl:imports`, use the **canonical IRI** in angle brackets (e.g. `Import(<https://example.org/imported-ontology>)`). Never use CURIEs in `Import(...)` axioms (e.g. `Import(ex:imported-ontology)` is invalid) — parsers reject them.
- **Annotation assertions on the ontology itself** (e.g. `rdfs:label`, `rdfs:comment`, `dcterms:license`) must use the **full ontology IRI** as the subject, not a bare CURIE like `ex:`. Example: `AnnotationAssertion(rdfs:label <http://example.org/ontology/my-ontology/> "My Ontology"@en)`.
- **Datatype selection:** Choose semantically accurate XSD datatypes. Be aware that `xsd:date` and `xsd:gYear` are not in the OWL 2 DL datatype map — consult the user before substituting if strict DL compliance is required.
- Record provenance: requester, data sources, iteration date.

**End-of-Step-6 determinism checklist (CIG monitoring — self-apply before handing off to Step 7).** These are cheap, clinical-judgment-free checks that catch the recurring mechanical failures; every item must hold:

- `count(pf:Action)` **==** the action count in the approved proposal (no residue, none missing).
- Each `Action` has **exactly one** `metaprops` and **exactly one** `Goal` with **exactly one** `noun_phrase`.
- **No two `Action`s share a `Goal`**; there is a **single plan root** for the requested sub-structure.
- The Goal `noun_phrase` and Action `metaprops` each contain **all five** `ServiceRequest.*` fields (including `performerInstruction` for any triggered/urgent step).
- The ontology IRI **and** version IRI are **set** (no anonymous `Ontology(` header).
- **Exactly one** `rdfs:label` and **exactly one** `rdfs:comment`; any action count in prose is derived from the actual action set or dropped entirely (no hand-written, stale counts; no stale drug/indication lists).

### Step 7 — Automated Review

Run automated checks using the actual tools — **never fabricate or assume results**. Every check below must produce real tool output that you report to the user.

**Step 7 is a BLOCKING gate (CIG monitoring), not advisory.** The gate **PASSes if and only if there are zero FAILs across the full check set**. A re-review after a fix MUST **re-run the entire check set** — it may never re-verify only a subset, inherit a prior PASS, or drop a previously reported FAIL from the verdict. There is **no "keep it because it is well implemented"** and **no "human confirmation needed"** path to PASS: the artifact conforms to the approved plan or it FAILs. Delegate the CIG gate to the dedicated subagents (`cig-monitoring-reviewer` for the value-quality + structural gate, `cig-cq-verifier` for CQ verification) so the review is independent of the build.

**Procedure:**

1. **Pitfall scan**: Call `test_pitfalls` (ontology-editor tool) on the OWL file. Review the JSON report for issues; fix critical/important pitfalls before proceeding.
2. **Quality evaluation**: Call `test_quality` (ontology-editor tool) on the OWL file. It runs the whelk OWL EL reasoner over the inferred class hierarchy and returns OQuaRE metrics and an overall 1–5 score. Report the actual tool output and address low-scoring characteristics where reasonable.
3. **Competency question verification (mandatory — every CQ must be verified)**: Delegate this to the **`cig-cq-verifier`** subagent (which runs the **cq-verification** skill, `skills/cq-verification/SKILL.md`). Provide it the project directory, the approved proposal path (for the CQ list), and the ontology OWL file path (and, for CIG work, `cig/proforma.owl`). It creates test data, writes a SPARQL query for every CQ, and executes each with `sparql_query`, passing the ontology and test-data file paths together so they are merged into one graph (schema + individuals) — never querying test data alone. Every CQ must appear in the results table. If any CQ fails due to an ontology gap, return to Step 6.
4. **Structural determinism checks (CIG monitoring — HARD blocking FAILs)**: Confirm with `find_axioms`/`sparql_query` that the build is a clean 1:1 materialization of the approved proposal. Each of the following is a **FAIL** (not a WARN, note, or "optional" cleanup): the built action set differs from the approved set (extras, prior-session residue, or missing actions); duplicate concepts or duplicate Action IRIs for the same ADE; two or more plan roots, or two Actions sharing one Goal; an individual with duplicate `metaprops` or duplicate `noun_phrase`; an unset ontology IRI (anonymous `Ontology(` header); more than one `rdfs:label` or `rdfs:comment`. Also do the generic structural checks (orphaned classes, undefined domains/ranges, missing `rdfs:label`).
5. **Duplication**: Search for new terms that are semantically equivalent to existing terms in the ontology or imported ontologies.
6. **CIG metaprops value-quality gate (CIG projects only, mandatory)**: Delegate to the **`cig-monitoring-reviewer`** subagent, which runs the **`cig-monitoring-review`** skill. It inspects metaprops **values** (not just key presence, which is gameable): it rejects placeholders, requires real citations and **all five** `ServiceRequest.*` fields (`intent`, `code`, `occurrenceTiming`, `patientInstruction`, and `performerInstruction` for any triggered/urgent step) on **both** the Goal `noun_phrase` and the Action `metaprops`, judges the case-report harm-not-reversibility rule, checks `monitored_target` traceability and stance↔schedule consistency, and flags empty placeholder components and unpopulated Enquiry/Decision — emitting a readable pass/fail report under `projects/<project_dir>/reviews/`. A missing ServiceRequest field on either side is a **FAIL**. Do not report the CIG as done while any FAIL remains.

When a check fails, **report the specific error** and return to Step 6 (hand the fix list to `cig-formalizer`), then re-run the **full** gate. Do not mark the build done until the gate PASSes with zero FAILs.

---

## Modeling quality and enrichment

When drafting (Step 4) and formalizing (Step 6), consider the following so the ontology supports reasoning and stays maintainable. Apply only where they fit the scope and CQs; do not add complexity for its own sake.

**CQ-driven class parsimony** 
- Only create a subclass when at least one CQ requires **distinguishing it from its parent at the class level**. If the user story mentions specific instances of a concept but no CQ requires class-level reasoning about those distinctions, model them as **individuals of the parent class** rather than subclasses.
- Before adding any class to the draft, ask: "Which CQ requires this to be a class rather than an individual?" If the answer is "none," omit it from the class hierarchy.
- **Individuals over subclasses for enumerated values**: When a class has a fixed set of named options that all share the same structure and differ only by label (e.g. color values, priority levels, status codes, named categories in a dataset column), those options are **NamedIndividuals** of the class, not subclasses. This applies even if the task input or data source calls them "subclasses" or "types" — use your modeling expertise to override imprecise terminology. Key test: if no CQ requires different axioms or properties for each option, they are individuals.
- **Class count awareness**: For a task with N competency questions, the ontology typically needs roughly N ± 5 classes. Significantly exceeding this range is a strong signal of over-generation. Review each class against the CQs before proceeding.
- For detailed checks, consult the **odp-pattern-selector** skill's **Modeling Checklist** (`references/ModelingChecklist.md`) during Step 4.

**Defined classes (equivalent class)**  
- For categories that are **structurally determined** (e.g. "vegetarian" = no meat/fish ingredients), define them with necessary and sufficient conditions (`EquivalentClasses`) so the reasoner can classify instances from their structure. Prefer this over only asserting subclasses when the distinction is rule-based.

**Shared upper layer and generic relations**  
- When the domain has **components or ingredients** (parts that participate in a common relation), consider a shared superclass and a generic relation (e.g. `hasIngredient`, `hasPart`) with domain/range and subproperty relations. This clarifies semantics and can align with external ontologies.

**Component taxonomies and value partitions**  
- Model **taxonomies of components** when they constrain or define other classes. Use disjoints between sibling categories where appropriate.
- When a property has a **fixed set of values** that affect other axioms, consider a **value partition** and use it as the range of the property so restrictions and defined classes can refer to it.

**Property minimalism**  
- Create only object and data properties that are directly required to answer at least one CQ. Cite which CQ each property serves. If a property serves no CQ, omit it.
- Prefer fewer, general properties over many domain-specific ones. Do **not** create inverse properties by default — only when a CQ requires navigating in reverse.
- State cardinality only where a CQ explicitly requires it. Do not add cardinality constraints speculatively.

**Learning from reference ontologies**  
- When comparing to a **reference or tutorial ontology** in the same domain, extract **structural patterns** that help answer CQs. Do **not** copy pedagogy-only content or scale that is out of scope.

**Taxonomic organization and abstract parent classes**  
- When several classes share a **common domain theme**, consider an abstract organizing class **only if a CQ references the grouping concept**. Do not create parents purely for taxonomic tidiness when no CQ references the group. A flat set of sibling classes under owl:Thing is acceptable when no CQ requires the grouping.
- Only **reify a domain concept as a class** when CQs ask about **multiple attributes** of that concept (not just a single value). If a CQ asks "When did X start?" this needs only a data property on an existing class — not a new reification class — unless another CQ also asks about additional attributes of the same relationship.
- When the scoped concept is clearly a **specialization** of a broader concept **and a CQ or user story explicitly references the broader concept**, model both the general parent and the specific subclass. If no CQ references the broader concept, do not fabricate a parent class solely for extensibility.

**Hierarchy-first design**  
- The SubClassOf hierarchy is the primary structure of the ontology. Every proposed class should participate in a SubClassOf relationship where a natural, CQ-justified parent exists. However, if the only way to place a class in a hierarchy is to **invent** an abstract parent that no CQ references, leave the class under owl:Thing rather than fabricating a parent.

### Common modeling anti-patterns

Avoid these patterns. Consult the **odp-pattern-selector** skill's **Modeling Checklist** (`references/ModelingChecklist.md`) for an anti-pattern scan table with corrective ODPs.
