import React, { useState } from 'react';
import { Calendar, Clock, Plus, Sparkles, User, Repeat, Sun } from 'lucide-react';
import type { Chore, RoomLocation, TaskOwner, TaskStatus, ProfileName } from '../types';
import { ROOM_LOCATIONS } from '../types';
import { FiscalPeriodInfo, FISCAL_DAYS } from '../lib/fiscalCalendar';
import { updateChoreStatus } from '../lib/firebase';
import { CompletionBubble } from './CompletionBubble';

interface MonthlyFiscalGridViewProps {
  fiscalInfo: FiscalPeriodInfo;
  chores: Chore[];
  householdId: string;
  currentProfile: ProfileName;
  selectedWeek: number;
  onSelectWeek: (w: number) => void;
  onOpenAddModal: (room?: RoomLocation, fiscalWeek?: number, dayOfWeek?: number) => void;
}

export const MonthlyFiscalGridView: React.FC<MonthlyFiscalGridViewProps> = ({
  fiscalInfo,
  chores,
  householdId,
  currentProfile,
  selectedWeek,
  onSelectWeek,
  onOpenAddModal,
}) => {
  const [activeCell, setActiveCell] = useState<{ weekNumber: number; dayIndex: number } | null>(null);

  const monthlyChores = chores.filter((c) => c.timeBlock === 'monthly' || c.frequency === 'monthly_flex');

  const handleToggleStatus = async (chore: Chore) => {
    const nextStatus: TaskStatus = chore.status === 'done' ? 'todo' : 'done';
    const executor = nextStatus === 'done' ? (currentProfile.toLowerCase() as TaskOwner) : null;
    try {
      await updateChoreStatus(householdId, chore.id, nextStatus, executor);
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const getOwnerDot = (owner: TaskOwner) => {
    switch (owner) {
      case 'steve':
        return 'bg-[#2D6A4F]';
      case 'nicole':
        return 'bg-[#FFB3C1]';
      case 'shared':
      default:
        return 'bg-[#D2B48C]';
    }
  };

  // Group monthly chores by room for the room-based breakdown
  const choresByRoom: Record<RoomLocation, Chore[]> = ROOM_LOCATIONS.reduce(
    (acc, room) => {
      acc[room] = monthlyChores.filter((c) => c.room === room);
      return acc;
    },
    {} as Record<RoomLocation, Chore[]>
  );

  return (
    <div id="monthly-fiscal-grid-view" className="space-y-8">
      {/* 4-4-5 Fiscal Framework Header & Description */}
      <div className="bg-white dark:bg-[#142831] p-6 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#F0EBE0] dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-light text-[#1A3C40] dark:text-slate-100 font-display">
                4-4-5 Fiscal Cadence Grid
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF7F8] dark:bg-teal-950 text-[#2D6A4F] dark:text-teal-300 text-xs font-mono font-medium border border-[#A8DADC]/40">
                {fiscalInfo.isFiveWeekMonth ? '5-Week Cycle' : '4-Week Cycle'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Accounting-aligned 4-4-5 period overview ({fiscalInfo.periodName}). Long-cycle room maintenance rhythms synchronized across Steve & Nicole.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onOpenAddModal(undefined, selectedWeek)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] text-white text-xs font-medium transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Monthly Chore</span>
          </button>
        </div>

        {/* 4-4-5 Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[620px]">
            <thead>
              <tr className="border-b border-[#F0EBE0] dark:border-slate-800">
                <th className="py-2.5 px-3 text-[11px] font-mono uppercase font-bold text-slate-400 w-24">
                  Fiscal Wk
                </th>
                {FISCAL_DAYS.map((day, idx) => (
                  <th
                    key={idx}
                    className="py-2.5 px-2 text-center text-xs font-mono font-bold text-[#1A3C40] dark:text-slate-300"
                  >
                    <span className="text-[#2D6A4F] dark:text-teal-300">{day.key}</span>
                    <span className="block text-[10px] text-slate-400 font-normal">
                      {day.shortName}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0EBE0] dark:divide-slate-800">
              {fiscalInfo.weeks.map((week) => {
                const isSelected = selectedWeek === week.weekNumber;
                const isCurrent = fiscalInfo.currentWeekNumber === week.weekNumber;

                // Chores belonging to this fiscal week
                const weekChores = monthlyChores.filter(
                  (c) => c.fiscalWeek === week.weekNumber
                );

                return (
                  <tr
                    key={week.weekNumber}
                    className={`transition ${
                      isSelected
                        ? 'bg-[#EBF7F8]/40 dark:bg-teal-950/20'
                        : 'hover:bg-slate-50/70 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    {/* Week Label */}
                    <td className="py-3 px-3">
                      <button
                        type="button"
                        onClick={() => onSelectWeek(week.weekNumber)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold transition ${
                          isSelected
                            ? 'bg-[#2D6A4F] text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{week.weekLabel}</span>
                        {isCurrent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </button>
                      <span className="block text-[10px] text-slate-400 mt-1 font-mono">
                        {weekChores.length} task{weekChores.length !== 1 ? 's' : ''}
                      </span>
                    </td>

                    {/* Day Cells (M - T - W - T - F - S - S) */}
                    {week.days.map((dayItem) => {
                      const dayChores = weekChores.filter(
                        (c) => c.dayOfWeek === dayItem.dayOfWeek.index
                      );

                      const isDayToday = dayItem.isToday;

                      return (
                        <td
                          key={dayItem.dayOfWeek.index}
                          onClick={() => {
                            setActiveCell({
                              weekNumber: week.weekNumber,
                              dayIndex: dayItem.dayOfWeek.index,
                            });
                          }}
                          className={`py-2 px-2 text-center align-top cursor-pointer transition ${
                            isDayToday ? 'bg-amber-500/5' : ''
                          }`}
                        >
                          <div
                            className={`min-h-[56px] rounded-xl p-1 border transition flex flex-col justify-between ${
                              dayChores.length > 0
                                ? 'bg-white dark:bg-slate-800/80 border-[#A8DADC]/40 shadow-xs'
                                : 'border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                            }`}
                          >
                            <span
                              className={`text-[10px] font-mono self-end pr-1 ${
                                isDayToday
                                  ? 'font-bold text-[#2D6A4F] dark:text-teal-300'
                                  : 'text-slate-400'
                              }`}
                            >
                              {dayItem.dayNumber}
                            </span>

                            {/* Task indicators */}
                            <div className="flex flex-wrap gap-1 justify-center my-1">
                              {dayChores.map((ch) => (
                                <span
                                  key={ch.id}
                                  className={`w-2 h-2 rounded-full ${getOwnerDot(ch.owner)}`}
                                  title={`${ch.title} (${ch.room})`}
                                />
                              ))}
                            </div>

                            {dayChores.length > 0 ? (
                              <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium truncate px-1">
                                {dayChores.length} chore{dayChores.length > 1 ? 's' : ''}
                              </span>
                            ) : (
                              <span className="text-[9px] text-slate-300 dark:text-slate-700">
                                —
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Room-Based Clustering for Monthly Block */}
      <div className="bg-white dark:bg-[#142831] p-6 sm:p-8 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#F0EBE0] dark:border-slate-800">
          <div>
            <h3 className="text-xl font-light text-[#1A3C40] dark:text-slate-100 font-display">
              Room-Clustered Monthly Cadence
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Deep maintenance grouped strictly by room location
            </p>
          </div>
          <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-[#EBF7F8] text-[#2D6A4F] dark:bg-teal-950 dark:text-teal-300">
            {monthlyChores.length} Total Monthly Chores
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ROOM_LOCATIONS.map((room) => {
            const roomChores = choresByRoom[room] || [];
            const completedCount = roomChores.filter((c) => c.status === 'done').length;

            return (
              <div
                key={room}
                className="p-5 rounded-3xl bg-[#FDFBF7] dark:bg-slate-900/40 border border-[#F0EBE0] dark:border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#F0EBE0] dark:border-slate-800">
                    <h4 className="font-medium text-sm text-[#1A3C40] dark:text-slate-200">
                      {room}
                    </h4>
                    <span className="text-[11px] font-mono text-slate-400">
                      {completedCount}/{roomChores.length} Done
                    </span>
                  </div>

                  {roomChores.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-2">
                      No monthly deep tasks for {room}.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {roomChores.map((chore) => {
                        const isDone = chore.status === 'done';
                        return (
                          <div
                            key={chore.id}
                            className={`flex items-center justify-between gap-3 text-xs p-2.5 rounded-xl border transition ${
                              isDone
                                ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200/60 dark:border-slate-800 opacity-75'
                                : 'bg-white dark:bg-[#142831] border-[#F0EBE0] dark:border-[#284c5e]'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              {/* Completion Bubble */}
                              <CompletionBubble
                                owner={chore.owner}
                                status={chore.status}
                                completedBy={chore.completedBy}
                                onToggle={() => handleToggleStatus(chore)}
                                size="sm"
                              />
                              <div className="flex flex-col min-w-0">
                                <span
                                  className={`truncate font-medium ${
                                    isDone ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-200'
                                  }`}
                                >
                                  {chore.title}
                                </span>
                                {chore.description && (
                                  <span className="text-[10px] text-slate-400 truncate">
                                    {chore.description}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isDone && chore.completedBy && (
                                <span className="text-[9px] font-mono text-slate-400 px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800">
                                  by {chore.completedBy}
                                </span>
                              )}
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                W{chore.fiscalWeek || 1}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-2 text-right">
                  <button
                    type="button"
                    onClick={() => onOpenAddModal(room)}
                    className="text-[11px] text-[#2D6A4F] dark:text-teal-300 font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add to {room}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
