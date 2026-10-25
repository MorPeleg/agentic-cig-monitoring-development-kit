---
name: cq-verification
description: Verify every competency question against the PROforma guideline (.pf) itself, by writing one JavaScript query per CQ over the guideline's export_json model and running them with scripts/run_cqs.mjs. No test data, no SPARQL, no hand-made fixtures. Use during Step 7 of every CIG build, and whenever the user asks to test, validate or verify a CIG / guideline / .pf against its CQs, check CQ coverage, or asks "does the guideline answer the competency questions?", e.g. "verify CQs", "run CQ checks", "test the guideline".
---

# CQ Verification Skill

Use this skill during **Step 7 (Automated Review)** to verify that the guideline answers every competency question in the approved proposal. Run it as a **subagent** (`cig-cq-verifier`) so the verification is independent of the build. It reads the guideline; it never edits it.

## The Core Problem This Solves

A common mistake is answering a CQ from data built for the test instead of from the artifact under test. In the OWL era that was SPARQL over hand-crafted test triples: the query succeeded because the test data contained the pattern, whether or not the ontology supported it. The same mistake is available here: a query that returns a hard-coded list, reads the proposal, or runs over a JSON object you typed yourself will "pass" and prove nothing.

A PROforma guideline is already concrete: its tasks, plans, data items, candidates, arguments and metaprops are the answer. So a CQ is answered **from the actual guideline**: `scripts/run_cqs.mjs` runs `proforma export` on the `.pf` and hands every query the resulting model. There is no test-data file and no merge step. A CQ passes only if the guideline, as built, contains the answer.

- **MUST** compute every answer from `g` / `h` (the exported guideline).
- **MUST NOT** hard-code answers, read the proposal or any other file inside a query, or construct a stand-in model.
- The "given" entity of a CQ is a concrete name from the proposal's §6 task table or data items table (e.g. `Prescribe_GLP1`, `Get_Eligibility_Data`), exactly as spelled in the guideline.

## Procedure

### Phase 0: Plan

Read the CQ list from the approved proposal (§2). For each CQ, decide which part of the guideline answers it and what the **correct** answer is according to the proposal:

| CQ | Answered by | Correct answer (for `expect`) |
|----|-------------|------------------------------|
| CQ1: Which data items does the eligibility Enquiry collect? | `sources` of `Get_Eligibility_Data` | includes `BMI`, `weight_related_comorbidity`, `contraindications` |
| CQ7: Which ADEs are monitored, for which patients? | children of `Monitor_Undesired_State`, `applies_when`, `precondition` | ≥4 actions; `Monitor_Hypoglycemia` gated by a precondition |

This prevents two common problems: (1) a query that inspects the wrong part of the guideline, and (2) a query that passes on any non-empty answer, including a wrong one.

### Phase 1: Write all queries

Write every query in **one file**: `projects/<project_dir>/cqs/cq-queries.mjs`. It default-exports an array with one entry per CQ:

```js
export default [
  {
    id: "CQ1",                       // the CQ id as spelled in the proposal
    question: "Which data items does the eligibility Enquiry collect?",
    query: (g, h) => h.task("Get_Eligibility_Data").sources.map((s) => s.data),
    expect: (rows) => ["BMI", "weight_related_comorbidity", "contraindications"].every((d) => rows.includes(d)),
  },
  // ...
];
```

**Write all queries before running any.** This prevents the pattern of writing one, running it, getting distracted, and never finishing the rest. Every CQ in the proposal must have a query.

#### `g`: the guideline model (`proforma-export/1`)

The same JSON the `export_json` tool returns. Every field is always present (`null`, `[]` or `false` when unset).

