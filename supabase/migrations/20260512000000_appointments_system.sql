-- =====================================================
-- Appointments System: Tables, RLS, and Business Hours
-- =====================================================

-- 1. Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  patient_id uuid REFERENCES aurora_patients(id) NOT NULL,
  professional_id uuid REFERENCES profiles(id),
  appointment_type text NOT NULL CHECK (appointment_type IN ('dispensa', 'consulta_medica', 'tramite')),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no_show')),
  scheduled_date date NOT NULL,
  scheduled_time time NOT NULL,
  duration_minutes int DEFAULT 30,
  notes text,
  admin_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Business hours table (org-defined available schedules)
CREATE TABLE IF NOT EXISTS public.business_hours (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) NOT NULL,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Domingo, 6=Sábado
  open_time time NOT NULL,
  close_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, day_of_week)
);

-- 3. Enable RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for appointments

-- Patients can view their own appointments
CREATE POLICY "Patients can view own appointments" ON public.appointments
  FOR SELECT TO authenticated
  USING (
    patient_id IN (SELECT id FROM aurora_patients WHERE profile_id = auth.uid())
  );

-- Patients can create appointments
CREATE POLICY "Patients can create appointments" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    patient_id IN (SELECT id FROM aurora_patients WHERE profile_id = auth.uid())
  );

-- Org staff can manage all appointments in their org
CREATE POLICY "Org staff can manage appointments" ON public.appointments
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'medico', 'staff', 'super_admin')
    )
  );

-- 5. RLS Policies for business_hours

-- Anyone authenticated can read business hours
CREATE POLICY "Anyone can read business hours" ON public.business_hours
  FOR SELECT TO authenticated
  USING (true);

-- Only org admin/owner can manage business hours
CREATE POLICY "Org admin can manage business hours" ON public.business_hours
  FOR ALL TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid()
      AND role IN ('owner', 'admin', 'super_admin')
    )
  );

-- 6. Updated_at trigger for appointments
CREATE OR REPLACE FUNCTION update_appointments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION update_appointments_updated_at();

-- 7. RLS Policies for clinical tables (so patients can read their own clinical data)

-- Patients can read their own clinical admission
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Patients can read own admission'
  ) THEN
    CREATE POLICY "Patients can read own admission" ON public.clinical_admissions
      FOR SELECT TO authenticated
      USING (
        patient_id IN (SELECT id FROM aurora_patients WHERE profile_id = auth.uid())
      );
  END IF;
END $$;

-- Patients can read their own evolutions
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Patients can read own evolutions'
  ) THEN
    CREATE POLICY "Patients can read own evolutions" ON public.clinical_evolutions
      FOR SELECT TO authenticated
      USING (
        admission_id IN (
          SELECT ca.id FROM clinical_admissions ca
          JOIN aurora_patients ap ON ca.patient_id = ap.id
          WHERE ap.profile_id = auth.uid()
        )
      );
  END IF;
END $$;
