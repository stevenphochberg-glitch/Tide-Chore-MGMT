import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  Trash2,
  Sparkles,
  Plus,
  Filter,
  Check,
  UserCheck,
  Calendar
} from 'lucide-react';
import type { Chore, TaskOwner, TaskStatus } from '../types';
import { updateChoreStatus, updateChoreOwner, deleteChore } from '../lib/firebase';

interface ChoreListProps {
  chores: Chore[];
  householdId: string;
  onOpenAddModal: () => void;
}

export const ChoreList: React.FC<ChoreListProps> = ({
  chores,
  householdId,
  onOpenAddModal,
}) => {
  const [filterOwner, setFilterOwner] = useState<TaskOwner | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all');

  const filteredChores = chores.filter((chore) => {
    if (filterOwner !== 'all' && chore.owner !== filterOwner) return false;
    if (filterStatus !== 'all' && chore.status !== filterStatus) return false;
    return true;
  });

  const handleToggleStatus = async (chore: Chore) => {
    const nextStatus: TaskStatus = chore.status === 'done' ? 'todo' : 'done';
    try {
      await updateChoreStatus(householdId, chore.id, nextStatus);
    } catch (err) {
      console.error('Failed to toggle chore status:', err);
    }
  };

  const handleOwnerChange = async (choreId: string, newOwner: TaskOwner) => {
    try {
      await updateChoreOwner(householdId, choreId, newOwner);
    } catch (err) {
      console.error('Failed to update chore owner:', err);
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
          taskClass: 'task-steve',
          backgroundColor: 'rgba(45, 106, 79, 0.05)',
          borderColor: 'rgba(45, 106, 79, 0.25)',
          color: '#2D6A4F',
          dotColor: '#2D6A4F',
          label: 'Steve',
        };
      case 'nicole':
        return {
          taskClass: 'task-nicole',
          backgroundColor: 'rgba(255, 179, 193, 0.08)',
          borderColor: 'rgba(255, 179, 193, 0.4)',
          color: '#c04e6c',
          dotColor: '#FFB3C1',
          label: 'Nicole',
        };
      case 'shared':
      default:
        return {
          taskClass: 'task-shared',
          backgroundColor: 'rgba(210, 180, 140, 0.08)',
          borderColor: 'rgba(210, 180, 140, 0.35)',
          color: '#966b36',
          dotColor: '#D2B48C',
          label: 'Either / Shared',
        };
    }
  };

  return (
    <div id="chore-list-container" className="space-y-4">
      {/* Action Bar & Clean Minimal Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-[#142831] p-4 rounded-3xl border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs">
        
        {/* Ownership Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            id="filter-all"
            onClick={() => setFilterOwner('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
              filterOwner === 'all'
                ? 'bg-[#1A3C40] text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-800'
            }`}
          >
            All ({chores.length})
          </button>

          {/* Steve Filter (Sea Green) */}
          <button
            id="filter-steve"
            onClick={() => setFilterOwner('steve')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
              filterOwner === 'steve'
                ? 'bg-[#2D6A4F] text-white font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-[#2D6A4F]/30 text-[#2D6A4F] hover:bg-[#2D6A4F]/10'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#2D6A4F]" />
            <span>Steve</span>
          </button>

          {/* Nicole Filter (Light Pink) */}
          <button
            id="filter-nicole"
            onClick={() => setFilterOwner('nicole')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
              filterOwner === 'nicole'
                ? 'bg-[#FFB3C1] text-slate-900 font-semibold shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-[#FFB3C1]/50 text-pink-600 hover:bg-[#FFB3C1]/15'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#FFB3C1]" />
            <span>Nicole</span>
          </button>

          {/* Shared Filter (Sand) */}
          <button
            id="filter-shared"
            onClick={() => setFilterOwner('shared')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition whitespace-nowrap ${
              filterOwner === 'shared'
                ? 'bg-[#F4F1DE] text-[#966b36] border border-[#D2B48C] font-bold shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-[#D2B48C]/40 text-[#966b36] hover:bg-[#F4F1DE]/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-[#D2B48C]" />
            <span>Shared</span>
          </button>
        </div>

        {/* Add Chore Trigger Button */}
        <button
          id="add-chore-button"
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[#2D6A4F] hover:bg-[#23533e] text-white text-xs font-medium tracking-wide transition shadow-xs shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>New Chore</span>
        </button>
      </div>

      {/* Chores Stream */}
      {filteredChores.length === 0 ? (
        <div className="text-center py-12 px-6 rounded-3xl bg-white dark:bg-[#142831] border border-[#F0EBE0] dark:border-[#284c5e] shadow-xs">
          <div className="w-12 h-12 rounded-full bg-[#EBF7F8] text-[#2D6A4F] flex items-center justify-center mx-auto mb-3">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-light text-[#1A3C40] dark:text-slate-200 font-display">
            The tide is still.
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            No active chores found for this filter. Add your household rhythms to begin syncing.
          </p>
          <button
            id="empty-add-chore-button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[#2D6A4F] text-white text-xs font-medium tracking-wide hover:bg-[#23533e] transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add First Chore</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChores.map((chore) => {
            const badge = getOwnerBadgeStyle(chore.owner);
            const isDone = chore.status === 'done';

            return (
              <div
                key={chore.id}
                id={`chore-card-${chore.id}`}
                className={`p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#142831] shadow-sm border border-[#F0EBE0] dark:border-[#284c5e] transition ${
                  badge.taskClass
                } ${isDone ? 'opacity-55' : ''}`}
              >
                {/* Left details */}
                <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                  <button
                    id={`toggle-status-${chore.id}`}
                    onClick={() => handleToggleStatus(chore)}
                    className="mt-0.5 sm:mt-0 transition shrink-0"
                    title={isDone ? 'Mark as Active' : 'Mark as Completed'}
                  >
                    {isDone ? (
                      <div className="w-6 h-6 rounded-full bg-[#2D6A4F] flex items-center justify-center text-white shadow-xs">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-slate-300 hover:border-[#2D6A4F] transition" />
                    )}
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm font-semibold transition truncate ${
                        isDone
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-[#1A3C40] dark:text-slate-100'
                      }`}
                    >
                      {chore.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <p className="text-xs text-slate-400">
                        Owner: {badge.label}
                      </p>
                      {chore.description && (
                        <>
                          <span className="text-slate-300 dark:text-slate-700 text-xs">•</span>
                          <span className="text-xs text-slate-400 truncate max-w-xs">
                            {chore.description}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right actions: quick reassign and delete */}
                <div className="flex items-center justify-between sm:justify-end gap-3 pl-9 sm:pl-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#F0EBE0]/60 dark:border-slate-800">
                  {/* Quick Reassign Controls */}
                  <div className="flex items-center gap-1.5" title="Quick reassign owner">
                    <button
                      onClick={() => handleOwnerChange(chore.id, 'steve')}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition ${
                        chore.owner === 'steve'
                          ? 'bg-[#2D6A4F] text-white border-[#2D6A4F] ring-1 ring-[#2D6A4F]'
                          : 'bg-white text-[#2D6A4F] border-[#2D6A4F]/40 opacity-50 hover:opacity-100'
                      }`}
                      title="Reassign to Steve"
                    >
                      S
                    </button>
                    <button
                      onClick={() => handleOwnerChange(chore.id, 'nicole')}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition ${
                        chore.owner === 'nicole'
                          ? 'bg-[#FFB3C1] text-slate-900 border-[#FFB3C1] ring-1 ring-[#FFB3C1]'
                          : 'bg-white text-[#FFB3C1] border-[#FFB3C1]/50 opacity-50 hover:opacity-100'
                      }`}
                      title="Reassign to Nicole"
                    >
                      N
                    </button>
                    <button
                      onClick={() => handleOwnerChange(chore.id, 'shared')}
                      className={`w-5 h-5 rounded-full border flex items-center justify-center text-[9px] font-bold transition ${
                        chore.owner === 'shared'
                          ? 'bg-[#D2B48C] text-white border-[#D2B48C] ring-1 ring-[#D2B48C]'
                          : 'bg-white text-[#D2B48C] border-[#D2B48C]/40 opacity-50 hover:opacity-100'
                      }`}
                      title="Reassign to Shared"
                    >
                      E
                    </button>
                  </div>

                  {/* Delete button */}
                  <button
                    id={`delete-chore-${chore.id}`}
                    onClick={() => handleDelete(chore.id)}
                    className="text-slate-300 hover:text-rose-500 transition p-1"
                    title="Delete Chore"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
