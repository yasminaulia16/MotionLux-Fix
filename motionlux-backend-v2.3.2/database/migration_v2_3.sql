-- MotionLux v2.3 — jalankan SEKALI di Supabase > SQL Editor
-- 1) Shutdown lampu oleh admin  2) Durasi lampu menyala setelah gerakan terdeteksi

alter table public.lamps
  add column if not exists is_locked boolean not null default false;

alter table public.motion_settings
  add column if not exists duration_seconds integer not null default 60;

alter table public.motion_settings
  drop constraint if exists motion_settings_duration_check;
alter table public.motion_settings
  add constraint motion_settings_duration_check check (duration_seconds between 10 and 3600);

-- refresh cache schema API Supabase
notify pgrst, 'reload schema';
