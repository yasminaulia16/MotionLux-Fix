import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock3, Loader2, MapPin, Save, Sunrise, Sunset } from 'lucide-react';
import SectionHeader from '../components/SectionHeader';
import { useApp } from '../context/AppContext';
import { getSunTimes } from '../utils/sun';

// Terima angka dengan koma ataupun titik desimal ("-7,9666" / "-7.9666")
const toNum = (v) => Number(String(v ?? '').trim().replace(',', '.'));
const cleanCoord = (v) => v.replace(/[^0-9.,-]/g, '');
const validLat = (n) => Number.isFinite(n) && n >= -90 && n <= 90;
const validLon = (n) => Number.isFinite(n) && n >= -180 && n <= 180;

export default function SunriseSunset() {
  const { sun, updateSun, notify } = useApp();
  const [form, setForm] = useState(null); // null = tidak ada perubahan yang belum disimpan
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState(null); // teks alamat yang diketik user (null = belum mengetik)
  const [geo, setGeo] = useState({ state: 'idle', text: '' });
  const [mapCoords, setMapCoords] = useState(null);
  const sunRef = useRef(sun);
  sunRef.current = sun;

  const value = form || sun;
  const lat = toNum(value?.latitude);
  const lon = toNum(value?.longitude);
  const coordsOk = validLat(lat) && validLon(lon);

  // Alamat diketik -> cari koordinatnya otomatis (tunggu user berhenti mengetik sebentar)
  useEffect(() => {
    if (query === null) return undefined;
    const q = query.trim();
    if (q.length < 3) { setGeo({ state: 'idle', text: '' }); return undefined; }

    const ctrl = new AbortController();
    const timer = setTimeout(async () => {
      setGeo({ state: 'searching', text: 'Mencari lokasi...' });
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`,
          { signal: ctrl.signal, headers: { 'Accept-Language': 'id' } }
        );
        if (!res.ok) throw new Error('bad response');
        const list = await res.json();
        if (!list.length) {
          setGeo({ state: 'notfound', text: 'Alamat tidak ditemukan. Coba tambahkan nama kota atau daerah.' });
          return;
        }
        setForm((prev) => ({
          ...(prev ?? sunRef.current),
          latitude: Number(list[0].lat).toFixed(6),
          longitude: Number(list[0].lon).toFixed(6)
        }));
        setGeo({ state: 'found', text: list[0].display_name });
      } catch (e) {
        if (e.name !== 'AbortError') setGeo({ state: 'error', text: 'Gagal mencari lokasi. Periksa koneksi internet.' });
      }
    }, 800);

    return () => { clearTimeout(timer); ctrl.abort(); };
  }, [query]);

  // Peta di-update setelah berhenti mengetik, supaya iframe tidak reload di tiap ketikan
  useEffect(() => {
    if (!coordsOk) return undefined;
    const t = setTimeout(() => setMapCoords({ lat, lon }), 400);
    return () => clearTimeout(t);
  }, [coordsOk, lat, lon]);

  // Jam sunrise/sunset dihitung langsung dari koordinat yang sedang tampil
  const times = useMemo(() => {
    if (coordsOk) return getSunTimes(lat, lon);
    return sun?.calculated || { sunrise: null, sunset: null };
  }, [coordsOk, lat, lon, sun]);

  if (!sun) return <div className="loading-screen">Loading location...</div>;

  const shown = mapCoords || (coordsOk ? { lat, lon } : null);
  const map = shown
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${shown.lon - 0.04}%2C${shown.lat - 0.03}%2C${shown.lon + 0.04}%2C${shown.lat + 0.03}&layer=mapnik&marker=${shown.lat}%2C${shown.lon}`
    : '';

  const dirty = form !== null;
  const update = (patch) => setForm({ ...value, ...patch });

  const save = async () => {
    if (!String(value.location_name || '').trim()) return notify('Nama lokasi tidak boleh kosong.', 'error');
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return notify('Latitude dan longitude harus berupa angka.', 'error');
    if (!coordsOk) return notify('Koordinat tidak valid (lat -90..90, lon -180..180).', 'error');
    setSaving(true);
    const ok = await updateSun({
      location_name: String(value.location_name).trim(),
      latitude: lat,
      longitude: lon,
      sunrise_enabled: true,
      sunset_enabled: true,
      // jam ikut diperbarui, supaya otomatisasi lampu memakai jam lokasi yang baru
      sunrise_time: times.sunrise,
      sunset_time: times.sunset
    });
    setSaving(false);
    if (ok) { setForm(null); setQuery(null); setGeo({ state: 'idle', text: '' }); }
  };

  return (
    <div>
      <SectionHeader title="Sunrise / Sunset" description="Gunakan lokasi dan waktu matahari untuk mengotomatisasi lampu tanpa brightness control." />

      <div className="sun-grid">
        <section className="card location-card">
          <div className="location-head">
            <div className="title-icon"><MapPin size={19} /></div>
            <div><span>Current location</span><strong>{value.location_name}</strong></div>
          </div>

          {map ? <iframe title="MotionLux location map" className="map" src={map} loading="lazy" /> : <div className="map map-empty">Koordinat belum valid</div>}

          <div className="coord-grid">
            <div><span>Latitude</span><strong>{validLat(lat) ? lat.toFixed(6) : '-'}</strong></div>
            <div><span>Longitude</span><strong>{validLon(lon) ? lon.toFixed(6) : '-'}</strong></div>
          </div>

          <div className="solar-times">
            <div><Sunrise size={20} /><span>Sunrise</span><strong>{times.sunrise || '--:--'}</strong></div>
            <div><Sunset size={20} /><span>Sunset</span><strong>{times.sunset || '--:--'}</strong></div>
          </div>
          {dirty && <p className="helper-text unsaved">Perubahan belum disimpan. Klik <strong>Save Location &amp; Rules</strong> untuk menerapkannya ke lampu.</p>}
        </section>

        <section className="card">
          <p className="eyebrow">Automation</p>
          <h3>Sunlight rules</h3>
          <p className="muted section-note">
            Waktu dihitung otomatis dari latitude dan longitude. Pada mode <strong>Sunrise / Sunset</strong>, lampu menyala saat sunset dan mati saat sunrise.
          </p>

          <div className="calculated-box">
            <Clock3 size={19} />
            <div>
              <strong>Calculated today</strong>
              <span>Sunrise {times.sunrise || '--:--'} · Sunset {times.sunset || '--:--'}</span>
            </div>
          </div>

          <label>Alamat / nama lokasi</label>
          <input
            value={value.location_name || ''}
            onChange={(e) => { update({ location_name: e.target.value }); setQuery(e.target.value); }}
            placeholder="Ketik alamat, misalnya: SMKN 8 Malang"
          />
          {geo.state !== 'idle' && (
            <p className={`geo-status ${geo.state}`}>
              {geo.state === 'searching' && <Loader2 size={16} className="spin" />}
              {geo.state === 'found' && <CheckCircle2 size={16} />}
              {(geo.state === 'notfound' || geo.state === 'error') && <AlertCircle size={16} />}
              <span>{geo.text}</span>
            </p>
          )}
          <p className="helper-text">Ketik alamat, lalu koordinat, peta, dan jam sunrise/sunset akan berubah otomatis.</p>

          <div className="two-col">
            <div>
              <label>Latitude</label>
              <input inputMode="decimal" value={value.latitude ?? ''} onChange={(e) => update({ latitude: cleanCoord(e.target.value) })} />
            </div>
            <div>
              <label>Longitude</label>
              <input inputMode="decimal" value={value.longitude ?? ''} onChange={(e) => update({ longitude: cleanCoord(e.target.value) })} />
            </div>
          </div>

          <button className="primary-btn" onClick={save} disabled={saving || !dirty}><Save size={17} />{saving ? 'Saving...' : 'Save Location & Rules'}</button>
        </section>
      </div>
    </div>
  );
}
