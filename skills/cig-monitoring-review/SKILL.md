---
name: cig-monitoring-review
description: Mandatory, blocking Step 7 value-quality gate for a PROforma CIG monitoring build (.pf). Runs scripts/check_cig.mjs (lint, reachability, empty plans, unpopulated Enquiry/Decision, the monitoring metaprops contract, executable preconditions, the approved cig-actions set, baseline regressions, the coding-only freeze), then completes the reviewer judgment phases (case-report harm, source fidelity, label coverage, monitored_target semantics) in the same report. Rejects placeholder metaprops (source=s), a ServiceRequest missing from either goal.noun_phrase or the metaprops keys, out-of-scope case reports, monitors that trace to no therapy action or plan, duplicate monitors, dropped or flipped baseline goals, and coding-only runs that rewrite names, captions or Decision candidates. Use during Step 7 of every CIG monitoring build, and whenever the user asks to review or validate a CIG / .pf guideline, check metaprops quality, or asks "is this CIG good?". Replaces the gameable presence-only metaprops check.
---

# CIG Monitoring Review Skill

A **mandatory, blocking Step 7 gate** for any CIG monitoring build. The earlier presence-only `metaprops` check was **gameable**: when the agent wrote placeholder values (`source=s`, `instrument=i`, `provenance_type=p`), a check that only tested *key presence* passed with "0 missing". This gate inspects **values**, not just keys, so placeholders fail.

It checks two things presence-only checks miss: (1) **value quality**: placeholders, ServiceRequest consistency, controlled vocabulary, traceability, executable applicability; and (2) **source fidelity**: whether the action's applicability, monitoring stance and label coverage match what the cited source actually says. A populated, well-cited action can still misrepresent the source by making a conditional ADE universal, inventing a schedule the source advises against, or omitting labeled warnings.

The gate has two halves that write **one report**:

- **Deterministic half:** `scripts/check_cig.mjs` checks everything that needs no clinical judgment and writes the report skeleton.
- **Judgment half:** the reviewer completes the `Judgment phases (reviewer)` section and the fix list of that same report.

Run it as a **subagent** (`cig-monitoring-reviewer`) so the review is independent of the build. The reviewer **reads**; it never edits the guideline, the proposal or the baseline.

## Inputs

- The guideline: `projects/<project_dir>/guideline/<name>.pf`.
- The approved proposal: `projects/<project_dir>/plans/PROPOSAL-<YYYYMMDD-HHmmss>.md`. The script reads its `status` header (must be `approved`) and its `mode` header (`coding-patch` for coding-only runs), written either as front matter (`status: approved`) or as markdown (`**Status:** approved`, `- **Mode:** coding-patch`); it also reads its ```` ```cig-actions ```` block (the canonical action set) and its optional ```` ```cig-excluded ```` block. The reviewer reads its scope, source list, §6 task table and §10 Excluded Candidates.
- The baseline, on any iteration or coding patch: the **newest** snapshot in `projects/<project_dir>/guideline/baseline/` (`<name>-<YYYYMMDD-HHmmss>.pf`, highest timestamp).
- The contract: `skills/cig-monitoring/references/MetapropsSyntax.md` (and `ActionEnactmentGoal.md` for the goal side and the opt-in case-report rule).

## Tools

- **Scripts** (run with `node` from the kit root): `scripts/check_cig.mjs`. It calls the proforma CLI (`proforma lint`, `proforma export`); the CLI is found via `PROFORMA_BIN`, a global `proforma-mcp` install, `proforma` on `PATH`, or a private install of the pinned `proforma-mcp@0.2.0`.
- **Read tools** (proforma MCP server; `setup_tools(skills: ["cig-monitoring-review"])`, capa tool ids `pf_<tool>`): `export_json` (the whole guideline as JSON: every task's `metaprops`, `precondition`, `components`, `candidates`, `sources`; every data item's `type` and `asked_by`), `get_component` (one task, candidate, argument or source, e.g. `Monitor_Hypoglycemia`, `Eligibility_Decision/candidate:Eligible`), `outline` (the plan tree), `find_references` (what uses a data item or task), `check_expression` (what each name in a precondition resolves to), `lint`. The CLI equivalents are `npx -y proforma-mcp@0.2.0 export|get|outline|check-expression|lint`.

