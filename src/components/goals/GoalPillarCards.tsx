import { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, TrendingUp, Sparkles, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPercent } from '@/lib/formatters';
import { getAuthenticRateColor } from '@/lib/authentic-ad-utils';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { GOAL_PILLAR_RECOMMENDATIONS } from '@/lib/campaign-diagnostics';
import type { GoalPillarRecommendation } from '@/lib/campaign-diagnostics';

const BASENAME = '/dv-pinnacle-v3';

/** Maps recommendation index → projected lift details */
const APPLIED_ACTION_DETAILS: Record<number, { label: string; liftLow: number; liftHigh: number }> = {
  0: { label: 'Viewability floor targeting', liftLow: 6, liftHigh: 10 },
  1: { label: 'Geographic targeting constraints', liftLow: 1, liftHigh: 2 },
};

interface PillarDef {
  key: string;
  label: string;
  value: number;
  threshold: number;
  passing: boolean;
  rec: GoalPillarRecommendation | null;
}

interface GoalPillarCardsProps {
  authenticAdRate: number;
  fraud: number;
  suitability: number;
  viewability: number;
  inGeo: number;
  appliedRecIds?: Set<number>;
}

export function GoalPillarCards({ authenticAdRate, fraud, suitability, viewability, inGeo, appliedRecIds }: GoalPillarCardsProps) {
  const fraudFree = 100 - fraud;
  const [liftTooltipOpen, setLiftTooltipOpen] = useState(false);

  const pillars: PillarDef[] = [
    {
      key: 'fraud',
      label: 'Fraud-Free',
      value: fraudFree,
      threshold: 98,
      passing: fraudFree >= 98,
      rec: fraudFree < 98 ? GOAL_PILLAR_RECOMMENDATIONS.fraud : null,
    },
    {
      key: 'suitability',
      label: 'Brand Suitable',
      value: suitability,
      threshold: 95,
      passing: suitability >= 95,
      rec: suitability < 95 ? GOAL_PILLAR_RECOMMENDATIONS.suitability : null,
    },
    {
      key: 'viewability',
      label: 'Viewable',
      value: viewability,
      threshold: 70,
      passing: viewability >= 70,
      rec: viewability < 70 ? GOAL_PILLAR_RECOMMENDATIONS.viewability : null,
    },
    {
      key: 'inGeo',
      label: 'In-Geo',
      value: inGeo,
      threshold: 95,
      passing: inGeo >= 95,
      rec: inGeo < 95 ? GOAL_PILLAR_RECOMMENDATIONS.inGeo : null,
    },
  ];

  const failingPillars = pillars.filter(p => !p.passing);

  // Compute projected lift from applied actions
  const appliedActions = appliedRecIds
    ? Array.from(appliedRecIds)
        .map(id => APPLIED_ACTION_DETAILS[id])
        .filter(Boolean)
    : [];
  const hasProjectedLift = appliedActions.length > 0;
  const totalLiftLow = appliedActions.reduce((sum, a) => sum + a.liftLow, 0);
  const totalLiftHigh = appliedActions.reduce((sum, a) => sum + a.liftHigh, 0);
  const projectedAarLow = authenticAdRate + totalLiftLow;
  const projectedAarHigh = authenticAdRate + totalLiftHigh;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
      {/* AAR Header + Pillar sub-metrics */}
      <div className="p-5">
        <div className="mb-4">
          <div className="flex items-center gap-1">
            <span className="text-label font-medium text-cool-500 uppercase tracking-wide">DV Authentic Ad Rate</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-cool-400 hover:text-cool-600 transition-colors" aria-label="What is Authentic Ad Rate?">
                  <Info className="h-3 w-3" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="top" align="start" className="max-w-[320px] p-4">
                <p className="text-body3 font-semibold text-cool-900 mb-1.5">
                  Authentic Ad Rate: {formatPercent(authenticAdRate)}
                </p>
                <p className="text-label text-cool-600 mb-2">
                  The percentage of impressions that were simultaneously:
                </p>
                <ul className="space-y-1 text-label text-cool-600 mb-2">
                  <li className="flex gap-1.5">
                    <span className="text-cool-400 flex-shrink-0">•</span>
                    <span><span className="font-medium text-cool-700">Fraud-Free:</span> Served to a real person, not a bot.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-cool-400 flex-shrink-0">•</span>
                    <span><span className="font-medium text-cool-700">Viewable:</span> Seen on screen for at least one continuous second.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-cool-400 flex-shrink-0">•</span>
                    <span><span className="font-medium text-cool-700">Suitable:</span> Delivered in an environment safe for your brand.</span>
                  </li>
                  <li className="flex gap-1.5">
                    <span className="text-cool-400 flex-shrink-0">•</span>
                    <span><span className="font-medium text-cool-700">In-Geo:</span> Served within your targeted geographic market.</span>
                  </li>
                </ul>
                <div className="pt-2 mt-2 border-t border-neutral-100">
                  <p className="text-label font-semibold text-cool-700 mb-1.5">Industry Benchmark: 75%</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-neutral-100 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', authenticAdRate >= 75 ? 'bg-grass-500' : authenticAdRate >= 60 ? 'bg-orange-500' : 'bg-tomato-500')}
                        style={{ width: `${Math.min(authenticAdRate, 100)}%` }}
                      />
                    </div>
                    <span className={cn(
                      'text-label font-semibold',
                      authenticAdRate >= 75 ? 'text-grass-700' : authenticAdRate >= 60 ? 'text-orange-700' : 'text-tomato-700'
                    )}>
                      {authenticAdRate >= 75 ? 'Above' : authenticAdRate >= 60 ? 'Below' : 'Well below'}
                    </span>
                  </div>
                  <p className="text-caption text-cool-500 mt-1.5">
                    {authenticAdRate >= 75
                      ? 'Your rate exceeds the industry benchmark — strong performance.'
                      : authenticAdRate >= 60
                      ? 'Your rate is below the 75% benchmark. Review underperforming pillars.'
                      : 'Your rate is significantly below the 75% benchmark. Immediate attention recommended.'}
                  </p>
                </div>
                <p className="text-caption text-cool-500 italic mt-2">
                  If an impression fails any one of these criteria, it is not considered Authentic.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex items-baseline gap-3 mt-0.5">
            <span className={cn('text-h3 font-bold', getAuthenticRateColor(authenticAdRate))}>
              {formatPercent(authenticAdRate)}
            </span>

            {/* Projected lift badge */}
            {hasProjectedLift && (
              <div
                className="relative"
                onMouseEnter={() => setLiftTooltipOpen(true)}
                onMouseLeave={() => setLiftTooltipOpen(false)}
              >
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-grass-50 border border-grass-200 cursor-default">
                  <TrendingUp className="h-3.5 w-3.5 text-grass-600" />
                  <span className="text-body3 font-semibold text-grass-700">
                    +{totalLiftLow}–{totalLiftHigh} pts
                  </span>
                  <span className="text-label text-grass-500">projected</span>
                </div>

                {/* Tooltip */}
                {liftTooltipOpen && (
                  <div className="absolute left-0 top-full mt-2 z-50 w-72 rounded-xl bg-white border border-neutral-200 shadow-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="h-4 w-4 text-plum-500" />
                      <span className="text-body3 font-semibold text-cool-900">Projected from Vera actions</span>
                    </div>

                    <div className="space-y-2.5">
                      {appliedActions.map((action, i) => (
                        <div key={i} className="flex items-start gap-2.5">
                          <Check className="h-3.5 w-3.5 text-grass-500 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="text-body3 text-cool-700">{action.label}</p>
                            <p className="text-label text-grass-600 font-medium">+{action.liftLow}–{action.liftHigh} pts</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3 pt-3 border-t border-neutral-100">
                      <div className="flex items-center justify-between">
                        <span className="text-label text-cool-500">Estimated AAR</span>
                        <span className="text-body3 font-bold text-grass-700">
                          {formatPercent(projectedAarLow)}–{formatPercent(projectedAarHigh)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 4 pillar sub-metrics in a row */}
        <div className="grid grid-cols-4 gap-2">
          {pillars.map(p => (
            <div
              key={p.key}
              className={cn(
                'rounded-lg px-2 py-2 border min-w-0 overflow-hidden',
                p.passing
                  ? 'bg-neutral-25 border-neutral-100'
                  : 'bg-orange-25 border-orange-200'
              )}
            >
              <div className="flex items-center gap-0.5 mb-0.5 min-w-0">
                <span className={cn('text-label truncate', p.passing ? 'text-cool-500' : 'text-orange-600')}>
                  {p.label}
                </span>
                {p.passing ? (
                  <Check className="h-3 w-3 text-grass-500 flex-shrink-0" />
                ) : (
                  <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />
                )}
              </div>
              <span className={cn('text-body2 font-bold block truncate', p.passing ? 'text-cool-900' : 'text-orange-700')}>
                {formatPercent(p.value)}
              </span>
              {!p.passing && (
                <p className="text-caption text-orange-500 mt-0.5 truncate">Bench: {p.threshold}%</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recommendations for failing pillars */}
      {failingPillars.length > 0 && (
        <div className="border-t border-neutral-100">
          <div className="px-5 py-2.5 bg-neutral-25">
            <span className="text-label font-semibold text-cool-600 uppercase tracking-wide">Recommended</span>
          </div>
          {failingPillars.map(p => p.rec && (
            <a
              key={p.key}
              href={`${BASENAME}/marketplace?insight=${p.rec.insightId}&products=${p.rec.productIds.join(',')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 px-5 py-3 border-b border-neutral-50 last:border-b-0 transition-colors hover:bg-plum-25"
            >
              <div className="flex-1 min-w-0">
                <p className="text-label text-cool-600">
                  <span className="font-semibold text-orange-600">{p.label}:</span>{' '}
                  {p.rec.recommendation}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-label font-semibold text-plum-600 group-hover:text-plum-800 flex-shrink-0 mt-0.5">
                {p.rec.productName}
                <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
