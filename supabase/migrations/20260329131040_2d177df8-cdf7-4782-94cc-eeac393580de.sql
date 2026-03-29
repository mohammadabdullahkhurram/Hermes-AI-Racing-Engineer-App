
ALTER TABLE public.lap_history 
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'live',
  ADD COLUMN IF NOT EXISTS filename text,
  ADD COLUMN IF NOT EXISTS analysis jsonb,
  ADD COLUMN IF NOT EXISTS coaching jsonb,
  ADD COLUMN IF NOT EXISTS telemetry jsonb;

-- Allow inserts for uploaded laps from edge functions
CREATE POLICY "Allow insert lap_history" ON public.lap_history
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
