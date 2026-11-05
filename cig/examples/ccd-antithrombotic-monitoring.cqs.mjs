// Competency-question queries for
//   projects/ccd-antiplatelet-monitoring/guideline/ccd_antithrombotic_monitoring.pf
// CQs: projects/ccd-antiplatelet-monitoring/plans/PROPOSAL-20261105-234339.md §2 (CQ1–CQ12).
// Run:
//   node scripts/run_cqs.mjs projects/ccd-antiplatelet-monitoring/guideline/ccd_antithrombotic_monitoring.pf \
//     projects/ccd-antiplatelet-monitoring/cqs/cq-queries.mjs \
//     --proposal projects/ccd-antiplatelet-monitoring/plans/PROPOSAL-20261105-234339.md \
//     --report projects/ccd-antiplatelet-monitoring/reviews/cq-verification-<YYYYMMDD-HHmmss>.md
//
// Every row is computed from the guideline export (g) and helpers (h); see
// skills/cq-verification/SKILL.md. The name lists below are used only in `expect`,
// as the correct answers fixed by the approved proposal (§3, §5, §6) and the
// extraction it adopts (EXTRACTION-20261029.md §3–§5).
// Proposal 20261105 (runnable data, R1–R6): yes/no items are `text` with range yes/no and
// conditions compare them with = "yes" / = "no" (no boolean, no = true); only the plan-gating
// item is mandatory; every Enquiry item has a default; the *_check_due items are gone; the
// 7 ADE Enquiries without a named test are followed by an Alert_Further_Examination_<ADE>.

// ---------------------------------------------------------------- approved answers

// Proposal §5: the 14 Enquiry data items and their types ("yesno" = text with range yes/no, R1).
const DATA_ITEMS = {
  requires_oral_anticoagulation: "yesno",
  pci_within_12_months: "yesno",
  des_implanted: "yesno",
  acs_within_12_months: "yesno",
  cabg_within_12_months: "yesno",
  previous_mi: "yesno",
  prior_stroke_or_tia: "yesno",
  prior_ich: "yesno",
  high_bleeding_risk: "yesno",
  high_thrombotic_risk: "yesno",
  aspirin_intolerance: "yesno",
  active_pathological_bleeding: "yesno",
  age_years: "integer",
  on_digoxin_or_diuretic: "yesno",
};
// The profile dimensions named in CQ2 (OAC need, recent PCI/ACS/CABG, previous MI, bleeding and thrombotic risk).
const PROFILE_ITEMS = [
  "requires_oral_anticoagulation",
  "pci_within_12_months",
  "acs_within_12_months",
  "cabg_within_12_months",
  "previous_mi",
  "high_bleeding_risk",
  "high_thrombotic_risk",
];

// Proposal §3: the nine regimen candidates and the three P2Y12 agents.
const REGIMENS = [
  "Aspirin_Monotherapy",
  "Clopidogrel_Monotherapy",
  "DAPT",
  "Short_DAPT_then_P2Y12_Monotherapy",
  "Extended_DAPT",
  "Aspirin_plus_Vorapaxar",
  "Aspirin_plus_Low_Dose_Rivaroxaban",
  "DOAC_plus_Antiplatelet",
  "DOAC_Monotherapy",
];
const P2Y12_AGENTS = ["Clopidogrel", "Ticagrelor", "Prasugrel"];

// Proposal §6: the therapy actions.
const THERAPY = [
  "Advise_Avoid_Chronic_NSAIDs",
  "Prescribe_Aspirin",
  "Prescribe_Clopidogrel",
  "Prescribe_Ticagrelor",
  "Prescribe_Prasugrel",
  "Prescribe_Vorapaxar",
  "Prescribe_Low_Dose_Rivaroxaban",
  "Prescribe_DOAC",
  "Prescribe_PPI",
];
const DRUG_ACTIONS = THERAPY.filter((n) => n !== "Advise_Avoid_Chronic_NSAIDs");

// Proposal §6: monitors per sub-plan.
const ACTION_MONITORS = [
  "Monitor_Antithrombotic_Adherence",
  "Monitor_Regimen_Duration",
  "Monitor_NSAID_Avoidance",
  "Monitor_PPI_Continued_Need",
];
const DESIRED_MONITORS = ["Monitor_Ischemic_Events"];
const ADE_MONITORS = [
  "Monitor_Bleeding",
  "Monitor_Drug_Interactions",
  "Monitor_Spinal_Epidural_Hematoma",
  "Monitor_Perioperative_Interruption",
  "Monitor_Renal_Function",
  "Monitor_TTP",
  "Monitor_CYP2C19_Poor_Metabolizer",
  "Monitor_Antiplatelet_Hypersensitivity",
  "Monitor_Ticagrelor_Dyspnea",
  "Monitor_Ticagrelor_Bradyarrhythmia",
  "Monitor_Ticagrelor_Central_Sleep_Apnea",
  "Monitor_PPI_CDAD",
  "Monitor_PPI_Hypomagnesemia",
  "Monitor_PPI_Bone_Fracture",
  "Monitor_PPI_Interstitial_Nephritis",
  "Monitor_PPI_Cutaneous_Lupus",
  "Monitor_PPI_Severe_Cutaneous_Reactions",
];
// Proposal §6 (R6): the ADE Enquiries whose sources name no test, each followed by one
// Alert_Further_Examination_<ADE> Action gated on its suspected_<ade> item.
const NO_TEST_ADES = [
  "Monitor_Spinal_Epidural_Hematoma",
  "Monitor_Perioperative_Interruption",
  "Monitor_Antiplatelet_Hypersensitivity",
  "Monitor_Ticagrelor_Dyspnea",
  "Monitor_PPI_Bone_Fracture",
  "Monitor_PPI_Cutaneous_Lupus",
  "Monitor_PPI_Severe_Cutaneous_Reactions",
];
const alertOf = (enq) => "Alert_Further_Examination_" + enq.replace(/^Monitor_/, "");
const suspectedOf = (enq) => "suspected_" + enq.replace(/^Monitor_/, "").toLowerCase();
const ALERTS = NO_TEST_ADES.map(alertOf);
const ALL_MONITORS = [...ACTION_MONITORS, ...DESIRED_MONITORS, ...ADE_MONITORS, ...ALERTS];
const PPI_ADE_MONITORS = ADE_MONITORS.filter((n) => n.startsWith("Monitor_PPI_"));

