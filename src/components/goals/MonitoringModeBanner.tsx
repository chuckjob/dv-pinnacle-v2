import { useState } from 'react';
import { ShieldCheck, Zap, Lock, ArrowRight, DollarSign, TrendingUp, Globe, ChevronDown, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVera } from '@/hooks/use-vera';
import type { SafetyTierKey } from '@/types/goal';

const tierLabels: Record<SafetyTierKey, string> = {
  strict: 'Strict',
  moderate: 'Moderate',
  loose: 'Loose',
};

const DSP_PLATFORMS = [
  { value: 'dv360', label: 'DV360', icon: 'D', color: 'bg-blue-100 text-blue-700' },
  { value: 'ttd', label: 'The Trade Desk', icon: 'T', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'amazon', label: 'Amazon DSP', icon: 'A', color: 'bg-amber-100 text-amber-700' },
  { value: 'xandr', label: 'Xandr', icon: 'X', color: 'bg-purple-100 text-purple-700' },
  { value: 'yahoo', label: 'Yahoo DSP', icon: 'Y', color: 'bg-pink-100 text-pink-700' },
];

interface MonitoringModeBannerProps {
  safetyTier?: SafetyTierKey;
  goalId: string;
}

export function MonitoringModeBanner({ safetyTier, goalId }: MonitoringModeBannerProps) {
  const { setGoalConnectedDspLabel } = useVera();
  const tierName = safetyTier ? tierLabels[safetyTier] : 'Moderate';

  const [showDspForm, setShowDspForm] = useState(false);
  const [dspPlatform, setDspPlatform] = useState('');
  const [seatId, setSeatId] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  function handleConnect() {
    if (!dspPlatform || !seatId.trim()) return;
    const platformInfo = DSP_PLATFORMS.find(p => p.value === dspPlatform);
    if (!platformInfo) return;

    setSyncing(true);

    // Simulate sync delay, then update context → goal.connectedDsp becomes truthy → banner hides
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
      // After showing the success state briefly, update the context which un-mounts the banner
      setTimeout(() => {
        setGoalConnectedDspLabel(platformInfo.label);
      }, 1200);
    }, 2000);
  }

  return (
    <div className="space-y-4">
      {/* ── State A: Header Alert Banner ── */}
      <div className={cn(
        'rounded-xl border overflow-hidden transition-all duration-500',
        synced
          ? 'border-grass-200 bg-gradient-to-r from-grass-25 via-white to-grass-25'
          : 'border-plum-200 bg-gradient-to-r from-plum-25 via-white to-plum-25'
      )}>
        <div className="flex items-start gap-4 px-5 py-4">
          {/* Icon cluster */}
          <div className="relative flex-shrink-0 mt-0.5">
            <div className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-500',
              synced ? 'bg-grass-100' : 'bg-plum-100'
            )}>
              {synced
                ? <Check className="h-5 w-5 text-grass-600" />
                : <ShieldCheck className="h-5 w-5 text-plum-600" />
              }
            </div>
            {!synced && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-plum-200 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-plum-400 animate-pulse" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {synced ? (
              /* ── Success state ── */
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-2.5 mb-1">
                  <h3 className="text-body2 font-semibold text-grass-800">
                    Optimization Mode Activated
                  </h3>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label font-medium bg-grass-100 text-grass-700">
                    <Zap className="h-3 w-3" />
                    Optimizing
                  </span>
                </div>
                <p className="text-body3 text-cool-600 leading-relaxed">
                  Your buying platform is now connected. Pre-bid segments are syncing and CPAI tracking is being activated.
                </p>
              </div>
            ) : (
              /* ── Default monitoring state ── */
              <>
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

                {/* CTA or inline DSP form */}
                {!showDspForm ? (
                  <button
                    onClick={() => setShowDspForm(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-all shadow-sm hover:shadow-md"
                  >
                    <Zap className="h-4 w-4" />
                    Connect Buying Platform
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  /* ── Inline DSP Connection Form ── */
                  <div className="animate-in fade-in slide-in-from-top-2 duration-300 max-w-lg">
                    <div className="rounded-lg border border-plum-200 bg-white overflow-hidden">
                      <div className="px-4 py-3 bg-gradient-to-r from-plum-25 to-white border-b border-plum-100">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-plum-600" />
                          <span className="text-body3 font-semibold text-cool-900">Connect Your DSP</span>
                        </div>
                      </div>
                      <div className="p-4 space-y-3">
                        <div>
                          <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Platform</label>
                          <div className="relative">
                            <select
                              value={dspPlatform}
                              onChange={(e) => setDspPlatform(e.target.value)}
                              className="w-full h-10 px-3 pr-8 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 appearance-none cursor-pointer"
                            >
                              <option value="">Select platform...</option>
                              {DSP_PLATFORMS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-cool-400 pointer-events-none" />
                          </div>
                        </div>
                        <div>
                          <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Seat ID</label>
                          <input
                            type="text"
                            value={seatId}
                            onChange={(e) => setSeatId(e.target.value)}
                            placeholder="Enter seat ID..."
                            className="w-full h-10 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleConnect();
                              }
                            }}
                          />
                        </div>
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={handleConnect}
                            disabled={!dspPlatform || !seatId.trim() || syncing}
                            className={cn(
                              'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-body3 font-medium transition-all',
                              dspPlatform && seatId.trim() && !syncing
                                ? 'bg-plum-600 text-white hover:bg-plum-700 shadow-sm'
                                : 'bg-neutral-100 text-cool-400 cursor-not-allowed'
                            )}
                          >
                            {syncing ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Syncing...
                              </>
                            ) : (
                              <>
                                <Zap className="h-4 w-4" />
                                Connect & Sync
                              </>
                            )}
                          </button>
                          {!syncing && (
                            <button
                              onClick={() => setShowDspForm(false)}
                              className="px-3 py-2 text-body3 text-cool-500 hover:text-cool-700 transition-colors"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Mode progression visual */}
          <div className="hidden xl:flex flex-col items-center gap-1.5 flex-shrink-0 pt-1">
            <div className="flex items-center gap-2">
              <div className="flex flex-col items-center">
                <div className={cn(
                  'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-colors duration-500',
                  synced
                    ? 'bg-grass-100 border-grass-300'
                    : 'bg-plum-100 border-plum-300'
                )}>
                  {synced
                    ? <Check className="h-4 w-4 text-grass-600" />
                    : <ShieldCheck className="h-4 w-4 text-plum-600" />
                  }
                </div>
                <span className={cn(
                  'text-caption font-semibold mt-1 transition-colors duration-500',
                  synced ? 'text-grass-600' : 'text-plum-600'
                )}>Monitor</span>
              </div>
              <div className="flex items-center gap-0.5">
                <div className={cn(
                  'w-6 h-0.5 rounded transition-colors duration-500',
                  synced ? 'bg-grass-400' : 'bg-plum-200'
                )} />
                <div className={cn(
                  'w-6 h-0.5 rounded transition-colors duration-500',
                  synced ? 'bg-grass-400' : 'bg-neutral-200'
                )} />
              </div>
              <div className={cn(
                'flex flex-col items-center transition-opacity duration-500',
                synced ? 'opacity-100' : 'opacity-50'
              )}>
                <div className={cn(
                  'w-9 h-9 rounded-lg border-2 flex items-center justify-center transition-all duration-500',
                  synced
                    ? 'bg-grass-100 border-grass-300'
                    : 'bg-neutral-100 border-neutral-200 border-dashed'
                )}>
                  <Zap className={cn(
                    'h-4 w-4 transition-colors duration-500',
                    synced ? 'text-grass-600' : 'text-neutral-400'
                  )} />
                </div>
                <span className={cn(
                  'text-caption font-medium mt-1 transition-colors duration-500',
                  synced ? 'text-grass-600 font-semibold' : 'text-cool-400'
                )}>Optimize</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── State B: CPAI Card — locked when no DSP, unlocks on connect ── */}
      <CpaiCard syncing={syncing} synced={synced} />
    </div>
  );
}

