---
project: ccd-antiplatelet-monitoring
step: 2-3 (knowledge exploration + organization)
status: approved
date: 2026-10-29
sources: projects/ccd-antiplatelet-monitoring/resources/
---

# Extraction: antiplatelet and oral anticoagulant therapy in chronic coronary disease (2023 AHA/ACC CCD guideline §4.3.1) and the package inserts of its drugs

## 0. Sources

The user restricted the guideline source to **section 4.3.1, pages e50–e55** and asked for the package inserts of the drugs that section names. All sources are in `projects/ccd-antiplatelet-monitoring/resources/`.

| Key | File | What it is |
|---|---|---|
| G | `2023-aha-acc-ccd-section-4.3.1.md` (text of `2023-aha-acc-chronic-coronary-disease-guideline.pdf`, PDF pages 42–47) | Virani SS et al. 2023 AHA/ACC/ACCP/ASPC/NLA/PCNA Guideline for the Management of Patients With Chronic Coronary Disease. Circulation 2023;148:e9–e119, DOI 10.1161/CIR.0000000000001168. §4.3.1 Recs 1–16, Synopsis, Figure 9, supportive text |
| ASA | `2026-aspirin-otc-low-dose-package-insert.md` | Low-dose aspirin 81 mg OTC Drug Facts label (openFDA, 2026-09-09) |
| ASA-ER | `2015-aspirin-rx-durlaza-package-insert.md` | DURLAZA (aspirin ER 162.5 mg) US Prescribing Information (DailyMed, 2015); supplementary aspirin Rx label |
| CLO | `2025-clopidogrel-package-insert.md` | PLAVIX (clopidogrel) USPI (openFDA, 2025-05-30) |
| PRA | `2022-prasugrel-package-insert.md` | EFFIENT (prasugrel) USPI (openFDA, 2022-09-07) |
| TIC | `2026-ticagrelor-package-insert.md` | BRILINTA (ticagrelor) USPI (openFDA, 2026-05-07) |
| VOR | `2022-vorapaxar-package-insert.md` | ZONTIVITY (vorapaxar) USPI (DailyMed, 2022-10-19) |
| RIV | `2026-rivaroxaban-package-insert.md` | XARELTO (rivaroxaban) USPI (openFDA, 2026-09-10) |
| API | `2026-apixaban-package-insert.md` | ELIQUIS (apixaban) USPI (openFDA, 2026-04-24) |
| EDO | `2025-edoxaban-package-insert.md` | SAVAYSA (edoxaban) USPI (openFDA, 2025-07-10) |
| DAB | `2025-dabigatran-package-insert.md` | PRADAXA Capsules (dabigatran) USPI, adult label (DailyMed, 2025-06-30) |
| PAN | `2026-pantoprazole-package-insert.md` | PROTONIX (pantoprazole) USPI (openFDA, 2026-05-18); the PPI chosen by the user |

Case reports and mechanism-of-action harms are out of scope (not opted in). Page references for G use the journal pagination (e50 = PDF page 42).

## 1. Extraction table (guideline §4.3.1)

| # | Element | Source quote | Loc | Kind | CQ | Conf. |
|---|---|---|---|---|---|---|
| E01 | Aspirin 81 mg for CCD without OAC indication | "low-dose aspirin 81 mg (75-100 mg) is recommended to reduce atherosclerotic events" | e50 Rec 1 (COR 1, A) | candidate; therapy | CQ2 | high |
| E02 | DAPT (aspirin + clopidogrel) 6 months after PCI, then SAPT | "dual antiplatelet therapy (DAPT) consisting of aspirin and clopidogrel for 6 months post PCI followed by single antiplatelet therapy (SAPT)" | e50 Rec 2 (1, A) | candidate; therapy; step-down | CQ2 | high |
| E03 | Short DAPT then P2Y12 monotherapy after DES | "P2Y12 inhibitor monotherapy for at least 12 months is reasonable to reduce bleeding risk" | e50 Rec 3 (2a, A) | candidate | CQ2 | high |
| E04 | Extended DAPT after MI at low bleeding risk | "extended DAPT beyond 12 months for a period of up to 3 years may be reasonable to reduce MACE" | e50 Rec 4 (2b, A) | candidate | CQ2 | high |
| E05 | Vorapaxar added to aspirin after MI, no stroke/TIA/ICH | "vorapaxar may be added to aspirin therapy to reduce MACE" | e50 Rec 5 (2b, B-R) | candidate | CQ2 | high |
| E06 | DAPT after CABG | "the use of DAPT after CABG may be useful to reduce the incidence of saphenous vein graft occlusion" | e50 Rec 6 (2b, B-R) | decision argument | CQ2 | medium (no duration given) |
| E07 | No benefit: clopidogrel added to aspirin without recent ACS/PCI | "the addition of clopidogrel to aspirin therapy is not useful to reduce MACE" | e50 Rec 7 (3: No benefit, A) | against argument | CQ2 | high |
| E08 | Harm: vorapaxar with prior stroke/TIA/ICH | "vorapaxar should not be added to DAPT because of increased risk of major bleeding and ICH" | e50 Rec 8 (3: Harm, A) | excluding argument | CQ2 | high |
| E09 | Harm: prasugrel with prior stroke/TIA/ICH | "prasugrel should not be used because of risk of significant or fatal bleeding" | e50 Rec 9 (3: Harm, B-R) | excluding argument | CQ2 | high |
| E10 | Harm: chronic NSAIDs | "chronic nonsteroidal anti-inflammatory drugs should not be used because of increased cardiovascular and bleeding complications" | e50 Rec 10 (3: Harm, B-R) | therapy (avoid); monitor | CQ6 | high |
| E11 | OAC + elective PCI: DAPT 1–4 wk, clopidogrel to 6 mo, plus DOAC | "DAPT for 1 to 4 weeks followed by clopidogrel alone for 6 months should be administered in addition to DOAC" | e50 Rec 11 (1, B-R) | candidate; step-down | CQ2 | high |
| E12 | OAC + PCI: aspirin up to 1 month if high thrombotic and low bleeding risk | "continuing aspirin in addition to clopidogrel for up to 1 month is reasonable if the patient has a high thrombotic risk and low bleeding risk" | e50 Rec 12 (2a, B-R) | procedure detail | CQ2 | high |
| E13 | OAC, low atherothrombotic risk: DOAC alone 1 year after PCI | "discontinuation of aspirin therapy with continuation of DOAC alone may be considered 1 year after PCI to reduce bleeding risk" | e50 Rec 13 (2b, B-R) | candidate; step-down | CQ2 | high |
| E14 | OAC, no acute antiplatelet indication: DOAC monotherapy | "DOAC monotherapy may be considered if there is no acute indication for concomitant antiplatelet therapy" | e50 Rec 14 (2b, C-LD) | candidate | CQ2 | high |
| E15 | Aspirin + low-dose rivaroxaban, high ischemic / low-moderate bleeding risk | "the addition of low-dose rivaroxaban 2.5 mg twice daily to aspirin 81 mg daily is reasonable for long-term reduction of risk for MACE" | e50 Rec 15 (2a, B-R) | candidate | CQ2 | high |
| E16 | PPI on DAPT | "In patients with CCD on DAPT, the use of a PPI can be effective in reducing gastrointestinal bleeding risk" | e50 Rec 16 (2a, B-R) | therapy (avoid) | CQ7 | high |
| E17 | Bleeding-risk scores guide choice and duration | "The use of validated risk scores to address bleeding risk can be useful in choice and duration of antiplatelet therapy." | e50 Synopsis | data item description; step-down monitor | CQ1, CQ5 | high |
| E18 | Figure 9: durations by pathway (no PCI → aspirin; prior ACS → DAPT then 12–36 mo; PCI low/mod risk → DES DAPT 6 mo then SAPT; PCI high bleeding risk → DAPT 1–3 mo then P2Y12 to 12 mo then SAPT; OAC + PCI → triple ≤1 mo, DOAC + clopidogrel to 6 mo, then DOAC alone; OAC no PCI → DOAC alone) | figure, no verbatim prose | e51 Fig 9 | candidates; step-down | CQ2, CQ5 | high (read from the figure) |
| E19 | Clopidogrel as alternative when aspirin not tolerated | "As an alternative to low-dose aspirin, clopidogrel may be used in individuals who cannot tolerate aspirin therapy" | e51 text 1 | candidate | CQ2 | high |
| E20 | Higher thrombotic risk features (lesions, stent length, left main, etc.) | "longer duration DAPT may be needed for patients with higher thrombotic risk" | e52 text 3 | data item description | CQ1 | medium |
| E21 | PEGASUS: ticagrelor 60 mg after MI | "Treatment with ticagrelor 60 mg reduced the risk of cardiovascular death, MI, or stroke by 16% and increased the risk of major bleeding" | e52 text 4 | therapy (ticagrelor) | CQ2 | high |
| E22 | Prasugrel FDA warning (stroke/TIA, active bleeding) | "Prasugrel can cause significant, sometimes fatal, bleeding and should not be used in patients with active pathological bleeding or with a history of TIA or stroke." | e53 text 9 | excluding argument; data item | CQ2 | high |
| E23 | DOAC doses in PCI/AF context | "apixaban 5 mg twice daily or 2.5 mg twice daily in those with 2 of 3 criteria for high bleeding risk" (plus rivaroxaban 15 mg, edoxaban 60/30 mg, dabigatran 110/150 mg) | e54 text 11 | DOAC procedure | CQ2 | high (see open question Q4 on label differences) |
| E24 | COMPASS high-risk definition | "multivessel CAD and at least one of the following: diabetes requiring medication, recurrent MI, peripheral artery disease, HF, or CKD" | e55 text 15 | high_thrombotic_risk description | CQ1 | high |
| E25 | Rivaroxaban + aspirin bleeding | "The combination of rivaroxaban plus aspirin resulted in a higher risk of major bleeding compared with aspirin monotherapy" | e55 text 15 | bleeding monitor | CQ3 | high |
| E26 | GI bleeding is common on DAPT | "Increased bleeding including gastrointestinal bleeding is a common side effect of DAPT" | e55 text 16 | bleeding monitor | CQ3 | high |
| E27 | Avoid omeprazole/esomeprazole with clopidogrel | "The FDA has added a boxed warning to avoid use of omeprazole with clopidogrel as well as other potent CYP 2C19 inhibitors, including esomeprazole." | e55 text 16 | interaction monitor; PPI choice | CQ6 | high |
| E28 | Section 4.3.1 gives **no monitoring schedule** for any antithrombotic, its effect or its ADEs | — | e50–e55 | gap → monitoring frequencies are proposed (§3) | CQ3 | high |

## 2. Systematic label coverage (every Boxed Warning, contraindication and W&P section)

Disposition: **M** = monitoring action (§3), **D** = Decision argument or data item, **P** = therapy-action procedure, **X** = excluded (§10 of the proposal, with reason).

