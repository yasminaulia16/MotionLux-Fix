export function normalizeTime(value){ return String(value).slice(0,5); }
export function validateScheduleConflict(items, candidate, ignoreId=null){
  if(candidate.on_time===candidate.off_time) return 'Waktu nyala dan mati tidak boleh sama.';
  const active = items.filter(x=>x.is_active && x.lamp_id===candidate.lamp_id && String(x.id)!==String(ignoreId));
  const times = [candidate.on_time,candidate.off_time];
  if(active.some(x=>times.includes(normalizeTime(x.on_time)) || times.includes(normalizeTime(x.off_time)))) return 'Jam tersebut sudah digunakan oleh jadwal lampu yang sama.';
  return null;
}