Metaprops values come back from these tools unescaped (`=` and `:`, not the `\=` / `\:` Composer writes in the file). Repeatable keys are numbered: read `source`, `source.1`, `source.2`, … together.

## Phase 1: Run the deterministic gate

```
node scripts/check_cig.mjs projects/<project_dir>/guideline/<name>.pf \
  --proposal projects/<project_dir>/plans/PROPOSAL-<ts>.md \
  [--baseline projects/<project_dir>/guideline/baseline/<name>-<newest ts>.pf] \
  [--coding-patch] \
  --report projects/<project_dir>/reviews/cig-monitoring-review-<YYYYMMDD-HHmmss>.md
```

- **Always** pass `--proposal`. Without it the approved-action-set check does not run and every case-report action FAILs.
- Pass `--baseline` whenever a snapshot exists in `guideline/baseline/` (every iteration and every coding patch). Use the newest snapshot only.
- The coding-only freeze switches on automatically when the proposal's mode is `coding-patch`. Pass `--coding-patch` yourself when the request was coding-only (add SNOMED CT / LOINC / RxNorm / OMOP / finding codes) but the proposal does not say so; the script then WARNs that the proposal mode differs. A coding-patch run without `--baseline` exits **2**.
- Use a **new timestamp** for every run. The script overwrites the `--report` file, including any judgment section already written in it.
- Exit code: **0** = deterministic PASS, **1** = at least one FAIL, **2** = usage or input error (file not found, export failed, missing option value, coding patch without a baseline). **Exit 2 is not a PASS**: fix the invocation or the file and run again.
- `--json` prints the full result (counts, per-action check map, every finding) for machine reading.

The script prints each finding as `FAIL|WARN [area] where: message` and writes the report skeleton: a top line `Deterministic gate: PASS|FAIL` with counts; a **Monitoring actions** table (one row per action with `goal.verb=order`: `Action | category | required | placeholders | serviceRequest | goalConsistency | citations | vocab | traceability | appliesWhen | stance | caseReport | verdict`); the sections **Structure, scope and lint**, **Metaprops value quality**, **Approved action set and baseline**, **Coding-only freeze** (only in a coding-patch run); a placeholder **Judgment phases (reviewer)** section; and a **Fix list** of every FAIL.

### What the script checks, and what it leaves to you