| Label | Section | Disposition |
|---|---|---|
| ASA (OTC) | Reye's syndrome | X (children/teens; CIG population is adults) |
| ASA | Allergy alert; Do not use if allergic; Stop use if allergic reaction | M `Monitor_Antiplatelet_Hypersensitivity`; D `aspirin_intolerance` |
| ASA | Stomach bleeding warning; Stop use for signs of stomach bleeding | M `Monitor_Bleeding` |
| ASA | Ask a doctor (HTN, heart disease, cirrhosis, kidney disease, diuretic, asthma); Ask doctor/pharmacist (gout, diabetes, arthritis drugs) | X (OTC self-selection prompts; the CIG's aspirin is clinician-prescribed and reviewed at each visit) |
| ASA | Stop use: ringing in the ears / hearing loss | X (salicylism at analgesic doses; 81 mg) |
| ASA | Pregnancy (last 3 months); overdose | X (pregnancy out of scope; overdose is not a monitoring item) |
| ASA-ER | §4 NSAID hypersensitivity; asthma-rhinitis-nasal polyps | D `aspirin_intolerance`; M `Monitor_Antiplatelet_Hypersensitivity` |
| ASA-ER | §5.1 Risk of bleeding; §5.2 Peptic ulcer disease | M `Monitor_Bleeding` |
| ASA-ER | §5.3 Fetal toxicity | X (pregnancy out of scope) |
| ASA-ER | §7 RAS inhibitors: "Monitor renal function periodically" | X (DURLAZA 162.5 mg ER is not the product the guideline recommends; the instruction is NSAID-dose specific) |
| CLO | Boxed Warning: CYP2C19 poor metabolizers | M `Monitor_CYP2C19_Poor_Metabolizer` |
| CLO | §4.1 active bleeding; §4.2 hypersensitivity | D `active_pathological_bleeding` (Therapy plan gate); M `Monitor_Antiplatelet_Hypersensitivity` |
| CLO | §5.1 Diminished activity with impaired CYP2C19 (omeprazole/esomeprazole) | M `Monitor_Drug_Interactions` (+ `Monitor_CYP2C19_Poor_Metabolizer`) |
| CLO | §5.2 General risk of bleeding | M `Monitor_Bleeding` |
| CLO | §5.3 Discontinuation | M `Monitor_Antithrombotic_Adherence`, `Monitor_Perioperative_Interruption` |
| CLO | §5.4 TTP | M `Monitor_TTP` |
| CLO | §5.5 Cross-reactivity among thienopyridines | M `Monitor_Antiplatelet_Hypersensitivity` |
| PRA | Boxed Warning: bleeding; no use with active bleeding or prior TIA/stroke; age ≥75; CABG; weight <60 kg; hypotension after procedures | M `Monitor_Bleeding`, `Monitor_Perioperative_Interruption`; D excluding/against arguments (`prior_stroke_or_tia`, `prior_ich`, `age_years`); P 5 mg for <60 kg |
| PRA | §4.1 active bleeding; §4.2 prior TIA or stroke; §4.3 hypersensitivity | D; M `Monitor_Ischemic_Events` (stop on new stroke/TIA); M `Monitor_Antiplatelet_Hypersensitivity` |
| PRA | §5.1 General risk of bleeding | M `Monitor_Bleeding` |
| PRA | §5.2 CABG-related bleeding | M `Monitor_Perioperative_Interruption` |
| PRA | §5.3 Discontinuation | M `Monitor_Antithrombotic_Adherence` |
| PRA | §5.4 TTP | M `Monitor_TTP` |
| PRA | §5.5 Hypersensitivity including angioedema | M `Monitor_Antiplatelet_Hypersensitivity` |
| TIC | Boxed Warning: bleeding; prior ICH; urgent CABG | M `Monitor_Bleeding`, `Monitor_Perioperative_Interruption`; D excluding argument (`prior_ich`) |
| TIC | §4.1 history of ICH; §4.2 active bleeding; §4.3 hypersensitivity | D; M `Monitor_Antiplatelet_Hypersensitivity` |
| TIC | §5.1 Risk of bleeding | M `Monitor_Bleeding` |
| TIC | §5.2 Discontinuation in CAD | M `Monitor_Antithrombotic_Adherence`, `Monitor_Perioperative_Interruption` |
| TIC | §5.3 Dyspnea | M `Monitor_Ticagrelor_Dyspnea` |
| TIC | §5.4 Bradyarrhythmias | M `Monitor_Ticagrelor_Bradyarrhythmia` |
| TIC | §5.5 Severe hepatic impairment | X (a pre-prescription restriction with no monitoring instruction; hepatic status is not among §4.3.1's criteria) |
| TIC | §5.6 Central sleep apnea | M `Monitor_Ticagrelor_Central_Sleep_Apnea` |
| TIC | §5.7 Laboratory test interference (HIT functional tests) | X (not an adverse effect; a lab-interpretation note) |
| TIC | §2/§17 aspirin ≤100 mg; §7 CYP3A, statins, digoxin | M `Monitor_Drug_Interactions` |
| VOR | Boxed Warning: bleeding; no use after stroke/TIA/ICH or with active bleeding | M `Monitor_Bleeding`; D excluding argument |
| VOR | §4.1 history of stroke/TIA/ICH (stop if one occurs); §4.2 active bleeding | D; M `Monitor_Ischemic_Events` |
| VOR | §5.1 General risk of bleeding | M `Monitor_Bleeding` |
| VOR | §5.2 Strong CYP3A inhibitors or inducers | M `Monitor_Drug_Interactions` |
| RIV | Boxed Warning (A) premature discontinuation; §5.1 | M `Monitor_Antithrombotic_Adherence` |
| RIV | Boxed Warning (B) spinal/epidural hematoma; §5.3 | M `Monitor_Spinal_Epidural_Hematoma` |
| RIV | §4 active bleeding; severe hypersensitivity | D (Therapy plan gate); X hypersensitivity (anaphylaxis to the DOAC is a contraindication with no monitoring instruction) |
| RIV | §5.2 Risk of bleeding (PT/INR/aPTT/anti-FXa monitoring not recommended) | M `Monitor_Bleeding` |
| RIV | §5.4 Renal impairment | M `Monitor_Renal_Function` |
| RIV | §5.5 Hepatic impairment | X (pre-prescription restriction, no monitoring instruction; see Q6) |
| RIV | §5.6 P-gp and strong CYP3A inhibitors/inducers | M `Monitor_Drug_Interactions` |
| RIV | §5.7 Pregnancy-related hemorrhage | X (pregnancy out of scope) |
| RIV | §5.8 Prosthetic heart valves / TAVR | X (DOAC eligibility, outside §4.3.1; see Q6) |
| RIV | §5.9 Acute PE | X (not a CCD indication) |
| RIV | §5.10 Triple-positive APS | X (DOAC eligibility; see Q6) |
| API | Boxed Warnings (A), (B); §5.1; §5.3 | M `Monitor_Antithrombotic_Adherence`, `Monitor_Spinal_Epidural_Hematoma` |
| API | §4 active bleeding; severe hypersensitivity | D; X hypersensitivity (as RIV) |
| API | §5.2 Bleeding | M `Monitor_Bleeding` |
| API | §5.4 Prosthetic valves; §5.5 Acute PE; §5.6 APS | X (as RIV) |
| API | §2.1 dose reduction (age, weight, creatinine); §2.6/§7 combined P-gp + strong CYP3A4 | M `Monitor_Renal_Function`, `Monitor_Drug_Interactions` |
| EDO | Boxed Warning (A) / §5.1 reduced efficacy if CrCl >95 | M `Monitor_Renal_Function` |
| EDO | Boxed Warning (B) / §5.2 discontinuation | M `Monitor_Antithrombotic_Adherence` |
| EDO | Boxed Warning (C) / §5.4 spinal/epidural hematoma | M `Monitor_Spinal_Epidural_Hematoma` |
| EDO | §4 active bleeding | D |
| EDO | §5.3 Risk of bleeding | M `Monitor_Bleeding` |
| EDO | §5.5 Mechanical valves / mitral stenosis; §5.6 APS | X (as RIV) |
| DAB | Boxed Warning (A) / §5.1; (B) / §5.3 | M `Monitor_Antithrombotic_Adherence`, `Monitor_Spinal_Epidural_Hematoma` |
| DAB | §4 active bleeding; hypersensitivity; mechanical valve | D; X (as RIV) |
| DAB | §5.2 Risk of bleeding | M `Monitor_Bleeding` |
| DAB | §2.4 renal assessment | M `Monitor_Renal_Function` |
| DAB | §5.4 Prosthetic valves; §5.6 APS | X (as RIV) |
| DAB | §5.5 P-gp inducers and inhibitors | M `Monitor_Drug_Interactions` |
| DAB | GI adverse reactions (dyspepsia, gastritis; §6, §17) | X (adverse reaction, not a W&P section; GI bleeding signs are in `Monitor_Bleeding`) |
| PAN | §4 hypersensitivity; rilpivirine | X (contraindications with no monitoring instruction; rilpivirine is outside the CIG's medication scope) |
| PAN | §5.1 Presence of gastric malignancy | X (applies to symptom response when a PPI treats GI symptoms; here the PPI is prophylaxis) |
| PAN | §5.2 Acute tubulointerstitial nephritis | M `Monitor_PPI_Interstitial_Nephritis` |
| PAN | §5.3 C. difficile-associated diarrhea | M `Monitor_PPI_CDAD` |
| PAN | §5.4 Bone fracture | M `Monitor_PPI_Bone_Fracture` |
| PAN | §5.5 Severe cutaneous adverse reactions | M `Monitor_PPI_Severe_Cutaneous_Reactions` |
| PAN | §5.6 Cutaneous and systemic lupus erythematosus | M `Monitor_PPI_Cutaneous_Lupus` |
| PAN | §5.7 Vitamin B12 deficiency | X (label risk is "longer than 3 years"; in this CIG the PPI stops with DAPT, which lasts at most 3 years, Rec 4) |
| PAN | §5.8 Hypomagnesemia and mineral metabolism | M `Monitor_PPI_Hypomagnesemia` |
| PAN | §5.9 Tumorigenicity | X (rodent finding; no human monitoring instruction) |
| PAN | §5.10 Fundic gland polyps | X (no monitoring instruction; the "shortest duration" message is carried by `Monitor_PPI_Continued_Need`) |
| PAN | §5.11 CgA test interference; §5.12 THC urine screen; §5.13 methotrexate | X (test-interpretation notes and an interaction outside the CIG's medication scope) |
| PAN | §7 clopidogrel: no clinically important interaction | P `Prescribe_PPI` (why pantoprazole) |

## 3. Monitoring actions

Field order: ServiceRequest code / occurrenceTiming / patientInstruction / performerInstruction, then provenance. `ServiceRequest.intent=order` on every action. Every `goal.noun_phrase` repeats the five ServiceRequest fields. No value contains `;`.

Precondition shorthands used below (all type-checked against a probe file with `check-expression`):

- `R` = `Antithrombotic_Regimen_Decision`
- **PPI_SET** = `result_of(Antithrombotic_Regimen_Decision) = DAPT or result_of(Antithrombotic_Regimen_Decision) = Short_DAPT_then_P2Y12_Monotherapy or result_of(Antithrombotic_Regimen_Decision) = Extended_DAPT or result_of(Antithrombotic_Regimen_Decision) = DOAC_plus_Antiplatelet`
- **ANTICOAG_SET** = `result_of(Antithrombotic_Regimen_Decision) = Aspirin_plus_Low_Dose_Rivaroxaban or result_of(Antithrombotic_Regimen_Decision) = DOAC_plus_Antiplatelet or result_of(Antithrombotic_Regimen_Decision) = DOAC_Monotherapy`

### 3.1 `Monitor_Antithrombotic_Adherence` (Monitor_Actions, category=action_completion)
- code: antithrombotic adherence review (each prescribed antiplatelet or anticoagulant taken daily as prescribed, with no unplanned interruption)
- occurrenceTiming: each follow-up visit, at 1, 3, 6 and 12 months after starting or changing the regimen, then every 6 to 12 months
- patientInstruction: take each antiplatelet or anticoagulant every day as prescribed and do not stop or skip it without talking to the prescribing clinician, including before dental or other procedures
- performerInstruction: if a lapse or unplanned stop is found, restart as soon as medically appropriate, and if an oral anticoagulant was stopped for a reason other than bleeding or completed therapy consider coverage with another anticoagulant
- precondition: none. applies_when: all_patients_on_therapy
- monitored_target: completion of the prescribed antithrombotic regimen (Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban, Prescribe_DOAC)
- provenance_type: assistant_completed_from_guidelines. source_kind: package_insert. knowledge_origin: drug label warnings on premature discontinuation, operationalized as a visit check by the assistant. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: proposed_by_assistant
- source.1: XARELTO (rivaroxaban) US Prescribing Information 2026, Boxed Warning (A) and §5.1 — quote.1: Boxed Warning (A): "Premature discontinuation of any oral anticoagulant, including XARELTO, increases the risk of thrombotic events."
- source.2: EFFIENT (prasugrel) US Prescribing Information 2022, §5.3 Discontinuation — quote.2: §5.3: "Lapses in therapy should be avoided"
- source.3: ZONTIVITY (vorapaxar) US Prescribing Information 2022, §17 — quote.3: §17: "Inform patients not to discontinue ZONTIVITY without discussing it with the prescribing physician."
- literature_basis: the DOAC labels warn that premature discontinuation increases thrombotic events and advise anticoagulant coverage, and the P2Y12 and vorapaxar labels tell clinicians to avoid lapses and patients not to stop without the prescriber
- assistant_invention: the visit cadence (aligned with the Figure 9 transition points at 1, 3, 6 and 12 months) and the adherence interview as the instrument
- instrument: clinician interview with pharmacy refill check
- monitoring_frequency_basis: proposed, tied to the regimen transition points of Figure 9 (1, 3, 6 and 12 months) and then routine CCD follow-up; the guideline and labels give no cadence
- trigger: an unplanned stop or missed doses of an antithrombotic
- cq: CQ5, CQ8

### 3.2 `Monitor_Regimen_Duration` (Monitor_Actions, category=action_completion)
- code: antithrombotic regimen duration and step-down review against Figure 9, with bleeding and ischemic risk reassessment by a validated score (PRECISE-DAPT, DAPT or PARIS)
- occurrenceTiming: at 1, 3, 6 and 12 months after PCI or ACS, then every 12 months
- patientInstruction: do not stop or add an antiplatelet or anticoagulant on your own and bring all your medicines to each review so the clinician can confirm which ones continue
- performerInstruction: step down as planned, without an anticoagulant go from DAPT to single antiplatelet therapy at 6 months after PCI (Rec 2) or stop aspirin after 1 to 3 months for high bleeding risk with a drug-eluting stent (Rec 3), with an anticoagulant stop aspirin after 1 to 4 weeks (up to 1 month if high thrombotic and low bleeding risk, Rec 11 and 12) and clopidogrel at 6 months, consider DOAC alone 1 year after PCI (Rec 13), and reassess extended DAPT, vorapaxar and low-dose rivaroxaban every year
- precondition: none. applies_when: all_patients_on_therapy
- monitored_target: completion of the regimen durations chosen by Antithrombotic_Regimen_Decision and delivered by Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban and Prescribe_DOAC
- provenance_type: assistant_completed_from_guidelines. source_kind: clinical_guideline. knowledge_origin: guideline durations (Recs 2, 3, 11–13, Figure 9) and the Synopsis on risk scores. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: proposed_by_assistant
- source.1: 2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), §4.3.1 Rec 2 (p.e50) — quote.1: p.e50, Rec 2: "dual antiplatelet therapy (DAPT) consisting of aspirin and clopidogrel for 6 months post PCI followed by single antiplatelet therapy (SAPT) is indicated"
- source.2: same guideline, §4.3.1 Rec 11 (p.e50) — quote.2: p.e50, Rec 11: "DAPT for 1 to 4 weeks followed by clopidogrel alone for 6 months should be administered in addition to DOAC"
- source.3: same guideline, §4.3.1 Synopsis (p.e50) — quote.3: p.e50, Synopsis: "The use of validated risk scores to address bleeding risk can be useful in choice and duration of antiplatelet therapy."
- literature_basis: the guideline fixes the duration of each regimen (Figure 9, Recs 2, 3, 11 to 13) and says validated bleeding-risk scores help choose the duration, but gives no review schedule
- assistant_invention: the review points (1, 3, 6, 12 months, then yearly) and the yearly reassessment of the 2b add-on options
- instrument: clinician medication review with a validated bleeding-risk score (PRECISE-DAPT, DAPT or PARIS)
- monitoring_frequency_basis: the review points are the step-down times of Figure 9 (1 month, 1 to 3 months, 6 months, 12 months), then yearly
- trigger: a bleeding or new ischemic event prompts an earlier review
- cq: CQ2, CQ5, CQ8

### 3.3 `Monitor_NSAID_Avoidance` (Monitor_Actions, category=action_completion)
- code: chronic NSAID use check (prescription and over-the-counter, including ibuprofen, naproxen, diclofenac and coxibs)
- occurrenceTiming: each follow-up visit and whenever a new pain medicine is started
- patientInstruction: do not take ibuprofen, naproxen, diclofenac, celecoxib or other NSAID pain relievers regularly and ask your clinician or pharmacist before taking any over-the-counter pain medicine
- performerInstruction: if chronic NSAID use is found, advise stopping it and review the pain indication for a non-NSAID option
- precondition: none. applies_when: all_patients_on_therapy
- monitored_target: avoidance of chronic NSAIDs (avoid goal of Advise_Avoid_Chronic_NSAIDs)
- provenance_type: assistant_completed_from_guidelines. source_kind: clinical_guideline_plus_package_insert. knowledge_origin: guideline Rec 10 and the clopidogrel label interaction. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: proposed_by_assistant
- source.1: 2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), §4.3.1 Rec 10 (p.e50) — quote.1: p.e50, Rec 10: "chronic nonsteroidal anti-inflammatory drugs should not be used because of increased cardiovascular and bleeding complications"
- source.2: PLAVIX (clopidogrel) US Prescribing Information 2025, §7.4 NSAIDs — quote.2: §7.4: "Coadministration of Plavix and NSAIDs increases the risk of gastrointestinal bleeding."
- literature_basis: the guideline says chronic NSAIDs should not be used in CCD (3: Harm), and the antithrombotic labels add the bleeding interaction, but neither says how to check
- assistant_invention: the medication check at each visit
- instrument: clinician medication reconciliation
- monitoring_frequency_basis: proposed, at each routine visit because NSAIDs are often bought over the counter
- trigger: none
- cq: CQ6, CQ8

### 3.4 `Monitor_PPI_Continued_Need` (Monitor_Actions, category=action_completion)
- code: review of continued pantoprazole need during combined antithrombotic therapy
- occurrenceTiming: each follow-up visit and whenever DAPT or antiplatelet plus anticoagulant therapy is stepped down
- patientInstruction: keep taking pantoprazole while you take two blood thinners and ask at each visit whether you still need it
- performerInstruction: continue pantoprazole while the patient is on DAPT or an antiplatelet plus an anticoagulant, and when that combination ends stop it unless another indication remains, using the shortest PPI duration appropriate to the condition
- precondition: PPI_SET. applies_when: all_patients_on_therapy (the patients on Prescribe_PPI)
- monitored_target: delivery and timely stop of gastroprotection (avoid goal of Prescribe_PPI)
- provenance_type: assistant_completed_from_guidelines. source_kind: clinical_guideline_plus_package_insert. knowledge_origin: guideline Rec 16 and the pantoprazole label. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: proposed_by_assistant
- source.1: 2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), §4.3.1 Rec 16 (p.e50) — quote.1: p.e50, Rec 16: "In patients with CCD on DAPT, the use of a PPI can be effective in reducing gastrointestinal bleeding risk"
- source.2: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.10 Fundic Gland Polyps — quote.2: §5.10: "Use the shortest duration of PPI therapy appropriate to the condition being treated."
- literature_basis: the guideline supports a PPI while on DAPT, and the label asks for the shortest PPI duration appropriate to the condition
- assistant_invention: tying the stop of the PPI to the end of the combined antithrombotic therapy
- instrument: clinician medication review
- monitoring_frequency_basis: proposed, at each visit and at each step-down of Figure 9
- trigger: none
- cq: CQ7, CQ8

### 3.5 `Monitor_Ischemic_Events` (Monitor_Desired_State, category=desired_outcome)
- code: ischemic event review (angina or equivalent symptoms, myocardial infarction, stroke or TIA, stent thrombosis, unplanned revascularization)
- occurrenceTiming: each follow-up visit, at 1, 3, 6 and 12 months after starting or changing the regimen, then every 6 to 12 months, with same-day assessment of new symptoms
- patientInstruction: call emergency services for chest pain or pressure at rest, sudden weakness or numbness, trouble speaking or loss of vision, and report any change in your usual angina at each visit
- performerInstruction: assess suspected ACS or stroke urgently with ECG, troponin or neuroimaging, discontinue vorapaxar or prasugrel if a stroke, TIA or ICH occurs on it, and reassess the antithrombotic regimen after any ischemic event
- precondition: none. applies_when: all_patients_on_therapy
- monitored_target: MACE and atherosclerotic events (achieve goals of Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban and Prescribe_DOAC)
- provenance_type: assistant_completed_from_guidelines. source_kind: clinical_guideline_plus_package_insert. knowledge_origin: the therapy goals of the guideline, and the vorapaxar and prasugrel label stop rules. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: proposed_by_assistant
- source.1: 2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), §4.3.1 Rec 1 (p.e50) — quote.1: p.e50, Rec 1: "low-dose aspirin 81 mg (75-100 mg) is recommended to reduce atherosclerotic events"
- source.2: ZONTIVITY (vorapaxar) US Prescribing Information 2022, §4.1 — quote.2: §4.1: "Discontinue ZONTIVITY in patients who experience a stroke, TIA, or ICH"
- source.3: EFFIENT (prasugrel) US Prescribing Information 2022, §4.2 — quote.3: §4.2: "Patients who experience a stroke or TIA while on Effient generally should have therapy discontinued"
- literature_basis: every antithrombotic in §4.3.1 is recommended to reduce MACE or atherosclerotic events, so the desired outcome is the absence of ischemic events, and the vorapaxar and prasugrel labels require stopping the drug if a stroke, TIA or ICH occurs
- assistant_invention: the event review at each visit, the visit cadence, and ECG, troponin or neuroimaging as triggered tests
- instrument: clinician interview with ECG, troponin or neuroimaging on suspected events
- monitoring_frequency_basis: proposed, at the Figure 9 transition points then routine CCD follow-up; the guideline gives no cadence in §4.3.1
- trigger: new or worsening chest pain, or stroke or TIA symptoms
- cq: CQ4, CQ5, CQ8