// Extraction §3 shorthands, as decision-result sets.
const R = "Antithrombotic_Regimen_Decision";
const P = "P2Y12_Agent_Decision";
const PPI_SET = [`${R}=DAPT`, `${R}=Short_DAPT_then_P2Y12_Monotherapy`, `${R}=Extended_DAPT`, `${R}=DOAC_plus_Antiplatelet`];
const ANTIPLATELET_SET = ["Aspirin_Monotherapy", "Clopidogrel_Monotherapy", "DAPT", "Short_DAPT_then_P2Y12_Monotherapy", "Extended_DAPT", "Aspirin_plus_Vorapaxar", "Aspirin_plus_Low_Dose_Rivaroxaban", "DOAC_plus_Antiplatelet"].map((c) => `${R}=${c}`); // proposal Revision 2, J5
const ANTICOAG_SET = [`${R}=Aspirin_plus_Low_Dose_Rivaroxaban`, `${R}=DOAC_plus_Antiplatelet`, `${R}=DOAC_Monotherapy`];
// Proposal §6 / extraction §3: the decision results that gate each drug- or sub-population-scoped monitor.
const GATES = {
  Monitor_PPI_Continued_Need: PPI_SET,
  // proposal Revision 3, J7: every regimen except Aspirin_Monotherapy
  Monitor_Perioperative_Interruption: ["Clopidogrel_Monotherapy", "DAPT", "Short_DAPT_then_P2Y12_Monotherapy", "Extended_DAPT", "Aspirin_plus_Vorapaxar", "Aspirin_plus_Low_Dose_Rivaroxaban", "DOAC_plus_Antiplatelet", "DOAC_Monotherapy"].map((c) => `${R}=${c}`),
  Monitor_Antiplatelet_Hypersensitivity: ANTIPLATELET_SET, // proposal Revision 2, J5
  Monitor_Spinal_Epidural_Hematoma: ANTICOAG_SET,
  Monitor_Renal_Function: ANTICOAG_SET,
  Monitor_TTP: [`${R}=Clopidogrel_Monotherapy`, `${P}=Clopidogrel`, `${P}=Prasugrel`],
  Monitor_CYP2C19_Poor_Metabolizer: [`${R}=Clopidogrel_Monotherapy`, `${P}=Clopidogrel`],
  Monitor_Ticagrelor_Dyspnea: [`${P}=Ticagrelor`],
  Monitor_Ticagrelor_Bradyarrhythmia: [`${P}=Ticagrelor`],
  Monitor_Ticagrelor_Central_Sleep_Apnea: [`${P}=Ticagrelor`],
  Monitor_PPI_CDAD: PPI_SET,
  Monitor_PPI_Hypomagnesemia: PPI_SET,
  Monitor_PPI_Bone_Fracture: [`${R}=Extended_DAPT`],
  Monitor_PPI_Interstitial_Nephritis: PPI_SET,
  Monitor_PPI_Cutaneous_Lupus: PPI_SET,
  Monitor_PPI_Severe_Cutaneous_Reactions: PPI_SET,
};
// R6: each alert runs only for the patients its Enquiry runs for (the same decision-result gate).
for (const e of NO_TEST_ADES) GATES[alertOf(e)] = GATES[e];

// ---------------------------------------------------------------- small helpers