| Old check (SPARQL era) | Script check (report column or finding area) | Deterministic in the script | Remains reviewer judgment |
|---|---|---|---|
| Q1: monitoring Actions with goal + metaprops | the **Monitoring actions** table | Every action with `goal.verb=order` is graded | — |
| Placeholder values | `placeholders` | Empty, single-character or placeholder values (`o p s i t x tbd todo xxx ... n/a na none? ?`) in any key | Values that are filler in longer words |
| ServiceRequest on the Action | `required`, `serviceRequest` | `ServiceRequest.intent/code/occurrenceTiming/patientInstruction` present; `intent=order`; `performerInstruction` present when `code` or `occurrenceTiming` reads as triggered or urgent (`triggered`, `on symptoms`, `if symptom`, `when symptomatic`, `urgent`, `same-day`, …) | A triggered lab or urgent step worded so the pattern misses it; every WARN `trigger is set … but there is no ServiceRequest.performerInstruction` |
| ServiceRequest on the Goal | `goalConsistency` | Each of the five `ServiceRequest.*` fields is on both `goal.noun_phrase` and the metaprops keys, with identical values | — |
| occurrenceTiming is real | `serviceRequest` | Names a cadence or trigger word (baseline, visit, daily, weekly, monthly, q3mo, every, escalation, event, symptom, onset, dose, day/week/month/year, …) | Whether the cadence is the source's |
| Real citations | `citations` | ≥1 `source` / `source.N`, each ≥6 characters with a citation token (PMID, PMC, DOI, guideline, label, prescribing information, insert, instrument, NICE/ADA/…, a year) | Whether the citation is real and is the source the content came from |
| Controlled vocab | `vocab` | `category`, `provenance_type`, `source_kind` (parts joined by `+` / `_plus_`), `guideline_status`, `monitoring_stance` in the `MetapropsSyntax.md` vocabulary | — |
| Honest invention split | `placeholders` | `assistant_invention` is not a letter or placeholder | — |
| Traceability | `traceability` | `monitored_target` names, as a whole word, a therapy action (`goal.verb` `achieve` / `avoid`) or a therapy plan (a non-root plan whose descendants include therapy actions and no monitoring actions). Naming `Monitoring_Plan`, another monitor or the root plan FAILs. In a guideline with **no** therapy action or therapy plan (e.g. ADE-only scope) it is a WARN `no therapy action or plan in this guideline …` instead | That it also names **what is monitored**, and that the named task is the one whose goal this monitor serves, with a matching goal. On the ADE-only WARN: that the target matches the approved proposal |
| Required documentation keys | `required` | `knowledge_origin`, `literature_basis`, `instrument`, `monitoring_frequency_basis`, `trigger`, `cq`, `applies_when`, `monitoring_stance`, `category`, `provenance_type`, `source_kind`, `guideline_status`, `assistant_invention` present with content | — |
| Stance ↔ schedule | `stance` | `monitoring_stance=routine_not_recommended` with a routine timing (baseline, daily … yearly, `q3mo`, `every N`) and no symptom/trigger/event wording | Whether the stance itself is faithful to the source |
| Sub-population precondition (old 3b query) | `appliesWhen` | `applies_when` ≠ `all_patients_on_therapy` ⇒ a `precondition` exists, uses a data item, and that data item is asked by an Enquiry; lint type-checks the expression | Whether the expression is the source's condition; actions marked `all_patients_on_therapy` whose source is conditional; WARN `precondition … on an action that applies to all patients` |
| Case reports out of scope | `caseReport` | `source_kind` contains `case_report` ⇒ the action is in the proposal's `cig-actions` | Whether the proposal **explicitly** scopes the case-report source; the harm-not-reversibility test |
| Q2: empty placeholder components | `structure`: `Action without a goal`, `goal.verb without goal.noun_phrase` | yes | — |
| Q3: unpopulated Enquiry | `structure`: `Enquiry with no data items (sources)` | yes | — |
| Q4: unpopulated Decision | `structure`: `Decision with no candidates`, `candidate with no arguments` | yes | Whether each argument condition is a real criterion over the Enquiry's data items |
| Q5: empty sub-plans | `structure`: `empty plan (no components)`, `not reachable from the root plan` | yes | — |
| Executable conditions (new in PROforma) | `structure`: `… uses <name>, which is not a data item, task or candidate (misspelt or missing; PROforma would read it as text)`; `derivation uses unknown name(s) …`; `lint` FAILs for PF-X061, PF-X062, PF-V051, PF-V053, PF-V034, PF-V030 | yes: every `precondition`, `wait_condition`, `abort`, `terminate`, candidate `recommendation`, argument condition and data `derivation` is scanned; a bare name (or quoted `'name'`) that is not a data item, task, candidate or function (case-insensitive), not an operator or literal (`and`, `or`, `includes`, `true`, `yes`, `unknown`, …), not a function call and not on the value side of a comparison (`contraindications = none`) FAILs. The lint codes are escalated from warning to FAIL because such a condition can never work: unknown candidate (X061), unknown task (X062), `result_of` / `result_set` on a non-decision (V051 / V053), untypeable expression (V034), unknown function (V030) | Whether each condition expresses the approved criterion (Phases 3b and 4) |
| Goal vocabulary | `structure`: `goal.verb outside the vocabulary` (FAIL); WARN `Action goal.verb … is neither a monitoring (order) nor a therapy (achieve/avoid) goal; it is not graded` | yes: the vocabulary is `diagnose`, `treat`, `prevent_primary`, `prevent_secondary`, `prevent`, `avoid`, `start`, `stop`, `order`, `achieve` (trimmed, case-insensitive) | Every ungraded-action WARN: an Action that is really a monitor or a therapy step must carry `order` or `achieve` / `avoid` |
| Duplicate monitors (old Step 7 duplicate rule) | `structure`: `duplicates <action> (same order)` | yes: two monitoring actions with the same `goal.noun_phrase`, or the same `ServiceRequest.code` + `occurrenceTiming` (case-insensitive) | Two monitors for one harm whose orders are worded differently |
| Other structure | `lint` (errors FAIL; the six escalated codes above FAIL; other warnings WARN), `structure` (`no root plan`, `data item without a type`, `owl.*` migration leftover; WARN data item no Enquiry asks for and nothing derives), `annotation` (no metadata title; hand-written count in metadata `desc`), `therapy` (achieve/avoid without `goal.noun_phrase`) | yes | Scope matches the request |
| Built action set = approved set | `proposal`: status not approved, no `cig-actions` block, approved action missing, action not in the proposal | yes | — |
| Baseline regression | `baseline`: baseline task, data item, `Decision/Candidate` or argument missing and not in `cig-excluded`; a task kept from the baseline whose `goal.verb` changed or vanished, unless the task is in `cig-excluded` | yes (with `--baseline`) | Each `cig-excluded` entry has a source-grounded reason in §10 |
| Coding-only freeze | `codingPatch` | yes (coding-patch run) | — |

