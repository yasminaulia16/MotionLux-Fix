import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required');

const options = { auth: { autoRefreshToken: false, persistSession: false } };

// Client utama (service role) untuk semua query database.
export const supabase = createClient(url, key, options);

// Client sekali pakai khusus untuk login user.
// signInWithPassword menyimpan sesi user di dalam client; kalau dipakai di client utama,
// semua query berikutnya jalan sebagai user biasa (kena RLS) dan update/insert gagal.
export const createAuthClient = () => createClient(url, key, options);
