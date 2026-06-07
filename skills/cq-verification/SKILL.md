---
name: cq-verification
description: Verify competency questions against an OWL ontology using SPARQL queries with test data. Use to verify every CQ with real query execution. Also use whenever the user asks to test, validate, or verify an ontology against its CQs, run SPARQL verification, check CQ coverage, or asks "does the ontology answer the competency questions?"—e.g. "verify CQs", "test the ontology", "run CQ checks", "validate against competency questions".
---

# CQ Verification Skill

Use this skill during **Step 7 (Automated Review)** to verify that the ontology can answer every competency question.

## The Core Problem This Solves

A common mistake is running SPARQL queries against hand-crafted test triples without loading the ontology schema. This only tests whether the test data was constructed correctly — not whether the ontology itself supports the queries. For example, a query like `?x :relatedTo ?y` will succeed against raw triples that contain that pattern, even if the ontology doesn't define `:relatedTo` at all.

To truly verify the ontology, queries must run against a graph that contains **both** the ontology schema (classes, properties, axioms) and the test individuals. The **`sparql_query`** tool (OWL-MCP) does this for you: pass **multiple `owl_file_paths`** and it serializes each file and loads them **together** into one in-memory RDF graph before evaluating the query. Passing the ontology and the test-data file together makes class hierarchies, domains/ranges, and equivalences available to the query engine — no external merge step or Docker is needed.

## Procedure

### Phase 0 — Plan and Create Test Data

Before writing any individuals, read the CQ list from the approved proposal and **plan the test data**. For each CQ, note which classes and properties it exercises, and which individuals and assertions are needed to produce a non-empty result.

A quick planning table helps (you don't need to write this to a file — it's a mental model):

| CQ | Needs individuals of | Needs property assertions |
|----|---------------------|--------------------------|
| CQ01: What items belong to a given category? | :Item, :Category | :belongsTo |
| CQ02: Who created a given item? | :Item, :Person | :createdBy |

This planning step prevents two common problems: (1) creating individuals that no query uses, and (2) missing assertions that leave queries returning empty results.

**Create the test data file** at `projects/<project_dir>/queries/test-data.owl` using the ontology-editor tools:

