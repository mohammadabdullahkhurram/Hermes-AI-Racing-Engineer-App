
-- Table: latest_telemetry (single row, upserted by edge function)
CREATE TABLE public.latest_telemetry (
  id integer PRIMARY KEY DEFAULT 1,
  status text NOT NULL DEFAULT 'waiting',
  lap_num integer NOT NULL DEFAULT 1,
  cur_time text NOT NULL DEFAULT '0:00.000',
  samples integer NOT NULL DEFAULT 0,
  speed real NOT NULL DEFAULT 0,
  gear integer NOT NULL DEFAULT 0,
  throttle real NOT NULL DEFAULT 0,
  brake real NOT NULL DEFAULT 0,
  car_x real,
  car_z real,
  pixel_x real,
  pixel_y real,
  heading_rad real NOT NULL DEFAULT 0,
  path jsonb NOT NULL DEFAULT '[]'::jsonb,
  history jsonb NOT NULL DEFAULT '[]'::jsonb,
  coaching jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Table: lap_history
CREATE TABLE public.lap_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lap integer NOT NULL,
  time text NOT NULL,
  samples integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: allow public read (no auth needed for reading telemetry)
ALTER TABLE public.latest_telemetry ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read latest_telemetry" ON public.latest_telemetry FOR SELECT USING (true);

ALTER TABLE public.lap_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read lap_history" ON public.lap_history FOR SELECT USING (true);

-- Enable realtime for latest_telemetry
ALTER PUBLICATION supabase_realtime ADD TABLE public.latest_telemetry;

-- Seed the single row
INSERT INTO public.latest_telemetry (id) VALUES (1);