- `metadata` {`name`, `title`, `desc`, `author`, `version`, …}; `metaprops` (guideline level); `root` (the root plan's name).
- `tasks[]`: `name`, `kind` (`plan` | `action` | `enquiry` | `decision`), `caption`, `description`, `metaprops` {key: value, unescaped; `goal.verb`, `goal.noun_phrase`, `ServiceRequest.*`, `monitored_target`, `applies_when`, `source` / `source.N`, …}, `precondition` (the expression as text), `wait_condition`, `postcondition`, `procedure`, …; for plans `components[]` {`name`, `task`, `after[]` (sibling names it waits for), `optional`, `number_of_cycles`, `cycle_repeat`, …}; for decisions `choice_mode`, `candidates[]` {`name`, `description`, `recommendation`, `priority`, `arguments[]` {`name`, `support` (`for` | `against` | `confirming` | `excluding`), `condition`}}; for enquiries `sources[]` {`data`, `mandatory`}; and `used_by[]` (parent plans), `paths[]` (root-to-task paths), `reachable`.
- `data[]`: `name`, `type`, `caption`, `description`, `unit`, `range[]`, `default_value`, `derivation`, `asked_by[]` (the Enquiries that ask for it), `metaprops`.

#### `h`: the helpers `run_cqs.mjs` provides

| Helper | Returns |
|---|---|
| `h.tasks(kind?)` | all tasks, or the tasks of one `kind` |
| `h.task(name)` | the task with that exact name, or `null` |
| `h.data(name?)` | the data item with that exact name (or `null`); with no argument, all data items |
| `h.meta(t, key, all?)` | `t.metaprops[key]` or `null`; with `all = true`, the values of a repeatable key (`key`, `key.1`, `key.2`, …) as an array in number order |
| `h.goal(t)` | `{ verb, noun_phrase }` from `goal.verb` / `goal.noun_phrase` as written (each `null` if absent) |
| `h.monitoringActions()` | actions whose `goal.verb` is `order` (trimmed, case-insensitive, as in `check_cig.mjs`) |
| `h.therapyActions()` | actions whose `goal.verb` is `achieve` or `avoid` (trimmed, case-insensitive) |
| `h.children(plan)` | the tasks run by the plan's components, one level |
| `h.descendants(plan)` | every task below the plan, all levels |
| `h.after(plan, name)` | names of the plan's components that wait for `name` (direct successors only) |
| `h.monitorsOf(taskName)` | monitoring actions whose `monitored_target` contains `taskName` as a whole word |

Task and data item names are matched exactly and case-sensitively. A misspelt name makes `h.task` return `null`; reading a field of it throws, and the CQ FAILs with the error shown.

#### Results and `expect`

- What `query` returns becomes the result rows: an array is the rows; `true` is one row; any other truthy value is one row; `false`, `null`, `undefined`, `0` or `""` is no rows. `query` may be `async`.
- **Without `expect`**, a CQ passes when it returns at least one row. That only proves the guideline has *something* there.
- **With `expect(rows)`**, the CQ passes only when `expect` returns true. Use `expect` to assert the **right answer** from the proposal: the named elements are present, the goal verb is the approved one, a conditional ADE is gated, a count is not below what the proposal approved. Prefer `expect` on every CQ whose answer the proposal fixes; a bare non-empty check is acceptable only for open questions (e.g. "which criteria decide eligibility?").
- The report shows the first three rows: a string as is, an object by its `name`, anything else as JSON. Return `{ name: …, … }` objects for a readable report.

#### Query patterns (from `cig/examples/obesity-glp1-monitoring.pf`)

**Membership of a plan.** Which ADEs are monitored?

```js
{
  id: "CQ7",
  question: "Which adverse drug effects are monitored?",
  query: (g, h) => h.children("Monitor_Undesired_State").filter((t) => t.kind === "action").map((t) => t.name),
  expect: (rows) => ["Monitor_GI_ADE", "Monitor_Pancreatitis", "Monitor_Hypoglycemia"].every((n) => rows.includes(n)),
}
```

Use `h.descendants("Monitoring_Plan")` when the CQ spans nested sub-plans.

**Goal of a task.** What State Achievement goal does resistance exercise have?

```js
{
  id: "CQ3",
  question: "What goal does the resistance-exercise recommendation pursue?",
  query: (g, h) => {
    const goal = h.goal(h.task("Prescribe_Resistance_Exercise"));
    return [{ name: `${goal.verb} ${goal.noun_phrase}`, ...goal }];
  },
  expect: (rows) => rows[0]?.verb === "avoid" && /lean-mass/.test(rows[0].noun_phrase),
}
```

**Monitors tracing to a therapy action.** Which monitors serve the GLP-1 prescription, in each category?

```js
{
  id: "CQ4",
  question: "Which monitoring actions trace to the GLP-1 prescription?",
  query: (g, h) => h.monitorsOf("Prescribe_GLP1").map((m) => ({ name: m.name, category: h.meta(m, "category") })),
  expect: (rows) => ["action_completion", "desired_outcome", "undesired_ade"].every((c) => rows.some((r) => r.category === c)),
}
```

**Data items asked by an Enquiry.** Which eligibility facts are collected, with which types?

```js
{
  id: "CQ1",
  question: "Which data items does the eligibility Enquiry collect?",
  query: (g, h) =>
    h.task("Get_Eligibility_Data").sources.map((s) => ({ name: s.data, type: h.data(s.data)?.type, unit: h.data(s.data)?.unit })),
  expect: (rows) => rows.some((r) => r.name === "BMI" && r.type === "real"),
}
```

**Actions gated by a precondition.** Which monitors apply only to a sub-population, and is the gating fact actually asked?

```js
{
  id: "CQ8",
  question: "Which monitoring actions are gated by a precondition, and on which Enquiry data?",
  query: (g, h) =>
    h.monitoringActions().filter((t) => t.precondition).map((t) => ({
      name: t.name,
      precondition: t.precondition,
      data: (t.precondition.match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).map((n) => h.data(n)).filter(Boolean),
    })),
  expect: (rows) =>
    rows.some((r) => r.name === "Monitor_Hypoglycemia" &&
      r.data.some((d) => d.name === "on_insulin_or_secretagogue" && d.asked_by.includes("Get_Eligibility_Data"))),
}
```

Sequencing questions use `h.after`: `h.after("Obesity_GLP1_Plan", "Eligibility_Decision")` returns `["Obesity_Therapy"]`. Decision criteria are in `h.task("Eligibility_Decision").candidates[].arguments[].condition`. The full worked set is `cig/examples/obesity-glp1-monitoring.cqs.mjs`.

### Phase 2: Run

```
node scripts/run_cqs.mjs projects/<project_dir>/guideline/<name>.pf \
  projects/<project_dir>/cqs/cq-queries.mjs \
  --proposal projects/<project_dir>/plans/PROPOSAL-<ts>.md \
  --report projects/<project_dir>/reviews/cq-verification-<YYYYMMDD-HHmmss>.md
```

- **Always** pass `--proposal`. The script collects every CQ id written in the proposal (`CQ<n>` or `CQ-<n>`, anywhere in the text) and FAILs each one that has no query (`in the proposal but has no query`). Ids are compared by number, ignoring case, a hyphen and leading zeros: `CQ1`, `CQ-1`, `CQ01` and `cq1` are the same CQ. Prefer the proposal's spelling for every `id` so the report reads like the proposal.
- Exit code: **0** = every CQ passes and none is missing; **1** = a CQ fails or is missing; **2** = usage or input error (an option without its value, guideline does not export, queries file does not load or does not default-export an array). Exit 2 is not a PASS.
- The script prints `PASS|FAIL <id> (<n> row(s)): <sample>` per CQ and writes the report: the verdict, `n/m CQs pass`, and a table `CQ | Question | Result | Rows | Sample / error` with one row per query plus one row per missing CQ.

**What results mean:**

- **PASS**: the query ran and `expect` held (or, without `expect`, it returned at least one row). The guideline answers this CQ.
- **FAIL, 0 rows or `expect` false**: either the query looks in the wrong place, or the guideline lacks the content. Investigate which.
- **FAIL with an error**: the query threw (typically a misspelt name, so `h.task` returned `null`, or a field read on a missing value). Fix the query, or the guideline if the named element is genuinely missing.
- **FAIL, no query written**: write it.

**When something fails:**

- Find the root cause first: compare the query with the guideline (`export_json`, `get_component`, `outline`).
- If the **query** is wrong (wrong name, wrong key, wrong plan), fix the query and re-run the whole file.
- If the **guideline lacks the content** the CQ asks for (a task, a data item, a metaprops key, a precondition, a goal that the approved proposal specifies), that is a guideline gap: **return to Step 6** and have the formalizer add it per the proposal. Never loosen `expect`, drop a CQ, or rewrite a query to accept the gap.
- If the approved proposal itself does not model what the CQ asks, report it as a proposal gap; do not invent content to make the CQ pass.
- After any fix, re-run **all** queries with a new report timestamp. Never carry over a previous PASS.

### Phase 3: Report

The script's report is the deliverable: every CQ appears in its table, including missing ones. Below the table, add a **Notes** section with one line per failing CQ: the root cause (query, guideline gap, proposal gap) and the fix. Report the CQ gate as **PASS only if the script exited 0**. Keep `cqs/cq-queries.mjs` as a project deliverable; it is re-run on every review.

## Common Pitfalls

### Answering from anything but the guideline

A query that returns literals, reads the proposal, or filters a list you typed passes trivially. Every row must come from `g` or `h`.

### Non-empty is not correct

`h.monitorsOf("Prescribe_GLP1")` returns rows as long as *one* monitor names the task. If the CQ asks for all three categories, or for a specific gated action, say so in `expect`.

### Repeatable and escaped metaprops

Repeatable keys are numbered (`source.1`, `source.2`); read them with `h.meta(t, "source", true)`. Values come back unescaped (`=` and `:`, not `\=` / `\:`), so match plain text.

### Component name versus task name

Plan components point to tasks through `component.task`. `h.children` and `h.descendants` resolve that for you; when walking `components` by hand, look up `c.task`, not `c.name`.
