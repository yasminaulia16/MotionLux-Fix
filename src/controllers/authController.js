import { supabase, createAuthClient } from '../config/supabase.js';
import { ok, fail } from '../utils/response.js';

export async function login(req,res) {
  const { email, password } = req.body;
  if (!email || !password) return fail(res, 'Email and password are required.');
  const { data, error } = await createAuthClient().auth.signInWithPassword({ email, password });
  if (error) return fail(res, error.message, 401);
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
  return ok(res, { session:data.session, user:data.user, profile });
}
export async function me(req,res){ return ok(res,{user:req.authUser,profile:req.profile}); }
