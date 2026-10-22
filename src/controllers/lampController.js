import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/response.js';
import { applyAutomationToLamps } from '../services/automationService.js';
import { withOnline } from '../utils/device.js';

export const LOCKED_MESSAGE = 'Lampu sedang di-shutdown oleh admin. Hubungi admin untuk mengaktifkannya kembali.';
const MIGRATION_HINT = 'Kolom database belum ada. Jalankan database/migration_v2_3.sql di Supabase SQL Editor.';

export async function listLamps(req, res) {
  const { data, error } = await supabase.from('lamps').select('*').order('id');
  if (error) throw error;
  return ok(res, data.map(withOnline));
}

export async function getLamp(req, res) {
  const { data, error } = await supabase.from('lamps').select('*').eq('id', req.params.id).single();
  if (error) return fail(res, 'Lamp not found.', 404);
  return ok(res, withOnline(data));
}

export async function toggleLamp(req, res) {
  const { is_on } = req.body;
  if (typeof is_on !== 'boolean') return fail(res, 'is_on must be boolean.');
  const { data: current, error: findError } = await supabase.from('lamps').select('*').eq('id', req.params.id).single();
  if (findError || !current) return fail(res, 'Lamp not found.', 404);
  if (current.is_locked && is_on) return fail(res, LOCKED_MESSAGE, 403);
  const { data, error } = await supabase.from('lamps')
    .update({ is_on, mode: 'manual', updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (error) throw error;
  return ok(res, withOnline(data));
}

export async function setMode(req, res) {
  const { mode } = req.body;
  if (!['manual', 'schedule', 'sunrise_sunset', 'motion'].includes(mode)) return fail(res, 'Invalid lamp mode.');
  const { data: current, error: findError } = await supabase.from('lamps').select('*').eq('id', req.params.id).single();
  if (findError || !current) return fail(res, 'Lamp not found.', 404);
  if (current.is_locked) return fail(res, LOCKED_MESSAGE, 403);
  const { data, error } = await supabase.from('lamps')
    .update({ mode, updated_at: new Date().toISOString() })
    .eq('id', req.params.id).select().single();
  if (error) throw error;
  await applyAutomationToLamps(supabase, { onlyLampId: req.params.id });
  const { data: refreshed } = await supabase.from('lamps').select('*').eq('id', req.params.id).single();
  return ok(res, withOnline(refreshed || data));
}

// Admin: shutdown lampu (locked=true) atau cabut shutdown (locked=false)
export async function shutdownLamp(req, res) {
  const { locked } = req.body;
  if (typeof locked !== 'boolean') return fail(res, 'locked must be boolean.');
  const patch = { is_locked: locked, updated_at: new Date().toISOString() };
  if (locked) patch.is_on = false; // shutdown = lampu langsung dimatikan
  const { data, error } = await supabase.from('lamps').update(patch).eq('id', req.params.id).select().single();
  if (error) {
    if (String(error.message).includes('is_locked')) return fail(res, MIGRATION_HINT, 500);
    throw error;
  }
  if (!locked) await applyAutomationToLamps(supabase, { onlyLampId: req.params.id });
  const { data: refreshed } = await supabase.from('lamps').select('*').eq('id', req.params.id).single();
  return ok(res, withOnline(refreshed || data));
}
