/**
 * Shared schedule constants + helpers (server side).
 *
 * The canonical schedule data lives in MongoDB (collection `doctor_schedules`).
 * The values below are used only:
 *   1. to seed the collection the first time the server connects to an empty DB,
 *   2. as a safe fallback when a doctor has no stored schedule yet.
 *
 * A doctor is identified by a stable `doctorKey`. Incoming booking requests carry
 * a (possibly localized) display name, which is matched to a key via DOCTOR_ALIASES.
 */

export const DAYS = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

export const WORKING_DAYS = [DAYS.Mon, DAYS.Tue, DAYS.Wed, DAYS.Thu, DAYS.Fri, DAYS.Sat];

export const DEFAULT_SCHEDULE = [
  { days: [DAYS.Mon, DAYS.Tue, DAYS.Wed, DAYS.Thu, DAYS.Fri], start: '10:00', end: '16:00' },
  { days: [DAYS.Sat], start: '10:00', end: '13:00' }
];

/** Initial schedules used to seed the collection on first boot. */
export const SEED_DOCTOR_SCHEDULES = {
  nina_avaliashvili: [
    { days: [DAYS.Mon, DAYS.Tue, DAYS.Wed, DAYS.Thu, DAYS.Fri, DAYS.Sat], start: '10:00', end: '16:00' }
  ],
  karina_frangulyan: [
    { days: [DAYS.Mon, DAYS.Tue, DAYS.Wed, DAYS.Thu, DAYS.Fri, DAYS.Sat], start: '10:00', end: '16:00' }
  ],
  nona_unikyan: [
    { days: [DAYS.Tue, DAYS.Wed, DAYS.Thu], start: '10:00', end: '16:00' },
    { days: [DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  irina_hovanskaya: [
    { days: [DAYS.Tue, DAYS.Wed, DAYS.Thu], start: '10:00', end: '16:00' },
    { days: [DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  maka_gordeziani: [
    { days: [DAYS.Mon, DAYS.Tue, DAYS.Wed, DAYS.Thu, DAYS.Fri], start: '10:00', end: '12:30' },
    { days: [DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  sergo_jajani: [
    { days: [DAYS.Wed], start: '14:00', end: '16:00' }
  ],
  marina_chilashvili: [
    { days: [DAYS.Tue], start: '10:00', end: '16:00' }
  ],
  tinatin_nozadze: [
    { days: [DAYS.Mon, DAYS.Tue, DAYS.Wed, DAYS.Thu], start: '10:00', end: '16:00' }
  ],
  raya_medulashvili: [
    { days: [DAYS.Fri], start: '10:00', end: '16:00' },
    { days: [DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  inga_bokuchava: [
    { days: [DAYS.Thu], start: '10:00', end: '16:00' },
    { days: [DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  nadezhda_prigorovskaya: [
    { days: [DAYS.Mon], start: '14:30', end: '16:00' },
    { days: [DAYS.Wed, DAYS.Thu, DAYS.Fri, DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  natela_bzhania: [
    { days: [DAYS.Mon, DAYS.Tue, DAYS.Thu, DAYS.Fri], start: '10:00', end: '16:00' }
  ],
  tamar_zenadze: [
    { days: [DAYS.Wed], start: '10:00', end: '16:00' },
    { days: [DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  olga_uryukina: [
    { days: [DAYS.Mon, DAYS.Wed, DAYS.Fri], start: '10:00', end: '16:00' },
    { days: [DAYS.Sat], start: '10:00', end: '13:00' }
  ],
  // Doctors previously falling back to DEFAULT — seeded explicitly so they
  // are manageable from the admin panel without code changes.
  georgij_uturgauri: DEFAULT_SCHEDULE,
  erast_lobzhanidze: DEFAULT_SCHEDULE,
  badri_tsutskiridze: DEFAULT_SCHEDULE,
  manana_shengelia: DEFAULT_SCHEDULE,
  levan_japaridze: DEFAULT_SCHEDULE
};

export const DOCTOR_ALIASES = {
  nina_avaliashvili: ['avaliash', 'avalish', 'авали', 'ავალია'],
  karina_frangulyan: ['franguly', 'франгул', 'ფრანგული'],
  nona_unikyan: ['uniky', 'уник', 'უნიკ'],
  irina_hovanskaya: ['hovansk', 'khovansk', 'хованск', 'ხოვანსკ'],
  maka_gordeziani: ['gordez', 'гордез', 'გორდეზ'],
  sergo_jajani: ['jajani', 'джаиан', 'ჯაიან'],
  marina_chilashvili: ['chilash', 'чилаш', 'ჭილაშ'],
  tinatin_nozadze: ['nozad', 'нозад', 'ნოზაძ'],
  raya_medulashvili: ['medulash', 'медулаш', 'მედულაშ'],
  inga_bokuchava: ['bokuch', 'бокуч', 'ბოკუჩ'],
  nadezhda_prigorovskaya: ['prigorov', 'пригоров', 'პრიგორ'],
  natela_bzhania: ['bzhania', 'бжания', 'ბჟანია'],
  tamar_zenadze: ['zenadz', 'зенадз', 'ზენაძ'],
  olga_uryukina: ['uryukin', 'urjukin', 'урюкин', 'ურიუკინ'],
  georgij_uturgauri: ['uturg', 'утург', 'უტურ'],
  erast_lobzhanidze: ['lobzhanidz', 'lobjanidz', 'лобжанидз', 'ლობჟანიძ'],
  badri_tsutskiridze: ['tsutskirid', 'цуцкирид', 'წუწკირიძ'],
  manana_shengelia: ['shengeli', 'шенгели', 'შენგელ'],
  levan_japaridze: ['japaridz', 'джапаридз', 'ჯაფარიძ']
};

export const normalizeDoctorName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[.\-_,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const resolveDoctorScheduleKey = (doctorName) => {
  const normalized = normalizeDoctorName(doctorName);
  if (!normalized) return '';

  for (const [doctorKey, aliases] of Object.entries(DOCTOR_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return doctorKey;
    }
  }

  return '';
};

export const toMinutes = (time) => {
  const [hour, minute] = String(time || '').split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return (hour * 60) + minute;
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/**
 * Validates + normalizes a raw schedule (array of working ranges).
 * Returns { valid, message, ranges }.
 */
export const validateScheduleRanges = (rawRanges) => {
  if (!Array.isArray(rawRanges)) {
    return { valid: false, message: 'Schedule must be an array of ranges.' };
  }

  const ranges = [];
  for (let i = 0; i < rawRanges.length; i += 1) {
    const range = rawRanges[i];
    if (!range || typeof range !== 'object') {
      return { valid: false, message: `Range #${i + 1} is invalid.` };
    }

    const days = Array.isArray(range.days) ? [...new Set(range.days.map(Number))] : null;
    if (!days || !days.length) {
      return { valid: false, message: `Range #${i + 1}: select at least one working day.` };
    }
    if (days.some((d) => !Number.isInteger(d) || d < DAYS.Mon || d > DAYS.Sat)) {
      return { valid: false, message: `Range #${i + 1}: days must be between Monday and Saturday.` };
    }

    const start = String(range.start || '').trim();
    const end = String(range.end || '').trim();
    if (!TIME_RE.test(start) || !TIME_RE.test(end)) {
      return { valid: false, message: `Range #${i + 1}: time must be in HH:MM format.` };
    }
    if (toMinutes(start) >= toMinutes(end)) {
      return { valid: false, message: `Range #${i + 1}: start time must be earlier than end time.` };
    }

    ranges.push({ days: days.sort((a, b) => a - b), start, end });
  }

  return { valid: true, ranges };
};
