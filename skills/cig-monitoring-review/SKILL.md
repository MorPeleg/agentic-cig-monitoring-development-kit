---
name: cig-monitoring-review
description: Mandatory value-quality review gate for a CIG monitoring instantiation. Checks that every monitoring Action's pf:metaprops has real content (not placeholders), that the ServiceRequest order appears on BOTH the Goal noun_phrase and the Action metaprops, that case-report sources document a drug harm, that each action traces to a monitored target, and that no empty placeholder components or unpopulated Enquiry/Decision remain. Use during Step 7 (Automated Review) of a CIG monitoring build, or whenever the user asks to review/validate a PROforma monitoring ontology, check metaprops quality, or asks "is this CIG monitoring ontology good?". Replaces the gameable presence-only metaprops check.
---

# CIG Monitoring Review Skill

A **mandatory Step 7 gate** for any CIG monitoring instantiation. The earlier presence-only `metaprops` check was **gameable**: when the agent wrote placeholder values (`source=s; instrument=i; provenance_type=p`), a query that only tested *key presence* passed with "0 missing". This skill inspects **values**, not just keys, so placeholders fail.

It is intended to run as a **subagent** so the review is independent of the build. Activate the tools, extract the facts with SPARQL/`find_axioms`, then apply judgment against the rules below and emit a readable pass/fail report.

## Inputs

- The project ontology OWL file (`projects/<project_dir>/ontology/<name>.owl`).
- `cig/proforma.owl` (pass alongside the project ontology so PROforma classes/properties are in the queried graph).
- The canonical syntax contract: `skills/cig-monitoring/references/MetapropsSyntax.md`.
- The approved proposal (for scope and the CQ list).

## Activate tools

Read this skill, then `setup_tools(skills: ["cig-monitoring-review"])`. Use `call_tool(name: "<tool>", data: {...})` for `sparql_query`, `find_axioms`, and `get_all_axioms`. Always pass **both** the project ontology and `cig/proforma.owl` in `owl_file_paths`.

## Phase 1 — Extract the facts

Run these queries (pass the project ontology + `cig/proforma.owl` together).

**Q1 — every monitoring Action with its goal and metaprops** (the rows you grade):

```sparql
PREFIX pf: <http://www.owl-ontologies.com/Ontology1779030093.owl#>
SELECT ?action ?noun_phrase ?metaprops WHERE {
  ?action a pf:Action ; pf:goal ?g .
  ?g pf:verb "order" .
  OPTIONAL { ?g pf:noun_phrase ?noun_phrase }
  OPTIONAL { ?action pf:metaprops ?metaprops }
}
```

**Q2 — empty placeholder components** (a component whose task is an Action with no goal):

```sparql
PREFIX pf: <http://www.owl-ontologies.com/Ontology1779030093.owl#>
SELECT ?component ?task WHERE {
  ?component a pf:Component ; pf:taskref ?task .
  ?task a pf:Action .
  FILTER NOT EXISTS { ?task pf:goal ?g }
}
```

**Q3 — unpopulated Enquiry** (no data items via sources/sref):

```sparql
PREFIX pf: <http://www.owl-ontologies.com/Ontology1779030093.owl#>
SELECT ?enquiry WHERE {
  ?enquiry a pf:Enquiry .
  FILTER NOT EXISTS { ?enquiry pf:sources ?s . ?s pf:sref ?d }
}
```

**Q4 — unpopulated Decision** (candidate with no argument/criteria):

```sparql
PREFIX pf: <http://www.owl-ontologies.com/Ontology1779030093.owl#>
SELECT ?decision ?candidate WHERE {
  ?decision a pf:Decision ; pf:candidates ?candidate .
  FILTER NOT EXISTS { ?candidate pf:arguments ?a . ?a pf:proforma_condition ?c }
}
```

**Q5 — sub-plans with no actions** (an empty Monitor-* stub):

