import React from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Compass } from 'lucide-react';
import { FISCAL_DAYS, FiscalPeriodInfo } from '../lib/fiscalCalendar';

interface FiscalCalendarBarProps {
  fiscalInfo: FiscalPeriodInfo;
  selectedWeek: number; // 1 to 5
  selectedDayIndex: number; // 0 to 6
  onSelectWeek: (weekNumber: number) => void;
  onSelectDay: (dayIndex: number) => void;
  activeTimeBlock: 'morning' | 'evening' | 'monthly';
}

export const FiscalCalendarBar: React.FC<FiscalCalendarBarProps> = ({
  fiscalInfo,
  selectedWeek,
  selectedDayIndex,
  onSelectWeek,
  onSelectDay,
  activeTimeBlock,
}) => {
  const currentWeekObj = fiscalInfo.weeks.find((w) => w.weekNumber === selectedWeek) || fiscalInfo.weeks[0];

  return (
    <header
      id="fiscal-calendar-engine-header"
      className="sticky top-0 z-30 bg-[#FDFBF7]/95 dark:bg-[#07151e]/95 backdrop-blur-md border-b border-[#F0EBE0] dark:border-[#284c5e] shadow-xs"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Upper context bar: Fiscal Framework info + 4-4-5 badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-[#1A3C40] dark:text-[#A8DADC] tracking-wide">
              <CalendarIcon className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-teal-400" />
              <span>4-4-5 Fiscal Framework</span>
            </span>
            <span className="text-slate-300 dark:text-slate-600">•</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              FY{fiscalInfo.fiscalYear.toString().slice(-2)} Q{fiscalInfo.fiscalQuarter} (
              {fiscalInfo.isFiveWeekMonth ? '5-Week Month' : '4-Week Month'})
            </span>
            <span className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest rounded-full bg-[#EBF7F8] dark:bg-teal-950/60 text-[#2D6A4F] dark:text-teal-300 border border-[#A8DADC]/40">
              {fiscalInfo.periodName}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
            <Compass className="w-3 h-3 text-[#2D6A4F]" />
            <span className="font-medium text-[#1A3C40] dark:text-slate-200 capitalize">
              {activeTimeBlock} Rhythm
            </span>
          </div>
        </div>

        {/* Continuous Horizontal Axis: Fiscal Weeks (W1..W5) + Days (M-T-W-T-F-S-S) */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-[#142831] p-2.5 sm:p-3 rounded-2xl border border-[#F0EBE0] dark:border-[#284c5e]">
          {/* Fiscal Week horizontal buttons (W1, W2, W3, W4, W5) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 pl-1 pr-1.5 shrink-0">
              Fiscal Week:
            </span>
            {fiscalInfo.weeks.map((week) => {
              const isSelected = selectedWeek === week.weekNumber;
              const isCurrent = fiscalInfo.currentWeekNumber === week.weekNumber;
              return (
                <button
                  key={week.weekLabel}
                  id={`fiscal-week-btn-${week.weekNumber}`}
                  type="button"
                  onClick={() => onSelectWeek(week.weekNumber)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition flex items-center gap-1.5 shrink-0 ${
                    isSelected
                      ? 'bg-[#2D6A4F] text-white shadow-xs font-bold'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#EBF7F8] hover:text-[#2D6A4F]'
                  }`}
                >
                  <span>{week.weekLabel}</span>
                  {isCurrent && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        isSelected ? 'bg-white animate-pulse' : 'bg-[#2D6A4F]'
                      }`}
                      title="Current Fiscal Week"
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Days of the Week Axis: M - T - W - T - F - S - S */}
          <div className="flex items-center justify-between sm:justify-end gap-1 sm:gap-2 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 dark:border-slate-800 overflow-x-auto">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 pr-1 shrink-0 hidden sm:inline">
              Days:
            </span>
            <div className="flex items-center gap-1 sm:gap-1.5 w-full sm:w-auto justify-between">
              {currentWeekObj.days.map((d) => {
                const isSelected = selectedDayIndex === d.dayOfWeek.index;
                const isToday = d.isToday;

                return (
                  <button
                    key={d.dayOfWeek.index}
                    id={`fiscal-day-btn-${d.dayOfWeek.index}`}
                    type="button"
                    onClick={() => onSelectDay(d.dayOfWeek.index)}
                    className={`flex flex-col items-center justify-center min-w-[36px] sm:min-w-[42px] py-1 px-1.5 rounded-xl transition ${
                      isSelected
                        ? 'bg-[#1A3C40] dark:bg-teal-900 text-white shadow-xs'
                        : isToday
                        ? 'bg-[#EBF7F8] dark:bg-teal-950/50 text-[#2D6A4F] dark:text-teal-300 border border-[#A8DADC]/60'
                        : 'bg-slate-50/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
                    }`}
                  >
                    {/* Day Key: M - T - W - T - F - S - S */}
                    <span className="text-[11px] font-bold tracking-wider uppercase leading-none font-mono">
                      {d.dayOfWeek.key}
                    </span>
                    {/* Date Number */}
                    <span className="text-[10px] font-medium opacity-80 mt-0.5 leading-none">
                      {d.dayNumber}
                    </span>
                    {isToday && (
                      <span className="w-1 h-1 rounded-full bg-[#2D6A4F] dark:bg-teal-300 mt-0.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
