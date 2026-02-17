import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, ArrowRight, Check, AlertTriangle, Info } from 'lucide-react';
import { mockGoals } from '@/data/mock-goals';
import { MetricCard } from '@/components/shared/MetricCard';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { IssueBadgeList } from '@/components/shared/IssueBadge';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { DataTable, type ColumnDef } from '@/components/shared/DataTable';
import { formatNumber, formatCompactCurrency, formatPercent } from '@/lib/formatters';
import { getIssues, getAuthenticRateColor } from '@/lib/authentic-ad-utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { Goal, Platform } from '@/types/goal';

/* ─── Driver labels ──────────────────────────────────────────── */
const DRIVER_LABELS: Record<string, string> = {
  Fraud: 'Fraud (Bot/SIVT traffic)',
  Viewability: 'Viewability (Below threshold)',
  Suitability: 'Suitability (Unsafe content)',
  Geography: 'Geography (Out of market)',
};

function getPrimaryDriver(goals: Goal[]): string | null {
  const imps = goals.reduce((s, g) => s + g.totalImpressions, 0);
  if (imps === 0) return null;
  const pillars = [
    { key: 'Fraud', value: 100 - (goals.reduce((s, g) => s + g.fraudRate * g.totalImpressions, 0) / imps), threshold: 98 },
    { key: 'Viewability', value: goals.reduce((s, g) => s + g.viewabilityRate * g.totalImpressions, 0) / imps, threshold: 70 },
    { key: 'Suitability', value: goals.reduce((s, g) => s + g.brandSuitabilityRate * g.totalImpressions, 0) / imps, threshold: 95 },
    { key: 'Geography', value: goals.reduce((s, g) => s + g.inGeoRate * g.totalImpressions, 0) / imps, threshold: 95 },
  ];
  const failing = pillars
    .filter(p => p.value < p.threshold)
    .sort((a, b) => (a.value - a.threshold) - (b.value - b.threshold));
  return failing[0]?.key ?? null;
}

