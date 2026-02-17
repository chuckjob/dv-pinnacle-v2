import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronDown, Sparkles, Target } from 'lucide-react';
import { mockGoals, newGoal5, refreshedGoal5 } from '@/data/mock-goals';
import { GoalCard } from '@/components/goals/GoalCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { cn } from '@/lib/utils';
import { useVera } from '@/hooks/use-vera';
import type { HealthStatus } from '@/types/goal';

const filters: { label: string; value: HealthStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'On Track', value: 'on-track' },
  { label: 'At Risk', value: 'at-risk' },
  { label: 'Needs Attention', value: 'needs-attention' },
];

export default function Goals() {
  const navigate = useNavigate();
  const { openVeraWithContext, goalCreated, goalConnectedDspLabel, refreshedGoalIds, addRefreshedGoalId, veraOpen } = useVera();
  const [statusFilter, setStatusFilter] = useState<HealthStatus | 'all'>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const createRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (createRef.current && !createRef.current.contains(e.target as Node)) {
        setCreateOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const goal5Data = refreshedGoalIds.has('goal-5')
    ? { ...refreshedGoal5, connectedDsp: goalConnectedDspLabel || undefined }
    : { ...newGoal5, connectedDsp: goalConnectedDspLabel || undefined };
  const allGoals = goalCreated ? [goal5Data, ...mockGoals] : mockGoals;

  const filtered = statusFilter === 'all'
    ? allGoals
    : allGoals.filter(g => g.healthStatus === statusFilter);

  return (
    <div className="min-w-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h4 text-cool-900">Goals</h1>
          <p className="text-body3 text-cool-500 mt-0.5">Manage and monitor your campaign goals</p>
        </div>
        <div ref={createRef} className="relative inline-flex rounded-lg overflow-visible">
          <button
            onClick={() => navigate('/goals/create')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-l-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Goal
          </button>
          <div className="w-px bg-plum-500" />
          <button
            onClick={() => setCreateOpen(!createOpen)}
            className="inline-flex items-center px-2.5 py-2.5 rounded-r-lg bg-plum-600 text-white hover:bg-plum-700 transition-colors"
            aria-label="More create options"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', createOpen && 'rotate-180')} />
          </button>
          {createOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 rounded-lg border border-neutral-200 bg-white shadow-elevation-raised py-1 z-20">
              <button
                onClick={() => { setCreateOpen(false); navigate('/goals/create'); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-body3 text-cool-700 hover:bg-neutral-50 transition-colors"
              >
                <Plus className="h-4 w-4 text-cool-500" />
                Create manually
              </button>
              <button
                onClick={() => { setCreateOpen(false); openVeraWithContext('goal-create'); }}
                className="flex items-center gap-2 w-full px-3 py-2 text-body3 text-cool-700 hover:bg-neutral-50 transition-colors"
              >
                <Sparkles className="h-4 w-4 text-plum-500" />
                Create with Vera
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Status filters */}
      <div className="flex items-center gap-1 mb-6">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-body3 font-medium transition-colors',
              statusFilter === f.value
                ? 'bg-plum-600 text-white'
                : 'text-cool-600 hover:bg-neutral-100'
            )}
          >
            {f.label}
            {f.value !== 'all' && (
              <span className="ml-1.5 text-label">
                ({allGoals.filter(g => g.healthStatus === f.value).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Goal cards grid */}
      {filtered.length > 0 ? (
        <div className={cn('grid gap-4', veraOpen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2')}>
          {filtered.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onClick={() => navigate(`/goals/${goal.id}`)}
              onConnectDsp={() => openVeraWithContext('goal-create')}
              onRefreshData={(id) => addRefreshedGoalId(id)}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Target}
          title="No goals found"
          description="Create your first goal to get started with campaign optimization."
          action={
            <button
              onClick={() => navigate('/goals/create')}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Goal
            </button>
          }
        />
      )}
    </div>
  );
}
