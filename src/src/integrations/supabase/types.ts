export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      activity_sessions: {
        Row: {
          ended_at: string | null
          id: string
          portal: string
          route: string | null
          started_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          ended_at?: string | null
          id?: string
          portal: string
          route?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          ended_at?: string | null
          id?: string
          portal?: string
          route?: string | null
          started_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_login_attempts: {
        Row: {
          attempted_at: string
          id: string
          success: boolean
        }
        Insert: {
          attempted_at?: string
          id?: string
          success: boolean
        }
        Update: {
          attempted_at?: string
          id?: string
          success?: boolean
        }
        Relationships: []
      }
      adr_reports: {
        Row: {
          allergic_reaction: string | null
          created_at: string
          id: string
          kind: string
          medication_id: string | null
          milestone: Database["public"]["Enums"]["study_milestone"] | null
          onset_period: string | null
          outcome: string | null
          participant_id: string
          reaction_description: string
          reported_by: string | null
          severity: string | null
          suspected_medicine: string | null
          suspected_medicine_notes: string | null
          symptomatic_relief: string | null
          updated_at: string
        }
        Insert: {
          allergic_reaction?: string | null
          created_at?: string
          id?: string
          kind?: string
          medication_id?: string | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          onset_period?: string | null
          outcome?: string | null
          participant_id: string
          reaction_description: string
          reported_by?: string | null
          severity?: string | null
          suspected_medicine?: string | null
          suspected_medicine_notes?: string | null
          symptomatic_relief?: string | null
          updated_at?: string
        }
        Update: {
          allergic_reaction?: string | null
          created_at?: string
          id?: string
          kind?: string
          medication_id?: string | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          onset_period?: string | null
          outcome?: string | null
          participant_id?: string
          reaction_description?: string
          reported_by?: string | null
          severity?: string | null
          suspected_medicine?: string | null
          suspected_medicine_notes?: string | null
          symptomatic_relief?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "adr_reports_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adr_reports_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      allocation_overrides: {
        Row: {
          id: string
          new_group: Database["public"]["Enums"]["study_group"]
          overridden_at: string
          overridden_by: string
          participant_id: string
          previous_group: Database["public"]["Enums"]["study_group"]
          randomization_id: string
          reason: string
        }
        Insert: {
          id?: string
          new_group: Database["public"]["Enums"]["study_group"]
          overridden_at?: string
          overridden_by: string
          participant_id: string
          previous_group: Database["public"]["Enums"]["study_group"]
          randomization_id: string
          reason: string
        }
        Update: {
          id?: string
          new_group?: Database["public"]["Enums"]["study_group"]
          overridden_at?: string
          overridden_by?: string
          participant_id?: string
          previous_group?: Database["public"]["Enums"]["study_group"]
          randomization_id?: string
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_overrides_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocation_overrides_randomization_id_fkey"
            columns: ["randomization_id"]
            isOneToOne: false
            referencedRelation: "randomizations"
            referencedColumns: ["id"]
          },
        ]
      }
      assessments: {
        Row: {
          conducted_at: string | null
          conducted_by: string | null
          created_at: string
          id: string
          instrument: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          participant_id: string
          responses: Json
          status: Database["public"]["Enums"]["milestone_status"]
          updated_at: string
        }
        Insert: {
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string
          id?: string
          instrument: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          participant_id: string
          responses?: Json
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Update: {
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string
          id?: string
          instrument?: string
          milestone?: Database["public"]["Enums"]["study_milestone"]
          participant_id?: string
          responses?: Json
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_events: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json
        }
        Relationships: []
      }
      clinical_data: {
        Row: {
          allergies: string[] | null
          bp_diastolic: number | null
          bp_systolic: number | null
          clinical_notes: string | null
          comorbidities: string[] | null
          diagnosis_date: string | null
          examination: Json
          family_history: string | null
          final_diagnosis: string | null
          history_present_illness: string | null
          id: string
          lifestyle_notes: string | null
          pain_distribution: string | null
          pain_duration_months: number | null
          pain_onset_date: string | null
          pain_site: string | null
          participant_id: string
          past_medical_history: string | null
          past_surgical_history: string | null
          presenting_complaints: string | null
          primary_diagnosis: string | null
          provisional_diagnosis: string | null
          pulse_rate: number | null
          recorded_at: string
          respiratory_rate: number | null
          spo2: number | null
          temperature_c: number | null
          treating_neurologist: string | null
          updated_at: string
        }
        Insert: {
          allergies?: string[] | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          clinical_notes?: string | null
          comorbidities?: string[] | null
          diagnosis_date?: string | null
          examination?: Json
          family_history?: string | null
          final_diagnosis?: string | null
          history_present_illness?: string | null
          id?: string
          lifestyle_notes?: string | null
          pain_distribution?: string | null
          pain_duration_months?: number | null
          pain_onset_date?: string | null
          pain_site?: string | null
          participant_id: string
          past_medical_history?: string | null
          past_surgical_history?: string | null
          presenting_complaints?: string | null
          primary_diagnosis?: string | null
          provisional_diagnosis?: string | null
          pulse_rate?: number | null
          recorded_at?: string
          respiratory_rate?: number | null
          spo2?: number | null
          temperature_c?: number | null
          treating_neurologist?: string | null
          updated_at?: string
        }
        Update: {
          allergies?: string[] | null
          bp_diastolic?: number | null
          bp_systolic?: number | null
          clinical_notes?: string | null
          comorbidities?: string[] | null
          diagnosis_date?: string | null
          examination?: Json
          family_history?: string | null
          final_diagnosis?: string | null
          history_present_illness?: string | null
          id?: string
          lifestyle_notes?: string | null
          pain_distribution?: string | null
          pain_duration_months?: number | null
          pain_onset_date?: string | null
          pain_site?: string | null
          participant_id?: string
          past_medical_history?: string | null
          past_surgical_history?: string | null
          presenting_complaints?: string | null
          primary_diagnosis?: string | null
          provisional_diagnosis?: string | null
          pulse_rate?: number | null
          recorded_at?: string
          respiratory_rate?: number | null
          spo2?: number | null
          temperature_c?: number | null
          treating_neurologist?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "clinical_data_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      counselling_sessions: {
        Row: {
          checklist: Json
          created_at: string
          delivered_by: string | null
          duration_minutes: number | null
          id: string
          materials_provided: string[] | null
          milestone: Database["public"]["Enums"]["study_milestone"] | null
          notes: string | null
          participant_id: string
          recipient: string | null
          session_date: string | null
          topics: string[] | null
        }
        Insert: {
          checklist?: Json
          created_at?: string
          delivered_by?: string | null
          duration_minutes?: number | null
          id?: string
          materials_provided?: string[] | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          notes?: string | null
          participant_id: string
          recipient?: string | null
          session_date?: string | null
          topics?: string[] | null
        }
        Update: {
          checklist?: Json
          created_at?: string
          delivered_by?: string | null
          duration_minutes?: number | null
          id?: string
          materials_provided?: string[] | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          notes?: string | null
          participant_id?: string
          recipient?: string | null
          session_date?: string | null
          topics?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "counselling_sessions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      demographics: {
        Row: {
          address: string | null
          admission_date: string | null
          age_years: number | null
          alt_contact_number: string | null
          bed_number: string | null
          caregiver_bp: string | null
          caregiver_contact: string | null
          caregiver_ecg_notes: string | null
          caregiver_height_cm: number | null
          caregiver_name: string | null
          caregiver_relationship: string | null
          caregiver_weight_kg: number | null
          city: string | null
          contact_number: string | null
          created_at: string
          discharge_date: string | null
          district: string | null
          education_level: string | null
          habits: Json
          height_cm: number | null
          id: string
          ip_number: string | null
          occupation: string | null
          op_number: string | null
          participant_id: string
          patient_type: string | null
          postal_code: string | null
          preferred_language: string | null
          residence: string | null
          sex: string | null
          socioeconomic_status: string | null
          state: string | null
          updated_at: string
          ward_unit: string | null
          weight_kg: number | null
        }
        Insert: {
          address?: string | null
          admission_date?: string | null
          age_years?: number | null
          alt_contact_number?: string | null
          bed_number?: string | null
          caregiver_bp?: string | null
          caregiver_contact?: string | null
          caregiver_ecg_notes?: string | null
          caregiver_height_cm?: number | null
          caregiver_name?: string | null
          caregiver_relationship?: string | null
          caregiver_weight_kg?: number | null
          city?: string | null
          contact_number?: string | null
          created_at?: string
          discharge_date?: string | null
          district?: string | null
          education_level?: string | null
          habits?: Json
          height_cm?: number | null
          id?: string
          ip_number?: string | null
          occupation?: string | null
          op_number?: string | null
          participant_id: string
          patient_type?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          residence?: string | null
          sex?: string | null
          socioeconomic_status?: string | null
          state?: string | null
          updated_at?: string
          ward_unit?: string | null
          weight_kg?: number | null
        }
        Update: {
          address?: string | null
          admission_date?: string | null
          age_years?: number | null
          alt_contact_number?: string | null
          bed_number?: string | null
          caregiver_bp?: string | null
          caregiver_contact?: string | null
          caregiver_ecg_notes?: string | null
          caregiver_height_cm?: number | null
          caregiver_name?: string | null
          caregiver_relationship?: string | null
          caregiver_weight_kg?: number | null
          city?: string | null
          contact_number?: string | null
          created_at?: string
          discharge_date?: string | null
          district?: string | null
          education_level?: string | null
          habits?: Json
          height_cm?: number | null
          id?: string
          ip_number?: string | null
          occupation?: string | null
          op_number?: string | null
          participant_id?: string
          patient_type?: string | null
          postal_code?: string | null
          preferred_language?: string | null
          residence?: string | null
          sex?: string | null
          socioeconomic_status?: string | null
          state?: string | null
          updated_at?: string
          ward_unit?: string | null
          weight_kg?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demographics_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      dn4_assessments: {
        Row: {
          assessment_id: string | null
          conducted_at: string | null
          conducted_by: string | null
          created_at: string
          id: string
          interpretation: string | null
          milestone: Database["public"]["Enums"]["study_milestone"]
          participant_id: string
          responses: Json
          total_score: number | null
        }
        Insert: {
          assessment_id?: string | null
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string
          id?: string
          interpretation?: string | null
          milestone: Database["public"]["Enums"]["study_milestone"]
          participant_id: string
          responses?: Json
          total_score?: number | null
        }
        Update: {
          assessment_id?: string | null
          conducted_at?: string | null
          conducted_by?: string | null
          created_at?: string
          id?: string
          interpretation?: string | null
          milestone?: Database["public"]["Enums"]["study_milestone"]
          participant_id?: string
          responses?: Json
          total_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "dn4_assessments_assessment_id_fkey"
            columns: ["assessment_id"]
            isOneToOne: false
            referencedRelation: "assessments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dn4_assessments_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      drp_visit_outcomes: {
        Row: {
          drp_id: string
          id: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          notes: string | null
          participant_id: string
          pcne_outcome_code: string | null
          recorded_at: string
          recorded_by: string | null
          visit_status: string
        }
        Insert: {
          drp_id: string
          id?: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          notes?: string | null
          participant_id: string
          pcne_outcome_code?: string | null
          recorded_at?: string
          recorded_by?: string | null
          visit_status: string
        }
        Update: {
          drp_id?: string
          id?: string
          milestone?: Database["public"]["Enums"]["study_milestone"]
          notes?: string | null
          participant_id?: string
          pcne_outcome_code?: string | null
          recorded_at?: string
          recorded_by?: string | null
          visit_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "drp_visit_outcomes_drp_id_fkey"
            columns: ["drp_id"]
            isOneToOne: false
            referencedRelation: "drps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drp_visit_outcomes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      drps: {
        Row: {
          action_taken: string | null
          additional_comments: string | null
          cause_details: string | null
          clinical_details: string | null
          description: string | null
          follow_up_observations: string | null
          id: string
          identified_at: string
          identified_by: string | null
          intervention_details: string | null
          medication_id: string | null
          milestone: Database["public"]["Enums"]["study_milestone"] | null
          outcome_notes: string | null
          participant_id: string
          pcne_acceptance_code: string | null
          pcne_cause_code: string | null
          pcne_cause_codes: string[]
          pcne_intervention_code: string | null
          pcne_intervention_codes: string[]
          pcne_outcome_code: string | null
          pcne_problem_code: string | null
          pcne_version: string
          physician_communication: string | null
          physician_response_notes: string | null
          problem_type: string | null
          researcher_observations: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          suspected_medication: string | null
          updated_at: string
        }
        Insert: {
          action_taken?: string | null
          additional_comments?: string | null
          cause_details?: string | null
          clinical_details?: string | null
          description?: string | null
          follow_up_observations?: string | null
          id?: string
          identified_at?: string
          identified_by?: string | null
          intervention_details?: string | null
          medication_id?: string | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          outcome_notes?: string | null
          participant_id: string
          pcne_acceptance_code?: string | null
          pcne_cause_code?: string | null
          pcne_cause_codes?: string[]
          pcne_intervention_code?: string | null
          pcne_intervention_codes?: string[]
          pcne_outcome_code?: string | null
          pcne_problem_code?: string | null
          pcne_version?: string
          physician_communication?: string | null
          physician_response_notes?: string | null
          problem_type?: string | null
          researcher_observations?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suspected_medication?: string | null
          updated_at?: string
        }
        Update: {
          action_taken?: string | null
          additional_comments?: string | null
          cause_details?: string | null
          clinical_details?: string | null
          description?: string | null
          follow_up_observations?: string | null
          id?: string
          identified_at?: string
          identified_by?: string | null
          intervention_details?: string | null
          medication_id?: string | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          outcome_notes?: string | null
          participant_id?: string
          pcne_acceptance_code?: string | null
          pcne_cause_code?: string | null
          pcne_cause_codes?: string[]
          pcne_intervention_code?: string | null
          pcne_intervention_codes?: string[]
          pcne_outcome_code?: string | null
          pcne_problem_code?: string | null
          pcne_version?: string
          physician_communication?: string | null
          physician_response_notes?: string | null
          problem_type?: string | null
          researcher_observations?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          suspected_medication?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drps_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drps_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drps_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_interactions: {
        Row: {
          documentation_notes: string | null
          documented_by: string | null
          drug_a: string | null
          drug_b: string | null
          id: string
          identified_at: string
          management: string | null
          mechanism: string | null
          medication_a_id: string | null
          medication_b_id: string | null
          milestone: Database["public"]["Enums"]["study_milestone"] | null
          participant_id: string
          severity: string | null
          source: string | null
        }
        Insert: {
          documentation_notes?: string | null
          documented_by?: string | null
          drug_a?: string | null
          drug_b?: string | null
          id?: string
          identified_at?: string
          management?: string | null
          mechanism?: string | null
          medication_a_id?: string | null
          medication_b_id?: string | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          participant_id: string
          severity?: string | null
          source?: string | null
        }
        Update: {
          documentation_notes?: string | null
          documented_by?: string | null
          drug_a?: string | null
          drug_b?: string | null
          id?: string
          identified_at?: string
          management?: string | null
          mechanism?: string | null
          medication_a_id?: string | null
          medication_b_id?: string | null
          milestone?: Database["public"]["Enums"]["study_milestone"] | null
          participant_id?: string
          severity?: string | null
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "drug_interactions_documented_by_fkey"
            columns: ["documented_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_medication_a_id_fkey"
            columns: ["medication_a_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_medication_b_id_fkey"
            columns: ["medication_b_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "drug_interactions_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_ups: {
        Row: {
          adherence_notes: string | null
          admission_date: string | null
          admission_details: string | null
          admission_er: string | null
          contact_mode: string | null
          contacted_at: string | null
          created_at: string
          id: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          missed_dose_details: string | null
          missed_dose_reason: string | null
          missed_doses: string | null
          notes: string | null
          outcome: string | null
          participant_id: string
          recorded_by: string | null
          scheduled_for: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          updated_at: string
        }
        Insert: {
          adherence_notes?: string | null
          admission_date?: string | null
          admission_details?: string | null
          admission_er?: string | null
          contact_mode?: string | null
          contacted_at?: string | null
          created_at?: string
          id?: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          missed_dose_details?: string | null
          missed_dose_reason?: string | null
          missed_doses?: string | null
          notes?: string | null
          outcome?: string | null
          participant_id: string
          recorded_by?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Update: {
          adherence_notes?: string | null
          admission_date?: string | null
          admission_details?: string | null
          admission_er?: string | null
          contact_mode?: string | null
          contacted_at?: string | null
          created_at?: string
          id?: string
          milestone?: Database["public"]["Enums"]["study_milestone"]
          missed_dose_details?: string | null
          missed_dose_reason?: string | null
          missed_doses?: string | null
          notes?: string | null
          outcome?: string | null
          participant_id?: string
          recorded_by?: string | null
          scheduled_for?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      laboratory_investigations: {
        Row: {
          category: string
          created_at: string
          id: string
          investigation_date: string | null
          investigation_name: string
          notes: string | null
          participant_id: string
          recorded_by: string | null
          reference_range: string | null
          result: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          investigation_date?: string | null
          investigation_name: string
          notes?: string | null
          participant_id: string
          recorded_by?: string | null
          reference_range?: string | null
          result?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          investigation_date?: string | null
          investigation_name?: string
          notes?: string | null
          participant_id?: string
          recorded_by?: string | null
          reference_range?: string | null
          result?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "laboratory_investigations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      medication_changes: {
        Row: {
          additional_details: string | null
          change_date: string | null
          change_description: string | null
          change_period: string | null
          created_at: string
          frequency_change: string | null
          id: string
          medication_id: string | null
          medication_name: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          modification_details: string | null
          new_dose: string | null
          new_regimen: string | null
          participant_id: string
          previous_dose: string | null
          previous_regimen: string | null
          reason: string | null
          recorded_by: string | null
          researcher_notes: string | null
          route_change: string | null
        }
        Insert: {
          additional_details?: string | null
          change_date?: string | null
          change_description?: string | null
          change_period?: string | null
          created_at?: string
          frequency_change?: string | null
          id?: string
          medication_id?: string | null
          medication_name: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          modification_details?: string | null
          new_dose?: string | null
          new_regimen?: string | null
          participant_id: string
          previous_dose?: string | null
          previous_regimen?: string | null
          reason?: string | null
          recorded_by?: string | null
          researcher_notes?: string | null
          route_change?: string | null
        }
        Update: {
          additional_details?: string | null
          change_date?: string | null
          change_description?: string | null
          change_period?: string | null
          created_at?: string
          frequency_change?: string | null
          id?: string
          medication_id?: string | null
          medication_name?: string
          milestone?: Database["public"]["Enums"]["study_milestone"]
          modification_details?: string | null
          new_dose?: string | null
          new_regimen?: string | null
          participant_id?: string
          previous_dose?: string | null
          previous_regimen?: string | null
          reason?: string | null
          recorded_by?: string | null
          researcher_notes?: string | null
          route_change?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medication_changes_medication_id_fkey"
            columns: ["medication_id"]
            isOneToOne: false
            referencedRelation: "medications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medication_changes_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      medications: {
        Row: {
          brand_name: string | null
          category: string | null
          dose: string | null
          dose_unit: string | null
          dosing_schedule: string | null
          drug_name: string
          for_neuropathic_pain: boolean | null
          frequency: string | null
          generic_name: string | null
          id: string
          indication: string | null
          is_current: boolean
          non_pharm_measures: string | null
          participant_id: string
          recorded_at: string
          route: string | null
          start_date: string | null
          stop_date: string | null
          updated_at: string
        }
        Insert: {
          brand_name?: string | null
          category?: string | null
          dose?: string | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          drug_name: string
          for_neuropathic_pain?: boolean | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          indication?: string | null
          is_current?: boolean
          non_pharm_measures?: string | null
          participant_id: string
          recorded_at?: string
          route?: string | null
          start_date?: string | null
          stop_date?: string | null
          updated_at?: string
        }
        Update: {
          brand_name?: string | null
          category?: string | null
          dose?: string | null
          dose_unit?: string | null
          dosing_schedule?: string | null
          drug_name?: string
          for_neuropathic_pain?: boolean | null
          frequency?: string | null
          generic_name?: string | null
          id?: string
          indication?: string | null
          is_current?: boolean
          non_pharm_measures?: string | null
          participant_id?: string
          recorded_at?: string
          route?: string | null
          start_date?: string | null
          stop_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "medications_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participant_milestones: {
        Row: {
          completed_at: string | null
          due_date: string | null
          id: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          participant_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["milestone_status"]
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          due_date?: string | null
          id?: string
          milestone: Database["public"]["Enums"]["study_milestone"]
          participant_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          due_date?: string | null
          id?: string
          milestone?: Database["public"]["Enums"]["study_milestone"]
          participant_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["milestone_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participant_milestones_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      participants: {
        Row: {
          baseline_completed_at: string | null
          completion_notes: string | null
          consent_confirmed: boolean
          consent_date: string | null
          consent_notes: string | null
          consent_status: string
          created_at: string
          created_by: string | null
          day_15_completed_at: string | null
          day_15_opened_at: string | null
          day_30_completed_at: string | null
          eligibility_status: string
          enrolled_at: string | null
          enrolment_confirmed: boolean
          enrolment_notes: string | null
          exclusion_criteria_present: boolean | null
          id: string
          inclusion_criteria_met: boolean | null
          is_test_record: boolean
          last_contact_date: string | null
          lifecycle_stage: string
          non_completion_reason: string | null
          notes: string | null
          participant_code: string
          profile_id: string | null
          randomized_at: string | null
          screening_date: string | null
          screening_notes: string | null
          site: string | null
          status: Database["public"]["Enums"]["participant_status"]
          study_group: Database["public"]["Enums"]["study_group"] | null
          updated_at: string
        }
        Insert: {
          baseline_completed_at?: string | null
          completion_notes?: string | null
          consent_confirmed?: boolean
          consent_date?: string | null
          consent_notes?: string | null
          consent_status?: string
          created_at?: string
          created_by?: string | null
          day_15_completed_at?: string | null
          day_15_opened_at?: string | null
          day_30_completed_at?: string | null
          eligibility_status?: string
          enrolled_at?: string | null
          enrolment_confirmed?: boolean
          enrolment_notes?: string | null
          exclusion_criteria_present?: boolean | null
          id?: string
          inclusion_criteria_met?: boolean | null
          is_test_record?: boolean
          last_contact_date?: string | null
          lifecycle_stage?: string
          non_completion_reason?: string | null
          notes?: string | null
          participant_code: string
          profile_id?: string | null
          randomized_at?: string | null
          screening_date?: string | null
          screening_notes?: string | null
          site?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          study_group?: Database["public"]["Enums"]["study_group"] | null
          updated_at?: string
        }
        Update: {
          baseline_completed_at?: string | null
          completion_notes?: string | null
          consent_confirmed?: boolean
          consent_date?: string | null
          consent_notes?: string | null
          consent_status?: string
          created_at?: string
          created_by?: string | null
          day_15_completed_at?: string | null
          day_15_opened_at?: string | null
          day_30_completed_at?: string | null
          eligibility_status?: string
          enrolled_at?: string | null
          enrolment_confirmed?: boolean
          enrolment_notes?: string | null
          exclusion_criteria_present?: boolean | null
          id?: string
          inclusion_criteria_met?: boolean | null
          is_test_record?: boolean
          last_contact_date?: string | null
          lifecycle_stage?: string
          non_completion_reason?: string | null
          notes?: string | null
          participant_code?: string
          profile_id?: string | null
          randomized_at?: string | null
          screening_date?: string | null
          screening_notes?: string | null
          site?: string | null
          status?: Database["public"]["Enums"]["participant_status"]
          study_group?: Database["public"]["Enums"]["study_group"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "participants_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      physician_recommendations: {
        Row: {
          acceptance_status: string
          communicated_at: string | null
          communication_mode: string | null
          created_at: string
          created_by: string | null
          drp_id: string | null
          id: string
          participant_id: string
          physician_response: string | null
          recommendation: string | null
          responded_at: string | null
          updated_at: string
        }
        Insert: {
          acceptance_status?: string
          communicated_at?: string | null
          communication_mode?: string | null
          created_at?: string
          created_by?: string | null
          drp_id?: string | null
          id?: string
          participant_id: string
          physician_response?: string | null
          recommendation?: string | null
          responded_at?: string | null
          updated_at?: string
        }
        Update: {
          acceptance_status?: string
          communicated_at?: string | null
          communication_mode?: string | null
          created_at?: string
          created_by?: string | null
          drp_id?: string | null
          id?: string
          participant_id?: string
          physician_response?: string | null
          recommendation?: string | null
          responded_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "physician_recommendations_drp_id_fkey"
            columns: ["drp_id"]
            isOneToOne: false
            referencedRelation: "drps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "physician_recommendations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: false
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      randomizations: {
        Row: {
          allocation_seq: number | null
          assigned_at: string
          assigned_by: string | null
          id: string
          method: string | null
          participant_id: string
          study_group: Database["public"]["Enums"]["study_group"]
        }
        Insert: {
          allocation_seq?: number | null
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          method?: string | null
          participant_id: string
          study_group: Database["public"]["Enums"]["study_group"]
        }
        Update: {
          allocation_seq?: number | null
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          method?: string | null
          participant_id?: string
          study_group?: Database["public"]["Enums"]["study_group"]
        }
        Relationships: [
          {
            foreignKeyName: "randomizations_participant_id_fkey"
            columns: ["participant_id"]
            isOneToOne: true
            referencedRelation: "participants"
            referencedColumns: ["id"]
          },
        ]
      }
      user_permissions: {
        Row: {
          granted_at: string
          id: string
          permission: string
          user_id: string
        }
        Insert: {
          granted_at?: string
          id?: string
          permission: string
          user_id: string
        }
        Update: {
          granted_at?: string
          id?: string
          permission?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_correct_participant_allocation: {
        Args: {
          p_actor: string
          p_admin_login: string
          p_expected_group: Database["public"]["Enums"]["study_group"]
          p_id: string
          p_new_group: Database["public"]["Enums"]["study_group"]
          p_reason: string
        }
        Returns: {
          id: string
          new_group: Database["public"]["Enums"]["study_group"]
          overridden_at: string
          overridden_by: string
          participant_id: string
          previous_group: Database["public"]["Enums"]["study_group"]
          randomization_id: string
          reason: string
        }
        SetofOptions: {
          from: "*"
          to: "allocation_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      allocate_study_participant: {
        Args: { p_id: string }
        Returns: {
          baseline_completed_at: string | null
          completion_notes: string | null
          consent_confirmed: boolean
          consent_date: string | null
          consent_notes: string | null
          consent_status: string
          created_at: string
          created_by: string | null
          day_15_completed_at: string | null
          day_15_opened_at: string | null
          day_30_completed_at: string | null
          eligibility_status: string
          enrolled_at: string | null
          enrolment_confirmed: boolean
          enrolment_notes: string | null
          exclusion_criteria_present: boolean | null
          id: string
          inclusion_criteria_met: boolean | null
          is_test_record: boolean
          last_contact_date: string | null
          lifecycle_stage: string
          non_completion_reason: string | null
          notes: string | null
          participant_code: string
          profile_id: string | null
          randomized_at: string | null
          screening_date: string | null
          screening_notes: string | null
          site: string | null
          status: Database["public"]["Enums"]["participant_status"]
          study_group: Database["public"]["Enums"]["study_group"] | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "participants"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      correct_participant_allocation: {
        Args: {
          p_expected_group: Database["public"]["Enums"]["study_group"]
          p_id: string
          p_new_group: Database["public"]["Enums"]["study_group"]
          p_reason: string
        }
        Returns: {
          id: string
          new_group: Database["public"]["Enums"]["study_group"]
          overridden_at: string
          overridden_by: string
          participant_id: string
          previous_group: Database["public"]["Enums"]["study_group"]
          randomization_id: string
          reason: string
        }
        SetofOptions: {
          from: "*"
          to: "allocation_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_research_staff: { Args: { _user_id: string }; Returns: boolean }
      override_participant_allocation: {
        Args: {
          p_id: string
          p_new_group: Database["public"]["Enums"]["study_group"]
          p_reason: string
        }
        Returns: {
          id: string
          new_group: Database["public"]["Enums"]["study_group"]
          overridden_at: string
          overridden_by: string
          participant_id: string
          previous_group: Database["public"]["Enums"]["study_group"]
          randomization_id: string
          reason: string
        }
        SetofOptions: {
          from: "*"
          to: "allocation_overrides"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      qa_cleanup_synthetic_batch: {
        Args: { p_batch: string; p_confirm?: string; p_execute?: boolean }
        Returns: Json
      }
      score_dn4: { Args: { p_items: Json }; Returns: number }
      score_nepiqol: { Args: { p_items: Json }; Returns: Json }
      study_visit_available: {
        Args: {
          p_id: string
          p_visit: Database["public"]["Enums"]["study_milestone"]
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "patient" | "researcher" | "admin"
      milestone_status: "pending" | "in_progress" | "completed"
      participant_status: "screening" | "enrolled" | "withdrawn" | "completed"
      study_group: "control" | "intervention"
      study_milestone: "baseline" | "day_15" | "day_30"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["patient", "researcher", "admin"],
      milestone_status: ["pending", "in_progress", "completed"],
      participant_status: ["screening", "enrolled", "withdrawn", "completed"],
      study_group: ["control", "intervention"],
      study_milestone: ["baseline", "day_15", "day_30"],
    },
  },
} as const
