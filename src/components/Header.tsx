import React, { useState } from 'react';
import { MermaidMascot } from './MermaidMascot';
import { User, LogIn, LogOut, Copy, Check, Users, Home, RefreshCw, KeyRound, Sparkles, Settings, Waves, ListChecks } from 'lucide-react';
import type { Household, ProfileName } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { useFlowSettings } from '../context/FlowSettingsContext';

interface HeaderProps {
  user: FirebaseUser | null;
  household: Household | null;
  currentProfile: ProfileName;
  onProfileChange: (profile: ProfileName) => void;
  onLogin: () => void;
  onLogout: () => void;
  onOpenHouseholdModal: () => void;
  onOpenSettings?: () => void;
  isSyncing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  household,
  currentProfile,
  onProfileChange,
  onLogin,
  onLogout,
  onOpenHouseholdModal,
  onOpenSettings,
  isSyncing = false,
}) => {
  const { flowGamification, toggleFlowGamification } = useFlowSettings();
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyCode = async () => {
    if (!household?.syncCode) return;
    try {
      await navigator.clipboard.writeText(household.syncCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (err) {
      console.error('Failed to copy sync code:', err);
    }
  };

  return (
    <header className="bg-[#FDFBF7]/95 dark:bg-[#0e1d24]/95 border-b border-[#F0EBE0] dark:border-slate-800/80 backdrop-blur-md sticky top-0 z-30 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Logo & Clean Minimal Branding */}
          <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 flex items-center justify-center bg-[#A8DADC] rounded-full text-white font-bold text-2xl shadow-xs shrink-0 select-none">
                T
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-3xl font-light tracking-tight text-[#1A3C40] dark:text-slate-100 font-display">
                    Tide
                  </h1>
                  <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full font-bold bg-[#EBF7F8] text-[#2D6A4F] border border-[#A8DADC]/40">
                    Phase 4 • Flow Gamification
                  </span>
                </div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#A8DADC] font-semibold">
                  Find your flow.
                </p>
              </div>
            </div>

            {/* Mobile Actions: Flow Toggle, Settings & Auth */}
            <div className="sm:hidden flex items-center gap-1.5">
              <button
                id="mobile-flow-toggle-button"
                type="button"
                onClick={toggleFlowGamification}
                className={`p-1.5 rounded-full border text-xs ${
                  flowGamification
                    ? 'bg-[#EBF7F8] dark:bg-teal-950 text-[#2D6A4F] dark:text-teal-300 border-[#A8DADC]/60'
                    : 'bg-white dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                }`}
                title="Toggle Flow Mode"
              >
                {flowGamification ? <Waves className="w-4 h-4" /> : <ListChecks className="w-4 h-4" />}
              </button>

              {onOpenSettings && (
                <button
                  id="mobile-settings-button"
                  type="button"
                  onClick={onOpenSettings}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              {user ? (
                <button
                  id="mobile-logout-button"
                  onClick={onLogout}
                  className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              ) : (
                <button
                  id="mobile-login-button"
                  onClick={onLogin}
                  className="flex items-center gap-1 text-xs px-3 py-1 rounded-full bg-[#2D6A4F] text-white font-medium shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}
            </div>
          </div>

          {/* Household Sync & Profile Controls */}
          <div className="flex flex-wrap items-center justify-end gap-5 w-full sm:w-auto">
            
            {/* Multi-Device Household Indicator */}
            {household ? (
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                    Household ID
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      id="copy-sync-code-button"
                      onClick={handleCopyCode}
                      className="font-mono text-sm text-[#2D6A4F] dark:text-teal-300 font-bold hover:underline flex items-center gap-1"
                      title="Click to copy 6-digit sync code"
                    >
                      <span>{household.syncCode}</span>
                      {copiedCode ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-slate-400 hover:text-[#2D6A4F]" />
                      )}
                    </button>
                    <button
                      id="switch-household-button"
                      onClick={onOpenHouseholdModal}
                      className="text-[10px] text-slate-400 hover:text-slate-600 underline ml-0.5"
                    >
                      Switch
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                id="connect-household-button"
                onClick={onOpenHouseholdModal}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#F4F1DE] text-[#966b36] border border-[#D2B48C]/40 hover:bg-[#ebd9b4] transition shadow-xs"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Connect Household</span>
              </button>
            )}

            {/* Circular Monogram Profile Selector (Steve 'S' vs Nicole 'N') */}
            <div className="flex items-center gap-2">
              <button
                id="profile-steve-tab"
                onClick={() => onProfileChange('Steve')}
                title="Switch to Steve (Sea Green)"
                className={`w-9 h-9 rounded-full border-2 border-[#2D6A4F] flex items-center justify-center font-bold text-sm cursor-pointer transition shadow-xs ${
                  currentProfile === 'Steve'
                    ? 'bg-[#2D6A4F] text-white ring-2 ring-[#2D6A4F]/30'
                    : 'bg-white text-[#2D6A4F] opacity-55 hover:opacity-100'
                }`}
              >
                S
              </button>

              <button
                id="profile-nicole-tab"
                onClick={() => onProfileChange('Nicole')}
                title="Switch to Nicole (Light Pink)"
                className={`w-9 h-9 rounded-full border-2 border-[#FFB3C1] flex items-center justify-center font-bold text-sm cursor-pointer transition shadow-xs ${
                  currentProfile === 'Nicole'
                    ? 'bg-[#FFB3C1] text-slate-900 ring-2 ring-[#FFB3C1]/50'
                    : 'bg-white text-[#FFB3C1] opacity-55 hover:opacity-100'
                }`}
              >
                N
              </button>
            </div>

            {/* Desktop Flow Mode Toggle & Settings Button */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#F0EBE0] dark:border-slate-800">
              <button
                id="header-flow-gamification-toggle"
                type="button"
                onClick={toggleFlowGamification}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition shadow-xs border ${
                  flowGamification
                    ? 'bg-[#EBF7F8] dark:bg-teal-950 text-[#2D6A4F] dark:text-teal-300 border-[#A8DADC]/60 hover:bg-[#d9eff1]'
                    : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:text-slate-700'
                }`}
                title={
                  flowGamification
                    ? 'Flow Gamification Active (Click to switch to Minimalist Checklist)'
                    : 'Minimalist Checklist Active (Click to enable Flow Animations)'
                }
              >
                {flowGamification ? (
                  <>
                    <Waves className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-teal-300" />
                    <span>Flow FX: <strong className="font-semibold">ON</strong></span>
                  </>
                ) : (
                  <>
                    <ListChecks className="w-3.5 h-3.5 text-slate-400" />
                    <span>Flow FX: <strong className="font-semibold">OFF</strong></span>
                  </>
                )}
              </button>

              {onOpenSettings && (
                <button
                  id="desktop-settings-button"
                  type="button"
                  onClick={onOpenSettings}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  title="App & Flow Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Desktop Google Auth Button */}
            <div className="hidden sm:flex items-center gap-2 pl-3 border-l border-[#F0EBE0] dark:border-slate-800">
              {user ? (
                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate max-w-[110px]">
                      {user.displayName || user.email?.split('@')[0] || currentProfile}
                    </div>
                    <div className="text-[10px] text-[#2D6A4F] dark:text-teal-400 font-mono">
                      Synced
                    </div>
                  </div>
                  <button
                    id="desktop-logout-button"
                    onClick={onLogout}
                    className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  id="desktop-login-button"
                  onClick={onLogin}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1A3C40] hover:bg-[#2D6A4F] text-white text-xs font-medium transition shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#A8DADC]" />
                  <span>Google Auth</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};
