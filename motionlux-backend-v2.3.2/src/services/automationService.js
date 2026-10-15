const DEFAULT_TZ = process.env.TIMEZONE || 'Asia/Jakarta';

function degToRad(value) { return value * Math.PI / 180; }
function radToDeg(value) { return value * 180 / Math.PI; }
function normalizeDegrees(value) { return ((value % 360) + 360) % 360; }
function normalizeHours(value) { return ((value % 24) + 24) % 24; }

export function getLocalParts(date = new Date(), timeZone = DEFAULT_TZ) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23'
  }).formatToParts(date);
  const get = (type) => parts.find((p) => p.type === type)?.value;
  return {
    weekday: get('weekday'),
    year: Number(get('year')),
    month: Number(get('month')),
    day: Number(get('day')),
    hour: Number(get('hour')),
    minute: Number(get('minute')),
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute'))
  };
}

function dayOfYear(year, month, day) {
  const start = Date.UTC(year, 0, 0);
  const current = Date.UTC(year, month - 1, day);
  return Math.floor((current - start) / 86400000);
}

function calculateSolarTime({ year, month, day, latitude, longitude, sunrise }) {
  const N = dayOfYear(year, month, day);
  const lngHour = longitude / 15;
  const t = N + ((sunrise ? 6 : 18) - lngHour) / 24;
  const M = (0.9856 * t) - 3.289;
  let L = M + (1.916 * Math.sin(degToRad(M))) + (0.020 * Math.sin(degToRad(2 * M))) + 282.634;
  L = normalizeDegrees(L);

  let RA = radToDeg(Math.atan(0.91764 * Math.tan(degToRad(L))));
  RA = normalizeDegrees(RA);
  const Lquadrant = Math.floor(L / 90) * 90;
  const RAquadrant = Math.floor(RA / 90) * 90;
  RA = RA + (Lquadrant - RAquadrant);
  RA /= 15;

  const sinDec = 0.39782 * Math.sin(degToRad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(degToRad(90.833)) - (sinDec * Math.sin(degToRad(latitude)))) /
    (cosDec * Math.cos(degToRad(latitude)));
  if (cosH > 1 || cosH < -1) return null;

  let H = sunrise ? 360 - radToDeg(Math.acos(cosH)) : radToDeg(Math.acos(cosH));
  H /= 15;
  const T = H + RA - (0.06571 * t) - 6.622;
  const UT = normalizeHours(T - lngHour);
  const hour = Math.floor(UT);
  const minute = Math.round((UT - hour) * 60);
  const utcDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
  const local = getLocalParts(utcDate);
  return `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;
}

export function getSunTimes(latitude, longitude, date = new Date(), timeZone = DEFAULT_TZ) {
  const local = getLocalParts(date, timeZone);
  return {
    sunrise: calculateSolarTime({ ...local, latitude, longitude, sunrise: true }),
    sunset: calculateSolarTime({ ...local, latitude, longitude, sunrise: false })
  };
}

export function timeToMinutes(value) {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function previousWeekday(weekday) {
  const index = weekdays.indexOf(weekday);
  return weekdays[(index + 6) % 7];
}

export function scheduleIsActiveNow(schedule, local) {
  if (!schedule?.is_active) return false;
  const on = timeToMinutes(schedule.on_time);
  const off = timeToMinutes(schedule.off_time);
  if (on === null || off === null || on === off) return false;
  const days = Array.isArray(schedule.repeat_days) && schedule.repeat_days.length ? schedule.repeat_days : weekdays.slice(1);
  const today = local.weekday;
  const yesterday = previousWeekday(today);

  if (on < off) {
    return days.includes(today) && local.minutes >= on && local.minutes < off;
  }

  // Overnight schedule, e.g. 22:00 -> 06:00.
  if (local.minutes >= on) return days.includes(today);
  if (local.minutes < off) return days.includes(yesterday);
  return false;
}

export function scheduleDesiredOn(schedules, date = new Date(), timeZone = DEFAULT_TZ) {
  const local = getLocalParts(date, timeZone);
  return (schedules || []).some((schedule) => scheduleIsActiveNow(schedule, local));
}

export const DEFAULT_MOTION_SECONDS = 60;

export function motionDesiredOn(events, date = new Date(), timeoutSeconds = DEFAULT_MOTION_SECONDS) {
  const timeout = Number(timeoutSeconds) > 0 ? Number(timeoutSeconds) : DEFAULT_MOTION_SECONDS;
  if (!events?.length) return false;
  const latest = new Date(events[0].detected_at).getTime();
  if (!Number.isFinite(latest)) return false;
  return date.getTime() - latest >= 0 && date.getTime() - latest <= timeout * 1000;
}

export function sunDesiredOn(sun, date = new Date(), timeZone = DEFAULT_TZ) {
  if (!sun) return false;
  const local = getLocalParts(date, timeZone);
  const times = getSunTimes(Number(sun.latitude), Number(sun.longitude), date, timeZone);
  // Selalu pakai jam hasil hitungan hari ini dari lokasi (latitude/longitude),
  // supaya otomatisasi tidak memakai jam lama yang tersimpan.
  const sunrise = timeToMinutes(times.sunrise);
  const sunset = timeToMinutes(times.sunset);
  if (sunrise === null || sunset === null) return false;

  // Menyala sejak sunset, mati saat sunrise (tidak ada switch terpisah lagi)
  return local.minutes >= sunset || local.minutes < sunrise;
}

export function desiredLampState({ lamp, schedules, sun, motionEvents, motionSeconds, now = new Date(), timeZone = DEFAULT_TZ }) {
  if (!lamp) return false;
  if (lamp.is_locked) return false; // di-shutdown admin: lampu selalu mati
  if (lamp.mode === 'manual') return Boolean(lamp.is_on);
  if (lamp.mode === 'schedule') return scheduleDesiredOn(schedules, now, timeZone);
  if (lamp.mode === 'sunrise_sunset') return sunDesiredOn(sun, now, timeZone);
  if (lamp.mode === 'motion') return motionDesiredOn(motionEvents, now, motionSeconds);
  return Boolean(lamp.is_on);
}

export function automationSnapshot({ lamp, schedules, sun, motionEvents, motionSeconds, now = new Date(), timeZone = DEFAULT_TZ }) {
  const sunTimes = sun ? getSunTimes(Number(sun.latitude), Number(sun.longitude), now, timeZone) : { sunrise: null, sunset: null };
  return {
    desired_is_on: desiredLampState({ lamp, schedules, sun, motionEvents, motionSeconds, now, timeZone }),
    sunrise_time: sunTimes.sunrise,
    sunset_time: sunTimes.sunset,
    evaluated_at: now.toISOString()
  };
}

export async function applyAutomationToLamps(supabase, { onlyLampId = null } = {}) {
  const [lampsResult, schedulesResult, sunResult, eventsResult, motionResult] = await Promise.all([
    supabase.from('lamps').select('*').order('id'),
    supabase.from('schedules').select('*').eq('is_active', true),
    supabase.from('sun_settings').select('*').eq('id', 1).single(),
    supabase.from('motion_events').select('*').order('detected_at', { ascending: false }).limit(100),
    supabase.from('motion_settings').select('*').eq('id', 1).single()
  ]);
  if (lampsResult.error) throw lampsResult.error;
  if (schedulesResult.error) throw schedulesResult.error;
  if (sunResult.error) throw sunResult.error;
  if (eventsResult.error) throw eventsResult.error;

  const lamps = onlyLampId == null ? lampsResult.data : lampsResult.data.filter((lamp) => String(lamp.id) === String(onlyLampId));
  const now = new Date();
  const updates = [];
  for (const lamp of lamps) {
    if (lamp.mode === 'manual' && !lamp.is_locked) continue;
    const desired = desiredLampState({
      lamp,
      schedules: schedulesResult.data.filter((s) => s.lamp_id === lamp.id),
      sun: sunResult.data,
      motionEvents: eventsResult.data.filter((e) => e.lamp_id === lamp.id),
      motionSeconds: motionResult.data?.duration_seconds,
      now
    });
    if (Boolean(lamp.is_on) !== Boolean(desired)) {
      updates.push(supabase.from('lamps').update({ is_on: desired, updated_at: now.toISOString() }).eq('id', lamp.id));
    }
  }
  if (updates.length) await Promise.all(updates);
  return { changed: updates.length };
}
