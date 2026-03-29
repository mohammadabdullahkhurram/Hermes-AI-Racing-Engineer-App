import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Validate shared secret
  const authHeader = req.headers.get("authorization") || "";
  const expectedSecret = Deno.env.get("TELEMETRY_INGEST_SECRET");
  if (!expectedSecret || authHeader !== `Bearer ${expectedSecret}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert latest telemetry (single row, id=1)
    const { error: telError } = await supabase
      .from("latest_telemetry")
      .upsert({
        id: 1,
        status: body.status ?? "waiting",
        lap_num: body.lap_num ?? 1,
        cur_time: body.cur_time ?? "0:00.000",
        samples: body.samples ?? 0,
        speed: body.speed ?? 0,
        gear: body.gear ?? 0,
        throttle: body.throttle ?? 0,
        brake: body.brake ?? 0,
        car_x: body.car_x ?? null,
        car_z: body.car_z ?? null,
        pixel_x: body.pixel_x ?? null,
        pixel_y: body.pixel_y ?? null,
        heading_rad: body.heading_rad ?? 0,
        path: body.path ?? [],
        history: body.history ?? [],
        coaching: body.coaching ?? {},
        updated_at: new Date().toISOString(),
      });

    if (telError) {
      console.error("Telemetry upsert error:", telError);
      return new Response(JSON.stringify({ error: telError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If a completed lap is included, insert into lap_history
    if (body.completed_lap) {
      const lap = body.completed_lap;
      const { error: lapError } = await supabase.from("lap_history").insert({
        lap: lap.lap,
        time: lap.time,
        samples: lap.samples ?? 0,
      });
      if (lapError) {
        console.error("Lap insert error:", lapError);
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Ingest error:", e);
    return new Response(JSON.stringify({ error: "Invalid request body" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
