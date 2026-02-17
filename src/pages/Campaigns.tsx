import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Megaphone, ArrowUpDown, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockGoals, newGoal5 } from '@/data/mock-goals';
import { flattenCampaigns, unassignedCampaigns } from '@/data/mock-campaigns';
import { useVera } from '@/hooks/use-vera';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { getAuthenticRateColor } from '@/lib/authentic-ad-utils';
import { formatNumber, formatCompactCurrency, formatPercent } from '@/lib/formatters';
import type { FlatCampaign, EntityStatus, Platform } from '@/types/goal';

type SortKey = 'name' | 'goalName' | 'authenticAdRate' | 'impressions' | 'spend' | 'viewabilityRate';
type SortDir = 'asc' | 'desc';

const statusFilters: { label: string; value: EntityStatus | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Draft', value: 'draft' },
  { label: 'Paused', value: 'paused' },
];

const platformFilters: { label: string; value: Platform | 'all' }[] = [
  { label: 'All Platforms', value: 'all' },
  { label: 'Open Web', value: 'open-web' },
  { label: 'Meta', value: 'meta' },
  { label: 'YouTube', value: 'youtube' },
  { label: 'TikTok', value: 'tiktok' },
  { label: 'Snapchat', value: 'snapchat' },
  { label: 'CTV', value: 'ctv' },
];

