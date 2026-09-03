import React, { useState, useEffect } from 'react';
import { X, Check, Plus, AlertCircle, Calendar, Repeat, Sun, Clock } from 'lucide-react';
import type { TaskOwner, ProfileName, TimeBlock, RoomLocation, TaskFrequency } from '../types';
import { ROOM_LOCATIONS } from '../types';
import { addChore } from '../lib/firebase';

const DAYS_OF_WEEK = [
  { day: 'Monday', short: 'Mon', index: 0 },
  { day: 'Tuesday', short: 'Tue', index: 1 },
  { day: 'Wednesday', short: 'Wed', index: 2 },
  { day: 'Thursday', short: 'Thu', index: 3 },
  { day: 'Friday', short: 'Fri', index: 4 },
  { day: 'Saturday', short: 'Sat', index: 5 },
  { day: 'Sunday', short: 'Sun', index: 6 },
];

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  householdId: string;
  defaultOwner: ProfileName;
  initialRoom?: RoomLocation;
  initialTimeBlock?: TimeBlock;
  initialFiscalWeek?: number;
  initialDayOfWeek?: number;
  onChoreAdded?: () => void;
}

export const AddChoreModal: React.FC<AddChoreModalProps> = ({
  isOpen,
  onClose,
  householdId,
  defaultOwner,
  initialRoom,
  initialTimeBlock,
  initialFiscalWeek,
  initialDayOfWeek,
  onChoreAdded,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [owner, setOwner] = useState<TaskOwner>(
    defaultOwner.toLowerCase() as TaskOwner
  );
  const [frequency, setFrequency] = useState<TaskFrequency>(
    initialTimeBlock === 'monthly' ? 'monthly_flex' : 'daily'
  );
  const [timeBlock, setTimeBlock] = useState<TimeBlock>(initialTimeBlock || 'morning');
  const [room, setRoom] = useState<RoomLocation>(initialRoom || 'Kitchen');
  const [specificDay, setSpecificDay] = useState<string>('Tuesday');
  const [fiscalWeek, setFiscalWeek] = useState<number>(initialFiscalWeek || 1);
  const [dayOfWeek, setDayOfWeek] = useState<number>(initialDayOfWeek !== undefined ? initialDayOfWeek : 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialRoom) setRoom(initialRoom);
    if (initialTimeBlock) {
      setTimeBlock(initialTimeBlock);
      if (initialTimeBlock === 'monthly') {
        setFrequency('monthly_flex');
      }
    }
    if (initialFiscalWeek) setFiscalWeek(initialFiscalWeek);
    if (initialDayOfWeek !== undefined) {
      setDayOfWeek(initialDayOfWeek);
      const matchDay = DAYS_OF_WEEK.find(d => d.index === initialDayOfWeek);
      if (matchDay) setSpecificDay(matchDay.day);
    }
  }, [initialRoom, initialTimeBlock, initialFiscalWeek, initialDayOfWeek, isOpen]);

  if (!isOpen) return null;

  const handleFrequencyChange = (freq: TaskFrequency) => {
    setFrequency(freq);
    if (freq === 'monthly_flex') {
      setTimeBlock('monthly');
    } else if (timeBlock === 'monthly') {
      setTimeBlock('morning');
    }
  };

  const handleSpecificDaySelect = (dayName: string, index: number) => {
    setSpecificDay(dayName);
    setDayOfWeek(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a task title.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await addChore(householdId, {
        title: title.trim(),
        description: description.trim() || undefined,
        owner,
        timeBlock,
        room,
        frequency,
        specificDay: frequency === 'specific_day' ? specificDay : undefined,
        fiscalWeek,
        dayOfWeek: frequency === 'specific_day' ? dayOfWeek : 3,
        status: 'todo',
        points: 10,
        quadrant: 'not_urgent_important',
      });
      setTitle('');
      setDescription('');
      onChoreAdded?.();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to add chore.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        id="add-chore-modal"
        className="bg-white dark:bg-[#142831] border border-[#F0EBE0] dark:border-[#284c5e] rounded-3xl w-full max-w-lg shadow-xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Modal Header */}
        <div className="bg-[#FDFBF7] dark:bg-[#0e1d24] border-b border-[#F0EBE0] dark:border-[#284c5e] p-5 sm:p-6 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-light font-display text-[#1A3C40] dark:text-slate-100">
              New Household Chore
            </h2>
            <p className="text-xs uppercase tracking-widest text-[#2D6A4F] dark:text-teal-400 font-semibold mt-0.5">
              Task Engine & Household Ledger
            </p>
          </div>
          <button
            id="close-add-chore-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Chore / Task Title *
            </label>
            <input
              id="input-chore-title"
              type="text"
              required
              placeholder="e.g. Clean Cat Bowls, Run Lomi, Read SW, Finance Check in"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-[#FDFBF7] dark:bg-slate-900 border border-[#F0EBE0] dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Notes / Subtext (Optional)
            </label>
            <input
              id="input-chore-desc"
              type="text"
              placeholder="e.g. For Milo and Louis, or Star Wars literature"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 text-xs bg-[#FDFBF7] dark:bg-slate-900 border border-[#F0EBE0] dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
            />
          </div>

          {/* FREQUENCY ENGINE SELECTOR (Daily, Specific Day, Monthly/Flex) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5 flex items-center justify-between">
              <span>Recurring Frequency Engine *</span>
              <span className="text-[10px] font-mono text-[#2D6A4F] lowercase">3 Recurring Types</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleFrequencyChange('daily')}
                className={`py-2 px-2 rounded-2xl border text-xs font-medium transition text-center flex flex-col items-center justify-center gap-1 ${
                  frequency === 'daily'
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] shadow-xs'
                    : 'bg-[#FDFBF7] dark:bg-slate-800 border-[#F0EBE0] text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span className="font-semibold">Daily Routine</span>
                <span className="text-[10px] opacity-80">e.g. Bed, Cat Bowls</span>
              </button>
              <button
                type="button"
                onClick={() => handleFrequencyChange('specific_day')}
                className={`py-2 px-2 rounded-2xl border text-xs font-medium transition text-center flex flex-col items-center justify-center gap-1 ${
                  frequency === 'specific_day'
                    ? 'bg-[#1A3C40] text-white border-[#1A3C40] shadow-xs'
                    : 'bg-[#FDFBF7] dark:bg-slate-800 border-[#F0EBE0] text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Repeat className="w-3.5 h-3.5" />
                <span className="font-semibold">Specific Day</span>
                <span className="text-[10px] opacity-80">e.g. Run/Dump Lomi</span>
              </button>
              <button
                type="button"
                onClick={() => handleFrequencyChange('monthly_flex')}
                className={`py-2 px-2 rounded-2xl border text-xs font-medium transition text-center flex flex-col items-center justify-center gap-1 ${
                  frequency === 'monthly_flex'
                    ? 'bg-[#c04e6c] text-white border-[#c04e6c] shadow-xs'
                    : 'bg-[#FDFBF7] dark:bg-slate-800 border-[#F0EBE0] text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="font-semibold">Monthly / Flex</span>
                <span className="text-[10px] opacity-80">e.g. Finance, Air Filter</span>
              </button>
            </div>
          </div>

          {/* If Specific Day is chosen: Day selector */}
          {frequency === 'specific_day' && (
            <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
              <label className="block text-xs font-semibold text-amber-900 dark:text-amber-200 mb-1.5">
                Select Day of Week for Specific Assignment:
              </label>
              <div className="grid grid-cols-7 gap-1">
                {DAYS_OF_WEEK.map((d) => (
                  <button
                    key={d.day}
                    type="button"
                    onClick={() => handleSpecificDaySelect(d.day, d.index)}
                    className={`py-1.5 rounded-xl text-xs font-bold transition text-center ${
                      specificDay === d.day
                        ? 'bg-[#1A3C40] text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-amber-200 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {d.short}
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-amber-700/80 dark:text-amber-300/70 mt-1.5 text-center">
                Recur every {specificDay} (e.g. Run Lomi on Tuesday, Dump Lomi on Wednesday)
              </p>
            </div>
          )}

          {/* Time Block Selector (Morning, Evening, Monthly) */}
          {frequency !== 'monthly_flex' && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Time Block
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTimeBlock('morning')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-center ${
                    timeBlock === 'morning'
                      ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                      : 'bg-[#FDFBF7] dark:bg-slate-800 border-[#F0EBE0] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Morning Block
                </button>
                <button
                  type="button"
                  onClick={() => setTimeBlock('evening')}
                  className={`py-2 px-3 rounded-xl border text-xs font-medium transition text-center ${
                    timeBlock === 'evening'
                      ? 'bg-[#1A3C40] text-white border-[#1A3C40]'
                      : 'bg-[#FDFBF7] dark:bg-slate-800 border-[#F0EBE0] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  Evening Block
                </button>
              </div>
            </div>
          )}

          {/* Room Location Selector (Strict 8 Rooms) */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              Room Location *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {ROOM_LOCATIONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRoom(r)}
                  className={`py-2 px-2.5 rounded-xl border text-xs transition text-center truncate ${
                    room === r
                      ? 'bg-[#1A3C40] text-white border-[#1A3C40] font-semibold'
                      : 'bg-[#FDFBF7] dark:bg-slate-800 border-[#F0EBE0] text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Fiscal Calendar Alignment (4-4-5 Fiscal Week) */}
          <div className="p-3.5 rounded-2xl bg-[#EBF7F8]/60 dark:bg-teal-950/30 border border-[#A8DADC]/40">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-[#1A3C40] dark:text-teal-200 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#2D6A4F]" />
                <span>4-4-5 Fiscal Schedule</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Continuous Axis Sync</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map((w) => (
                <button
                  key={w}
                  type="button"
                  onClick={() => setFiscalWeek(w)}
                  className={`py-1.5 rounded-lg text-xs font-mono font-bold transition text-center ${
                    fiscalWeek === w
                      ? 'bg-[#2D6A4F] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 border border-slate-200 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  W{w}
                </button>
              ))}
            </div>
          </div>

          {/* Task Ownership Selector: Steve, Nicole, Shared */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
              Task Ownership (Initial Outlined Bubble Color)
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {/* Steve */}
              <button
                id="owner-select-steve"
                type="button"
                onClick={() => setOwner('steve')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition ${
                  owner === 'steve'
                    ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F] ring-1 ring-[#2D6A4F]'
                    : 'border-[#F0EBE0] dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#2D6A4F] mb-1" />
                <span>Steve</span>
                <span className="text-[10px] opacity-75 font-normal">Sea Green</span>
              </button>

              {/* Nicole */}
              <button
                id="owner-select-nicole"
                type="button"
                onClick={() => setOwner('nicole')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition ${
                  owner === 'nicole'
                    ? 'border-[#FFB3C1] bg-[#FFB3C1]/20 text-pink-700 ring-1 ring-[#FFB3C1]'
                    : 'border-[#F0EBE0] dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#FFB3C1] mb-1" />
                <span>Nicole</span>
                <span className="text-[10px] opacity-75 font-normal">Light Pink</span>
              </button>

              {/* Shared */}
              <button
                id="owner-select-shared"
                type="button"
                onClick={() => setOwner('shared')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-semibold transition ${
                  owner === 'shared'
                    ? 'border-[#D2B48C] bg-[#F4F1DE] text-[#966b36] ring-1 ring-[#D2B48C]'
                    : 'border-[#F0EBE0] dark:border-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                <span className="w-3.5 h-3.5 rounded-full bg-[#D2B48C] mb-1" />
                <span>Shared</span>
                <span className="text-[10px] opacity-75 font-normal">Beige / Sand</span>
              </button>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#F0EBE0] dark:border-[#284c5e] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              id="submit-chore-btn"
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add to Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