### 3.6 `Monitor_Bleeding` (Monitor_Undesired_State, category=undesired_ade)
- code: bleeding symptom review with hemoglobin and hematocrit on suspected blood loss
- occurrenceTiming: each follow-up visit, with same-day evaluation of bleeding symptoms or unexplained hypotension
- patientInstruction: report any unusual, prolonged or excessive bleeding or bruising, blood in the urine, red or black tarry stools, vomiting blood or coffee-ground material, coughing up blood, fainting or a sudden severe headache, and seek emergency care for heavy bleeding
- performerInstruction: promptly evaluate signs of blood loss with hemoglobin and hematocrit, suspect bleeding in any hypotensive patient after angiography, PCI, CABG or surgery, stop an anticoagulant for active pathological bleeding, manage antiplatelet-related bleeding without stopping the antiplatelet when possible, and do not use PT, INR, aPTT or anti-factor Xa levels to monitor a DOAC
- precondition: none. applies_when: all_patients_on_therapy
- monitored_target: bleeding, including gastrointestinal and intracranial bleeding, as an adverse effect of Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban and Prescribe_DOAC (and the avoid goal of Prescribe_PPI)
- provenance_type: package_insert_specified. source_kind: clinical_guideline_plus_package_insert. knowledge_origin: guideline text 16 and every antithrombotic label's bleeding warning. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: recommended
- source.1: 2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), §4.3.1 supportive text 16 (p.e55) — quote.1: p.e55, text 16: "Increased bleeding including gastrointestinal bleeding is a common side effect of DAPT"
- source.2: XARELTO (rivaroxaban) US Prescribing Information 2026, §5.2 Risk of Bleeding — quote.2: §5.2: "Promptly evaluate any signs or symptoms of blood loss and consider the need for blood replacement."
- source.3: EFFIENT (prasugrel) US Prescribing Information 2022, §5.1 General Risk of Bleeding — quote.3: §5.1: "Suspect bleeding in any patient who is hypotensive and has recently undergone coronary angiography, PCI, CABG, or other surgical procedures"
- source.4: BRILINTA (ticagrelor) US Prescribing Information 2026, Boxed Warning — quote.4: Boxed Warning: "If possible, manage bleeding without discontinuing BRILINTA."
- source.5: SAVAYSA (edoxaban) US Prescribing Information 2025, §5.3 Risk of Bleeding — quote.5: §5.3: "The anticoagulant effect of SAVAYSA cannot be reliably monitored with standard laboratory testing."
- source.6: Low Dose Aspirin 81 mg OTC Drug Facts label 2026, Stop use — quote.6: Stop use: "signs of stomach bleeding: feel faint vomit blood have bloody or black stool have stomach pain that does not get better"
- source.7: ZONTIVITY (vorapaxar) US Prescribing Information 2022, Boxed Warning — quote.7: Boxed Warning: "Antiplatelet agents, including ZONTIVITY, increase the risk of bleeding, including ICH and fatal bleeding"
- source.8: PLAVIX (clopidogrel) US Prescribing Information 2025, §5.2 General Risk of Bleeding — quote.8: §5.2: "P2Y12 inhibitors (thienopyridines), including Plavix, increase the risk of bleeding."
- literature_basis: the guideline names GI bleeding as a common side effect of DAPT, every antithrombotic label warns of serious bleeding and tells clinicians to promptly evaluate signs of blood loss, the P2Y12 labels say to manage bleeding without stopping when possible, and the DOAC labels say their effect cannot be monitored with standard coagulation tests
- assistant_invention: the symptom question at each scheduled visit (the labels state prompt evaluation of signs but no visit cadence) and hemoglobin and hematocrit as the triggered test for the antiplatelets
- instrument: patient symptom report with hemoglobin and hematocrit on suspicion
- monitoring_frequency_basis: symptom review at every visit because bleeding is the most frequent serious ADE of every drug in the CIG, with event-driven testing as the labels direct
- trigger: bleeding symptoms, unexplained hypotension or a fall in hemoglobin
- cq: CQ3, CQ5, CQ8

