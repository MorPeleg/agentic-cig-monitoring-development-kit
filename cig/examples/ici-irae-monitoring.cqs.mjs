// Competency-question queries for cig/examples/ici-irae-monitoring.pf.
// CQs: cig/examples/ici-irae-monitoring-build/PROPOSAL-20261025-131500.md §2.
// Run:
//   node scripts/run_cqs.mjs cig/examples/ici-irae-monitoring.pf \
//     cig/examples/ici-irae-monitoring.cqs.mjs \
//     --proposal cig/examples/ici-irae-monitoring-build/PROPOSAL-20261025-131500.md
//
// Every row is computed from the guideline export (g) and helpers (h); see
// skills/cq-verification/SKILL.md. The name lists below appear only in `expect`,
// as the correct answers fixed by the approved proposal (§5, §6).

// Proposal §5: baseline data items and their types.
const BASELINE = {
  pre_existing_autoimmune_disease: "boolean",
  prior_irAE_on_ICI: "boolean",
  organ_allograft: "boolean",
  ici_regimen: "text",
};
const RISK_FACTORS = ["pre_existing_autoimmune_disease", "prior_irAE_on_ICI", "organ_allograft"];

// Proposal §6: the 13 irAE monitors under Monitor_Undesired_State.
const IRAE_MONITORS = [
  "Monitor_Thyroid",
  "Monitor_Hypophysitis",
  "Monitor_Hepatitis",
  "Monitor_Diabetes",
  "Monitor_Nephritis",
  "Monitor_Skin",
  "Monitor_Colitis",
  "Monitor_Pneumonitis",
  "Monitor_Neurological",
  "Monitor_Myocarditis",
  "Monitor_Arthralgia",
  "Monitor_Autoimmune_Flare",
  "Monitor_Allograft_Rejection",
];
const ALL_MONITORS = ["Monitor_PreInfusion_Surveillance", ...IRAE_MONITORS];

