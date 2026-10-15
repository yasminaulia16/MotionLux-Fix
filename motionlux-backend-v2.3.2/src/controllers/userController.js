import { supabase } from '../config/supabase.js';
import { ok, fail } from '../utils/response.js';

export async function listUsers(req,res){
  const { data, error } = await supabase.from('profiles').select('*').order('created_at',{ascending:false});
  if(error) throw error; return ok(res,data);
}
export async function createUser(req,res){
  const { name, email, password, role='user' } = req.body;
  if(!name || !email || !password) return fail(res,'Name, email and password are required.');
  if(!['admin','user'].includes(role)) return fail(res,'Invalid role.');
  const { data, error } = await supabase.auth.admin.createUser({ email, password, email_confirm:true, user_metadata:{name} });
  if(error) return fail(res,error.message,400);
  const { data: profile, error: profileError } = await supabase.from('profiles').update({name,email,role,updated_at:new Date().toISOString()}).eq('id',data.user.id).select().single();
  if(profileError) throw profileError;
  return ok(res,profile,201);
}
export async function updateUser(req,res){
  const { id } = req.params; const { name, role } = req.body;
  if(role && !['admin','user'].includes(role)) return fail(res,'Invalid role.');
  const { data, error } = await supabase.from('profiles').update({...(name!==undefined?{name}:{}),...(role!==undefined?{role}:{}),updated_at:new Date().toISOString()}).eq('id',id).select().single();
  if(error) throw error; return ok(res,data);
}
export async function deleteUser(req,res){
  const { id }=req.params;
  if(id===req.authUser.id) return fail(res,'You cannot delete your own account.',400);
  const { error } = await supabase.auth.admin.deleteUser(id);
  if(error) return fail(res,error.message,400);
  return ok(res,{id});
}
