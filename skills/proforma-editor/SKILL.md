---
name: proforma-editor
description: Read, edit, validate and diagram PROforma 1.9 guideline files (.pf, Deontics Composer format) with the proforma MCP tools (outline, get_component, export_json, lint, check_expression, to_mermaid, create_guideline, add_task, add_data_item, add_source, add_candidate, add_argument, set_attribute, set_metadata, format, ...). Use whenever you read, inspect, query, create, edit, validate, lint, type-check an expression in, or diagram a .pf file or a PROforma CIG — e.g. "add this monitoring action", "set the metaprops", "add a data item / source / candidate / argument", "is this precondition executable", "lint the guideline", "export the guideline JSON", "draw the plan". Never edit a .pf file by hand; every change goes through these tools.
---

# PROforma Editor Skill

Use this skill whenever you need to **inspect or modify a PROforma guideline
file (`.pf`)** in this kit — the CIG at
`projects/<project_dir>/guideline/<name>.pf`, the worked example
`cig/examples/obesity-glp1-monitoring.pf`, or a scratch copy. The tools are
provided by the **proforma** MCP server (npm `proforma-mcp`, pinned
`proforma-mcp@0.2.0`) and operate on the file on disk, which is the source of
truth.

## The never-hand-edit rule

- **Edit a `.pf` only through these tools.** No Write/Edit/sed/heredoc on a
  `.pf`, not even "a one-line fix". Every edit tool parses the file, applies
  the change, re-parses the result, **refuses to save a broken file**, writes
  Composer's canonical layout, and reports the lint counts
  (`saved … (0 lint error(s), N warning(s))`).
- If a call fails, read the error (it names the problem: unknown selector,
  name clash, bad expression, missing sibling), fix the arguments and retry.
  Never fall back to writing the file manually; report the error instead.
- Run `lint` after a batch of edits and read every warning; `0 errors` is the
  minimum, not the goal.

## How the server works

- **capa:** after reading this skill, call `setup_tools(skills: ["proforma-editor"])`,
  then invoke a tool with `call_tool(name: "pf_<tool>", data: {...})`, e.g.
  `call_tool(name: "pf_lint", data: {file: "C:/.../guideline/glp1.pf"})`.
  The capa ids are `pf_` + the tool name below, except the language
  reference, whose id is `pf_reference`.
- **File path:** every tool except `proforma_reference` takes `file` — pass an
  **absolute** path.
- **CLI equivalent** (scripts, quick checks):
  `npx -y proforma-mcp@0.2.0 <subcommand> --file <path> ...` (`lint`,
  `export`, `mermaid`, `check-expression`, `outline`, `get`, `create`,
  `add-task`, `add-data`, `add-source`, `add-candidate`, `add-argument`, `set`,
  `unset`, `upsert`, `set-metadata`, `format`, …; `--help` on each). Parameter
  names are the same with `-` for `_`. The kit's `scripts/check_cig.mjs` and
  `scripts/run_cqs.mjs` call it for you (`PROFORMA_BIN` overrides the binary).

## Tools overview

### Read / inspect

| Tool | Purpose | Key parameters |
|------|---------|----------------|
| **proforma_reference** | Language reference: syntax, task attributes, decisions, data, expressions, built-in functions, editing conventions. Read before writing any PROforma text or expression. | `section` (optional: overview, syntax, tasks, decisions, data, expressions, functions, editing) |
| **outline** | Metadata, task tree from the root plan (with `after` constraints, sources, candidates), data items, functions. Start here. | `file` |
| **list_components** | Top-level components with kind, caption, type. | `file`, `kind` (optional), `filter` (optional substring) |
| **get_component** | One component or nested element as PROforma text or JSON. In JSON, `metaprops` is the raw properties text (escapes included). | `file`, `selector`, `format` (`pf` default, `json`) |
| **find_references** | Every reference to a name: plan components, schedule constraints, sources, expressions. Use before removing or renaming. | `file`, `name` |
| **plan_graph** | A plan's components with kind, caption, layout and scheduling dependencies. | `file`, `plan` (optional; root by default) |
| **search** | Case-insensitive substring search over names, captions, descriptions and expressions. | `file`, `query`, `limit` |
| **export_json** | The whole guideline as JSON (`proforma-export/1`): tasks with **parsed** `metaprops` maps, components, candidates, arguments, sources, data items, `reachable`, `asked_by`. Use it to read metaprops maps and to verify a build. | `file`, `output` (optional path to write) |