```sparql
PREFIX pf: <http://www.owl-ontologies.com/Ontology1779030093.owl#>
SELECT ?plan WHERE {
  ?parent pf:components ?comp . ?comp pf:taskref ?plan . ?plan a pf:Plan .
  FILTER NOT EXISTS { ?plan pf:components ?c . ?c pf:taskref ?t . ?t a pf:Action }
  FILTER NOT EXISTS { ?plan pf:components ?c2 . ?c2 pf:taskref ?sp . ?sp a pf:Plan }
}
```

## Phase 2 — Grade each monitoring Action (value quality)

For every Q1 row, apply the `MetapropsSyntax.md` value constraints. Mark the action **FAIL** if any hold:

1. **Placeholder values.** Any value is empty, a single character, or in {`o`,`p`,`s`,`i`,`t`,`tbd`,`xxx`,`...`,`n/a`}. Reject `source=s`, `instrument=i`, `provenance_type=p`, etc.
2. **ServiceRequest on the Action.** `metaprops` is missing or lacks `ServiceRequest.intent=order`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction` (and `ServiceRequest.performerInstruction` when there is a triggered lab/urgent step).
3. **ServiceRequest on the Goal too.** The Goal `noun_phrase` is missing or omits the same `ServiceRequest.*` fields. The two must be consistent.
4. **occurrenceTiming is real.** It must name a cadence/trigger (a time unit such as daily/weekly/monthly/q3mo/baseline/visit/escalation/event), not a placeholder.
5. **Real citations.** At least one `source=` value, each containing a citation token (PMID/PMC/DOI) or a named guideline/label/instrument. `source=s` fails.
6. **Controlled vocab.** `category`, `provenance_type`, `source_kind`, `guideline_status` are within the `MetapropsSyntax.md` vocab.
7. **Honest invention split.** `assistant_invention` is `none` or a descriptive phrase (not a single letter).
8. **Traceability.** `monitored_target` names what is monitored **and** the therapy goal/recommendation it traces to. Confirm that target exists in the ontology.
9. **Required documentation keys present with content.** `knowledge_origin`, `literature_basis`, `instrument`, `monitoring_frequency_basis`, `trigger`, `cq` each have real content.

## Phase 3 — Case-report harm judgment (LLM)

For every action whose `source_kind` contains `case_report`, read its `literature_basis` and `monitored_target` and **judge the harm-not-reversibility rule**: the case report must document a **harm caused by / occurring during** the drug — **not** a report whose point is that symptoms resolve after stopping the drug (reversibility is not a monitorable harm). Flag any case-report action that fails this test. List each case-report action with its sources so a human reviewer can confirm.

## Phase 4 — Scope and structure

- Report any Q2/Q3/Q4/Q5 rows as **FAIL** (empty placeholder components, unpopulated Enquiry/Decision, empty sub-plans).
- Confirm the built structure matches the **requested scope** (from the proposal). An "ADE monitoring only" request that produced a full plan with empty stubs is a FAIL even if the ADE actions are fine.

## Phase 5 — Emit the report

Write a readable report to `projects/<project_dir>/reviews/cig-monitoring-review-<YYYYMMDD-HHmmss>.md` (this is the concrete artifact a human reads instead of trusting a green check). Include:

- A top-line **PASS/FAIL** and counts.
- A per-action table: `Action | category | ServiceRequest on Goal? | ServiceRequest on Action? | citations ok? | placeholders? | monitored_target ok? | verdict`.
- A **case-report section**: each case-report action with `monitored_target`, `literature_basis`, sources, and the harm-judgment verdict.
- A **structure section**: any empty components, unpopulated Enquiry/Decision, empty sub-plans, scope mismatches.
- A **fix list**: the specific actions/fields to correct.

If anything FAILs, return to Step 6, fix via the ontology-editor tools, and re-run this gate. Do **not** report the CIG as done while any FAIL remains.

## Related

- `skills/cig-monitoring/references/MetapropsSyntax.md` (the contract this enforces)
- `skills/cig-monitoring/references/ActionEnactmentGoal.md` (Goal side + case-report rule)
- `skills/cq-verification/SKILL.md` (the parallel CQ gate)
- `cig/examples/obesity-glp1-monitoring.owl` (a build that should PASS this gate)