const KEYWORDS = new Set(["and", "or", "not", "true", "false", "result_of", "netsupport"]);
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
const sameSet = (a, b) => a.length === b.length && b.every((x) => a.includes(x));
// Bare identifiers of an expression (quoted text removed first).
const idents = (expr) => (expr || "").replace(/"[^"]*"|'[^']*'/g, " ").match(/[A-Za-z_][A-Za-z0-9_]*/g) || [];
const unquote = (s) => String(s).replace(/^["']|["']$/g, "");

export default [
  {
    id: "CQ1",
    question: "Which baseline data are collected before ICI therapy starts?",
    query: (g, h) =>
      h.task("Get_Baseline_Data").sources.map((s) => {
        const d = h.data(s.data);
        return { name: s.data, type: d?.type ?? null, asked_by: d?.asked_by ?? [], range: (d?.range ?? []).map(unquote) };
      }),
    // exactly the four §5 items, with the approved types, asked by the baseline Enquiry,
    // and ici_regimen ranging over the four regimen classes
    expect: (rows) =>
      sameSet(rows.map((r) => r.name), Object.keys(BASELINE)) &&
      rows.every((r) => r.type === BASELINE[r.name] && r.asked_by.includes("Get_Baseline_Data")) &&
      sameSet(rows.find((r) => r.name === "ici_regimen").range, ["anti_CTLA4", "anti_PD1", "anti_PDL1", "anti_CTLA4_plus_anti_PD1"]),
  },
  {
    id: "CQ2",
    question: "Which criteria decide whether ICI can start without specialist review?",
    query: (g, h) => {
      const dec = h.task("Pretreatment_Decision");
      return dec.candidates.flatMap((c) =>
        c.arguments.map((a) => ({
          name: `${c.name}: ${a.support} ${a.condition}`,
          candidate: c.name,
          support: a.support,
          condition: a.condition,
          recommendation: c.recommendation,
          choice_mode: dec.choice_mode,
          data: idents(a.condition).filter((n) => h.data(n)).map((n) => ({ name: n, asked_by: h.data(n).asked_by })),
        }))
      );
    },
    // both candidates; Start_ICI requires all three risk factors false (and), Specialist_Review
    // fires on any of them true (or); every risk factor is a data item asked by Get_Baseline_Data
    expect: (rows) => {
      const start = rows.find((r) => r.candidate === "Start_ICI" && r.support === "for");
      const spec = rows.find((r) => r.candidate === "Specialist_Review_Before_ICI" && r.support === "for");
      if (!start || !spec) return false;
      const covers = (r, val, conn) =>
        RISK_FACTORS.every(
          (f) =>
            new RegExp(`\\b${f}\\s*=\\s*${val}\\b`).test(r.condition) &&
            r.data.some((d) => d.name === f && d.asked_by.includes("Get_Baseline_Data"))
        ) && new RegExp(`\\b${conn}\\b`).test(r.condition) && !new RegExp(`\\b${conn === "and" ? "or" : "and"}\\b`).test(r.condition);
      return (
        covers(start, "false", "and") &&
        covers(spec, "true", "or") &&
        [start, spec].every((r) => nonEmpty(r.recommendation)) &&
        sameSet([...new Set(rows.map((r) => r.candidate))], ["Start_ICI", "Specialist_Review_Before_ICI"])
      );
    },
  },
  {
    id: "CQ3",
    question: "Which irAEs are monitored during ICI therapy, with which test and how often?",
    query: (g, h) =>
      h
        .children("Monitor_Undesired_State")
        .filter((t) => t.kind === "action")
        .map((t) => ({
          name: t.name,
          verb: h.goal(t).verb,
          category: h.meta(t, "category"),
          code: h.meta(t, "ServiceRequest.code"),
          occurrenceTiming: h.meta(t, "ServiceRequest.occurrenceTiming"),
        })),
    // exactly the 13 irAE monitors, each an `order` in category undesired_ade with a test and a timing
    expect: (rows) =>
      sameSet(rows.map((r) => r.name), IRAE_MONITORS) &&
      rows.every(
        (r) =>
          String(r.verb).trim().toLowerCase() === "order" &&
          r.category === "undesired_ade" &&
          nonEmpty(r.code) &&
          nonEmpty(r.occurrenceTiming)
      ),
  },
  {
    id: "CQ4",
    question: "Which monitoring actions apply only to a sub-population, and what condition gates them?",
    query: (g, h) =>
      h
        .monitoringActions()
        .filter((t) => t.precondition)
        .map((t) => {
          const ids = idents(t.precondition);
          const data = ids.filter((n) => h.data(n)).map((n) => h.data(n));
          const allowed = new Set(data.flatMap((d) => d.range.map(unquote)));
          return {
            name: t.name,
            precondition: t.precondition,
            applies_when: h.meta(t, "applies_when"),
            data: data.map((d) => ({ name: d.name, asked_by: d.asked_by })),
            // bare words that are neither keywords, data items nor declared range values
            unresolved: ids.filter((n) => !KEYWORDS.has(n) && !h.data(n) && !allowed.has(n)),
          };
        }),
    // exactly the two population monitors; each precondition reads only Enquiry-asked data
    // (no unresolved words); Autoimmune_Flare gated on the autoimmune flag, Allograft_Rejection
    // on allograft + anti-PD-1-containing regimen (not anti-PD-L1, proposal §8.4)
    expect: (rows) => {
      if (!sameSet(rows.map((r) => r.name), ["Monitor_Autoimmune_Flare", "Monitor_Allograft_Rejection"])) return false;
      const ok = rows.every(
        (r) =>
          r.data.length > 0 &&
          r.unresolved.length === 0 &&
          r.data.every((d) => d.asked_by.includes("Get_Baseline_Data")) &&
          !/all_patients/.test(r.applies_when || "")
      );
      const flare = rows.find((r) => r.name === "Monitor_Autoimmune_Flare");
      const graft = rows.find((r) => r.name === "Monitor_Allograft_Rejection");
      return (
        ok &&
        /\bpre_existing_autoimmune_disease\s*=\s*true\b/.test(flare.precondition) &&
        /\borgan_allograft\s*=\s*true\b/.test(graft.precondition) &&
        /\bici_regimen\s*=\s*anti_PD1\b/.test(graft.precondition) &&
        /\bici_regimen\s*=\s*anti_CTLA4_plus_anti_PD1\b/.test(graft.precondition) &&
        !/anti_PDL1/.test(graft.precondition)
      );
    },
  },
  {
    id: "CQ5",
    question: "What triggers urgent assessment for each monitored irAE?",
    query: (g, h) =>
      h
        .children("Monitor_Undesired_State")
        .filter((t) => t.kind === "action")
        .map((t) => ({
          name: t.name,
          trigger: h.meta(t, "trigger"),
          performerInstruction: h.meta(t, "ServiceRequest.performerInstruction"),
        })),
    // every one of the 13 irAE monitors has a trigger and a performer instruction
    expect: (rows) =>
      sameSet(rows.map((r) => r.name), IRAE_MONITORS) &&
      rows.every((r) => nonEmpty(r.trigger) && nonEmpty(r.performerInstruction)),
  },
  {
    id: "CQ6",
    question: "Which monitoring action checks that the planned pre-infusion surveillance is actually done?",
    query: (g, h) =>
      h
        .monitoringActions()
        .filter((t) => h.meta(t, "category") === "action_completion")
        .map((t) => ({
          name: t.name,
          parents: t.used_by,
          target: h.meta(t, "monitored_target"),
          code: h.meta(t, "ServiceRequest.code"),
          occurrenceTiming: h.meta(t, "ServiceRequest.occurrenceTiming"),
        })),
    // exactly Monitor_PreInfusion_Surveillance, inside Monitor_Actions, tracing to Administer_ICI
    expect: (rows) =>
      rows.length === 1 &&
      rows[0].name === "Monitor_PreInfusion_Surveillance" &&
      rows[0].parents.includes("Monitor_Actions") &&
      /\bAdminister_ICI\b/.test(rows[0].target || "") &&
      /pre-infusion/i.test(rows[0].target || "") &&
      nonEmpty(rows[0].code) &&
      nonEmpty(rows[0].occurrenceTiming),
  },
  {
    id: "CQ7",
    question: "Which monitoring actions trace to the ICI therapy action?",
    query: (g, h) => {
      const therapy = h.therapyActions().map((t) => t.name);
      const tracing = h.monitorsOf("Administer_ICI").map((m) => m.name);
      return h.monitoringActions().map((m) => ({
        name: m.name,
        category: h.meta(m, "category"),
        traces_to_Administer_ICI: tracing.includes(m.name),
        administer_is_therapy_action: therapy.includes("Administer_ICI"),
      }));
    },
    // all 14 monitoring actions (1 action_completion + 13 undesired_ade) trace to Administer_ICI,
    // which is itself an achieve/avoid therapy action
    expect: (rows) =>
      sameSet(rows.map((r) => r.name), ALL_MONITORS) &&
      rows.every((r) => r.traces_to_Administer_ICI && r.administer_is_therapy_action) &&
      rows.filter((r) => r.category === "action_completion").length === 1 &&
      rows.filter((r) => r.category === "undesired_ade").length === 13,
  },
];