/** CPAI metric card — blurred/locked by default, un-blurs during sync, fully revealed once connected */
function CpaiCard({ syncing, synced }: { syncing: boolean; synced: boolean }) {
  const [hovered, setHovered] = useState(false);
  const isUnlocked = syncing || synced;

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-white overflow-hidden transition-all duration-700',
        synced ? 'border-grass-200' : 'border-neutral-200',
        !isUnlocked && 'cursor-default'
      )}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Card content */}
      <div className={cn(
        'px-5 py-4 transition-all duration-700',
        isUnlocked
          ? 'blur-0 scale-100'
          : hovered ? 'blur-[6px] scale-[0.99]' : 'blur-[3px]'
      )}>
        <div className="flex items-center gap-2 mb-3">
          <DollarSign className={cn(
            'h-4 w-4 transition-colors duration-500',
            synced ? 'text-cool-700' : 'text-cool-400'
          )} />
          <span className={cn(
            'text-label font-medium uppercase tracking-wide transition-colors duration-500',
            synced ? 'text-cool-700' : 'text-cool-500'
          )}>Cost Per Authentic Impression</span>
          {synced && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-caption font-medium bg-grass-100 text-grass-700 animate-in fade-in duration-300">
              <Check className="h-2.5 w-2.5" />
              Live
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className={cn('text-caption mb-0.5 transition-colors duration-500', synced ? 'text-cool-500' : 'text-cool-400')}>Effective CPAI</p>
            <p className={cn('text-h4 font-bold transition-colors duration-500', synced ? 'text-cool-900' : 'text-cool-300')}>$8.42</p>
          </div>
          <div>
            <p className={cn('text-caption mb-0.5 transition-colors duration-500', synced ? 'text-cool-500' : 'text-cool-400')}>Market CPM</p>
            <p className={cn('text-h4 font-bold transition-colors duration-500', synced ? 'text-cool-900' : 'text-cool-300')}>$5.20</p>
          </div>
          <div>
            <p className={cn('text-caption mb-0.5 transition-colors duration-500', synced ? 'text-cool-500' : 'text-cool-400')}>Quality Premium</p>
            <div className="flex items-baseline gap-1.5">
              <p className={cn('text-h4 font-bold transition-colors duration-500', synced ? 'text-tomato-600' : 'text-cool-300')}>+$3.22</p>
              <TrendingUp className={cn('h-3.5 w-3.5 transition-colors duration-500', synced ? 'text-tomato-400' : 'text-cool-200')} />
            </div>
          </div>
        </div>
        {/* Sparkline */}
        <div className="mt-3 h-8 flex items-end gap-[3px]">
          {[35, 42, 38, 50, 45, 55, 48, 60, 52, 65, 58, 70, 62, 68, 72, 65, 75, 70, 78, 72].map((h, i) => (
            <div
              key={i}
              className={cn(
                'flex-1 rounded-t transition-colors duration-700',
                synced ? 'bg-plum-300' : 'bg-neutral-200'
              )}
              style={{
                height: `${h}%`,
                transitionDelay: synced ? `${i * 30}ms` : '0ms',
              }}
            />
          ))}
        </div>
      </div>

      {/* Lock overlay — fades out when syncing/synced */}
      <div className={cn(
        'absolute inset-0 flex items-center justify-center transition-all duration-700',
        isUnlocked
          ? 'opacity-0 pointer-events-none'
          : hovered ? 'bg-white/80 opacity-100' : 'bg-white/40 opacity-100'
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

      {/* Syncing overlay — shows during the sync animation */}
      {syncing && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-white shadow-sm border border-plum-100">
            <Loader2 className="h-4 w-4 text-plum-600 animate-spin" />
            <span className="text-body3 font-medium text-cool-700">Activating CPAI tracking...</span>
          </div>
        </div>
      )}
    </div>
  );
}
