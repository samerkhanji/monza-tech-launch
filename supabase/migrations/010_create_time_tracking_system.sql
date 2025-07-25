-- Create Time Tracking Events table for comprehensive employee activity monitoring
CREATE TABLE IF NOT EXISTS public.time_tracking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee Information
  employee_name TEXT NOT NULL,
  employee_email TEXT,
  
  -- Activity Details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'test_drive_employee', 'test_drive_client', 'repair_start', 'repair_progress', 'repair_complete',
    'pdi_start', 'pdi_complete', 'client_interaction', 'car_inspection', 'car_movement',
    'part_installation', 'quality_check', 'delivery_preparation', 'documentation',
    'cleanup', 'training', 'break', 'other'
  )),
  activity_description TEXT NOT NULL,
  
  -- Time Tracking
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  duration_hours NUMERIC(5,2),
  
  -- Related Entities
  car_vin TEXT,
  car_model TEXT,
  client_name TEXT,
  client_phone TEXT,
  repair_id TEXT,
  pdi_id TEXT,
  
  -- Location and Context
  location TEXT,
  department TEXT,
  workstation TEXT,
  
  -- Performance Metrics
  estimated_duration_minutes INTEGER,
  actual_vs_estimated INTEGER, -- Percentage difference
  efficiency_rating INTEGER CHECK (efficiency_rating BETWEEN 1 AND 5),
  
  -- Additional Data
  notes TEXT,
  issues TEXT[],
  tools_used TEXT[],
  parts_used TEXT[],
  
  -- Session Management
  session_id UUID,
  is_active BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create Employee Performance Summary table for aggregated data
CREATE TABLE IF NOT EXISTS public.employee_performance_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Employee and Time Period
  employee_name TEXT NOT NULL,
  employee_email TEXT,
  summary_date DATE NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('daily', 'weekly', 'monthly')),
  
  -- Performance Metrics
  total_hours NUMERIC(8,2) NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  activities_completed INTEGER NOT NULL DEFAULT 0,
  average_activity_duration INTEGER NOT NULL DEFAULT 0,
  efficiency_score NUMERIC(3,2) NOT NULL DEFAULT 3.0,
  
  -- Activity Breakdown
  test_drives_completed INTEGER DEFAULT 0,
  test_drives_total_minutes INTEGER DEFAULT 0,
  repairs_completed INTEGER DEFAULT 0,
  repairs_total_minutes INTEGER DEFAULT 0,
  client_interactions INTEGER DEFAULT 0,
  client_interactions_total_minutes INTEGER DEFAULT 0,
  pdi_checks_completed INTEGER DEFAULT 0,
  pdi_checks_total_minutes INTEGER DEFAULT 0,
  
  -- Business Metrics
  cars_worked_on INTEGER DEFAULT 0,
  clients_served INTEGER DEFAULT 0,
  on_time_performance INTEGER DEFAULT 100, -- Percentage
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one summary per employee per date per type
  UNIQUE(employee_name, summary_date, summary_type)
);

-- Create Activity Analytics table for activity-specific insights
CREATE TABLE IF NOT EXISTS public.activity_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Activity Details
  activity_type TEXT NOT NULL,
  analysis_date DATE NOT NULL,
  analysis_period TEXT NOT NULL CHECK (analysis_period IN ('daily', 'weekly', 'monthly')),
  
  -- Analytics Metrics
  total_occurrences INTEGER NOT NULL DEFAULT 0,
  average_duration_minutes INTEGER NOT NULL DEFAULT 0,
  fastest_duration_minutes INTEGER,
  slowest_duration_minutes INTEGER,
  total_time_spent_minutes INTEGER NOT NULL DEFAULT 0,
  
  -- Performance Rankings (JSON for employee rankings)
  employee_rankings JSONB,
  
  -- Trends
  efficiency_trend NUMERIC(3,2) DEFAULT 3.0,
  volume_trend INTEGER DEFAULT 0, -- Percentage change
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Ensure one analysis per activity per date per period
  UNIQUE(activity_type, analysis_date, analysis_period)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_time_tracking_employee_date ON public.time_tracking_events(employee_name, start_time);
