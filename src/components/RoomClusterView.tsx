import React, { useState } from 'react';
import {
  Bed,
  UtensilsCrossed,
  Bath,
  Sofa,
  Sun,
  Laptop,
  Wine,
  Layers,
  Plus,
  Trash2,
  Repeat,
  Calendar,
  Sparkles
} from 'lucide-react';
import type { Chore, RoomLocation, TaskOwner, TaskStatus, TimeBlock, TaskFrequency, ProfileName } from '../types';
import { ROOM_LOCATIONS } from '../types';
import { updateChoreStatus, updateChoreOwner, deleteChore } from '../lib/firebase';
import { CompletionBubble } from './CompletionBubble';

interface RoomClusterViewProps {
  chores: Chore[];
  householdId: string;
  activeTimeBlock: TimeBlock;
  selectedWeek: number;
  selectedDayIndex: number;
  currentProfile: ProfileName;
  onOpenAddModal: (preselectedRoom?: RoomLocation) => void;
}

const ROOM_ICONS: Record<RoomLocation, React.ReactNode> = {
  Bedroom: <Bed className="w-4 h-4" />,
  Kitchen: <UtensilsCrossed className="w-4 h-4" />,
  Bathroom: <Bath className="w-4 h-4" />,
  'Living Room': <Sofa className="w-4 h-4" />,
  Sunroom: <Sun className="w-4 h-4" />,
  Office: <Laptop className="w-4 h-4" />,
  'Dinning Room': <Wine className="w-4 h-4" />,
  MISC: <Layers className="w-4 h-4" />,
};