### Validate / diagram

| Tool | Purpose | Key parameters |
|------|---------|----------------|
| **lint** | Composer-equivalent validation plus extras. Codes: PF-L syntax, PF-K layout, PF-C/R/PP/G load checks, PF-V verifier/type checks, PF-X extras. Errors block; warnings must be read. | `file`, `include_info` (default false), `format` (`text`/`json`) |
| **check_expression** | Parse and type-check an expression against the file: inferred type, and what each name resolves to (`data (real)`, `decision`, `text literal`, …). Run it before writing any precondition or argument condition. | `expression`, `file`, `assertion` (for postcondition syntax) |
| **to_mermaid** | Mermaid flowchart of a plan (nested sub-plans, scheduling arrows, decision branches). | `file`, `plan`, `mode` (`expanded`/`drilldown`), `direction`, `label`, `candidates`, `data`, `depth`, `output` (`.mmd` or `.md`) |

### Edit (each call re-parses, refuses a broken result, reports lint counts)

| Tool | Purpose | Key parameters |
|------|---------|----------------|
| **create_guideline** | New valid 1.9 file with metadata and an empty root plan. Refuses an existing file unless `overwrite`. | `file`, `name` (root plan), `title`, `author`, `overwrite` |
| **set_metadata** | Metadata fields. | `file`, `title`, `desc`, `author`, `version`, `cdate`, `mdate` |
| **add_task** | Create a task **and** its component in a plan, optionally sequenced and gated. The normal way to add any task. | `file`, `plan`, `kind` (`plan`/`action`/`enquiry`/`decision`/`task`), `name`, `caption`, `description`, `after` (array of sibling names), `precondition`, `ltwh` |
| **add_component** | Add a component that reuses an existing task definition. | `file`, `plan`, `task_definition`, `name`, `after`, `pf` |
| **add_data_item** | Add a data item. No `description` parameter: set it with `set_attribute`. | `file`, `name`, `type` (`text`/`integer`/`real`/`boolean`/`date`/`time`/`datetime`/`setof_*`), `caption`, `range`, `default_value`, `derivation`, `unit` |
| **add_source** | Make an enquiry (or decision) ask for a data item; can create the item. | `file`, `task`, `data`, `mandatory` (default true), `create_type` |
| **add_candidate** | Add a decision candidate. | `file`, `decision`, `name`, `caption`, `recommendation` (default `netsupport() > 0`), `priority` |
| **add_argument** | Add an argument to a candidate. | `file`, `decision`, `candidate`, `support` (`for`/`against`/`confirming`/`excluding`, or a weight), `condition`, `name`, `caption` |
| **set_attribute** | Add or **replace** one attribute. Free-text attributes (`caption`, `description`, `metaprops`, `procedure`, `trigger`, `context`) take plain text; others take PROforma text (expressions, `choice_mode` value, `ltwh`). | `file`, `selector`, `attribute`, `value` |
| **add_attributes** | Insert raw PROforma attribute text into a block (nested elements Composer supports that no structured tool covers). | `file`, `selector`, `pf` |
| **remove_attribute** | Remove every attribute with a keyword from a block (e.g. a precondition). | `file`, `selector`, `attribute` |
| **remove_element** | Remove a nested element: plan component (drops sibling constraints on it), candidate, argument, source, warning. | `file`, `selector` |
| **schedule_constraint** | Add or remove `component` starts after `after` completes (same plan; cycles rejected). | `file`, `plan`, `component`, `after`, `remove` |
| **upsert_component** | Add or replace whole top-level blocks written as PROforma text. Last resort — prefer the structured tools. | `file`, `pf` |
| **remove_component** | Remove a top-level task, data item or function; cascades to components, constraints and sources by default and reports remaining expression references. | `file`, `name`, `no_cascade` |
| **rename** | Rename a top-level component and update every reference (or one component instance via `Plan/component:X`). | `file`, `name`, `new_name` |
| **format** | Rewrite in Composer's canonical layout; `check` only reports. | `file`, `check`, `print` |

