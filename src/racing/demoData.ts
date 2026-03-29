import { clamp } from "./formatters";

export const DEMO_ANALYSIS = {
  ref_lap_time_s: 74.259, comp_lap_time_s: 121.628, total_time_delta_s: 47.369,
  ref_label: "fast_laps", comp_label: "ac_lap1",
  sectors: [
    { sector_id:1, sector_name:"Sector 1", start_m:0, end_m:1141.8, time_delta_s:38.559, ref_min_speed_kmh:94.4, comp_min_speed_kmh:12.1, speed_delta_at_min_kmh:-82.3, ref_max_speed_kmh:220.3, comp_max_speed_kmh:232.5, ref_avg_throttle:0.757, comp_avg_throttle:0.721 },
    { sector_id:2, sector_name:"Sector 2", start_m:1141.8, end_m:2283.5, time_delta_s:-2.0, ref_min_speed_kmh:65.5, comp_min_speed_kmh:59.6, speed_delta_at_min_kmh:-5.9, ref_max_speed_kmh:239.4, comp_max_speed_kmh:273.1, ref_avg_throttle:0.831, comp_avg_throttle:0.761 },
    { sector_id:3, sector_name:"Sector 3", start_m:2283.5, end_m:3425.3, time_delta_s:-2.831, ref_min_speed_kmh:54.4, comp_min_speed_kmh:75.7, speed_delta_at_min_kmh:21.3, ref_max_speed_kmh:245.6, comp_max_speed_kmh:278.4, ref_avg_throttle:0.652, comp_avg_throttle:0.686 },
  ],
  corners: [
    { corner_id:"T1", corner_name:"Turn 1", corner_type:"heavy_brake", dist_m:507.7, time_delta_s:39.356, ref_apex_speed_kmh:94.4, comp_apex_speed_kmh:60.0, apex_speed_delta_kmh:-34.4, ref_entry_speed_kmh:172.6, comp_entry_speed_kmh:77.9, entry_speed_delta_kmh:-94.7, ref_brake_point_m:325, comp_brake_point_m:340, brake_point_delta_m:15, ref_throttle_pickup_m:510, comp_throttle_pickup_m:510, throttle_pickup_delta_m:0 },
    { corner_id:"T2", corner_name:"Turn 2", corner_type:"heavy_brake", dist_m:1520.1, time_delta_s:39.139, ref_apex_speed_kmh:65.5, comp_apex_speed_kmh:59.6, apex_speed_delta_kmh:-5.9, ref_entry_speed_kmh:172.3, comp_entry_speed_kmh:134.3, entry_speed_delta_kmh:-38.1, ref_brake_point_m:1335, comp_brake_point_m:1365, brake_point_delta_m:30, ref_throttle_pickup_m:1525, comp_throttle_pickup_m:1525, throttle_pickup_delta_m:0 },
    { corner_id:"T3", corner_name:"Turn 3", corner_type:"heavy_brake", dist_m:2708.2, time_delta_s:34.874, ref_apex_speed_kmh:54.4, comp_apex_speed_kmh:75.7, apex_speed_delta_kmh:21.3, ref_entry_speed_kmh:177.4, comp_entry_speed_kmh:232.0, entry_speed_delta_kmh:54.6, ref_brake_point_m:2510, comp_brake_point_m:2555, brake_point_delta_m:45, ref_throttle_pickup_m:2710, comp_throttle_pickup_m:2720, throttle_pickup_delta_m:10 },
  ],
  lap_dist_m: 3425.3,
};

