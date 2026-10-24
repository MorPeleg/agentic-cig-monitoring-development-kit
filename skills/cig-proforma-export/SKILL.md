---
name: cig-proforma-export
description: >-
  Export a PROforma CIG ontology (an ABox built on cig/proforma.owl, e.g.
  projects/<project_dir>/ontology/*.owl or cig/examples/*.owl) to an
  executable PROforma 1.9 guideline file (.pf), then validate it with the
  proforma CLI/MCP (Composer-equivalent lint and expression type checking) and
  render it as a Mermaid flowchart. Use this skill whenever the user asks to
  export, compile, run, lint, validate or diagram a CIG as PROforma, wants a
  .pf / Deontics Composer / Arezzo file, asks "is this CIG executable?", or
  wants a flowchart of the plan. Also use it after a Step 7 gate PASS when the
  user asks for an executable artifact, and to check that the
  PROforma_Condition strings (preconditions, decision arguments) are real
  expressions over the Enquiry's data items.
---

# CIG → PROforma export

The kit models a CIG as an OWL ABox of PROforma individuals (`pf:Plan`,
`pf:Action`, `pf:Component`, `pf:Goal`, ...). The PROforma language itself is a
text format (`.pf`) that guideline engines and Deontics Composer execute. This
skill turns the first into the second, deterministically, and uses the
**`proforma`** CLI/MCP server (npm: `proforma-mcp`) to check that the result is
a valid, type-correct guideline.

**The OWL stays the source of truth.** The `.pf` file is a derived artifact,
like a build output: never hand-edit it and never edit the OWL by hand to suit
it. When the export finds a problem, fix it in the ontology (through the
ontology-editor tools, and through a proposal revision when it changes
approved content), then export again.

## When it runs in the workflow

- **On request, at any time** for a quick look at an existing ontology (export,
  lint and diagram are read-only on the OWL).
- **As an optional Step 8** of a CIG monitoring build, after the Step 7 gate has
  PASSed. Export does not replace or weaken the Step 7 gate.

## Procedure

1. **Locate the ontology.** Normally `projects/<project_dir>/ontology/<name>.owl`.
   OWL functional syntax (what the owl MCP server writes) and RDF/XML are both
   read.

2. **Export, format and lint in one go:**

   ```bash
   node skills/cig-proforma-export/scripts/owl2pf.mjs projects/<project_dir>/ontology/<name>.owl \
     --out projects/<project_dir>/proforma/<name>.pf \
     --mermaid projects/<project_dir>/proforma/<name>.mmd \
     --report projects/<project_dir>/proforma/<name>.export.json
   ```

   The script finds the `proforma` CLI automatically (a global
   `npm install -g proforma-mcp`, a `proforma` binary on PATH, or a private
   install of the pinned version under `~/.cache/proforma-mcp`). Set
   `PROFORMA_BIN` to use a specific binary. Exit codes: `0` lint clean,
   `1` lint errors, `2` export failed (bad input, plan cycle, no root plan).
   With several plan roots, the largest plan is exported with a warning;
   pass `--root <PlanName>` to pick another.

3. **Read the summary it prints** and act on each section:

   | Section | Meaning | What to do |
   |---|---|---|
   | `needs formalization` | A `PROforma_Condition` (precondition, argument, terminate/abort, postcondition, derivation) is free text, or refers to a name that is not a data item, task or candidate. It was **not** written as an expression; its text is kept in the task's metaprops as `owl.<slot>`. | Report each to the user. The usual fix is to rewrite the condition's `string_representation` as a PROforma expression over Enquiry data items (adding the missing `pf:Data` + `pf:Source` when the proposal allows it). Never invent clinical thresholds. |
   | `kept as text` | A free-text `recommendation` (e.g. "start GLP-1 therapy"). PROforma's default recommendation `netsupport() > 0` applies. | Usually nothing. Mention it if the user expects a custom rule. |
   | `compared against bare words` | An expression compares a data item with an atom such as `none`. It is valid PROforma, but the atom must be a value the data item can take. | Check it against the Enquiry/data item description. |
   | `warnings` | Structure the export had to skip: components without `taskref`, schedule constraints that point outside the plan, tasks not reachable from the root plan, duplicate single-valued properties. | These are ontology defects. Report them; they usually also deserve a Step 7 FAIL. |
   | `lint` | Composer-equivalent findings on the `.pf` (codes `PF-*`, see `references/mapping.md`). | Errors must be fixed at the source. Warnings are reported. |

4. **Validate expressions you plan to write back to the OWL** with the
   `check_expression` tool (or `proforma check-expression --file <pf> --expression "<expr>"`)
   before proposing them: the tool reports what every name resolves to and the
   expression's type.

5. **Show the result.** Use the Mermaid file (or the `to_mermaid` tool, with
   `mode: drilldown` for one plan level at a time) to show the plan structure,
   and `outline` for a text tree with scheduling and candidates. Tell the user
   where the `.pf`, `.mmd` and report files are, how many expressions were
   exported, and list everything under `needs formalization`.

6. **Re-export after every ontology change.** The export is deterministic: the
   same OWL always gives the same `.pf`, so diffs of the `.pf` show exactly what
   changed in the executable guideline.

## Writing conditions that export

`PROforma_Condition` strings become executable when they are PROforma
expressions over names the guideline defines:

- Data items are referenced by their `pf:name` (e.g. `BMI`,
  `weight_related_comorbidity`), tasks by name, decision results with
  `result_of(Decision) = Candidate` (single choice) or
  `result_set(Decision) includes Candidate` (multiple choice).
- `AND`/`OR`, `&&`/`||`, `==` and `!=` are translated to `and`/`or`/`=`/`<>`.
  Negation is the function `not(x)`; `NOT x` is not valid PROforma.
- Comparisons with numbers make the data item `real`, comparisons with
  `true`/`false` make it `boolean`; everything else is `text`.
- A sentence such as `concomitant insulin or insulin secretagogue therapy = true`
  cannot run. Its executable form needs a data item, e.g.
  `on_insulin_or_secretagogue = true`, sourced by the Enquiry.

The full OWL → PROforma mapping (what each class and property becomes, what is
kept in metaprops, and what is dropped) is in
[`references/mapping.md`](references/mapping.md). Read it when a user asks how a
specific element is represented, or when the export output surprises you.

## Tools

The `proforma` MCP server (`capabilities.yaml`, server id `proforma`) exposes the
CLI as tools. The ones this skill uses:

| Tool | Use |
|---|---|
| `lint` | Re-check a `.pf` (the script already lints once) |
| `check_expression` | Type-check a condition before proposing it for the OWL |
| `to_mermaid` | Diagram a plan (`plan`, `mode: drilldown`, `candidates: true`) |
| `outline` / `get_component` / `plan_graph` / `find_references` / `search` | Inspect the exported guideline |
| `proforma_reference` | PROforma language reference (syntax, semantics, built-in functions) |

Every tool is also a CLI subcommand (`proforma lint --file x.pf`,
`proforma mermaid --file x.pf --mode drilldown`, ...); `npx -y proforma-mcp --help`
lists them.
