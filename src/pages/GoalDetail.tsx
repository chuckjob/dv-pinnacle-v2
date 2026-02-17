import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, X } from 'lucide-react';
import { mockGoals, newGoal5, refreshedGoal5 } from '@/data/mock-goals';
import { useVera } from '@/hooks/use-vera';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { MetricCard } from '@/components/shared/MetricCard';
import { cn } from '@/lib/utils';
import { formatNumber, formatCompactCurrency, formatPercent, formatDate, formatCpm } from '@/lib/formatters';
import type { Platform } from '@/types/goal';
import { CampaignTreeTable } from '@/components/goals/CampaignTreeTable';
import { GoalTrendsChart } from '@/components/goals/GoalTrendsChart';
import { GoalPillarCards } from '@/components/goals/GoalPillarCards';
import { MonitoringModeBanner } from '@/components/goals/MonitoringModeBanner';

const objectiveLabels: Record<string, string> = {
  'brand-awareness': 'Brand Awareness',
  'lead-generation': 'Lead Generation',
  'conversions': 'Conversions',
  'reach': 'Reach',
  'engagement': 'Engagement',
  'video-views': 'Video Views',
};

export default function GoalDetail() {
  const { goalId } = useParams();
  const navigate = useNavigate();
  const { goalCreated, goalConnectedDspLabel, goalPlatform, goalMediaType, goalName: contextGoalName, refreshedGoalIds } = useVera();

  // Build combined goals list including Vera-created goal
  const allGoals = useMemo(() => {
    if (!goalCreated) return mockGoals;
    const wizardOverrides = {
      connectedDsp: goalConnectedDspLabel || undefined,
      ...(goalPlatform ? { platform: goalPlatform, platforms: [goalPlatform] } : {}),
      ...(goalMediaType ? { mediaType: goalMediaType } : {}),
      ...(contextGoalName ? { name: contextGoalName } : {}),
    } as const;
    const goal5Data = refreshedGoalIds.has('goal-5')
      ? { ...refreshedGoal5, ...wizardOverrides }
      : { ...newGoal5, ...wizardOverrides };
    return [goal5Data, ...mockGoals];
  }, [goalCreated, goalConnectedDspLabel, goalPlatform, goalMediaType, contextGoalName, refreshedGoalIds]);

  const goal = allGoals.find(g => g.id === goalId);

  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<Platform>>(
    () => new Set(goal?.platforms ?? [])
  );

  const allSelected = goal ? selectedPlatforms.size === goal.platforms.length : true;

  // Filter campaigns by selected platforms
  const filteredCampaigns = useMemo(() => {
    if (!goal) return [];
    if (allSelected) return goal.campaigns;
    return goal.campaigns.filter(c => selectedPlatforms.has(c.platform));
  }, [goal, selectedPlatforms, allSelected]);

  // Recompute metrics from filtered campaigns
  const metrics = useMemo(() => {
    if (!goal) return null;

    if (allSelected) {
      return {
        impressions: goal.totalImpressions,
        spend: goal.totalSpend,
        suitability: goal.brandSuitabilityRate,
        fraud: goal.fraudRate,
        viewability: goal.viewabilityRate,
        attention: goal.attentionIndex,
        authenticAdRate: goal.authenticAdRate,
        inGeo: goal.inGeoRate,
        blockRate: goal.blockRate,
      };
    }

    const camps = filteredCampaigns;
    if (camps.length === 0) {
      return { impressions: 0, spend: 0, suitability: 0, fraud: 0, viewability: 0, attention: 0, authenticAdRate: 0, inGeo: 0, blockRate: 0 };
    }

    const totalImpressions = camps.reduce((sum, c) => sum + c.impressions, 0);
    const spendShare = goal.totalImpressions > 0 ? totalImpressions / goal.totalImpressions : 0;
    const estimatedSpend = goal.totalSpend * spendShare;
    const weightedViewability = camps.reduce((sum, c) => sum + c.viewabilityRate * c.impressions, 0) / totalImpressions;
    const weightedFraud = camps.reduce((sum, c) => sum + c.fraudScore * c.impressions, 0) / totalImpressions;
    const weightedAttention = Math.round(camps.reduce((sum, c) => sum + c.attentionIndex * c.impressions, 0) / totalImpressions);
    const weightedAuthenticRate = camps.reduce((sum, c) => sum + c.authenticAdRate * c.impressions, 0) / totalImpressions;
    const weightedInGeo = camps.reduce((sum, c) => sum + c.inGeoRate * c.impressions, 0) / totalImpressions;
    const suitability = camps.reduce((sum, c) => sum + c.brandSuitabilityRate * c.impressions, 0) / totalImpressions;
    const weightedBlockRate = camps.reduce((sum, c) => sum + c.blockRate * c.impressions, 0) / totalImpressions;

    return {
      impressions: totalImpressions,
      spend: estimatedSpend,
      suitability,
      fraud: weightedFraud,
      viewability: weightedViewability,
      attention: weightedAttention,
      authenticAdRate: weightedAuthenticRate,
      inGeo: weightedInGeo,
      blockRate: weightedBlockRate,
    };
  }, [goal, allSelected, filteredCampaigns]);

  if (!goal || !metrics) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-body2 text-cool-500">Goal not found</p>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h4 text-cool-900">{goal.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-body3 text-cool-500">{objectiveLabels[goal.objective]}</span>
              <span className="text-cool-300">·</span>
              <div className="flex items-center gap-1 text-body3 text-cool-500">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(goal.dateRange.start)} — {formatDate(goal.dateRange.end)}
              </div>
              <span className="text-cool-300">·</span>
              <span className="text-body3 text-cool-500">{goal.campaigns.length} campaigns</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge healthStatus={goal.healthStatus} />
            <StatusBadge status={goal.status} />
          </div>
        </div>

        {/* Platform — single badge for single-platform goals, filter chips for multi-platform (legacy) */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {goal.platforms.length <= 1 ? (
            <PlatformBadge platform={goal.platform ?? goal.platforms[0]} size="md" />
          ) : (
            goal.platforms.map(p => {
              const isActive = selectedPlatforms.has(p);
              return (
                <button
                  key={p}
                  onClick={() => {
                    const next = new Set(selectedPlatforms);
                    if (isActive) {
                      if (next.size > 1) next.delete(p);
                    } else {
                      next.add(p);
                    }
                    setSelectedPlatforms(next);
                  }}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-full text-body3 font-medium transition-colors border h-8 px-3',
                    isActive
                      ? 'border-plum-300 bg-plum-50 text-plum-700'
                      : 'border-neutral-200 bg-white text-cool-500 hover:border-neutral-300 hover:text-cool-700'
                  )}
                >
                  <PlatformBadge platform={p} size="md" className="bg-transparent p-0" />
                  {isActive && (
                    <span
                      role="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (selectedPlatforms.size > 1) {
                          const next = new Set(selectedPlatforms);
                          next.delete(p);
                          setSelectedPlatforms(next);
                        }
                      }}
                      className="rounded-full hover:bg-plum-100 p-0.5 transition-colors -mr-1"
                    >
                      <X className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Monitoring Mode Banner — shows when no DSP connected */}
      {!goal.connectedDsp && (
        <div className="mb-6">
          <MonitoringModeBanner safetyTier={goal.safetyTier} goalId={goal.id} />
        </div>
      )}

      {/* Financial + Delivery Metrics */}
      {goal.connectedDsp ? (
        /* ── DSP connected: show Media Waste + CPAI alongside Spend, Impressions, Block Rate ── */
        <>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <MetricCard
              label="Media Waste"
              value={formatCompactCurrency(
                metrics.spend * (1 - metrics.authenticAdRate / 100)
              )}
              description="Spend on non-authentic impressions"
              variant={metrics.spend * (1 - metrics.authenticAdRate / 100) > 50_000 ? 'warning' : 'default'}
              valueClassName="text-h4"
              className="p-5"
            />
            <MetricCard
              label="Cost per Authentic Impression"
              value={formatCpm(
                metrics.impressions * (metrics.authenticAdRate / 100) > 0
                  ? metrics.spend / (metrics.impressions * (metrics.authenticAdRate / 100))
                  : 0
              )}
              description="Effective CPM for authentic impressions"
              valueClassName="text-h4"
              className="p-5"
            />
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <MetricCard
              label="Total Spend"
              value={formatCompactCurrency(metrics.spend)}
              valueClassName="text-h5"
              className="p-4"
              trend={3.1}
              trendDirection="up"
              isPositive={false}
            />
            <MetricCard
              label="Impressions"
              value={formatNumber(metrics.impressions)}
              valueClassName="text-h5"
              className="p-4"
              trend={5.2}
              trendDirection="up"
              isPositive
            />
            <MetricCard
              label="Block Rate"
              value={formatPercent(metrics.blockRate)}
              description="Blocked by pre-bid protection"
              valueClassName="text-h5"
              className="p-4"
            />
          </div>
        </>
      ) : (
        /* ── No DSP: standard spend + impressions + block rate ── */
        <div className="grid grid-cols-3 gap-3 mb-4">
          <MetricCard
            label="Total Spend"
            value={formatCompactCurrency(metrics.spend)}
            valueClassName="text-h3"
            className="p-6"
            trend={3.1}
            trendDirection="up"
            isPositive={false}
          />
          <MetricCard
            label="Impressions"
            value={formatNumber(metrics.impressions)}
            valueClassName="text-h3"
            className="p-6"
            trend={5.2}
            trendDirection="up"
            isPositive
          />
          <MetricCard
            label="Block Rate"
            value={formatPercent(metrics.blockRate)}
            description="Impressions blocked by pre-bid protection"
            valueClassName="text-h3"
            className="p-6"
          />
        </div>
      )}

      {/* AAR + Quality Pillars + Recommendations (unified card) */}
      <div className="mb-6">
        <GoalPillarCards
          authenticAdRate={metrics.authenticAdRate}
          fraud={metrics.fraud}
          suitability={metrics.suitability}
          viewability={metrics.viewability}
          inGeo={metrics.inGeo}
        />
      </div>

      {/* KPI Targets + Performance Trends — side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {goal.kpis.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="text-body3 font-semibold text-cool-700 mb-3">KPI Targets</h3>
            <div className="space-y-4">
              {goal.kpis.map(kpi => {
                const pct = kpi.unit === '$' ? (kpi.target / kpi.current) * 100 : (kpi.current / kpi.target) * 100;
                const onTarget = kpi.unit === '$' ? kpi.current <= kpi.target : kpi.current >= kpi.target;
                return (
                  <div key={kpi.type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-label text-cool-600">{kpi.label}</span>
                      <span className={cn('text-label font-semibold', onTarget ? 'text-grass-600' : 'text-tomato-500')}>
                        {kpi.unit === '$' ? `$${kpi.current.toFixed(2)}` : `${kpi.current.toFixed(1)}%`}
                        <span className="text-cool-400 font-normal"> / {kpi.unit === '$' ? `$${kpi.target.toFixed(2)}` : `${kpi.target}%`}</span>
                      </span>
                    </div>
                    <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', onTarget ? 'bg-grass-500' : 'bg-orange-500')} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <GoalTrendsChart goal={goal} />
      </div>

      {/* Campaigns */}
      <div className="border-t border-neutral-100 pt-4">
        <CampaignTreeTable campaigns={filteredCampaigns} goalId={goal.id} onNavigate={navigate} />
      </div>
    </div>
  );
}
