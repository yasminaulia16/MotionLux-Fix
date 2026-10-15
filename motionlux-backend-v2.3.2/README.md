# MotionLux Backend v2

Express + Supabase backend for the MotionLux IoT lighting project.

## 1. Install

```bash
npm install
```

Copy `.env.example` to `.env` and fill in:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `IOT_DEVICE_KEY`

## 2. Database

Run `../database/schema.sql` once in Supabase SQL Editor.

Create the first admin in Supabase Authentication > Users. After creation, set the matching `profiles.role` to `admin` using SQL:

```sql
update public.profiles set role='admin' where email='admin@motionlux.com';
```

## 3. Run

```bash
npm run dev
```

API: `http://localhost:3000`

## Auth

Frontend sends `Authorization: Bearer <access_token>`.

Admin-only endpoints:

- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/:id`
- `DELETE /api/users/:id`

## ESP32 API

Send `X-Device-Key: <IOT_DEVICE_KEY>`.

- `GET /api/iot/state?device_code=MOTIONLUX-ESP32-01`
- `POST /api/iot/heartbeat`
- `POST /api/iot/lamp-state`
- `POST /api/iot/motion`

Example heartbeat:

```json
{"device_code":"MOTIONLUX-ESP32-01"}
```

Example lamp state:

```json
{"device_code":"MOTIONLUX-ESP32-01","is_on":true}
```

Example PIR event:

```json
{"device_code":"MOTIONLUX-ESP32-01"}
```

The device API is intentionally separate from user authentication so the ESP32 does not need a Supabase user account.

## Update v2.3 — Shutdown lampu & durasi motion

**Wajib dijalankan sekali** di Supabase > SQL Editor: isi file `database/migration_v2_3.sql`
(menambah kolom `lamps.is_locked` dan `motion_settings.duration_seconds`).

- `PATCH /api/lamps/:id/shutdown` (admin) body `{ "locked": true|false }` — lampu dimatikan & dikunci.
  Saat terkunci: toggle ON, ganti mode, test motion, dan event PIR dari ESP32 ditolak.
  `GET /api/iot/state` kini mengirim `shutdown` (boolean) dan `motion_seconds`.
- `PUT /api/motion` menerima `duration_seconds` (10–3600): berapa lama lampu menyala setelah gerakan terakhir.
- Pengecekan otomatisasi berjalan tiap 5 detik.

## Update v2.3.2 — Status ESP32 online/offline

Status ESP32 kini dinilai dari `last_seen_at`: ONLINE jika ESP32 menghubungi server dalam
`DEVICE_OFFLINE_SECONDS` detik terakhir (default 30), selain itu OFFLINE. Yang dihitung sebagai
"menghubungi server": `POST /api/iot/heartbeat`, `GET /api/iot/state`, `POST /api/iot/lamp-state`, `POST /api/iot/motion`.
Pastikan firmware ESP32 memanggil salah satunya secara berkala (disarankan tiap 5–10 detik).