export default function Campaigns() {
  const navigate = useNavigate();
  const { goalCreated, goalConnectedDspLabel, goalPlatform, goalMediaType, goalName: contextGoalName } = useVera();

  const [statusFilter, setStatusFilter] = useState<EntityStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<Platform | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [goalAssignments, setGoalAssignments] = useState<Record<string, string>>({});

  // Build goals list
  const allGoals = useMemo(() => {
    const wizardOverrides = {
      connectedDsp: goalConnectedDspLabel || undefined,
      ...(goalPlatform ? { platform: goalPlatform, platforms: [goalPlatform] } : {}),
      ...(goalMediaType ? { mediaType: goalMediaType } : {}),
      ...(contextGoalName ? { name: contextGoalName } : {}),
    } as const;
    const goal5Data = { ...newGoal5, ...wizardOverrides };
    return goalCreated ? [goal5Data, ...mockGoals] : mockGoals;
  }, [goalCreated, goalConnectedDspLabel, goalPlatform, goalMediaType, contextGoalName]);

  // Flatten all campaigns from goals + unassigned
  const allCampaigns: FlatCampaign[] = useMemo(() => {
    const fromGoals = flattenCampaigns(allGoals);
    return [...fromGoals, ...unassignedCampaigns];
  }, [allGoals]);

  // Filter
  const filtered = useMemo(() => {
    let result = allCampaigns;
    if (statusFilter !== 'all') {
      result = result.filter(c => c.status === statusFilter);
    }
    if (platformFilter !== 'all') {
      result = result.filter(c => c.platform === platformFilter);
    }
    return result;
  }, [allCampaigns, statusFilter, platformFilter]);

  // Sort
  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortKey) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'goalName':
          aVal = (goalAssignments[a.id] ? allGoals.find(g => g.id === goalAssignments[a.id])?.name : a.goalName ?? '')?.toLowerCase() ?? '';
          bVal = (goalAssignments[b.id] ? allGoals.find(g => g.id === goalAssignments[b.id])?.name : b.goalName ?? '')?.toLowerCase() ?? '';
          break;
        case 'authenticAdRate':
          aVal = a.authenticAdRate;
          bVal = b.authenticAdRate;
          break;
        case 'impressions':
          aVal = a.impressions;
          bVal = b.impressions;
          break;
        case 'spend':
          aVal = a.spend;
          bVal = b.spend;
          break;
        case 'viewabilityRate':
          aVal = a.viewabilityRate;
          bVal = b.viewabilityRate;
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filtered, sortKey, sortDir, goalAssignments, allGoals]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  function handleRowClick(campaign: FlatCampaign) {
    const assignedGoalId = goalAssignments[campaign.id] || campaign.goalId;
    if (assignedGoalId) {
      navigate(`/goals/${assignedGoalId}/campaigns/${campaign.id}`);
    } else {
      navigate(`/campaigns/${campaign.id}`);
    }
  }

  function SortHeader({ label, sortKeyVal, className }: { label: string; sortKeyVal: SortKey; className?: string }) {
    const isActive = sortKey === sortKeyVal;
    return (
      <button
        onClick={() => handleSort(sortKeyVal)}
        className={cn('inline-flex items-center gap-1 text-label font-semibold uppercase tracking-wide hover:text-cool-700 transition-colors', isActive ? 'text-cool-700' : 'text-cool-400', className)}
      >
        {label}
        <ArrowUpDown className={cn('h-3 w-3', isActive ? 'text-plum-500' : 'text-cool-300')} />
      </button>
    );
  }

  return (
    <div className="min-w-0">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-h4 text-cool-900">Campaigns</h1>
          <p className="text-body3 text-cool-500 mt-0.5">All campaigns across your goals</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        {/* Status chips */}
        <div className="flex items-center gap-1">
          {statusFilters.map(f => (
            <button
              key={f.value}
              onClick={() => setStatusFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-full text-body3 font-medium transition-colors',
                statusFilter === f.value
                  ? 'bg-plum-600 text-white'
                  : 'bg-neutral-100 text-cool-600 hover:bg-neutral-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Platform dropdown */}
        <div className="relative">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value as Platform | 'all')}
            className="h-9 pl-3 pr-8 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 appearance-none cursor-pointer"
          >
            {platformFilters.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-cool-400 pointer-events-none" />
        </div>

        {/* Count */}
        <span className="text-body3 text-cool-400 ml-auto">
          {sorted.length} campaign{sorted.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-25">
                <th className="text-left px-4 py-3">
                  <SortHeader label="Campaign" sortKeyVal="name" />
                </th>
                <th className="text-left px-3 py-3">
                  <span className="text-label font-semibold text-cool-400 uppercase tracking-wide">Platform</span>
                </th>
                <th className="text-left px-3 py-3">
                  <SortHeader label="Goal" sortKeyVal="goalName" />
                </th>
                <th className="text-left px-3 py-3">
                  <span className="text-label font-semibold text-cool-400 uppercase tracking-wide">Status</span>
                </th>
                <th className="text-left px-3 py-3">
                  <span className="text-label font-semibold text-cool-400 uppercase tracking-wide">Health</span>
                </th>
                <th className="text-right px-3 py-3">
                  <SortHeader label="AAR" sortKeyVal="authenticAdRate" className="justify-end" />
                </th>
                <th className="text-right px-3 py-3">
                  <SortHeader label="Impressions" sortKeyVal="impressions" className="justify-end" />
                </th>
                <th className="text-right px-3 py-3">
                  <SortHeader label="Spend" sortKeyVal="spend" className="justify-end" />
                </th>
                <th className="text-right px-3 py-3">
                  <SortHeader label="Viewable" sortKeyVal="viewabilityRate" className="justify-end" />
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map(campaign => {
                const assignedGoalId = goalAssignments[campaign.id];
                const effectiveGoalName = assignedGoalId
                  ? allGoals.find(g => g.id === assignedGoalId)?.name ?? ''
                  : campaign.goalName;
                const isUnassigned = !campaign.goalId && !assignedGoalId;

                return (
                  <tr
                    key={campaign.id}
                    onClick={() => handleRowClick(campaign)}
                    className="border-b border-neutral-50 last:border-b-0 hover:bg-plum-25/40 cursor-pointer transition-colors"
                  >
                    {/* Campaign Name */}
                    <td className="px-4 py-3">
                      <p className="text-body3 font-semibold text-cool-900 truncate max-w-[240px]">{campaign.name}</p>
                    </td>

                    {/* Platform */}
                    <td className="px-3 py-3">
                      <PlatformBadge platform={campaign.platform} size="sm" />
                    </td>

                    {/* Goal */}
                    <td className="px-3 py-3">
                      {isUnassigned ? (
                        <div className="relative" onClick={e => e.stopPropagation()}>
                          <select
                            value={assignedGoalId ?? ''}
                            onChange={e => {
                              if (e.target.value) {
                                setGoalAssignments(prev => ({ ...prev, [campaign.id]: e.target.value }));
                              }
                            }}
                            className="h-8 pl-2.5 pr-7 text-label bg-orange-25 border border-orange-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 appearance-none cursor-pointer text-orange-700 font-medium max-w-[160px]"
                          >
                            <option value="">Assign Goal...</option>
                            {allGoals.map(g => (
                              <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 text-orange-400 pointer-events-none" />
                        </div>
                      ) : (
                        <p className="text-body3 text-cool-600 truncate max-w-[160px]">{effectiveGoalName}</p>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-3 py-3">
                      <StatusBadge status={campaign.status} />
                    </td>

                    {/* Health */}
                    <td className="px-3 py-3">
                      <StatusBadge healthStatus={campaign.healthStatus} />
                    </td>

                    {/* AAR */}
                    <td className="px-3 py-3 text-right">
                      <span className={cn('text-body3 font-semibold', getAuthenticRateColor(campaign.authenticAdRate))}>
                        {campaign.authenticAdRate > 0 ? formatPercent(campaign.authenticAdRate) : '—'}
                      </span>
                    </td>

                    {/* Impressions */}
                    <td className="px-3 py-3 text-right">
                      <span className="text-body3 text-cool-700">
                        {campaign.impressions > 0 ? formatNumber(campaign.impressions) : '—'}
                      </span>
                    </td>

                    {/* Spend */}
                    <td className="px-3 py-3 text-right">
                      <span className="text-body3 text-cool-700">
                        {campaign.spend > 0 ? formatCompactCurrency(campaign.spend) : '—'}
                      </span>
                    </td>

                    {/* Viewable */}
                    <td className="px-3 py-3 text-right">
                      <span className="text-body3 text-cool-700">
                        {campaign.viewabilityRate > 0 ? formatPercent(campaign.viewabilityRate) : '—'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center">
                    <Megaphone className="h-8 w-8 text-cool-300 mx-auto mb-3" />
                    <p className="text-body3 text-cool-500">No campaigns match your filters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
