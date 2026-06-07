# Obesity and GLP-1 Clinical Guidelines: Monitoring Effects of Therapy — An Ontological Approach

> Source: know-how authored by Mor Peleg, captured verbatim (lightly formatted) for provenance.
> This document is the domain know-how that the `cig-monitoring` skill operationalizes.

## Aims

Instantiate the PROforma computer-interpretable guideline (CIG) OWL ontology for a clinical guideline within the defined scope, focusing on:

- monitoring of completion of therapy recommendations (**Action Enactment goals**), and
- monitoring of desired and undesired effects of actions (**State Achievement goals**).

## Steps

### 1. Define the scope of the CIG

**Example:** Obesity management in adults using glucagon-like peptide 1 (GLP-1) analogs.

### 2. Locate the best clinical guidelines for the defined scope

Locate guidelines that also include information about the indications for the therapy option, mechanisms of action, related ADEs, and how to monitor for successful therapy and for ADEs and risks of therapy.

Allow the user to provide the PDF files of clinical guidelines that they located by placing them in the shared guidelines library, where they can be reused across CIG projects.

**Example:** `cig/guidelines/` (e.g. `AGA 2022 Guidelines.pdf`)

### 3. Extract therapy recommendations, clinical goals, and monitoring

**Find the THERAPY RECOMMENDATIONS.** In case they are vague, try to complete them using additional sources from the web.

> **Example:** A recommendation may say: "Pharmacotherapy should be offered, in conjunction with health behaviour changes". But what the health behaviour changes are is not indicated within the recommendation. Examining the same clinical guideline, you can find "Ensuring adequate nutritional and protein intake and emphasizing the importance of physical activity to retain muscle mass". Examining additional guidelines in the collection you can find specific instructions: "hypocaloric diets (500–600 kcal/d deficit); 150 minutes of physical activity per week + twice a week muscle strengthening".

**Find the CLINICAL GOALS of therapy** mentioned in the guidelines.

> **Examples:** Weight reduction of 5–10% body weight. In addition to weight loss, treatment targets can include reduction in cardiometabolic risk, improvement, remission, or resolution of adiposity-related complications, maintenance of weight loss, management of appetite and/or cravings, and improvement in quality of life.

Sometimes the clinical goals refer to **clinical abstractions**, and you would need to define these abstractions based on raw data that can be measured to compute the abstractions.

> **Example:** the guidelines refer to "reduction in cardiometabolic risk". Cardiometabolic risk is computed from components. A search within the guidelines collection shows that the components include BP, lipid panel, blood glucose, A1C.

**See whether the guidelines include MONITORING recommendations.** See if you can align them with the clinical goals. Note that some goals are to achieve some state (e.g., achieve reduced weight) and some goals are to avoid a state (e.g., avoid reduced muscle mass).

> **Example:** the following should be monitored in order to assess the weight reduction goal as well as complications of treatment. They are mentioned in the clinical guidelines: waist circumference, waist-to-hip ratio and/or waist-to-height ratio, ethnicity-specific BMI thresholds, and/or adiposity-related complications.

**Monitoring frequency.** See if the collection of guidelines mentions the frequency of monitoring. If not, please try to suggest it and propose this to the user along with a justification.

> **Example:** another guideline specifies frequency of monitoring: "at least monthly for first 3 months; then at least every 3 months".

**Measurement method.** Some monitoring recommendations specify how the data can be measured.

> **Example:** via standard questionnaires: management of appetite and/or cravings (Control of Eating Questionnaire, CoEQ); improvement in quality of life (SF-36 and instruments that assess the impact of weight on QoL: IWQOL-Lite). You would still need to recommend a frequency of measuring these. Another example: to determine whether there is muscle loss (sarcopenia), the body composition can be measured using an at-home BIA scale.

**Recommendations without matching monitoring.** If the guidelines contain recommendations that do not have matching monitoring instructions, you should propose them and justify, and explain the sources for the proposal.

> **Example:** it isn't clear how to monitor diet and physical exercise, which are recommended therapies alongside GLP-1.

**Side effects and ADEs.** From the clinical guidelines and drug information from package inserts you can determine side effects of the therapy recommendation and adverse drug effects (ADEs). Add monitoring actions for them.

**Case reports.** You can also examine case reports in the medical literature that report rare undesired drug effects. Summarize them for the user along with monitoring suggestions and their frequency. Explain how to monitor: via laboratory tests? doctor asking the patient about symptoms during a visit?

> **Example:** a patient case report about a patient who took GLP-1 for weight reduction and experienced extreme vomiting and weight loss that resulted in Wernicke encephalopathy, manifested in confusion, ataxia, and ophthalmoplegia.

**Unmentioned benefits and harms.** Check whether the guidelines forgot to mention potential benefits and harms of the therapy recommendations. Suggest to the user MONITORING PLANS for them, and how expensive monitoring is, and how dangerous and how prevalent the harms may be. You can determine these unmentioned harms and benefits by thinking about the mechanism of action of the therapy.

> **Example:** GLP-1 promotes weight loss by a mechanism of action of appetite regulation in the brain. Because this regulation is linked to reward circuits, other rewards could also be down-regulated and patients may experience that they enjoy life less. How can appetite inhibition but also enjoyment-of-life inhibition be assessed? Is it assessed via the quality-of-life questionnaires mentioned in the guidelines, or do additional questionnaires need to be added? How many questions (not too many) and at what frequency?

### 4. Formalization — PROforma ontology and Design Patterns

Use the PROforma CIG ontology and the Design Patterns (DP) to start representing the CIG. The DPs include:

- **Top-level Plan:** An Individual of class `Plan` that has an Enquiry task for Eligibility data retrieval, a Decision task to decide on eligibility, a Therapy Plan (for therapy recommendations), and a Monitoring Plan — all in sequence.
- **Monitoring Plan:** composed of parallel Plans — Monitor Actions, Monitor Desired Outcome States, Monitor Undesired ADEs.

### 5. Formalization — Therapy Actions, Components, and State Achievement Goals

For each therapy intervention, create an `Action` and a matching `Component` and link it as a component of the Therapy Plan. The Action should have a goal.

The most important goal is the **State Achievement Goal**: a verb of *achieve* / *avoid* plus a noun phrase.

> **Example:** achieve body-weight reduction of 5–10 percent. *(Goal of the Action: Prescribe GLP-1.)*
>
> **Example:** avoid muscle loss. *(Goal of the Action: Prescribe physical exercise (part of the Therapy Plan): 150 minutes of physical activity per week + twice a week muscle strengthening.)*

### 6. Formalization — Monitoring Actions and Action Enactment Goals

For each therapy goal defined in the previous step, and for each desired and undesired outcome of the therapy interventions, define monitoring `Action`s within the Monitoring Plan. For each such monitoring action define a goal. The goal would probably be an **Action Enactment Goal**: a verb of *order* plus a noun phrase.

> **Example:** order `ServiceRequest.code = body weight measurement via BIA scale`.
>
> *(ServiceRequest is an HL7 FHIR resource.)*