## Selectors

- A top-level name: `Monitor_Pancreatitis`, `BMI`, `Eligibility_Decision`.
- A plan component: `Monitoring_Plan/component:Monitor_Actions`.
- A candidate / argument: `Eligibility_Decision/candidate:Eligible`,
  `Eligibility_Decision/candidate:Eligible/argument:1` (by `argument_name` or
  1-based index).
- A source: `Get_Eligibility_Data/source:BMI`. A data warning:
  `BMI/warning_condition:1`.
- Task-level attributes (caption, description, procedure, metaprops, precondition) go on the task name,
  not on `Plan/component:X`.

## Typical edits

```
# a monitoring action with a population-scoped precondition, its native fields,
# then its metaprops in one call (contract: skills/cig-monitoring/references/MetapropsSyntax.md)
add_task(file, plan: "Monitor_Undesired_State", kind: "action", name: "Monitor_Hypoglycemia",
         caption: "Monitor for hypoglycemia ...", precondition: "on_insulin_or_secretagogue = true")
set_attribute(file, selector: "Monitor_Hypoglycemia", attribute: "description", value: "Monitors hypoglycemia ...")
set_attribute(file, selector: "Monitor_Hypoglycemia", attribute: "procedure",
              value: "<order.code>, <order.timing>. Patient: ... Clinician: ...")
set_attribute(file, selector: "Monitor_Hypoglycemia", attribute: "metaprops",
              value: "goal.verb=order\ngoal.noun_phrase=<order.code>, <order.timing>\norder.code=...\norder.timing=...\n...\nsource.1=...\nquote.1=§5.4: \"...\"\ncq=CQ7")

# metaprops on a data item or a decision argument (Ontology coding, source + quote)
set_attribute(file, selector: "BMI", attribute: "metaprops",
              value: "ontology.coding=SNOMED:60621009\nontology.label=Body mass index (observable entity)")
set_attribute(file, selector: "Eligibility_Decision/candidate:Eligible/argument:Arg_Eligible", attribute: "metaprops",
              value: "source=...\nquote=...")

# change one metaprops key: read the map, change it, write the whole map back
export_json(file)  ->  tasks[name == "Monitor_X"].metaprops
set_attribute(file, selector: "Monitor_X", attribute: "metaprops", value: "<every key=value line>")

# a typed data item the enquiry asks for
add_data_item(file, name: "on_insulin_or_secretagogue", type: "boolean", caption: "On insulin or an insulin secretagogue?")
set_attribute(file, selector: "on_insulin_or_secretagogue", attribute: "description", value: "...")
add_source(file, task: "Get_Eligibility_Data", data: "on_insulin_or_secretagogue")
```

## PROforma gotchas

- **Reserved keywords must be quoted** where they are used as names in
  expressions: a data item called `unit`, `type`, `range`, `source`, `data`,
  `title`, `version`, `group`, `goal`, `context`, `for`, `end` must be written
  `'unit'`. Better: do not use a keyword as a name.