### 3.7 `Monitor_Drug_Interactions` (Monitor_Undesired_State, category=undesired_ade)
- code: interacting medication review (PPI choice with clopidogrel, aspirin dose with ticagrelor, CYP3A and P-gp inhibitors or inducers, other anticoagulants, SSRIs and SNRIs)
- occurrenceTiming: at initiation, at each follow-up visit and whenever a new medicine is started
- patientInstruction: tell every clinician and pharmacist that you take an antiplatelet or anticoagulant and check with them before starting any prescription, over-the-counter medicine or herbal product such as St. John's wort
- performerInstruction: avoid omeprazole and esomeprazole with clopidogrel, keep aspirin at 100 mg or less daily with ticagrelor, avoid strong CYP3A inhibitors or inducers with ticagrelor and vorapaxar, avoid combined P-gp and strong CYP3A inhibitors or inducers with rivaroxaban and apixaban (or reduce the apixaban dose by 50 percent per its label), avoid P-gp inducers with dabigatran and rifampin with edoxaban, monitor digoxin levels when ticagrelor is started or changed, and weigh the added bleeding risk of SSRIs, SNRIs and other anticoagulants
- precondition: none. applies_when: all_patients_on_therapy
- monitored_target: loss of antithrombotic effect or excess bleeding from drug interactions with Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban and Prescribe_DOAC
- provenance_type: package_insert_specified. source_kind: clinical_guideline_plus_package_insert. knowledge_origin: guideline text 16 and the drug labels' interaction warnings. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: recommended
- source.1: 2023 AHA/ACC CCD Guideline (Virani et al., DOI 10.1161/CIR.0000000000001168), §4.3.1 supportive text 16 (p.e55) — quote.1: p.e55, text 16: "The FDA has added a boxed warning to avoid use of omeprazole with clopidogrel as well as other potent CYP 2C19 inhibitors, including esomeprazole."
- source.2: PLAVIX (clopidogrel) US Prescribing Information 2025, §5.1 — quote.2: §5.1: "Avoid concomitant use of Plavix with omeprazole or esomeprazole because both significantly reduce the antiplatelet activity of Plavix"
- source.3: BRILINTA (ticagrelor) US Prescribing Information 2026, §17 — quote.3: §17: "Advise patients daily doses of aspirin should not exceed 100 mg and to avoid taking any other medications that contain aspirin."
- source.4: ZONTIVITY (vorapaxar) US Prescribing Information 2022, §5.2 — quote.4: §5.2: "Avoid concomitant use of ZONTIVITY with strong CYP3A inhibitors or inducers"
- source.5: XARELTO (rivaroxaban) US Prescribing Information 2026, §5.6 — quote.5: §5.6: "Avoid concomitant use of XARELTO with known combined P-gp and strong CYP3A inhibitors"
- source.6: PRADAXA (dabigatran) Capsules US Prescribing Information 2025, §5.5 — quote.6: §5.5: "P-gp inhibition and impaired renal function are the major independent factors that result in increased exposure to dabigatran"
- source.7: BRILINTA (ticagrelor) US Prescribing Information 2026, §7.5 Digoxin — quote.7: §7.5: "monitor digoxin levels with initiation of or change in BRILINTA therapy"
- source.8: Low Dose Aspirin 81 mg OTC Drug Facts label 2026, Stomach bleeding warning (rev 3, advisory A6) — quote.8: Stomach bleeding warning: "take a blood thinning (anticoagulant) or steroid drug"
- literature_basis: the guideline repeats the FDA warning against omeprazole and esomeprazole with clopidogrel, and each label names interactions to avoid (aspirin over 100 mg with ticagrelor, strong CYP3A modulators with ticagrelor and vorapaxar, combined P-gp and CYP3A modulators with rivaroxaban and apixaban, P-gp modulators with dabigatran and edoxaban) plus digoxin level monitoring with ticagrelor
- assistant_invention: grouping the label interaction warnings into one medication-reconciliation task at each visit and at each new medicine
- instrument: medication reconciliation by clinician or pharmacist
- monitoring_frequency_basis: at initiation and whenever the medication list changes, because the risk arises from a new co-medication
- trigger: start of a new interacting medicine
- cq: CQ6, CQ8

### 3.8 `Monitor_Spinal_Epidural_Hematoma` (Monitor_Undesired_State, category=undesired_ade)
- code: neurological checks for spinal or epidural hematoma around neuraxial anesthesia or spinal puncture
- occurrenceTiming: event-triggered, frequent neurological checks whenever neuraxial anesthesia or spinal puncture is performed during anticoagulant therapy
- patientInstruction: tell the anesthetist that you take an anticoagulant, and report back pain, tingling, numbness or weakness of the legs, or bowel or bladder problems immediately after an epidural or spinal procedure
- performerInstruction: time epidural catheter removal and the next anticoagulant dose per the drug label (for apixaban remove the catheter no earlier than 24 hours after the last dose and give the next dose no earlier than 5 hours after removal), monitor frequently for neurological impairment and treat urgently if it is found
- precondition: ANTICOAG_SET. applies_when: all_patients_on_therapy (the patients on Prescribe_DOAC or Prescribe_Low_Dose_Rivaroxaban, each time a neuraxial procedure occurs)
- monitored_target: spinal or epidural hematoma as a boxed-warning adverse effect of Prescribe_DOAC and Prescribe_Low_Dose_Rivaroxaban
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: DOAC label Boxed Warnings. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: recommended
- source.1: XARELTO (rivaroxaban) US Prescribing Information 2026, Boxed Warning (B) — quote.1: Boxed Warning (B): "Monitor patients frequently for signs and symptoms of neurological impairment. If neurological compromise is noted, urgent treatment is necessary"
- source.2: ELIQUIS (apixaban) US Prescribing Information 2026, §5.3 — quote.2: §5.3: "Indwelling epidural or intrathecal catheters should not be removed earlier than 24 hours after the last administration of ELIQUIS."
- source.3: SAVAYSA (edoxaban) US Prescribing Information 2025, §5.4 — quote.3: §5.4: "Monitor patients frequently for signs and symptoms of neurological impairment (e.g., numbness or weakness of the legs, bowel, or bladder dysfunction)."
- literature_basis: every DOAC label carries a Boxed Warning that epidural or spinal hematoma can follow neuraxial anesthesia or spinal puncture and instructs frequent neurological monitoring with urgent treatment, with drug-specific catheter timing
- assistant_invention: none
- instrument: clinician neurological examination
- monitoring_frequency_basis: label-specified, frequent checks around each neuraxial procedure
- trigger: back pain, leg numbness or weakness, or bowel or bladder dysfunction after a neuraxial procedure
- cq: CQ3, CQ5, CQ9

