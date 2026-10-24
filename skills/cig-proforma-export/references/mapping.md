# OWL → PROforma mapping

How `scripts/owl2pf.mjs` turns a PROforma ABox (individuals of `cig/proforma.owl`,
prefix `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`) into a
PROforma 1.9 `.pf` file.

## Names

* Each task, data item, candidate and argument is named by its `pf:name`, when that is a
  valid PROforma identifier (`[A-Za-z_][A-Za-z0-9_]*`). Otherwise the IRI local name is
  used, with invalid characters replaced by `_`.
* PROforma names are case-insensitive. Clashes get a `_2`, `_3`, … suffix and a warning.
* A component takes the name of the task it runs (`pf:taskref`). This is Composer's
  convention, and the names that conditions such as `result_of(Eligibility_Decision)`
  refer to. Component IRIs are not kept.
* Every exported element carries its full IRI in metaprops as `owl.iri`, so the
  `.pf` can be traced back to the ontology.

## Structure

| OWL | PROforma |
|---|---|
| the `pf:Plan` that no `pf:Component` refers to | root plan (first block). Several roots → the largest is exported, with a warning (`--root` overrides). |
| `pf:Plan` / `pf:Action` / `pf:Enquiry` / `pf:Decision` | `plan` / `action` / `enquiry` / `decision` block. Tasks not reachable from the root are not exported (warning). |
| `pf:components` → `pf:Component` → `pf:taskref` | `component :: 'task'; task_definition :: 'task';` |
| `pf:scheduled_constraints` → `pf:Schedule_Constraint` → `pf:conref` T | `schedule_constraint :: completed('T');` when T is run by a sibling component (otherwise a warning) |
| `pf:number_of_cycles` (Component) | `number_of_cycles :: n;` |
| (no layout in OWL) | `ltwh`: rows by scheduling depth, columns by order, so the plan opens readably in Composer |
| `pf:caption`, `pf:description` | `caption`, `description` |
| `pf:metaprops` (kit grammar `key=value; key=value`) | metaprops, one `key=value` per line (Java properties, as Composer stores them). A repeated key (`source`) becomes `source.1`, `source.2`, …. Composer sorts the keys, so the kit's key order is not preserved; the OWL keeps it. |
| `pf:goal` → `pf:Goal` (`verb`, `noun_phrase`, `caption`, `evidence_grade`, `ID`, `parent`) | metaprops `goal.verb`, `goal.noun_phrase`, … and `goal.iri`. A PROforma `goal ::` is an expression, but OWL goals are free text, so they are kept as metadata. |
| `pf:trigger`, `pf:cycle` (Task) | metaprops `owl.trigger`, `owl.cycle` |
| `pf:precondition` → `pf:PROforma_Condition` | `precondition :: <expr>;` when the condition type-checks (see below) |
| `pf:postcondition` → `pf:PROforma_Data_Assignment` | `postcondition :: <assertion>;` when it type-checks |
| `pf:terminate`, `pf:ObjectProperty_28` (abort) on a Plan | `terminate ::` / `abort ::` when they type-check |
| Enquiry `pf:sources` → `pf:Source` → `pf:sref` Data | `source :: 'data'; data_definition :: 'data';` |
| Decision `pf:choice_mode`, `pf:support_mode` | `choice_mode :: single\|multiple;`, `support_mode :: symbolic\|numeric;` |
| `pf:candidates` → `pf:Candidate` | `candidate :: 'name';` with caption/description/metaprops, and `priority` when it is an integer |
| `pf:arguments` → `pf:Argument` (`pf:support`, `pf:proforma_condition`) | `argument :: for\|against\|confirming\|excluding\|<weight>, <expr> attributes argument_name :: '…'; end attributes;` |
| `pf:recommendation` | `recommendation :: <expr>;` when it type-checks, otherwise Composer's default `netsupport() > 0` (the text is kept as `owl.recommendation`) |
| `pf:Data` | `data` block: `type`, caption, description, metaprops, `unit`, `default_value` (`pf:defaulty_value`), `derivation` (`pf:derivation` → `pf:PROforma_Expression`) |
| `pf:Metadata` (`title`, `author`, `version`, `desc`, `cdate`, `mdate`), or the ontology's `rdfs:label` / `rdfs:comment` / version IRI | `metadata` block |
| ontology IRI / version IRI | root plan metaprops `owl.ontology`, `owl.versionIRI` |

Not exported: `pf:parameters` / `pf:param_values`, `pf:ltwh` (an int in the OWL model, not
four coordinates), Source `pf:collection` / `pf:dymanic`, and individuals of classes the
mapping does not use.

## Data item types

Inferred from how the conditions use each data item (the OWL model has no data type):

1. compared with a number (`BMI >= 30`), or with a numeric `pf:defaulty_value` → `real`
2. compared with `true` / `false` → `boolean`
3. otherwise → `text`

## Conditions

A `pf:string_representation` is translated (`AND`/`OR` → `and`/`or`, `&&`/`||`,
`==` → `=`, `!=` → `<>`, `NOT(` → `not(`). It is written as a PROforma expression only when
`proforma check-expression` accepts it against the exported guideline with:

* no syntax error, and no verifier error or warning;
* type `truth_value` (conditions) or any type (derivations);
* every bare word that is not a data item, task or candidate appearing only as the
  right-hand side of a comparison (`contraindications = none`). A bare word anywhere
  else is almost always an undeclared data item. PROforma would read it as a text
  literal and the condition would silently never fire, so it is rejected.

Rejected conditions are listed under `needs_formalization` in the report. Their text is
kept in the owner's metaprops (`owl.precondition`, `owl.argument.<name>`, …).

## Lint codes

| Prefix | Meaning |
|---|---|
| `PF-L` | syntax errors (Composer refuses to load the file) |
| `PF-K` | Composer layout problems (`format` fixes them; the export always formats) |
| `PF-C`, `PF-R`, `PF-PP`, `PF-G` | load-time checks: duplicates, unresolved references, data model, orphans |
| `PF-V` | verifier: typing and decision rules (the engine's own messages) |
| `PF-X` | extra checks: scheduling cycles, recursive plans, unknown candidates/tasks, unchecked expressions |
