const bookedDatesByDoctor = new Map();
const pendingDatesByDoctor = new Map();

const normalizeDoctorKey = (doctor) => String(doctor || '').trim().toLowerCase();

const ensureDoctorSet = (storage, doctorKey) => {
  if (!storage.has(doctorKey)) {
    storage.set(doctorKey, new Set());
  }
  return storage.get(doctorKey);
};

const isIsoDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidCalendarDate = (value) => {
  if (!isIsoDate(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const dt = new Date(Date.UTC(year, month - 1, day));
  return (
    dt.getUTCFullYear() === year &&
    dt.getUTCMonth() === month - 1 &&
    dt.getUTCDate() === day
  );
};

const sanitizeDate = (value) => String(value || '').trim();

export const normalizeAppointmentDate = (value) => {
  const raw = sanitizeDate(value);
  if (!raw) return '';

  if (isValidCalendarDate(raw)) return raw;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return '';
  const year = parsed.getUTCFullYear();
  const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
  const day = String(parsed.getUTCDate()).padStart(2, '0');
  const normalized = `${year}-${month}-${day}`;
  return isValidCalendarDate(normalized) ? normalized : '';
};

const toDateKey = (date) => normalizeAppointmentDate(date);

const getUnavailableSet = (doctor) => {
  const doctorKey = normalizeDoctorKey(doctor);
  const booked = bookedDatesByDoctor.get(doctorKey) || new Set();
  const pending = pendingDatesByDoctor.get(doctorKey) || new Set();
  return new Set([...booked, ...pending]);
};

export const isDateUnavailable = (doctor, date) => {
  const dateKey = toDateKey(date);
  if (!dateKey) return false;
  return getUnavailableSet(doctor).has(dateKey);
};

export const reserveDate = (doctor, date) => {
  const doctorKey = normalizeDoctorKey(doctor);
  const dateKey = toDateKey(date);
  if (!doctorKey || !dateKey) return false;

  if (isDateUnavailable(doctorKey, dateKey)) {
    return false;
  }

  const pending = ensureDoctorSet(pendingDatesByDoctor, doctorKey);
  pending.add(dateKey);
  return true;
};

export const confirmDate = (doctor, date) => {
  const doctorKey = normalizeDoctorKey(doctor);
  const dateKey = toDateKey(date);
  if (!doctorKey || !dateKey) return;

  const pending = ensureDoctorSet(pendingDatesByDoctor, doctorKey);
  pending.delete(dateKey);

  const booked = ensureDoctorSet(bookedDatesByDoctor, doctorKey);
  booked.add(dateKey);
};

export const releaseDate = (doctor, date) => {
  const doctorKey = normalizeDoctorKey(doctor);
  const dateKey = toDateKey(date);
  if (!doctorKey || !dateKey) return;

  const pending = ensureDoctorSet(pendingDatesByDoctor, doctorKey);
  pending.delete(dateKey);
};

export const unbookDate = (doctor, date) => {
  const doctorKey = normalizeDoctorKey(doctor);
  const dateKey = toDateKey(date);
  if (!doctorKey || !dateKey) return;

  const pending = ensureDoctorSet(pendingDatesByDoctor, doctorKey);
  pending.delete(dateKey);

  const booked = ensureDoctorSet(bookedDatesByDoctor, doctorKey);
  booked.delete(dateKey);
};

const inRange = (date, from, to) => {
  if (from && date < from) return false;
  if (to && date > to) return false;
  return true;
};

export const getUnavailableDates = (doctor, from, to) => {
  const fromKey = from ? toDateKey(from) : '';
  const toKey = to ? toDateKey(to) : '';

  return [...getUnavailableSet(doctor)]
    .filter((date) => inRange(date, fromKey, toKey))
    .sort();
};