- **Names are identifiers** (`[A-Za-z_][A-Za-z0-9_]*`) and unique
  **case-insensitively** (`bmi` clashes with `BMI`), but expression references
  are matched by exact spelling: `bmi > 30` against a data item `BMI` is read as
  the text literal `"bmi"` (lint: PF-V034 untypeable, PF-V011). Use the
  declared spelling.
- **An unknown bare word is a text literal**, silently: `result_of(D) = Eligible`,
  `contraindications = none`. That is how candidate names and enumerated values
  are written, but a typo in a data item name also becomes a literal (lint
  reports it only as info PF-X060). Always read the `references` list from
  `check_expression`.
- **Negation is a function:** `not(x)`. `not x` is a syntax error.
- **`and` / `or`** are the connectives (written lower case); not-equal is
  `<>` (`!=` is also accepted). Comparisons do not chain (`a < b < c` is an error).
- **Decision results:** `result_of(D) = C` for a single-choice decision;
  `result_set(D) includes C` for `choice_mode :: multiple`.
- **Boolean data** is typed as text by the verifier: compare with `= true` /
  `= false` (e.g. `weight_related_comorbidity = true`), not `true()` and not a
  bare name.
- **metaprops is Java properties text:** one `key=value` per line, no line
  break inside a value. Repeatable keys are numbered (`source.1`, `source.2`);
  a repeated bare key keeps only the last value. Inside a value, `=` and `:` are
  escaped by the writer (the file shows `\\=` / `\\:` inside the quoted atom);
  the tools and `export_json` read them back unescaped. A literal backslash in a
  value is consumed as an escape — do not use one.
- **Composer's "Ontology coding" field is the metaprop `ontology.coding`**
  (`SCHEME:code`, e.g. `SNOMED:197456007`); Composer hides the key in its
  metaprops editor and shows the term as a field. Add `ontology.label` with
  the preferred term. Find codes with the kit's `snomed_search` tool.
- **Composer (and every tool save) sorts metaprops keys**, so key order is not
  significant; the key set and values are.
- **`set_attribute` replaces** an attribute. For metaprops that means the whole
  map: write every key in one call, never a second metaprops. `get_component`
  JSON gives the raw (escaped) text; `export_json` gives the parsed map — both
  round-trip through `set_attribute` unchanged.
- **Root-plan metaprops** are mirrored into the guideline-level `metaprops`
  block on save; set them on the root plan.
- **Unused task definitions are dropped by Composer** on save, and lint reports
  them as **PF-G004**. A task created with `upsert_component` and never placed
  in a plan is such an orphan. Create tasks with `add_task` (task + component).
- **Comments (`/** ... **/`) are not preserved** by the tools or by Composer.
  Put explanations in captions, descriptions and metadata `desc`.
- **Generic attributes come first** in a block and `type` comes first in a data
  item; the tools handle ordering — another reason not to hand-edit.
- **Lint does not flag an empty plan.** The kit's `scripts/check_cig.mjs` does.
- **Forward references are not errors:** a precondition naming a candidate
  that does not exist yet saves with a warning (PF-X061); one naming a data item
  that does not exist yet saves with only an *info* finding (PF-X060, visible
  with `include_info: true`) because the name is read as a text literal
  (`not_yet_defined = true` is a valid comparison of two strings). Create data
  items and candidates before the expressions that use them, and check with
  `check_expression`.

## Tool Requirements

This skill requires the following tools (proxied from the `proforma` MCP server; capa ids `pf_<tool>`):

- proforma_reference, outline, list_components, get_component, find_references, plan_graph, search, export_json
- lint, check_expression, to_mermaid
- create_guideline, set_metadata, add_task, add_component, add_data_item, add_source, add_candidate, add_argument
- set_attribute, add_attributes, remove_attribute, remove_element, schedule_constraint
- upsert_component, remove_component, rename, format

After learning this skill, call `setup_tools(skills: ["proforma-editor"])` to activate these tools, then use `call_tool(name: "pf_<tool>", data: {...})` to invoke them.