export default function Overview() {
  const navigate = useNavigate();

  const hasAnyDsp = mockGoals.some(g => g.connectedDsp);
  const totalImpressions = mockGoals.reduce((sum, g) => sum + g.totalImpressions, 0);
  const totalSpend = mockGoals.reduce((sum, g) => sum + g.totalSpend, 0);
  const weightedBlockRate = mockGoals.reduce((sum, g) => sum + g.blockRate * g.totalImpressions, 0) / totalImpressions;

  const needsAttention = mockGoals.filter(g => g.healthStatus === 'needs-attention');
  const atRisk = mockGoals.filter(g => g.healthStatus === 'at-risk');
  const activeGoals = mockGoals.filter(g => g.status === 'active');

  // ─── Channel Mix: group by platform ──────────────────────────
  const channelData = useMemo(() => {
    const byPlatform: Record<string, Goal[]> = {};
    for (const g of mockGoals) {
      const p = g.platform ?? g.platforms[0];
      if (!byPlatform[p]) byPlatform[p] = [];
      byPlatform[p].push(g);
    }

    return Object.entries(byPlatform)
      .map(([platform, goals]) => {
        const imps = goals.reduce((s, g) => s + g.totalImpressions, 0);
        const spend = goals.reduce((s, g) => s + g.totalSpend, 0);
        const aar = goals.reduce((s, g) => s + g.authenticAdRate * g.totalImpressions, 0) / imps;
        const blockRate = goals.reduce((s, g) => s + g.blockRate * g.totalImpressions, 0) / imps;
        const driverKey = getPrimaryDriver(goals);
        return { platform: platform as Platform, goals: goals.length, imps, spend, aar, blockRate, driverKey };
      })
      .sort((a, b) => b.imps - a.imps);
  }, []);

  // Overall totals for Initiative Total row
  const overallAar = mockGoals.reduce((s, g) => s + g.authenticAdRate * g.totalImpressions, 0) / totalImpressions;
  const overallDriverKey = getPrimaryDriver(mockGoals);

  // ─── Goals table columns (conditional Spend) ─────────────────
  const goalColumns: ColumnDef<Goal>[] = useMemo(() => {
    const cols: ColumnDef<Goal>[] = [
      {
        id: 'name',
        header: 'Goal Name',
        accessor: 'name',
        sortable: true,
        render: (val) => <span className="font-medium text-cool-900">{val}</span>,
      },
      {
        id: 'platform',
        header: 'Platform',
        accessor: (row: Goal) => row.platform ?? row.platforms[0],
        render: (_val, row) => <PlatformBadge platform={(row.platform ?? row.platforms[0]) as Platform} size="sm" />,
      },
    ];

    if (hasAnyDsp) {
      cols.push({
        id: 'totalSpend',
        header: 'Total Spend',
        accessor: 'totalSpend',
        sortable: true,
        align: 'right',
        render: (val) => <span className="font-medium text-cool-900">{formatCompactCurrency(val)}</span>,
      });
    }

    cols.push(
      {
        id: 'authenticAdRate',
        header: 'Authentic Ad Rate',
        accessor: 'authenticAdRate',
        sortable: true,
        align: 'right',
        render: (val) => (
          <span className={cn('font-semibold', getAuthenticRateColor(val))}>
            {formatPercent(val)}
          </span>
        ),
      },
      {
        id: 'blockRate',
        header: 'Block Rate',
        accessor: 'blockRate',
        sortable: true,
        align: 'right',
        render: (val) => (
          <span className={cn('font-medium', val > 10 ? 'text-orange-600' : 'text-cool-700')}>
            {formatPercent(val)}
          </span>
        ),
      },
      {
        id: 'issue',
        header: 'Issue',
        accessor: (row: Goal) => getIssues(row).length,
        render: (_val, row) => <IssueBadgeList issues={getIssues(row)} />,
      },
      {
        id: 'status',
        header: 'Status',
        accessor: 'healthStatus',
        render: (val) => <StatusBadge healthStatus={val} />,
      },
    );

    return cols;
  }, [hasAnyDsp]);

  return (
    <div className="min-w-0">
      <div className="mb-6">
        <h1 className="text-h4 text-cool-900">Overview</h1>
        <p className="text-body3 text-cool-500 mt-0.5">Cross-goal performance at a glance</p>
      </div>

      {/* Vera Insights */}
      <div className="rounded-xl border border-plum-200 bg-plum-25 p-4 mb-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-plum-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="h-4 w-4 text-plum-600" />
          </div>
          <div>
            <h3 className="text-body3 font-semibold text-plum-800">Vera Insights</h3>
            <p className="text-body3 text-cool-600 mt-0.5">
              {needsAttention.length > 0 && (
                <span className="text-tomato-600 font-medium">{needsAttention.length} goal{needsAttention.length > 1 ? 's' : ''} need{needsAttention.length === 1 ? 's' : ''} attention. </span>
              )}
              {atRisk.length > 0 && (
                <span className="text-orange-600 font-medium">{atRisk.length} goal{atRisk.length > 1 ? 's are' : ' is'} at risk. </span>
              )}
              {activeGoals.length > 0 && (
                <span>You have {activeGoals.length} active goal{activeGoals.length > 1 ? 's' : ''} running across {new Set(mockGoals.flatMap(g => g.platforms)).size} platforms.</span>
              )}
              {needsAttention.length === 0 && atRisk.length === 0 && (
                <span className="text-grass-600 font-medium">All goals on track.</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Metric Cards — conditional Spend */}
      <div className={cn('grid gap-3 mb-4', hasAnyDsp ? 'grid-cols-3' : 'grid-cols-2')}>
        {hasAnyDsp && (
          <MetricCard
            label="Total Spend"
            value={formatCompactCurrency(totalSpend)}
            valueClassName="text-h3"
            className="p-6"
            trend={2.3}
            trendDirection="up"
            isPositive={false}
          />
        )}
        <MetricCard
          label="Impressions"
          value={formatNumber(totalImpressions)}
          valueClassName="text-h3"
          className="p-6"
          trend={4.8}
          trendDirection="up"
          isPositive
        />
        <MetricCard
          label="Block Rate"
          value={formatPercent(weightedBlockRate)}
          valueClassName="text-h3"
          className="p-6"
          variant={weightedBlockRate > 10 ? 'warning' : 'default'}
          description="Impressions blocked by pre-bid protection"
        />
      </div>

      {/* Channel Mix */}
      <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-neutral-100">
          <h3 className="text-body2 font-semibold text-cool-900">Channel Mix</h3>
          <p className="text-label text-cool-500 mt-0.5">Authentic Ad Rate by platform</p>
        </div>

        {/* Table header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-2.5 bg-neutral-25 border-b border-neutral-100">
          <div className="col-span-3">
            <span className="text-label font-semibold text-cool-400 uppercase tracking-wide">Platform</span>
          </div>
          <div className="col-span-2 text-right">
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="inline-flex items-center gap-1 text-label font-semibold text-cool-400 uppercase tracking-wide hover:text-cool-600 transition-colors">
                  AAR
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start" className="max-w-[360px] p-0">
                <div className="px-4 pt-3 pb-2 border-b border-neutral-100">
                  <p className="text-body3 font-semibold text-cool-900">How AAR is Calculated</p>
                </div>
                <div className="px-4 py-3 space-y-3">
                  <p className="text-label leading-relaxed text-cool-600">
                    The Authentic Ad Rate (AAR) is your universal quality bar.
                    While the math changes by platform, an impression only counts
                    as Authentic if it passes these core filters:
                  </p>
                  <ul className="space-y-2 text-label leading-relaxed text-cool-600">
                    <li className="flex gap-2">
                      <span className="text-cool-400 flex-shrink-0 mt-px">•</span>
                      <span><span className="font-semibold text-cool-700">Display & Video (Open Web):</span> Must be Fraud-Free, Viewable, Brand-Safe, and In-Geo.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cool-400 flex-shrink-0 mt-px">•</span>
                      <span><span className="font-semibold text-cool-700">Social (Meta/TikTok):</span> Focuses on Viewability and Adjacency (is your ad next to safe content?).</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cool-400 flex-shrink-0 mt-px">•</span>
                      <span><span className="font-semibold text-cool-700">YouTube:</span> Prioritizes Channel-level Suitability and Viewability.</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-cool-400 flex-shrink-0 mt-px">•</span>
                      <span><span className="font-semibold text-cool-700">CTV:</span> Primarily audits for Fraud (SIVT) and Geography.</span>
                    </li>
                  </ul>
                </div>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="col-span-2 text-right">
            <span className="text-label font-semibold text-cool-400 uppercase tracking-wide">Block Rate</span>
          </div>
          <div className="col-span-5">
            <span className="text-label font-semibold text-cool-400 uppercase tracking-wide">Primary Non-Authentic Driver</span>
          </div>
        </div>

        {/* Platform rows */}
        {channelData.map(ch => (
          <div
            key={ch.platform}
            onClick={() => navigate(`/goals?platform=${ch.platform}`)}
            className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-neutral-50 last:border-b-0 items-center hover:bg-neutral-25 transition-colors cursor-pointer"
          >
            {/* Platform */}
            <div className="col-span-3 flex items-center gap-2 min-w-0">
              <PlatformBadge platform={ch.platform} size="md" />
              <span className="text-label text-cool-400">{ch.goals} goal{ch.goals !== 1 ? 's' : ''}</span>
            </div>

            {/* AAR */}
            <div className="col-span-2 text-right">
              <span className={cn('text-body2 font-bold', getAuthenticRateColor(ch.aar))}>
                {formatPercent(ch.aar)}
              </span>
            </div>

            {/* Block Rate */}
            <div className="col-span-2 text-right">
              <span className={cn('text-body3 font-medium', ch.blockRate > 10 ? 'text-orange-600' : 'text-cool-700')}>
                {formatPercent(ch.blockRate)}
              </span>
            </div>

            {/* Primary Driver */}
            <div className="col-span-5 min-w-0">
              {ch.driverKey ? (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-25 border border-orange-100">
                  <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                  <span className="text-label font-medium text-orange-700 truncate">
                    {DRIVER_LABELS[ch.driverKey] ?? ch.driverKey}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-grass-25 border border-grass-100">
                  <Check className="h-3 w-3 text-grass-500 flex-shrink-0" />
                  <span className="text-label font-medium text-grass-700">All pillars passing</span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Initiative Total row */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-neutral-25 border-t border-neutral-200 items-center">
          <div className="col-span-3">
            <span className="text-body3 font-semibold text-cool-900">Initiative Total</span>
          </div>
          <div className="col-span-2 text-right">
            <span className={cn('text-body2 font-bold', getAuthenticRateColor(overallAar))}>
              {formatPercent(overallAar)}
            </span>
          </div>
          <div className="col-span-2 text-right">
            <span className={cn('text-body3 font-semibold', weightedBlockRate > 10 ? 'text-orange-600' : 'text-cool-700')}>
              {formatPercent(weightedBlockRate)}
            </span>
          </div>
          <div className="col-span-5 min-w-0">
            {overallDriverKey ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-25 border border-orange-100">
                <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                <span className="text-label font-medium text-orange-700 truncate">
                  {DRIVER_LABELS[overallDriverKey] ?? overallDriverKey}
                </span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-grass-25 border border-grass-100">
                <Check className="h-3 w-3 text-grass-500 flex-shrink-0" />
                <span className="text-label font-medium text-grass-700">All pillars passing</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Goals Table */}
      <div className="border-t border-neutral-100 pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-body2 font-semibold text-cool-900">All Goals</h3>
          <button
            onClick={() => navigate('/goals')}
            className="inline-flex items-center gap-1 text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
          >
            View all
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        <DataTable
          data={mockGoals}
          columns={goalColumns}
          keyAccessor="id"
          onRowClick={(g) => navigate(`/goals/${g.id}`)}
          pageSize={10}
          className="border-0 shadow-none"
        />
      </div>
    </div>
  );
}
