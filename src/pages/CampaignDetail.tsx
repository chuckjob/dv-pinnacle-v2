import { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Sparkles } from 'lucide-react';
import { mockGoals, newGoal5, refreshedGoal5 } from '@/data/mock-goals';
import { unassignedCampaigns } from '@/data/mock-campaigns';
import { useVera } from '@/hooks/use-vera';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { MetricCard } from '@/components/shared/MetricCard';
import { formatDate, formatCompactCurrency, formatCpm, formatPercent } from '@/lib/formatters';
import { computeDiagnosticMetrics } from '@/lib/campaign-diagnostics';
import { GoalPillarCards } from '@/components/goals/GoalPillarCards';
import { AdSetExplorer } from '@/components/campaign/AdSetExplorer';

export default function CampaignDetail() {
  const { goalId, campaignId } = useParams();
  const { goalCreated, goalConnectedDspLabel, goalPlatform, goalMediaType, goalName: contextGoalName, refreshedGoalIds, openVeraWithContext, appliedRecIds } = useVera();

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

  // Find campaign: first try via goalId param, then search all goals, then unassigned
  const { goal, campaign } = useMemo(() => {
    if (goalId) {
      const g = allGoals.find(g => g.id === goalId);
      const c = g?.campaigns.find(c => c.id === campaignId);
      if (g && c) return { goal: g, campaign: c };
    }
    // Search all goals for this campaign
    for (const g of allGoals) {
      const c = g.campaigns.find(c => c.id === campaignId);
      if (c) return { goal: g, campaign: c };
    }
    // Check unassigned campaigns
    const unassigned = unassignedCampaigns.find(c => c.id === campaignId);
    if (unassigned) return { goal: null, campaign: unassigned };
    return { goal: null, campaign: null };
  }, [goalId, campaignId, allGoals]);

  const [selectedAdSetId, setSelectedAdSetId] = useState<string | null>(
    campaign?.adSets[0]?.id ?? null
  );

  if (!campaign) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-body2 text-cool-500">Campaign not found</p>
      </div>
    );
  }

  const diagnostics = computeDiagnosticMetrics(campaign);

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-h4 text-cool-900">{campaign.name}</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <PlatformBadge platform={campaign.platform} />
              <span className="text-cool-300">·</span>
              <div className="flex items-center gap-1 text-body3 text-cool-500">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(campaign.firstSeen)} — {formatDate(campaign.lastSeen)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge healthStatus={campaign.healthStatus} />
            <StatusBadge status={campaign.status} />
          </div>
        </div>
      </div>

      {/* Analyze with Vera banner — shown for at-risk campaigns */}
      {campaign.healthStatus === 'at-risk' && (
        <button
          onClick={() => openVeraWithContext('campaign-analyze')}
          className="w-full flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-gradient-to-r from-plum-50 via-plum-25 to-white border border-plum-200 hover:border-plum-300 hover:shadow-sm transition-all group"
        >
          <div className="w-8 h-8 rounded-lg bg-plum-100 flex items-center justify-center flex-shrink-0 group-hover:bg-plum-200 transition-colors">
            <Sparkles className="h-4 w-4 text-plum-600" />
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-body3 font-semibold text-cool-900">Analyze with Vera</p>
            <p className="text-label text-cool-500">Get AI-powered insights on what's driving underperformance and how to fix it</p>
          </div>
          <span className="text-body3 font-medium text-plum-600 flex-shrink-0 group-hover:text-plum-700 transition-colors">Open →</span>
        </button>
      )}

      {/* Hero Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <MetricCard
          label="Media Waste"
          value={formatCompactCurrency(diagnostics.mediaWaste)}
          description="Spend on non-authentic impressions"
          variant={diagnostics.mediaWaste > 50_000 ? 'warning' : 'default'}
        />
        <MetricCard
          label="Cost per Authentic Impression"
          value={formatCpm(diagnostics.cpai)}
          description="Effective CPM for authentic impressions"
        />
        <MetricCard
          label="Block Rate"
          value={formatPercent(campaign.blockRate)}
          description="Impressions blocked by pre-bid protection"
        />
      </div>

      {/* AAR + Quality Pillars + Recommendations */}
      <div className="mb-6">
        <GoalPillarCards
          authenticAdRate={campaign.authenticAdRate}
          fraud={campaign.fraudScore}
          suitability={campaign.brandSuitabilityRate}
          viewability={campaign.viewabilityRate}
          inGeo={campaign.inGeoRate}
          appliedRecIds={appliedRecIds}
        />
      </div>

      {/* Ad Set Explorer (split-pane) */}
      <AdSetExplorer
        campaign={campaign}
        selectedAdSetId={selectedAdSetId}
        onAdSetSelect={setSelectedAdSetId}
      />
    </div>
  );
}
