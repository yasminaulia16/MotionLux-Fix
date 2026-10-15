import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/response.js';
import { automationSnapshot } from '../services/automationService.js';

export async function heartbeat(req, res) {
  const { device_code } = req.body;
  if (!device_code) return fail(res, 'device_code is required.');
  const { data, error } = await supabase.from('lamps').update({
    status: 'online', last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }).eq('device_code', device_code).select().single();
  if (error) return fail(res, 'Unknown device.', 404);
  return ok(res, data);
}

export async function deviceState(req, res) {
  const { device_code } = req.query;
  if (!device_code) return fail(res, 'device_code is required.');
  const { data: lamp, error } = await supabase.from('lamps').select('*').eq('device_code', device_code).single();
  if (error) return fail(res, 'Unknown device.', 404);
  // ESP32 yang mengambil state = sedang terhubung. Catat waktunya.
  await supabase.from('lamps').update({ status: 'online', last_seen_at: new Date().toISOString() }).eq('id', lamp.id);
  const [{ data: sun }, { data: motion }, { data: schedules }, { data: events }] = await Promise.all([
    supabase.from('sun_settings').select('*').eq('id', 1).single(),
    supabase.from('motion_settings').select('*').eq('id', 1).single(),
    supabase.from('schedules').select('*').eq('lamp_id', lamp.id).eq('is_active', true),
    supabase.from('motion_events').select('*').eq('lamp_id', lamp.id).order('detected_at', { ascending: false }).limit(10)
  ]);
  const automation = automationSnapshot({ lamp, schedules: schedules || [], sun, motionEvents: events || [], motionSeconds: motion?.duration_seconds });
  return ok(res, { lamp, sun, motion, schedules: schedules || [], shutdown: Boolean(lamp.is_locked), motion_seconds: motion?.duration_seconds ?? 60, ...automation });
}

export async function deviceLampState(req, res) {
  const { device_code, is_on } = req.body;
  if (!device_code || typeof is_on !== 'boolean') return fail(res, 'device_code and boolean is_on are required.');
  const { data: current } = await supabase.from('lamps').select('*').eq('device_code', device_code).single();
  if (!current) return fail(res, 'Unknown device.', 404);
  const { data, error } = await supabase.from('lamps').update({
    is_on: current.is_locked ? false : is_on, // lampu di-shutdown admin tidak boleh dilaporkan menyala
    updated_at: new Date().toISOString(), status: 'online', last_seen_at: new Date().toISOString()
  }).eq('device_code', device_code).select().single();
  if (error) return fail(res, 'Unknown device.', 404);
  return ok(res, data);
}

export async function deviceMotion(req, res) {
  const { device_code } = req.body;
  if (!device_code) return fail(res, 'device_code is required.');
  const { data: lamp } = await supabase.from('lamps').select('id,mode,is_locked').eq('device_code', device_code).single();
  if (!lamp) return fail(res, 'Unknown device.', 404);
  const { data: settings } = await supabase.from('motion_settings').select('*').eq('id', 1).single();
  if (lamp.is_locked) return ok(res, { accepted: false, reason: 'lamp_shutdown' });
  const { data: event, error } = await supabase.from('motion_events').insert({ lamp_id: lamp.id, source: 'pir' }).select().single();
  if (error) throw error;
  if (lamp.mode !== 'motion') {
    return ok(res, { accepted: true, controlled: false, reason: 'lamp_not_in_motion_mode', event, lamp });
  }
  const { data: updated } = await supabase.from('lamps').update({
    is_on: true, status: 'online', last_seen_at: new Date().toISOString(), updated_at: new Date().toISOString()
  }).eq('id', lamp.id).select().single();
  return ok(res, { accepted: true, controlled: true, event, lamp: updated });
}
