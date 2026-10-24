---
project: ici-irae-monitoring
step: 2-3 (knowledge exploration + organization)
status: draft
date: 2026-10-25
source: projects/ici-irae-monitoring/resources/2017-esmo-immunotherapy-toxicities-haanen.pdf
citation_base: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119
---

# Extraction: ICI irAE monitoring (ESMO 2017, Haanen et al.)

The only source is the ESMO Clinical Practice Guideline "Management of toxicities from immunotherapy" (Ann Oncol 2017;28 Suppl 4:iv119-iv142, doi:10.1093/annonc/mdx225). Page references use the journal pagination (iv119 = PDF page 1). Case reports are out of scope. Where the guideline itself cites a case report (for example, ATG for refractory hepatitis), that point is excluded.

Abbreviations: ICPi = immune checkpoint inhibitor (the guideline's term), TFT = thyroid function test, G = CTCAE grade.

**Tumour response (scope check): confirmed out of scope.** The guideline makes no recommendation on monitoring tumour response. Restaging CT appears only as a time anchor for TFTs ("TFTs 4-6 weeks after cycle 4 (i.e. with restaging CT)", Fig 5). The guideline also mentions that vitiligo and colitis are associated with response (iv122, iv130). Neither is a monitoring instruction. So no `Monitor_Desired_State` sub-plan is needed.

---

## 1. Extraction table

| # | Element | Source quote (≤20 words) or paraphrase | Location | Kind | CQ | Conf. |
|---|---|---|---|---|---|---|
| E01 | Pre-treatment susceptibility assessment | "Before starting treatment, patients should be assessed in terms of susceptibility to develop irAEs." | iv121, Patient selection and baseline assessments | task (Enquiry) | CQ1 | high |
| E02 | Baseline work-up content | "patient history (and family history), general physical condition, autoimmune diseases, baseline laboratory tests and radiological exams" | iv121 | data items | CQ1 | high |
| E03 | Detailed baseline list is in Supplementary Table S1 (online only, **not in the PDF**) | paraphrase | iv121 | gap | CQ1 | low |
| E04 | Baseline radiology: CT chest/abdomen/pelvis, often brain MRI | paraphrase | iv121 | data item (description only) | CQ1 | medium |
| E05 | Pre-existing autoimmune disease is a risk factor | "at risk for worsening of their autoimmune disease while on immune checkpoint blockade" | iv121 | decision criterion; data item; population monitor | CQ1, CQ2, CQ4 | high (risk), low (executable rule) |
| E06 | Prior irAE on another ICI class is a risk factor | "patients that have had irAEs on ipilimumab are at risk of developing irAEs following anti-PD-1 treatment and vice versa" | iv121 | decision criterion; data item | CQ1, CQ2 | high |
| E07 | Interval between the two drugs "may be important" (long half-lives) | paraphrase, no threshold given | iv121 | non-executable criterion (excluded) | CQ2 | low |
| E08 | Inform the patient before starting; patient reports directly to the team | "Patients should be informed of the potential AEs of immunotherapy before treatment initiation." | iv121-iv122 | task (therapy plan) | CQ7 | high |
| E09 | Act promptly once an irAE develops | "prompt work-up is required and action should be taken to prevent further aggravation of AEs" | iv122 | goal (avoid) | CQ5, CQ7 | high |
| E10 | irAE onset timing | "mostly within weeks to 3 months"; first onset documented up to 1 year after stopping treatment | iv121 | frequency basis | CQ3 | high |
| E11 | Approved ICIs and indications (Table 1): ipilimumab, nivolumab, pembrolizumab, atezolizumab, avelumab, durvalumab, ipilimumab+nivolumab | paraphrase | iv120, Table 1 | therapy action context | CQ7 | high |
| E12 | Baseline endocrine panel | "Baseline Endocrine Panel: TSH, FT4, T3* TFTs" (*when indicated) | iv125, Fig 5 | data item | CQ1 | high |
| E13 | Abnormal baseline TFTs do not block treatment | "Baseline abnormal values do not preclude treatment; discuss with endocrinologist if uncertain" | iv125, Fig 5 | decision criterion (non-blocking) | CQ2 | high |
| E14 | Routine TFTs | "they should be carried out before every infusion or at least once a month (in the case of 2-weekly infusions)" | iv124, Thyroid gland disorders | monitoring item | CQ3, CQ6 | high |
| E15 | TFT schedule by regimen | Anti-CTLA4 (incl. combination): TFTs every cycle, and 4-6 weeks after cycle 4. Anti-PD-1/PD-L1: every cycle for 3 months, then every second cycle (2-weekly schedule) | iv125, Fig 5 | monitoring item | CQ3, CQ4 | high |
| E16 | Falling TSH means pituitary dysfunction may be present | "A falling TSH across two measurements with normal or lowered T4 may also suggest pituitary dysfunction" → weekly cortisol | iv125, Fig 5 | trigger | CQ3, CQ5 | high |
| E17 | Hyperthyroid with symptoms means withhold ICI | "Withhold ICPi if patient is unwell with symptomatic hyperthyroidism" | iv125, Fig 5 | trigger | CQ5 | high |
| E18 | Hypophysitis red flags | "Headache and visual disturbances require immediate evaluation" | iv126, Hypophysitis | trigger | CQ5 | high |
| E19 | Hypophysitis severity tiers: severe mass effect or hypoadrenalism → i.v. steroids after pituitary bloods, withhold ICI | paraphrase | iv127, Fig 6 | trigger | CQ5 | high |
| E20 | Hypophysitis is mainly linked to anti-CTLA4 | "Hypophysitis is very rare in patients treated with anti-PD-1 and anti-PD-L1" | iv126 | applicability note (not a gating rule) | CQ4 | high |
| E21 | Glucose surveillance | "It is recommended that blood glucose levels are regularly monitored in patients treated with ICPis" | iv126, Type 1 DM | monitoring item (no frequency given) | CQ3 | high |
| E22 | Diabetic ketoacidosis means urgent admission | "admit to hospital immediately and start treatment of newly onset type I DM [I, A]" | iv139, Table 2 | trigger | CQ5 | high |
| E23 | Liver surveillance | "serum transaminases and bilirubin measured before every cycle of treatment" | iv126, Hepatotoxicity Diagnosis | monitoring item | CQ3, CQ6 | high |
| E24 | Hepatitis grades: ALT/AST 3-5×ULN is G2 (withhold); 5-20× is G3 (stop); >20× is G4 (permanently discontinue) | paraphrase | iv128, Fig 7 | trigger | CQ5 | high |
| E25 | Skin AE work-up | Rule out other causes, then do "a careful and thorough physical examination of the skin including the mucosal areas" | iv122 | monitoring item (symptom-triggered) | CQ3 | high |
| E26 | Skin emergencies (DRESS, Sweet, SJS, TEN) | Permanently discontinue, hospitalise, dermatologist treats immediately | iv122 | trigger | CQ5 | high |
| E27 | No routine full-body skin exam | The guideline notes vitiligo is underreported because patients are not routinely examined. This is a remark, not a recommendation | iv122 | exclusion note | CQ3 | high |
| E28 | Diarrhoea work-up | Baseline investigations: FBC, UEC, LFTs, CRP, TFTs; stool microscopy and culture, viral PCR, C. difficile toxin | iv129, Fig 8 | monitoring item (symptom-triggered) | CQ3 | high |
| E29 | Definition of severe diarrhoea | G3/4, or "grade 1 or 2 diarrhoea with dehydration, fever, tachycardia or haematochezia" | iv129 | trigger | CQ5 | high |
| E30 | Stool testing on anti-CTLA4 | Stool analyses "should be carried out in every patient with significant diarrhoea treated with anti-CTLA4" | iv128 | sub-population lab within triggered work-up | CQ4 | high |
| E31 | No predictive colitis screen | "No routine biomarker has been found to predict ipilimumab-related colitis"; budesonide prophylaxis showed no benefit | iv130, iv129 | negative stance (no baseline predictive test) | CQ3 | high |
| E32 | Pneumonitis evaluation | "any new respiratory symptom should prompt a dedicated evaluation"; "should be assessed by CT" | iv131 | monitoring item (symptom-triggered) | CQ3, CQ5 | high |
| E33 | Pneumonitis vigilance | "Any respiratory symptom or sign must be carefully monitored" | iv131 | monitoring stance | CQ3 | high |
| E34 | Pneumonitis G3-4 (severe symptoms, new/worsening hypoxia) | Discontinue ICI, admit, i.v. steroids | iv132, Fig 9 | trigger | CQ5 | high |
| E35 | Neurological irAE | Rule out progression, seizures, infection, metabolic causes. "Early consultation with a neurologist is advised"; withhold for all but G1 | iv133 | monitoring item (symptom-triggered) + trigger | CQ3, CQ5 | high |
| E36 | Cardiac irAE (<1%) | "Early consultation with a cardiologist is recommended"; start steroids rapidly if suspected. No test or symptom list | iv133 | trigger; monitor only partly specified | CQ3, CQ5 | medium |
| E37 | Arthralgia/arthritis | Rheumatological history, joint and skin exam, autoimmune panel; severe cases go to a rheumatologist | iv133, iv137 Fig 13 | monitoring item (symptom-triggered) | CQ3, CQ5 | high |
| E38 | Renal surveillance | "Serum sodium, potassium, creatinine and urea should be measured before every infusion" | iv133, Renal toxicity | monitoring item | CQ3, CQ6 | high |
| E39 | Renal grades relative to baseline creatinine; oliguria means admit | "Attention needs to be paid to the patient's baseline creatinine" | iv138, Fig 14 | trigger; baseline value | CQ1, CQ5 | high |
| E40 | Ocular irAE (<1%) | Classification and treatment only; no surveillance or assessment instruction | iv133 | excluded | CQ3 | high |
| E41 | Haematological irAE | Rare; optimal treatment unknown; manage with a haematologist | iv134 | excluded | CQ3 | high |
| E42 | Allograft rejection | Single-agent ipilimumab may be given; anti-PD-1 carries a risk of acute rejection that "must be considered in discussing systemic therapy options" | iv134 | decision criterion + population monitor | CQ2, CQ4 | high (risk), low (monitor) |
| E43 | Infusion reactions | Not covered: irAEs/AEoSI "will be the subject of these Clinical Practice Guidelines" | iv119 | excluded | none | high |
| E44 | Fatigue | Most frequent anti-PD-1 AE; only a minority is due to hypothyroidism | iv119 | excluded (covered by thyroid monitor) | CQ3 | high |
| E45 | Opportunistic infection on long immunosuppression | PJP prophylaxis "should be considered according to local guidelines" | iv122 | excluded (irAE-treatment management) | none | high |
| E46 | Late endocrine dysfunction | "Late endocrine dysfunction can occur" | iv125, Fig 5 | frequency basis | CQ3 | high |

## 2. Systematic coverage

Every organ-system irAE section and every baseline or surveillance statement in the guideline appears below.

| Guideline section / statement | Location | Decision | Source-grounded reason |
|---|---|---|---|
| Patient selection and baseline work-up | iv121 | **Enquiry** `Get_Baseline_Data` (not a monitor) | Baseline data, CQ1 |
| History of autoimmune disease | iv121 | **candidate** `Monitor_Autoimmune_Flare` + Decision criterion | The guideline names the sub-population at risk of worsening. It gives no monitoring instruction, so the monitor is assistant-proposed |
| Prior irAE on ipilimumab or anti-PD-1 | iv121 | Decision criterion only (no separate monitor) | Higher risk of any irAE. The organ monitors below already cover it, and the guideline gives no extra monitoring step |
| Interval between drugs | iv121 | exclude | No threshold or action given |
| Patient information and direct reporting | iv121-122 | therapy action `Inform_Patient_irAE_Risk` | Explicit pre-treatment recommendation |
| Skin toxicity | iv122-123, Fig 3, Table 2 | **candidate** `Monitor_Skin` | Assessment on presentation and urgent triggers are specified |
| Thyroid disorders | iv123-125, Fig 5 | **candidate** `Monitor_Thyroid` | Routine TFT schedule is explicit |
| Hypophysitis | iv126-127, Fig 5-6 | **candidate** `Monitor_Hypophysitis` | Cortisol when indicated by symptoms or falling TSH; red-flag symptoms |
| Type 1 diabetes | iv126, Table 2 | **candidate** `Monitor_Diabetes` | "regularly monitored" glucose; DKA trigger |
| Hepatotoxicity | iv126-128, Fig 7 | **candidate** `Monitor_Hepatitis` | Transaminases and bilirubin before every cycle |
| GI toxicity, anti-CTLA4 | iv127-130, Fig 8 | **candidate** `Monitor_Colitis` | Triggered work-up and severe-diarrhoea triggers |
| GI toxicity, anti-PD-1 | iv130 | merged into `Monitor_Colitis` | Same symptom; no separate instruction |
| GI toxicity, combination (incl. pancreatitis, small-bowel enteritis) | iv130-131 | merged into `Monitor_Colitis` (pancreatitis/enteritis **excluded** as separate monitors) | Rare; "require discontinuation" but no detection instruction |
| Colitis prediction biomarkers / microbiota / budesonide prophylaxis | iv129-130 | exclude (record as negative stance in `Monitor_Colitis`) | "No routine biomarker"; prophylaxis failed |
| Pneumonitis | iv131-133, Fig 9 | **candidate** `Monitor_Pneumonitis` | "Any respiratory symptom or sign must be carefully monitored" |
| Neurological toxicity | iv133, Fig 10-12 | **candidate** `Monitor_Neurological` | Triggered work-up, neurologist, withhold rule |
| Cardiac toxicity | iv133 | **candidate** `Monitor_Myocarditis` | Triggered action is specified; symptom list and test are not (assistant completes them) |
| Rheumatological toxicity | iv133, Fig 13 | **candidate** `Monitor_Arthralgia` | Triggered assessment and escalation specified |
| Renal toxicity | iv133, Fig 14 | **candidate** `Monitor_Nephritis` | Na/K/creatinine/urea before every infusion |
| Ocular toxicity | iv133 | **exclude** | No assessment, symptom or surveillance instruction, only treatment by severity |
| Haematological toxicity | iv134 | **exclude** | No surveillance instruction; "optimal treatment ... unknown" |
| Allograft rejection | iv134 | **candidate** `Monitor_Allograft_Rejection` (population) + Decision criterion | Sub-population stated (organ allograft, anti-PD-1). No monitoring instruction, so the monitor is assistant-proposed |
| Infusion reactions | iv119 | exclude | Explicitly outside the guideline's subject |
| Fatigue | iv119 | exclude | No instruction; thyroid monitor covers the hypothyroid cause |
| Tissue biopsy | iv121 | exclude | "role ... is not established"; diagnostic, not surveillance |
| PJP prophylaxis / steroid side-effect care (Ca/VitD, glucose on steroids >4 wk, Fig 8/14) | iv122, Fig 8, Fig 14 | exclude | Management of irAE treatment, not ICI monitoring (see open question Q8) |
| Re-challenge after colitis / pneumonitis | iv130, iv133 | exclude | Post-irAE management decisions |
| Hypophysitis patient education (sick-day rules, alert card) | iv127, Fig 6 | exclude | After diagnosis only |
| Baseline radiology / restaging CT | iv121, Fig 5 | exclude as monitor | Tumour staging and response are out of scope |
| Pre-infusion surveillance completion (TFT, LFT, renal, glucose) | iv124, iv126, iv133 | **candidate** `Monitor_PreInfusion_Surveillance` (action_completion) | CQ6 |

## 3. Candidate monitoring actions

All values are on one line, ready for metaprops. Common keys:
- `source_kind=clinical_guideline`
- `knowledge_origin=ESMO 2017 guideline` (or `ESMO 2017 guideline + assistant operationalization` where invention ≠ none)
- `goal.verb=order`
- `ServiceRequest.intent=order`

`monitored_target` traces to `Administer_ICI`, except where a monitor states otherwise. Sub-plan placement: #1 in `Monitor_Actions`; #2 to #14 in `Monitor_Undesired_State`.

### 3.1 `Monitor_PreInfusion_Surveillance` (category=action_completion)
- code: completion check of the guideline pre-infusion blood panel (TSH and FT4, ALT/AST and bilirubin, sodium/potassium/creatinine/urea, blood glucose)
- occurrenceTiming: before every ICI infusion (each cycle), for the duration of ICI therapy
- patientInstruction: attend for blood tests before each scheduled infusion
- performerInstruction: if any component of the panel is missing before an infusion, obtain it and review results before administering the ICI
- applies_when: all_patients_on_therapy
- monitored_target: completion of the planned pre-infusion surveillance bloods before each infusion of Administer_ICI
- monitoring_stance: recommended. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: assistant_completed_from_guidelines
- instrument: order/result audit of the named lab tests
- trigger: missing pre-infusion panel at the time of a scheduled infusion
- frequency_basis: guideline sets "before every infusion/cycle" for TFTs, liver and renal tests. Glucose is aligned to the same draw (assistant-proposed, see 3.5)
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Thyroid gland disorders iv124. source.2: … iv119, Hepatotoxicity Diagnosis iv126. source.3: … iv119, Renal toxicity iv133
- literature_basis: TFTs "before every infusion or at least once a month", transaminases and bilirubin "before every cycle", sodium/potassium/creatinine/urea "before every infusion"
- assistant_invention: framing the guideline's pre-infusion tests as one completion audit, adding glucose to the same draw, and the "obtain before administering" rule
- cq: CQ6, CQ7

### 3.2 `Monitor_Thyroid`
- code: thyroid function tests (TSH, FT4; T3 when indicated)
- occurrenceTiming: baseline, then for anti-CTLA4-containing regimens every cycle plus 4-6 weeks after cycle 4. For anti-PD-1/PD-L1, every cycle for the first 3 months, then every second cycle on a 2-weekly schedule (at least monthly)
- patientInstruction: report fatigue, weight change, palpitations, heat or cold intolerance, or feeling unwell
- performerInstruction: interpret TSH/FT4 per the ESMO thyroid algorithm. If symptomatic hyperthyroidism and unwell, withhold ICI and start a beta-blocker. If hypothyroid with symptoms, start thyroxine and continue ICI. If TSH falls across two measurements with normal or low FT4, or TSH is low with low FT4, check 9 am cortisol. Note that CT iodine may affect TFTs
- applies_when: all_patients_on_therapy (the schedule varies by regimen, per Fig 5)
- monitoring_stance: recommended. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: serum TSH and FT4 (T3 when indicated)
- trigger: symptomatic hyperthyroidism with patient unwell; falling or low TSH with low FT4 (possible hypopituitarism)
- frequency_basis: guideline-stated (iv124 text; Fig 5). "Late endocrine dysfunction can occur"
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Thyroid gland disorders iv124. source.2: … iv119, Figure 5 (ICPi monitoring and management: thyroid function) iv125
- literature_basis: thyroid dysfunction is mostly detected by routine TSH/FT4, which "should be carried out before every infusion or at least once a month". Fig 5 gives the regimen-specific schedule and the management algorithm
- assistant_invention: patient symptom wording (generic thyroid symptoms)
- cq: CQ3, CQ5, CQ7

### 3.3 `Monitor_Hypophysitis`
- code: pituitary symptom screen with triggered 9 am cortisol (and pituitary axis bloods)
- occurrenceTiming: each visit (symptom review); 9 am cortisol when indicated by symptoms or by a falling TSH, weekly while TSH is falling across two measurements with normal or low FT4
- patientInstruction: report headache, visual disturbance, marked fatigue, mood change, dizziness or feeling faint, and seek urgent review if unwell
- performerInstruction: if severe headache, any visual disturbance or severe hypoadrenalism (hypotension, severe electrolyte disturbance), send pituitary axis bloods (9 am cortisol, ACTH, TSH/FT4, LH, FSH, sex hormones, IGF-1, prolactin), start i.v. methylprednisolone 1 mg/kg, withhold ICI, arrange pituitary MRI and consult endocrinology
- applies_when: all_patients_on_therapy. The guideline notes it is mainly an anti-CTLA4 toxicity and "very rare" with anti-PD-1/PD-L1, but Fig 5 also lists "Cortisol as indicated by symptoms/falling TSH" for anti-PD-1/PD-L1
- monitoring_stance: recommended (event-triggered cortisol). guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: patient symptom report; 9 am serum cortisol; pituitary axis panel; pituitary MRI when indicated
- trigger: headache or visual disturbance (immediate evaluation); severe hypoadrenalism; falling TSH with normal or low FT4
- frequency_basis: guideline-stated triggers (Fig 5, Fig 6). The each-visit symptom review is assistant-proposed to give the "immediate evaluation" instruction a place in the schedule
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Hypophysitis iv126. source.2: … iv119, Figure 5 iv125. source.3: … iv119, Figure 6 (management of hypophysitis) iv127
- literature_basis: "Headache and visual disturbances require immediate evaluation". Weekly cortisol when TSH falls with normal or low T4. Fig 6 gives severity tiers and the pituitary bloods
- assistant_invention: each-visit symptom review cadence; patient symptom wording beyond headache and visual disturbance (from Fig 6 tiers)
- cq: CQ3, CQ5, CQ7

### 3.4 `Monitor_Hepatitis`
- code: serum transaminases (ALT, AST) and total bilirubin
- occurrenceTiming: baseline and before every cycle of ICI
- patientInstruction: report jaundice, dark urine, or right-upper-abdominal pain (hepatitis is usually asymptomatic)
- performerInstruction: if ALT/AST is >ULN to 3×ULN, repeat in 1 week. If 3-5×ULN (G2), withhold ICI, recheck LFTs/INR/albumin every 3 days, review medications and alcohol, and do a liver screen. If 5-20×ULN (G3), stop ICI and start steroids. If >20×ULN (G4), permanently discontinue ICI, start i.v. methylprednisolone 2 mg/kg, and get a hepatology consult
- applies_when: all_patients_on_therapy
- monitoring_stance: recommended. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: serum ALT, AST, total bilirubin (INR and albumin when abnormal)
- trigger: ALT/AST >3×ULN or rising bilirubin
- frequency_basis: guideline-stated "before every cycle"
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Hepatotoxicity Diagnosis iv126. source.2: … iv119, Figure 7 (management of hepatitis) iv128
- literature_basis: "All patients undergoing ICPi therapy should be assessed ... with serum transaminases and bilirubin measured before every cycle". Hepatitis is usually asymptomatic and detected on routine blood monitoring
- assistant_invention: patient symptom wording (the guideline says hepatitis is usually asymptomatic)
- cq: CQ3, CQ5, CQ7

### 3.5 `Monitor_Diabetes`
- code: blood glucose (with triggered ketone/acid-base assessment)
- occurrenceTiming: baseline and before every ICI infusion with the pre-infusion bloods (assistant-proposed), plus on symptoms
- patientInstruction: report excessive thirst, frequent urination, weight loss, nausea or vomiting, abdominal pain, or drowsiness
- performerInstruction: if new hyperglycaemia, measure C-peptide and GAD and islet-cell antibodies to distinguish type 1 from type 2 DM. If ketoacidosis (G3-4), admit immediately and treat per local guidelines; corticosteroids are not recommended
- applies_when: all_patients_on_therapy
- monitoring_stance: recommended. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: assistant_completed_from_guidelines
- instrument: blood glucose; triggered C-peptide, GAD/ICA antibodies, ketones
- trigger: new hyperglycaemia or ketoacidosis symptoms
- frequency_basis: the guideline says "regularly monitored" without a cadence. Same-draw-as-pre-infusion bloods is proposed so glucose is checked whenever the drug is given (MonitoringFrequency rule 1). DKA is acute, hence the symptom trigger (rule 2)
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Type 1 diabetes mellitus iv126. source.2: … iv119, Table 2 (Immune-related endocrinopathies) iv139
- literature_basis: "It is recommended that blood glucose levels are regularly monitored in patients treated with ICPis". Ketoacidosis is life-threatening. Type 1 DM G3-4 requires immediate admission [I, A]
- assistant_invention: cadence (before every infusion); patient DKA symptom wording
- cq: CQ3, CQ5, CQ7

### 3.6 `Monitor_Nephritis`
- code: serum sodium, potassium, creatinine and urea
- occurrenceTiming: baseline and before every ICI infusion
- patientInstruction: report reduced urine output, blood in urine, or swelling
- performerInstruction: grade creatinine against the patient's baseline. G1 (1.5×baseline or >ULN to 1.5×ULN): continue ICI and repeat creatinine weekly. G2 (>1.5-3× baseline): withhold ICI, hydrate, review in 48-72 h, and discuss with a nephrologist if not improving. G3 (>3× baseline or >3-6×ULN): withhold ICI, admit, and repeat creatinine every 24 h. Oliguria means inpatient admission. Stop nephrotoxic drugs and rule out infection or obstruction
- applies_when: all_patients_on_therapy
- monitoring_stance: recommended. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: serum Na, K, creatinine, urea; triggered urinalysis/UPCR, renal ultrasound
- trigger: creatinine >1.5× baseline; oliguria
- frequency_basis: guideline-stated "before every infusion"
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Renal toxicity iv133. source.2: … iv119, Figure 14 (management of nephritis) iv138
- literature_basis: "Serum sodium, potassium, creatinine and urea should be measured before every infusion". Fig 14 grades against baseline creatinine
- assistant_invention: patient symptom wording (only oliguria is source-stated: "Advise patient to notify if oliguric")
- cq: CQ3, CQ5, CQ7

### 3.7 `Monitor_Skin`
- code: skin and mucosa symptom screen with triggered physical examination and CTCAE grading
- occurrenceTiming: each visit (symptom review), with full skin exam on any skin symptom
- patientInstruction: report any new rash, itching, blistering, skin peeling, mouth or genital sores, or rash with fever
- performerInstruction: exclude other causes. Examine all skin including mucosa, grade by BSA (CTCAE), and check FBC, liver and kidney tests if needed. G2: continue and recheck weekly. G3: withhold ICI and refer to dermatology. G4, SJS/TEN/DRESS: permanently discontinue ICI, hospitalise and get urgent dermatology care
- applies_when: all_patients_on_therapy
- monitoring_stance: symptom_triggered_only. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: patient symptom report; physical examination with BSA/CTCAE grading
- trigger: skin sloughing or epidermal detachment, mucosal involvement, rash with fever (possible SJS/TEN/DRESS)
- frequency_basis: skin AEs develop "within the first few weeks". The guideline specifies assessment on presentation only. The each-visit symptom review is assistant-proposed. No routine dermatologist full-body exam is recommended
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Immune-related skin toxicity iv122-iv123. source.2: … iv119, Figure 3 (management of skin rash) iv123
- literature_basis: when a patient presents with a skin AE, rule out other causes, then do "a careful and thorough physical examination of the skin including the mucosal areas". Life-threatening reactions mean permanent discontinuation and hospitalisation
- assistant_invention: each-visit symptom review cadence; patient symptom wording
- cq: CQ3, CQ5, CQ7

### 3.8 `Monitor_Colitis`
- code: diarrhoea and colitis symptom screen with triggered blood and stool work-up
- occurrenceTiming: each visit (symptom review) and on any diarrhoea, continuing after the last dose (enterocolitis may occur months after ipilimumab)
- patientInstruction: report any increase in stool frequency over baseline, blood or mucus in stool, abdominal pain, nocturnal stools, fever, or signs of dehydration
- performerInstruction: on diarrhoea, test FBC, UEC, LFTs, CRP and TFTs, plus stool microscopy and culture, viral PCR and C. difficile toxin (mandatory for significant diarrhoea on anti-CTLA4). G2 (4-6 stools/day over baseline): withhold ICI, contact the patient every 72 h, and book sigmoidoscopy/colonoscopy. Severe (≥7 stools/day, or G1-2 with dehydration, fever, tachycardia or haematochezia): hospitalise, give i.v. methylprednisolone 1-2 mg/kg, and do endoscopy
- applies_when: all_patients_on_therapy (the C. difficile stool rule in the guideline text is worded for anti-CTLA4, but Fig 8 lists stool tests for all patients)
- monitoring_stance: symptom_triggered_only. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: patient symptom report (stool count vs baseline); triggered FBC, UEC, LFT, CRP, TFT, stool tests, endoscopy
- trigger: severe diarrhoea as defined, or G2 persisting >3 days; peritonism/perforation
- frequency_basis: symptom-triggered. The guideline gives a triggered work-up and states "No routine biomarker" predicts colitis. Each-visit review is assistant-proposed
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Gastrointestinal toxicity iv128-iv130. source.2: … iv119, Figure 8 (management of diarrhoea and colitis) iv129
- literature_basis: severe diarrhoea definition (iv129). Diarrhoea on anti-CTLA4 needs work-up with CBC, electrolytes and stool analyses. No routine predictive biomarker; prophylactic budesonide is ineffective
- assistant_invention: each-visit review cadence; patient symptom wording
- cq: CQ3, CQ5, CQ7

### 3.9 `Monitor_Pneumonitis`
- code: respiratory symptom screen with triggered chest CT
- occurrenceTiming: each visit (symptom review) and on any new respiratory symptom, throughout therapy (pneumonitis tends to occur months after initiation)
- patientInstruction: report new or worsening cough, shortness of breath, chest pain, or fever
- performerInstruction: on any new respiratory symptom, do a dedicated evaluation with CT. Order chest X-ray and bloods (FBC/UEC/LFTs/TFTs/Ca/ESR/CRP), and consider sputum and infection screen. G2: withhold ICI and monitor symptoms daily. G3-4 (severe symptoms, new or worsening hypoxia): discontinue ICI, admit, give i.v. methylprednisolone 2-4 mg/kg/day, and arrange respiratory review and HRCT ± bronchoscopy/BAL
- applies_when: all_patients_on_therapy
- monitoring_stance: symptom_triggered_only. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: patient symptom report; triggered chest CT, chest X-ray, oxygen saturation, bloods
- trigger: new/worsening hypoxia, severe dyspnoea, difficulty breathing
- frequency_basis: guideline says "Any respiratory symptom or sign must be carefully monitored" and every new symptom gets CT. Each-visit review is assistant-proposed
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Immune-related pneumonitis iv131-iv133. source.2: … iv119, Figure 9 (management of pneumonitis) iv132
- literature_basis: "any new respiratory symptom should prompt a dedicated evaluation". Patients with new cough, shortness of breath or hypoxia "should be assessed by CT"
- assistant_invention: each-visit review cadence
- cq: CQ3, CQ5, CQ7

### 3.10 `Monitor_Neurological`
- code: neurological symptom screen with triggered neurological examination and work-up
- occurrenceTiming: each visit (symptom review) and on any new neurological symptom
- patientInstruction: report new weakness, numbness or tingling, double vision or drooping eyelids, facial weakness, difficulty swallowing or breathing, confusion, severe headache, or neck stiffness
- performerInstruction: exclude progression, seizures, infection and metabolic causes. For any symptom beyond mild (or any cranial nerve problem), withhold ICI. Get an early neurology consult and MRI, NCS/EMG, lumbar puncture as indicated. If severe (limits self-care, respiratory involvement), admit, give i.v. methylprednisolone 2 mg/kg, and arrange daily neurological review ± vital capacity
- applies_when: all_patients_on_therapy
- monitoring_stance: symptom_triggered_only. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: patient symptom report; triggered neurological exam, MRI, NCS/EMG, lumbar puncture, vital capacity
- trigger: respiratory or bulbar weakness, rapidly progressive weakness, altered consciousness
- frequency_basis: onset 6-13 weeks (iv133). The guideline specifies triggered work-up only. Each-visit review is assistant-proposed
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Neurological toxicity iv133. source.2: … iv119, Figures 10-12 iv134-iv136
- literature_basis: rule out other causes. "Early consultation with a neurologist is advised". Withhold ICI for all but grade 1 until the AE is defined [V, B]
- assistant_invention: each-visit review cadence; patient symptom wording drawn from the syndromes in Fig 10-12
- cq: CQ3, CQ5, CQ7

### 3.11 `Monitor_Myocarditis`
- code: cardiac symptom screen with triggered cardiology assessment
- occurrenceTiming: each visit (symptom review) and on any new cardiac symptom
- patientInstruction: report chest pain, breathlessness, palpitations, fainting, or leg swelling
- performerInstruction: if a checkpoint-inhibitor cardiac AE (myocarditis) is suspected, admit, start high-dose methylprednisolone 1-2 mg/kg immediately, and consult cardiology early. Escalate to MMF or tacrolimus if deteriorating
- applies_when: all_patients_on_therapy
- monitoring_stance: symptom_triggered_only. guideline_status: not_specified_as_a_guideline_monitoring_task. provenance_type: assistant_completed_from_guidelines
- instrument: patient symptom report; clinician cardiology assessment (the guideline names no test)
- trigger: suspected myocarditis
- frequency_basis: cardiac AEs are rare (<1%) but serious, so event-driven. Each-visit review is assistant-proposed
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Cardiac toxicity iv133. source.2: … iv119, Table 2 (Cardiac toxicity) iv139
- literature_basis: myocarditis, pericarditis, arrhythmias, cardiomyopathy and impaired ventricular function are reported. "Early consultation with a cardiologist is recommended". Give steroids rapidly if suspected
- assistant_invention: symptom list and each-visit screen (the guideline gives no symptoms, tests or surveillance for cardiac AEs)
- cq: CQ3, CQ5, CQ7

### 3.12 `Monitor_Arthralgia`
- code: joint and muscle symptom screen with triggered rheumatological assessment
- occurrenceTiming: each visit (symptom review) and on joint or muscle symptoms
- patientInstruction: report joint pain, swelling or stiffness, or muscle pain or weakness
- performerInstruction: take a rheumatological history, examine all joints and skin, and order an autoimmune blood panel. G2: consider withholding ICI and refer to rheumatology early. G3 (severe, limits self-care): withhold ICI, start prednisolone 0.5-1 mg/kg, and get rheumatology advice
- applies_when: all_patients_on_therapy
- monitoring_stance: symptom_triggered_only. guideline_status: specified_as_a_guideline_monitoring_task. provenance_type: guideline_specified
- instrument: patient symptom report; joint examination; autoimmune blood panel; US/MRI of affected joints
- trigger: severe polyarthritis or symptoms limiting self-care
- frequency_basis: symptom-triggered per Fig 13. Each-visit review is assistant-proposed
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Rheumatological toxicity iv133. source.2: … iv119, Figure 13 (management of arthralgia) iv137
- literature_basis: myalgias and arthralgias in 2%-12%. Severe symptoms "should prompt consultation with a rheumatologist" [V, B]. Fig 13 gives grade-based assessment
- assistant_invention: each-visit review cadence; patient symptom wording
- cq: CQ3, CQ5, CQ7

### 3.13 `Monitor_Autoimmune_Flare` (population-scoped)
- code: pre-existing autoimmune disease activity review
- occurrenceTiming: baseline and each visit during ICI therapy
- patientInstruction: report any flare or worsening of your known autoimmune condition
- performerInstruction: if the pre-existing autoimmune disease worsens, assess severity and involve the specialist managing that disease; manage organ-specific features per the relevant irAE algorithm
- applies_when: patients with a history of autoimmune disease, or who are being actively treated for an autoimmune disease (iv121)
- precondition: `pre_existing_autoimmune_disease = true`
- monitoring_stance: proposed_by_assistant. guideline_status: not_specified_as_a_guideline_monitoring_task. provenance_type: assistant_completed_from_guidelines
- instrument: patient symptom report; clinician review of disease activity
- trigger: worsening of the pre-existing autoimmune disease
- frequency_basis: tied to the infusion-visit cadence (MonitoringFrequency rule 1). The guideline gives no cadence
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Patient selection and baseline assessments iv121
- literature_basis: such patients "are at risk for worsening of their autoimmune disease while on immune checkpoint blockade". The guideline gives no monitoring instruction
- assistant_invention: the entire monitoring action (cadence, instrument, performer step); only the sub-population and risk are sourced
- cq: CQ4, CQ7

### 3.14 `Monitor_Allograft_Rejection` (population-scoped)
- code: allograft function review (graft-specific function tests per transplant team)
- occurrenceTiming: baseline and each visit during anti-PD-1 therapy
- patientInstruction: report symptoms of graft dysfunction as instructed by your transplant team
- performerInstruction: if graft dysfunction is suspected, contact the transplant team urgently
- applies_when: patients with allografted organs receiving anti-PD-1 therapy (iv134). The guideline says single-agent ipilimumab "may be administered without necessarily causing rejection"
- precondition: `organ_allograft = true and (ici_regimen = anti_PD1 or ici_regimen = anti_CTLA4_plus_anti_PD1)`
- monitoring_stance: proposed_by_assistant. guideline_status: not_specified_as_a_guideline_monitoring_task. provenance_type: assistant_completed_from_guidelines
- instrument: clinician review with graft-specific function tests (assistant-proposed)
- trigger: suspected acute graft rejection
- frequency_basis: tied to the infusion-visit cadence. The guideline gives no cadence
- source.1: ESMO 2017 Haanen et al., Ann Oncol 28(Suppl 4) iv119, Allograft rejection iv134
- literature_basis: several case reports document acute allograft rejection after anti-PD-1. "This very significant risk must be considered in discussing systemic therapy options"
- assistant_invention: the entire monitoring action; only the sub-population and risk are sourced (the guideline's own evidence here is case reports it cites)
- cq: CQ4, CQ7

## 4. Data items (only those a condition reads)

| Name | Type | Unit / values | Read by | Asked by | Source |
|---|---|---|---|---|---|
| `pre_existing_autoimmune_disease` | boolean | n/a | Decision arguments; precondition of `Monitor_Autoimmune_Flare` | `Get_Baseline_Data` | iv121 |
| `prior_irAE_on_ICI` | boolean | n/a (irAE on a previous ICI course, either class) | Decision arguments | `Get_Baseline_Data` | iv121 |
| `organ_allograft` | boolean | n/a (solid-organ allograft recipient) | Decision arguments; precondition of `Monitor_Allograft_Rejection` | `Get_Baseline_Data` | iv134 |
| `ici_regimen` | text | `anti_CTLA4`, `anti_PD1`, `anti_PDL1`, `anti_CTLA4_plus_anti_PD1` | precondition of `Monitor_Allograft_Rejection`; also selects the Fig 5 TFT schedule (not executable) | `Get_Baseline_Data` | Table 1, Fig 5, iv134 |

**Baseline values the guideline asks for that no condition reads.** These go in the `Get_Baseline_Data` description, not as sources, unless the user wants them stored (Q5):
- baseline TSH and FT4 (T3 when indicated) (Fig 5)
- ALT, AST and bilirubin (iv126)
- Na, K, creatinine and urea; baseline creatinine is the reference for nephritis grading (iv133, Fig 14)
- blood glucose (iv126)
- patient and family history and general physical condition (iv121)
- baseline CT chest/abdomen/pelvis ± brain MRI (iv121)

## 5. Draft conditions (PROforma expressions)

**The guideline gives no executable criterion for the pre-treatment decision.** It names risk groups (autoimmune disease, prior irAE, allograft) and says abnormal baseline TFTs "do not preclude treatment". It never states that any factor blocks ICI or mandates specialist review. The minimal faithful rule below is **assistant-proposed** (CQ2).

`Pretreatment_Decision` (choice_mode single):
- Candidate `Start_ICI` (start the ICI therapy plan with standard monitoring):
  `for, pre_existing_autoimmune_disease = false and prior_irAE_on_ICI = false and organ_allograft = false`
- Candidate `Specialist_Review_Before_ICI` (risk factor present; discuss risk/benefit with the relevant specialist before starting):
  `for, pre_existing_autoimmune_disease = true or prior_irAE_on_ICI = true or organ_allograft = true`
- Abnormal baseline TFTs are deliberately **not** an argument, because Fig 5 says they do not preclude treatment. "Discuss with endocrinologist if uncertain" cannot be executed.

Population preconditions:
- `Monitor_Autoimmune_Flare`: `pre_existing_autoimmune_disease = true`
- `Monitor_Allograft_Rejection`: `organ_allograft = true and (ici_regimen = anti_PD1 or ici_regimen = anti_CTLA4_plus_anti_PD1)`

Therapy gating (see Q2): if the therapy plan were gated only on `result_of(Pretreatment_Decision) = Start_ICI`, the two population monitors could never fire. Their sub-populations are exactly the patients routed to specialist review. The proposed gating is therefore:
- `ICI_Therapy`: `result_of(Pretreatment_Decision) = Start_ICI or result_of(Pretreatment_Decision) = Specialist_Review_Before_ICI`
- `Obtain_Specialist_Review` (therapy-plan action, before `Administer_ICI`): `result_of(Pretreatment_Decision) = Specialist_Review_Before_ICI`

All of these must be type-checked with `check_expression` at build time. The text-enum comparison `ici_regimen = anti_PD1` follows the example's `contraindications = none` pattern.

## 6. Therapy actions (State Achievement goals)

Proposed sub-plan `ICI_Therapy`, after `Pretreatment_Decision`:

| Action | goal.verb | goal.noun_phrase | Basis |
|---|---|---|---|
| `Inform_Patient_irAE_Risk` | avoid | delayed detection and aggravation of immune-related adverse events (patient informed of potential irAEs and told to report symptoms directly to the treating team) | iv121-122: "Patients should be informed of the potential AEs ... before treatment initiation"; "prompt work-up is required ... to prevent further aggravation of AEs" |
| `Obtain_Specialist_Review` (only if `Specialist_Review_Before_ICI`) | avoid | unassessed risk of autoimmune-disease worsening, recurrent irAEs or allograft rejection on ICI | iv121, iv134 (risk statements). Assistant-proposed action |
| `Administer_ICI` | achieve | ICI therapy (anti-CTLA4, anti-PD-1/PD-L1 or combination) delivered for an approved indication (ESMO Table 1) | Table 1, iv120. The anticancer effect is not monitored (tumour response is out of scope) |

Root plan goal (suggested): `goal.verb=treat`, noun phrase "adult cancer treated with immune checkpoint inhibitors, with monitoring for immune-related adverse events".

All `undesired_ade` monitors trace to `Administer_ICI`. `Monitor_PreInfusion_Surveillance` traces to `Administer_ICI` (the surveillance planned around each infusion).

## 7. Open questions for the user

1. **Pre-treatment Decision (CQ2).** ESMO gives no "start without specialist review" criterion. Accept the assistant-proposed rule in §5 (any of autoimmune disease, prior irAE, allograft means specialist review), or narrow it? For example, allograft only, or allograft only with anti-PD-1.
2. **Gating.** Should patients routed to specialist review still enter `ICI_Therapy` (needed for the two population monitors to fire), via the `Obtain_Specialist_Review` action as proposed? The alternative is a third candidate `Do_Not_Start_ICI`, which the guideline does not support.
3. **Population monitors (CQ4).** `Monitor_Autoimmune_Flare` and `Monitor_Allograft_Rejection` are entirely assistant-designed: the guideline gives the sub-population and risk but no monitoring instruction. Keep both as `proposed_by_assistant`, or exclude them and answer CQ4 only through the regimen-specific thyroid schedule?
4. **Allograft and anti-PD-L1.** The guideline names only anti-PD-1. Should `anti_PDL1` also be included in the precondition?
5. **Baseline labs as data items.** Store baseline TSH/FT4, LFTs, creatinine and glucose as Enquiry sources (useful for the nephritis "×baseline" trigger)? Or only list them in the Enquiry description, since no executable condition reads them?
6. **Each-visit symptom review cadence.** The guideline specifies only triggered assessment for skin, GI, pneumonitis, neuro, cardiac, rheum and hypophysitis. Accept "each visit (symptom review)" as the assistant-proposed cadence, continuing after discontinuation? ESMO says irAE onset can be up to 1 year after stopping. If so, should post-treatment follow-up be capped at 1 year?
7. **Cardiac.** `Monitor_Myocarditis` is the least sourced monitor: the guideline names no symptoms or tests. Keep it with assistant-completed symptoms, or exclude it like ocular and haematological?
8. **Steroid-related monitoring.** Fig 8 and Fig 14 add glucose, vitamin D and PJP prophylaxis checks for patients on steroids >4 weeks. These are excluded as irAE-treatment management. Confirm.
9. **Source inconsistencies.**
   - Table 2 labels the GI section "Gastrointestinal hepatotoxicity". Its G3-4 text copies the hepatitis wording ("consult a hepatologist ... liver tests") and says "Add MMF if improvement".
   - The G2 hepatitis recheck frequency differs: text says twice weekly (iv126), Table 2 says 1-2×/week, Fig 7 says every 3 days.
   - Proposal: cite the Figures for performer steps and the narrative text for surveillance cadence. OK?
10. **Supplementary Table S1** (the detailed baseline work-up) is online only and not in the PDF. Can you supply it, or proceed without it?
