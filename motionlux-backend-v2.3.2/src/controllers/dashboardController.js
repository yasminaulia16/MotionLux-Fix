import { supabase } from '../config/supabase.js';
import { ok } from '../utils/response.js';
import { automationSnapshot, getSunTimes } from '../services/automationService.js';
import { withOnline } from '../utils/device.js';

export async function dashboard(req, res) {
  const [l, s, sun, motion, events] = await Promise.all([
    supabase.from('lamps').select('*').order('id'),
    supabase.from('schedules').select('*, lamps(name)').order('on_time'),
    supabase.from('sun_settings').select('*').eq('id', 1).single(),
    supabase.from('motion_settings').select('*, lamps(name)').eq('id', 1).single(),
    supabase.from('motion_events').select('*').order('detected_at', { ascending: false }).limit(20)
  ]);
  if (l.error) throw l.error;
  if (s.error) throw s.error;
  if (sun.error) throw sun.error;
  if (motion.error) throw motion.error;
  if (events.error) throw events.error;

  const lamps = (l.data || []).map(withOnline).map((lamp) => ({
    ...lamp,
    automation: automationSnapshot({
      lamp,
      schedules: (s.data || []).filter((item) => item.lamp_id === lamp.id),
      sun: { ...sun.data, calculated: getSunTimes(Number(sun.data.latitude), Number(sun.data.longitude)) },
      motionEvents: (events.data || []).filter((item) => item.lamp_id === lamp.id),
      motionSeconds: motion.data.duration_seconds
    })
  }));

  return ok(res, {
    lamps,
    schedules: s.data || [],
    sun: { ...sun.data, calculated: getSunTimes(Number(sun.data.latitude), Number(sun.data.longitude)) },
    motion: motion.data,
    motion_events: events.data || []
  });
}
