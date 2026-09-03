export interface FiscalDay {
  key: string;
  name: string;
  shortName: string;
  index: number; // 0 = Mon, 1 = Tue, ..., 6 = Sun
}

export const FISCAL_DAYS: FiscalDay[] = [
  { key: 'M', name: 'Monday', shortName: 'Mon', index: 0 },
  { key: 'T', name: 'Tuesday', shortName: 'Tue', index: 1 },
  { key: 'W', name: 'Wednesday', shortName: 'Wed', index: 2 },
  { key: 'T', name: 'Thursday', shortName: 'Thu', index: 3 },
  { key: 'F', name: 'Friday', shortName: 'Fri', index: 4 },
  { key: 'S', name: 'Saturday', shortName: 'Sat', index: 5 },
  { key: 'S', name: 'Sunday', shortName: 'Sun', index: 6 },
];

export interface FiscalWeekInfo {
  weekNumber: number; // 1 to 5
  weekLabel: string; // 'W1', 'W2', etc.
  startDate: Date;
  endDate: Date;
  days: {
    dayOfWeek: FiscalDay;
    date: Date;
    dayNumber: number;
    monthName: string;
    isToday: boolean;
  }[];
}

export interface FiscalPeriodInfo {
  fiscalYear: number;
  fiscalQuarter: number; // 1 to 4
  fiscalMonth: number; // 1 to 12
  monthInQuarter: number; // 1, 2, or 3
  isFiveWeekMonth: boolean; // Month 3 in 4-4-5 framework has 5 weeks
  totalWeeksInPeriod: number; // 4 or 5
  currentWeekNumber: number; // 1 to 5
  currentDayIndex: number; // 0 to 6
  weeks: FiscalWeekInfo[];
  periodName: string;
}

/**
 * Calculates 4-4-5 Fiscal Framework details for a given date.
 * In a standard 4-4-5 calendar:
 * Q1: Month 1 (4 wks), Month 2 (4 wks), Month 3 (5 wks)
 * Q2: Month 4 (4 wks), Month 5 (4 wks), Month 6 (5 wks)
 * Q3: Month 7 (4 wks), Month 8 (4 wks), Month 9 (5 wks)
 * Q4: Month 10 (4 wks), Month 11 (4 wks), Month 12 (5 wks)
 */
export function getFiscalCalendar(referenceDate: Date = new Date()): FiscalPeriodInfo {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth(); // 0 to 11
  const dayOfMonth = referenceDate.getDate();

  // Determine Quarter (0-indexed month: Jan-Mar = Q1, Apr-Jun = Q2, Jul-Sep = Q3, Oct-Dec = Q4)
  const fiscalQuarter = Math.floor(month / 3) + 1;
  const monthInQuarter = (month % 3) + 1; // 1, 2, or 3
  const isFiveWeekMonth = monthInQuarter === 3;
  const totalWeeksInPeriod = isFiveWeekMonth ? 5 : 4;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const periodName = `${monthNames[month]} ${year}`;

  // Find the Monday of the first fiscal week in this month
  // We approximate the start of the month's Monday
  const firstOfMonth = new Date(year, month, 1);
  const dayOfWeekFirst = (firstOfMonth.getDay() + 6) % 7; // Convert Sun=0..Sat=6 to Mon=0..Sun=6
  
  // Start date of W1 Monday
  const startOfW1 = new Date(firstOfMonth);
  startOfW1.setDate(firstOfMonth.getDate() - dayOfWeekFirst);

  const today = new Date();
  const todayZero = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  const weeks: FiscalWeekInfo[] = [];

  for (let w = 1; w <= totalWeeksInPeriod; w++) {
    const weekStart = new Date(startOfW1);
    weekStart.setDate(startOfW1.getDate() + (w - 1) * 7);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const days = FISCAL_DAYS.map((dayDef, dIndex) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + dIndex);
      const isToday = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() === todayZero;
      return {
        dayOfWeek: dayDef,
        date,
        dayNumber: date.getDate(),
        monthName: monthNames[date.getMonth()],
        isToday,
      };
    });

    weeks.push({
      weekNumber: w,
      weekLabel: `W${w}`,
      startDate: weekStart,
      endDate: weekEnd,
      days,
    });
  }

  // Determine current active fiscal week (1 to totalWeeksInPeriod)
  const diffDays = Math.floor((referenceDate.getTime() - startOfW1.getTime()) / (1000 * 60 * 60 * 24));
  let calculatedWeek = Math.floor(diffDays / 7) + 1;
  if (calculatedWeek < 1) calculatedWeek = 1;
  if (calculatedWeek > totalWeeksInPeriod) calculatedWeek = totalWeeksInPeriod;

  // Day of week for reference date (0 = Mon, ..., 6 = Sun)
  const currentDayIndex = (referenceDate.getDay() + 6) % 7;

  return {
    fiscalYear: year,
    fiscalQuarter,
    fiscalMonth: month + 1,
    monthInQuarter,
    isFiveWeekMonth,
    totalWeeksInPeriod,
    currentWeekNumber: calculatedWeek,
    currentDayIndex,
    weeks,
    periodName,
  };
}
