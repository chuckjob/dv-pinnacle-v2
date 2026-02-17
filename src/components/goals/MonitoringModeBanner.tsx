import { useState } from 'react';
import { ShieldCheck, Zap, Lock, ArrowRight, DollarSign, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVera } from '@/hooks/use-vera';
import type { SafetyTierKey } from '@/types/goal';

const tierLabels: Record<SafetyTierKey, string> = {
  strict: 'Strict',
  moderate: 'Moderate',
  loose: 'Loose',
};

interface MonitoringModeBannerProps {
  safetyTier?: SafetyTierKey;
  goalId: string;
}

export function MonitoringModeBanner({ safetyTier, goalId }: MonitoringModeBannerProps) {
  const { openVeraWithContext } = useVera();
  const tierName = safetyTier ? tierLabels[safetyTier] : 'Moderate';

  return (
    <div className="space-y-4">
      {/* ── State A: Header Alert Banner ── */}
      <div className="rounded-xl border border-plum-200 bg-gradient-to-r from-plum-25 via-white to-plum-25 overflow-hidden">
        <div className="flex items-start gap-4 px-5 py-4">
          {/* Icon cluster */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className="w-10 h-10 rounded-xl bg-plum-100 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-plum-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-plum-200 flex items-center justify-center">
              <div className="w-2 h-2 rounded-full bg-plum-400 animate-pulse" />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1">
              <h3 className="text-body2 font-semibold text-cool-900">
                Your Goal is currently in Monitoring Mode
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label font-medium bg-plum-100 text-plum-700">
                <ShieldCheck className="h-3 w-3" />
                Monitoring
              </span>
            </div>

            <p className="text-body3 text-cool-600 leading-relaxed mb-3 max-w-2xl">
              You are successfully auditing your Authentic Ad Rate, but your media is not yet self-healing.
              Connect to a DSP to move from <span className="font-medium text-cool-700">"seeing waste"</span> to{' '}
              <span className="font-medium text-cool-700">"preventing waste"</span> in real-time.
            </p>

            {/* Action items */}
            <div className="space-y-2 mb-4">
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-plum-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="h-3 w-3 text-plum-600" />
                </div>
                <p className="text-body3 text-cool-600">
                  <span className="font-semibold text-cool-800">Activate Optimization:</span>{' '}
                  Push pre-bid segments to block waste before the bid occurs.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-plum-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ShieldCheck className="h-3 w-3 text-plum-600" />
                </div>
                <p className="text-body3 text-cool-600">
                  <span className="font-semibold text-cool-800">Unified Quality:</span>{' '}
                  Sync your <span className="font-semibold text-plum-700">{tierName}</span> Brand Safety tier across all buying platforms.
                </p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => openVeraWithContext('goal-create')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-all shadow-sm hover:shadow-md"
            >
              <Zap className="h-4 w-4" />
              Connect Buying Platform
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Mode progression visual */}
          <div className="hidden xl:flex flex-col items-center gap-1.5 flex-shrink-0 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className="w-9 h-9 rounded-lg bg-plum-100 border-2 border-plum-300 flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-plum-600" />
                </div>
                <span className="text-caption font-semibold text-plum-600 mt-1">Monitor</span>
              </div>
              <div className="flex items-center gap-0.5">
                <div className="w-6 h-0.5 bg-plum-200 rounded" />
                <div className="w-6 h-0.5 bg-neutral-200 rounded" />
              </div>
              <div className="flex flex-col items-center opacity-50">
                <div className="w-9 h-9 rounded-lg bg-neutral-100 border-2 border-neutral-200 border-dashed flex items-center justify-center">
                  <Zap className="h-4 w-4 text-neutral-400" />
                </div>
                <span className="text-caption font-medium text-cool-400 mt-1">Optimize</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── State B: Locked CPAI Card ── */}
      <LockedCpaiCard />
    </div>
  );
}

/** Blurred/locked CPAI metric card that teases the financial data */
function LockedCpaiCard() {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative rounded-xl border border-neutral-200 bg-white overflow-hidden group cursor-default"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card content — blurred */}
      <div className={cn('px-5 py-4 transition-all duration-300', hovered ? 'blur-[6px] scale-[0.99]' : 'blur-[3px]')}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className="h-4 w-4 text-cool-400" />
          <span className="text-label font-medium text-cool-500 uppercase tracking-wide">Cost Per Authentic Impression</span>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-caption text-cool-400 mb-0.5">Effective CPAI</p>
            <p className="text-h4 font-bold text-cool-300">$8.42</p>
          </div>
          <div>
            <p className="text-caption text-cool-400 mb-0.5">Market CPM</p>
            <p className="text-h4 font-bold text-cool-300">$5.20</p>
          </div>
          <div>
            <p className="text-caption text-cool-400 mb-0.5">Quality Premium</p>
            <div className="flex items-baseline gap-1.5">
              <p className="text-h4 font-bold text-cool-300">+$3.22</p>
              <TrendingUp className="h-3.5 w-3.5 text-cool-200" />
            </div>
          </div>
        </div>
        {/* Fake sparkline */}
        <div className="mt-3 h-8 flex items-end gap-[3px]">
          {[35, 42, 38, 50, 45, 55, 48, 60, 52, 65, 58, 70, 62, 68, 72, 65, 75, 70, 78, 72].map((h, i) => (
            <div key={i} className="flex-1 rounded-t bg-neutral-200" style={{ height: `${h}%` }} />
          ))}
        </div>
      </div>

      {/* Lock overlay */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center transition-all duration-300',
        hovered ? 'bg-white/80' : 'bg-white/40'
      )}>
        <div className={cn(
          'flex flex-col items-center gap-2 transition-all duration-300',
          hovered ? 'scale-100 opacity-100' : 'scale-95 opacity-80'
        )}>
          <div className={cn(
            'w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-300',
            hovered ? 'bg-plum-100' : 'bg-neutral-100'
          )}>
            <Lock className={cn('h-5 w-5 transition-colors duration-300', hovered ? 'text-plum-600' : 'text-neutral-400')} />
          </div>
          <div className="text-center">
            <p className={cn('text-body3 font-semibold transition-colors duration-300', hovered ? 'text-cool-900' : 'text-cool-500')}>
              {hovered ? 'Financial data requires a DSP connection' : 'DSP Connection Required'}
            </p>
            {hovered && (
              <p className="text-label text-cool-500 mt-0.5 max-w-xs animate-in fade-in slide-in-from-bottom-1 duration-200">
                Connect a buying platform to calculate your real Cost Per Authentic Impression,
                track quality premiums, and identify media waste in real-time.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
