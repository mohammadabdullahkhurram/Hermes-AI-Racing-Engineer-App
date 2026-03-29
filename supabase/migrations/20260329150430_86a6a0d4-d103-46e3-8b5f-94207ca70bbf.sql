CREATE TABLE public.reference_laps (
  id text PRIMARY KEY DEFAULT 'default',
  label text NOT NULL,
  lap_time_s real NOT NULL,
  lap_dist_m real NOT NULL,
  channels jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.reference_laps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read reference_laps" ON public.reference_laps FOR SELECT TO public USING (true);