export const RoomClusterView: React.FC<RoomClusterViewProps> = ({
  chores,
  householdId,
  activeTimeBlock,
  selectedWeek,
  selectedDayIndex,
  currentProfile,
  onOpenAddModal,
}) => {
  const [filterOwner, setFilterOwner] = useState<TaskOwner | 'all'>('all');
  const [filterFrequency, setFilterFrequency] = useState<TaskFrequency | 'all'>('all');
  const [selectedRoomFilter, setSelectedRoomFilter] = useState<RoomLocation | 'all'>('all');

  // Filter chores by timeblock, owner, frequency, and room
  const timeBlockChores = chores.filter((c) => c.timeBlock === activeTimeBlock);

  const filteredChores = timeBlockChores.filter((c) => {
    if (filterOwner !== 'all' && c.owner !== filterOwner) return false;
    if (filterFrequency !== 'all' && c.frequency !== filterFrequency) return false;
    if (selectedRoomFilter !== 'all' && c.room !== selectedRoomFilter) return false;
    return true;
  });

  const handleToggleStatus = async (chore: Chore) => {
    const nextStatus: TaskStatus = chore.status === 'done' ? 'todo' : 'done';
    const executor = nextStatus === 'done' ? (currentProfile.toLowerCase() as TaskOwner) : null;
    try {
      await updateChoreStatus(householdId, chore.id, nextStatus, executor);
    } catch (err) {
      console.error('Failed to update chore status:', err);
    }
  };

  const handleOwnerChange = async (choreId: string, newOwner: TaskOwner) => {
    try {
      await updateChoreOwner(householdId, choreId, newOwner);
    } catch (err) {
      console.error('Failed to change chore owner:', err);
    }
  };

  const handleDelete = async (choreId: string) => {
    try {
      await deleteChore(householdId, choreId);
    } catch (err) {
      console.error('Failed to delete chore:', err);
    }
  };

  const getOwnerBadgeStyle = (owner: TaskOwner) => {
    switch (owner) {
      case 'steve':
        return {
          bg: 'bg-[#2D6A4F]/10 dark:bg-[#2D6A4F]/20',
          text: 'text-[#2D6A4F] dark:text-teal-300',
          border: 'border-[#2D6A4F]/30',
          dot: 'bg-[#2D6A4F]',
          name: 'Steve',
        };
      case 'nicole':
        return {
          bg: 'bg-[#FFB3C1]/20 dark:bg-[#FFB3C1]/15',
          text: 'text-[#c04e6c] dark:text-pink-300',
          border: 'border-[#FFB3C1]/50',
          dot: 'bg-[#FFB3C1]',
          name: 'Nicole',
        };
      case 'shared':
      default:
        return {
          bg: 'bg-[#F4F1DE] dark:bg-amber-950/20',
          text: 'text-[#966b36] dark:text-amber-300',
          border: 'border-[#D2B48C]/40',
          dot: 'bg-[#D2B48C]',
          name: 'Shared',
        };
    }
  };

  // Group filtered chores by room
  const choresByRoom: Record<RoomLocation, Chore[]> = ROOM_LOCATIONS.reduce(
    (acc, room) => {
      acc[room] = filteredChores.filter((c) => c.room === room);
      return acc;
    },
    {} as Record<RoomLocation, Chore[]>
  );

  const roomsToDisplay = selectedRoomFilter === 'all'
    ? ROOM_LOCATIONS
    : [selectedRoomFilter];

  return (
    <div id="room-based-clustering-view" className="space-y-6">
      {/* Filtering & Control Bar */}
      <div className="bg-white dark:bg-[#142831] p-4 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Ownership Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 pl-1 pr-1 shrink-0">
              Owner:
            </span>
            <button
              id="filter-owner-all"
              type="button"
              onClick={() => setFilterOwner('all')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 ${
                filterOwner === 'all'
                  ? 'bg-[#1A3C40] text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
              }`}
            >
              All Owners
            </button>
            <button
              id="filter-owner-steve"
              type="button"
              onClick={() => setFilterOwner('steve')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                filterOwner === 'steve'
                  ? 'bg-[#2D6A4F] text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#2D6A4F]/10'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
              <span>Steve</span>
            </button>
            <button
              id="filter-owner-nicole"
              type="button"
              onClick={() => setFilterOwner('nicole')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                filterOwner === 'nicole'
                  ? 'bg-[#d94f70] text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#FFB3C1]/20'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#FFB3C1]" />
              <span>Nicole</span>
            </button>
            <button
              id="filter-owner-shared"
              type="button"
              onClick={() => setFilterOwner('shared')}
              className={`px-3 py-1 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1.5 ${
                filterOwner === 'shared'
                  ? 'bg-[#966b36] text-white shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-[#F4F1DE]'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#D2B48C]" />
              <span>Shared</span>
            </button>
          </div>

          {/* Room Selector & Add Task */}
          <div className="flex items-center gap-2 overflow-x-auto self-end lg:self-auto">
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 shrink-0">
              Room:
            </span>
            <select
              id="room-jump-select"
              value={selectedRoomFilter}
              onChange={(e) => setSelectedRoomFilter(e.target.value as RoomLocation | 'all')}
              className="text-xs bg-[#FDFBF7] dark:bg-slate-800 border border-[#F0EBE0] dark:border-slate-700 rounded-full px-3 py-1 text-slate-700 dark:text-slate-200 outline-hidden font-medium"
            >
              <option value="all">All Rooms ({timeBlockChores.length})</option>
              {ROOM_LOCATIONS.map((r) => (
                <option key={r} value={r}>
                  {r} ({timeBlockChores.filter((c) => c.room === r).length})
                </option>
              ))}
            </select>

            <button
              id="quick-add-chore-btn"
              type="button"
              onClick={() => onOpenAddModal(selectedRoomFilter !== 'all' ? selectedRoomFilter : undefined)}
              className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] text-white text-xs font-medium transition shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Frequency Engine Filter Bar */}
        <div className="pt-2.5 border-t border-[#F0EBE0] dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto">
          <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 pl-1 pr-1 shrink-0 flex items-center gap-1">
            <Repeat className="w-3 h-3 text-[#2D6A4F]" />
            <span>Frequency:</span>
          </span>
          <button
            type="button"
            onClick={() => setFilterFrequency('all')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 ${
              filterFrequency === 'all'
                ? 'bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            All Frequencies
          </button>
          <button
            type="button"
            onClick={() => setFilterFrequency('daily')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1 ${
              filterFrequency === 'daily'
                ? 'bg-[#2D6A4F] text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>Daily Routines</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterFrequency('specific_day')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1 ${
              filterFrequency === 'specific_day'
                ? 'bg-[#1A3C40] text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Repeat className="w-3 h-3" />
            <span>Specific Day Assignments</span>
          </button>
          <button
            type="button"
            onClick={() => setFilterFrequency('monthly_flex')}
            className={`px-2.5 py-1 rounded-full text-xs font-medium transition shrink-0 flex items-center gap-1 ${
              filterFrequency === 'monthly_flex'
                ? 'bg-[#c04e6c] text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>Monthly / Flex Tasks</span>
          </button>
        </div>
      </div>

      {/* Room Clusters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {roomsToDisplay.map((room) => {
          const roomChores = choresByRoom[room] || [];
          const completedCount = roomChores.filter((c) => c.status === 'done').length;

          return (
            <div
              key={room}
              id={`room-cluster-${room.toLowerCase().replace(/\s+/g, '-')}`}
              className="bg-white dark:bg-[#142831] rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] p-5 shadow-xs flex flex-col justify-between"
            >
              {/* Room Header */}
              <div>
                <div className="flex items-center justify-between mb-3.5 pb-3 border-b border-[#F0EBE0] dark:border-slate-800">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-2xl bg-[#EBF7F8] text-[#2D6A4F] dark:bg-teal-950 dark:text-teal-300 flex items-center justify-center">
                      {ROOM_ICONS[room]}
                    </div>
                    <div>
                      <h4 className="text-base font-medium text-[#1A3C40] dark:text-slate-100 flex items-center gap-2">
                        <span>{room}</span>
                        <span className="text-[11px] font-normal text-slate-400 font-mono">
                          ({completedCount}/{roomChores.length})
                        </span>
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenAddModal(room)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-[#2D6A4F] hover:bg-[#EBF7F8] dark:hover:bg-slate-800 transition"
                    title={`Add task to ${room}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Chores in this room */}
                {roomChores.length === 0 ? (
                  <div className="py-6 px-4 text-center rounded-2xl bg-slate-50/60 dark:bg-slate-900/40 border border-dashed border-[#F0EBE0] dark:border-slate-800 text-xs text-slate-400">
                    <p>No matching {activeTimeBlock} tasks in {room}.</p>
                    <button
                      type="button"
                      onClick={() => onOpenAddModal(room)}
                      className="mt-2 text-[#2D6A4F] dark:text-teal-300 font-medium hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add one now</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {roomChores.map((chore) => {
                      const isDone = chore.status === 'done';
                      const ownerStyle = getOwnerBadgeStyle(chore.owner);

                      return (
                        <div
                          key={chore.id}
                          className={`group p-3 rounded-2xl border transition flex items-start justify-between gap-3 ${
                            isDone
                              ? 'bg-slate-50/70 dark:bg-slate-900/30 border-slate-200/60 dark:border-slate-800 opacity-75'
                              : 'bg-white dark:bg-[#142831] border-[#F0EBE0] dark:border-[#284c5e] hover:border-[#A8DADC]'
                          }`}
                        >
                          {/* COMPLETION MARKER BUBBLE strictly per specification:
                              - Uncompleted: Outlined bubble in assigned ownership color
                                (Sea Green for Steve, Light Pink for Nicole, Beige for Shared)
                              - Upon execution: Fills with avatar color of the person who completed it! */}
                          <div className="pt-0.5 shrink-0">
                            <CompletionBubble
                              owner={chore.owner}
                              status={chore.status}
                              completedBy={chore.completedBy}
                              onToggle={() => handleToggleStatus(chore)}
                              size="md"
                            />
                          </div>

                          {/* Chore Title & Details */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-sm font-medium ${
                                  isDone
                                    ? 'line-through text-slate-400 dark:text-slate-500'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {chore.title}
                              </span>

                              {/* Owner Badge */}
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${ownerStyle.bg} ${ownerStyle.text} ${ownerStyle.border}`}
                              >
                                <span className={`w-1.5 h-1.5 rounded-full ${ownerStyle.dot}`} />
                                <span>{ownerStyle.name}</span>
                              </span>

                              {/* Frequency Engine Pill */}
                              {chore.frequency === 'daily' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-[#2D6A4F] dark:text-emerald-300">
                                  <Sun className="w-2.5 h-2.5" />
                                  <span>Daily</span>
                                </span>
                              )}
                              {chore.frequency === 'specific_day' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300">
                                  <Repeat className="w-2.5 h-2.5" />
                                  <span>{chore.specificDay ? `Every ${chore.specificDay}` : 'Specific Day'}</span>
                                </span>
                              )}
                              {chore.frequency === 'monthly_flex' && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>W{chore.fiscalWeek || 1} Monthly</span>
                                </span>
                              )}

                              {/* Completed By Indicator (shows if completed by someone other than owner, or completer badge) */}
                              {isDone && chore.completedBy && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800">
                                  <span>done by {chore.completedBy}</span>
                                </span>
                              )}
                            </div>

                            {chore.description && (
                              <p className="text-xs text-slate-400 dark:text-slate-400 mt-1 line-clamp-1">
                                {chore.description}
                              </p>
                            )}
                          </div>

                          {/* Actions: Owner Quick Switch + Delete */}
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition shrink-0">
                            <select
                              value={chore.owner}
                              onChange={(e) => handleOwnerChange(chore.id, e.target.value as TaskOwner)}
                              className="text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-1.5 py-0.5 text-slate-500 font-medium"
                              title="Reassign ownership"
                            >
                              <option value="steve">Steve</option>
                              <option value="nicole">Nicole</option>
                              <option value="shared">Shared</option>
                            </select>

                            <button
                              type="button"
                              onClick={() => handleDelete(chore.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 transition"
                              title="Delete chore"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Room Footer Mini Progress Bar */}
              {roomChores.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#F0EBE0] dark:border-slate-800">
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-[#2D6A4F] h-full transition-all duration-300 rounded-full"
                      style={{
                        width: `${(completedCount / roomChores.length) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
