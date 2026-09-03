import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Waves, CheckCircle2, SlidersHorizontal, Sun, Moon, Calendar, Zap } from 'lucide-react';
import type { Chore, TimeBlock } from '../types';
import { useFlowSettings } from '../context/FlowSettingsContext';

interface DailyFlowRingProps {
  chores: Chore[];
  activeTimeBlock: TimeBlock;
  onOpenSettings: () => void;
}

export const DailyFlowRing: React.FC<DailyFlowRingProps> = ({
  chores,
  activeTimeBlock,
  onOpenSettings,
}) => {
  const { flowGamification, toggleFlowGamification } = useFlowSettings();

  // Active timeblock chores vs all daily chores
  const activeBlockChores = chores.filter((c) => c.timeBlock === activeTimeBlock);
  const activeDone = activeBlockChores.filter((c) => c.status === 'done').length;
  const activeTotal = activeBlockChores.length;
  const activePercent = activeTotal > 0 ? Math.round((activeDone / activeTotal) * 100) : 0;

  // Total daily chores (morning + evening)
  const dailyChores = chores.filter((c) => c.timeBlock === 'morning' || c.timeBlock === 'evening');
  const dailyDone = dailyChores.filter((c) => c.status === 'done').length;
  const dailyTotal = dailyChores.length;
  const overallPercent = dailyTotal > 0 ? Math.round((dailyDone / dailyTotal) * 100) : 0;

  // Ownership completions
  const steveDone = chores.filter((c) => c.status === 'done' && (c.completedBy === 'steve' || (!c.completedBy && c.owner === 'steve'))).length;
  const nicoleDone = chores.filter((c) => c.status === 'done' && (c.completedBy === 'nicole' || (!c.completedBy && c.owner === 'nicole'))).length;
  const sharedDone = chores.filter((c) => c.status === 'done' && (c.completedBy === 'shared' || (!c.completedBy && c.owner === 'shared'))).length;

  // SVG Progress Ring calculations
  const radius = 38;
  const strokeWidth = 7;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (activePercent / 100) * circumference;

  // Flow State Status
  const getFlowStatus = () => {
    if (activeTotal === 0) return { title: 'Sanctuary Open', sub: 'Ready to align rhythms' };
    if (activePercent === 100) return { title: 'Full High Tide Flow', sub: 'All rhythms completed in harmony' };
    if (activePercent >= 75) return { title: 'High Tide Momentum', sub: 'Approaching complete balance' };
    if (activePercent >= 40) return { title: 'Steady Mid-Tide Cadence', sub: 'Flowing smoothly through tasks' };
    return { title: 'Slack Tide Awakening', sub: 'Beginning the daily rhythm' };
  };

  const flowStatus = getFlowStatus();

  return (
    <AnimatePresence>
      {flowGamification && (
        <motion.div
          id="daily-flow-progress-ring-card"
          initial={{ opacity: 0, height: 0, y: -10 }}
          animate={{ opacity: 1, height: 'auto', y: 0 }}
          exit={{ opacity: 0, height: 0, y: -10 }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          className="overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-white via-[#F4F9F8] to-[#EBF7F8] dark:from-[#11242d] dark:via-[#142831] dark:to-[#17323d] p-5 sm:p-6 rounded-3xl border border-[#A8DADC]/40 dark:border-[#284c5e] shadow-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              
              {/* Left: Interactive Circular Progress Ring */}
              <div className="flex items-center gap-5 w-full md:w-auto justify-center sm:justify-start">
                <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
                    <defs>
                      <linearGradient id="oceanicFlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#2D6A4F" />
                        <stop offset="50%" stopColor="#52B788" />
                        <stop offset="100%" stopColor="#A8DADC" />
                      </linearGradient>
                    </defs>
                    {/* Background track */}
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      fill="transparent"
                      stroke="currentColor"
                      strokeWidth={strokeWidth}
                      className="text-[#E0EFEF] dark:text-slate-800"
                    />
                    {/* Animated oceanic progress ring */}
                    <circle
                      cx="48"
                      cy="48"
                      r={radius}
                      fill="transparent"
                      stroke="url(#oceanicFlowGradient)"
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-700 ease-out"
                    />
                  </svg>
                  {/* Center percentage readout */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-xl font-bold font-mono text-[#1A3C40] dark:text-teal-200 tracking-tight leading-none">
                      {activePercent}%
                    </span>
                    <span className="text-[9px] uppercase tracking-widest text-[#2D6A4F] dark:text-teal-400 font-semibold mt-0.5">
                      Flow
                    </span>
                  </div>
                </div>

                {/* Status description */}
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F] animate-ping" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#2D6A4F] dark:text-teal-400">
                      Daily Flow Engine
                    </span>
                  </div>
                  <h3 className="text-base sm:text-lg font-light text-[#1A3C40] dark:text-slate-100 font-display">
                    {flowStatus.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {activeDone} of {activeTotal} {activeTimeBlock} rhythm tasks completed ({overallPercent}% across full day)
                  </p>
                </div>
              </div>

              {/* Right: Partner contribution badges & Mode indicator */}
              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto">
                {/* Contributor balance pills */}
                <div className="flex items-center gap-2 bg-white/80 dark:bg-slate-900/60 p-2 rounded-2xl border border-[#F0EBE0] dark:border-slate-800">
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#2D6A4F]/10 text-[#2D6A4F] text-[11px] font-medium" title="Steve's completions">
                    <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
                    <span className="font-semibold">Steve: {steveDone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFB3C1]/20 text-[#c04e6c] text-[11px] font-medium" title="Nicole's completions">
                    <span className="w-2 h-2 rounded-full bg-[#FFB3C1]" />
                    <span className="font-semibold">Nicole: {nicoleDone}</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#D2B48C]/20 text-[#966b36] text-[11px] font-medium" title="Shared completions">
                    <span className="w-2 h-2 rounded-full bg-[#D2B48C]" />
                    <span className="font-semibold">Shared: {sharedDone}</span>
                  </div>
                </div>

                {/* Flow Gamification quick-toggle / settings button */}
                <button
                  id="flow-settings-quick-toggle"
                  type="button"
                  onClick={onOpenSettings}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-[#A8DADC]/60 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-[#2D6A4F] text-xs font-medium transition shadow-xs"
                  title="Configure Gamification & Flow Settings"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-teal-300" />
                  <span className="hidden sm:inline">Flow FX:</span>
                  <span className="text-[#2D6A4F] dark:text-teal-300 font-semibold">ON</span>
                  <SlidersHorizontal className="w-3 h-3 text-slate-400 ml-1" />
                </button>
              </div>

            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
