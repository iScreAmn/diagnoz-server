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

const toMinutes = (hour, minute) => (hour * 60) + minute;

export const validateClinicHours = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return {
      isValid: false,
      message: 'Invalid appointmentDate. Expected a valid ISO datetime string.'
    };
  }

  const { weekday, hour, minute } = getDatePartsInClinicTz(date);
  const currentMinutes = toMinutes(hour, minute);

  if (weekday === 'Sun') {
    return {
      isValid: false,
      message: 'Sunday is a day off. Appointments are not available.'
    };
  }

  if (weekday === 'Sat') {
    const isWithinSaturdayHours = currentMinutes >= toMinutes(10, 0) && currentMinutes <= toMinutes(13, 0);
    if (!isWithinSaturdayHours) {
      return {
        isValid: false,
        message: 'Saturday appointments are available only from 10:00 to 13:00.'
      };
    }
    return { isValid: true };
  }

  const isWeekday = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].includes(weekday);
  if (!isWeekday) {
    return {
      isValid: false,
      message: 'Unable to determine clinic working day for the selected date.'
    };
  }

  const isWithinWeekdayHours = currentMinutes >= toMinutes(10, 0) && currentMinutes <= toMinutes(16, 0);
  if (!isWithinWeekdayHours) {
    return {
      isValid: false,
      message: 'Weekday appointments are available only from 10:00 to 16:00.'
    };
  }

  return { isValid: true };
};