**The script never decides:** case-report harm; applicability, negative-recommendation and monitoring-instruction fidelity; label coverage; whether `monitored_target` names both what is monitored and the goal. Those are Phases 3, 3b and the judgment parts of Phases 2 and 4 below.

## Phase 2: Grade each monitoring Action (value quality)

The script grades every row. Mark the action **FAIL** if any of these hold; the bracket names the script check, and the reviewer covers what the script cannot see.

1. **Placeholder values** [`placeholders`]. Any value is empty, a single character, or a placeholder (`o`, `p`, `s`, `i`, `t`, `tbd`, `xxx`, `...`, `n/a`). Reject `source=s`, `instrument=i`, `provenance_type=p`, etc.
2. **ServiceRequest on the Action** [`required`, `serviceRequest`]. The metaprops lack `ServiceRequest.intent=order`, `ServiceRequest.code`, `ServiceRequest.occurrenceTiming`, `ServiceRequest.patientInstruction`, or `ServiceRequest.performerInstruction` when there is a triggered lab or urgent step. *Reviewer:* the script detects triggered steps by wording. Read every `code`, `occurrenceTiming` and `trigger`; a triggered lab or urgent step without `performerInstruction` is a **FAIL** even when the script did not flag it. Resolve every `trigger is set … no performerInstruction` WARN: FAIL it if the trigger orders a lab or an urgent step, otherwise record why none is needed.
3. **ServiceRequest on the Goal too** [`goalConsistency`]. `goal.noun_phrase` is missing or omits any `ServiceRequest.*` field present in the metaprops, or a value differs. Both sides must carry the same order.
4. **occurrenceTiming is real** [`serviceRequest`]. It names a cadence or trigger (daily, weekly, monthly, q3mo, baseline, visit, escalation, event), not a placeholder.
5. **Real citations** [`citations`]. At least one `source` / `source.N`, each with a citation token (PMID, PMC, DOI) or a named guideline, label or instrument. `source=s` fails.
6. **Controlled vocab** [`vocab`]. `category`, `provenance_type`, `source_kind`, `guideline_status`, `monitoring_stance` are within the `MetapropsSyntax.md` vocabulary.
7. **Honest invention split** [`placeholders`]. `assistant_invention` is `none` or a descriptive phrase, not a single letter.
8. **Traceability** [`traceability` + judgment]. `monitored_target` names what is monitored **and** the therapy goal or recommendation it traces to, by task name (e.g. `… (achieve goal of Prescribe_GLP1)`), because goals have no names of their own. The script FAILs a target that names no therapy action (`achieve` / `avoid`) and no therapy plan; naming `Monitoring_Plan`, another monitor or the root plan does not pass. In a guideline with no therapy action or therapy plan (e.g. an ADE-only build) the script cannot check this and WARNs `no therapy action or plan in this guideline …` instead. *Reviewer, on that WARN:* compare every `monitored_target` with the approved proposal (§6 task table and the therapy it names); a target that does not name the therapy or recommendation the proposal traces this monitor to is a **FAIL**. *Reviewer, always:* read each `monitored_target` with `export_json` / `get_component`. It is a **FAIL** if it does not say what is monitored, if the therapy task it names is not the one whose goal this monitor serves, or if that task's `goal.verb` / `goal.noun_phrase` does not match the target (e.g. an `avoid` goal traced as a desired outcome).
9. **Required documentation keys present with content** [`required`]. `knowledge_origin`, `literature_basis`, `instrument`, `monitoring_frequency_basis`, `trigger`, `cq`, `applies_when`, `monitoring_stance` each have real content.
10. **Stance ↔ schedule consistency** [`stance`]. If `monitoring_stance=routine_not_recommended`, `occurrenceTiming` must be symptom- or event-triggered, **not** a routine `baseline` / `monthly` / `q3mo` cadence. A routine schedule under a "not recommended" stance is a **FAIL** (the operationalization contradicts the cited source).
11. **Executable applicability** [`appliesWhen`]. A population-scoped action (`applies_when` ≠ `all_patients_on_therapy`) carries a `precondition` that is a PROforma expression over a data item the eligibility/baseline Enquiry asks for (e.g. `on_insulin_or_secretagogue = true`). A sentence is not a precondition, and a misspelt data item name is a `structure` FAIL (PROforma would read it as text, so the condition would silently never hold). Whether the expression is the *right* condition is Phase 3b.