1. Call `setup_tools(skills: ["cq-verification"])` to activate tools
2. Call `set_ontology_iri` on the test data file with a distinct IRI (e.g. append `/test-data` to the main ontology's namespace)
3. Add the same prefixes as the main ontology using `add_prefix`
4. Add test individuals using `add_axioms` — declarations, class assertions, and property assertions

Example axioms (OWL functional syntax):

```
Declaration(NamedIndividual(:item1))
ClassAssertion(:Item :item1)
DataPropertyAssertion(:hasName :item1 "Example Item")
ObjectPropertyAssertion(:belongsTo :item1 :category1)
```

**Do not add `Import(...)` axioms to this file.** You will pass the ontology and the test-data file together to `sparql_query`, which merges them by local path. Import statements would require a resolvable URL or an XML catalog and are unnecessary here.

Keep the test data **minimal** — only the individuals and assertions needed by the CQs. One or two individuals per class is usually enough.

### Phase 1 — Write All Queries

For every CQ in the approved proposal (section 2), write a SPARQL SELECT query. Save each as `projects/<project_dir>/queries/CQnn.rq` (e.g. `CQ01.rq`, `CQ02.rq`).

Each `.rq` file should:

1. Start with a comment containing the CQ text: `# CQ01: What items belong to a given category?`
2. Declare all necessary prefixes
3. Use a concrete test individual as the "given" entity (e.g. `:category1` from the test data)
4. SELECT the variables that answer the question

**Common query patterns:**

- **Binary relationship** ("Which X belongs to Y?"): straightforward triple pattern

```sparql
# CQ01: What items belong to a given category?
PREFIX : <http://example.org/my-ontology#>
SELECT ?item ?name WHERE {
  ?item :belongsTo :category1 .
  ?item :hasName ?name .
}
```

- **Data property** ("What is the name of X?"): match a literal value

```sparql
# CQ02: What is the name of a given item?
PREFIX : <http://example.org/my-ontology#>
SELECT ?name WHERE {
  :item1 :hasName ?name .
}
```

- **Type/classification** ("What kind of X is this?"): check `rdf:type`

```sparql
# CQ03: What type is a given item?
PREFIX : <http://example.org/my-ontology#>
SELECT ?type WHERE {
  :item1 a ?type .
  FILTER(?type IN (:TypeA, :TypeB))
}
```

- **Schema/hierarchy** ("Which subtypes of X exist?"): uses `rdfs:subClassOf` from the ontology — this is why loading the schema alongside the test data matters

```sparql
# CQ04: Which subtypes of Role exist?
PREFIX : <http://example.org/my-ontology#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?subtype ?label WHERE {
  ?subtype rdfs:subClassOf :Role .
  OPTIONAL { ?subtype rdfs:label ?label }
}
```

**Write all query files before executing any.** This prevents the pattern of writing one, running it, getting distracted, and never finishing the rest.

> **Note on reasoning:** `sparql_query` evaluates over **asserted** triples (no reasoner is applied), the same default as a plain SPARQL engine. Write queries against asserted structure. If a CQ depends on inferred subsumption (e.g. transitive `rdfs:subClassOf` closure), assert the intermediate facts in the test data or use a property path (e.g. `rdfs:subClassOf+`) in the query.

### Phase 2 — Execute Queries

Run each query with the **`sparql_query`** tool, passing **both** the ontology and the test-data file in `owl_file_paths` so they are merged into one graph:

```
call_tool(name: "sparql_query", data: {
  "owl_file_paths": [
    "projects/<project_dir>/ontology/<name>.owl",
    "projects/<project_dir>/queries/test-data.owl"
  ],
  "query": "<contents of queries/CQ01.rq>"
})
```

Call `sparql_query` once per CQ (one query string per call). Use absolute paths, or paths relative to the workspace root. There is **no merge/convert step and no `merged.owl` artifact** — the merge happens in-memory on every call, so there is also nothing to keep stale.

The tool returns **SPARQL 1.1 JSON results**:

- `SELECT` → `{ "head": { "vars": [...] }, "results": { "bindings": [ ... ] } }`
- `ASK` → `{ "head": {}, "boolean": true|false }`

**What results mean:**

- **One or more `bindings`** (or `boolean: true`) → the ontology supports this CQ. Pass.
- **Empty `bindings`** (or `boolean: false`) → either the test data is missing the necessary assertions, or the ontology is missing a class/property. Investigate which.
- **An error string** (SPARQL parse error, RDF load error) → fix the `.rq` file (or the source OWL) and re-run.

**When something fails:**

- Fix the root cause (query, test data, or ontology).
- Because the merge is in-memory, simply re-run `sparql_query` after any edit — there is no merged file to rebuild.
- If the ontology itself needed changes, return to Step 6 (formalization) to apply them via ontology-editor tools.

### Phase 3 — Report

Present results as a summary table covering every CQ:

| CQ | Question | Query File | Result | Notes |
|----|----------|------------|--------|-------|
| CQ01 | What items belong to a given category? | CQ01.rq | PASS (1 row) | Returned item1 |
| CQ02 | Who created a given item? | CQ02.rq | FAIL (0 rows) | Missing createdBy in test data |

Every CQ must appear in the table. If any CQ fails due to an ontology gap, fix the ontology and re-run.

## Common Pitfalls

### Querying test data without the schema

If you call `sparql_query` with only the test-data file, hierarchy/domain/range patterns will silently fail (or pass trivially). Always pass **both** the ontology and the test-data paths so the schema is loaded too.

### Expecting inferred triples

`sparql_query` runs over asserted triples — it does not classify or materialize entailments. For subsumption-style CQs, use property paths (`rdfs:subClassOf+`) or assert the needed facts in the test data.

### Clean Up

Keep the test data and query files as project deliverables. There are no build artifacts to delete (no merged/converted files are produced).
