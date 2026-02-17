import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X, Sparkles, Send, ArrowRight, Upload, Loader2, Check,
  ShieldCheck, Globe, ChevronDown, DollarSign, Plus,
  FileText, MousePointerClick, GlobeLock, Target, Shield, Zap,
  Megaphone, Users, MousePointer, Eye, MoreHorizontal,
  AlertTriangle, TrendingDown, Ban, Filter, MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MediaType, Platform } from '@/types/goal';
import { mediaTypeConfigs, platformConfigs } from '@/types/platform';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { useVera, type VeraPanelContext } from '@/hooks/use-vera';

/* ─── Types ───────────────────────────────────────────────── */

interface Message {
  id: string;
  role: 'user' | 'vera';
  content: string;
  /** Which wizard phase this message is associated with — used to render the interactive card right after it */
  wizardPhase?: GoalCreatePhase;
}

type GoalCreatePhase =
  | 'creation-method'
  | 'brief-upload'
  | 'brief-analyzing'
  | 'brand-intelligence'
  | 'goal-objective'
  | 'media-type'
  | 'platform-select'
  | 'target-cpm'
  | 'off-limits-topics'
  | 'goal-naming'
  | 'goal-created'
  | 'dsp-syncing'
  | 'complete';

type CampaignAnalyzePhase =
  | 'analyzing'
  | 'diagnosis'
  | 'recommendations'
  | 'done';

/* ─── Constants ───────────────────────────────────────────── */

const quickPrompts = [
  'Help me create a brand awareness goal',
  'What KPIs should I target for CTV?',
  'Optimize my viewability rates',
  'Set up fraud-free targeting',
];

const generalInitialMessages: Message[] = [
  {
    id: '1',
    role: 'vera',
    content:
      "Hi! I'm Vera, your AI co-pilot. I can help you create goals, optimize campaigns, and improve your Authentic Ad Rate. What would you like to do?",
  },
];

const goalCreateInitialMessages: Message[] = [
  {
    id: 'gc-1',
    role: 'vera',
    content:
      "Great, let's set up a new goal together! I have a few ways I can help — pick the one that works best for you:",
    wizardPhase: 'creation-method',
  },
];

const campaignAnalyzeInitialMessages: Message[] = [
  {
    id: 'ca-1',
    role: 'vera',
    content:
      "I'm analyzing Harbor Brew Zero — Open Web Display. Give me a moment to review the performance data across all ad sets and creatives...",
  },
];

const DSP_PLATFORMS = [
  { value: 'dv360', label: 'DV360', icon: 'D', color: 'bg-blue-100 text-blue-700' },
  { value: 'ttd', label: 'The Trade Desk', icon: 'T', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'amazon', label: 'Amazon DSP', icon: 'A', color: 'bg-amber-100 text-amber-700' },
  { value: 'xandr', label: 'Xandr', icon: 'X', color: 'bg-purple-100 text-purple-700' },
  { value: 'yahoo', label: 'Yahoo DSP', icon: 'Y', color: 'bg-pink-100 text-pink-700' },
];

type SafetyTierKey = 'strict' | 'moderate' | 'loose';

interface SafetyTier {
  key: SafetyTierKey;
  name: string;
  alias: string;
  bestFor: string;
  icon: React.ReactNode;
  color: string;
  borderColor: string;
  selectedBg: string;
  metrics: { label: string; value: string }[];
  blockedExamples: string[];
}

const SAFETY_TIERS: SafetyTier[] = [
  {
    key: 'strict',
    name: 'Strict',
    alias: 'High-Protection',
    bestFor: 'Finance, Pharma, Luxury brands where safety is non-negotiable',
    icon: <ShieldCheck className="h-5 w-5" />,
    color: 'text-tomato-600',
    borderColor: 'border-tomato-200',
    selectedBg: 'bg-tomato-25',
    metrics: [
      { label: 'Block Rate', value: '15%+' },
      { label: 'Viewability Floor', value: '75%+' },
      { label: 'Fraud Tolerance', value: 'Zero' },
    ],
    blockedExamples: [
      'Violence & Gore', 'Adult Content', 'Hate Speech', 'Illegal Drugs',
      'Terrorism', 'Gambling', 'Social Issues', 'Financial Topics',
      'Political Content', 'Tobacco & Vaping', 'Arms & Ammunition', 'Death & Injury',
    ],
  },
  {
    key: 'moderate',
    name: 'Moderate',
    alias: 'Balanced Growth',
    bestFor: 'Most consumer brands — balances safety with campaign scale',
    icon: <Shield className="h-5 w-5" />,
    color: 'text-plum-600',
    borderColor: 'border-plum-200',
    selectedBg: 'bg-plum-25',
    metrics: [
      { label: 'Block Rate', value: '5–10%' },
      { label: 'Viewability Floor', value: '60–70%' },
      { label: 'Fraud Tolerance', value: 'Low' },
    ],
    blockedExamples: [
      'Violence & Gore', 'Adult Content', 'Hate Speech',
      'Illegal Drugs', 'Terrorism', 'Death & Injury',
    ],
  },
  {
    key: 'loose',
    name: 'Loose',
    alias: 'Maximum Reach',
    bestFor: 'Brands focused on reach — Gaming, Entertainment, UGC-friendly',
    icon: <Zap className="h-5 w-5" />,
    color: 'text-turquoise-700',
    borderColor: 'border-turquoise-200',
    selectedBg: 'bg-turquoise-25',
    metrics: [
      { label: 'Block Rate', value: '<3%' },
      { label: 'Viewability Floor', value: '45–50%' },
      { label: 'Fraud Tolerance', value: 'Moderate' },
    ],
    blockedExamples: [
      'Adult Content', 'Hate Speech', 'Terrorism',
    ],
  },
];

/** Smart CPM recommendations cross-referenced by media purchase method & objective */
interface CpmRecommendation {
  recommended: string;
  marketCpm: string;
  cpaiPremium: string;
  justification: string;
  warningThreshold: number; // below this, show efficiency warning
  warningMessage: string;
}

const CPM_RECOMMENDATIONS: Record<string, Record<string, CpmRecommendation>> = {
  'Open Web Programmatic': {
    'brand-awareness': { recommended: '7.50', marketCpm: '$5.20', cpaiPremium: '+$2.30', justification: 'Based on your CPG Beverage category and Brand Awareness goal, Open Web inventory averages $5.20 CPM — but factoring in an estimated 8% block rate and 65% viewability floor, the effective Cost Per Authentic Impression is ~$7.50.', warningThreshold: 5.5, warningMessage: 'Lowering below $5.50 may push delivery into lower-quality inventory, reducing your Authentic Ad Rate by an estimated 8–12 pts.' },
    'engagement': { recommended: '8.20', marketCpm: '$5.80', cpaiPremium: '+$2.40', justification: 'Engagement campaigns on Open Web need higher viewability thresholds to drive interaction. Market CPM is $5.80 but authentic, viewable placements that drive clicks cost ~$8.20 effective CPAI.', warningThreshold: 6.0, warningMessage: 'Below $6.00, expect significantly lower viewability and click-through rates as inventory quality drops.' },
    'lead-generation': { recommended: '9.00', marketCpm: '$6.50', cpaiPremium: '+$2.50', justification: 'Lead gen requires premium placements with high attention scores. Market CPM is $6.50, but to reach qualified audiences in brand-safe environments, plan for ~$9.00 CPAI.', warningThreshold: 7.0, warningMessage: 'Reducing below $7.00 will likely increase fraud exposure and lower lead quality significantly.' },
    'reach': { recommended: '5.80', marketCpm: '$3.90', cpaiPremium: '+$1.90', justification: 'Reach campaigns can accept broader inventory. Market CPM is $3.90, but ensuring authentic impressions with basic quality standards brings the effective rate to ~$5.80.', warningThreshold: 4.0, warningMessage: 'Below $4.00, impression quality degrades sharply with higher fraud rates and out-of-geo delivery.' },
  },
  'Social (Walled Gardens)': {
    'brand-awareness': { recommended: '11.50', marketCpm: '$9.80', cpaiPremium: '+$1.70', justification: 'Social platforms have higher floor CPMs but better built-in safety. For Brand Awareness on Meta/TikTok, market average is $9.80 with a smaller authenticity premium, targeting ~$11.50 CPAI.', warningThreshold: 9.0, warningMessage: 'Social platforms have minimum bid floors. Going below $9.00 will severely limit delivery and audience quality.' },
    default: { recommended: '12.00', marketCpm: '$10.00', cpaiPremium: '+$2.00', justification: 'Walled garden environments have higher base CPMs but stronger quality signals. Targeting $12.00 ensures competitive bidding for authentic placements.', warningThreshold: 9.5, warningMessage: 'Below $9.50, expect reduced delivery volume and lower-quality audience segments.' },
  },
  'PMP': {
    'brand-awareness': { recommended: '14.00', marketCpm: '$11.50', cpaiPremium: '+$2.50', justification: 'PMP deals offer curated, brand-safe inventory at premium rates. Market CPM averages $11.50, with the authenticity premium bringing your target to ~$14.00 for high-quality placements.', warningThreshold: 11.0, warningMessage: 'PMP deals below $11.00 will likely be outbid, resulting in unfilled impressions and limited reach.' },
    default: { recommended: '15.00', marketCpm: '$12.00', cpaiPremium: '+$3.00', justification: 'Private Marketplace inventory is curated for quality. The $15.00 target ensures you win competitive deals while maintaining authenticity standards.', warningThreshold: 11.5, warningMessage: 'Below $11.50, expect significant delivery shortfalls as PMP sellers prioritize higher bids.' },
  },
  'Programmatic Guaranteed': {
    'brand-awareness': { recommended: '18.00', marketCpm: '$15.00', cpaiPremium: '+$3.00', justification: 'PG deals guarantee premium, brand-safe placements. The fixed rate of ~$15.00 plus the authenticity premium means budgeting $18.00 CPAI for guaranteed high-quality delivery.', warningThreshold: 14.0, warningMessage: 'PG rates are typically fixed. A target below $14.00 may not be achievable in this channel.' },
    default: { recommended: '19.00', marketCpm: '$16.00', cpaiPremium: '+$3.00', justification: 'Programmatic Guaranteed offers fixed-rate, premium inventory. Target $19.00 to account for authenticity requirements on top of the base rate.', warningThreshold: 15.0, warningMessage: 'PG deals have minimum commitments. Going below $15.00 is unlikely to secure quality inventory.' },
  },
};

