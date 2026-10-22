import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/response.js';
import { LOCKED_MESSAGE } from './lampController.js';

export async function getMotion(req, res) {
  const { data, error } = await supabase.from('motion_settings').select('*, lamps(name,room,device_code)').eq('id', 1).single();
  if (error) throw error;
  const { data: events, error: eventsError } = await supabase.from('motion_events').select('*').order('detected_at', { ascending: false }).limit(20);
  if (eventsError) throw eventsError;
  return ok(res, { settings: data, events: events || [] });
}

export async function updateMotion(req, res) {
  const { enabled, lamp_id, duration_seconds } = req.body;
  let duration;
  if (duration_seconds !== undefined) {
    duration = Math.round(Number(duration_seconds));
    if (!Number.isFinite(duration) || duration < 10 || duration > 3600) {
      return fail(res, 'Durasi lampu menyala harus antara 10 detik sampai 60 menit.');
    }
  }
  const { data, error } = await supabase.from('motion_settings')
    .update({
      ...(enabled !== undefined ? { enabled: Boolean(enabled) } : {}),
      ...(lamp_id !== undefined ? { lamp_id } : {}),
      ...(duration !== undefined ? { duration_seconds: duration } : {}),
      updated_at: new Date().toISOString()
    })
    .eq('id', 1).select('*, lamps(name,room,device_code)').single();
  if (error) {
    if (String(error.message).includes('duration_seconds')) return fail(res, 'Kolom database belum ada. Jalankan database/migration_v2_3.sql di Supabase SQL Editor.', 500);
    throw error;
  }
  return ok(res, data);
}

export async function testMotion(req, res) { return recordMotion(req, res, 'test'); }

export async function recordMotion(req, res, source = 'pir') {
  const { data: settings, error } = await supabase.from('motion_settings').select('*').eq('id', 1).single();
  if (error) throw error;

  const { data: target } = await supabase.from('lamps').select('*').eq('id', settings.lamp_id).single();
  if (target?.is_locked) return fail(res, LOCKED_MESSAGE, 403);

  const { data: event, error: eventError } = await supabase.from('motion_events')
    .insert({ lamp_id: settings.lamp_id, source }).select().single();
  if (eventError) throw eventError;

  const { data: lamp, error: lampError } = await supabase.from('lamps')
    .update({ is_on: true, updated_at: new Date().toISOString() })
    .eq('id', settings.lamp_id).select().single();
  if (lampError) throw lampError;
  return ok(res, { event, lamp });
}