### 3.9 `Monitor_Perioperative_Interruption` (Monitor_Undesired_State, category=undesired_ade)
- code: perioperative antithrombotic plan before surgery or invasive procedures
- occurrenceTiming: event-triggered, whenever surgery, CABG or an invasive or dental procedure is planned
- patientInstruction: tell your surgeon and dentist that you take an antiplatelet or anticoagulant before any procedure, and do not stop it unless the prescribing clinician tells you how and when
- performerInstruction: when the procedure's bleeding risk requires interruption, hold clopidogrel and ticagrelor 5 days and prasugrel at least 7 days before surgery, do not start prasugrel or ticagrelor if urgent CABG is likely, hold rivaroxaban and edoxaban at least 24 hours and apixaban 24 to 48 hours by procedural bleeding risk, hold dabigatran per its renal-function table, have the surgeon talk to the prescriber before stopping vorapaxar, and resume as soon as hemostasis is achieved
- precondition: NON_ASPIRIN_ONLY_SET = `result_of(Antithrombotic_Regimen_Decision) = Clopidogrel_Monotherapy or result_of(Antithrombotic_Regimen_Decision) = DAPT or result_of(Antithrombotic_Regimen_Decision) = Short_DAPT_then_P2Y12_Monotherapy or result_of(Antithrombotic_Regimen_Decision) = Extended_DAPT or result_of(Antithrombotic_Regimen_Decision) = Aspirin_plus_Vorapaxar or result_of(Antithrombotic_Regimen_Decision) = Aspirin_plus_Low_Dose_Rivaroxaban or result_of(Antithrombotic_Regimen_Decision) = DOAC_plus_Antiplatelet or result_of(Antithrombotic_Regimen_Decision) = DOAC_Monotherapy` (rev 3, review J7: every regimen except Aspirin_Monotherapy, whose labels give no perioperative instruction). applies_when: all_patients_on_therapy
- monitored_target: surgical bleeding and thrombotic events around procedures for Prescribe_Clopidogrel, Prescribe_Ticagrelor, Prescribe_Prasugrel, Prescribe_Vorapaxar, Prescribe_Low_Dose_Rivaroxaban and Prescribe_DOAC
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: label discontinuation and CABG-bleeding sections. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: recommended
- source.1: PLAVIX (clopidogrel) US Prescribing Information 2025, §5.3 — quote.1: §5.3: "When possible, interrupt therapy with Plavix for five days prior to such surgery. Resume Plavix as soon as hemostasis is achieved."
- source.2: EFFIENT (prasugrel) US Prescribing Information 2022, §5.2 — quote.2: §5.2: "If possible, Effient should be discontinued at least 7 days prior to CABG."
- source.3: BRILINTA (ticagrelor) US Prescribing Information 2026, §5.2 — quote.3: §5.2: "When possible, interrupt therapy with BRILINTA for five days prior to surgery that has a major risk of bleeding."
- source.4: XARELTO (rivaroxaban) US Prescribing Information 2026, §2.4 — quote.4: §2.4: "XARELTO should be stopped at least 24 hours before the procedure to reduce the risk of bleeding"
- source.5: ELIQUIS (apixaban) US Prescribing Information 2026, §2.4 — quote.5: §2.4: "ELIQUIS should be discontinued at least 48 hours prior to elective surgery or invasive procedures with a moderate or high risk of unacceptable or clinically significant bleeding"
- source.6: ZONTIVITY (vorapaxar) US Prescribing Information 2022, §17 — quote.6: §17: "Tell the doctor performing any surgery or dental procedure to talk to the prescribing physician before stopping ZONTIVITY."
- literature_basis: each P2Y12 and DOAC label states how long before surgery to interrupt and to resume once hemostasis is achieved, and the prasugrel and ticagrelor labels warn against starting the drug when urgent CABG is likely
- assistant_invention: none
- instrument: clinician review of planned procedures
- monitoring_frequency_basis: event-driven at each planned procedure, as the labels describe
- trigger: a planned surgery, CABG or invasive procedure
- cq: CQ3, CQ5

### 3.10 `Monitor_Renal_Function` (Monitor_Undesired_State, category=undesired_ade)
- code: serum creatinine with Cockcroft-Gault creatinine clearance for anticoagulant dose and eligibility
- occurrenceTiming: baseline before starting, then at least every 12 months and sooner when renal function may decline (acute illness, dehydration, new nephrotoxic drugs)
- patientInstruction: attend the kidney blood test and tell your clinician about vomiting, diarrhea, dehydration or a new medicine that can affect the kidneys
- performerInstruction: adjust or stop the anticoagulant by creatinine clearance per its label, rivaroxaban 15 mg daily for AF if CrCl is 50 or below, dabigatran 75 mg twice daily if CrCl is 15 to 30, apixaban 2.5 mg twice daily with two of age 80 or more, weight 60 kg or less and creatinine 1.5 mg/dL or more, edoxaban 30 mg if CrCl is 15 to 50 and not at all if CrCl is above 95, and avoid rivaroxaban if CrCl is below 15
- precondition: ANTICOAG_SET. applies_when: all_patients_on_therapy (the patients on Prescribe_DOAC or Prescribe_Low_Dose_Rivaroxaban)
- monitored_target: renal function that sets anticoagulant dosing and eligibility for Prescribe_DOAC and Prescribe_Low_Dose_Rivaroxaban
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: DOAC label dosing and renal sections. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: recommended
- source.1: PRADAXA (dabigatran) Capsules US Prescribing Information 2025, §2.4 — quote.1: §2.4: "Assess renal function prior to initiation of treatment with PRADAXA Capsules. Periodically assess renal function as clinically indicated"
- source.2: XARELTO (rivaroxaban) US Prescribing Information 2026, §5.4 — quote.2: §5.4: "Periodically assess renal function as clinically indicated (i.e., more frequently in situations in which renal function may decline) and adjust therapy accordingly"
- source.3: SAVAYSA (edoxaban) US Prescribing Information 2025, Boxed Warning (A) — quote.3: Boxed Warning (A): "SAVAYSA should not be used in patients with CrCL > 95 mL/min."
- literature_basis: the dabigatran and rivaroxaban labels instruct baseline and periodic renal assessment with dose adjustment, edoxaban must not be used above a CrCl of 95 mL/min, and every DOAC dose depends on renal function
- assistant_invention: the at-least-yearly cadence (the labels say periodically, as clinically indicated)
- instrument: serum creatinine with Cockcroft-Gault creatinine clearance (actual body weight)
- monitoring_frequency_basis: label-specified baseline and periodic assessment, with a proposed minimum of every 12 months
- trigger: acute illness, dehydration or acute kidney injury
- cq: CQ3, CQ4, CQ9

### 3.11 `Monitor_TTP` (Monitor_Undesired_State, category=undesired_ade)
- code: thrombotic thrombocytopenic purpura symptom review with triggered platelet count, blood smear for schistocytes, LDH and serum creatinine
- occurrenceTiming: symptom-triggered, with a symptom question at each follow-up visit and particular attention in the first weeks after starting
- patientInstruction: get prompt medical attention for unexplained purple skin spots, extreme tiredness, yellow skin or eyes, fever, confusion or passing little urine
- performerInstruction: if TTP is suspected, check platelet count, a blood smear for schistocytes, LDH and serum creatinine, stop the thienopyridine and arrange urgent treatment including plasmapheresis
- precondition: `result_of(Antithrombotic_Regimen_Decision) = Clopidogrel_Monotherapy or result_of(P2Y12_Agent_Decision) = Clopidogrel or result_of(P2Y12_Agent_Decision) = Prasugrel`. applies_when: all_patients_on_therapy (the patients on Prescribe_Clopidogrel or Prescribe_Prasugrel)
- monitored_target: thrombotic thrombocytopenic purpura as a labeled adverse effect of Prescribe_Clopidogrel and Prescribe_Prasugrel
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: thienopyridine label warnings. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: PLAVIX (clopidogrel) US Prescribing Information 2025, §5.4 — quote.1: §5.4: "TTP, sometimes fatal, has been reported following use of Plavix, sometimes after a short exposure (<2 weeks)."
- source.2: EFFIENT (prasugrel) US Prescribing Information 2022, §5.4 — quote.2: §5.4: "TTP has been reported with the use of Effient. TTP can occur after a brief exposure (<2 weeks)."
- source.3: PLAVIX (clopidogrel) US Prescribing Information 2025, §5.4 — quote.3: §5.4: "TTP is a serious condition that requires urgent treatment including plasmapheresis (plasma exchange)."
- literature_basis: both thienopyridine labels warn that TTP, sometimes fatal, can follow even brief exposure and needs urgent treatment including plasmapheresis, without a routine laboratory schedule
- assistant_invention: the symptom wording and LDH and creatinine in the triggered panel
- instrument: patient symptom report with triggered platelet count, smear, LDH and creatinine
- monitoring_frequency_basis: symptom-triggered because TTP is rare and acute, with attention to the first weeks of exposure
- trigger: purpura, jaundice, confusion or reduced urine output
- cq: CQ3, CQ5, CQ9

### 3.12 `Monitor_CYP2C19_Poor_Metabolizer` (Monitor_Undesired_State, category=undesired_ade)
- code: CYP2C19 poor-metabolizer status review for clopidogrel response
- occurrenceTiming: event-triggered, at initiation when a CYP2C19 genotype result is available and after any ischemic event on clopidogrel
- patientInstruction: tell your clinician if you have had a CYP2C19 gene test and report any new chest pain or stroke symptoms
- performerInstruction: if the patient is a known CYP2C19 poor metabolizer, consider another P2Y12 inhibitor, and consider CYP2C19 testing after an ischemic event on clopidogrel
- precondition: `result_of(Antithrombotic_Regimen_Decision) = Clopidogrel_Monotherapy or result_of(P2Y12_Agent_Decision) = Clopidogrel`. applies_when: all_patients_on_therapy (the patients on Prescribe_Clopidogrel)
- monitored_target: diminished antiplatelet effect in CYP2C19 poor metabolizers as a boxed-warning risk of Prescribe_Clopidogrel
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: clopidogrel Boxed Warning. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: PLAVIX (clopidogrel) US Prescribing Information 2025, Boxed Warning — quote.1: Boxed Warning: "Tests are available to identify patients who are CYP2C19 poor metabolizers."
- source.2: PLAVIX (clopidogrel) US Prescribing Information 2025, Boxed Warning — quote.2: Boxed Warning: "Consider use of another platelet P2Y 12 inhibitor in patients identified as CYP2C19 poor metabolizers."
- literature_basis: the clopidogrel Boxed Warning says effectiveness depends on CYP2C19 activation, that tests exist, and that another P2Y12 inhibitor should be considered in identified poor metabolizers, without mandating routine genotyping
- assistant_invention: testing after an ischemic event on clopidogrel as the event trigger
- instrument: CYP2C19 genotype result (when available or ordered)
- monitoring_frequency_basis: event-driven, because the label does not mandate routine genotyping
- trigger: a known poor-metabolizer result or an ischemic event on clopidogrel
- cq: CQ3, CQ9

### 3.13 `Monitor_Antiplatelet_Hypersensitivity` (Monitor_Undesired_State, category=undesired_ade)
- code: antiplatelet hypersensitivity reaction review (hives, angioedema, bronchospasm, rash, hematologic reaction)
- occurrenceTiming: symptom-triggered, with an allergy question at each follow-up visit after starting or switching an antiplatelet
- patientInstruction: stop the medicine and seek medical help right away for hives, swelling of the face, lips or throat, wheezing or a widespread rash
- performerInstruction: if a hypersensitivity reaction occurs, stop the culprit drug, treat the reaction and choose an alternative antiplatelet, noting cross-reactivity between thienopyridines (clopidogrel, prasugrel, ticlopidine)
- precondition: ANTIPLATELET_SET = `result_of(Antithrombotic_Regimen_Decision) = Aspirin_Monotherapy or result_of(Antithrombotic_Regimen_Decision) = Clopidogrel_Monotherapy or result_of(Antithrombotic_Regimen_Decision) = DAPT or result_of(Antithrombotic_Regimen_Decision) = Short_DAPT_then_P2Y12_Monotherapy or result_of(Antithrombotic_Regimen_Decision) = Extended_DAPT or result_of(Antithrombotic_Regimen_Decision) = Aspirin_plus_Vorapaxar or result_of(Antithrombotic_Regimen_Decision) = Aspirin_plus_Low_Dose_Rivaroxaban or result_of(Antithrombotic_Regimen_Decision) = DOAC_plus_Antiplatelet` (rev 2, review J5: every regimen except DOAC_Monotherapy). applies_when: all_patients_on_therapy
- monitored_target: hypersensitivity reactions to Prescribe_Aspirin, Prescribe_Clopidogrel, Prescribe_Prasugrel and Prescribe_Ticagrelor
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: aspirin allergy alert and thienopyridine and ticagrelor hypersensitivity sections. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: Low Dose Aspirin 81 mg OTC Drug Facts label 2026, Allergy alert — quote.1: Allergy alert: "Aspirin may cause a severe allergic reaction, which may include: hives facial swelling shock asthma (wheezing)"
- source.2: PLAVIX (clopidogrel) US Prescribing Information 2025, §5.5 — quote.2: §5.5: "Hypersensitivity including rash, angioedema or hematologic reaction has been reported in patients receiving Plavix"
- source.3: EFFIENT (prasugrel) US Prescribing Information 2022, §5.5 — quote.3: §5.5: "Hypersensitivity including angioedema has been reported in patients receiving Effient, including patients with a history of hypersensitivity reaction to other thienopyridines"
- source.4: BRILINTA (ticagrelor) US Prescribing Information 2026, §4.3 — quote.4: §4.3: "BRILINTA is contraindicated in patients with hypersensitivity (e.g., angioedema) to ticagrelor or any component of the product."
- literature_basis: the aspirin label warns of severe allergic reactions and says to stop use and seek help, and the clopidogrel, prasugrel and ticagrelor labels list hypersensitivity and angioedema, with cross-reactivity between thienopyridines
- assistant_invention: grouping the four antiplatelet hypersensitivity warnings into one symptom-triggered task
- instrument: patient symptom report with clinician examination
- monitoring_frequency_basis: symptom-triggered because reactions are acute
- trigger: hives, facial or throat swelling, wheezing or a widespread rash
- cq: CQ3, CQ5