## Phase 3: Case-report harm judgment (reviewer)

**Out-of-scope FAIL.** A monitoring Action whose `source_kind` contains `case_report` is a **FAIL** unless the approved proposal **explicitly lists that action in scope** (named in the §6 task table with its case-report source, or marked in scope in the request). The script's `caseReport` check proves only that the name is in `cig-actions`; that is necessary, not sufficient. Skill examples are not scope. Default sources are guidelines and package inserts.

For every **in-scope** action whose `source_kind` contains `case_report`, read its `literature_basis`, `monitored_target` and `source.N` values and **judge the harm-not-reversibility rule**: the case report must document a **harm caused by / occurring during** the drug, **not** a report whose point is that symptoms resolve after stopping the drug (reversibility is not a monitorable harm). Flag any case-report action that fails this test. List each case-report action with its sources so a human reviewer can confirm, and give your verdict.

## Phase 3b: Source fidelity (reviewer)

Presence and well-formedness of `metaprops` do **not** guarantee the content is faithful to what the cited source says. For each monitoring action, read its `source.N`, `literature_basis`, `applies_when`, `monitoring_stance`, `ServiceRequest.*` and `precondition`, and judge:

1. **Applicability fidelity.** If the cited source qualifies the harm to a sub-population (e.g. label hypoglycemia *only with concomitant insulin/secretagogue*; diabetic retinopathy *only in type 2 diabetes*), the action must carry that condition in `applies_when` **and** an executable `precondition`. The script already FAILs a sub-population `applies_when` without a valid precondition. You catch the other direction: an action that is unconditional (`applies_when=all_patients_on_therapy`, no precondition) while its source is conditional is a **FAIL**. Also confirm the precondition says what the source says: use `check_expression` on it to see what each name resolves to, and `get_component` on the data item to read its type and description. A precondition over the wrong fact, or a broader condition than the source, is a **FAIL**. Resolve every WARN `precondition … on an action that applies to all patients on therapy` (one of the two is wrong).
2. **Negative-recommendation fidelity.** If the cited source says routine monitoring of X is not recommended / of uncertain value (e.g. routine calcitonin or thyroid ultrasound for C-cell risk), the action must be `monitoring_stance=routine_not_recommended` with a symptom-triggered schedule, or be omitted. An invented routine surveillance schedule that contradicts the source is a **FAIL**. The script catches only a routine schedule under a `routine_not_recommended` stance; an action whose stance was set to `recommended` against the source is yours to catch.
3. **Monitoring-instruction fidelity.** If a labeled warning states its own monitoring instruction (e.g. §5.9 "Monitor heart rate at regular intervals"), the action should reflect it as a recommended, label-specified monitor, not down-rank it to an incidence footnote. Flag actions that ignore or contradict the source's explicit monitoring directive.
4. **Label coverage.** Using the proposal's source list and §10 (Excluded Candidates), confirm every Boxed Warning and numbered Warnings and Precautions section of each cited label is accounted for: either as a monitoring action or as an explicit exclusion with a reason. List any labeled warning that is neither monitored nor excluded as a coverage gap (**FAIL**).

