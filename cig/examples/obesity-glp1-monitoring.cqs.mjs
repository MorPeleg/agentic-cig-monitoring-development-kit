// Competency-question queries for cig/examples/obesity-glp1-monitoring.pf.
// Run: node scripts/run_cqs.mjs cig/examples/obesity-glp1-monitoring.pf cig/examples/obesity-glp1-monitoring.cqs.mjs
//
// Each query receives the `proforma export` model (g) and helpers (h); see
// skills/cq-verification/SKILL.md.

export default [
  {
    id: "CQ1",
    question: "Which data items does the eligibility Enquiry collect?",
    query: (g, h) => h.task("Get_Eligibility_Data").sources.map((s) => s.data),
    expect: (rows) => ["BMI", "weight_related_comorbidity", "contraindications"].every((d) => rows.includes(d)),
  },
  {
    id: "CQ2",
    question: "Which criteria decide GLP-1 eligibility?",
    query: (g, h) =>
      h.task("Eligibility_Decision").candidates.flatMap((c) =>
        c.arguments.map((a) => ({ name: `${c.name}: ${a.support} ${a.condition}` }))
      ),
  },
  {
    id: "CQ3",
    question: "Which therapy actions does the therapy plan contain, and what State Achievement goal does each have?",
    query: (g, h) =>
      h
        .children("Obesity_Therapy")
        .map((t) => ({ name: `${t.name}: ${h.goal(t).verb} ${h.goal(t).noun_phrase}` })),
    expect: (rows) => rows.length === 3 && rows.some((r) => / avoid /.test(r.name)),
  },
  {
    id: "CQ4",
    question: "Which monitoring actions check that each therapy recommendation is enacted?",
    query: (g, h) =>
      h.therapyActions().flatMap((t) =>
        h
          .monitorsOf(t.name)
          .filter((m) => h.meta(m, "category") === "action_completion")
          .map((m) => ({ name: `${t.name} <- ${m.name}` }))
      ),
  },
  {
    id: "CQ5",
    question: "Which monitoring actions assess desired outcome states, and which therapy goal does each trace to?",
    query: (g, h) =>
      h
        .monitoringActions()
        .filter((m) => h.meta(m, "category") === "desired_outcome")
        .map((m) => ({ name: m.name, target: h.meta(m, "monitored_target") })),
    expect: (rows) => rows.length >= 3,
  },
  {
    id: "CQ6",
    question: "How is avoidance of lean-mass loss monitored (order, timing, instrument)?",
    query: (g, h) =>
      h.monitorsOf("Prescribe_Resistance_Exercise").map((m) => ({
        name: m.name,
        code: h.meta(m, "ServiceRequest.code"),
        timing: h.meta(m, "ServiceRequest.occurrenceTiming"),
        instrument: h.meta(m, "instrument"),
      })),
  },
  {
    id: "CQ7",
    question: "Which adverse drug effects are monitored, for which patients, and what triggers urgent assessment?",
    query: (g, h) =>
      h
        .children("Monitor_Undesired_State")
        .map((m) => ({ name: m.name, applies_when: h.meta(m, "applies_when"), precondition: m.precondition, trigger: h.meta(m, "trigger") })),
    // the conditional ADE must be gated by an executable precondition
    expect: (rows) => rows.length >= 4 && rows.some((r) => r.name === "Monitor_Hypoglycemia" && r.precondition),
  },
];