### 3.14 `Monitor_Ticagrelor_Dyspnea` (Monitor_Undesired_State, category=undesired_ade)
- code: dyspnea review on ticagrelor
- occurrenceTiming: symptom-triggered, with a breathlessness question at each follow-up visit
- patientInstruction: contact your clinician if you have unexpected shortness of breath, especially if it is severe
- performerInstruction: if dyspnea is new, prolonged or worse, exclude other causes such as heart failure, continue ticagrelor without specific treatment when it is drug-related and tolerable, and switch to another antiplatelet agent if it is intolerable
- precondition: `result_of(P2Y12_Agent_Decision) = Ticagrelor`. applies_when: all_patients_on_therapy (the patients on Prescribe_Ticagrelor)
- monitored_target: dyspnea as a labeled adverse effect of Prescribe_Ticagrelor
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: ticagrelor §5.3. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: BRILINTA (ticagrelor) US Prescribing Information 2026, §5.3 — quote.1: §5.3: "If a patient develops new, prolonged, or worsened dyspnea that is determined to be related to BRILINTA, no specific treatment is required"
- source.2: BRILINTA (ticagrelor) US Prescribing Information 2026, §5.3 — quote.2: §5.3: "In the case of intolerable dyspnea requiring discontinuation of BRILINTA, consider prescribing another antiplatelet agent."
- literature_basis: the label says ticagrelor-related dyspnea needs no specific treatment and that intolerable dyspnea warrants switching antiplatelet agent
- assistant_invention: checking other causes such as heart failure
- instrument: patient symptom report
- monitoring_frequency_basis: symptom-triggered, as the label describes
- trigger: new, prolonged or worsened shortness of breath
- cq: CQ3, CQ9

### 3.15 `Monitor_Ticagrelor_Bradyarrhythmia` (Monitor_Undesired_State, category=undesired_ade)
- code: pulse check with ECG on symptoms of bradyarrhythmia on ticagrelor
- occurrenceTiming: each follow-up visit, with an ECG on dizziness, syncope or a slow pulse
- patientInstruction: report fainting, dizziness, light-headedness or a very slow pulse
- performerInstruction: if bradycardia or syncope is found, obtain an ECG for ventricular pauses or AV block and reconsider ticagrelor in patients with sick sinus syndrome, second or third degree AV block or bradycardia-related syncope without a pacemaker
- precondition: `result_of(P2Y12_Agent_Decision) = Ticagrelor`. applies_when: all_patients_on_therapy (the patients on Prescribe_Ticagrelor)
- monitored_target: bradyarrhythmia (ventricular pauses, AV block) as a labeled adverse effect of Prescribe_Ticagrelor
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: ticagrelor §5.4. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: proposed_by_assistant
- source.1: BRILINTA (ticagrelor) US Prescribing Information 2026, §5.4 — quote.1: §5.4: "BRILINTA can cause ventricular pauses"
- source.2: BRILINTA (ticagrelor) US Prescribing Information 2026, §5.4 — quote.2: §5.4: "Patients with a history of sick sinus syndrome, 2 nd or 3 rd degree AV block or bradycardia-related syncope not protected by a pacemaker were excluded from clinical studies"
- literature_basis: the label warns that ticagrelor can cause ventricular pauses and that patients with conduction disease without a pacemaker were not studied, but states no monitoring instruction
- assistant_invention: the pulse check at each visit and the triggered ECG
- instrument: pulse rate at the visit with ECG on symptoms
- monitoring_frequency_basis: proposed, a pulse check at each routine visit is cheap and catches symptomatic bradycardia
- trigger: syncope, dizziness or a slow pulse
- cq: CQ3, CQ9

### 3.16 `Monitor_Ticagrelor_Central_Sleep_Apnea` (Monitor_Undesired_State, category=undesired_ade)
- code: central sleep apnea symptom review on ticagrelor
- occurrenceTiming: symptom-triggered, with a sleep-breathing question at each follow-up visit
- patientInstruction: tell your clinician if you or your partner notice pauses in breathing during sleep, irregular breathing at night, frequent waking or daytime sleepiness
- performerInstruction: if central sleep apnea is suspected, consider further clinical assessment such as a sleep study
- precondition: `result_of(P2Y12_Agent_Decision) = Ticagrelor`. applies_when: all_patients_on_therapy (the patients on Prescribe_Ticagrelor)
- monitored_target: central sleep apnea as a labeled adverse effect of Prescribe_Ticagrelor
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: ticagrelor §5.6. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: BRILINTA (ticagrelor) US Prescribing Information 2026, §5.6 Central Sleep Apnea — quote.1: §5.6: "If central sleep apnea is suspected, consider further clinical assessment."
- literature_basis: the label reports central sleep apnea including Cheyne-Stokes respiration and advises further assessment when it is suspected
- assistant_invention: the symptom wording and a sleep study as the example assessment
- instrument: patient and bed-partner symptom report
- monitoring_frequency_basis: symptom-triggered, as the label describes
- trigger: witnessed breathing pauses or new daytime sleepiness
- cq: CQ3, CQ9

### 3.17 `Monitor_PPI_CDAD` (Monitor_Undesired_State, category=undesired_ade)
- code: Clostridioides difficile-associated diarrhea symptom review with triggered stool C. difficile testing
- occurrenceTiming: symptom-triggered, with a bowel-habit question at each follow-up visit
- patientInstruction: call your clinician right away for diarrhea that does not improve, especially with fever or abdominal pain
- performerInstruction: if diarrhea does not improve, test the stool for C. difficile, treat a confirmed infection and review whether the PPI is still needed
- precondition: PPI_SET. applies_when: all_patients_on_therapy (the patients on Prescribe_PPI)
- monitored_target: C. difficile-associated diarrhea as a labeled adverse effect of Prescribe_PPI
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: pantoprazole §5.3. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.3 — quote.1: §5.3: "This diagnosis should be considered for diarrhea that does not improve"
- source.2: PROTONIX (pantoprazole) US Prescribing Information 2026, §17 — quote.2: §17: "Advise patients to immediately call their healthcare provider if they experience diarrhea that does not improve"
- literature_basis: the label says PPI therapy may raise the risk of C. difficile-associated diarrhea and that the diagnosis should be considered for diarrhea that does not improve
- assistant_invention: stool testing as the triggered test
- instrument: patient symptom report with triggered stool C. difficile test
- monitoring_frequency_basis: symptom-triggered, as the label describes
- trigger: diarrhea that does not improve
- cq: CQ3, CQ7, CQ9

### 3.18 `Monitor_PPI_Hypomagnesemia` (Monitor_Undesired_State, category=undesired_ade)
- code: serum magnesium
- occurrenceTiming: baseline before starting pantoprazole, then every 12 months while it continues, and on symptoms
- patientInstruction: report muscle cramps, tremor, spasms, palpitations, an irregular heartbeat or seizures
- performerInstruction: if magnesium is low, check calcium and potassium, replace magnesium and reconsider the PPI
- precondition: `(result_of(Antithrombotic_Regimen_Decision) = DAPT or result_of(Antithrombotic_Regimen_Decision) = Extended_DAPT or result_of(Antithrombotic_Regimen_Decision) = DOAC_plus_Antiplatelet) or (result_of(Antithrombotic_Regimen_Decision) = Short_DAPT_then_P2Y12_Monotherapy and on_digoxin_or_diuretic = true)`. applies_when: patients on pantoprazole expected to take it for 6 months or longer (DAPT, extended DAPT or DOAC plus antiplatelet) or taking it with digoxin or a diuretic
- monitored_target: hypomagnesemia as a labeled adverse effect of Prescribe_PPI
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: pantoprazole §5.8. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: recommended
- source.1: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.8 — quote.1: §5.8: "For patients expected to be on prolonged treatment or who take PPIs with medications such as digoxin or drugs that may cause hypomagnesemia (e.g., diuretics)"
- source.2: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.8 — quote.2: §5.8: "health care professionals may consider monitoring magnesium levels prior to initiation of PPI treatment and periodically"
- literature_basis: the label's own instruction is to consider magnesium before starting and periodically in patients on prolonged treatment or on digoxin or diuretics
- assistant_invention: every 12 months as the periodic interval, and treating 6 months or more as prolonged
- instrument: serum magnesium (with calcium and potassium if low)
- monitoring_frequency_basis: label-specified baseline and periodic testing, with a proposed 12-month interval
- trigger: cramps, tremor, arrhythmia or seizures
- cq: CQ3, CQ7, CQ9