const KEYWORDS = new Set(["and", "or", "not", "true", "false", "result_of", "netsupport"]);
const nonEmpty = (v) => typeof v === "string" && v.trim().length > 0;
// R1: a condition never compares with a boolean literal (true / false outside quoted text)
const boolLiteral = (expr) => /\b(true|false)\b/i.test((expr || "").replace(/"[^"]*"|'[^']*'/g, " "));
// R1: every yes/no item an expression reads is compared with a quoted "yes" / "no"
const yesNoCompared = (h, expr) =>
  dataRead(h, expr)
    .filter((n) => h.isYesNo(n))
    .every((n) => new RegExp(`\\b${n}\\s*=\\s*"(yes|no)"`).test(expr));
const sameSet = (a, b) => a.length === b.length && b.every((x) => a.includes(x));
// Bare identifiers of an expression (quoted text removed first).
const idents = (expr) =>
  ((expr || "").replace(/"[^"]*"|'[^']*'/g, " ").match(/[A-Za-z_][A-Za-z0-9_]*/g) || []).filter((n) => !KEYWORDS.has(n));
// Data items an expression reads.
const dataRead = (h, expr) => [...new Set(idents(expr).filter((n) => h.data(n)))];
// `result_of(Decision) = Candidate` terms of an expression, as "Decision=Candidate".
const resultTerms = (expr) =>
  [...(expr || "").matchAll(/result_of\(\s*([A-Za-z_][A-Za-z0-9_]*)\s*\)\s*=\s*([A-Za-z_][A-Za-z0-9_]*)/g)].map(
    (m) => `${m[1]}=${m[2]}`
  );
// Whole-word mentions of a task name inside a text.
const mentions = (text, name) => new RegExp(`\\b${name}\\b`).test(text || "");
// Therapy actions a monitored_target names.
const tracedTherapy = (h, m) =>
  h
    .therapyActions()
    .map((t) => t.name)
    .filter((n) => mentions(h.meta(m, "monitored_target"), n));
const order = (h, t) => ({
  code: h.meta(t, "ServiceRequest.code"),
  timing: h.meta(t, "ServiceRequest.occurrenceTiming"),
  patient: h.meta(t, "ServiceRequest.patientInstruction"),
  clinician: h.meta(t, "ServiceRequest.performerInstruction"),
});

export default [
  // ------------------------------------------------------------------ CQ1
  {
    id: "CQ1",
    question:
      "Which patient data does the guideline collect to choose an antithrombotic regimen for a patient with CCD?",
    query: (g, h) => {
      const regimenReads = new Set(
        h.task(R).candidates.flatMap((c) => c.arguments.flatMap((a) => dataRead(h, a.condition)))
      );
      return h.task("Get_Antithrombotic_Data").sources.map((s) => {
        const d = h.data(s.data);
        return {
          name: s.data,
          type: d?.type ?? null,
          yesNo: d ? h.isYesNo(d) : false,
          unit: d?.unit ?? null,
          asked_by: d?.asked_by ?? [],
          read_by_regimen_decision: regimenReads.has(s.data),
          _regimenReads: [...regimenReads],
        };
      });
    },
    // exactly the 14 §5 items with the approved types (yes/no items: text with range yes/no, never boolean),
    // all asked by the Enquiry, age in years, and every data item the regimen decision's arguments read is one of them
    expect: (rows) =>
      sameSet(rows.map((r) => r.name), Object.keys(DATA_ITEMS)) &&
      rows.every((r) =>
        r.type !== "boolean" &&
        (DATA_ITEMS[r.name] === "yesno" ? r.type === "text" && r.yesNo : r.type === DATA_ITEMS[r.name] && !r.yesNo) &&
        r.asked_by.includes("Get_Antithrombotic_Data")) &&
      rows.find((r) => r.name === "age_years").unit === "years" &&
      rows[0]._regimenReads.length > 0 &&
      rows[0]._regimenReads.every((n) => rows.some((r) => r.name === n)) &&
      PROFILE_ITEMS.every((n) => rows.find((r) => r.name === n).read_by_regimen_decision),
  },

  // ------------------------------------------------------------------ CQ2
  {
    id: "CQ2",
    question:
      "Which antithrombotic regimen does the guideline recommend for a given patient profile (OAC need, recent PCI, ACS or CABG, previous MI, bleeding and thrombotic risk), and which options are excluded as harmful or of no benefit?",
    query: (g, h) =>
      [R, P].flatMap((dn) => {
        const dec = h.task(dn);
        return dec.candidates.flatMap((c) =>
          c.arguments.map((a) => ({
            name: `${dn}/${c.name}: ${a.support} ${a.name}`,
            decision: dn,
            candidate: c.name,
            recommendation: c.recommendation,
            argument: a.name,
            support: a.support,
            condition: a.condition,
            caption: a.caption,
            reads: dataRead(h, a.condition),
            asked: dataRead(h, a.condition).every((n) => h.data(n).asked_by.includes("Get_Antithrombotic_Data")),
            unknownIdents: idents(a.condition).filter((n) => !h.data(n)),
            boolLiteral: boolLiteral(a.condition),
            yesNoCompared: yesNoCompared(h, a.condition),
            sources: h.meta(a, "source", true),
            quotes: h.meta(a, "quote", true),
            quote: h.meta(a, "quote", true).join(" | "),
          }))
        );
      }),
    expect: (rows) => {
      const reg = rows.filter((r) => r.decision === R);
      const p2 = rows.filter((r) => r.decision === P);
      const arg = (n) => rows.find((r) => r.argument === n);
      const noBenefit = arg("Arg_DAPT_No_Benefit");
      const vorHarm = arg("Arg_Vorapaxar_Harm");
      const praHarm = arg("Arg_Prasugrel_Harm");
      const ticIch = arg("Arg_Ticagrelor_ICH");
      return (
        // the nine regimen candidates and three agents, each with at least one `for` argument
        sameSet([...new Set(reg.map((r) => r.candidate))], REGIMENS) &&
        sameSet([...new Set(p2.map((r) => r.candidate))], P2Y12_AGENTS) &&
        [...REGIMENS, ...P2Y12_AGENTS].every((c) => rows.some((r) => r.candidate === c && r.support === "for")) &&
        rows.every((r) => r.recommendation === "netsupport() > 0") &&
        // every criterion is an executable expression over Enquiry data
        rows.every((r) => r.reads.length > 0 && r.asked && r.unknownIdents.length === 0) &&
        // R1: no boolean literal in any criterion, every yes/no item compared with "yes" / "no"
        rows.every((r) => !r.boolLiteral && r.yesNoCompared) &&
        // every profile dimension drives at least one regimen argument
        PROFILE_ITEMS.every((d) => reg.some((r) => r.reads.includes(d))) &&
        // Rec 7: DAPT argued AGAINST without PCI/ACS/CABG in the past 12 months (no benefit)
        noBenefit?.candidate === "DAPT" &&
        noBenefit.support === "against" &&
        ["pci_within_12_months", "acs_within_12_months", "cabg_within_12_months"].every((d) => noBenefit.reads.includes(d)) &&
        /Rec 7/.test(noBenefit.caption) &&
        /not useful/.test(noBenefit.quote) &&
        // Rec 8 / VOR §4.1: vorapaxar EXCLUDED after stroke, TIA or ICH (harm)
        vorHarm?.candidate === "Aspirin_plus_Vorapaxar" &&
        vorHarm.support === "excluding" &&
        ["prior_stroke_or_tia", "prior_ich"].every((d) => vorHarm.reads.includes(d)) &&
        /Rec 8 \[3: Harm/.test(vorHarm.caption) &&
        /should not be added to DAPT/.test(vorHarm.quote) &&
        // Rec 9: prasugrel EXCLUDED after stroke, TIA or ICH (harm)
        praHarm?.candidate === "Prasugrel" &&
        praHarm.support === "excluding" &&
        ["prior_stroke_or_tia", "prior_ich"].every((d) => praHarm.reads.includes(d)) &&
        /Rec 9/.test(praHarm.caption) &&
        /should not be used/.test(praHarm.quote) &&
        // ticagrelor excluded after ICH (TIC §4.1)
        ticIch?.candidate === "Ticagrelor" &&
        ticIch.support === "excluding" &&
        // the OAC branch: DOAC candidates are argued for when OAC is required
        ["DOAC_plus_Antiplatelet", "DOAC_Monotherapy"].every((c) =>
          reg.some((r) => r.candidate === c && r.support === "for" && /requires_oral_anticoagulation = "yes"/.test(r.condition))
        ) &&
        // every regimen argument carries its sources, each paired with a verbatim quote
        reg.every((r) => r.sources.length > 0 && r.sources.length === r.quotes.length && r.quotes.every(nonEmpty))
      );
    },
  },

  // ------------------------------------------------------------------ CQ3
  {
    id: "CQ3",
    question:
      "Which adverse drug effects are monitored for each antithrombotic drug and for the PPI, with which test or instrument and how often?",
    query: (g, h) =>
      h
        .children("Monitor_Undesired_State")
        // proposal 20261030: the ADE monitors are Enquiries (ADEMonitoringEnquiry.md)
        .filter((t) => t.kind === "enquiry")
        .map((t) => ({
          name: t.name,
          category: h.meta(t, "category"),
          drugs: tracedTherapy(h, t),
          ...order(h, t),
          instrument: h.meta(t, "instrument"),
          frequency_basis: h.meta(t, "monitoring_frequency_basis"),
          // the coding sits on the task's component in the parent plan (cig/know-how/proforma/Ontology.md)
          coding: h.coding(t),
        })),
    expect: (rows) =>
      // the 17 approved ADE monitors, each an undesired_ade order with a test, an instrument and a schedule
      sameSet(rows.map((r) => r.name), ADE_MONITORS) &&
      rows.every(
        (r) =>
          r.category === "undesired_ade" &&
          nonEmpty(r.code) &&
          nonEmpty(r.instrument) &&
          nonEmpty(r.timing) &&
          nonEmpty(r.frequency_basis) &&
          r.drugs.length > 0
      ) &&
      // every drug (each antithrombotic and the PPI) has at least one ADE monitor
      DRUG_ACTIONS.every((d) => rows.some((r) => r.drugs.includes(d))) &&
      // the six pantoprazole label harms trace to Prescribe_PPI
      PPI_ADE_MONITORS.every((n) => rows.find((r) => r.name === n).drugs.includes("Prescribe_PPI")) &&
      // spot-check the tests: Hb/Hct for bleeding, creatinine clearance for renal function, magnesium for the PPI
      /hemoglobin/i.test(rows.find((r) => r.name === "Monitor_Bleeding").code) &&
      /creatinine clearance/i.test(rows.find((r) => r.name === "Monitor_Renal_Function").code) &&
      /magnesium/i.test(rows.find((r) => r.name === "Monitor_PPI_Hypomagnesemia").code) &&
      /12 months/.test(rows.find((r) => r.name === "Monitor_PPI_Hypomagnesemia").timing),
  },

  // ------------------------------------------------------------------ CQ4
  {
    id: "CQ4",
    question:
      "Which monitoring actions track the desired outcome (fewer ischemic events and MACE) and the renal function that anticoagulant dosing depends on?",
    query: (g, h) =>
      [...h.children("Monitor_Desired_State").filter((t) => t.kind === "action"), h.task("Monitor_Renal_Function")].map(
        (t) => ({
          name: t.name,
          plan: t.used_by,
          category: h.meta(t, "category"),
          target: h.meta(t, "monitored_target"),
          drugs: tracedTherapy(h, t),
          gate: resultTerms(t.precondition),
          ...order(h, t),
        })
      ),
    expect: (rows) => {
      const isch = rows.find((r) => r.name === "Monitor_Ischemic_Events");
      const renal = rows.find((r) => r.name === "Monitor_Renal_Function");
      const achieveDrugs = [
        "Prescribe_Aspirin",
        "Prescribe_Clopidogrel",
        "Prescribe_Ticagrelor",
        "Prescribe_Prasugrel",
        "Prescribe_Vorapaxar",
        "Prescribe_Low_Dose_Rivaroxaban",
        "Prescribe_DOAC",
      ];
      return (
        sameSet(rows.filter((r) => r.category === "desired_outcome").map((r) => r.name), DESIRED_MONITORS) &&
        // ischemic-event review: MI, stroke/TIA, stent thrombosis; traces to every MACE-reducing drug
        /myocardial infarction/.test(isch.code) &&
        /stroke/.test(isch.code) &&
        /MACE/.test(isch.target) &&
        achieveDrugs.every((d) => isch.drugs.includes(d)) &&
        nonEmpty(isch.timing) &&
        nonEmpty(isch.clinician) &&
        // renal function: creatinine clearance, baseline then periodic, dose adjustment, gated to anticoagulants
        renal.plan.includes("Monitor_Undesired_State") &&
        /creatinine clearance/i.test(renal.code) &&
        /baseline/.test(renal.timing) &&
        /adjust/.test(renal.clinician) &&
        ["Prescribe_DOAC", "Prescribe_Low_Dose_Rivaroxaban"].every((d) => renal.drugs.includes(d)) &&
        sameSet(renal.gate, ANTICOAG_SET)
      );
    },
  },

  // ------------------------------------------------------------------ CQ5
  {
    id: "CQ5",
    question:
      "What triggers urgent or event-driven assessment (bleeding, ischemic symptoms, neuraxial procedures, surgery, TTP, regimen step-down points)?",
    query: (g, h) =>
      h
        .monitoringActions()
        .filter((t) => nonEmpty(h.meta(t, "trigger")) && !/^none$/i.test(h.meta(t, "trigger").trim()))
        .map((t) => ({
          name: t.name,
          trigger: h.meta(t, "trigger"),
          stance: h.meta(t, "monitoring_stance"),
          ...order(h, t),
        })),
    expect: (rows) => {
      const r = (n) => rows.find((x) => x.name === n);
      const checks = [
        // bleeding: symptoms / hypotension / Hb fall -> same-day evaluation with Hb/Hct
        ["Monitor_Bleeding", (x) => /bleeding/.test(x.trigger) && /same-day/.test(x.timing) && /hemoglobin/.test(x.clinician)],
        // ischemic symptoms -> urgent ECG/troponin/neuroimaging
        ["Monitor_Ischemic_Events", (x) => /chest pain/.test(x.trigger) && /stroke/.test(x.trigger) && /urgently/.test(x.clinician)],
        // neuraxial procedure -> frequent neuro checks, urgent treatment
        ["Monitor_Spinal_Epidural_Hematoma", (x) => /neuraxial/.test(x.trigger) && /neuraxial/.test(x.timing) && /urgently/.test(x.clinician)],
        // surgery -> perioperative hold/resume plan
        ["Monitor_Perioperative_Interruption", (x) => /surgery/.test(x.trigger) && /event-triggered/.test(x.timing) && /hold/.test(x.clinician)],
        // TTP symptoms -> platelets, smear, LDH, creatinine, urgent plasmapheresis
        ["Monitor_TTP", (x) => /purpura/.test(x.trigger) && /schistocytes/.test(x.clinician) && /urgent/.test(x.clinician)],
        // regimen step-down points (and earlier review on bleeding or ischemic events)
        ["Monitor_Regimen_Duration", (x) => /6, 12|1, 3, 6 and 12 months/.test(x.timing) && /step down/.test(x.clinician) && /bleeding|ischemic/.test(x.trigger)],
      ];
      return checks.every(([n, f]) => r(n) && nonEmpty(r(n).clinician) && f(r(n)));
    },
  },

  // ------------------------------------------------------------------ CQ6
  {
    id: "CQ6",
    question:
      "How does the guideline monitor avoidance of harmful co-medication (chronic NSAIDs, omeprazole or esomeprazole with clopidogrel, aspirin over 100 mg with ticagrelor, CYP3A and P-gp interactions)?",
    query: (g, h) => {
      const advise = h.task("Advise_Avoid_Chronic_NSAIDs");
      const rows = [
        {
          name: advise.name,
          kind: "therapy",
          goal: h.goal(advise),
          text: `${advise.procedure ?? ""}`,
        },
      ];
      for (const t of h.monitoringActions().filter((m) => /interaction|NSAID/i.test(m.name))) {
        rows.push({
          name: t.name,
          kind: "monitor",
          category: h.meta(t, "category"),
          drugs: tracedTherapy(h, t),
          target: h.meta(t, "monitored_target"),
          ...order(h, t),
          text: [h.meta(t, "ServiceRequest.code"), h.meta(t, "ServiceRequest.performerInstruction"), t.procedure].join(" "),
        });
      }
      const ppi = h.task("Prescribe_PPI");
      rows.push({ name: ppi.name, kind: "therapy", goal: h.goal(ppi), text: ppi.procedure ?? "" });
      return rows;
    },
    expect: (rows) => {
      const r = (n) => rows.find((x) => x.name === n);
      const nsaidAdv = r("Advise_Avoid_Chronic_NSAIDs");
      const nsaidMon = r("Monitor_NSAID_Avoidance");
      const ddi = r("Monitor_Drug_Interactions");
      const ppi = r("Prescribe_PPI");
      return (
        // chronic NSAIDs: an avoid goal, monitored by a medication check that traces to it
        nsaidAdv?.goal.verb === "avoid" &&
        /NSAID/.test(nsaidAdv.goal.noun_phrase) &&
        nsaidMon?.drugs.includes("Advise_Avoid_Chronic_NSAIDs") &&
        /NSAID/.test(nsaidMon.code) &&
        /stopping/.test(nsaidMon.clinician) &&
        // interacting-medication review covers each named co-medication rule
        ddi?.category === "undesired_ade" &&
        /omeprazole and esomeprazole with clopidogrel/.test(ddi.clinician) &&
        /aspirin at 100 mg or less daily with ticagrelor/.test(ddi.clinician) &&
        /CYP3A/.test(ddi.clinician) &&
        /P-gp/.test(ddi.clinician) &&
        ["Prescribe_Clopidogrel", "Prescribe_Ticagrelor", "Prescribe_DOAC"].every((d) => ddi.drugs.includes(d)) &&
        // the PPI prescribed is pantoprazole and its procedure rules out omeprazole/esomeprazole with clopidogrel
        /Pantoprazole/.test(ppi.text) &&
        /omeprazole or esomeprazole with clopidogrel/.test(ppi.text)
      );
    },
  },

  // ------------------------------------------------------------------ CQ7
  {
    id: "CQ7",
    question: "When is a PPI prescribed, and how are its continued need and its long-term harms monitored?",
    query: (g, h) => {
      const ppi = h.task("Prescribe_PPI");
      return [
        {
          name: ppi.name,
          role: "therapy",
          goal: h.goal(ppi),
          precondition: ppi.precondition,
          gate: resultTerms(ppi.precondition),
          procedure: ppi.procedure,
        },
        ...h.monitorsOf("Prescribe_PPI").map((m) => ({
          name: m.name,
          role: "monitor",
          category: h.meta(m, "category"),
          gate: resultTerms(m.precondition),
          ...order(h, m),
        })),
      ];
    },
    expect: (rows) => {
      const ppi = rows.find((r) => r.role === "therapy");
      const mons = rows.filter((r) => r.role === "monitor");
      const cont = mons.find((r) => r.name === "Monitor_PPI_Continued_Need");
      return (
        // prescribed during DAPT or antiplatelet + anticoagulant (PPI_SET), to avoid GI bleeding, as pantoprazole
        ppi.goal.verb === "avoid" &&
        /gastrointestinal bleeding/.test(ppi.goal.noun_phrase) &&
        sameSet(ppi.gate, PPI_SET) &&
        /Pantoprazole 40 mg/.test(ppi.procedure) &&
        // continued need: an action-completion review that stops the PPI when the combination ends
        cont?.category === "action_completion" &&
        /stop/.test(cont.clinician) &&
        /stepped down/.test(cont.timing) &&
        // every pantoprazole label harm is monitored as an ADE of Prescribe_PPI
        PPI_ADE_MONITORS.every((n) => mons.some((r) => r.name === n && r.category === "undesired_ade" && nonEmpty(r.code))) &&
        // long-term harms: magnesium periodically, fracture review during long-term (extended DAPT) use
        /magnesium/.test(mons.find((r) => r.name === "Monitor_PPI_Hypomagnesemia").code) &&
        sameSet(mons.find((r) => r.name === "Monitor_PPI_Bone_Fracture").gate, [`${R}=Extended_DAPT`])
      );
    },
  },

  // ------------------------------------------------------------------ CQ8
  {
    id: "CQ8",
    question: "Which monitoring actions trace to each therapy action?",
    query: (g, h) => {
      const therapyNames = h.therapyActions().map((t) => t.name);
      const perTherapy = h.therapyActions().map((t) => ({
        name: t.name,
        role: "therapy",
        monitors: h.monitorsOf(t.name).map((m) => m.name),
        categories: [...new Set(h.monitorsOf(t.name).map((m) => h.meta(m, "category")))],
      }));
      const perMonitor = h.monitoringActions().map((m) => ({
        name: m.name,
        role: "monitor",
        target: h.meta(m, "monitored_target"),
        traces: therapyNames.filter((n) => mentions(h.meta(m, "monitored_target"), n)),
        // every Prescribe_/Advise_ name the target cites must be an existing task
        citedNames: (h.meta(m, "monitored_target") || "").match(/\b(?:Prescribe|Advise)_[A-Za-z0-9_]+/g) || [],
      }));
      return [...perTherapy, ...perMonitor].map((r) => ({ ...r, _existing: g.tasks.map((t) => t.name) }));
    },
    expect: (rows) => {
      const therapy = rows.filter((r) => r.role === "therapy");
      const mons = rows.filter((r) => r.role === "monitor");
      const existing = rows[0]?._existing ?? [];
      return (
        sameSet(therapy.map((r) => r.name), THERAPY) &&
        sameSet(mons.map((r) => r.name), ALL_MONITORS) &&
        // every monitor's monitored_target names at least one existing therapy action, and nothing it names is missing
        mons.every((r) => r.traces.length > 0 && r.citedNames.every((n) => existing.includes(n))) &&
        // every therapy action is traced by at least one monitor
        therapy.every((r) => r.monitors.length > 0) &&
        // the main drug actions are covered across completion, desired outcome and ADE categories
        ["Prescribe_Aspirin", "Prescribe_Clopidogrel", "Prescribe_DOAC"].every((n) =>
          ["action_completion", "desired_outcome", "undesired_ade"].every((c) => therapy.find((r) => r.name === n).categories.includes(c))
        ) &&
        therapy.find((r) => r.name === "Advise_Avoid_Chronic_NSAIDs").monitors.includes("Monitor_NSAID_Avoidance") &&
        ["Monitor_PPI_Continued_Need", ...PPI_ADE_MONITORS].every((n) =>
          therapy.find((r) => r.name === "Prescribe_PPI").monitors.includes(n)
        )
      );
    },
  },

  // ------------------------------------------------------------------ CQ9
  {
    id: "CQ9",
    question:
      "Which monitoring actions apply only to patients on a specific drug or in a sub-population, and what precondition gates them?",
    query: (g, h) =>
      h
        .monitoringActions()
        .filter((t) => nonEmpty(t.precondition))
        .map((t) => {
          const terms = resultTerms(t.precondition);
          return {
            name: t.name,
            precondition: t.precondition,
            gate: terms,
            // each result_of(D) = C names a real candidate of decision D
            validTerms: terms.every((x) => {
              const [d, c] = x.split("=");
              return (h.task(d)?.candidates ?? []).some((cand) => cand.name === c);
            }),
            data: dataRead(h, t.precondition).map((n) => ({ name: n, type: h.data(n).type, yesNo: h.isYesNo(n), asked_by: h.data(n).asked_by })),
            boolLiteral: boolLiteral(t.precondition),
            yesNoCompared: yesNoCompared(h, t.precondition),
            applies_when: h.meta(t, "applies_when"),
            drugs: tracedTherapy(h, t),
            // the traced drugs' own preconditions, for consistency with the monitor gate
            drugGate: [...new Set(tracedTherapy(h, t).flatMap((d) => resultTerms(h.task(d).precondition)))],
          };
        }),
    expect: (rows) => {
      const r = (n) => rows.find((x) => x.name === n);
      const mag = r("Monitor_PPI_Hypomagnesemia");
      return (
        // exactly the approved gated monitors, each gated on the approved decision results
        sameSet(rows.map((x) => x.name), Object.keys(GATES)) &&
        rows.every((x) => x.validTerms && sameSet([...new Set(x.gate)], GATES[x.name])) &&
        // R1: no gate compares with a boolean literal; yes/no items are compared with "yes" / "no";
        // every data item a gate reads is asked by an Enquiry
        rows.every((x) => !x.boolLiteral && x.yesNoCompared && x.data.every((d) => d.asked_by.length > 0)) &&
        // R6: each alert also reads its own suspected_<ade> item (yes/no, asked by its Enquiry), compared with "yes"
        NO_TEST_ADES.every((e) => {
          const a = r(alertOf(e));
          return Boolean(a) && a.data.some((d) => d.name === suspectedOf(e) && d.yesNo && d.asked_by.includes(e)) &&
            new RegExp(`\\b${suspectedOf(e)}\\s*=\\s*"yes"`).test(a.precondition);
        }) &&
        // a drug-gated monitor never fires outside its drug's own precondition
        // (a regimen in PPI_SET always runs P2Y12_Agent_Decision, which recommends one of the three P2Y12 drugs,
        //  so such a term is inside the scope of a monitor that traces a P2Y12 drug action)
        rows.every((x) => x.gate.every((term) => x.drugGate.includes(term) ||
          (PPI_SET.includes(term) && x.drugs.some((d) => ["Prescribe_Clopidogrel", "Prescribe_Ticagrelor", "Prescribe_Prasugrel"].includes(d))))) &&
        // the one sub-population gate: on_digoxin_or_diuretic, a yes/no text item the Enquiry asks for (R1)
        mag.data.some((d) => d.name === "on_digoxin_or_diuretic" && d.type === "text" && d.yesNo && d.asked_by.includes("Get_Antithrombotic_Data")) &&
        /on_digoxin_or_diuretic = "yes"/.test(mag.precondition) &&
        /digoxin or a diuretic/.test(mag.applies_when) &&
        // proposal Revision 2, J6: long-term PPI fracture risk is a sub-population read from an Enquiry item
        r("Monitor_PPI_Bone_Fracture").data.some((d) => d.name === "previous_mi" && d.yesNo && d.asked_by.includes("Get_Antithrombotic_Data")) &&
        /previous_mi = "yes"/.test(r("Monitor_PPI_Bone_Fracture").precondition) &&
        /a year or longer/.test(r("Monitor_PPI_Bone_Fracture").applies_when)
      );
    },
  },
  // ------------------------------------------------------------------ CQ10
  {
    id: "CQ10",
    question:
      "For each monitored ADE, which symptoms and bedside findings are collected (with SNOMED CT codes), and which tests are ordered when a finding is positive (with LOINC codes) under what condition?",
    query: (g, h) => {
      const display = h.adeDisplay()[0] ?? null;
      return h.monitorEnquiries().map((e) => ({
        name: e.name,
        afterDisplay: display ? h.after("Monitor_Undesired_State", display.name).includes(e.name) : false,
        displayItems: display ? display.items.length : 0,
        findings: h.findingsOf(e.name).map((d) => ({ name: d.name, type: d.type, coding: d.metaprops?.["ontology.coding"] ?? null })),
        tests: h.testSteps(e.name).map((s) => ({
          name: s.name,
          kind: s.kind,
          precondition: s.precondition,
          choice_mode: s.choice_mode,
          tests: s.tests,
          readsFindings: h.findingsOf(e.name).some((d) => new RegExp(`\\b${d.name}\\b`).test(s.precondition || "")),
          runsAfter: h.after("Monitor_Undesired_State", e.name).includes(s.name),
          onlyOwnFindings: h.reads(s.precondition).every((n) => h.findingsOf(e.name).some((d) => d.name === n)),
          boolLiteral: boolLiteral(s.precondition),
        })),
      }));
    },
    expect: (rows) => {
      const r = (n) => rows.find((x) => x.name === n);
      const step = (n) => r(n).tests[0];
      const loincs = (n) => step(n).tests.map((x) => `${x.system}:${x.code}`);
      return (
        // all 17 ADE Enquiries, each after Display_Potential_ADEs, which lists one item per Enquiry
        sameSet(rows.map((x) => x.name), ADE_MONITORS) &&
        rows.every((x) => x.afterDisplay && x.displayItems === ADE_MONITORS.length) &&
        // every Enquiry collects at least one finding, each coded in SNOMED CT (Composer form SCT:<id> [<caption>])
        rows.every((x) => x.findings.length > 0 && x.findings.every((d) => /^SCT:\d{6,18} \[.+\]$/.test(d.coding || ""))) &&
        // R1: no finding is boolean; R5: no *_check_due item is collected
        rows.every((x) => x.findings.every((d) => d.type !== "boolean" && !/_check_due$/.test(d.name))) &&
        // exactly the approved test steps: LOINC coded (LNC:<code> [<caption>]), after their Enquiry, gated on that Enquiry's findings
        rows.reduce((n, x) => n + x.tests.length, 0) === 10 &&
        rows.every((x) => x.tests.length <= 1 && x.tests.every((s) => s.runsAfter && s.readsFindings && s.tests.every((c) => /^LNC:\d{1,7}-\d \[.+\]$/.test(c.coding || "")))) &&
        // R5 / R1: each test step reads only its own Enquiry's findings, never with a boolean literal
        rows.every((x) => x.tests.every((s) => s.onlyOwnFindings && !s.boolLiteral)) &&
        // spot checks from proposal 20261030 §6 and §7
        step("Monitor_Bleeding").kind === "decision" && step("Monitor_Bleeding").choice_mode === "multiple" &&
        sameSet(loincs("Monitor_Bleeding"), ["LNC:718-7", "LNC:4544-3"]) &&
        /systolic_bp < 90/.test(step("Monitor_Bleeding").precondition) &&
        r("Monitor_Bleeding").findings.some((d) => d.name === "systolic_bp" && d.type === "real") &&
        step("Monitor_Renal_Function").name === "Order_Serum_Creatinine" && loincs("Monitor_Renal_Function")[0] === "LNC:2160-0" &&
        step("Monitor_TTP").tests.length === 4 &&
        step("Monitor_PPI_Hypomagnesemia").tests.length === 3 &&
        ["Monitor_Spinal_Epidural_Hematoma", "Monitor_Perioperative_Interruption", "Monitor_Antiplatelet_Hypersensitivity",
         "Monitor_Ticagrelor_Dyspnea", "Monitor_PPI_Bone_Fracture", "Monitor_PPI_Cutaneous_Lupus"].every((n) => r(n).tests.length === 0)
      );
    },
  },
  // ------------------------------------------------------------------ CQ11
  {
    id: "CQ11",
    question:
      "For each ADE whose sources name no test, which data item flags a suspicion and which action alerts the clinician to examine further?",
    query: (g, h) =>
      h
        .monitorEnquiries()
        .filter((e) => h.testSteps(e.name).length === 0)
        .map((e) => ({
          name: e.name,
          enquiryCoding: h.coding(e),
          asks: h.findingsOf(e.name).map((d) => d.name),
          followUps: h.followUpsOf(e.name).map((f) => f.name),
          alerts: h.alertsOf(e.name).map((a) => {
            const t = h.task(a.name);
            return {
              ...a,
              suspectedItems: a.suspected.map((n) => {
                const d = h.data(n);
                return { name: n, yesNo: h.isYesNo(d), default_value: d?.default_value ?? null, asked_by: d?.asked_by ?? [], coding: h.coding(d) };
              }),
              gatedOnYes: a.suspected.every((n) => new RegExp(`\\b${n}\\s*=\\s*"yes"`).test(a.precondition || "")),
              runsAfter: h.after("Monitor_Undesired_State", e.name).includes(a.name),
              inPlan: t.used_by.includes("Monitor_Undesired_State"),
              role: h.meta(t, "role"),
              goal: h.goal(t),
              target: h.meta(t, "monitored_target"),
              ...order(h, t),
              procedure: t.procedure,
              sources: h.meta(t, "source", true),
              quotes: h.meta(t, "quote", true),
            };
          }),
          // every follow-up step of every ADE Enquiry, to check that only the no-test ADEs carry an alert
          _alertedEnquiries: h.alertsOf().map((a) => a.for),
        })),
    expect: (rows) =>
      // exactly the 7 approved no-test ADE Enquiries, and no other Enquiry has an alert
      sameSet(rows.map((r) => r.name), NO_TEST_ADES) &&
      sameSet(rows[0]._alertedEnquiries, NO_TEST_ADES) &&
      rows.every((r) => {
        const a = r.alerts[0];
        const item = a?.suspectedItems[0];
        return (
          // one follow-up step, the alert Alert_Further_Examination_<ADE>
          r.alerts.length === 1 && r.followUps.length === 1 && a.name === alertOf(r.name) &&
          // one suspicion item suspected_<ade>: yes/no text, asked by this Enquiry, default "no", coded like the Enquiry
          a.suspected.length === 1 && a.suspected[0] === suspectedOf(r.name) && r.asks.includes(item.name) &&
          item.yesNo && item.asked_by.includes(r.name) && item.default_value === '"no"' &&
          item.coding?.system === "SCT" && item.coding.code === r.enquiryCoding?.code &&
          // the alert: after its Enquiry, gated on suspected_<ade> = "yes", an order to examine further
          a.gatedOnYes && a.runsAfter && a.inPlan && a.role === "ade_alert" &&
          a.coding?.system === "SCT" && a.coding.code === r.enquiryCoding?.code &&
          a.goal.verb === "order" && new RegExp(`\\b${r.name}\\b`).test(a.target || "") &&
          /examination/i.test(a.code || "") && nonEmpty(a.timing) && nonEmpty(a.patient) && /examine/i.test(a.clinician || "") &&
          nonEmpty(a.procedure) && a.sources.length > 0 && a.sources.length === a.quotes.length && a.quotes.every(nonEmpty)
        );
      }),
  },

  // ------------------------------------------------------------------ CQ12
  {
    id: "CQ12",
    question: "Which data items are mandatory, and does each have a default that lets the guideline proceed?",
    query: (g, h) => {
      const unq = (v) => String(v ?? "").trim().replace(/^(["'])([\s\S]*)\1$/, "$2");
      const rangeVals = (d) => (d.range || []).map((v) => unq(v).split("||")[0].trim());
      // evaluate a plan precondition with every data item at its default (only data comparisons with and/or/not)
      const evalAtDefaults = (expr) => {
        if (!expr) return true;
        if (/result_of|netsupport/.test(expr)) return null;
        const js = expr
          .replace(/"[^"]*"|'[^']*'|[A-Za-z_][A-Za-z0-9_]*|<=|>=|<>|!=|=|<|>/g, (tok) => {
            if (/^["']/.test(tok)) return JSON.stringify(unq(tok));
            if (tok === "and") return "&&";
            if (tok === "or") return "||";
            if (tok === "not") return "!";
            if (tok === "=") return "===";
            if (tok === "<>" || tok === "!=") return "!==";
            if (/^[<>]=?$/.test(tok)) return tok;
            const d = h.data(tok);
            if (!d) throw new Error(`unknown name ${tok} in ${expr}`);
            return d.type === "text" ? JSON.stringify(unq(d.default_value)) : String(Number(unq(d.default_value)));
          });
        return Boolean(Function(`"use strict"; return (${js});`)());
      };
      const plans = h.tasks("plan");
      const planReads = new Set(plans.flatMap((p) => h.reads(p.precondition)));
      const enquiryItems = h.tasks("enquiry").flatMap((e) => e.sources.map((s) => ({ enquiry: e.name, ...s })));
      const mandatory = enquiryItems.filter((s) => s.mandatory !== false);
      const rowOf = (s) => {
        const d = h.data(s.data);
        const dv = d?.default_value ?? null;
        const gatedPlans = plans.filter((p) => h.reads(p.precondition).includes(s.data));
        return {
          name: s.data,
          enquiry: s.enquiry,
          mandatory: s.mandatory !== false,
          type: d?.type ?? null,
          default_value: dv,
          defaultInRange: dv != null && (!(d.range || []).length || rangeVals(d).includes(unq(dv))),
          gates: gatedPlans.map((p) => ({ plan: p.name, precondition: p.precondition, trueAtDefaults: evalAtDefaults(p.precondition) })),
        };
      };
      return [
        ...mandatory.map((s) => ({ ...rowOf(s), role: "mandatory" })),
        // the rest of the Enquiry items, to check R2/R3 across the guideline
        ...enquiryItems.filter((s) => s.mandatory === false).map((s) => ({ ...rowOf(s), role: "optional" })),
      ].map((r) => ({ ...r, _planReads: [...planReads], _enquiryItemCount: enquiryItems.length }));
    },
    expect: (rows) => {
      const mand = rows.filter((r) => r.role === "mandatory");
      const m = mand[0];
      return (
        // exactly one mandatory source: active_pathological_bleeding in Get_Antithrombotic_Data, the only plan-gating item
        mand.length === 1 &&
        m.name === "active_pathological_bleeding" && m.enquiry === "Get_Antithrombotic_Data" &&
        sameSet(rows[0]._planReads, ["active_pathological_bleeding"]) &&
        // its default "no" lets Antithrombotic_Therapy (precondition active_pathological_bleeding = "no") start
        m.default_value === '"no"' && m.defaultInRange &&
        m.gates.length === 1 && m.gates[0].plan === "Antithrombotic_Therapy" && m.gates[0].trueAtDefaults === true &&
        // every other Enquiry source is mandatory :: no, and every Enquiry item has a default within its range (R2, R3)
        rows.length === rows[0]._enquiryItemCount &&
        rows.every((r) => r.default_value != null && r.defaultInRange && r.type !== "boolean") &&
        rows.filter((r) => r.role === "optional").every((r) => r.gates.length === 0)
      );
    },
  },
];