CREATE INDEX IF NOT EXISTS idx_time_tracking_activity_type ON public.time_tracking_events(activity_type, start_time);
CREATE INDEX IF NOT EXISTS idx_time_tracking_car_vin ON public.time_tracking_events(car_vin);
CREATE INDEX IF NOT EXISTS idx_time_tracking_is_active ON public.time_tracking_events(is_active);
CREATE INDEX IF NOT EXISTS idx_time_tracking_session ON public.time_tracking_events(session_id);
CREATE INDEX IF NOT EXISTS idx_performance_summaries_employee ON public.employee_performance_summaries(employee_name, summary_date);
CREATE INDEX IF NOT EXISTS idx_activity_analytics_type ON public.activity_analytics(activity_type, analysis_date);

-- Enable Row Level Security
ALTER TABLE public.time_tracking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employee_performance_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all authenticated users to access)
CREATE POLICY "Users can manage time tracking events" ON public.time_tracking_events 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view performance summaries" ON public.employee_performance_summaries 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Users can view activity analytics" ON public.activity_analytics 
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create a function to automatically update duration when end_time is set
CREATE OR REPLACE FUNCTION update_time_tracking_duration()
RETURNS TRIGGER AS $$
BEGIN
  -- Only calculate if end_time is provided and start_time exists
  IF NEW.end_time IS NOT NULL AND NEW.start_time IS NOT NULL THEN
    NEW.duration_minutes = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time)) / 60;
    NEW.duration_hours = NEW.duration_minutes / 60.0;
    NEW.is_active = false;
    NEW.updated_at = now();
    
    -- Calculate efficiency metrics if estimated duration exists
    IF NEW.estimated_duration_minutes IS NOT NULL AND NEW.estimated_duration_minutes > 0 THEN
      NEW.actual_vs_estimated = ((NEW.duration_minutes - NEW.estimated_duration_minutes) / NEW.estimated_duration_minutes::float) * 100;
      
      -- Auto-assign efficiency rating if not provided
      IF NEW.efficiency_rating IS NULL THEN
        CASE 
          WHEN NEW.actual_vs_estimated <= -20 THEN NEW.efficiency_rating = 5;
          WHEN NEW.actual_vs_estimated <= -10 THEN NEW.efficiency_rating = 4;
          WHEN NEW.actual_vs_estimated <= 10 THEN NEW.efficiency_rating = 3;
          WHEN NEW.actual_vs_estimated <= 25 THEN NEW.efficiency_rating = 2;
          ELSE NEW.efficiency_rating = 1;
        END CASE;
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic duration calculation
CREATE TRIGGER trigger_update_time_tracking_duration
  BEFORE INSERT OR UPDATE ON public.time_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION update_time_tracking_duration();

-- Create a function to generate daily performance summaries
CREATE OR REPLACE FUNCTION generate_daily_performance_summary(employee_name_param TEXT, date_param DATE)
RETURNS VOID AS $$
DECLARE
  summary_data RECORD;
