import { DAYS, toMinutes } from '../../schedule/scheduleConstants.js';
import { getRangesForDoctor } from '../../schedule/services/scheduleService.js';

const CLINIC_TIMEZONE = 'Asia/Tbilisi';

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

export const validateDoctorWorkingDay = async (doctorName, date) => {
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

  const schedule = await getRangesForDoctor(doctorName);
  const rangesForDay = schedule.filter((range) => range.days.includes(day));
  if (!rangesForDay.length) {
    return {
      isValid: false,
      message: 'Selected doctor does not work on this day.'
    };
  }

  return { isValid: true };
};

export const validateDoctorWorkingHours = async (doctorName, date) => {
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

  const dayValidation = await validateDoctorWorkingDay(doctorName, date);
  if (!dayValidation.isValid) return dayValidation;

  const schedule = await getRangesForDoctor(doctorName);
  const rangesForDay = schedule.filter((range) => range.days.includes(day));

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
