# Design Pattern: Action Enactment Goal

**Intent:** The goal of a **monitoring** `Action`. It expresses that some measurement/order should be *enacted*, with a verb of `order` plus a `noun_phrase` that references an HL7 FHIR `ServiceRequest`. This is how the Monitoring Plan operationalizes monitoring of action completion and of desired/undesired states.

## PROforma elements

- Class: `Goal`
- Properties: `goal` (Task→Goal), data properties `verb` and `noun_phrase`
- `verb` = **`order`** for Action Enactment Goals (the verb enum also allows `start`/`stop`; prefer `order` for ServiceRequest-style monitoring orders).

## FHIR `ServiceRequest`

Encode the order in the `noun_phrase` using FHIR `ServiceRequest` fields so frequency and instructions are explicit:

- `ServiceRequest.code` — what is measured (e.g. body weight measurement via BIA scale; lipid panel; CoEQ questionnaire).
- `ServiceRequest.intent = order`
- `ServiceRequest.occurrenceTiming` — frequency (e.g. monthly x3 then q3mo). If the guideline omits frequency, propose one and justify it to the user.
- `ServiceRequest.patientInstruction` — how to measure (e.g. use home BIA scale under standardized conditions).

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, `:` = project namespace.

```
# Monitoring action inside a Monitoring sub-plan (via a Component; see ActionComponent.md)
ObjectPropertyAssertion(pf:components :Monitor_Desired_State :Weight_Monitoring_Component)
ClassAssertion(pf:Component :Weight_Monitoring_Component)
ObjectPropertyAssertion(pf:taskref :Weight_Monitoring_Component :Monitor_Weight)
ClassAssertion(pf:Action :Monitor_Weight)

# Action Enactment Goal: order a FHIR ServiceRequest
ObjectPropertyAssertion(pf:goal :Monitor_Weight :Goal_order_weight_BIA)
ClassAssertion(pf:Goal :Goal_order_weight_BIA)
DataPropertyAssertion(pf:verb :Goal_order_weight_BIA "order")
DataPropertyAssertion(pf:noun_phrase :Goal_order_weight_BIA "ServiceRequest.code = body weight measurement via BIA scale; ServiceRequest.intent = order; ServiceRequest.occurrenceTiming = monthly x3 then q3mo; ServiceRequest.patientInstruction = use home BIA scale under standardized conditions")
```

## Guidance

- Create one monitoring action (+ Action Enactment Goal) **per item to monitor** identified in Step 3, placed in the matching Monitoring sub-plan:
  - completion of a therapy recommendation → **Monitor Actions**
  - a desired state / `achieve` goal → **Monitor Desired Outcome States**
  - an undesired state / `avoid` goal / ADE / case-report risk / mechanism-of-action harm → **Monitor Undesired ADEs**
- Always include a **frequency**. Use the guideline's frequency if present; otherwise propose one with justification and source.
- Capture the **measurement method** in `ServiceRequest.code`/`patientInstruction` (lab test, questionnaire such as CoEQ/SF-36/IWQOL-Lite, BIA scale, or clinician interview).

## Worked example (`cig/examples/obesity-glp1.owl`)

The standalone goal `Goal_body_weight_measurement_via_BIA_scale` (`verb=order`, `noun_phrase="ServiceRequest.code= body weight measurement via BIA scale"`), and `Monitor_Weight`'s goal `Start_BIA_body_weight_and_composition_measuring` whose `noun_phrase` spells out the FHIR ServiceRequest fields (code, intent, occurrenceTiming, patientInstruction).

## Related patterns

- `MonitoringPlan.md`, `ActionComponent.md`, `StateAchievementGoal.md`.