These are judgment calls, like the case-report phase: list each action with the source text, the verdict and the reason so a human reviewer can confirm.

## Phase 4: Scope and structure

- **Script:** every `lint` error, the escalated lint codes (PF-X061 unknown candidate, PF-X062 unknown task, PF-V051 / PF-V053 `result_of` / `result_set` on a non-decision, PF-V034 untypeable expression, PF-V030 unknown function), and every `structure`, `annotation`, `therapy` and `proposal` finding is a **FAIL**: a condition or derivation that uses an unknown bare name (not a data item, task, candidate or function, and not the compared value in e.g. `= none`), no root plan, unreachable task (residue or missing component), empty plan, Enquiry without data items, Decision without candidates, candidate without arguments, Action without `goal.verb`, `goal.verb` outside the goal vocabulary, `goal.verb` without `goal.noun_phrase`, two monitoring actions with the same `goal.noun_phrase` or the same `ServiceRequest.code` + `occurrenceTiming`, `owl.*` migration leftovers, data item without a type, no metadata title, a hand-written count in metadata `desc`, a proposal that is not approved or has no `cig-actions` block, and any difference between the built action set and `cig-actions` (missing or extra actions).
- **Reviewer:** confirm the built structure matches the **requested scope** (from the proposal). An "ADE monitoring only" request that produced a full plan with empty stubs is a **FAIL** even if the ADE actions are fine; it must be one populated monitoring plan as the root. Use `outline` to see the tree. Also FAIL:
  - two monitoring actions for the same harm whose orders are worded differently (duplicate concepts the script's exact match misses);
  - an Action left ungraded (WARN `… it is not graded`) that is really a monitor or a therapy step;
  - a Decision whose argument conditions are not real criteria over the Enquiry's data items (a constant such as `true`, or a condition that ignores the eligibility facts), or a candidate that should be recommendable but has only `against` / `excluding` arguments, so it can never satisfy the default `netsupport() > 0` (state a candidate's own criteria as a `for` argument, as `Not_Eligible` does in the example).

## Phase 4b: Coding-only freeze

If this is a **coding-only** run (proposal mode `coding-patch`, or the user asked only to add SNOMED CT / LOINC / RxNorm / OMOP / finding codes), run the script with `--baseline <newest snapshot>`. The freeze is on automatically when the proposal's mode is `coding-patch`; otherwise add `--coding-patch`. Without `--baseline` the run exits 2. The script compares the guideline to the snapshot and reports `codingPatch` FAILs when:

- a task was added, or any task, data item, Decision candidate or argument was removed (removals FAIL even when listed in `cig-excluded`: a coding-only run may not remove anything);
- the metadata (`title`, `desc`, `version`, …) or the guideline-level metaprops changed;
- any task's `kind`, `caption`, `description`, `precondition` or `procedure` changed;
- plan components or scheduling (`after`, cycles, layout) changed;
- Decision candidates, arguments or criteria changed;
- Enquiry sources changed;
- any metaprops key was added, removed or changed other than `ServiceRequest.supportingInfo.findingCodes`, `labCodes`, `conditionCodes`, `medicationCodes` (so any `goal.noun_phrase`, `ServiceRequest.occurrenceTiming` or `source.N` change FAILs);
- any data item changed.

