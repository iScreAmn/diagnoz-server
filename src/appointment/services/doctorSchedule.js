const CLINIC_TIMEZONE = 'Asia/Tbilisi';

const DAYS = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6
};

const DEFAULT_SCHEDULE = [
  { days: [DAYS.Mon, DAYS.Tue, DAYS.Wed, DAYS.Thu, DAYS.Fri], start: '10:00', end: '16:00' },
  { days: [DAYS.Sat], start: '10:00', end: '13:00' }
];

const DOCTOR_SCHEDULES = {
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
  ]
};

const DOCTOR_ALIASES = {
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
  natela_bzhania: ['bzhan', 'бжан', 'ბჟან'],
  tamar_zenadze: ['zenadz', 'зенадз', 'ზენაძ'],
  olga_uryukina: ['uryukin', 'urjukin', 'урюкин', 'ურიუკინ']
};

const normalizeDoctorName = (value) =>
  String(value || '')
    .toLowerCase()
    .replace(/[.\-_,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const toMinutes = (time) => {
  const [hour, minute] = String(time || '').split(':').map(Number);
  if (Number.isNaN(hour) || Number.isNaN(minute)) return NaN;
  return (hour * 60) + minute;
};

const resolveDoctorScheduleKey = (doctorName) => {
  const normalized = normalizeDoctorName(doctorName);
  if (!normalized) return '';

  for (const [doctorKey, aliases] of Object.entries(DOCTOR_ALIASES)) {
    if (aliases.some((alias) => normalized.includes(alias))) {
      return doctorKey;
    }
  }

  return '';
};

const getScheduleForDoctor = (doctorName) => {
  const scheduleKey = resolveDoctorScheduleKey(doctorName);
  return DOCTOR_SCHEDULES[scheduleKey] || DEFAULT_SCHEDULE;
};

const getDatePartsInClinicTz = (date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: CLINIC_TIMEZONE,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).formatToParts(date);

  const weekday = parts.find((part) => part.type === 'weekday')?.value || '';
  const hour = Number(parts.find((part) => part.type === 'hour')?.value || NaN);
  const minute = Number(parts.find((part) => part.type === 'minute')?.value || NaN);

  return { weekday, hour, minute };
};

export const validateDoctorWorkingDay = (doctorName, date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return {
      isValid: false,
      message: 'Invalid appointmentDate. Expected a valid date.'
    };
  }

  const { weekday } = getDatePartsInClinicTz(date);
  const day = DAYS[weekday];
  if (day === DAYS.Sun) {
    return {
      isValid: false,
      message: 'Sunday is a day off. Appointments are not available.'
    };
  }

  if (typeof day !== 'number') {
    return {
      isValid: false,
      message: 'Unable to determine clinic working day for the selected date.'
    };
  }

  const rangesForDay = getScheduleForDoctor(doctorName).filter((range) => range.days.includes(day));
  if (!rangesForDay.length) {
    return {
      isValid: false,
      message: 'Selected doctor does not work on this day.'
    };
  }

  return { isValid: true };
};

export const validateDoctorWorkingHours = (doctorName, date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return {
      isValid: false,
      message: 'Invalid appointmentDate. Expected a valid ISO datetime string.'
    };
  }

  const { weekday, hour, minute } = getDatePartsInClinicTz(date);
  const day = DAYS[weekday];
  const currentMinutes = (hour * 60) + minute;

  if (day === DAYS.Sun) {
    return {
      isValid: false,
      message: 'Sunday is a day off. Appointments are not available.'
    };
  }

  if (typeof day !== 'number') {
    return {
      isValid: false,
      message: 'Unable to determine clinic working day for the selected date.'
    };
  }

  const dayValidation = validateDoctorWorkingDay(doctorName, date);
  if (!dayValidation.isValid) return dayValidation;

  const rangesForDay = getScheduleForDoctor(doctorName).filter((range) => range.days.includes(day));

  const isInsideRange = rangesForDay.some((range) => {
    const start = toMinutes(range.start);
    const end = toMinutes(range.end);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) return false;
    return currentMinutes >= start && currentMinutes <= end;
  });

  if (!isInsideRange) {
    return {
      isValid: false,
      message: 'Selected time is outside doctor working hours.'
    };
  }

  return { isValid: true };
};

