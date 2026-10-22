import { supabase } from '../config/supabase.js';
import { fail } from '../utils/response.js';

export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return fail(res, 'Authentication required.', 401);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return fail(res, 'Invalid or expired session.', 401);
    const { data: profile, error: profileError } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (profileError || !profile) return fail(res, 'User profile not found.', 403);
    req.authUser = user;
    req.profile = profile;
    next();
  } catch (e) { next(e); }
}

export function requireAdmin(req, res, next) {
  if (req.profile?.role !== 'admin') return fail(res, 'Admin access required.', 403);
  next();
}
