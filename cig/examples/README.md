# Worked PROforma CIGs

Each example is a lint-clean PROforma guideline that passes the Step 7 gates (`scripts/check_cig.mjs` with 0 FAIL, and every CQ in `scripts/run_cqs.mjs`). For each one there is:

| File | What it is |
|---|---|
| `<name>.pf` | the guideline (PROforma 1.9; opens in Deontics Composer) |
| `<name>.html` | a self-contained viewer, built with `scripts/build_report.mjs`. It has a task tree, a plan canvas (pan, zoom, double-click a plan to open it), a properties panel, and data, decision, lint and source views |
| `<name>.mmd` | Mermaid diagram of the plan structure |
| `<name>.cqs.mjs` | competency-question queries |

## `obesity-glp1-monitoring`: the authoritative example

GLP-1 obesity therapy with eligibility, therapy and monitoring. It was converted from the kit's earlier OWL example. The skills point to it as the pattern to imitate.

## `ici-irae-monitoring`: a full kit session on a new guideline

Monitoring of immune checkpoint inhibitor therapy for immune-related adverse events. Source: ESMO Clinical Practice Guidelines, *Management of toxicities from immunotherapy* (Haanen et al., Ann Oncol 2017;28 Suppl 4:iv119–iv142, doi:10.1093/annonc/mdx225). The source PDF is not included.

It was built end to end by the kit's own workflow and subagents (`capa install -p claude-code`, then Steps 0–7). `ici-irae-monitoring-build/` keeps the record. The `projects/...` paths inside those files refer to the original project directory.

1. `EXTRACTION-20261025.md`: Steps 2–3. Every organ-system section is accounted for, with citations, data items, draft conditions and open questions.
2. `PROPOSAL-20261025-101500.md`: the first approved proposal, now superseded.
3. `reviews/cig-monitoring-review-20261025-1200.md`: the first Step 7 gate.
   - The deterministic script passed, but the reviewer FAILed `Monitor_PreInfusion_Surveillance`.
   - The cause: it required thyroid tests before every infusion, contradicting the guideline's regimen-specific schedule (iv124, Fig 5) and `Monitor_Thyroid`.
4. `PROPOSAL-20261025-131500.md`: revision 2.
   - It fixes that FAIL and folds in the reviewer's WARNs.
   - The user re-approved it, and the guideline was rebuilt from a fresh file after a baseline snapshot.
5. `reviews/cig-monitoring-review-20261025-1400.md` and `cq-verification-20261025-1400.md`: the full re-run. PASS, with 7/7 CQs.

Known, non-blocking limitations (WARNs from the final review, left for a future revision):
- the pre-infusion `monitoring_frequency_basis` omits Fig 5's "(in case of 2-weekly schedule)" qualifier;
- the hypophysitis performer instruction omits the endocrinology referral of the moderate tier and the vague-symptom tier of Fig 6;
- the nephritis performer instruction omits the G2 ">1.5–3×ULN" alternative and a separate G4 tier.

Two parts of the design were proposed by the assistant rather than taken from the guideline: the pre-treatment decision rule and the two population-scoped monitors. ESMO names those risk groups but gives no executable criterion or monitoring instruction for them. Both are marked as such in the metaprops and descriptions.
