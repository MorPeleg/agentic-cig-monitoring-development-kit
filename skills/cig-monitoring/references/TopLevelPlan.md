# Design Pattern: Top-Level Plan

**Intent:** The root of a CIG. A `Plan` individual whose components are, **in sequence**, an Enquiry (eligibility data retrieval), a Decision (eligibility), a Therapy Plan, and a Monitoring Plan.

## PROforma elements

- Classes: `Plan`, `Enquiry`, `Decision`, `Component`, `Goal`, `Schedule_Constraint`, `Candidate`, `PROforma_Condition`
- Properties: `components` (Plan→Component), `taskref` (Component→Task), `goal` (Task→Goal), `scheduled_constraints` (Component→Schedule_Constraint), `conref` (Schedule_Constraint→Task), `precondition` (Task→PROforma_Condition), `candidates` (Decision→Candidate)

## Sequencing

PROforma has no "next" property. Order components by giving a component a `Schedule_Constraint` whose `conref` points to the task that must complete first:

- Decision component `conref` → the Enquiry task
- Therapy component `conref` → the Decision task
- Monitoring component `conref` → the Therapy plan

The Therapy plan typically also carries a `precondition` such as `result_of(<decision>) = Eligible`.

## OWL functional-syntax skeleton

Prefixes: `pf:` = `http://www.owl-ontologies.com/Ontology1779030093.owl#`, `:` = project namespace. This is an ABox that reuses PROforma classes/properties by IRI (do not redeclare them).

```
# --- Top-level plan + goal ---
Declaration(NamedIndividual(:TopPlan))
ClassAssertion(pf:Plan :TopPlan)
ObjectPropertyAssertion(pf:goal :TopPlan :Goal_TreatCondition)
ClassAssertion(pf:Goal :Goal_TreatCondition)
DataPropertyAssertion(pf:verb :Goal_TreatCondition "treat")
DataPropertyAssertion(pf:noun_phrase :Goal_TreatCondition "<condition>")

# --- 1. Enquiry: eligibility data ---
ObjectPropertyAssertion(pf:components :TopPlan :EligibilityData_Component)
ClassAssertion(pf:Component :EligibilityData_Component)
ObjectPropertyAssertion(pf:taskref :EligibilityData_Component :Get_Eligibility_Data)
ClassAssertion(pf:Enquiry :Get_Eligibility_Data)

# --- 2. Decision: eligibility (runs after the enquiry) ---
ObjectPropertyAssertion(pf:components :TopPlan :EligibilityDecision_Component)
ClassAssertion(pf:Component :EligibilityDecision_Component)
ObjectPropertyAssertion(pf:taskref :EligibilityDecision_Component :Eligibility_Decision)
ClassAssertion(pf:Decision :Eligibility_Decision)
ObjectPropertyAssertion(pf:candidates :Eligibility_Decision :Eligible)
ClassAssertion(pf:Candidate :Eligible)
ObjectPropertyAssertion(pf:candidates :Eligibility_Decision :Not_Eligible)
ClassAssertion(pf:Candidate :Not_Eligible)
ObjectPropertyAssertion(pf:scheduled_constraints :EligibilityDecision_Component :SC_DecisionAfterEnquiry)
ClassAssertion(pf:Schedule_Constraint :SC_DecisionAfterEnquiry)
ObjectPropertyAssertion(pf:conref :SC_DecisionAfterEnquiry :Get_Eligibility_Data)

# --- 3. Therapy plan (runs after the decision; gated by eligibility) ---
ObjectPropertyAssertion(pf:components :TopPlan :Therapy_Component)
ClassAssertion(pf:Component :Therapy_Component)
ObjectPropertyAssertion(pf:taskref :Therapy_Component :Therapy_Plan)
ClassAssertion(pf:Plan :Therapy_Plan)
ObjectPropertyAssertion(pf:precondition :Therapy_Plan :PC_Eligible)
ClassAssertion(pf:PROforma_Condition :PC_Eligible)
DataPropertyAssertion(pf:string_representation :PC_Eligible "result_of(Eligibility_Decision) = Eligible")
ObjectPropertyAssertion(pf:scheduled_constraints :Therapy_Component :SC_TherapyAfterDecision)
ClassAssertion(pf:Schedule_Constraint :SC_TherapyAfterDecision)
ObjectPropertyAssertion(pf:conref :SC_TherapyAfterDecision :Eligibility_Decision)

# --- 4. Monitoring plan (runs after therapy) ---
ObjectPropertyAssertion(pf:components :TopPlan :Monitoring_Component)
ClassAssertion(pf:Component :Monitoring_Component)
ObjectPropertyAssertion(pf:taskref :Monitoring_Component :Monitoring_Plan)
ClassAssertion(pf:Plan :Monitoring_Plan)
ObjectPropertyAssertion(pf:scheduled_constraints :Monitoring_Component :SC_MonitoringAfterTherapy)
ClassAssertion(pf:Schedule_Constraint :SC_MonitoringAfterTherapy)
ObjectPropertyAssertion(pf:conref :SC_MonitoringAfterTherapy :Therapy_Plan)
```

## Worked example (`cig/examples/obesity-glp1.owl`)

`Obesity_Guideline_Plan` (Plan, goal `treat obesity`) has components `Get_Eligibility_Data_Component` (Enquiry `Get_Eligibility_Data_Items`), `Eligibility_Decision_Component` (Decision `Eligiblity_Decision` with candidates `Eligible`/`Not_Eligible`, constrained after the enquiry), `Therapy_Component` (Plan `Obesity_Therapy`, precondition `result_of(Eligibility_Decision) = Eligible`, constrained after the decision), and `Monitoring_Component` (Plan `Monitoing`, constrained after `Obesity_Therapy`).

## Related patterns

- `TherapyPlan.md`, `MonitoringPlan.md` — the two sub-plans of this top-level plan.
