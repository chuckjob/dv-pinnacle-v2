import { useState, useRef, useEffect } from 'react';
import { Calendar, ArrowRight, AlertTriangle, Info, ShieldCheck, Shield, Zap, MoreHorizontal, Pencil, Trash2, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Goal, SafetyTierKey } from '@/types/goal';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { formatCompactCurrency, formatNumber, formatPercent, formatDateShort } from '@/lib/formatters';
import { getAuthenticRateColor } from '@/lib/authentic-ad-utils';

const objectiveLabels: Record<string, string> = {
  'brand-awareness': 'Brand Awareness',
  'lead-generation': 'Lead Generation',
  'conversions': 'Conversions',
  'reach': 'Reach',
  'engagement': 'Engagement',
  'video-views': 'Video Views',
};

const safetyTierConfig: Record<SafetyTierKey, { label: string; icon: React.ReactNode; bg: string; text: string; border: string }> = {
  strict: { label: 'Strict', icon: <ShieldCheck className="h-3 w-3" />, bg: 'bg-tomato-25', text: 'text-tomato-600', border: 'border-tomato-100' },
  moderate: { label: 'Moderate', icon: <Shield className="h-3 w-3" />, bg: 'bg-plum-25', text: 'text-plum-600', border: 'border-plum-100' },
  loose: { label: 'Loose', icon: <Zap className="h-3 w-3" />, bg: 'bg-turquoise-25', text: 'text-turquoise-700', border: 'border-turquoise-100' },
};

interface GoalCardProps {
  goal: Goal;
  onClick: () => void;
  onEdit?: (goalId: string) => void;
  onDelete?: (goalId: string) => void;
  onConnectDsp?: (goalId: string) => void;
  onRefreshData?: (goalId: string) => void;
}

