# Reference: ontology coding (Deontics Composer)

How a PROforma guideline records the clinical concept of a task, data item or candidate so that Deontics Composer shows it in its **Ontology** field. The contract below was read from Composer's own classes (the ontologies module, its BioPortal provider and the PROforma connector of the installed Composer) and from guidelines Composer itself saved. A value in any other form is kept in the file but Composer shows an **empty** Ontology field.

The `ontology.coding` line in the `.pf` is what Composer **writes** when it saves a guideline. Composer **reads** each term from the `.deo` file of a Composer project, not from the `.pf`: open a kit guideline in Composer through the project that `scripts/export_composer_project.mjs` builds (see [Opening a guideline in Composer](#opening-a-guideline-in-composer)). A standalone `.pf` opens without its codes.

## The contract

**Key.** The metaprop `ontology.coding`. Composer's metaproperties editor hides this key and shows its value in the element's **Ontology coding** field instead; every other metaprop stays visible in the metaproperties editor.

**Value.** Composer's "Deontics code":

```
<prefix>:<code> [<caption>]
```

- `<prefix>` is exactly three characters naming the terminology provider (table below);
- `<code>` is the concept's code, with no spaces;
- `<caption>` is the concept's term, in square brackets after one space. **The caption is required**: Composer only reads a value that has a `:` at position 3 and a bracketed caption after it, and splits the value into prefix (characters 0-2), code (up to the first ` [`) and caption (the rest, without its outer brackets). A caption that itself contains brackets is fine, e.g. `[Hemoglobin [Mass/volume] in Blood]`.

There is no separate label key: the term is the caption inside the value. The kit's earlier `ontology.label` key is not read by Composer and is no longer written.

**Providers** (Composer's BioPortal module):

| Prefix | Terminology | HL7 code system OID | BioPortal acronym |
|---|---|---|---|
| `SCT` | SNOMED CT | 2.16.840.1.113883.6.96 | SNOMEDCT |
| `LNC` | LOINC | 2.16.840.1.113883.6.1 | LOINC |
| `IC0` | ICD-10-CM | | ICD10CM |
| `IC9` | ICD-9-CM | | ICD9CM |

Composer has **no RxNorm provider** (see RxNorm below).

**Examples.**

```
ontology.coding=SCT:271807003 [Eruption of skin (disorder)]
ontology.coding=LNC:718-7 [Hemoglobin [Mass/volume] in Blood]
```

## Where each element carries it

| Element | Where `ontology.coding` goes | Selector for `set_attribute(attribute: "metaprops")` |
|---|---|---|
| Data item | the data item's own metaprops | `<data item>` |
| Decision candidate | the candidate's own metaprops | `<decision>/candidate:<candidate>` |
| Decision argument | the argument's own metaprops (rarely coded) | `<decision>/candidate:<candidate>/argument:<argument_name>` |
| Task (plan, action, enquiry, decision) | the **component** that places the task in its parent plan, not the task definition | `<parent plan>/component:<task>` |
| Root plan | nowhere: it has no parent plan, so it has no component. Leave it uncoded | |

A task's Ontology field in Composer belongs to the task's component (the task instance in the plan). Coding written on the task definition (`action :: 'X' ; metaprops :: 'ontology.coding=...'`) is not shown. A component's metaprops sit with its other component attributes; they may already hold keys Composer writes itself (for example `ae.private.component.id`), so add `ontology.coding` to the existing component metaprops rather than replacing them.

## In the `.pf` text

The metaprops string is Java-properties text inside a PROforma single-quoted atom, so `:` and `=` in a value are escaped (`\\:` in the file). Write the plain value with `set_attribute`; the tools escape it on save and `export_json` shows it unescaped.

A data item:

```
data  :: 'skin_rash' ;
     type :: text ;
     caption :: 'New skin rash or eruption?' ;
     metaprops :: 'ontology.coding=SCT\\:271807003 [Eruption of skin (disorder)]
' ;
     range ::"yes||yes","no||no";
     default_value :: "no" ;
end data.
```

A task, coded on its component in the parent plan:

```
plan  :: 'Monitor_Undesired_State' ;
     ...
     component :: 'Order_Hemoglobin' ;
          metaprops :: 'ontology.coding=LNC\\:718-7 [Hemoglobin [Mass/volume] in Blood]
' ;
          task_definition :: 'Order_Hemoglobin' ;
          schedule_constraint :: completed('Monitor_Bleeding') ;
```

A test candidate of a test-ordering Decision:

```
     candidate :: 'Hemoglobin' ;
          caption :: 'Hemoglobin' ;
          metaprops :: 'ontology.coding=LNC\\:718-7 [Hemoglobin [Mass/volume] in Blood]
' ;
```

## Tool calls

Every call also takes `file`. Set the whole metaprops of the element: for a data item or candidate that already carries `source` and `quote`, include them in the same value (one metaprops per element, set in one call).

```
snomed_search(query: "eruption of skin")
set_attribute(selector: "skin_rash", attribute: "metaprops",
              value: "ontology.coding=SCT:271807003 [Eruption of skin (disorder)]\nsource=...\nquote=...")

loinc_search(query: "hemoglobin blood")
set_attribute(selector: "Monitor_Undesired_State/component:Order_Hemoglobin", attribute: "metaprops",
              value: "ontology.coding=LNC:718-7 [Hemoglobin [Mass/volume] in Blood]")
set_attribute(selector: "Tests_Ordering_Recommendations_Bleeding/candidate:Hemoglobin", attribute: "metaprops",
              value: "ontology.coding=LNC:718-7 [Hemoglobin [Mass/volume] in Blood]")
```

Read the component first (`get_component(selector: "<plan>/component:<task>")` or `export_json`, which lists each plan's components with their metaprops) and keep any key it already holds.

## Finding the code

The kit looks codes up with keyless public services, so no account is needed:

- `snomed_search`: SNOMED CT through the EBI OLS4 API (restricted to the SNOMED ontology). Record the concept id and the preferred term exactly as returned: `SCT:<id> [<term>]`, e.g. the term `Bleeding (finding)` with its semantic tag.
- `loinc_search`: LOINC through the NLM Clinical Tables API. Record `LNC:<LOINC_NUM> [<LONG_COMMON_NAME>]`.
- `rxnorm_search`: RxNorm through the NLM RxNav API (for `rxnorm.coding`, below).

Composer's own Ontology field can also search: its BioPortal provider looks terms up in the NCBO BioPortal with a BioPortal API key the user enters in Composer. It writes the same `<prefix>:<code> [<caption>]` value. That is an alternative for an author working in Composer; the kit does not need the key.

## RxNorm

Composer has no RxNorm provider, so an RxNorm code cannot be the Ontology field's value. The kit records the drug of a therapy action as a separate, plain metaprop on the task definition:

```
rxnorm.coding=RXNORM:32968
rxnorm.label=clopidogrel
```

Composer shows these as ordinary metaproperties in the metaproperties editor (not in the Ontology field). The therapy action's component still carries the SNOMED CT concept of the substance or procedure in `ontology.coding`.

## Choosing a concept

- **One concept per element.** Code what the element records or delivers: a monitoring task's monitored condition or measurement, a therapy action's substance or procedure, a data item's observable or finding, an ordered test's LOINC term. Do not put two codes in one value.
- **Near matches.** When no concept fits exactly, take the closest broader concept and say in the element's description what it records instead (e.g. a data item for the indication for anticoagulation coded with "Long-term current use of anticoagulant (situation)"). When nothing fits, leave the element uncoded and say why; never invent a code or a caption.
- **Structural elements** (e.g. `Eligible` / `Not_Eligible` candidates, a plan that only groups tasks) stay uncoded rather than forcing a poor match.
- **Findings and tests.** In the ADE Enquiry pattern (`skills/cig-monitoring/references/ADEMonitoringEnquiry.md`), the findings an ADE Enquiry asks for are SNOMED CT (`SCT`) and the tests its test step orders are LOINC (`LNC`).

## Opening a guideline in Composer

Composer keeps an element's term in its Alium model, which it loads from the project's `.deo` file; on load it rewrites each element's `ontology.coding` from that term and **removes** the key when it holds no term. So:

- **Open individual PROforma file** never reads a `.deo`: every code in the `.pf` is dropped on load.
- A **project** keeps them: `<project>/project.metadata`, `<project>/proforma/<Name>.pf` and `<project>/proforma/<Name>.deo` (same basename). The `.pf` and the `.deo` are linked by the metaprop `ae.private.component.id=<id>` on every component, candidate, argument, data item and enquiry source (a source carries its data item's id). The `.deo` entry of each coded element holds the term in five keys: `ontology_coding_name`, `ontology_coding_code`, `ontology_coding_system` (SNOMED CT `2.16.840.1.113883.6.96`, LOINC `2.16.840.1.113883.6.1.` with Composer's trailing dot, ICD-10-CM `2.16.840.1.113883.6.90`, ICD-9-CM `2.16.840.1.113883.6.42`), `ontology_system_prefix` (`SCT`/`LNC`/`IC0`/`IC9`) and `ontology_coding_caption`.
- Composer maps each component to its `.deo` task by id and also requires the same name, type and **caption**; the caption it compares and shows is the **component's**, not the task definition's. One mismatch makes Composer rebuild the whole task model, and every task loses its term.

Build the project with:

```bash
node scripts/export_composer_project.mjs projects/<project_dir>/guideline/<name>.pf projects/<project_dir>/composer-project --name <name> [--display-name "..."] [--force]
```

It copies the guideline to `proforma/<name>.pf` (the source `.pf` is not changed) and, through the proforma CLI, adds the ids and gives each component its task's caption and description, then writes the `.deo` from that copy (one task per component, one claim per candidate, one rule per argument, one data entry per data item, with the term keys from each `ontology.coding`) and `project.metadata`. Ids already in the `.pf`, or in an earlier export at the same path, are reused, so re-exporting with `--force` gives the same files. Open the output folder in Composer as a project. Edit the kit's guideline, not the exported copy, and re-export.

## Checking

`scripts/check_cig.mjs` fails a value that is not in Composer's form (including the kit's older `SNOMED:<id>` / `LOINC:<code>` with a separate `ontology.label`) and an `ontology.coding` on a task definition, and warns when `ontology.label` is still present. Convert an older guideline with `node scripts/migrate_metaprops.mjs <guideline.pf>`: it rewrites every coding as `<prefix>:<code> [<label>]`, removes `ontology.label` and moves each task's coding from its definition to its component(s). In a CQ query, `h.coding(taskOrElement)` returns `{system, code, caption}` (reading a task's coding from its component).

## Related

- `TaskProperties.md` (the Ontology coding property of every task kind), `Data.md` (data items), `Decision.md` (candidates).
- `skills/cig-monitoring/references/MetapropsSyntax.md` (the coding pass of monitoring and therapy actions).
