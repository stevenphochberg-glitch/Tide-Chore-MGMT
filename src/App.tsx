import React, { useEffect, useState, useMemo } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import {
  auth,
  db,
  loginWithGoogle,
  logoutUser,
  subscribeToHousehold,
  subscribeToChores,
  createHousehold,
  seedInitialHouseholdChores,
} from './lib/firebase';
import type { Household, Chore, ProfileName, TimeBlock, RoomLocation } from './types';
import { getFiscalCalendar } from './lib/fiscalCalendar';
import { Header } from './components/Header';
import { FiscalCalendarBar } from './components/FiscalCalendarBar';
import { RoomClusterView } from './components/RoomClusterView';
import { MonthlyFiscalGridView } from './components/MonthlyFiscalGridView';
import { BottomSheetNav } from './components/BottomSheetNav';
import { AddChoreModal } from './components/AddChoreModal';
import { HouseholdSyncModal } from './components/HouseholdSyncModal';
import { InstallPwaBanner } from './components/InstallPwaBanner';
import { MermaidMascot } from './components/MermaidMascot';
import { DailyFlowRing } from './components/DailyFlowRing';
import { SettingsModal } from './components/SettingsModal';
import { useFlowSettings } from './context/FlowSettingsContext';
import {
  Sun,
  Moon,
  Calendar,
  Plus,
  Users,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Compass,
  Layers,
  Sparkles,
  Repeat,
  Waves,
  ListChecks,
  SlidersHorizontal
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [currentProfile, setCurrentProfile] = useState<ProfileName>(() => {
    const saved = localStorage.getItem('tide_active_profile');
    return (saved === 'Nicole' ? 'Nicole' : 'Steve') as ProfileName;
  });
  const [household, setHousehold] = useState<Household | null>(null);
  const [chores, setChores] = useState<Chore[]>([]);
  
  // Phase 2 State: Time-Blocked Dashboard & Fiscal Calendar
  const [activeTimeBlock, setActiveTimeBlock] = useState<TimeBlock>('morning');
  
  // 4-4-5 Fiscal Calendar Info
  const fiscalInfo = useMemo(() => getFiscalCalendar(new Date()), []);
  const [selectedWeek, setSelectedWeek] = useState<number>(fiscalInfo.currentWeekNumber);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(fiscalInfo.currentDayIndex);

  // Modal & Settings State
  const [isAddChoreOpen, setIsAddChoreOpen] = useState(false);
  const [preselectedRoom, setPreselectedRoom] = useState<RoomLocation | undefined>(undefined);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [copiedSyncCode, setCopiedSyncCode] = useState(false);

  // Phase 4: Gamification / Flow Settings Context Hook
  const { flowGamification, toggleFlowGamification } = useFlowSettings();

  // Profile switcher
  const handleProfileChange = (profile: ProfileName) => {
    setCurrentProfile(profile);
    localStorage.setItem('tide_active_profile', profile);
  };

  const handleToggleProfile = () => {
    const next = currentProfile === 'Steve' ? 'Nicole' : 'Steve';
    handleProfileChange(next);
  };

  // Auth observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        try {
          const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
          if (userSnap.exists()) {
            const userData = userSnap.data();
            if (userData.profileName) {
              setCurrentProfile(userData.profileName as ProfileName);
            }
            if (userData.householdId) {
              return;
            }
          }

          const savedHouseholdId = localStorage.getItem('tide_household_id');
          if (savedHouseholdId) {
            const hSnap = await getDoc(doc(db, 'households', savedHouseholdId));
            if (hSnap.exists()) {
              setHousehold({ ...hSnap.data(), id: hSnap.id } as Household);
              return;
            }
          }

          // Auto-provision initial sanctuary if first time
          const initialHousehold = await createHousehold(
            "Steve & Nicole's Sanctuary",
            currentUser,
            currentProfile
          );
          setHousehold(initialHousehold);
          localStorage.setItem('tide_household_id', initialHousehold.id);
          // Seed rich room-clustered tasks across morning, evening, monthly
          await seedInitialHouseholdChores(initialHousehold.id);
        } catch (err) {
          console.error('Error fetching user data from Firestore:', err);
        }
      } else {
        const savedHouseholdId = localStorage.getItem('tide_household_id');
        if (savedHouseholdId) {
          const hRef = doc(db, 'households', savedHouseholdId);
          getDoc(hRef).then((snap) => {
            if (snap.exists()) {
              setHousehold({ ...snap.data(), id: snap.id } as Household);
            }
          }).catch(console.error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Subscribe to Household & Chores in Firestore
  useEffect(() => {
    if (!household?.id) return;
    localStorage.setItem('tide_household_id', household.id);

    const unsubHousehold = subscribeToHousehold(household.id, (updated) => {
      if (updated) {
        setHousehold(updated);
      }
    });

    const unsubChores = subscribeToChores(household.id, async (syncedChores) => {
      // If collection is completely empty, seed initial chores for immediate usability
      if (syncedChores.length === 0 && household.id) {
        try {
          await seedInitialHouseholdChores(household.id);
        } catch (e) {
          console.warn('Seeding initial chores skipped:', e);
        }
      }
      setChores(syncedChores);
    });

    return () => {
      unsubHousehold();
      unsubChores();
    };
  }, [household?.id]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      if (err.code === 'auth/popup-blocked') {
        alert('Popup was blocked by your browser. Please allow popups for Tide to authenticate.');
      }
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleCopySyncCode = async () => {
    if (!household?.syncCode) return;
    try {
      await navigator.clipboard.writeText(household.syncCode);
      setCopiedSyncCode(true);
      setTimeout(() => setCopiedSyncCode(false), 2000);
    } catch (err) {
      console.error('Copy sync code failed:', err);
    }
  };

  const openAddChoreModalWithRoom = (room?: RoomLocation) => {
    if (!household) {
      setIsHouseholdModalOpen(true);
      return;
    }
    setPreselectedRoom(room);
    setIsAddChoreOpen(true);
  };

  // Time-block counts
  const morningChores = chores.filter((c) => c.timeBlock === 'morning');
  const eveningChores = chores.filter((c) => c.timeBlock === 'evening');
  const monthlyChores = chores.filter((c) => c.timeBlock === 'monthly');

  const completedCount = chores.filter((c) => c.status === 'done').length;
  const flowPercentage = chores.length > 0 ? Math.round((completedCount / chores.length) * 100) : 85;

  return (
    <div className="min-h-screen bg-[#FDFBF7] dark:bg-[#07151e] text-[#2C3E50] dark:text-slate-100 flex flex-col transition-colors font-sans pb-24 md:pb-12 selection:bg-[#A8DADC]/40">
      {/* PWA Install Notification Bar */}
      <InstallPwaBanner />

      {/* Global Navigation & Profile Header */}
      <Header
        user={user}
        household={household}
        currentProfile={currentProfile}
        onProfileChange={handleProfileChange}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onOpenHouseholdModal={() => setIsHouseholdModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* 3. FISCAL CALENDAR ENGINE: Top Continuous Horizontal Axis (W1..W5 and M-T-W-T-F-S-S) */}
      <FiscalCalendarBar
        fiscalInfo={fiscalInfo}
        selectedWeek={selectedWeek}
        selectedDayIndex={selectedDayIndex}
        onSelectWeek={setSelectedWeek}
        onSelectDay={setSelectedDayIndex}
        activeTimeBlock={activeTimeBlock}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Phase 4: The "Daily Flow" Progress Ring (Prominently displayed when Flow Gamification is ON, disappears seamlessly when OFF) */}
        <DailyFlowRing
          chores={chores}
          activeTimeBlock={activeTimeBlock}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />

        {/* Desktop Primary Time-Block Tab Header Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-light text-[#1A3C40] dark:text-slate-100 font-display">
              {activeTimeBlock === 'morning' && 'Morning Rhythm'}
              {activeTimeBlock === 'evening' && 'Evening Cadence'}
              {activeTimeBlock === 'monthly' && 'Monthly Fiscal Cadence'}
            </h2>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[#EBF7F8] text-[#2D6A4F] dark:bg-teal-950 dark:text-teal-300 border border-[#A8DADC]/40">
              {activeTimeBlock === 'morning' && `${morningChores.length} tasks`}
              {activeTimeBlock === 'evening' && `${eveningChores.length} tasks`}
              {activeTimeBlock === 'monthly' && `${monthlyChores.length} tasks`}
            </span>
          </div>

          {/* Desktop Tab Selector Switcher (Morning | Evening | Monthly) */}
          <div className="hidden md:flex items-center p-1 bg-white dark:bg-[#142831] border border-[#F0EBE0] dark:border-[#284c5e] rounded-full shadow-xs">
            <button
              id="desktop-tab-morning"
              type="button"
              onClick={() => setActiveTimeBlock('morning')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition ${
                activeTimeBlock === 'morning'
                  ? 'bg-[#2D6A4F] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#2D6A4F]'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Morning</span>
              <span className="text-[10px] font-mono opacity-80">({morningChores.length})</span>
            </button>

            <button
              id="desktop-tab-evening"
              type="button"
              onClick={() => setActiveTimeBlock('evening')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition ${
                activeTimeBlock === 'evening'
                  ? 'bg-[#1A3C40] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#1A3C40]'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Evening</span>
              <span className="text-[10px] font-mono opacity-80">({eveningChores.length})</span>
            </button>

            <button
              id="desktop-tab-monthly"
              type="button"
              onClick={() => setActiveTimeBlock('monthly')}
              className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-medium transition ${
                activeTimeBlock === 'monthly'
                  ? 'bg-[#c04e6c] text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-[#c04e6c]'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Monthly</span>
              <span className="text-[10px] font-mono opacity-80">({monthlyChores.length})</span>
            </button>
          </div>

          {/* Quick Add Chore Action */}
          <button
            id="main-add-chore-button"
            type="button"
            onClick={() => openAddChoreModalWithRoom()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] text-white text-xs font-medium tracking-wide transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Chore</span>
          </button>
        </div>

        {/* Dashboard Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main Stage: Room-Based Clustering or Monthly Fiscal Grid */}
          <div className="lg:col-span-8 space-y-6">
            {household ? (
              activeTimeBlock === 'monthly' ? (
                /* 3. FISCAL CALENDAR ENGINE: 4-4-5 Grid View */
                <MonthlyFiscalGridView
                  fiscalInfo={fiscalInfo}
                  chores={chores}
                  householdId={household.id}
                  currentProfile={currentProfile}
                  selectedWeek={selectedWeek}
                  onSelectWeek={setSelectedWeek}
                  onOpenAddModal={(room, w, d) => {
                    setPreselectedRoom(room);
                    setIsAddChoreOpen(true);
                  }}
                />
              ) : (
                /* 2. ROOM-BASED CLUSTERING: Bedroom, Kitchen, Bathroom, Living Room, Sunroom, Office, Dinning Room, MISC */
                <RoomClusterView
                  chores={chores}
                  householdId={household.id}
                  activeTimeBlock={activeTimeBlock}
                  selectedWeek={selectedWeek}
                  selectedDayIndex={selectedDayIndex}
                  currentProfile={currentProfile}
                  onOpenAddModal={(room) => openAddChoreModalWithRoom(room)}
                />
              )
            ) : (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#142831] border border-[#F0EBE0] dark:border-[#284c5e] space-y-4">
                <Users className="w-10 h-10 text-[#A8DADC] mx-auto" />
                <h3 className="text-xl font-light text-[#1A3C40] dark:text-slate-100">
                  Connect Steve & Nicole's Space
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Join or create your household space to view synchronized room-based tasks and fiscal calendar rhythms.
                </p>
                <button
                  onClick={() => setIsHouseholdModalOpen(true)}
                  className="px-6 py-2.5 rounded-full bg-[#2D6A4F] text-white text-xs font-medium shadow-xs"
                >
                  Setup Household Space
                </button>
              </div>
            )}
          </div>

          {/* Right Rail: Rhythms & Flow Overview */}
          <aside className="lg:col-span-4 flex flex-col gap-6">
            
            {/* Household Flow & Ownership Rhythms */}
            <div className="bg-white dark:bg-[#142831] p-6 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                  Household Flow
                </h3>
                <span className="text-xs font-mono font-bold text-[#2D6A4F] dark:text-teal-300">
                  {flowPercentage}% Synchronized
                </span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden mb-4">
                <div
                  className="bg-[#2D6A4F] h-full transition-all duration-500 rounded-full"
                  style={{ width: `${flowPercentage}%` }}
                />
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#F0EBE0] dark:border-slate-800 text-center">
                <div className="p-2 rounded-2xl bg-[#2D6A4F]/10">
                  <p className="text-[10px] uppercase tracking-wider text-[#2D6A4F] font-semibold">
                    Steve
                  </p>
                  <p className="text-sm font-mono font-bold text-[#2D6A4F]">
                    {chores.filter((c) => c.owner === 'steve').length}
                  </p>
                </div>
                <div className="p-2 rounded-2xl bg-[#FFB3C1]/20">
                  <p className="text-[10px] uppercase tracking-wider text-[#c04e6c] font-semibold">
                    Nicole
                  </p>
                  <p className="text-sm font-mono font-bold text-[#c04e6c]">
                    {chores.filter((c) => c.owner === 'nicole').length}
                  </p>
                </div>
                <div className="p-2 rounded-2xl bg-[#F4F1DE] dark:bg-amber-950/30">
                  <p className="text-[10px] uppercase tracking-wider text-[#966b36] font-semibold">
                    Shared
                  </p>
                  <p className="text-sm font-mono font-bold text-[#966b36]">
                    {chores.filter((c) => c.owner === 'shared').length}
                  </p>
                </div>
              </div>

              {/* Phase 4: Gamification / Flow Setting Quick Toggle Row */}
              <div className="pt-3.5 mt-3.5 border-t border-[#F0EBE0] dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-teal-300" />
                  <div>
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                      Flow Gamification
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {flowGamification ? 'Liquid FX & Progress Ring' : 'Minimalist Checklist'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    id="sidebar-flow-toggle-switch"
                    type="button"
                    role="switch"
                    aria-checked={flowGamification}
                    onClick={toggleFlowGamification}
                    className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                      flowGamification ? 'bg-[#2D6A4F]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                    title={flowGamification ? 'Disable Gamification' : 'Enable Gamification'}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                        flowGamification ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                  <button
                    id="sidebar-flow-settings-button"
                    type="button"
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    title="Open Settings"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Frequency Engine Ledger Card */}
            <div className="bg-white dark:bg-[#142831] p-6 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1.5">
                  <Repeat className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span>Frequency Engine</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-[#2D6A4F] dark:bg-teal-950 dark:text-teal-300 font-medium">
                  3 Cadence Types
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FDFBF7] dark:bg-slate-900 border border-[#F0EBE0] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#2D6A4F]" />
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Daily Routines</p>
                      <p className="text-[10px] text-slate-400">Bed, Vanity, Cat Bowls (Milo & Louis)</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {chores.filter((c) => c.frequency === 'daily').length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FDFBF7] dark:bg-slate-900 border border-[#F0EBE0] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Repeat className="w-4 h-4 text-[#1A3C40] dark:text-teal-300" />
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Specific Day</p>
                      <p className="text-[10px] text-slate-400">Run Lomi, Dump Lomi</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {chores.filter((c) => c.frequency === 'specific_day').length}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-2xl bg-[#FDFBF7] dark:bg-slate-900 border border-[#F0EBE0] dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#c04e6c]" />
                    <div>
                      <p className="font-semibold text-slate-700 dark:text-slate-200">Monthly / Flex</p>
                      <p className="text-[10px] text-slate-400">Finance Check in, Air filter</p>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-200 text-sm">
                    {chores.filter((c) => c.frequency === 'monthly_flex').length}
                  </span>
                </div>
              </div>
            </div>

            {/* Sync & Household Code Card */}
            {household && (
              <div className="bg-white dark:bg-[#142831] p-6 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs uppercase tracking-widest text-slate-400 font-semibold">
                    Multi-Device Sync
                  </h3>
                  <span className="flex items-center gap-1 text-[11px] text-[#2D6A4F] font-mono">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Firestore Live
                  </span>
                </div>

                <div className="p-3 bg-[#EBF7F8]/60 dark:bg-teal-950/30 rounded-2xl border border-[#A8DADC]/40 flex items-center justify-between mb-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#2D6A4F] tracking-wider block">
                      Sync Code
                    </span>
                    <span className="text-lg font-mono font-extrabold tracking-widest text-[#1A3C40] dark:text-teal-200">
                      {household.syncCode}
                    </span>
                  </div>
                  <button
                    id="copy-sync-code-btn"
                    onClick={handleCopySyncCode}
                    className="p-2 rounded-xl bg-[#2D6A4F] text-white hover:bg-[#23533e] transition shadow-xs text-xs"
                    title="Copy sync code"
                  >
                    {copiedSyncCode ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="truncate max-w-[170px]">{household.name}</span>
                  <button
                    onClick={() => setIsHouseholdModalOpen(true)}
                    className="text-[#2D6A4F] dark:text-teal-300 font-medium hover:underline"
                  >
                    Manage
                  </button>
                </div>
              </div>
            )}

            {/* Mermaid Mascot Sanctuary Card */}
            <div className="bg-white dark:bg-[#142831] p-6 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs flex flex-col items-center text-center">
              <MermaidMascot size="lg" />
              <h4 className="font-display text-base font-normal text-[#1A3C40] dark:text-teal-200 mt-3">
                Household Harmony
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[220px] leading-relaxed italic">
                "Balanced morning and evening rhythms guide peace in your sanctuary."
              </p>
            </div>

          </aside>
        </div>
      </main>

      {/* 1. TIME-BLOCKED DASHBOARDS: Mobile-First Bottom-Sheet Navigation Ergonomics */}
      <BottomSheetNav
        activeTimeBlock={activeTimeBlock}
        onChangeTimeBlock={setActiveTimeBlock}
        onOpenAddModal={(room) => openAddChoreModalWithRoom(room)}
        currentProfile={currentProfile}
        onToggleProfile={handleToggleProfile}
        selectedWeek={selectedWeek}
        onSelectWeek={setSelectedWeek}
        morningCount={morningChores.length}
        eveningCount={eveningChores.length}
        monthlyCount={monthlyChores.length}
      />

      {/* Modals */}
      {household && (
        <AddChoreModal
          isOpen={isAddChoreOpen}
          onClose={() => setIsAddChoreOpen(false)}
          householdId={household.id}
          defaultOwner={currentProfile}
          initialRoom={preselectedRoom}
          initialTimeBlock={activeTimeBlock}
          initialFiscalWeek={selectedWeek}
          initialDayOfWeek={selectedDayIndex}
        />
      )}

      <HouseholdSyncModal
        isOpen={isHouseholdModalOpen}
        onClose={() => setIsHouseholdModalOpen(false)}
        user={user}
        household={household}
        currentProfile={currentProfile}
        onHouseholdUpdated={(newH) => setHousehold(newH)}
        onProfileChange={handleProfileChange}
        onRequireAuth={handleLogin}
      />

      {/* Phase 4: Gamification & Experience Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        household={household}
        currentProfile={currentProfile}
        onOpenHouseholdModal={() => setIsHouseholdModalOpen(true)}
      />
    </div>
  );
}