export function GoalCard({ goal, onClick, onEdit, onDelete, onConnectDsp, onRefreshData }: GoalCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [menuOpen]);

  return (
    <div
      onClick={onClick}
      className="rounded-xl border border-neutral-200 bg-white p-5 cursor-pointer hover:shadow-elevation-raised hover:border-plum-200 transition-all group"
    >
      {/* Row 1: Name + status badges + menu */}
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <h3 className="text-body2 font-semibold text-cool-900 truncate">{goal.name}</h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-body3 text-cool-500">{objectiveLabels[goal.objective]}</span>
            {goal.safetyTier && (() => {
              const tier = safetyTierConfig[goal.safetyTier];
              return (
                <>
                  <span className="text-cool-300">·</span>
                  <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-label font-medium border', tier.bg, tier.text, tier.border)}>
                    {tier.icon}
                    {tier.label}
                  </span>
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-1.5 mt-2">
            {goal.platforms.map(p => (
              <PlatformBadge key={p} platform={p} size="sm" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0 ml-3">
          <StatusBadge healthStatus={goal.healthStatus} />
          {/* Three-dot menu */}
          <div ref={menuRef} className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-1 rounded-md hover:bg-neutral-100 transition-colors text-cool-400 hover:text-cool-600"
              aria-label="Goal actions"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 rounded-lg border border-neutral-200 bg-white shadow-elevation-raised py-1 z-20">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit?.(goal.id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-body3 text-cool-700 hover:bg-neutral-50 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5 text-cool-500" />
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onRefreshData?.(goal.id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-body3 text-cool-700 hover:bg-neutral-50 transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-cool-500" />
                  Refresh Data
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete?.(goal.id);
                  }}
                  className="flex items-center gap-2 w-full px-3 py-2 text-body3 text-tomato-600 hover:bg-tomato-25 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Authentic Ad Rate — hero */}
      <div className="mt-4 mb-3">
        <div className="flex items-center gap-1">
          <p className="text-caption text-cool-500 uppercase tracking-wide">Authentic Ad Rate</p>
          <Tooltip>
            <TooltipTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="text-cool-400 hover:text-cool-600 transition-colors" aria-label="What is Authentic Ad Rate?">
                <Info className="h-3 w-3" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-[320px] p-4">
              <p className="text-body3 font-semibold text-cool-900 mb-1.5">
                Authentic Ad Rate: {formatPercent(goal.authenticAdRate)}
              </p>
              <p className="text-label text-cool-600 mb-2">
                This represents the percentage of impressions that were simultaneously:
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
                      className={cn('h-full rounded-full', goal.authenticAdRate >= 75 ? 'bg-grass-500' : goal.authenticAdRate >= 60 ? 'bg-orange-500' : 'bg-tomato-500')}
                      style={{ width: `${Math.min(goal.authenticAdRate, 100)}%` }}
                    />
                  </div>
                  <span className={cn(
                    'text-label font-semibold',
                    goal.authenticAdRate >= 75 ? 'text-grass-700' : goal.authenticAdRate >= 60 ? 'text-orange-700' : 'text-tomato-700'
                  )}>
                    {goal.authenticAdRate >= 75 ? 'Above' : goal.authenticAdRate >= 60 ? 'Below' : 'Well below'}
                  </span>
                </div>
                <p className="text-caption text-cool-500 mt-1.5">
                  {goal.authenticAdRate >= 75
                    ? 'Your rate exceeds the industry benchmark — strong performance.'
                    : goal.authenticAdRate >= 60
                    ? 'Your rate is below the 75% benchmark. Review underperforming pillars above.'
                    : 'Your rate is significantly below the 75% benchmark. Immediate attention recommended.'}
                </p>
              </div>
              <p className="text-caption text-cool-500 italic mt-2">
                If an impression fails any one of these criteria, it is not considered Authentic.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
        <p className={cn('text-h1 font-bold mt-0.5', getAuthenticRateColor(goal.authenticAdRate))}>
          {formatPercent(goal.authenticAdRate)}
        </p>
      </div>

      {/* Row 3: 4 Pillar inset cards — underperforming pillars highlighted */}
      <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
        {[
          { label: 'Fraud-Free', value: formatPercent(100 - goal.fraudRate), hasIssue: goal.fraudRate > 2, benchmark: 'Bench: 98%' },
          { label: 'Viewable', value: formatPercent(goal.viewabilityRate), hasIssue: goal.viewabilityRate < 70, benchmark: 'Bench: 70%' },
          { label: 'Suitable', value: formatPercent(goal.brandSuitabilityRate), hasIssue: goal.brandSuitabilityRate < 95, benchmark: 'Bench: 95%' },
          { label: 'In-Geo', value: formatPercent(goal.inGeoRate), hasIssue: goal.inGeoRate < 95, benchmark: 'Bench: 95%' },
        ].map(p => (
          <div
            key={p.label}
            className={cn(
              'rounded-lg px-2 py-2 sm:px-3 sm:py-3 min-w-0 overflow-hidden',
              p.hasIssue ? 'bg-orange-25' : 'bg-neutral-50'
            )}
          >
            <div className="flex items-center gap-1 min-w-0">
              <p className={cn('text-caption sm:text-label uppercase tracking-wide truncate', p.hasIssue ? 'text-orange-600' : 'text-cool-400')}>{p.label}</p>
              {p.hasIssue && <AlertTriangle className="h-2.5 w-2.5 text-orange-500 flex-shrink-0" />}
            </div>
            <p className={cn('text-body3 sm:text-h5 font-semibold mt-1 truncate', p.hasIssue ? 'text-orange-700' : 'text-cool-900')}>{p.value}</p>
            <p className={cn('text-caption mt-1 truncate', p.hasIssue ? 'text-orange-500' : 'invisible')}>{p.benchmark}</p>
          </div>
        ))}
      </div>

      {/* Row 4: Spend + Impressions + Campaigns + DSP */}
      <div className="flex items-center gap-3 sm:gap-4 mt-3 pt-3 border-t border-neutral-100 flex-wrap min-w-0 overflow-hidden">
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-caption sm:text-body3 text-cool-400">Spend</span>
          <span className="text-caption sm:text-body3 font-semibold text-cool-700">{formatCompactCurrency(goal.totalSpend)}</span>
        </div>
        <span className="text-cool-200">|</span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-caption sm:text-body3 text-cool-400">Imps</span>
          <span className="text-caption sm:text-body3 font-semibold text-cool-700">{formatNumber(goal.totalImpressions)}</span>
        </div>
        <span className="text-cool-200">|</span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-caption sm:text-body3 text-cool-400">Camps</span>
          <span className="text-caption sm:text-body3 font-semibold text-cool-700">{goal.campaigns.length}</span>
        </div>
        <span className="text-cool-200">|</span>
        <div className="flex items-center gap-1 sm:gap-1.5">
          <span className="text-caption sm:text-body3 text-cool-400">DSP</span>
          {goal.connectedDsp ? (
            <span className="text-caption sm:text-body3 font-semibold text-cool-700">{goal.connectedDsp}</span>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onConnectDsp?.(goal.id);
              }}
              className="text-caption sm:text-body3 font-semibold text-plum-600 hover:text-plum-700 transition-colors"
            >
              Connect
            </button>
          )}
        </div>
      </div>

      {/* Row 5: Date range + arrow */}
      <div className="flex items-center gap-1.5 mt-2 text-body3 text-cool-400">
        <Calendar className="h-3.5 w-3.5" />
        {formatDateShort(goal.dateRange.start)} — {formatDateShort(goal.dateRange.end)}
        <ArrowRight className="h-4 w-4 text-cool-300 group-hover:text-plum-600 transition-colors ml-auto flex-shrink-0" />
      </div>
    </div>
  );
}