BEGIN
  -- Calculate daily summary for the employee
  SELECT 
    COUNT(*) as activities_completed,
    COALESCE(SUM(duration_minutes), 0) as total_minutes,
    COALESCE(SUM(duration_minutes), 0) / 60.0 as total_hours,
    COALESCE(AVG(duration_minutes), 0) as average_activity_duration,
    COALESCE(AVG(efficiency_rating), 3.0) as efficiency_score,
    COUNT(CASE WHEN activity_type LIKE 'test_drive%' THEN 1 END) as test_drives_completed,
    COALESCE(SUM(CASE WHEN activity_type LIKE 'test_drive%' THEN duration_minutes END), 0) as test_drives_total_minutes,
    COUNT(CASE WHEN activity_type LIKE 'repair%' THEN 1 END) as repairs_completed,
    COALESCE(SUM(CASE WHEN activity_type LIKE 'repair%' THEN duration_minutes END), 0) as repairs_total_minutes,
    COUNT(CASE WHEN activity_type = 'client_interaction' THEN 1 END) as client_interactions,
    COALESCE(SUM(CASE WHEN activity_type = 'client_interaction' THEN duration_minutes END), 0) as client_interactions_total_minutes,
    COUNT(CASE WHEN activity_type LIKE 'pdi%' THEN 1 END) as pdi_checks_completed,
    COALESCE(SUM(CASE WHEN activity_type LIKE 'pdi%' THEN duration_minutes END), 0) as pdi_checks_total_minutes,
    COUNT(DISTINCT car_vin) as cars_worked_on,
    COUNT(DISTINCT client_name) as clients_served,
    ROUND(AVG(CASE WHEN efficiency_rating >= 3 THEN 100 ELSE 0 END)) as on_time_performance
  INTO summary_data
  FROM public.time_tracking_events
  WHERE employee_name = employee_name_param 
    AND DATE(start_time) = date_param
    AND is_active = false;

  -- Insert or update the summary
  INSERT INTO public.employee_performance_summaries (
    employee_name, summary_date, summary_type,
    total_hours, total_minutes, activities_completed, average_activity_duration, efficiency_score,
    test_drives_completed, test_drives_total_minutes,
    repairs_completed, repairs_total_minutes,
    client_interactions, client_interactions_total_minutes,
    pdi_checks_completed, pdi_checks_total_minutes,
    cars_worked_on, clients_served, on_time_performance
  ) VALUES (
    employee_name_param, date_param, 'daily',
    summary_data.total_hours, summary_data.total_minutes, summary_data.activities_completed,
    summary_data.average_activity_duration, summary_data.efficiency_score,
    summary_data.test_drives_completed, summary_data.test_drives_total_minutes,
    summary_data.repairs_completed, summary_data.repairs_total_minutes,
    summary_data.client_interactions, summary_data.client_interactions_total_minutes,
    summary_data.pdi_checks_completed, summary_data.pdi_checks_total_minutes,
    summary_data.cars_worked_on, summary_data.clients_served, summary_data.on_time_performance
  )
  ON CONFLICT (employee_name, summary_date, summary_type)
  DO UPDATE SET
    total_hours = EXCLUDED.total_hours,
    total_minutes = EXCLUDED.total_minutes,
    activities_completed = EXCLUDED.activities_completed,
    average_activity_duration = EXCLUDED.average_activity_duration,
    efficiency_score = EXCLUDED.efficiency_score,
    test_drives_completed = EXCLUDED.test_drives_completed,
    test_drives_total_minutes = EXCLUDED.test_drives_total_minutes,
    repairs_completed = EXCLUDED.repairs_completed,
    repairs_total_minutes = EXCLUDED.repairs_total_minutes,
    client_interactions = EXCLUDED.client_interactions,
    client_interactions_total_minutes = EXCLUDED.client_interactions_total_minutes,
    pdi_checks_completed = EXCLUDED.pdi_checks_completed,
    pdi_checks_total_minutes = EXCLUDED.pdi_checks_total_minutes,
    cars_worked_on = EXCLUDED.cars_worked_on,
    clients_served = EXCLUDED.clients_served,
    on_time_performance = EXCLUDED.on_time_performance,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate daily summaries when activities are completed
CREATE OR REPLACE FUNCTION trigger_generate_daily_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Only generate summary when an activity is completed (end_time is set)
  IF NEW.end_time IS NOT NULL AND NEW.is_active = false THEN
    PERFORM generate_daily_performance_summary(NEW.employee_name, DATE(NEW.start_time));
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_daily_summary
  AFTER INSERT OR UPDATE ON public.time_tracking_events
  FOR EACH ROW
  EXECUTE FUNCTION trigger_generate_daily_summary(); 