/** Tier multipliers: strict demands higher CPMs, loose allows lower */
const SAFETY_TIER_CPM_MULTIPLIERS: Record<SafetyTierKey, number> = {
  strict: 1.18,   // +18% — tighter filters, premium inventory only
  moderate: 1.0,  // baseline — recommendations are already calibrated for moderate
  loose: 0.82,    // -18% — broader inventory pool, lower floor
};

function getCpmRecommendation(mediaPurchase: string, objective: string, tier?: SafetyTierKey | ''): CpmRecommendation {
  const channelRecs = CPM_RECOMMENDATIONS[mediaPurchase] ?? CPM_RECOMMENDATIONS['Open Web Programmatic'];
  const base = channelRecs[objective] ?? channelRecs['default'] ?? channelRecs['brand-awareness'];

  // If no tier supplied or moderate (the baseline), return as-is
  if (!tier || tier === 'moderate') return base;

  const mult = SAFETY_TIER_CPM_MULTIPLIERS[tier];
  const adjRec = (parseFloat(base.recommended) * mult).toFixed(2);
  const adjMarket = parseFloat(base.marketCpm.replace('$', ''));
  const adjPremium = (parseFloat(adjRec) - adjMarket).toFixed(2);
  const adjThreshold = +(base.warningThreshold * mult).toFixed(2);

  const tierLabel = tier === 'strict' ? 'Strict' : 'Loose';
  const tierExplain = tier === 'strict'
    ? 'Your Strict safety profile requires premium, heavily-vetted inventory — increasing the authenticity premium'
    : 'Your Loose safety profile opens up a wider inventory pool — reducing the authenticity premium';

  return {
    ...base,
    recommended: adjRec,
    cpaiPremium: `+$${adjPremium}`,
    justification: `${tierExplain}. ${base.justification.split('. ').slice(1).join('. ')}`,
    warningThreshold: adjThreshold,
  };
}

interface ConnectedDsp {
  platform: string;
  platformLabel: string;
  seatId: string;
}

/* ─── Sub-components ──────────────────────────────────────── */