**Reviewer:** confirm the report header says `(coding-patch freeze)` and has a **Coding-only freeze** section whenever the request was coding-only. A coding run reviewed without the freeze is not reviewed.

A coding request that regenerated the file from empty and rewrote captions or the action set is a **FAIL** even if the new codes are well-formed.

## Phase 4c: Baseline regression (iterations)

On every iteration (a new source, a revised proposal), run with `--baseline <newest snapshot>`. The script FAILs every baseline task, data item, `Decision/Candidate` and argument that is missing from the guideline and not named in the proposal's `cig-excluded` block (full `Decision/Candidate` path or short name). It also FAILs every task kept from the baseline whose `goal.verb` changed or vanished (so a flipped `avoid` goal or a lost top-plan `treat` goal FAILs) unless the task is named in `cig-excluded`. A renamed task shows as a missing baseline task plus an action not in the proposal.

**Reviewer:** every `cig-excluded` entry must have an explicit, source-grounded reason in §10 Excluded Candidates; an exclusion without one is a silent drop and a **FAIL**.

## Phase 5: Complete the report

The script wrote `projects/<project_dir>/reviews/cig-monitoring-review-<YYYYMMDD-HHmmss>.md`. This is the concrete artifact a human reads instead of trusting a green check. Do not edit the script's sections. Complete it:

1. Add an **Overall: PASS|FAIL** line directly under the title, with the deterministic count and the judgment FAIL count.
2. Replace the placeholder text under **Judgment phases (reviewer)** with:
   - **Value quality (judgment):** the Phase 2 items the script cannot decide: triggered steps without `performerInstruction`, the disposition of every WARN, and each `monitored_target` with its verdict (names what is monitored? names the traced goal's task? the task's goal matches? in an ADE-only build, matches the approved proposal?).
   - **Case reports:** each case-report action with `monitored_target`, `literature_basis`, sources, explicitly in scope?, and the harm-not-reversibility verdict. Out-of-scope case-report actions are FAILs.
   - **Source fidelity:** applicability and precondition gaps, negative-recommendation contradictions, ignored label monitoring instructions; one line per action with source text, verdict and reason.
   - **Label coverage:** each Boxed Warning and numbered Warnings and Precautions section of each cited label, mapped to a monitoring action or a §10 exclusion; gaps are FAILs.
   - **Scope and structure (judgment):** scope mismatches, differently worded duplicate monitors, ungraded Actions, non-criteria or unrecommendable Decision arguments.
   - **Baseline and coding-only freeze (judgment)** (when applicable): `cig-excluded` entries without a §10 reason; confirmation that a coding-only run ran with the freeze.
3. Add every judgment FAIL to the **Fix list** as `- [ ] <task or element>: <what to change>`, specific enough for the formalizer to act on (task name, metaprops key, expected value or source).

**PASS if and only if** the script exited **0** **and** the judgment phases contain **no FAIL**. Anything else is FAIL.

**Never waive a FAIL.** There is no "keep it because it is well implemented", no "minor", no "human confirmation needed" path to PASS: the guideline conforms to the approved proposal and its sources, or it FAILs. Items listed for human confirmation still carry your verdict.

If anything FAILs, return to Step 6: hand the fix list to the formalizer, which fixes the guideline with the proforma edit tools (a proposal revision for anything that changes approved content). Then **re-run the full gate**: the script again with a new report timestamp, and every judgment phase again from scratch. Never re-check only the fixed items, inherit a previous PASS, or drop a previously reported FAIL from the verdict. Do **not** report the CIG as done while any FAIL remains.

## Related

- `scripts/check_cig.mjs` (the deterministic half of this gate)
- `skills/cig-monitoring/references/MetapropsSyntax.md` (the contract this enforces)
- `skills/cig-monitoring/references/ActionEnactmentGoal.md` (goal side and the opt-in case-report rule)
- `skills/cq-verification/SKILL.md` (the parallel CQ gate)
- `cig/examples/obesity-glp1-monitoring.pf` (a build that PASSes the deterministic half; its WARNs are triggers that prompt a therapy or plan review, not a lab or urgent step)
