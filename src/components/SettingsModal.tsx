import React from 'react';
import { X, Sparkles, Check, Waves, Smartphone, ListChecks, ShieldCheck, Copy, Users, Info } from 'lucide-react';
import { useFlowSettings } from '../context/FlowSettingsContext';
import type { Household, ProfileName } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  household: Household | null;
  currentProfile: ProfileName;
  onOpenHouseholdModal: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  household,
  currentProfile,
  onOpenHouseholdModal,
}) => {
  const { flowGamification, setFlowGamification } = useFlowSettings();
  const [copiedCode, setCopiedCode] = React.useState(false);

  if (!isOpen) return null;

  const handleCopyCode = async () => {
    if (!household?.syncCode) return;
    try {
      await navigator.clipboard.writeText(household.syncCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      id="settings-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        id="settings-modal-dialog"
        className="bg-white dark:bg-[#0e1d24] w-full max-w-lg rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-2xl p-6 sm:p-8 overflow-hidden relative space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-[#EBF7F8] dark:bg-teal-950 text-[#2D6A4F] dark:text-teal-300">
                <Sparkles className="w-5 h-5" />
              </span>
              <h2 className="text-xl sm:text-2xl font-light text-[#1A3C40] dark:text-slate-100 font-display">
                Experience & Flow Settings
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Customize interaction feedback, animations, and visual modes
            </p>
          </div>
          <button
            id="close-settings-modal"
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. GAMIFICATION & FLOW ANIMATIONS TOGGLE (Phase 4 Spec) */}
        <div className="p-5 rounded-3xl bg-[#FDFBF7] dark:bg-[#142831] border border-[#F0EBE0] dark:border-[#284c5e] space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-widest text-[#2D6A4F] dark:text-teal-400">
                  Interaction Layer
                </span>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    flowGamification
                      ? 'bg-[#2D6A4F] text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {flowGamification ? 'FLOW ON' : 'MINIMALIST OFF'}
                </span>
              </div>
              <h3 className="text-base font-semibold text-[#1A3C40] dark:text-slate-100">
                Gamification / Flow Animations
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Controls liquid filling micro-animations, tactile haptics, and the Daily Flow ring.
              </p>
            </div>

            {/* Accessible Toggle Switch */}
            <button
              id="toggle-flow-gamification-switch"
              type="button"
              role="switch"
              aria-checked={flowGamification}
              onClick={() => setFlowGamification(!flowGamification)}
              className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-[#2D6A4F] ${
                flowGamification ? 'bg-[#2D6A4F]' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  flowGamification ? 'translate-x-7' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Detailed Mode Explanations */}
          <div className="pt-3 border-t border-[#F0EBE0] dark:border-slate-800 space-y-2 text-xs">
            {flowGamification ? (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-[#A8DADC]/50 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-[#2D6A4F] dark:text-teal-400 font-semibold">
                  <Waves className="w-4 h-4" />
                  <span>Flow Mode Active (Default)</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] mt-1.5 shrink-0" />
                    <span><strong>Liquid Wave Filling:</strong> Tapping a task triggers a fluid, oceanic liquid-filling micro-animation in the executor's avatar color.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] mt-1.5 shrink-0" />
                    <span><strong>Haptic Touch Feedback:</strong> Light tactile feedback on task execution for satisfying physical response.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2D6A4F] mt-1.5 shrink-0" />
                    <span><strong>Daily Flow Progress Ring:</strong> Prominently displays rhythm completion and partner balance at the top of the matrix.</span>
                  </li>
                </ul>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-semibold">
                  <ListChecks className="w-4 h-4" />
                  <span>Minimalist Checklist Mode Active</span>
                </div>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Instant Color-Fill:</strong> Zero wave delay; task bubbles transition immediately with a clean, static color-fill.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Hidden Progress Ring:</strong> The Daily Flow ring is removed to prevent distraction for pure checklist utility.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-1.5 shrink-0" />
                    <span><strong>Silent Interactions:</strong> Haptic vibrations and particle rings are suppressed.</span>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* 2. HOUSEHOLD & SYNC OVERVIEW */}
        {household && (
          <div className="p-4 rounded-2xl bg-[#FDFBF7] dark:bg-[#142831] border border-[#F0EBE0] dark:border-[#284c5e] flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400">
                Connected Sanctuary
              </span>
              <p className="text-sm font-semibold text-[#1A3C40] dark:text-slate-100">
                {household.name}
              </p>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="text-xs font-mono font-bold text-[#2D6A4F] dark:text-teal-300">
                  {household.syncCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="text-xs text-slate-400 hover:text-[#2D6A4F] flex items-center gap-1"
                >
                  {copiedCode ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenHouseholdModal();
              }}
              className="px-3 py-1.5 rounded-xl border border-[#F0EBE0] dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Switch Space
            </button>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-2 flex justify-end">
          <button
            id="done-settings-button"
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#1A3C40] hover:bg-[#2D6A4F] text-white text-xs font-semibold transition shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