function GoalBrandIntelligenceReport() {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-plum-50 to-white border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-2">
          <ShieldCheck className="h-4 w-4 text-plum-600" />
          <span className="text-body3 font-semibold text-cool-900">Brand Intelligence Report</span>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-turquoise-100 flex items-center justify-center text-sm font-bold text-turquoise-800">
            HB
          </div>
          <div>
            <span className="text-body3 font-semibold text-cool-900">Harbor Brew Zero</span>
            <p className="text-label text-cool-500 mt-0.5">CPG Beverage &middot; Non-Alcoholic</p>
          </div>
        </div>
      </div>

      {/* Products & Services */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-label font-semibold text-cool-500 uppercase tracking-wider mb-2">Products &amp; Services</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: 'Harbor Brew Zero', sub: 'Core Product' },
            { name: 'Sparkling Water Line', sub: 'Line Extension' },
            { name: 'Energy Infusions', sub: 'New Launch' },
            { name: 'Seasonal Flavors', sub: 'Limited Edition' },
          ].map((p) => (
            <div key={p.name} className="px-2.5 py-1.5 rounded-lg border border-neutral-100 bg-neutral-25">
              <p className="text-body3 font-medium text-cool-800">{p.name}</p>
              <p className="text-label text-cool-500">{p.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-label font-semibold text-cool-500 uppercase tracking-wider mb-2">Campaign KPIs</p>
        <div className="space-y-1.5">
          {[
            { name: 'CPM Target', value: '$8.50', benchmark: '$9.20', aligned: true },
            { name: 'Brand Suitability', value: '95%', benchmark: '92%', aligned: true },
            { name: 'Viewability', value: '70%', benchmark: '65%', aligned: true },
            { name: 'Authentic Ad Rate', value: '78%', benchmark: '75%', aligned: true },
          ].map((kpi) => (
            <div key={kpi.name} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-neutral-100 bg-neutral-25">
              <span className="text-body3 font-medium text-cool-800">{kpi.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-body3 font-semibold text-cool-900">{kpi.value}</span>
                <span className={cn(
                  'px-1.5 py-0.5 rounded text-label font-medium',
                  kpi.aligned ? 'bg-grass-50 text-grass-700' : 'bg-orange-50 text-orange-700'
                )}>
                  {kpi.aligned ? '\u2713 Aligned' : 'Review'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target Audiences */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <p className="text-label font-semibold text-cool-500 uppercase tracking-wider mb-2">Target Audiences</p>
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { name: 'Health-Conscious Adults', sub: 'Ages 25-44' },
            { name: 'Fitness Enthusiasts', sub: 'Active lifestyle' },
            { name: 'Gen Z Trendsetters', sub: 'Ages 18-24' },
            { name: 'Sober-Curious Consumers', sub: 'Alcohol alternatives' },
          ].map((a) => (
            <div key={a.name} className="px-2.5 py-1.5 rounded-lg border border-neutral-100 bg-neutral-25">
              <p className="text-body3 font-medium text-cool-800">{a.name}</p>
              <p className="text-label text-cool-500">{a.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Brand Values */}
      <div className="px-4 py-3">
        <p className="text-label font-semibold text-cool-500 uppercase tracking-wider mb-2">Brand Values</p>
        <div className="flex flex-wrap gap-1.5">
          {['Wellness', 'Authenticity', 'Sustainability', 'Fun'].map((v) => (
            <span key={v} className="px-2 py-0.5 rounded-full text-body3 font-medium bg-turquoise-25 text-turquoise-700 border border-turquoise-100">
              {v}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function StepSummary({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-grass-50 border border-grass-100">
      <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
        <Check className="h-3 w-3 text-white" />
      </div>
      {icon}
      <div className="flex-1 min-w-0">
        <p className="text-body3 font-medium text-cool-700 truncate">{label}</p>
        <p className="text-label text-cool-500 truncate">{value}</p>
      </div>
    </div>
  );
}

/** Section header for wizard form cards */
function WizardSectionHeader({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <span className="text-body2 font-semibold text-cool-900">{title}</span>
    </div>
  );
}

/* ─── Main Component ──────────────────────────────────────── */

interface VeraChatPanelProps {
  open: boolean;
  onClose: () => void;
  context?: VeraPanelContext;
}

export function VeraChatPanel({ open, onClose, context = 'general' }: VeraChatPanelProps) {
  const navigate = useNavigate();
  const { setGoalCreated, setGoalConnectedDspLabel, appliedRecIds, addAppliedRec } = useVera();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  /* ── General chat state ── */
  const [messages, setMessages] = useState<Message[]>(generalInitialMessages);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  /* ── Goal-creation wizard state ── */
  const [goalPhase, setGoalPhase] = useState<GoalCreatePhase>('creation-method');
  const [goalCreationMethod, setGoalCreationMethod] = useState('');
  const [goalBiApproved, setGoalBiApproved] = useState(false);
  const [goalObjective, setGoalObjective] = useState('');
  const [mediaPurchaseMethod, setMediaPurchaseMethod] = useState('');
  const [selectedMediaType, setSelectedMediaType] = useState<MediaType | ''>('');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | ''>('');
  const [targetCpm, setTargetCpm] = useState('');
  const [safetyTier, setSafetyTier] = useState<SafetyTierKey | ''>('');
  const [goalName, setGoalName] = useState('Harbor Brew Zero - US');

  /* ── DSP upsell state ── */
  const [goalDspPlatform, setGoalDspPlatform] = useState('');
  const [goalDspSeatId, setGoalDspSeatId] = useState('');
  const [goalConnectedDsps, setGoalConnectedDsps] = useState<ConnectedDsp[]>([]);
  const [goalShowDspForm, setGoalShowDspForm] = useState(false);

  const isGoalCreate = context === 'goal-create';
  const isCampaignAnalyze = context === 'campaign-analyze';

  /* ── Campaign analysis state ── */
  const [campaignAnalyzePhase, setCampaignAnalyzePhase] = useState<CampaignAnalyzePhase>('analyzing');
  const [expandedRecs, setExpandedRecs] = useState<Set<number>>(new Set());

  /* ── Reset when context switches ── */
  useEffect(() => {
    if (isGoalCreate) {
      setMessages(goalCreateInitialMessages);
      setGoalPhase('creation-method');
      setGoalCreationMethod('');
      setGoalBiApproved(false);
      setGoalObjective('');
      setMediaPurchaseMethod('');
      setSelectedMediaType('');
      setSelectedPlatform('');
      setTargetCpm('');
      setSafetyTier('');
      setGoalName('Harbor Brew Zero - US');
      setGoalDspPlatform('');
      setGoalDspSeatId('');
      setGoalConnectedDsps([]);
      setGoalShowDspForm(false);
    } else if (isCampaignAnalyze) {
      setMessages(campaignAnalyzeInitialMessages);
      setCampaignAnalyzePhase('analyzing');
      setExpandedRecs(new Set());
    } else {
      setMessages(generalInitialMessages);
    }
  }, [isGoalCreate, isCampaignAnalyze]);

  /* ── Campaign analysis: analyzing → diagnosis (2s) ── */
  useEffect(() => {
    if (isCampaignAnalyze && campaignAnalyzePhase === 'analyzing') {
      const t = setTimeout(() => {
        setCampaignAnalyzePhase('diagnosis');
        setMessages(prev => [
          ...prev,
          {
            id: `ca-diag-${Date.now()}`,
            role: 'vera',
            content: `Here's what's happening with this campaign. Your Authentic Ad Rate is 56.8% — well below the 75% industry benchmark. I identified three underperforming pillars dragging it down:`,
          },
        ]);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [isCampaignAnalyze, campaignAnalyzePhase]);

  /* ── Campaign analysis: diagnosis → recommendations (2.5s) ── */
  useEffect(() => {
    if (isCampaignAnalyze && campaignAnalyzePhase === 'diagnosis') {
      const t = setTimeout(() => {
        setCampaignAnalyzePhase('recommendations');
        setMessages(prev => [
          ...prev,
          {
            id: `ca-recs-${Date.now()}`,
            role: 'vera',
            content: `Based on this analysis, here are my top recommendations to improve performance. These are ordered by expected impact:`,
          },
        ]);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [isCampaignAnalyze, campaignAnalyzePhase]);

  /* ── Auto-advance: brief-analyzing → brand-intelligence ── */
  useEffect(() => {
    if (isGoalCreate && goalPhase === 'brief-analyzing') {
      const t = setTimeout(() => {
        setGoalPhase('brand-intelligence');
        setMessages(prev => [
          ...prev,
          {
            id: `vera-bi-${Date.now()}`,
            role: 'vera',
            content: "I've finished analyzing your brief. Here's a Brand Intelligence Report summarizing your products, target audiences, brand values, and the KPIs I'd recommend based on your category. Take a look and approve it if everything looks right, or let me know what to change:",
            wizardPhase: 'brand-intelligence',
          },
        ]);
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [isGoalCreate, goalPhase]);

  /* ── Auto-advance: dsp-syncing → complete ── */
  useEffect(() => {
    if (isGoalCreate && goalPhase === 'dsp-syncing') {
      const t = setTimeout(() => {
        setGoalCreated(true);
        setGoalPhase('complete');
        setMessages(prev => [
          ...prev,
          {
            id: `vera-done-${Date.now()}`,
            role: 'vera',
            content: "Your DSP is synced and your goal is live! I'll start monitoring performance as soon as impressions come in. Here's what you can do next:",
            wizardPhase: 'complete',
          },
        ]);
      }, 2500);
      return () => clearTimeout(t);
    }
  }, [isGoalCreate, goalPhase, setGoalCreated]);

  /* ── Scroll to bottom on new messages ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, goalPhase]);

  /* ── Focus input ── */
  useEffect(() => {
    if (open && inputRef.current) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  /* ── Helper: add Vera message with phase tag ── */
  const addVeraMessage = useCallback((content: string, wizardPhase?: GoalCreatePhase) => {
    setMessages(prev => [...prev, { id: `vera-${Date.now()}`, role: 'vera', content, wizardPhase }]);
  }, []);

  /* ── General chat send ── */
  function handleSend() {
    const text = input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'vera', content: getSimulatedResponse(text) }]);
      setIsTyping(false);
    }, 1200);
  }

  function handleQuickPrompt(prompt: string) {
    setInput(prompt);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: prompt }]);
      setInput('');
      setIsTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'vera', content: getSimulatedResponse(prompt) }]);
        setIsTyping(false);
      }, 1200);
    }, 100);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── DSP connect handler ── */
  function handleGoalConnectDsp() {
    if (!goalDspPlatform || !goalDspSeatId.trim()) return;
    const platformInfo = DSP_PLATFORMS.find(p => p.value === goalDspPlatform);
    if (!platformInfo) return;
    setGoalConnectedDsps(prev => [...prev, { platform: goalDspPlatform, platformLabel: platformInfo.label, seatId: goalDspSeatId.trim() }]);
    setGoalConnectedDspLabel(platformInfo.label);
    setGoalDspPlatform('');
    setGoalDspSeatId('');
    setGoalShowDspForm(false);
  }

  /* ── Phase order for completed step tracking ── */
  const phaseOrder: GoalCreatePhase[] = [
    'creation-method', 'brief-upload', 'brief-analyzing', 'brand-intelligence',
    'goal-objective', 'media-type', 'platform-select', 'off-limits-topics', 'target-cpm', 'goal-naming',
    'goal-created', 'dsp-syncing', 'complete',
  ];
  const currentIdx = phaseOrder.indexOf(goalPhase);

  function isPastPhase(phase: GoalCreatePhase) {
    return phaseOrder.indexOf(phase) < currentIdx;
  }

  /* ── Render the interactive card for a given wizard phase ── */
  function renderWizardCard(phase: GoalCreatePhase) {
    switch (phase) {

      /* ── Phase 1: Creation Method ── */
      case 'creation-method':
        return goalPhase === 'creation-method' ? (
          <div className="space-y-2 ml-8">
            {[
              { key: 'step', icon: <MousePointerClick className="h-4 w-4 text-plum-600" />, title: 'Step by step', desc: 'Answer questions one at a time' },
              { key: 'upload', icon: <Upload className="h-4 w-4 text-plum-600" />, title: 'Upload a brief', desc: 'I\'ll analyze your campaign brief' },
              { key: 'crawl', icon: <GlobeLock className="h-4 w-4 text-plum-600" />, title: 'Crawl website', desc: 'I\'ll gather brand context from your site' },
            ].map(opt => (
              <button
                key={opt.key}
                onClick={() => {
                  setGoalCreationMethod(opt.key);
                  setGoalPhase('brief-upload');
                  addVeraMessage(
                    'Perfect! Upload your campaign brief — I\'ll extract your brand context, identify target audiences, and recommend KPIs tailored to your category. I support PDF, DOCX, and TXT files.',
                    'brief-upload',
                  );
                }}
                className="flex items-start gap-3 w-full px-4 py-3 rounded-xl border border-neutral-200 hover:border-plum-200 hover:bg-plum-25 transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {opt.icon}
                </div>
                <div>
                  <p className="text-body3 font-semibold text-cool-900">{opt.title}</p>
                  <p className="text-label text-cool-500">{opt.desc}</p>
                </div>
              </button>
            ))}
          </div>
        ) : isPastPhase('creation-method') ? (
          <div className="ml-8">
            <StepSummary
              icon={<FileText className="h-3.5 w-3.5 text-cool-500" />}
              label="Creation Method"
              value={goalCreationMethod === 'upload' ? 'Upload a brief' : goalCreationMethod === 'crawl' ? 'Crawl website' : 'Step by step'}
            />
          </div>
        ) : null;

      /* ── Phase 2: Brief Upload ── */
      case 'brief-upload':
        return goalPhase === 'brief-upload' ? (
          <div className="ml-8">
            <button
              onClick={() => setGoalPhase('brief-analyzing')}
              className="w-full rounded-xl border-2 border-dashed border-neutral-300 hover:border-plum-300 bg-neutral-25 hover:bg-plum-25 p-6 flex flex-col items-center gap-2 transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-plum-50 flex items-center justify-center">
                <Upload className="h-5 w-5 text-plum-600" />
              </div>
              <p className="text-body3 font-medium text-cool-700">Drop your brief here or click to upload</p>
              <p className="text-label text-cool-400">PDF, DOCX, or TXT &middot; Max 25MB</p>
            </button>
          </div>
        ) : null;

      /* ── Phase 3: Brief Analyzing ── */
      case 'brief-analyzing':
        return goalPhase === 'brief-analyzing' ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 ml-8">
            <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
            <span className="text-body3 text-cool-600">Analyzing your brief...</span>
          </div>
        ) : null;

      /* ── Phase 4: Brand Intelligence Report ── */
      case 'brand-intelligence':
        return goalPhase === 'brand-intelligence' ? (
          <div className="space-y-3 ml-8">
            <GoalBrandIntelligenceReport />
            <button
              onClick={() => {
                setGoalBiApproved(true);
                setGoalPhase('goal-objective');
                addVeraMessage(
                  'Report approved! Now, what\'s the primary objective for this goal? This determines which KPIs I\'ll track and how I\'ll optimize your campaign performance.',
                  'goal-objective',
                );
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              Approve Report
            </button>
          </div>
        ) : isPastPhase('brand-intelligence') && goalBiApproved ? (
          <div className="ml-8">
            <StepSummary
              icon={<ShieldCheck className="h-3.5 w-3.5 text-cool-500" />}
              label="Brand Intelligence"
              value="Harbor Brew Zero — Approved"
            />
          </div>
        ) : null;

      /* ── Phase 5: Goal Objective ── */
      case 'goal-objective':
        return goalPhase === 'goal-objective' ? (
          <div className="ml-8">
            <WizardSectionHeader
              icon={<Target className="h-5 w-5 text-plum-600" />}
              title="Goal Objective"
            />
            <div className="space-y-2">
              {[
                { key: 'brand-awareness', icon: <Megaphone className="h-4 w-4 text-plum-600" />, title: 'Brand Awareness', desc: 'Maximize reach and impressions with quality placements' },
                { key: 'engagement', icon: <MousePointer className="h-4 w-4 text-plum-600" />, title: 'Engagement', desc: 'Drive clicks, interactions, and audience participation' },
                { key: 'lead-generation', icon: <Users className="h-4 w-4 text-plum-600" />, title: 'Lead Generation', desc: 'Capture qualified leads with targeted campaigns' },
                { key: 'reach', icon: <Eye className="h-4 w-4 text-plum-600" />, title: 'Reach', desc: 'Maximize unique audience coverage across platforms' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={() => {
                    setGoalObjective(opt.key);
                    setGoalPhase('media-type');
                    addVeraMessage(
                      `${opt.title} — great choice. Now, what type of media will you be running? This determines which platforms are available and how I'll configure your measurement settings.`,
                      'media-type',
                    );
                  }}
                  className="flex items-start gap-3 w-full px-4 py-3 rounded-xl border border-neutral-200 hover:border-plum-200 hover:bg-plum-25 transition-all text-left"
                >
                  <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {opt.icon}
                  </div>
                  <div>
                    <p className="text-body3 font-semibold text-cool-900">{opt.title}</p>
                    <p className="text-label text-cool-500">{opt.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : isPastPhase('goal-objective') ? (
          <div className="ml-8">
            <StepSummary
              icon={<Target className="h-3.5 w-3.5 text-cool-500" />}
              label="Goal Objective"
              value={goalObjective === 'brand-awareness' ? 'Brand Awareness' : goalObjective === 'engagement' ? 'Engagement' : goalObjective === 'lead-generation' ? 'Lead Generation' : 'Reach'}
            />
          </div>
        ) : null;

      /* ── Phase 6a: Media Type ── */
      case 'media-type':
        return goalPhase === 'media-type' ? (
          <div className="ml-8">
            <WizardSectionHeader
              icon={<Globe className="h-5 w-5 text-plum-600" />}
              title="Media Type"
            />
            <div className="space-y-2">
              {(['display', 'social', 'video', 'ctv'] as MediaType[]).map(mt => {
                const config = mediaTypeConfigs[mt];
                return (
                  <button
                    key={mt}
                    onClick={() => {
                      setSelectedMediaType(mt);
                      // Map media type to CPM recommendation key
                      const cpmMap: Record<MediaType, string> = {
                        display: 'Open Web Programmatic',
                        social: 'Social (Walled Gardens)',
                        video: 'Open Web Programmatic',
                        ctv: 'PMP',
                      };
                      setMediaPurchaseMethod(cpmMap[mt]);

                      // If only 1 platform, auto-select and skip platform-select
                      if (config.platforms.length === 1) {
                        setSelectedPlatform(config.platforms[0]);
                        setGoalPhase('off-limits-topics');
                        addVeraMessage(
                          `${config.label} selected — targeting ${platformConfigs[config.platforms[0]].label}. Before we set pricing, let's define your brand safety profile. This determines the quality of environments you're willing to buy in — which directly impacts what CPM is realistic.`,
                          'off-limits-topics',
                        );
                      } else {
                        // Multiple platforms — show platform-select
                        setGoalPhase('platform-select');
                        addVeraMessage(
                          `${config.label} — great choice. Now, which platform will you be running on? Each has different measurement capabilities and optimization levers.`,
                          'platform-select',
                        );
                      }
                    }}
                    className="flex items-start gap-3 w-full px-4 py-3 rounded-xl border border-neutral-200 hover:border-plum-200 hover:bg-plum-25 transition-all text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Globe className="h-4 w-4 text-plum-600" />
                    </div>
                    <div>
                      <p className="text-body3 font-semibold text-cool-900">{config.label}</p>
                      <p className="text-label text-cool-500">{config.desc}</p>
                      <p className="text-caption text-cool-400 mt-0.5">{config.metricFocus}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : isPastPhase('media-type') ? (
          <div className="ml-8">
            <StepSummary
              icon={<Globe className="h-3.5 w-3.5 text-cool-500" />}
              label="Media Type"
              value={selectedMediaType ? mediaTypeConfigs[selectedMediaType].label : ''}
            />
          </div>
        ) : null;

      /* ── Phase 6b: Platform Select ── */
      case 'platform-select': {
        const availablePlatforms = selectedMediaType ? mediaTypeConfigs[selectedMediaType].platforms : [];
        return goalPhase === 'platform-select' ? (
          <div className="ml-8">
            <WizardSectionHeader
              icon={<Globe className="h-5 w-5 text-plum-600" />}
              title="Select Platform"
            />
            <div className="space-y-2">
              {availablePlatforms.map(p => {
                const pConfig = platformConfigs[p];
                return (
                  <button
                    key={p}
                    onClick={() => {
                      setSelectedPlatform(p);
                      setGoalPhase('off-limits-topics');
                      addVeraMessage(
                        `${pConfig.label} selected. Before we set pricing, let's define your brand safety profile. This determines the quality of environments you're willing to buy in — which directly impacts what CPM is realistic. Based on your CPG Beverage category, I'd recommend **Moderate** for the best balance.`,
                        'off-limits-topics',
                      );
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-neutral-200 hover:border-plum-200 hover:bg-plum-25 transition-all text-left"
                  >
                    <PlatformBadge platform={p} size="md" showLabel={false} />
                    <div>
                      <p className="text-body3 font-semibold text-cool-900">{pConfig.label}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : isPastPhase('platform-select') && selectedPlatform ? (
          <div className="ml-8">
            <StepSummary
              icon={<Globe className="h-3.5 w-3.5 text-cool-500" />}
              label="Platform"
              value={selectedPlatform ? platformConfigs[selectedPlatform].label : ''}
            />
          </div>
        ) : null;
      }

      /* ── Phase 6: CPM Target — Smart Recommendation ── */
      case 'target-cpm': {
        const cpmRec = getCpmRecommendation(mediaPurchaseMethod, goalObjective, safetyTier || undefined);
        const cpmNum = parseFloat(targetCpm) || 0;
        const isBelowWarning = targetCpm !== '' && cpmNum > 0 && cpmNum < cpmRec.warningThreshold;
        const isAtRecommended = targetCpm === cpmRec.recommended;

        return goalPhase === 'target-cpm' ? (
          <div className="ml-8">
            <WizardSectionHeader
              icon={<DollarSign className="h-5 w-5 text-plum-600" />}
              title="CPM Target"
            />
            <div className="space-y-3">
              {/* Vera's recommendation card */}
              <div className="rounded-xl border border-plum-200 bg-gradient-to-b from-plum-25 to-white p-3.5">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-plum-500" />
                  <span className="text-body3 font-semibold text-cool-900">Vera's Recommended CPM</span>
                </div>
                <div className="flex items-baseline gap-2 mb-2.5">
                  <span className="text-h4 font-bold text-plum-700">${cpmRec.recommended}</span>
                  <span className="text-label text-cool-400">CPAI</span>
                </div>
                {/* Efficiency breakdown */}
                <div className="flex items-center gap-2 mb-2.5">
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-100">
                    <p className="text-label text-cool-400">Market CPM</p>
                    <p className="text-body3 font-semibold text-cool-700">{cpmRec.marketCpm}</p>
                  </div>
                  <div className="text-label text-cool-300">+</div>
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-white border border-neutral-100">
                    <p className="text-label text-cool-400">Authenticity Gap</p>
                    <p className="text-body3 font-semibold text-plum-600">{cpmRec.cpaiPremium}</p>
                  </div>
                  <div className="text-label text-cool-300">=</div>
                  <div className="flex-1 px-2.5 py-1.5 rounded-lg bg-plum-50 border border-plum-100">
                    <p className="text-label text-plum-500">Target CPAI</p>
                    <p className="text-body3 font-bold text-plum-700">${cpmRec.recommended}</p>
                  </div>
                </div>
                <p className="text-label text-cool-500 leading-relaxed">{cpmRec.justification}</p>
                {/* Use recommendation button */}
                {!isAtRecommended && (
                  <button
                    onClick={() => setTargetCpm(cpmRec.recommended)}
                    className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-plum-200 bg-white text-body3 font-medium text-plum-600 hover:bg-plum-25 hover:border-plum-300 transition-all"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Use recommended ${cpmRec.recommended}
                  </button>
                )}
              </div>

              {/* Editable input */}
              <div>
                <label className="text-label font-medium text-cool-500 mb-1.5 block">Your CPM Target</label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-body2 font-semibold text-cool-500">$</div>
                  <input
                    type="text"
                    value={targetCpm}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, '');
                      setTargetCpm(val);
                    }}
                    placeholder="0.00"
                    className={cn(
                      'w-full h-11 pl-8 pr-3 text-body2 bg-white border rounded-lg outline-none transition-colors',
                      isBelowWarning
                        ? 'border-orange-300 focus:border-orange-400 focus:ring-2 focus:ring-orange-100'
                        : 'border-neutral-200 focus:border-plum-300 focus:ring-2 focus:ring-plum-100'
                    )}
                  />
                  {isAtRecommended && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-plum-50 border border-plum-100">
                      <Sparkles className="h-3 w-3 text-plum-500" />
                      <span className="text-label font-medium text-plum-600">Recommended</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning when below threshold */}
              {isBelowWarning && (
                <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl bg-orange-25 border border-orange-200">
                  <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-body3 font-semibold text-orange-700">Below recommended range</p>
                    <p className="text-label text-orange-600 mt-0.5 leading-relaxed">{cpmRec.warningMessage}</p>
                  </div>
                </div>
              )}

              <button
                onClick={() => {
                  if (!targetCpm) return;
                  const matchesRec = targetCpm === cpmRec.recommended;
                  setGoalPhase('goal-naming');
                  addVeraMessage(
                    matchesRec
                      ? `$${targetCpm} CPAI locked in — right on target. Almost done! Let's give this goal a name so you can find it on your dashboard.`
                      : `$${targetCpm} CPM set${parseFloat(targetCpm) < cpmRec.warningThreshold ? ' — keep an eye on quality metrics once the campaign is live' : ''}. Almost done! Let's give this goal a name.`,
                    'goal-naming',
                  );
                }}
                disabled={!targetCpm}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                Continue
              </button>
            </div>
          </div>
        ) : isPastPhase('target-cpm') ? (
          <div className="ml-8">
            <StepSummary
              icon={<DollarSign className="h-3.5 w-3.5 text-cool-500" />}
              label="CPM Target"
              value={`$${targetCpm}${targetCpm === cpmRec.recommended ? ' (recommended)' : ''}`}
            />
          </div>
        ) : null;
      }

      /* ── Phase 7: Brand Safety Tier ── */
      case 'off-limits-topics':
        return goalPhase === 'off-limits-topics' ? (
          <div className="ml-8">
            <WizardSectionHeader
              icon={<ShieldCheck className="h-5 w-5 text-plum-600" />}
              title="Brand Safety Profile"
            />
            <div className="space-y-2.5">
              {SAFETY_TIERS.map(tier => {
                const isSelected = safetyTier === tier.key;
                return (
                  <button
                    key={tier.key}
                    onClick={() => setSafetyTier(tier.key)}
                    className={cn(
                      'w-full rounded-xl border-2 p-4 text-left transition-all',
                      isSelected
                        ? `${tier.borderColor} ${tier.selectedBg}`
                        : 'border-neutral-200 bg-white hover:border-neutral-300 hover:bg-neutral-25'
                    )}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className={cn(tier.color)}>{tier.icon}</div>
                      <div>
                        <span className="text-body3 font-semibold text-cool-900">{tier.name}</span>
                        <span className="text-body3 text-cool-500 ml-1.5">&middot; {tier.alias}</span>
                      </div>
                      {isSelected && (
                        <div className="ml-auto w-5 h-5 rounded-full bg-plum-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-body3 text-cool-600 mb-2">{tier.bestFor}</p>
                    <div className="flex items-center gap-3 mb-2.5">
                      {tier.metrics.map(m => (
                        <div key={m.label} className="flex-1 px-2 py-1.5 rounded-lg bg-white/70 border border-neutral-100">
                          <p className="text-label text-cool-500">{m.label}</p>
                          <p className="text-body3 font-semibold text-cool-900">{m.value}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-neutral-100">
                      <p className="text-label font-medium text-cool-500 mb-1">Blocks:</p>
                      <div className="flex flex-wrap gap-1">
                        {tier.blockedExamples.map(topic => (
                          <span key={topic} className="px-1.5 py-0.5 rounded text-label text-cool-600 bg-neutral-100">
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button
                onClick={() => {
                  if (!safetyTier) return;
                  const tier = SAFETY_TIERS.find(t => t.key === safetyTier)!;
                  const rec = getCpmRecommendation(mediaPurchaseMethod, goalObjective, safetyTier);
                  setTargetCpm(rec.recommended);
                  setGoalPhase('target-cpm');
                  addVeraMessage(
                    `${tier.name} profile selected — ${tier.alias}. Now I've cross-referenced your **${tier.name}** safety tier with **${selectedMediaType ? mediaTypeConfigs[selectedMediaType].label : mediaPurchaseMethod}** pricing to calculate a CPM target. A ${tier.name.toLowerCase()} tier means ${safetyTier === 'strict' ? 'higher block rates and tighter quality filters, which commands a premium' : safetyTier === 'moderate' ? 'balanced filtering that keeps CPMs competitive while protecting your brand' : 'minimal filtering, keeping costs low but requiring more post-bid monitoring'}. You can adjust this, but I'll flag if you go too low for your protection level.`,
                    'target-cpm',
                  );
                }}
                disabled={!safetyTier}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                Continue
              </button>
            </div>
          </div>
        ) : isPastPhase('off-limits-topics') ? (
          <div className="ml-8">
            <StepSummary
              icon={<ShieldCheck className="h-3.5 w-3.5 text-cool-500" />}
              label="Brand Safety"
              value={`${SAFETY_TIERS.find(t => t.key === safetyTier)?.name ?? ''} — ${SAFETY_TIERS.find(t => t.key === safetyTier)?.alias ?? ''}`}
            />
          </div>
        ) : null;

      /* ── Phase 8: Goal Naming ── */
      case 'goal-naming':
        return goalPhase === 'goal-naming' ? (
          <div className="ml-8">
            <WizardSectionHeader
              icon={<Target className="h-5 w-5 text-plum-600" />}
              title="Name Your Goal"
            />
            <div className="space-y-3">
              <input
                type="text"
                value={goalName}
                onChange={(e) => setGoalName(e.target.value)}
                placeholder="Harbor Brew Zero - US"
                className="w-full h-11 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
              />
              <button
                onClick={() => {
                  if (!goalName.trim()) return;
                  setGoalCreated(true);
                  setGoalPhase('goal-created');
                  addVeraMessage(
                    `"${goalName.trim()}" is live and showing on your Goals dashboard! Now that your goal is created, prevent mistakes and automate brand safety controls by connecting your DSP. It takes about 30 seconds and I'll handle the syncing for you.`,
                    'goal-created',
                  );
                }}
                disabled={!goalName.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400"
              >
                Create Goal
              </button>
            </div>
          </div>
        ) : isPastPhase('goal-naming') ? (
          <div className="ml-8">
            <StepSummary
              icon={<FileText className="h-3.5 w-3.5 text-cool-500" />}
              label="Goal Name"
              value={goalName || 'Unnamed Goal'}
            />
          </div>
        ) : null;

      /* ── Phase 9: Goal Created + DSP Upsell ── */
      case 'goal-created':
        return goalPhase === 'goal-created' ? (
          <div className="space-y-3 ml-8">
            {/* Success banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200">
              <div className="w-6 h-6 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-body3 font-medium text-grass-700">Goal Created</p>
                <p className="text-body3 text-cool-600 mt-0.5">{goalName}</p>
              </div>
            </div>

            {/* Connected DSPs */}
            {goalConnectedDsps.map((dsp) => (
              <div key={`${dsp.platform}-${dsp.seatId}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-grass-100 bg-grass-25">
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-label font-bold', DSP_PLATFORMS.find(p => p.value === dsp.platform)?.color)}>
                  {DSP_PLATFORMS.find(p => p.value === dsp.platform)?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body3 font-medium text-cool-900">{dsp.platformLabel}</p>
                  <p className="text-label text-cool-500">{dsp.seatId}</p>
                </div>
                <Check className="h-4 w-4 text-grass-600 flex-shrink-0" />
              </div>
            ))}

            {/* DSP Connect form */}
            {(goalShowDspForm || goalConnectedDsps.length === 0) && (
              <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-plum-25 to-white border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Globe className="h-5 w-5 text-plum-600" />
                    <span className="text-body2 font-semibold text-cool-900">Connect Your DSP</span>
                  </div>
                  <ul className="mt-2 space-y-1.5">
                    {[
                      'Reduce operational load \u2014 we handle the syncing so you don\'t have to',
                      'Prevent mistakes \u2014 automated brand safety controls eliminate manual errors',
                      'Connect campaigns automatically across your DSP platforms',
                      'Unlock financial analysis and optimization insights based on your campaign data',
                    ].map((benefit, i) => (
                      <li key={i} className="flex items-start gap-2 text-body3 text-cool-600">
                        <Check className="h-3.5 w-3.5 text-grass-500 flex-shrink-0 mt-0.5" />
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Platform</label>
                    <div className="relative">
                      <select
                        value={goalDspPlatform}
                        onChange={(e) => setGoalDspPlatform(e.target.value)}
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
                      value={goalDspSeatId}
                      onChange={(e) => setGoalDspSeatId(e.target.value)}
                      placeholder="Enter seat ID..."
                      className="w-full h-10 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
                    />
                  </div>
                  <button
                    onClick={handleGoalConnectDsp}
                    disabled={!goalDspPlatform || !goalDspSeatId.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-plum-200 bg-plum-50 text-plum-700 text-body3 font-medium hover:bg-plum-100 transition-colors disabled:bg-neutral-50 disabled:text-neutral-400 disabled:border-neutral-200"
                  >
                    <Globe className="h-4 w-4" />
                    Connect
                  </button>
                </div>
              </div>
            )}

            {goalConnectedDsps.length > 0 && !goalShowDspForm && (
              <button
                onClick={() => setGoalShowDspForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-cool-600 text-body3 font-medium hover:bg-neutral-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Another DSP
              </button>
            )}

            {goalConnectedDsps.length > 0 && (
              <button
                onClick={() => setGoalPhase('dsp-syncing')}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
              >
                Sync {goalConnectedDsps.length} DSP Seat{goalConnectedDsps.length !== 1 ? 's' : ''}
              </button>
            )}

            <button
              onClick={() => {
                setGoalCreated(true);
                setGoalPhase('complete');
                addVeraMessage(
                  "No problem — you can connect a DSP anytime from your goal settings. Your goal is live and I'll be here whenever you need help optimizing. Here's what you can do next:",
                  'complete',
                );
              }}
              className="text-body3 text-cool-500 hover:text-cool-700 underline underline-offset-2 py-1 w-full text-center"
            >
              Skip for Now
            </button>
          </div>
        ) : null;

      /* ── Phase 10: DSP Syncing ── */
      case 'dsp-syncing':
        return goalPhase === 'dsp-syncing' ? (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 ml-8">
            <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
            <span className="text-body3 text-cool-600">
              Syncing to {goalConnectedDsps.length} DSP seat{goalConnectedDsps.length !== 1 ? 's' : ''}...
            </span>
          </div>
        ) : null;

      /* ── Phase 11: Complete ── */
      case 'complete':
        return goalPhase === 'complete' ? (
          <div className="space-y-2 ml-8">
            <button
              onClick={() => {
                onClose();
                navigate('/goals/goal-5');
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-neutral-200 hover:border-plum-200 hover:bg-plum-25 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-plum-600" />
              </div>
              <div>
                <p className="text-body3 font-semibold text-cool-900">View your new goal</p>
                <p className="text-label text-cool-500">{goalName}</p>
              </div>
            </button>
            <button
              onClick={() => {
                onClose();
                navigate('/goals');
              }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl border border-neutral-200 hover:border-plum-200 hover:bg-plum-25 transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0">
                <ArrowRight className="h-4 w-4 text-cool-500" />
              </div>
              <div>
                <p className="text-body3 font-semibold text-cool-900">Back to Goals</p>
                <p className="text-label text-cool-500">View all your goals</p>
              </div>
            </button>
          </div>
        ) : null;

      default:
        return null;
    }
  }

  /* ─────────────────── RENDER ─────────────────── */

  return (
    <div
      className={cn(
        'flex flex-col bg-white rounded-2xl shadow-sm flex-shrink-0 transition-all duration-300 overflow-hidden',
        open ? 'w-[520px]' : 'w-0'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-plum-100 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-plum-600" />
          </div>
          <div>
            <h3 className="text-body3 font-semibold text-cool-900">Vera</h3>
            <p className="text-label text-cool-400">AI Co-pilot</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 transition-colors">
          <X className="h-4 w-4 text-cool-500" />
        </button>
      </div>

      {/* Messages + inline wizard cards */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map(msg => (
          <div key={msg.id}>
            {/* Chat message bubble */}
            <div className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
              {msg.role === 'vera' && (
                <div className="w-6 h-6 rounded-full bg-plum-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                  <Sparkles className="h-3 w-3 text-plum-600" />
                </div>
              )}
              <div
                className={cn(
                  'max-w-[85%] rounded-xl px-3.5 py-2.5 text-body3 leading-relaxed whitespace-pre-line',
                  msg.role === 'user'
                    ? 'bg-plum-600 text-white rounded-br-sm'
                    : 'bg-neutral-50 text-cool-700 rounded-bl-sm'
                )}
              >
                {msg.content}
              </div>
            </div>

            {/* Inline wizard card — renders directly after the message it belongs to */}
            {isGoalCreate && msg.wizardPhase && (
              <div className="mt-3">
                {renderWizardCard(msg.wizardPhase)}
              </div>
            )}
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="w-6 h-6 rounded-full bg-plum-100 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
              <Sparkles className="h-3 w-3 text-plum-600" />
            </div>
            <div className="bg-neutral-50 rounded-xl rounded-bl-sm px-3.5 py-2.5">
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-cool-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-cool-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-cool-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {/* Brief analyzing spinner — this phase has no associated message, it auto-advances */}
        {isGoalCreate && goalPhase === 'brief-analyzing' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 ml-8">
            <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
            <span className="text-body3 text-cool-600">Analyzing your brief...</span>
          </div>
        )}

        {/* DSP syncing spinner — this phase has no associated message, it auto-advances */}
        {isGoalCreate && goalPhase === 'dsp-syncing' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 ml-8">
            <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
            <span className="text-body3 text-cool-600">
              Syncing to {goalConnectedDsps.length} DSP seat{goalConnectedDsps.length !== 1 ? 's' : ''}...
            </span>
          </div>
        )}

        {/* Campaign analysis: analyzing spinner */}
        {isCampaignAnalyze && campaignAnalyzePhase === 'analyzing' && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 ml-8">
            <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
            <span className="text-body3 text-cool-600">Scanning ad sets, creatives, and quality signals...</span>
          </div>
        )}

        {/* Campaign analysis: diagnosis card */}
        {isCampaignAnalyze && (campaignAnalyzePhase === 'diagnosis' || campaignAnalyzePhase === 'recommendations' || campaignAnalyzePhase === 'done') && (
          <div className="ml-8 rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-orange-50 to-white border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                <span className="text-body3 font-semibold text-cool-900">Performance Diagnosis</span>
              </div>
              <p className="text-label text-cool-500 mt-1">Harbor Brew Zero — Open Web Display</p>
            </div>

            <div className="px-4 py-3 space-y-3">
              {/* AAR hero stat */}
              <div className="flex items-center justify-between">
                <span className="text-body3 text-cool-500">Authentic Ad Rate</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-body1 font-bold text-orange-600">56.8%</span>
                  <TrendingDown className="h-4 w-4 text-orange-500" />
                </div>
              </div>
              <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: '56.8%' }} />
              </div>
              <p className="text-body3 text-cool-500">Industry benchmark: 75% · Your rate is <span className="font-semibold text-orange-600">18.2 pts below</span></p>

              {/* Underperforming pillars */}
              <div className="pt-2 mt-1 border-t border-neutral-100 space-y-2.5">
                <p className="text-label font-semibold text-cool-700 uppercase tracking-wider">Underperforming Pillars</p>

                {[
                  {
                    pillar: 'Viewability',
                    value: '61.2%',
                    benchmark: '70%',
                    gap: '-8.8 pts',
                    icon: <Eye className="h-4 w-4" />,
                    detail: 'Fitness & Active Lifestyle ad set at 58.1% — lowest in campaign',
                  },
                  {
                    pillar: 'Fraud-Free',
                    value: '96.5%',
                    benchmark: '98%',
                    gap: '-1.5 pts',
                    icon: <Ban className="h-4 w-4" />,
                    detail: '4.1% fraud rate on Fitness & Active Lifestyle — above 2% threshold',
                  },
                  {
                    pillar: 'Brand Suitability',
                    value: '92.1%',
                    benchmark: '95%',
                    gap: '-2.9 pts',
                    icon: <Filter className="h-4 w-4" />,
                    detail: 'Open Web placements showing in below-threshold environments',
                  },
                  {
                    pillar: 'In-Geo',
                    value: '93.5%',
                    benchmark: '95%',
                    gap: '-1.5 pts',
                    icon: <MapPin className="h-4 w-4" />,
                    detail: '6.5% of impressions served outside targeted US geography',
                  },
                ].map(p => (
                  <div key={p.pillar} className="flex gap-2.5 p-2.5 rounded-lg bg-orange-25">
                    <div className="mt-0.5 text-orange-500 flex-shrink-0">{p.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-body3 font-semibold text-cool-800">{p.pillar}</span>
                        <span className="text-body3 font-semibold text-orange-600">{p.value} <span className="font-normal text-cool-400">/ {p.benchmark}</span></span>
                      </div>
                      <p className="text-label text-cool-500 mt-0.5">{p.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Campaign analysis: recommendation cards */}
        {isCampaignAnalyze && (campaignAnalyzePhase === 'recommendations' || campaignAnalyzePhase === 'done') && (
          <div className="ml-8 space-y-2">
            {/* Section: Apply Now */}
            <p className="text-label font-semibold text-cool-700 uppercase tracking-wider pt-1">Apply Now</p>
            {([
              {
                idx: 0,
                priority: 'High',
                priorityColor: 'bg-tomato-100 text-tomato-700',
                title: 'Add viewability floor targeting',
                description: 'Set a 60% viewability floor on the Fitness & Active Lifestyle ad set. Based on similar campaigns, this typically improves overall viewability by 8–12 pts with minimal reach loss.',
                impact: '+6–10 pts viewability',
                examples: [
                  { label: 'Post-Workout Refresh — 300x600', detail: '56.2% viewability · 2.2M impr · $4.4K spend', severity: 'bad' as const },
                  { label: 'Gym Fuel Zero — 160x600', detail: '59.5% viewability · 3.0M impr · $6.0K spend', severity: 'bad' as const },
                  { label: 'Refresh Your Day — 728x90', detail: '61.3% viewability · 3.1M impr · $6.2K spend', severity: 'warn' as const },
                ],
              },
              {
                idx: 1,
                priority: 'High',
                priorityColor: 'bg-tomato-100 text-tomato-700',
                title: 'Add geographic targeting constraints',
                description: 'Add a geo-fence to restrict delivery to US-only. 6.5% of impressions are currently being served outside the target geography, wasting $1,612 in spend.',
                impact: '+1.5 pts in-geo',
                examples: [
                  { label: 'Canada', detail: '3.2% of impressions · 397K impr · $794 wasted spend', severity: 'warn' as const },
                  { label: 'United Kingdom', detail: '1.8% of impressions · 223K impr · $446 wasted spend', severity: 'warn' as const },
                  { label: 'Australia + Other', detail: '1.5% of impressions · 186K impr · $372 wasted spend', severity: 'warn' as const },
                ],
              },
            ] as const).map((rec) => {
              const isExpanded = expandedRecs.has(rec.idx);
              const isApplied = appliedRecIds.has(rec.idx);
              return (
                <div key={rec.idx} className={cn('rounded-xl border bg-white overflow-hidden', isApplied ? 'border-grass-200' : 'border-neutral-200')}>
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isApplied
                        ? <span className="px-1.5 py-0.5 rounded text-label font-semibold bg-grass-100 text-grass-700">Applied</span>
                        : <span className={cn('px-1.5 py-0.5 rounded text-label font-semibold', rec.priorityColor)}>{rec.priority}</span>
                      }
                      <span className="text-body3 font-semibold text-cool-900">{rec.title}</span>
                    </div>
                    <p className="text-body3 text-cool-600 leading-relaxed">{rec.description}</p>

                    {/* Expandable examples toggle */}
                    <button
                      onClick={() => setExpandedRecs(prev => {
                        const next = new Set(prev);
                        if (next.has(rec.idx)) next.delete(rec.idx); else next.add(rec.idx);
                        return next;
                      })}
                      className="flex items-center gap-1 mt-2.5 text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
                    >
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                      {isExpanded ? 'Hide' : 'View'} examples ({rec.examples.length})
                    </button>
                  </div>

                  {/* Expandable examples list */}
                  {isExpanded && (
                    <div className="px-3.5 pb-3 space-y-1.5">
                      {rec.examples.map((ex, j) => (
                        <div key={j} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-neutral-50">
                          <span className={cn(
                            'mt-1.5 w-2 h-2 rounded-full flex-shrink-0',
                            ex.severity === 'bad' ? 'bg-tomato-500' : ex.severity === 'warn' ? 'bg-orange-500' : 'bg-grass-500'
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-body3 font-medium text-cool-800">{ex.label}</p>
                            <p className="text-label text-cool-500 mt-0.5">{ex.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Footer with impact + apply/applied */}
                  <div className={cn('flex items-center justify-between px-3.5 py-2.5 border-t', isApplied ? 'border-grass-100 bg-grass-25' : 'border-neutral-100 bg-neutral-25')}>
                    <span className="text-body3 text-grass-600 font-medium">Expected: {rec.impact}</span>
                    {isApplied ? (
                      <span className="flex items-center gap-1 text-body3 font-medium text-grass-600">
                        <Check className="h-3.5 w-3.5" />
                        Applied
                      </span>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          addAppliedRec(rec.idx);
                        }}
                        className="text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
                      >
                        Apply →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Section: Marketplace Add-ons */}
            <p className="text-label font-semibold text-cool-700 uppercase tracking-wider pt-3">From the Marketplace</p>

            {/* Marketplace card 1: DV Performance+ Pre-Bid Viewability */}
            {(() => {
              const isExpanded = expandedRecs.has(2);
              return (
                <div className="rounded-xl border border-plum-100 bg-white overflow-hidden">
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded text-label font-semibold bg-plum-100 text-plum-700">Recommended</span>
                      <span className="text-body3 font-semibold text-cool-900">DV Performance+ Pre-Bid Viewability</span>
                    </div>
                    <p className="text-body3 text-cool-600 leading-relaxed">
                      Activate pre-bid viewability prediction to avoid low-viewability inventory before bidding. Your Fitness & Active Lifestyle ad set is at 58.1% viewability — applying pre-bid filters typically lifts viewability by 10–15 pts.
                    </p>

                    <button
                      onClick={() => setExpandedRecs(prev => {
                        const next = new Set(prev);
                        if (next.has(2)) next.delete(2); else next.add(2);
                        return next;
                      })}
                      className="flex items-center gap-1 mt-2.5 text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
                    >
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                      {isExpanded ? 'Hide' : 'View'} examples (3)
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-3.5 pb-3 space-y-1.5">
                      {[
                        { label: 'Post-Workout Refresh — 300x600', detail: '56.2% viewability · 2.2M impr · Would be filtered by pre-bid', severity: 'bad' as const },
                        { label: 'Gym Fuel Zero — 160x600', detail: '59.5% viewability · 3.0M impr · Below 60% threshold', severity: 'bad' as const },
                        { label: 'Refresh Your Day — 728x90', detail: '61.3% viewability · 3.1M impr · Borderline — pre-bid would optimize', severity: 'warn' as const },
                      ].map((ex, j) => (
                        <div key={j} className="flex items-start gap-2.5 px-3 py-2.5 rounded-lg bg-neutral-50">
                          <span className={cn('mt-1.5 w-2 h-2 rounded-full flex-shrink-0', ex.severity === 'bad' ? 'bg-tomato-500' : 'bg-orange-500')} />
                          <div className="flex-1 min-w-0">
                            <p className="text-body3 font-medium text-cool-800">{ex.label}</p>
                            <p className="text-label text-cool-500 mt-0.5">{ex.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-plum-50 bg-plum-25">
                    <span className="text-body3 text-grass-600 font-medium">Expected: +10–15 pts viewability</span>
                    <a
                      href="/dv-pinnacle-v3/marketplace?insight=pillar-viewable&products=viewability,scibids-ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
                    >
                      Learn More →
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Marketplace card 2: Brand Suitability Segments — with site previews */}
            {(() => {
              const isExpanded = expandedRecs.has(3);
              return (
                <div className="rounded-xl border border-plum-100 bg-white overflow-hidden">
                  <div className="p-3.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="px-1.5 py-0.5 rounded text-label font-semibold bg-plum-100 text-plum-700">Recommended</span>
                      <span className="text-body3 font-semibold text-cool-900">Brand Suitability Segments</span>
                    </div>
                    <p className="text-body3 text-cool-600 leading-relaxed">
                      Add custom brand suitability segments to block "Unscored" and "Low Risk" inventory. This should bring suitability above 95% target without significantly impacting scale.
                    </p>

                    <button
                      onClick={() => setExpandedRecs(prev => {
                        const next = new Set(prev);
                        if (next.has(3)) next.delete(3); else next.add(3);
                        return next;
                      })}
                      className="flex items-center gap-1 mt-2.5 text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
                    >
                      <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', isExpanded && 'rotate-180')} />
                      {isExpanded ? 'Hide' : 'View'} flagged sites (3)
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="px-3.5 pb-3 space-y-2">
                      {[
                        { domain: 'fitnessnewsdaily.com', initials: 'FN', color: 'bg-tomato-100 text-tomato-700', tag: 'Unscored', tagColor: 'bg-tomato-100 text-tomato-700', impressions: '340K', detail: 'Alcohol-adjacent content detected on article pages', image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=200&fit=crop&q=80' },
                        { domain: 'extremesportszone.net', initials: 'ES', color: 'bg-orange-100 text-orange-700', tag: 'Low Risk', tagColor: 'bg-orange-100 text-orange-700', impressions: '185K', detail: 'Injury-related imagery and content near ad placements', image: 'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400&h=200&fit=crop&q=80' },
                        { domain: 'supplementreviews.io', initials: 'SR', color: 'bg-orange-100 text-orange-700', tag: 'Low Risk', tagColor: 'bg-orange-100 text-orange-700', impressions: '112K', detail: 'Unverified health claims alongside ad inventory', image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=200&fit=crop&q=80' },
                      ].map((site, j) => (
                        <div key={j} className="rounded-lg border border-neutral-150 bg-neutral-50 overflow-hidden">
                          {/* Site preview with real image */}
                          <div className="h-24 relative">
                            <img src={site.image} alt={site.domain} className="absolute inset-0 w-full h-full object-cover" />
                            {/* Browser chrome overlay */}
                            <div className="absolute inset-x-0 top-0 h-5 bg-white/90 backdrop-blur-sm flex items-center px-2 gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-tomato-300" />
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-300" />
                              <span className="w-1.5 h-1.5 rounded-full bg-grass-300" />
                              <span className="flex-1 mx-1.5 h-2.5 rounded bg-neutral-200 text-[7px] flex items-center px-1 text-cool-400 truncate">{site.domain}</span>
                            </div>
                            {/* Suitability tag overlay */}
                            <div className="absolute top-7 right-2">
                              <span className={cn('px-1.5 py-0.5 rounded text-[9px] font-bold shadow-sm', site.tagColor)}>{site.tag}</span>
                            </div>
                            {/* Bottom gradient for readability */}
                            <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/30 to-transparent" />
                          </div>
                          {/* Site info */}
                          <div className="px-3 py-2">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0', site.color)}>
                                {site.initials}
                              </div>
                              <span className="text-body3 font-medium text-cool-800 truncate">{site.domain}</span>
                              <span className="text-label text-cool-400 flex-shrink-0">{site.impressions} impr</span>
                            </div>
                            <p className="text-label text-cool-500 mt-1">{site.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between px-3.5 py-2.5 border-t border-plum-50 bg-plum-25">
                    <span className="text-body3 text-grass-600 font-medium">Expected: +3 pts suitability</span>
                    <a
                      href="/dv-pinnacle-v3/marketplace?insight=pillar-suitability&products=brand-suitability"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
                    >
                      Learn More →
                    </a>
                  </div>
                </div>
              );
            })()}

            {/* Summary footer */}
            <div className="rounded-xl bg-grass-50 border border-grass-100 p-3.5 mt-1">
              <div className="flex items-center gap-2 mb-1">
                <Check className="h-4 w-4 text-grass-600" />
                <span className="text-body3 font-semibold text-grass-800">Projected Impact</span>
              </div>
              <p className="text-body3 text-grass-700">
                Applying all recommendations could improve your Authentic Ad Rate from <span className="font-semibold">56.8%</span> to an estimated <span className="font-semibold">68–72%</span>, much closer to the 75% industry benchmark.
              </p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts — only for general chat at initial state */}
      {!isGoalCreate && !isCampaignAnalyze && messages.length <= 1 && (
        <div className="px-4 pb-3 space-y-1.5">
          <p className="text-label text-cool-400 font-medium uppercase tracking-wider">Suggested</p>
          {quickPrompts.map(prompt => (
            <button
              key={prompt}
              onClick={() => handleQuickPrompt(prompt)}
              className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-body3 text-cool-600 bg-neutral-50 hover:bg-neutral-100 transition-colors text-left"
            >
              <span>{prompt}</span>
              <ArrowRight className="h-3.5 w-3.5 text-cool-400 flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      )}

      {/* Input — visible for general + campaign-analyze, hidden during goal-create wizard */}
      {!isGoalCreate && (
        <div className="px-4 pb-4 pt-2 border-t border-neutral-100 flex-shrink-0">
          <div className="relative flex items-end bg-neutral-50 rounded-xl border border-neutral-200 focus-within:border-plum-300 focus-within:ring-2 focus-within:ring-plum-100 transition-all">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Vera anything..."
              rows={1}
              className="flex-1 bg-transparent px-3.5 py-2.5 text-body3 text-cool-700 placeholder:text-cool-400 resize-none focus:outline-none max-h-24"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className={cn(
                'p-2 mr-1 mb-1 rounded-lg transition-colors',
                input.trim()
                  ? 'bg-plum-600 text-white hover:bg-plum-700'
                  : 'text-cool-300'
              )}
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-label text-cool-400 mt-2">
            Vera can make mistakes. Verify important information.
          </p>
        </div>
      )}
    </div>
  );
}

/* ─── Simulated responses for general chat ─── */

function getSimulatedResponse(input: string): string {
  const lower = input.toLowerCase();
  if (lower.includes('brand awareness') || lower.includes('create')) {
    return "Great choice! Let's set up a brand awareness goal. I'll need a few details:\n\n1. What's the campaign name?\n2. Which platforms are you targeting? (Open Web, CTV, Meta, etc.)\n3. What's your target Authentic Ad Rate?\n\nI can pre-fill based on your past campaigns if you'd like.";
  }
  if (lower.includes('kpi') || lower.includes('ctv')) {
    return 'For CTV campaigns, I recommend targeting:\n\n- Authentic Ad Rate: 85%+\n- Viewability: 90%+ (CTV typically performs well here)\n- Fraud-Free: 99%+\n- Brand Suitability: 98%+\n\nWould you like me to set these up as a new goal?';
  }
  if (lower.includes('viewability')) {
    return "Based on your current goals, the Always-On Brand Snack Portfolio has the lowest viewability at 59.8%. I'd recommend:\n\n1. Reviewing placement-level data for low-performing sites\n2. Adding viewability floor targeting at 60%+\n3. Shifting budget toward higher-viewability inventory\n\nWant me to show the placement breakdown?";
  }
  if (lower.includes('fraud')) {
    return "Your fraud rates look generally healthy. The Always-On Brand Snack Portfolio has a 3.1% fraud rate \u2014 above the 2% threshold. I'd suggest:\n\n1. Enable pre-bid fraud filtering on all campaigns\n2. Block suspicious domains identified in the last 30 days\n3. Set up automated alerts for fraud spikes\n\nShall I create these recommendations as action items?";
  }
  return "I understand you're asking about that. Let me analyze your current campaign data and get back to you with specific recommendations. Is there a particular goal or campaign you'd like me to focus on?";
}
