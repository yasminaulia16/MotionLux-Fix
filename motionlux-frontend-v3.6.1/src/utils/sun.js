// Perhitungan sunrise/sunset di sisi frontend.
// Rumus & zona waktu sama dengan backend (automationService.js) supaya pratinjau di layar
// sama dengan yang nanti dipakai otomatisasi lampu.
const TZ = 'Asia/Jakarta';

const rad = (v) => (v * Math.PI) / 180;
const deg = (v) => (v * 180) / Math.PI;
const norm = (v, m) => ((v % m) + m) % m;

function localParts(date, timeZone = TZ) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date);
  const get = (t) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour'), minute: get('minute') };
}

function solarTime({ year, month, day, latitude, longitude, sunrise }) {
  const N = Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(year, 0, 0)) / 86400000);
  const lngHour = longitude / 15;
  const t = N + ((sunrise ? 6 : 18) - lngHour) / 24;
  const M = 0.9856 * t - 3.289;
  const L = norm(M + 1.916 * Math.sin(rad(M)) + 0.02 * Math.sin(rad(2 * M)) + 282.634, 360);

  let RA = norm(deg(Math.atan(0.91764 * Math.tan(rad(L)))), 360);
  RA += Math.floor(L / 90) * 90 - Math.floor(RA / 90) * 90;
  RA /= 15;

  const sinDec = 0.39782 * Math.sin(rad(L));
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosH = (Math.cos(rad(90.833)) - sinDec * Math.sin(rad(latitude))) / (cosDec * Math.cos(rad(latitude)));
  if (cosH > 1 || cosH < -1) return null;

  const H = (sunrise ? 360 - deg(Math.acos(cosH)) : deg(Math.acos(cosH))) / 15;
  const UT = norm(H + RA - 0.06571 * t - 6.622 - lngHour, 24);
  const hour = Math.floor(UT);
  const minute = Math.round((UT - hour) * 60);
  const local = localParts(new Date(Date.UTC(year, month - 1, day, hour, minute)));
  return `${String(local.hour).padStart(2, '0')}:${String(local.minute).padStart(2, '0')}`;
}

export function getSunTimes(latitude, longitude, date = new Date()) {
  const local = localParts(date);
  return {
    sunrise: solarTime({ ...local, latitude, longitude, sunrise: true }),
    sunset: solarTime({ ...local, latitude, longitude, sunrise: false })
  };
}
