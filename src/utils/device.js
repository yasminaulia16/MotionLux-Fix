// Status ESP32: dianggap ONLINE hanya kalau baru saja menghubungi server
// (heartbeat, ambil state, lapor status lampu, atau kirim event PIR).
// Dinilai dari last_seen_at, bukan dari kolom status, supaya otomatis jadi OFFLINE
// ketika ESP32 mati / terputus dari internet.
export const OFFLINE_AFTER_SECONDS = Number(process.env.DEVICE_OFFLINE_SECONDS) > 0
  ? Number(process.env.DEVICE_OFFLINE_SECONDS)
  : 30;

export function isDeviceOnline(lamp, now = new Date()) {
  if (!lamp?.last_seen_at) return false;
  const seen = Date.parse(lamp.last_seen_at);
  if (!Number.isFinite(seen)) return false;
  return now.getTime() - seen <= OFFLINE_AFTER_SECONDS * 1000;
}

export function withOnline(lamp) {
  if (!lamp) return lamp;
  const online = isDeviceOnline(lamp);
  return { ...lamp, online, status: online ? 'online' : 'offline' };
}
