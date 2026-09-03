import React, { useState } from 'react';
import { X, KeyRound, Home, PlusCircle, LogIn, Users, CheckCircle2, AlertCircle, Copy, Check } from 'lucide-react';
import type { Household, ProfileName, HouseholdMember } from '../types';
import type { User as FirebaseUser } from 'firebase/auth';
import { createHousehold, findHouseholdBySyncCode, joinHousehold } from '../lib/firebase';

interface HouseholdSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  household: Household | null;
  currentProfile: ProfileName;
  onHouseholdUpdated: (household: Household) => void;
  onProfileChange: (profile: ProfileName) => void;
  onRequireAuth: () => void;
}

export const HouseholdSyncModal: React.FC<HouseholdSyncModalProps> = ({
  isOpen,
  onClose,
  user,
  household,
  currentProfile,
  onHouseholdUpdated,
  onProfileChange,
  onRequireAuth,
}) => {
  const [tab, setTab] = useState<'create' | 'join' | 'info'>(household ? 'info' : 'join');
  const [newHouseholdName, setNewHouseholdName] = useState("Steve & Nicole's Sanctuary");
  const [syncCodeInput, setSyncCodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const created = await createHousehold(newHouseholdName, user, currentProfile);
      onHouseholdUpdated(created);
      setTab('info');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to create household.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      onRequireAuth();
      return;
    }
    if (!syncCodeInput.trim()) {
      setErrorMsg('Please enter a 6-character sync code.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      const found = await findHouseholdBySyncCode(syncCodeInput);
      if (!found) {
        throw new Error(`No household found with sync code "${syncCodeInput.trim().toUpperCase()}". Please verify and try again.`);
      }
      await joinHousehold(found.id, user, currentProfile);
      onHouseholdUpdated(found);
      setTab('info');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to join household.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!household?.syncCode) return;
    await navigator.clipboard.writeText(household.syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fade-in">
      <div
        id="household-sync-modal"
        className="bg-white dark:bg-[#142831] border border-[#F0EBE0] dark:border-[#284c5e] rounded-3xl w-full max-w-md shadow-xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="bg-[#FDFBF7] dark:bg-[#0e1d24] border-b border-[#F0EBE0] dark:border-[#284c5e] p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF7F8] border border-[#A8DADC]/40 flex items-center justify-center text-[#2D6A4F]">
              <Home className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-light font-display text-[#1A3C40] dark:text-slate-100">
                Tide Household Sync
              </h2>
              <p className="text-xs uppercase tracking-widest text-[#A8DADC] font-semibold mt-0.5">
                Real-time multi-device synchronization
              </p>
            </div>
          </div>
          <button
            id="close-household-modal"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Switcher inside Modal */}
        <div className="px-6 pt-5 pb-2">
          <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
            Active Device Profile
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              id="modal-profile-steve"
              type="button"
              onClick={() => onProfileChange('Steve')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-medium transition ${
                currentProfile === 'Steve'
                  ? 'border-[#2D6A4F] bg-[#2D6A4F]/10 text-[#2D6A4F] ring-1 ring-[#2D6A4F]'
                  : 'border-[#F0EBE0] dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#2D6A4F]/40'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-[#2D6A4F] shadow-xs" />
              <span>Steve (Sea Green)</span>
            </button>

            <button
              id="modal-profile-nicole"
              type="button"
              onClick={() => onProfileChange('Nicole')}
              className={`flex items-center justify-center gap-2 p-2.5 rounded-2xl border text-xs font-medium transition ${
                currentProfile === 'Nicole'
                  ? 'border-[#FFB3C1] bg-[#FFB3C1]/20 text-pink-700 ring-1 ring-[#FFB3C1]'
                  : 'border-[#F0EBE0] dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-[#FFB3C1]/50'
              }`}
            >
              <span className="w-3 h-3 rounded-full bg-[#FFB3C1] shadow-xs" />
              <span>Nicole (Light Pink)</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 pt-2">
          <div className="flex border-b border-[#F0EBE0] dark:border-slate-800 text-xs">
            {household && (
              <button
                id="tab-household-info"
                onClick={() => setTab('info')}
                className={`py-2 px-3 font-semibold border-b-2 transition ${
                  tab === 'info'
                    ? 'border-[#2D6A4F] text-[#2D6A4F]'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}
              >
                Current Household
              </button>
            )}
            <button
              id="tab-household-join"
              onClick={() => setTab('join')}
              className={`py-2 px-3 font-semibold border-b-2 transition ${
                tab === 'join'
                  ? 'border-[#2D6A4F] text-[#2D6A4F]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Join with Sync Code
            </button>
            <button
              id="tab-household-create"
              onClick={() => setTab('create')}
              className={`py-2 px-3 font-semibold border-b-2 transition ${
                tab === 'create'
                  ? 'border-[#2D6A4F] text-[#2D6A4F]'
                  : 'border-transparent text-slate-400 hover:text-slate-700'
              }`}
            >
              Create New
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {!user && (
            <div className="mb-4 p-3.5 rounded-2xl bg-[#F4F1DE]/60 border border-[#D2B48C]/40 text-xs text-[#966b36] flex items-center justify-between gap-3">
              <span>Sign in with Google to enable Firestore cloud sync.</span>
              <button
                id="modal-signin-prompt-btn"
                onClick={onRequireAuth}
                className="px-4 py-1.5 bg-[#2D6A4F] hover:bg-[#23533e] text-white font-medium rounded-full shrink-0 transition text-xs shadow-xs"
              >
                Sign In
              </button>
            </div>
          )}

          {/* TAB: Current Household Info */}
          {tab === 'info' && household && (
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-[#FDFBF7] dark:bg-slate-900 border border-[#F0EBE0] dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400 tracking-widest">
                  Active Household
                </div>
                <div className="text-base font-light text-[#1A3C40] dark:text-slate-100 mt-1">
                  {household.name}
                </div>

                <div className="mt-4 pt-3 border-t border-[#F0EBE0] dark:border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 block">
                      Sync Code
                    </span>
                    <span className="text-2xl font-mono font-light tracking-widest text-[#2D6A4F] dark:text-teal-300">
                      {household.syncCode}
                    </span>
                  </div>
                  <button
                    id="modal-copy-code-button"
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] text-white text-xs font-medium tracking-wide transition shadow-xs"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Code</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Synced Members & Profiles
                </h4>
                <div className="space-y-1.5">
                  {household.members &&
                    (Object.values(household.members) as HouseholdMember[]).map((member) => (
                      <div
                        key={member.uid}
                        className="flex items-center justify-between p-3 rounded-2xl bg-[#FDFBF7] dark:bg-slate-800/50 border border-[#F0EBE0] dark:border-slate-800 text-xs"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`w-2.5 h-2.5 rounded-full ${
                              member.profileName === 'Steve'
                                ? 'bg-[#2D6A4F]'
                                : member.profileName === 'Nicole'
                                ? 'bg-[#FFB3C1]'
                                : 'bg-slate-400'
                            }`}
                          />
                          <span className="font-medium text-[#1A3C40] dark:text-slate-200">
                            {member.profileName}
                          </span>
                          {member.displayName && (
                            <span className="text-slate-400 text-[11px]">
                              ({member.displayName})
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-[#2D6A4F] font-semibold uppercase tracking-wider">
                          Active
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: Join Existing Household */}
          {tab === 'join' && (
            <form onSubmit={handleJoin} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter the 6-character sync code from Steve or Nicole's device to connect this device in real-time.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Sync Code (e.g. OCEAN7)
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    id="input-sync-code"
                    type="text"
                    maxLength={10}
                    placeholder="Enter 6-character code"
                    value={syncCodeInput}
                    onChange={(e) => setSyncCodeInput(e.target.value.toUpperCase())}
                    className="w-full pl-10 pr-4 py-2.5 text-sm font-mono tracking-widest uppercase bg-[#FDFBF7] dark:bg-slate-800 border border-[#F0EBE0] dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden font-bold"
                  />
                </div>
              </div>

              <button
                id="submit-join-household"
                type="submit"
                disabled={loading || !syncCodeInput.trim()}
                className="w-full py-2.5 px-4 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] disabled:opacity-50 text-white font-medium text-xs tracking-wide transition shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? 'Joining...' : 'Join Household'}
              </button>
            </form>
          )}

          {/* TAB: Create New Household */}
          {tab === 'create' && (
            <form onSubmit={handleCreate} className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Create a new Tide household space in Firebase Firestore. You will receive a 6-character sync code to share.
              </p>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                  Household Sanctuary Name
                </label>
                <input
                  id="input-household-name"
                  type="text"
                  placeholder="e.g. Steve & Nicole's Tide Sanctuary"
                  value={newHouseholdName}
                  onChange={(e) => setNewHouseholdName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-[#FDFBF7] dark:bg-slate-800 border border-[#F0EBE0] dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-[#2D6A4F] outline-hidden"
                />
              </div>

              <button
                id="submit-create-household"
                type="submit"
                disabled={loading || !newHouseholdName.trim()}
                className="w-full py-2.5 px-4 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] disabled:opacity-50 text-white font-medium text-xs tracking-wide transition shadow-xs flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{loading ? 'Creating...' : 'Create Household & Generate Sync Code'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