export const DEMO_COACHING = {
  overall_summary: "Big gap to reference, but the data shows exactly where it is hiding. Attack these points. Current gap: 47.369s slower than reference. The biggest opportunity is Sector 1 (+38.559s), where 82.3 km/h is being left on the table through the corners.",
  priority_actions: [
    { location:"Turn 1", issue:"Apex speed is 34.4 km/h below reference (60.0 vs 94.4 km/h). Significant corner exit speed deficit.", instruction:"Use higher initial brake pressure to pitch the car in, trail off through apex. Hit 94 km/h and the exit speed takes care of itself.", time_gain_s:1.032, priority:1, confidence:"high" },
    { location:"Turn 2", issue:"Apex speed is 5.9 km/h below reference (59.6 vs 65.5 km/h). Significant corner exit speed deficit.", instruction:"Despite a late brake point, apex speed is below reference — car not rotating. Use higher initial brake pressure to pitch the car in, trail off through apex.", time_gain_s:0.177, priority:2, confidence:"high" },
  ],
  sector_feedback: [
    { sector:"Sector 1", time_delta_s:38.559, headline:"Minimum corner speed is 82.3 km/h below reference — driver is over-slowing significantly.", has_issues:true },
    { sector:"Sector 2", time_delta_s:-2.0, headline:"Minimum corner speed is 5.9 km/h below reference. Average throttle application 7% lower.", has_issues:true },
    { sector:"Sector 3", time_delta_s:-2.831, headline:"Solid sector — 2.831s ahead of reference. Corner speed 21.3 km/h above reference.", has_issues:false },
  ],
  positive_observations: ["Sector 2: 2.000s ahead of reference.", "Sector 3: 2.831s ahead of reference.", "Turn 3: carrying 21.3 km/h more than reference at the apex."],
};

export const DEMO_LAPS = [
  { id:1, lap_number:1, lap_time_s:121.628, session:"Yas Marina - Practice", timestamp:"2024-01-15 14:23:11", track:"Yas Marina", car:"Ferrari 488 GT3", gap_to_ref:"+47.369", samples:3421, is_latest:true, is_best:false, source:"AC Live" },
  { id:2, lap_number:2, lap_time_s:118.445, session:"Yas Marina - Practice", timestamp:"2024-01-15 14:26:44", track:"Yas Marina", car:"Ferrari 488 GT3", gap_to_ref:"+44.186", samples:3389, is_latest:false, is_best:false, source:"AC Live" },
  { id:3, lap_number:3, lap_time_s:96.772, session:"Yas Marina - Quali", timestamp:"2024-01-15 15:01:22", track:"Yas Marina", car:"Ferrari 488 GT3", gap_to_ref:"+22.513", samples:3445, is_latest:false, is_best:false, source:"AC Live" },
  { id:4, lap_number:4, lap_time_s:88.312, session:"Yas Marina - Quali", timestamp:"2024-01-15 15:04:55", track:"Yas Marina", car:"Ferrari 488 GT3", gap_to_ref:"+14.053", samples:3512, is_latest:false, is_best:false, source:"AC Live" },
  { id:5, lap_number:5, lap_time_s:79.441, session:"Yas Marina - Quali", timestamp:"2024-01-15 15:08:18", track:"Yas Marina", car:"Ferrari 488 GT3", gap_to_ref:"+5.182", samples:3567, is_latest:false, is_best:false, source:"SimHub CSV" },
  { id:6, lap_number:6, lap_time_s:74.259, session:"Yas Marina - Reference", timestamp:"2024-01-15 15:12:05", track:"Yas Marina", car:"Ferrari 488 GT3", gap_to_ref:"REF", samples:3621, is_latest:false, is_best:true, source:"MCAP Reference" },
];

export const LIVE_COACH_MSGS = [
  "Brake later into Turn 6 — you have more margin",
  "Good exit from Turn 11 — keep that line",
  "Carry more speed through the chicane",
  "Apply throttle earlier exiting Turn 3",
  "Too much lift before the apex — trust the grip",
  "Great braking point — consistent",
];

const genTelemetryData = (n = 80) => {
  const data = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const dist = Math.round(t * 3425);
    const refSpeed = 80 + Math.sin(t * Math.PI * 4) * 60 + Math.sin(t * Math.PI * 2) * 40;
    const compSpeed = refSpeed - 10 + Math.sin(t * Math.PI * 5) * 15;
    data.push({
      dist,
      refSpeed: Math.round(clamp(refSpeed, 40, 260)),
      compSpeed: Math.round(clamp(compSpeed, 30, 270)),
      throttle: Math.round(clamp(0.5 + Math.sin(t * Math.PI * 6) * 0.5, 0, 1) * 100),
      brake: Math.round(clamp(0.3 - Math.sin(t * Math.PI * 6) * 0.3, 0, 1) * 100),
      steering: Math.round(Math.sin(t * Math.PI * 8) * 180),
    });
  }
  return data;
};

export const TELEM_DATA = genTelemetryData(80);