### 3.19 `Monitor_PPI_Bone_Fracture` (Monitor_Undesired_State, category=undesired_ade)
- code: fracture history and osteoporosis risk review during long-term pantoprazole
- occurrenceTiming: every 12 months while pantoprazole continues for 1 year or longer, and on any fracture
- patientInstruction: report any fracture, especially of the hip, wrist or spine
- performerInstruction: when pantoprazole continues for a year or longer, assess osteoporosis and fracture risk per current osteoporosis guidelines and use the lowest PPI dose for the shortest duration
- precondition: `result_of(Antithrombotic_Regimen_Decision) = Extended_DAPT and previous_mi = true` (rev 2, review J6; previous_mi is Extended_DAPT's own Rec 4 criterion, so the population is unchanged). applies_when: patients on pantoprazole for a year or longer (during extended DAPT after MI)
- monitored_target: osteoporosis-related fracture as a labeled adverse effect of long-term Prescribe_PPI
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: pantoprazole §5.4. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: proposed_by_assistant
- source.1: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.4 — quote.1: §5.4: "The risk of fracture was increased in patients who received high-dose, defined as multiple daily doses, and long-term PPI therapy (a year or longer)."
- source.2: PROTONIX (pantoprazole) US Prescribing Information 2026, §17 — quote.2: §17: "Advise patients to report any fractures, especially of the hip, wrist or spine, to their healthcare provider"
- literature_basis: the label links long-term (a year or longer) and high-dose PPI use to hip, wrist and spine fractures and advises managing at-risk patients per osteoporosis guidelines
- assistant_invention: the yearly review and limiting it to extended DAPT, the only regimen in this CIG where the PPI runs beyond a year
- instrument: clinician review of fracture history and osteoporosis risk factors
- monitoring_frequency_basis: proposed yearly review, matching the one-year threshold in the label
- trigger: any new fracture
- cq: CQ3, CQ7, CQ9

### 3.20 `Monitor_PPI_Interstitial_Nephritis` (Monitor_Undesired_State, category=undesired_ade)
- code: acute tubulointerstitial nephritis symptom review with triggered serum creatinine and urinalysis
- occurrenceTiming: symptom-triggered, at any time during pantoprazole therapy
- patientInstruction: call your clinician right away for fever, rash, joint pain, passing less urine or blood in the urine
- performerInstruction: if acute tubulointerstitial nephritis is suspected, check serum creatinine and urinalysis, stop pantoprazole and evaluate
- precondition: PPI_SET. applies_when: all_patients_on_therapy (the patients on Prescribe_PPI)
- monitored_target: acute tubulointerstitial nephritis as a labeled adverse effect of Prescribe_PPI
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: pantoprazole §5.2. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.2 — quote.1: §5.2: "Discontinue PROTONIX and evaluate patients with suspected acute TIN"
- source.2: PROTONIX (pantoprazole) US Prescribing Information 2026, §17 — quote.2: §17: "Advise patients to call their healthcare provider immediately if they experience signs and/or symptoms associated with acute tubulointerstitial nephritis"
- literature_basis: the label says acute TIN can occur at any point during PPI therapy and that the PPI should be stopped and the patient evaluated if it is suspected
- assistant_invention: the symptom wording and creatinine with urinalysis as the triggered tests
- instrument: patient symptom report with triggered serum creatinine and urinalysis
- monitoring_frequency_basis: symptom-triggered, as the label describes
- trigger: fever, rash, joint pain or reduced urine output
- cq: CQ3, CQ7, CQ9

### 3.21 `Monitor_PPI_Cutaneous_Lupus` (Monitor_Undesired_State, category=undesired_ade)
- code: cutaneous or systemic lupus erythematosus symptom review
- occurrenceTiming: symptom-triggered, at any time during pantoprazole therapy
- patientInstruction: report a new or worsening rash on sun-exposed skin, or new joint pain
- performerInstruction: if cutaneous or systemic lupus is suspected, stop pantoprazole and refer the patient to the appropriate specialist
- precondition: PPI_SET. applies_when: all_patients_on_therapy (the patients on Prescribe_PPI)
- monitored_target: cutaneous or systemic lupus erythematosus as a labeled adverse effect of Prescribe_PPI
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: pantoprazole §5.6. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.6 — quote.1: §5.6: "If signs or symptoms consistent with CLE or SLE are noted in patients receiving PROTONIX, discontinue the drug and refer the patient to the appropriate specialist"
- literature_basis: the label reports new or exacerbated CLE and SLE with PPIs and says to stop the drug and refer when signs appear
- assistant_invention: the symptom wording
- instrument: patient symptom report with clinician examination
- monitoring_frequency_basis: symptom-triggered, as the label describes
- trigger: a photosensitive rash or new arthralgia
- cq: CQ3, CQ7, CQ9

### 3.22 `Monitor_PPI_Severe_Cutaneous_Reactions` (Monitor_Undesired_State, category=undesired_ade)
- code: severe cutaneous adverse reaction symptom review (SJS, TEN, DRESS, AGEP)
- occurrenceTiming: symptom-triggered, at any time during pantoprazole therapy
- patientInstruction: stop pantoprazole and call your clinician right away for blistering or peeling skin, mouth sores, or a rash with fever
- performerInstruction: discontinue pantoprazole at the first signs of a severe cutaneous reaction or other hypersensitivity and consider further evaluation
- precondition: PPI_SET. applies_when: all_patients_on_therapy (the patients on Prescribe_PPI)
- monitored_target: severe cutaneous adverse reactions as a labeled adverse effect of Prescribe_PPI
- provenance_type: package_insert_specified. source_kind: package_insert. knowledge_origin: pantoprazole §5.5. guideline_status: not_specified_as_a_guideline_monitoring_task. monitoring_stance: symptom_triggered_only
- source.1: PROTONIX (pantoprazole) US Prescribing Information 2026, §5.5 — quote.1: §5.5: "Discontinue PROTONIX at the first signs or symptoms of severe cutaneous adverse reactions or other signs of hypersensitivity and consider further evaluation."
- literature_basis: the label reports severe cutaneous reactions (EM, SJS/TEN, DRESS, AGEP) and says to stop the drug at the first signs
- assistant_invention: the symptom wording
- instrument: patient symptom report with clinician examination
- monitoring_frequency_basis: symptom-triggered, as the label describes
- trigger: blistering, peeling skin, mucosal sores or rash with fever
- cq: CQ3, CQ7, CQ9

## 4. Data items (only those a condition reads)

| Name | Type | Caption (question) | Source + quote | Read by |
|---|---|---|---|---|
| `requires_oral_anticoagulation` | boolean | Does the patient have an indication for long-term oral anticoagulation (e.g. atrial fibrillation)? | G Rec 1 (p.e50): "In patients with CCD and no indication for oral anticoagulant therapy, low-dose aspirin 81 mg (75-100 mg) is recommended" | Regimen arguments (all) ; P2Y12 arguments |
| `pci_within_12_months` | boolean | PCI within the past 12 months? | G Rec 2 (p.e50): "In patients with CCD treated with PCI, dual antiplatelet therapy (DAPT) consisting of aspirin and clopidogrel for 6 months post PCI" | Regimen arguments |
| `des_implanted` | boolean | Was a drug-eluting stent implanted at that PCI? | G Rec 3 (p.e50): "In select patients with CCD treated with PCI and a drug-eluting stent (DES) who have completed a 1- to 3-month course of DAPT" | `Short_DAPT_then_P2Y12_Monotherapy` argument |
| `acs_within_12_months` | boolean | Acute coronary syndrome within the past 12 months? | G Rec 7 (p.e50): "In patients with CCD without recent ACS or a PCI-related indication for DAPT" | Regimen and P2Y12 arguments |
| `cabg_within_12_months` | boolean | CABG within the past 12 months? | G Rec 6 (p.e50): "the use of DAPT after CABG may be useful to reduce the incidence of saphenous vein graft occlusion" | `DAPT` argument; Rec 7 against argument |
| `previous_mi` | boolean | History of myocardial infarction? | G Rec 4 (p.e50): "In patients with CCD who have had a previous MI and are at low bleeding risk" | Extended DAPT, vorapaxar, ticagrelor arguments |
| `prior_stroke_or_tia` | boolean | History of ischemic stroke or TIA? | G Rec 9 (p.e50): "In patients with CCD and previous stroke, TIA, or ICH, prasugrel should not be used" | Vorapaxar and prasugrel excluding arguments |
| `prior_ich` | boolean | History of intracranial hemorrhage? | TIC §4.1: "BRILINTA is contraindicated in patients with a history of intracranial hemorrhage (ICH) because of a high risk of recurrent ICH in this population" | Vorapaxar, prasugrel, ticagrelor excluding arguments |
| `high_bleeding_risk` | boolean | High bleeding risk (validated score such as PRECISE-DAPT, DAPT or PARIS, or clinical judgment)? | G Synopsis (p.e50): "The use of validated risk scores to address bleeding risk can be useful in choice and duration of antiplatelet therapy." | Regimen arguments |
| `high_thrombotic_risk` | boolean | High risk of recurrent ischemic events (e.g. multivessel CAD with diabetes, recurrent MI, PAD, HF or CKD, or complex PCI)? | G text 15 (p.e55): "multivessel CAD and at least one of the following: diabetes requiring medication, recurrent MI, peripheral artery disease, HF, or CKD" | `Aspirin_plus_Low_Dose_Rivaroxaban` argument |
| `aspirin_intolerance` | boolean | Aspirin allergy or intolerance (incl. NSAID hypersensitivity or the asthma-rhinitis-nasal polyps syndrome)? | G text 1 (p.e51): "As an alternative to low-dose aspirin, clopidogrel may be used in individuals who cannot tolerate aspirin therapy" | Aspirin and clopidogrel monotherapy arguments |
| `active_pathological_bleeding` | boolean | Active pathological bleeding (e.g. peptic ulcer, intracranial hemorrhage)? | CLO §4.1: "Plavix is contraindicated in patients with active pathological bleeding such as peptic ulcer or intracranial hemorrhage." | Therapy plan precondition |
| `age_years` | integer (years) | Age | PRA Boxed Warning: "In patients ≥75 years of age, Effient is generally not recommended, because of the increased risk of fatal and intracranial bleeding and uncertain benefit" | Prasugrel against argument |
| `on_digoxin_or_diuretic` | boolean | Taking digoxin or a diuretic? | PAN §5.8: "For patients expected to be on prolonged treatment or who take PPIs with medications such as digoxin or drugs that may cause hypomagnesemia (e.g., diuretics)" | `Monitor_PPI_Hypomagnesemia` precondition |

Baseline values that no condition reads (hemoglobin, platelet count, serum creatinine and Cockcroft-Gault CrCl, body weight, serum magnesium, CYP2C19 genotype if known, current medication list) are listed in the Enquiry description only. Body weight and CrCl drive doses written in the procedures.

## 5. Draft conditions (PROforma expressions; all type-checked with `check-expression` against a probe file)

### Decision `Antithrombotic_Regimen_Decision` (choice_mode single, recommendation `netsupport() > 0`)

| Candidate | Support | Argument name | Condition | Rationale / source |
|---|---|---|---|---|
| `Aspirin_Monotherapy` | for | `Arg_Aspirin_SAPT` | `requires_oral_anticoagulation = false and pci_within_12_months = false and acs_within_12_months = false and cabg_within_12_months = false and aspirin_intolerance = false` | Rec 1 [1, A]; Fig 9 "No PCI or >12 mo from ACS" |
| `Clopidogrel_Monotherapy` | for | `Arg_Clopidogrel_SAPT` | `requires_oral_anticoagulation = false and pci_within_12_months = false and acs_within_12_months = false and aspirin_intolerance = true` | text 1 (aspirin intolerance) |
| `DAPT` | for | `Arg_DAPT_PCI` | `requires_oral_anticoagulation = false and pci_within_12_months = true and high_bleeding_risk = false` | Rec 2 [1, A] |
| `DAPT` | for | `Arg_DAPT_ACS` | `requires_oral_anticoagulation = false and acs_within_12_months = true` | Fig 9 "Prior ACS with or without PCI" |
| `DAPT` | for | `Arg_DAPT_CABG` | `requires_oral_anticoagulation = false and cabg_within_12_months = true` | Rec 6 [2b, B-R] |
| `DAPT` | against | `Arg_DAPT_No_Benefit` | `pci_within_12_months = false and acs_within_12_months = false and cabg_within_12_months = false` | Rec 7 [3: No benefit, A] |
| `Short_DAPT_then_P2Y12_Monotherapy` | for | `Arg_Short_DAPT` | `requires_oral_anticoagulation = false and pci_within_12_months = true and des_implanted = true and high_bleeding_risk = true` | Rec 3 [2a, A]; Fig 9 high bleeding risk |
| `Extended_DAPT` | for | `Arg_Extended_DAPT` | `requires_oral_anticoagulation = false and previous_mi = true and high_bleeding_risk = false` | Rec 4 [2b, A] |
| `Aspirin_plus_Vorapaxar` | for | `Arg_Vorapaxar` | `requires_oral_anticoagulation = false and previous_mi = true and prior_stroke_or_tia = false and prior_ich = false` | Rec 5 [2b, B-R] |
| `Aspirin_plus_Vorapaxar` | excluding | `Arg_Vorapaxar_Harm` | `prior_stroke_or_tia = true or prior_ich = true` | Rec 8 [3: Harm, A]; VOR §4.1 |
| `Aspirin_plus_Low_Dose_Rivaroxaban` | for | `Arg_Low_Dose_Rivaroxaban` | `requires_oral_anticoagulation = false and pci_within_12_months = false and acs_within_12_months = false and high_thrombotic_risk = true and high_bleeding_risk = false` | Rec 15 [2a, B-R] |
| `DOAC_plus_Antiplatelet` | for | `Arg_DOAC_PCI` | `requires_oral_anticoagulation = true and (pci_within_12_months = true or acs_within_12_months = true)` | Rec 11 [1, B-R], Rec 12 [2a, B-R]; Rec 14 (recent ACS is an acute indication for antiplatelet therapy); Fig 9 |
| `DOAC_Monotherapy` | for | `Arg_DOAC_Alone` | `requires_oral_anticoagulation = true and pci_within_12_months = false and acs_within_12_months = false` | Rec 13 [2b, B-R], Rec 14 [2b, C-LD] |

### Decision `P2Y12_Agent_Decision` (in the Therapy plan; choice_mode single; precondition PPI_SET, i.e. every regimen that contains a P2Y12 inhibitor besides clopidogrel monotherapy)

| Candidate | Support | Argument name | Condition | Rationale / source |
|---|---|---|---|---|
| `Clopidogrel` | for | `Arg_Clopidogrel_CCD` | `acs_within_12_months = false or requires_oral_anticoagulation = true or pci_within_12_months = true` | Rec 2 and Rec 11 name clopidogrel for CCD after PCI and with a DOAC (rev 2, review J4) |
| `Clopidogrel` | for | `Arg_Clopidogrel_ACS_No_Alternative` | `acs_within_12_months = true and pci_within_12_months = false and (previous_mi = false or prior_ich = true)` | assistant-proposed fallback so every DAPT patient gets a P2Y12 inhibitor (ACS without PCI and without MI, or with prior ICH): Figure 9 gives DAPT after ACS with or without PCI and Rec 2 names clopidogrel; source.1 G Figure 9 (p.e51) quote.1 p.e51, Figure 9 (figure labels): "Prior ACS with or without PCI ... DAPT"; source.2 G Rec 2 (p.e50) quote.2 p.e50, Rec 2: "dual antiplatelet therapy (DAPT) consisting of aspirin and clopidogrel"; source.3 PLAVIX (clopidogrel) USPI 2025 §1.1 quote.3 §1.1: "are to be managed medically and those who are to be managed with coronary revascularization" (rev 3, advisory A5) (rev 2, review J4) |
| `Ticagrelor` | for | `Arg_Ticagrelor_Post_MI` | `previous_mi = true` | Rec 4 evidence (PEGASUS, ticagrelor 60 mg) |
| `Ticagrelor` | against | `Arg_Ticagrelor_With_OAC` | `requires_oral_anticoagulation = true` | Rec 11 (clopidogrel with DOAC) |
| `Ticagrelor` | excluding | `Arg_Ticagrelor_ICH` | `prior_ich = true` | TIC §4.1 contraindication |
| `Prasugrel` | for | `Arg_Prasugrel_ACS_PCI` | `acs_within_12_months = true and pci_within_12_months = true` | PRA §1 indication (ACS managed with PCI); text 3 |
| `Prasugrel` | against | `Arg_Prasugrel_Age` | `age_years >= 75` | PRA Boxed Warning |
| `Prasugrel` | against | `Arg_Prasugrel_With_OAC` | `requires_oral_anticoagulation = true` | Rec 11 |
| `Prasugrel` | excluding | `Arg_Prasugrel_Harm` | `prior_stroke_or_tia = true or prior_ich = true` | Rec 9 [3: Harm, B-R]; PRA §4.2 |

### Preconditions

| Task | Precondition |
|---|---|
| `Antithrombotic_Therapy` (plan) | `active_pathological_bleeding = false` |
| `P2Y12_Agent_Decision` | PPI_SET |
| `Prescribe_Aspirin` | `result_of(R) = Aspirin_Monotherapy or result_of(R) = DAPT or result_of(R) = Short_DAPT_then_P2Y12_Monotherapy or result_of(R) = Extended_DAPT or result_of(R) = Aspirin_plus_Vorapaxar or result_of(R) = Aspirin_plus_Low_Dose_Rivaroxaban or result_of(R) = DOAC_plus_Antiplatelet` (R spelled out in full) |
| `Prescribe_Clopidogrel` | `result_of(R) = Clopidogrel_Monotherapy or result_of(P2Y12_Agent_Decision) = Clopidogrel` |
| `Prescribe_Ticagrelor` | `result_of(P2Y12_Agent_Decision) = Ticagrelor` |
| `Prescribe_Prasugrel` | `result_of(P2Y12_Agent_Decision) = Prasugrel` |
| `Prescribe_Vorapaxar` | `result_of(R) = Aspirin_plus_Vorapaxar` |
| `Prescribe_Low_Dose_Rivaroxaban` | `result_of(R) = Aspirin_plus_Low_Dose_Rivaroxaban` |
| `Prescribe_DOAC` | `result_of(R) = DOAC_plus_Antiplatelet or result_of(R) = DOAC_Monotherapy` |
| `Prescribe_PPI` | PPI_SET |
| Monitors | as in §3 |

## 6. Therapy actions (State Achievement goals)

| Name | Goal | Procedure | Sources (source.N + quote.N) |
|---|---|---|---|
| `Advise_Avoid_Chronic_NSAIDs` | avoid: increased cardiovascular and bleeding complications from chronic NSAID use | Advise against chronic use of NSAIDs (ibuprofen, naproxen, diclofenac, coxibs), including over-the-counter products, and review analgesic needs at each visit. | G Rec 10 (p.e50): "chronic nonsteroidal anti-inflammatory drugs should not be used because of increased cardiovascular and bleeding complications"; G text 10 (p.e53): "HF risk was doubled by all nonsteroidal antiinflammatory drugs." |
| `Prescribe_Aspirin` | achieve: reduction of atherosclerotic events and MACE | Aspirin 81 mg (75 to 100 mg) once daily. Long term as single antiplatelet therapy. With clopidogrel for 6 months after PCI (Rec 2), with a P2Y12 inhibitor for 12 months after ACS and up to 3 years as extended DAPT (Rec 4), stop after 1 to 3 months when P2Y12 monotherapy follows (Rec 3), and with a DOAC after PCI stop after 1 to 4 weeks (up to 1 month at high thrombotic and low bleeding risk, Rec 11 and 12). Do not exceed 100 mg daily with ticagrelor. | G Rec 1 (p.e50): "low-dose aspirin 81 mg (75-100 mg) is recommended to reduce atherosclerotic events"; G Rec 12 (p.e50): "continuing aspirin in addition to clopidogrel for up to 1 month is reasonable if the patient has a high thrombotic risk and low bleeding risk" |
| `Prescribe_Clopidogrel` | achieve: reduction of MACE and stent-related events after PCI, or of atherosclerotic events when aspirin is not tolerated | Clopidogrel 75 mg once daily. With aspirin for 6 months after PCI, then single antiplatelet therapy (Rec 2). With a DOAC after PCI for 6 months, then DOAC alone (Rec 11). Long term as monotherapy when aspirin is not tolerated. Avoid omeprazole and esomeprazole. | G Rec 2 (p.e50) (quote as in §3.2); G Rec 11 (p.e50) (as §3.2); CLO §2.2: "75 mg once daily orally without a loading dose" ; G text 1 (p.e51): "As an alternative to low-dose aspirin, clopidogrel may be used in individuals who cannot tolerate aspirin therapy" |
| `Prescribe_Ticagrelor` | achieve: reduction of cardiovascular death, MI or stroke after MI | Ticagrelor 90 mg twice daily during the first year after an ACS or MI, then 60 mg twice daily, with aspirin 75 to 100 mg daily, as extended DAPT more than 12 months after MI for up to 3 years (Rec 4), or as P2Y12 monotherapy after 1 to 3 months of DAPT (Rec 3) per the label dose (rev 2, review J3). Not with a history of intracranial hemorrhage. | G Rec 4 (p.e50): "extended DAPT beyond 12 months for a period of up to 3 years may be reasonable to reduce MACE"; G text 4 (p.e52): "Treatment with ticagrelor 60 mg reduced the risk of cardiovascular death, MI, or stroke by 16% and increased the risk of major bleeding"; TIC §2.2: "Administer 90 mg of BRILINTA twice daily during the first year after an ACS event."; TIC §2.2: "After one year, administer 60 mg of BRILINTA twice daily." |
| `Prescribe_Prasugrel` | achieve: reduction of thrombotic cardiovascular events after ACS treated with PCI | Prasugrel 10 mg once daily with aspirin (5 mg once daily if body weight is below 60 kg), as part of DAPT or as P2Y12 monotherapy after 1 to 3 months of DAPT (Rec 3). Never after stroke, TIA or ICH (Rec 9), generally not at age 75 or older. | G Rec 3 (p.e50): "P2Y12 inhibitor monotherapy for at least 12 months is reasonable to reduce bleeding risk"; PRA §2: "Continue at 10 mg once daily with or without food. Consider 5 mg once daily for patients <60 kg" |
| `Prescribe_Vorapaxar` | achieve: reduction of MACE after MI | Vorapaxar 2.08 mg (equivalent to 2.5 mg vorapaxar sulfate) once daily with aspirin, only after MI without a history of stroke, TIA or ICH, and not with an anticoagulant. | G Rec 5 (p.e50): "vorapaxar may be added to aspirin therapy to reduce MACE"; VOR §2.1: "Take one tablet of ZONTIVITY 2.08 mg orally once daily, with or without food." |
| `Prescribe_Low_Dose_Rivaroxaban` | achieve: long-term reduction of MACE in high ischemic risk | Rivaroxaban 2.5 mg twice daily with aspirin 81 mg once daily (Rec 15), long term. No creatinine-clearance dose adjustment for CAD, avoid if CrCl is below 15 mL/min. | G Rec 15 (p.e50): "the addition of low-dose rivaroxaban 2.5 mg twice daily to aspirin 81 mg daily is reasonable for long-term reduction of risk for MACE"; RIV §2.1: "2.5 mg orally twice daily with or without food, in combination with aspirin" |
| `Prescribe_DOAC` | achieve: prevention of thromboembolism for the anticoagulant indication with the lowest bleeding risk alongside or after antiplatelet therapy | A DOAC at its labeled dose: apixaban 5 mg twice daily (2.5 mg with 2 of: age 80 or more, weight 60 kg or less, creatinine 1.5 mg/dL or more), rivaroxaban 20 mg daily (15 mg if CrCl 50 or below, 15 mg as used with a P2Y12 inhibitor after PCI), edoxaban 60 mg daily (30 mg if CrCl 15 to 50, not if above 95) or dabigatran 150 mg twice daily (75 mg if CrCl 15 to 30). After elective PCI add aspirin and clopidogrel for 1 to 4 weeks, then clopidogrel to 6 months, then DOAC alone (Rec 11 to 13). Without PCI, DOAC alone (Rec 14). | G Rec 14 (p.e50): "DOAC monotherapy may be considered if there is no acute indication for concomitant antiplatelet therapy"; G Rec 13 (p.e50): "discontinuation of aspirin therapy with continuation of DOAC alone may be considered 1 year after PCI to reduce bleeding risk"; G text 11 (p.e54): "apixaban 5 mg twice daily or 2.5 mg twice daily in those with 2 of 3 criteria for high bleeding risk" |
| `Prescribe_PPI` | avoid: gastrointestinal bleeding during DAPT or antiplatelet plus anticoagulant therapy | Pantoprazole 40 mg once daily while on DAPT or an antiplatelet plus an anticoagulant (off-label for this indication, the labeled maintenance dose). Do not use omeprazole or esomeprazole with clopidogrel. | G Rec 16 (p.e50): "In patients with CCD on DAPT, the use of a PPI can be effective in reducing gastrointestinal bleeding risk"; PAN §7: "Concomitant administration of pantoprazole and clopidogrel in healthy subjects had no clinically important effect on exposure to the active metabolite of clopidogrel" |

## 7. Open questions for the user

See the proposal §8.
