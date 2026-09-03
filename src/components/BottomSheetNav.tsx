import React, { useState } from 'react';
import {
  Sun,
  Moon,
  Calendar,
  Plus,
  ChevronUp,
  ChevronDown,
  Users,
  Compass,
  Check,
  X
} from 'lucide-react';
import type { TimeBlock, RoomLocation, ProfileName } from '../types';
import { ROOM_LOCATIONS } from '../types';

interface BottomSheetNavProps {
  activeTimeBlock: TimeBlock;
  onChangeTimeBlock: (block: TimeBlock) => void;
  onOpenAddModal: (room?: RoomLocation) => void;
  currentProfile: ProfileName;
  onToggleProfile: () => void;
  selectedWeek: number;
  onSelectWeek: (w: number) => void;
  morningCount: number;
  eveningCount: number;
  monthlyCount: number;
}

export const BottomSheetNav: React.FC<BottomSheetNavProps> = ({
  activeTimeBlock,
  onChangeTimeBlock,
  onOpenAddModal,
  currentProfile,
  onToggleProfile,
  selectedWeek,
  onSelectWeek,
  morningCount,
  eveningCount,
  monthlyCount,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <>
      {/* Backdrop overlay when sheet drawer is expanded */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs transition-opacity"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}

      {/* Docked Bottom Sheet Container */}
      <nav
        id="bottom-sheet-navigation-dock"
        aria-label="Time-blocked and bottom-sheet navigation"
        className="fixed bottom-0 left-0 right-0 z-40 flex flex-col items-center justify-end pointer-events-none"
      >
        {/* Expandable Bottom Sheet Drawer */}
        <div
          className={`w-full max-w-lg mx-auto bg-white dark:bg-[#142831] border-t border-x border-[#F0EBE0] dark:border-[#284c5e] rounded-t-3xl shadow-2xl pointer-events-auto transition-transform duration-300 ease-out overflow-hidden ${
            isDrawerOpen ? 'translate-y-0' : 'translate-y-full hidden'
          }`}
        >
          {/* Drawer Handle & Header */}
          <div className="p-4 border-b border-[#F0EBE0] dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 rounded-full bg-slate-300 dark:bg-slate-600 mx-auto" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[#1A3C40] dark:text-slate-200">
                Quick Navigation & Room Jump
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Content */}
          <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Profile Switcher Quick Action */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#FDFBF7] dark:bg-slate-900/60 border border-[#F0EBE0] dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                    currentProfile === 'Steve' ? 'bg-[#2D6A4F]' : 'bg-[#d94f70]'
                  }`}
                >
                  {currentProfile.charAt(0)}
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    Active Profile: {currentProfile}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Switching syncs active task assignment
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onToggleProfile}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-[#2D6A4F] transition"
              >
                Switch to {currentProfile === 'Steve' ? 'Nicole' : 'Steve'}
              </button>
            </div>

            {/* Room Jump Pills */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
                Add Chore to Room:
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ROOM_LOCATIONS.map((room) => (
                  <button
                    key={room}
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onOpenAddModal(room);
                    }}
                    className="p-2.5 rounded-2xl text-left bg-[#FDFBF7] dark:bg-slate-900/40 hover:bg-[#EBF7F8] dark:hover:bg-slate-800 border border-[#F0EBE0] dark:border-slate-800 transition text-xs font-medium text-slate-700 dark:text-slate-300 truncate"
                  >
                    + {room}
                  </button>
                ))}
              </div>
            </div>

            {/* 4-4-5 Fiscal Week Quick Select */}
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                Fiscal Week:
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((w) => (
                  <button
                    key={w}
                    type="button"
                    onClick={() => {
                      onSelectWeek(w);
                      setIsDrawerOpen(false);
                    }}
                    className={`flex-1 py-2 rounded-xl text-xs font-mono font-bold transition ${
                      selectedWeek === w
                        ? 'bg-[#2D6A4F] text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    W{w}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Floating Bottom Bar (Primary Navigation) */}
        <div className="w-full max-w-lg mx-auto px-4 pb-4 pointer-events-auto">
          <div className="bg-white/95 dark:bg-[#142831]/95 backdrop-blur-lg border border-[#F0EBE0] dark:border-[#284c5e] rounded-full p-1.5 shadow-xl flex items-center justify-between">
            {/* 1. Morning Tab */}
            <button
              id="tab-morning"
              type="button"
              onClick={() => onChangeTimeBlock('morning')}
              className={`flex-1 py-2.5 px-2 rounded-full transition flex items-center justify-center gap-1.5 ${
                activeTimeBlock === 'morning'
                  ? 'bg-[#2D6A4F] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#2D6A4F]'
              }`}
            >
              <Sun className="w-4 h-4" />
              <span className="text-xs tracking-tight">Morning</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTimeBlock === 'morning'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {morningCount}
              </span>
            </button>

            {/* 2. Evening Tab */}
            <button
              id="tab-evening"
              type="button"
              onClick={() => onChangeTimeBlock('evening')}
              className={`flex-1 py-2.5 px-2 rounded-full transition flex items-center justify-center gap-1.5 ${
                activeTimeBlock === 'evening'
                  ? 'bg-[#1A3C40] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#1A3C40]'
              }`}
            >
              <Moon className="w-4 h-4" />
              <span className="text-xs tracking-tight">Evening</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTimeBlock === 'evening'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {eveningCount}
              </span>
            </button>

            {/* 3. Monthly Tab */}
            <button
              id="tab-monthly"
              type="button"
              onClick={() => onChangeTimeBlock('monthly')}
              className={`flex-1 py-2.5 px-2 rounded-full transition flex items-center justify-center gap-1.5 ${
                activeTimeBlock === 'monthly'
                  ? 'bg-[#c04e6c] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-[#c04e6c]'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-xs tracking-tight">Monthly</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  activeTimeBlock === 'monthly'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}
              >
                {monthlyCount}
              </span>
            </button>

            {/* Quick Add (+) Trigger Button */}
            <button
              id="bottom-quick-add-btn"
              type="button"
              onClick={() => onOpenAddModal()}
              className="w-10 h-10 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] text-white flex items-center justify-center shadow-md transition ml-1 shrink-0"
              title="Add task"
            >
              <Plus className="w-5 h-5" />
            </button>

            {/* Bottom-sheet Drawer Opener */}
            <button
              id="bottom-sheet-toggle-btn"
              type="button"
              onClick={() => setIsDrawerOpen(!isDrawerOpen)}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
              title="Open room drawer"
            >
              {isDrawerOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </nav>
    </>
  );
};
