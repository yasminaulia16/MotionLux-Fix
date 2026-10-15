import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/response.js';
import { getSunTimes } from '../services/automationService.js';

export async function getSun(req, res) {
  const { data, error } = await supabase.from('sun_settings').select('*').eq('id', 1).single();
  if (error) throw error;
  return ok(res, { ...data, calculated: getSunTimes(Number(data.latitude), Number(data.longitude)) });
}

export async function updateSun(req, res) {
  const { location_name, latitude, longitude, sunrise_enabled, sunset_enabled, sunrise_time, sunset_time } = req.body;
  if (latitude !== undefined && (latitude < -90 || latitude > 90)) return fail(res, 'Invalid latitude.');
  if (longitude !== undefined && (longitude < -180 || longitude > 180)) return fail(res, 'Invalid longitude.');
  const { data, error } = await supabase.from('sun_settings').update({
    ...(location_name !== undefined ? { location_name } : {}),
    ...(latitude !== undefined ? { latitude } : {}),
    ...(longitude !== undefined ? { longitude } : {}),
    ...(sunrise_enabled !== undefined ? { sunrise_enabled: Boolean(sunrise_enabled) } : {}),
    ...(sunset_enabled !== undefined ? { sunset_enabled: Boolean(sunset_enabled) } : {}),
    ...(sunrise_time !== undefined ? { sunrise_time: sunrise_time || null } : {}),
    ...(sunset_time !== undefined ? { sunset_time: sunset_time || null } : {}),
    updated_at: new Date().toISOString()
  }).eq('id', 1).select().single();
  if (error) throw error;
  return ok(res, { ...data, calculated: getSunTimes(Number(data.latitude), Number(data.longitude)) });
}
