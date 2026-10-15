import { supabase } from '../config/supabase.js'; import { ok,fail } from '../utils/response.js';
export async function getProfile(req,res){return ok(res,req.profile);}
export async function updateProfile(req,res){const {name}=req.body;if(!name)return fail(res,'Name is required.');const {data,error}=await supabase.from('profiles').update({name,updated_at:new Date().toISOString()}).eq('id',req.authUser.id).select().single();if(error)throw error;return ok(res,data);}
