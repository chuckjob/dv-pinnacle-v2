import { useState, useRef, useEffect } from "react";
import { X, Sparkles, Send, Globe, FileText, Loader2, ShieldCheck, Maximize2, Minimize2, Check, ChevronDown, ChevronRight, ExternalLink, Star, AlertTriangle, Zap, Plus, Upload, Copy, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type VeraContext, useVeraContext } from "@/components/layout/AppLayout";
import { brandSafetyProfiles } from "@/data/mockData";

interface Message {
  id: string;
  role: "user" | "vera";
  content: string;
  type?: "text" | "attachment" | "brand-report";
}

const quickQuestions = [
  "Why is my block rate increasing?",
  "Which campaigns need attention?",
  "How can I reduce media inefficiency?",
  "Compare my performance to benchmarks",
];

const initialMessages: Message[] = [
  {
    id: "1",
    role: "vera",
    content: "Hi! I'm Vera, your AI assistant. I can help you understand your campaign performance, brand safety metrics, and optimization opportunities. What would you like to know?",
  },
];

const brandSafetyInitialMessages: Message[] = [
  {
    id: "bs-1",
    role: "vera",
    content: "Hi Robbin, I see you're setting up a new profile for the Harbor Brew Zero account. Based on your previous 3 campaigns and the global brand safety standards we have on file for this seat, I've pre-selected your 'Standard Tier' exclusions.",
  },
];

const analyzeInitialMessages: Message[] = [
  {
    id: "bsa-1",
    role: "vera",
    content: "Analyzing campaign data...",
  },
];

// ─── Analyze flow data ───────────────────────────────────────────────
const analyzeTopicBreakdown = [
  { topic: "Iran — Water Crisis", inventoryBlocked: "3.2%", industryBlocking: "12%", impact: "high" as const },
  { topic: "Iran — Politics", inventoryBlocked: "1.8%", industryBlocking: "34%", impact: "medium" as const },
  { topic: "Iran — War", inventoryBlocked: "1.1%", industryBlocking: "45%", impact: "medium" as const },
];

const analyzeBlockedUrls = [
  {
    topic: "Iran — Water Crisis", impactColor: "tomato" as const, inventoryBlocked: "3.2%", urlsToday: 12,
    urls: [
      { domain: "reuters.com", path: "/world/middle-east/iran-water-shortage-levels", blockedAgo: "2 hours ago", attribution: "8.4/10",
        thumbnail: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=240&h=160&fit=crop",
        title: "Iran faces worst water shortage in decades as reservoirs dry up",
        classification: { risk: "Medium Risk", category: "Death & Injury (D&I)",
          explanation: "The Death & Injury, Medium Risk category refers to pages that primarily discuss real-world serious injuries or medical harm and their consequences, without graphic depictions.",
          pageContext: "This page is a Reuters news article reporting on Iran's escalating water crisis, documenting displacement of farming communities and citing health officials warning of waterborne disease outbreaks.",
          indicators: ["\"drought has displaced over 200,000 farming families\" — describes large-scale humanitarian displacement", "\"waterborne diseases are on the rise in southern provinces\" — discusses health consequences", "\"agricultural collapse threatens food security\" — details real-world harm and systemic consequences", "\"children are the most vulnerable to dehydration\" — references harm to vulnerable populations"] } },
      { domain: "aljazeera.com", path: "/news/2024/iran-drought-agriculture", blockedAgo: "4 hours ago", attribution: "7.9/10",
        thumbnail: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=240&h=160&fit=crop",
        title: "Iran's drought threatens agricultural backbone of rural economy",
        classification: { risk: "Medium Risk", category: "Death & Injury (D&I)",
          explanation: "This content discusses real-world humanitarian consequences without graphic depictions.",
          pageContext: "This page is an Al Jazeera feature on how prolonged drought has devastated Iran's agricultural sector.",
          indicators: ["\"crop failures have led to widespread poverty\" — details economic harm", "\"farmer suicides linked to drought\" — references death as consequence", "\"wells are drying up across central Iran\" — environmental crisis context"] } },
    ], lostImpressions: "45,200",
  },
  {
    topic: "Iran — Politics", impactColor: "orange" as const, inventoryBlocked: "1.8%", urlsToday: 8,
    urls: [
      { domain: "bbc.com", path: "/news/world-middle-east/iran-economic-reforms", blockedAgo: "5 hours ago", attribution: "8.7/10",
        thumbnail: "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?w=240&h=160&fit=crop",
        title: "Iran unveils new economic reform package amid international tensions",
        classification: { risk: "Low Risk", category: "Politics",
          explanation: "Political content that discusses policy and governance without extremism or violence.",
          pageContext: "This BBC article covers Iran's new economic reform legislation.",
          indicators: ["\"new trade agreements signed with regional partners\" — standard political coverage", "\"parliament debates economic reforms\" — discusses governance processes"] } },
      { domain: "economist.com", path: "/middle-east/iran-policy-analysis", blockedAgo: "8 hours ago", attribution: "9.3/10",
        thumbnail: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=240&h=160&fit=crop",
        title: "Analysing Iran's shifting foreign policy landscape in 2026",
        classification: { risk: "Low Risk", category: "Politics",
          explanation: "Analytical political coverage focused on policy rather than conflict.",
          pageContext: "The Economist's in-depth analysis of Iran's diplomatic strategies.",
          indicators: ["\"diplomatic channels remain open\" — standard geopolitical reporting", "\"economic sanctions continue to shape policy\" — factual analysis"] } },
    ], lostImpressions: "28,400",
  },
  {
    topic: "Iran — War", impactColor: "orange" as const, inventoryBlocked: "1.1%", urlsToday: 5,
    urls: [
      { domain: "apnews.com", path: "/entertainment/iran-iraq-war-documentary", blockedAgo: "1 day ago", attribution: "7.6/10",
        thumbnail: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=240&h=160&fit=crop",
        title: "New documentary explores legacy of Iran-Iraq war through survivor stories",
        classification: { risk: "Low Risk", category: "Conflict & War",
          explanation: "Historical content discussing past conflicts in educational/documentary context.",
          pageContext: "An AP News article about a new documentary film exploring the Iran-Iraq war.",
          indicators: ["\"documentary focuses on healing and reconciliation\" — retrospective, not active conflict", "\"survivors share stories of resilience\" — human interest angle", "\"film aims to educate younger generations\" — educational framing"] } },
      { domain: "smithsonianmag.com", path: "/history/iran-iraq-war-legacy", blockedAgo: "1 day ago", attribution: "8.9/10",
        thumbnail: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=240&h=160&fit=crop",
        title: "The lasting legacy of the Iran-Iraq war on Middle Eastern geopolitics",
        classification: { risk: "Low Risk", category: "Conflict & War",
          explanation: "Historical and academic analysis of past conflict.",
          pageContext: "A Smithsonian Magazine long-form article examining how the Iran-Iraq war shaped modern Middle Eastern politics.",
          indicators: ["\"scholars argue the war reshaped regional alliances\" — academic perspective", "\"impact on UN security framework\" — institutional analysis"] } },
    ], lostImpressions: "18,700",
  },
];

/** Brand Intelligence Report card for Harbor Brew Zero */
function BrandIntelligenceReport({ expanded }: { expanded: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-5 py-4 bg-gradient-to-r from-plum-50 to-white border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-4.5 w-4.5 text-plum-600" />
          <span className="text-body3 font-semibold text-cool-900">Brand Intelligence Report</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center text-lg font-bold text-amber-800">
            HB
          </div>
          <div>
            <span className="text-body3 font-semibold text-cool-900">Harbor Brew Zero</span>
            <p className="text-caption text-cool-500 mt-0.5">harborbrewzero.com · Founded 2019 · Portland, Oregon</p>
          </div>
        </div>
      </div>
      <div className="px-5 py-4 border-b border-neutral-100">
        <p className="text-caption font-semibold text-cool-500 uppercase tracking-wider mb-2.5">Products & Services</p>
        <div className={cn("grid gap-2", expanded ? "grid-cols-4" : "grid-cols-2")}>
          {[
            { name: "Zero-Alcohol Craft Beer", sub: "Flagship Product Line" },
            { name: "Seasonal Brews", sub: "Limited Edition Releases" },
            { name: "Variety Packs", sub: "Retail & DTC" },
            { name: "Merchandise & Events", sub: "Brand Experiences" },
          ].map((p) => (
            <div key={p.name} className="px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-25">
              <p className="text-body3 font-medium text-cool-800">{p.name}</p>
              <p className="text-caption text-cool-500 mt-0.5">{p.sub}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 border-b border-neutral-100">
        <p className="text-caption font-semibold text-cool-500 uppercase tracking-wider mb-2.5">Target Audiences</p>
        <div className={cn("grid gap-2", expanded ? "grid-cols-4" : "grid-cols-2")}>
          {[
            { name: "Health-Conscious Adults", sub: "Ages 25-45, active lifestyle" },
            { name: "Sober-Curious Consumers", sub: "Exploring alcohol-free options" },
            { name: "Craft Beer Enthusiasts", sub: "Quality-driven, flavor-focused" },
            { name: "Social Drinkers", sub: "Looking for NA alternatives" },
          ].map((a) => (
            <div key={a.name} className="px-3 py-2 rounded-lg border border-neutral-100 bg-neutral-25">
              <p className="text-body3 font-medium text-cool-800">{a.name}</p>
              <p className="text-caption text-cool-500 mt-0.5">{a.sub}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 border-b border-neutral-100">
        <p className="text-caption font-semibold text-cool-500 uppercase tracking-wider mb-2.5">Brand Values</p>
        <div className="flex flex-wrap gap-2">
          {["Wellness", "Authenticity", "Inclusivity", "Craftsmanship"].map((v) => (
            <span key={v} className="px-2.5 py-1 rounded-full text-body3 font-medium bg-turquoise-25 text-turquoise-700 border border-turquoise-100">
              {v}
            </span>
          ))}
        </div>
      </div>
      <div className="px-5 py-4 bg-amber-50">
        <p className="text-caption font-semibold text-amber-800 uppercase tracking-wider mb-2.5">Content Context to Consider</p>
        <ul className="space-y-1.5">
          {[
            "Alcohol-related content (avoid association with alcoholic beverages)",
            "Content promoting binge drinking or underage drinking",
            "Competitive NA beer brands in editorial context",
            "Health misinformation about non-alcoholic beverages",
          ].map((item, i) => (
            <li key={i} className="text-body3 text-cool-700 flex items-start gap-2">
              <span className="text-amber-500 mt-0.5">•</span>
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/* ========== COLLAPSED SECTION SUMMARY (approved state) ========== */

function CollapsedSectionSummary({
  icon,
  title,
  subtitle,
  onEdit,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onEdit?: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3">
        <div className="flex items-center gap-2 mb-1">
          {icon}
          <span className="text-body3 font-semibold text-cool-900">{title}</span>
        </div>
        <p className="text-body3 text-cool-600 mb-2">{subtitle}</p>
        <div className="flex items-center gap-2">
          <Check className="h-4 w-4 text-grass-600" />
          <span className="text-body3 text-grass-700 font-medium">Approved</span>
          {onEdit && (
            <button onClick={onEdit} className="text-body3 text-plum-600 hover:text-plum-700 font-medium ml-auto">Edit</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ========== TIER SYSTEM ========== */

type TierKey = "minimal" | "standard" | "strict";

interface TierConfig {
  key: TierKey;
  name: string;
  alias: string;
  bestFor: string;
  veraPitch: string;
  reachImpact: string;
  learnMoreUrl: string;
}

const tierConfigs: TierConfig[] = [
  {
    key: "minimal",
    name: "Minimal",
    alias: "The Reach Tier",
    bestFor: "High-volume performance campaigns or brands with very high risk tolerance (e.g., entertainment, gaming).",
    veraPitch: "You'll get the lowest CPMs and the most scale, but you might appear near some 'edgy' content.",
    reachImpact: "+18%",
    learnMoreUrl: "#",
  },
  {
    key: "standard",
    name: "Standard",
    alias: "The Balanced Tier",
    bestFor: "Most B2B and B2C brands (like Harbor Brew Zero).",
    veraPitch: "The industry gold standard. It protects your brand while maintaining healthy scale and performance.",
    reachImpact: "Baseline",
    learnMoreUrl: "#",
  },
  {
    key: "strict",
    name: "Strict",
    alias: "The Protective Tier",
    bestFor: "Sensitive brands (Children's products, Financial Services, or Luxury).",
    veraPitch: "Maximum protection. Your ads will only appear in 'safe-haven' environments, though your cost-per-click might increase slightly.",
    reachImpact: "-12%",
    learnMoreUrl: "#",
  },
];

const tierTransitionMessages: Record<string, { benefit: string; tradeoff: string }> = {
  "standard→minimal": {
    benefit: "You'll unlock approximately 18% more reach and see CPMs drop by about 12%.",
    tradeoff: "Your ads may appear near content that most brands would avoid, including unmoderated forums and tabloid-style news.",
  },
  "standard→strict": {
    benefit: "You'll avoid 100% of the 'Social Issue' and 'Financial' content detected last week.",
    tradeoff: "I estimate your available reach will drop by about 12% and cost-per-click might increase by ~8%.",
  },
  "minimal→standard": {
    benefit: "You'll block the 'Big Six' categories — Violence, Adult, Hate Speech, and more — while maintaining healthy scale.",
    tradeoff: "Expect CPMs to increase slightly as lower-quality inventory is filtered out.",
  },
  "minimal→strict": {
    benefit: "Maximum brand protection — your ads will only appear in premium, safe-haven environments.",
    tradeoff: "Available reach drops significantly, and cost-per-click will increase by ~8%.",
  },
  "strict→standard": {
    benefit: "You'll regain approximately 12% more reach and see cost-per-click normalize.",
    tradeoff: "Some moderate-risk content like social issues and financial topics will no longer be blocked.",
  },
  "strict→minimal": {
    benefit: "Maximum reach and the lowest CPMs — ideal for scale-focused campaigns.",
    tradeoff: "Only extreme content will be blocked. Your ads may appear near edgy or unmoderated content.",
  },
};

/* ========== DSP PLATFORMS ========== */

const dspPlatforms = [
  { value: "dv360", label: "DV360", icon: "D", color: "bg-blue-100 text-blue-700" },
  { value: "ttd", label: "The Trade Desk", icon: "T", color: "bg-emerald-100 text-emerald-700" },
  { value: "amazon", label: "Amazon DSP", icon: "A", color: "bg-amber-100 text-amber-700" },
  { value: "xandr", label: "Xandr", icon: "X", color: "bg-purple-100 text-purple-700" },
  { value: "yahoo", label: "Yahoo DSP", icon: "Y", color: "bg-pink-100 text-pink-700" },
];

interface ConnectedDsp {
  platform: string;
  platformLabel: string;
  seatId: string;
}

/* ========== CAMPAIGN SETUP WIZARD ========== */

type CampaignSetupPhase =
  | "creation-mode"
  | "brief-input"
  | "brief-analyzing"
  | "brand-intelligence"
  | "kpi-validation"
  | "inconsistency-check"
  | "unblock-recommendations"
  | "profile-naming"
  | "profile-review"
  | "dsp-connect"
  | "syncing"
  | "final-touches";

const campaignSetupInitialMessages: Message[] = [
  {
    id: "cs-1",
    role: "vera",
    content: "Hi Robbin! I'll help you set up a new brand safety profile. Would you like to start from an existing profile or create a new one from scratch?",
  },
];

const campaignKpis = [
  { name: "Target Block Rate", value: "< 7%", benchmark: "6.2%", status: "aligned" as const },
  { name: "Target CPM", value: "< $7.00", benchmark: "$6.80", status: "aligned" as const },
  { name: "Target Viewability", value: "> 70%", benchmark: "72%", status: "aligned" as const },
  { name: "Target Suitability", value: "> 93%", benchmark: "94%", status: "needs-review" as const },
];

interface InconsistencyItem {
  id: number;
  type: "mismatch" | "unblock-recommendation";
  description: string;
  severity: "high" | "medium" | "low";
  recommendation: string;
  topic?: string;
  industryBenchmark?: string;
  reachImpact?: string;
}

const profileInconsistencies: InconsistencyItem[] = [
  {
    id: 0,
    type: "mismatch",
    description: "Current profile blocks 'Iran — Water Crisis' but allows 'Environmental News'",
    severity: "medium",
    recommendation: "Align categories to block 'Iran — Water Crisis' for consistency",
  },
  {
    id: 1,
    type: "mismatch",
    description: "Current profile blocks 'election' keyword broadly — may over-block benign election coverage",
    severity: "low",
    recommendation: "Narrow 'election' blocking to exclude educational content",
  },
];

const unblockRecommendationItems: InconsistencyItem[] = [
  {
    id: 10,
    type: "unblock-recommendation",
    topic: "Political Content",
    description: "'Political Content' is blocked on your current profile, but 78% of CPG Beverage brands allow it.",
    severity: "low",
    recommendation: "Unblock 'Political Content' to gain ~4% more reach based on industry benchmarks",
    industryBenchmark: "78% of CPG brands allow",
    reachImpact: "+4.2%",
  },
  {
    id: 11,
    type: "unblock-recommendation",
    topic: "Gambling",
    description: "'Gambling' is blocked on your current profile, but 65% of CPG Beverage brands allow it.",
    severity: "low",
    recommendation: "Unblock 'Gambling' to gain ~2% more reach based on industry benchmarks",
    industryBenchmark: "65% of CPG brands allow",
    reachImpact: "+2.1%",
  },
];

/* ========== MAIN VERA PANEL ========== */

type WizardPhase = "tier-select" | "dsp-connect" | "syncing" | "complete";

// ─── Analyze flow panel components ───────────────────────────────────
type AnalyzePhase = "thinking" | "insights" | "ask-examples" | "examples" | "complete";

function AnalyzeUrlCard({ url }: { url: typeof analyzeBlockedUrls[0]["urls"][0] }) {
  const [open, setOpen] = useState(false);
  const riskStyle = url.classification.risk === "Medium Risk"
    ? { chipBg: "bg-orange-50", chipText: "text-orange-700", dot: "bg-orange-500", badgeBg: "bg-orange-50", badgeText: "text-orange-700" }
    : { chipBg: "bg-grass-50", chipText: "text-grass-700", dot: "bg-grass-500", badgeBg: "bg-grass-50", badgeText: "text-grass-700" };
  return (
    <div className="rounded-lg border border-neutral-100 overflow-hidden hover:shadow-elevation-hover transition-shadow duration-200">
      {/* Full-width thumbnail */}
      <div className="h-28 bg-neutral-100 relative overflow-hidden">
        <img src={url.thumbnail} alt="" className="w-full h-full object-cover" />
        <div className="absolute top-2 right-2">
          <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] leading-[16px] font-medium", riskStyle.chipBg, riskStyle.chipText)}>
            <span className={cn("w-1.5 h-1.5 rounded-full", riskStyle.dot)} />
            {url.classification.risk === "Medium Risk" ? "Medium" : "Low"}
          </span>
        </div>
      </div>
      {/* Content */}
      <div className="p-3">
        <p className="text-body3 font-medium text-cool-900 line-clamp-2 mb-0.5">{url.title}</p>
        <p className="text-caption text-cool-500 truncate mb-2">{url.domain}{url.path}</p>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-900 text-amber-50 text-[12px] leading-[16px] font-semibold">
            <Star className="w-3 h-3 fill-current" />
            Rockerbox
          </span>
          <span className="text-body3 text-cool-700">
            {url.attribution}
          </span>
          <span className="text-caption text-cool-500">·</span>
          <span className="text-caption text-grass-700 font-medium">
            Avg CPM: $2.40
          </span>
        </div>
        {/* Expand/collapse classification */}
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-1 text-body3 font-medium text-plum-600 hover:text-plum-700 transition-colors"
        >
          {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
          {open ? "Hide classification" : "View classification"}
        </button>
      </div>
      {open && (
        <div className="border-t border-neutral-100 px-3 py-3 space-y-2.5 bg-white">
          <div className="flex items-center gap-2">
            <span className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] leading-[16px] font-medium",
              riskStyle.chipBg, riskStyle.chipText
            )}>
              <span className={cn("w-1.5 h-1.5 rounded-full", riskStyle.dot)} />
              {url.classification.risk}
            </span>
            <span className="text-body3 font-medium text-cool-900">{url.classification.category}</span>
          </div>
          <p className="text-body3 text-cool-700">{url.classification.explanation}</p>
          <p className="text-body3 text-cool-700">{url.classification.pageContext}</p>
          <div>
            <p className="text-body3 font-semibold text-plum-700 mb-1.5">Key content indicators:</p>
            <ul className="space-y-1">
              {url.classification.indicators.map((ind, i) => (
                <li key={i} className="flex items-start gap-1.5 text-body3 text-cool-700">
                  <span className="text-plum-400 mt-0.5">•</span>
                  <span>{ind}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

// Scibids campaign data
const scibidsCampaigns = [
  {
    name: "Q1 2026 Harbor Brew Zero",
    description: "Brand awareness for new product launch",
    cost: "$14,040",
    imp: "5.2M impressions",
    primary: "Low CPM (Target: <$2.70)",
    secondary: "Maximum Reach",
    detail: {
      avgCpm: "$2.65",
      cpmTarget: "<$2.70",
      cpmMet: true,
      scibidsStatus: "Active, optimizing 3x daily across 1,200+ placements",
      viewability: "78%",
      viewabilityBenchmark: "72%",
      avoidedDomains: 3,
      avoidedCpmRange: "$1.80-$2.20",
      potentialCpm: "$2.40",
      reachGain: "19%",
    },
  },
];

function ScibidsCampaignDetail({ campaign }: { campaign: typeof scibidsCampaigns[0] }) {
  const d = campaign.detail;
  return (
    <div className="space-y-3">
      {/* Current State */}
      <div className="rounded-lg border border-turquoise-100 bg-turquoise-25 p-3.5">
        <p className="text-[11px] font-semibold text-turquoise-700 uppercase tracking-wider mb-2.5">Current State</p>
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-body3 text-cool-700">
            <Check className="h-3.5 w-3.5 text-turquoise-500 flex-shrink-0 mt-0.5" />
            <span>Average CPM: <strong className="text-cool-900">{d.avgCpm}</strong> (meeting your {d.cpmTarget} target)</span>
          </div>
          <div className="flex items-start gap-2 text-body3 text-cool-700">
            <Check className="h-3.5 w-3.5 text-turquoise-500 flex-shrink-0 mt-0.5" />
            <span>Scibids AI: {d.scibidsStatus}</span>
          </div>
          <div className="flex items-start gap-2 text-body3 text-cool-700">
            <Check className="h-3.5 w-3.5 text-turquoise-500 flex-shrink-0 mt-0.5" />
            <span>Viewability: {d.viewability} (above category benchmark of {d.viewabilityBenchmark})</span>
          </div>
        </div>
      </div>
      {/* Optimization Opportunity */}
      <div className="rounded-lg border-l-4 border-l-turquoise-500 border border-neutral-200 bg-white p-3.5">
        <p className="text-[11px] font-semibold text-turquoise-700 uppercase tracking-wider mb-2">Optimization Opportunity</p>
        <p className="text-body3 text-cool-700 mb-2">
          I found <strong>{d.avoidedDomains} avoided domains</strong> with CPM of <strong className="text-turquoise-700">{d.avoidedCpmRange}</strong> (below your average). They're brand-safe according to DV.
        </p>
        <div className="rounded-lg bg-turquoise-25 border border-turquoise-100 px-3 py-2 mb-2">
          <p className="text-body3 text-cool-800">
            <strong className="text-turquoise-700">Allowing them</strong> = Lower average CPM ({d.potentialCpm}) + {d.reachGain} more reach
          </p>
        </div>
        <p className="text-body3 text-turquoise-500 italic">You're doing well — here's how to do even better.</p>
      </div>
    </div>
  );
}

const domainRecommendations = [
  { domain: "healthline.com", category: "Health & Wellness", cpm: "$1.80", viewability: "82%", weeklyImps: "420K" },
  { domain: "mindbodygreen.com", category: "Wellness & Lifestyle", cpm: "$2.10", viewability: "76%", weeklyImps: "380K" },
  { domain: "eatingwell.com", category: "Food & Nutrition", cpm: "$2.05", viewability: "75%", weeklyImps: "330K" },
];

function DomainRecommendations({ campaign }: { campaign: typeof scibidsCampaigns[0] }) {
  const [expanded, setExpanded] = useState(false);
  const [selectedDomains, setSelectedDomains] = useState<Set<string>>(new Set());

  const toggleDomain = (domain: string) => {
    setSelectedDomains((prev) => {
      const next = new Set(prev);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2 mb-1.5">
          <Globe className="h-4 w-4 text-turquoise-500" />
          <span className="text-body3 font-semibold text-cool-900">Domain Recommendations</span>
        </div>
        <p className="text-body3 text-cool-600">
          These {campaign.detail.avoidedDomains} domains are currently in your exclusion list, but according to DV analysis they meet your campaign values and offer better CPM than your current average.
        </p>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-neutral-100">
        <div className="rounded-lg bg-grass-50 border border-grass-100 px-3 py-2 text-center">
          <p className="text-h6 font-bold text-grass-700">$1.98</p>
          <p className="text-caption text-grass-600">Avg CPM</p>
        </div>
        <div className="rounded-lg bg-grass-50 border border-grass-100 px-3 py-2 text-center">
          <p className="text-h6 font-bold text-grass-700">78%</p>
          <p className="text-caption text-grass-600">Avg Viewability</p>
        </div>
        <div className="rounded-lg bg-plum-50 border border-plum-200 px-3 py-2 text-center">
          <p className="text-h6 font-bold text-plum-700">1.13M</p>
          <p className="text-caption text-plum-600">Weekly Imps</p>
        </div>
      </div>

      {/* Allow all button */}
      <div className="px-4 py-3 border-b border-neutral-100">
        <button className="w-full py-2.5 bg-grass-600 text-white text-body3 font-medium rounded-lg hover:bg-grass-700 transition-colors flex items-center justify-center gap-2">
          <Check className="h-4 w-4" />
          Allow All {campaign.detail.avoidedDomains} Domains
        </button>
      </div>

      {/* Or select specific domains */}
      <div className="px-4 py-3">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-between w-full text-body3 text-cool-600 hover:text-cool-800 transition-colors"
        >
          <span>Or select specific domains</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="mt-3 space-y-2">
            {domainRecommendations.map((d) => (
              <label
                key={d.domain}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                  selectedDomains.has(d.domain)
                    ? "border-turquoise-300 bg-turquoise-25"
                    : "border-neutral-100 hover:bg-neutral-25"
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedDomains.has(d.domain)}
                  onChange={() => toggleDomain(d.domain)}
                  className="h-4 w-4 rounded border-neutral-300 text-turquoise-500 focus:ring-turquoise-500"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-body3 font-medium text-cool-900">{d.domain}</p>
                  <p className="text-caption text-cool-500">{d.category}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-body3 font-semibold text-cool-900">{d.cpm} CPM</p>
                  <p className="text-caption text-cool-500">{d.viewability} · {d.weeklyImps}</p>
                </div>
              </label>
            ))}
            {selectedDomains.size > 0 && (
              <button className="w-full py-2 bg-turquoise-700 text-white text-body3 font-medium rounded-lg hover:bg-turquoise-500 transition-colors mt-2">
                Allow {selectedDomains.size} Selected Domain{selectedDomains.size !== 1 ? "s" : ""}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyzeFlowContent({ phase, onShowExamples, onDismissExamples, cardWidth }: {
  phase: AnalyzePhase;
  onShowExamples: () => void;
  onDismissExamples: () => void;
  cardWidth: string;
}) {
  const [selectedScibids, setSelectedScibids] = useState<typeof scibidsCampaigns[0] | null>(null);
  const [scibidsThinking, setScibidsThinking] = useState(false);
  const [showDomains, setShowDomains] = useState(false);
  const [unblockedTopics, setUnblockedTopics] = useState<Set<string>>(new Set());
  const scibidsDetailRef = useRef<HTMLDivElement>(null);

  const impactChipStyles = {
    high: { bg: "bg-tomato-50", text: "text-tomato-700", dot: "bg-tomato-500" },
    medium: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  };
  const colorMap = {
    tomato: { headerBg: "bg-tomato-25", headerBorder: "border-tomato-200", titleColor: "text-tomato-800" },
    orange: { headerBg: "bg-orange-25", headerBorder: "border-orange-200", titleColor: "text-orange-800" },
  };

  if (phase === "thinking") return null;

  return (
    <div className={cn("self-start space-y-4", cardWidth)}>
      {/* Intro */}
      <div className="px-4 py-3 rounded-xl text-body3 bg-neutral-50 text-cool-800 border border-neutral-100 rounded-bl-sm">
        I've analyzed the brand safety performance for <strong>Q1 2026 Harbor Brew Zero Brand Awareness - US Market</strong>. Here's what I found:
      </div>

      {/* Campaign Health Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg bg-white border border-neutral-200 text-center">
          <p className="text-h6 font-bold text-tomato-700">8.7%</p>
          <p className="text-caption text-cool-600">Block Rate</p>
        </div>
        <div className="p-3 rounded-lg bg-white border border-neutral-200 text-center">
          <p className="text-h6 font-bold text-cool-900">6.2%</p>
          <p className="text-caption text-cool-600">Industry Avg</p>
        </div>
        <div className="p-3 rounded-lg bg-white border border-neutral-200 text-center">
          <p className="text-h6 font-bold text-orange-600">+2.5%</p>
          <p className="text-caption text-cool-600">Above Benchmark</p>
        </div>
      </div>

      {/* Key Insight */}
      <div className="rounded-xl border border-tomato-200 bg-tomato-25 p-4">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="h-3.5 w-3.5 text-tomato-600" />
          </div>
          <div>
            <p className="text-body3 font-semibold text-tomato-800 mb-0.5">Key Insight: Topic Concentration</p>
            <p className="text-body3 text-cool-700"><strong>70% of your campaign blocks</strong> are due to three specific topics related to <strong>Iran</strong>: Water Crisis, Politics, and War.</p>
          </div>
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <p className="text-body3 font-semibold text-cool-900 mb-3">Topic Breakdown</p>
        <div className="space-y-2">
          {analyzeTopicBreakdown.map((t) => {
            const chip = impactChipStyles[t.impact];
            return (
              <div key={t.topic} className="bg-neutral-25 rounded-lg p-3 border border-neutral-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-body3 font-medium text-cool-900">{t.topic}</span>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] leading-[16px] font-medium", chip.bg, chip.text)}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", chip.dot)} />
                    {t.impact === "high" ? "High" : "Medium"} Impact
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-body3">
                  <div><span className="text-cool-500">Inventory blocked:</span> <span className="font-semibold text-cool-900">{t.inventoryBlocked}</span></div>
                  <div><span className="text-cool-500">Industry blocking:</span> <span className="font-semibold text-cool-900">{t.industryBlocking}</span></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Ask about examples */}
      {phase === "insights" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-body3 text-cool-700 mb-3">Would you like to see examples of the blocked content with call-to-action URLs?</p>
          <div className="flex items-center gap-2">
            <button onClick={onShowExamples} className="px-3 py-1.5 bg-plum-600 text-white text-body3 font-medium rounded-lg hover:bg-plum-700 transition-colors">Yes, show examples</button>
            <button onClick={onDismissExamples} className="px-3 py-1.5 bg-white border border-neutral-200 text-cool-700 text-body3 font-medium rounded-lg hover:bg-neutral-50 transition-colors">No thanks</button>
          </div>
        </div>
      )}

      {/* Blocked examples */}
      {(phase === "examples" || phase === "complete") && (
        <div className="space-y-4">
          <div className="px-4 py-3 rounded-xl text-body3 bg-neutral-50 text-cool-800 border border-neutral-100 rounded-bl-sm">
            Here are examples of recently blocked content for each topic:
          </div>
          {analyzeBlockedUrls.map((group) => {
            const c = colorMap[group.impactColor];
            return (
              <div key={group.topic} className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
                <div className={cn("px-3 py-2.5 border-b flex items-center justify-between", c.headerBg, c.headerBorder)}>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-body3 font-semibold", c.titleColor)}>{group.topic}</span>
                    <span className="text-body3 text-cool-500">{group.inventoryBlocked}</span>
                  </div>
                  <span className="text-body3 text-cool-400">{group.urlsToday} URLs today</span>
                </div>
                <div className="p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {group.urls.map((url) => (
                      <AnalyzeUrlCard key={url.domain + url.path} url={url} />
                    ))}
                  </div>
                  {/* Blurred upsell — two URL previews */}
                  <div className="relative rounded-lg overflow-hidden">
                    <div className="grid grid-cols-2 gap-2 blur-sm select-none pointer-events-none">
                      <div className="rounded-lg border border-neutral-100 overflow-hidden">
                        <div className="h-28 bg-neutral-200" />
                        <div className="p-3">
                          <div className="text-body3 font-medium text-cool-900 mb-0.5">nytimes.com/2024/world/middle-east/...</div>
                          <div className="text-caption text-cool-500 mb-2">nytimes.com/2024/world/middle-east</div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 text-cool-500 text-[12px] leading-[16px] font-semibold">Rockerbox</span>
                            <span className="text-body3 text-cool-500">Attribution: 9.1/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-lg border border-neutral-100 overflow-hidden">
                        <div className="h-28 bg-neutral-200" />
                        <div className="p-3">
                          <div className="text-body3 font-medium text-cool-900 mb-0.5">washingtonpost.com/world/2024/...</div>
                          <div className="text-caption text-cool-500 mb-2">washingtonpost.com/world/2024</div>
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-200 text-cool-500 text-[12px] leading-[16px] font-semibold">Rockerbox</span>
                            <span className="text-body3 text-cool-500">Attribution: 8.7/10</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                      <button className="flex items-center gap-1.5 px-4 py-2 bg-amber-900 text-amber-50 text-body3 font-semibold rounded-lg hover:bg-amber-800 transition-colors shadow-sm">
                        <Star className="w-3.5 h-3.5 fill-current" /> Upgrade to Rockerbox
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 text-body3">
                    <span className="text-cool-500">Blocked from serving</span>
                    <span className="text-tomato-700 font-medium">Est. lost: {group.lostImpressions}</span>
                  </div>
                </div>
                {/* Footer — Unblock topic prompt */}
                <div className="border-t border-neutral-200 px-3 py-3 bg-neutral-25">
                  {unblockedTopics.has(group.topic) ? (
                    <div className="flex items-center justify-end gap-2 text-body3 text-grass-700">
                      <Check className="h-4 w-4" />
                      <span className="font-medium">Topic unblocked</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <p className="text-body3 text-cool-700 flex-1 min-w-0">Would you like to unblock this topic?</p>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => setUnblockedTopics((prev) => new Set(prev).add(group.topic))}
                          className="px-3 py-1.5 rounded-lg bg-grass-500 text-white text-[12px] leading-[16px] font-medium hover:bg-grass-600 transition-colors whitespace-nowrap"
                        >
                          Yes, Unblock
                        </button>
                        <button
                          className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-cool-700 text-[12px] leading-[16px] font-medium hover:bg-neutral-50 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Blocking Curve */}
      {(phase === "examples" || phase === "complete") && (
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <p className="text-body3 font-semibold text-cool-900 mb-2">Current Block Rate</p>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-tomato-400 to-orange-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.max(8.7 - unblockedTopics.size * 1.5, 3)}%` }}
              />
            </div>
            <span className="text-body3 font-bold text-cool-900 tabular-nums w-12 text-right">
              {(8.7 - unblockedTopics.size * 1.5).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center justify-between mt-1.5 text-caption text-cool-500">
            <span>Industry avg: 6.2%</span>
            <span>{unblockedTopics.size > 0 ? `${unblockedTopics.size} topic${unblockedTopics.size !== 1 ? "s" : ""} unblocked` : "No changes yet"}</span>
          </div>
        </div>
      )}

      {/* DV Tools Upsell */}
      {(phase === "examples" || phase === "complete") && (
        <div className="rounded-xl border border-plum-100 bg-plum-25 p-4">
          <p className="text-body3 font-semibold text-cool-900 mb-3">2 Improvement Opportunities</p>
          <div className="space-y-2">
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-neutral-200 hover:border-plum-200 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-turquoise-25 flex items-center justify-center flex-shrink-0">
                <Globe className="h-4 w-4 text-turquoise-700" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body3 font-medium text-cool-900">Enable Custom Contextual</p>
                <p className="text-caption text-cool-500">Target content aligned with your brand values</p>
              </div>
              <ChevronRight className="h-4 w-4 text-cool-400 flex-shrink-0" />
            </div>
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white border border-neutral-200 hover:border-plum-200 transition-colors cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-plum-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body3 font-medium text-cool-900">Activate Attention Metrics</p>
                <p className="text-caption text-cool-500">Measure viewability and engagement per placement</p>
              </div>
              <ChevronRight className="h-4 w-4 text-cool-400 flex-shrink-0" />
            </div>
          </div>
        </div>
      )}

      {/* Scibids upsell card */}
      {(phase === "examples" || phase === "complete") && (
        <div className="rounded-xl border border-turquoise-100 bg-gradient-to-br from-turquoise-25 to-turquoise-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Zap className="h-4 w-4 text-turquoise-500" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <p className="text-body3 font-semibold text-cool-900">Activate Scibids AI Optimization</p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] leading-[16px] font-medium text-turquoise-700 bg-turquoise-25 border border-turquoise-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-turquoise-500" />
                  Premium
                </span>
              </div>
              <p className="text-body3 text-cool-600 mb-3">Get personalized recommendations powered by Scibids AI.</p>
              <div className="bg-white rounded-lg border border-neutral-100 divide-y divide-neutral-100">
                {scibidsCampaigns.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => {
                      if (selectedScibids?.name === c.name) {
                        setSelectedScibids(null);
                        setScibidsThinking(false);
                        setShowDomains(false);
                      } else {
                        setSelectedScibids(c);
                        setScibidsThinking(true);
                        setShowDomains(false);
                        setTimeout(() => {
                          setScibidsThinking(false);
                          setTimeout(() => {
                            scibidsDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                          }, 100);
                        }, 2000);
                      }
                    }}
                    className={cn(
                      "w-full text-left px-3.5 py-3 hover:bg-turquoise-25 transition-colors group",
                      selectedScibids?.name === c.name && "bg-turquoise-25"
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-body3 font-medium text-cool-900">{c.name}</span>
                        </div>
                        <p className="text-body3 text-cool-500">{c.description}</p>
                        <p className="text-caption text-cool-400 mt-0.5">Primary: {c.primary} · Secondary: {c.secondary}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <div className="text-body3 font-semibold text-cool-900">{c.cost}</div>
                        <div className="text-caption text-cool-500">{c.imp}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-2 text-turquoise-700 text-body3 font-medium">
                      Analyze with Scibids AI
                      <ChevronRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Scibids thinking spinner */}
      {selectedScibids && scibidsThinking && (
        <div className="flex items-center gap-2 self-start px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 rounded-bl-sm">
          <Loader2 className="h-4 w-4 text-turquoise-500 animate-spin" />
          <span className="text-body3 text-cool-600">Analyzing {selectedScibids.name}...</span>
        </div>
      )}

      {/* Scibids detail — rendered as a separate agent response card */}
      {selectedScibids && !scibidsThinking && (
        <div ref={scibidsDetailRef} className="px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 rounded-bl-sm space-y-3">
          <p className="text-body3 text-cool-800">
            Here's the Scibids AI analysis for <strong>{selectedScibids.name}</strong>:
          </p>
          <ScibidsCampaignDetail campaign={selectedScibids} />
          {/* Show domains CTA */}
          {!showDomains && (
            <button
              onClick={() => {
                setShowDomains(true);
                setTimeout(() => {
                  scibidsDetailRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
                }, 100);
              }}
              className="w-full py-2.5 bg-turquoise-700 text-white text-body3 font-medium rounded-lg hover:bg-turquoise-500 transition-colors flex items-center justify-center gap-2"
            >
              <Globe className="h-4 w-4" />
              Show domains
            </button>
          )}
          {/* Domain Recommendations */}
          {showDomains && (
            <DomainRecommendations campaign={selectedScibids} />
          )}
        </div>
      )}
    </div>
  );
}

interface VeraPanelProps {
  open: boolean;
  onClose: () => void;
  context?: VeraContext;
}

export function VeraPanel({ open, onClose, context = "general" }: VeraPanelProps) {
  const { setProfileCreated } = useVeraContext();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [wizardPhase, setWizardPhase] = useState<WizardPhase>("tier-select");
  const [selectedTier, setSelectedTier] = useState<TierKey>("standard");
  const [expanded, setExpanded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // DSP form state
  const [connectedDsps, setConnectedDsps] = useState<ConnectedDsp[]>([{ platform: "ttd", platformLabel: "The Trade Desk", seatId: "HBZERO-001" }]);
  const [dspFormPlatform, setDspFormPlatform] = useState("");
  const [dspFormSeatId, setDspFormSeatId] = useState("");
  const [showDspForm, setShowDspForm] = useState(true);
  const [syncedDspNames, setSyncedDspNames] = useState<string[]>([]);
  const [showFinalNav, setShowFinalNav] = useState(false);

  // Analyze flow state
  const [analyzePhase, setAnalyzePhase] = useState<AnalyzePhase>("thinking");

  // Campaign setup state
  const [setupPhase, setSetupPhase] = useState<CampaignSetupPhase>("creation-mode");
  // Step 1: Creation mode
  const [creationMode, setCreationMode] = useState<"new" | "existing" | null>(null);
  const [creationModeConfirmed, setCreationModeConfirmed] = useState(false);
  const [creationModeExpanded, setCreationModeExpanded] = useState(false);
  // Step 1b: Existing profile selection (inline in creation-mode card)
  const [selectedExistingProfileId, setSelectedExistingProfileId] = useState<string>(brandSafetyProfiles.filter(p => p.id !== "7")[0]?.id ?? "");
  const [existingProfileConfirmed, setExistingProfileConfirmed] = useState(false);
  const [existingProfileExpanded, setExistingProfileExpanded] = useState(false);
  // Step 2: Brief input
  const [briefInputMethod, setBriefInputMethod] = useState<"upload" | "crawl">("upload");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [briefUploaded, setBriefUploaded] = useState(false);
  const [briefExpanded, setBriefExpanded] = useState(false);
  // Step 3: BI Report
  const [biApproved, setBiApproved] = useState(false);
  const [biExpanded, setBiExpanded] = useState(false);
  // Step 4: KPIs
  const [kpisApproved, setKpisApproved] = useState(false);
  const [kpiExpanded, setKpiExpanded] = useState(false);
  // Step 5: Inconsistencies
  const [inconsistenciesResolved, setInconsistenciesResolved] = useState(false);
  const [inconsistenciesExpanded, setInconsistenciesExpanded] = useState(false);
  const [acceptedInconsistencies, setAcceptedInconsistencies] = useState<Set<number>>(new Set());
  // Step 5b: Unblock Recommendations
  const [unblockDecisions, setUnblockDecisions] = useState<Map<number, "unblock" | "keep">>(new Map());
  const [unblockResolved, setUnblockResolved] = useState(false);
  const [unblockExpanded, setUnblockExpanded] = useState(false);
  // Step 6: Profile naming
  const [profileName, setProfileName] = useState("Harbor Brew Zero — US Standard");
  const [profileNamed, setProfileNamed] = useState(false);
  const [profileNameExpanded, setProfileNameExpanded] = useState(false);

  // Derived
  const activeTierConfig = tierConfigs.find((t) => t.key === selectedTier)!;

  // Reset when context changes
  useEffect(() => {
    if (context === "brand-safety-create") {
      setMessages(brandSafetyInitialMessages);
      setWizardPhase("tier-select");
      setSelectedTier("standard");
      setConnectedDsps([]);
      setDspFormPlatform("");
      setDspFormSeatId("");
      setShowDspForm(true);
      setSyncedDspNames([]);
    } else if (context === "brand-safety-analyze") {
      setMessages(analyzeInitialMessages);
      setAnalyzePhase("thinking");
      setTimeout(() => setAnalyzePhase("insights"), 2500);
    } else if (context === "brand-safety-campaign-setup") {
      setMessages(campaignSetupInitialMessages);
      setSetupPhase("creation-mode");
      setCreationMode(null);
      setCreationModeConfirmed(false);
      setCreationModeExpanded(false);
      setSelectedExistingProfileId(brandSafetyProfiles.filter(p => p.id !== "7")[0]?.id ?? "");
      setExistingProfileConfirmed(false);
      setExistingProfileExpanded(false);
      setBriefInputMethod("upload");
      setWebsiteUrl("");
      setBriefUploaded(false);
      setBriefExpanded(false);
      setBiApproved(false);
      setBiExpanded(false);
      setKpisApproved(false);
      setKpiExpanded(false);
      setInconsistenciesResolved(false);
      setInconsistenciesExpanded(false);
      setAcceptedInconsistencies(new Set());
      setUnblockDecisions(new Map());
      setUnblockResolved(false);
      setUnblockExpanded(false);
      setProfileName("Harbor Brew Zero — US Standard");
      setProfileNamed(false);
      setProfileNameExpanded(false);
      setConnectedDsps([{ platform: "ttd", platformLabel: "The Trade Desk", seatId: "HBZERO-001" }]);
      setDspFormPlatform("");
      setDspFormSeatId("");
      setShowDspForm(true);
      setSyncedDspNames([]);
      setShowFinalNav(false);
    } else {
      setMessages(initialMessages);
    }
  }, [context]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, wizardPhase, setupPhase]);

  // Auto-advance from brief-analyzing to brand-intelligence
  useEffect(() => {
    if (isCampaignSetup && setupPhase === "brief-analyzing") {
      const timer = setTimeout(() => {
        setSetupPhase("brand-intelligence");
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [setupPhase, context]);

  // --- Handlers ---

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    setTimeout(() => {
      const veraMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "vera",
        content: "I'm analyzing your data now. Based on the current trends, I can see several areas where we can optimize. Let me pull together the relevant insights for you.",
      };
      setMessages((prev) => [...prev, veraMsg]);
    }, 800);
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
  };

  const handleTierChange = (tier: TierKey) => {
    const prevTier = selectedTier;
    setSelectedTier(tier);

    // Add Vera feedback message
    const transKey = `${prevTier}→${tier}`;
    const transition = tierTransitionMessages[transKey];
    if (transition && prevTier !== tier) {
      const config = tierConfigs.find((t) => t.key === tier)!;
      const feedbackMsg: Message = {
        id: `tier-feedback-${Date.now()}`,
        role: "vera",
        content: `I see you've moved from ${tierConfigs.find((t) => t.key === prevTier)!.name} to ${config.name}.\n\nBenefit: ${transition.benefit}\n\nTrade-off: ${transition.tradeoff}`,
      };
      setMessages((prev) => [...prev, feedbackMsg]);
    }
  };

  const handleTierConfirm = () => {
    setWizardPhase("dsp-connect");
    const config = tierConfigs.find((t) => t.key === selectedTier)!;
    const dspMsg: Message = {
      id: "bs-dsp-intro",
      role: "vera",
      content: `Great choice! Your ${config.name} tier profile is ready. Now let's connect your DSP. Select your platform and enter your seat ID below.`,
    };
    setMessages((prev) => [...prev, dspMsg]);
  };

  const handleStartOver = () => {
    setMessages(brandSafetyInitialMessages);
    setWizardPhase("tier-select");
    setSelectedTier("standard");
    setConnectedDsps([]);
    setDspFormPlatform("");
    setDspFormSeatId("");
    setShowDspForm(true);
    setSyncedDspNames([]);
  };

  const handleConnectDsp = () => {
    const platform = dspPlatforms.find(p => p.value === dspFormPlatform);
    if (!platform || !dspFormSeatId.trim()) return;
    setConnectedDsps(prev => [...prev, {
      platform: platform.value,
      platformLabel: platform.label,
      seatId: dspFormSeatId.trim(),
    }]);
    setDspFormPlatform("");
    setDspFormSeatId("");
    setShowDspForm(false);
  };

  const handleDspSync = () => {
    setSyncedDspNames(connectedDsps.map(d => `${d.platformLabel}: ${d.seatId}`));
    setWizardPhase("syncing");

    setTimeout(() => {
      setWizardPhase("complete");
      setProfileCreated(true);
    }, 2500);
  };

  const handleDspSkip = () => {
    setSyncedDspNames([]);
    setWizardPhase("complete");
    setProfileCreated(true);
  };

  const isBrandSafety = context === "brand-safety-create";
  const isAnalyze = context === "brand-safety-analyze";
  const isCampaignSetup = context === "brand-safety-campaign-setup";
  const panelWidth = expanded ? "flex-1" : "w-[40%]";
  const minWidth = expanded ? "min-w-0" : "min-w-[400px]";
  const cardWidth = cn("self-start w-full", expanded ? "max-w-[70%]" : "max-w-[92%]");

  return (
    <div
      className={cn(
        "bg-white border-l border-neutral-100 flex flex-col transition-all duration-300 ease-out overflow-hidden relative z-30",
        open ? cn(panelWidth, expanded ? "min-w-0" : "flex-shrink-0") : "w-0 border-l-0"
      )}
    >
      {/* Header */}
      <div className={cn("h-14 px-5 flex items-center justify-between border-b border-neutral-100 flex-shrink-0", minWidth)}>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-cool-500 hover:text-cool-900"
            onClick={() => setExpanded((prev) => !prev)}
            title={expanded ? "Collapse panel" : "Expand panel"}
          >
            {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
          </Button>
          <div className="w-7 h-7 rounded-full bg-plum-100 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-plum-600" />
          </div>
          <span className="text-h6 text-cool-900">Vera</span>
          {(isBrandSafety || isAnalyze || isCampaignSetup) && (
            <span className="px-2 py-0.5 rounded-full text-label bg-plum-50 text-plum-600 border border-plum-100">
              {isAnalyze ? "Analysis" : isCampaignSetup ? "Campaign Setup" : "Brand Safety"}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          {(isCampaignSetup || isBrandSafety) && (
            <button
              onClick={onClose}
              className="text-caption font-medium text-cool-500 hover:text-cool-700 px-2 py-1 rounded hover:bg-neutral-50 transition-colors"
            >
              Exit AI Mode
            </button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-cool-600 hover:text-cool-900"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Messages + Wizard Content */}
      <div className={cn("flex-1 overflow-y-auto overflow-x-hidden px-5 py-4 flex flex-col gap-4", minWidth)}>
        {/* Chat messages */}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "min-w-0",
              msg.role === "user"
                ? cn("self-end", expanded ? "max-w-[50%]" : "max-w-[80%]")
                : cn("self-start", expanded ? "max-w-[70%]" : "max-w-[92%]")
            )}
          >
            {msg.type === "attachment" ? (
              <div className="bg-plum-600 text-white rounded-xl rounded-br-sm px-4 py-3 overflow-hidden">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body3 font-medium truncate">{msg.content}</p>
                    <p className="text-caption text-white/70">PDF · 2.4 MB</p>
                  </div>
                </div>
              </div>
            ) : msg.type === "brand-report" ? (
              <BrandIntelligenceReport expanded={expanded} />
            ) : (
              <div
                className={cn(
                  "px-4 py-3 rounded-xl text-body3",
                  msg.role === "user"
                    ? "bg-plum-600 text-white rounded-br-sm"
                    : "bg-neutral-50 text-cool-800 border border-neutral-100 rounded-bl-sm"
                )}
              >
                {msg.content}
              </div>
            )}
          </div>
        ))}

        {/* ===== ANALYZE FLOW ===== */}
        {isAnalyze && analyzePhase === "thinking" && (
          <div className={cn("flex items-center gap-2 self-start px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 rounded-bl-sm", cardWidth)}>
            <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
            <span className="text-body3 text-cool-600">Analyzing campaign data...</span>
          </div>
        )}

        {isAnalyze && analyzePhase !== "thinking" && (
          <AnalyzeFlowContent
            phase={analyzePhase}
            onShowExamples={() => {
              setAnalyzePhase("examples");
              setTimeout(() => setAnalyzePhase("complete"), 300);
            }}
            onDismissExamples={() => setAnalyzePhase("complete")}
            cardWidth={cardWidth}
          />
        )}

        {/* ===== WIZARD UI ===== */}

        {/* Tier selection — dropdown + summary card */}
        {isBrandSafety && wizardPhase === "tier-select" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            {/* Active tier summary card */}
            <div className="rounded-xl border-2 border-plum-300 bg-plum-25 p-4">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-body3 font-semibold text-cool-900">{activeTierConfig.name}</span>
                <span className="text-label text-cool-500 italic">{activeTierConfig.alias}</span>
                {activeTierConfig.key === "standard" && (
                  <span className="text-label text-plum-700 bg-plum-50 px-2 py-0.5 rounded border border-plum-200">Recommended</span>
                )}
              </div>
              <p className="text-body3 text-cool-600 mt-1 mb-1.5">
                <span className="font-medium text-cool-700">Best for: </span>{activeTierConfig.bestFor}
              </p>
              <p className="text-body3 text-cool-500 italic mb-2">"{activeTierConfig.veraPitch}"</p>
              <div className="flex items-center gap-3 text-label">
                {activeTierConfig.reachImpact !== "Baseline" && (
                  <span className={activeTierConfig.reachImpact.startsWith("+") ? "text-grass-600" : "text-orange-600"}>
                    {activeTierConfig.reachImpact} reach
                  </span>
                )}
                <a
                  href={activeTierConfig.learnMoreUrl}
                  className="text-plum-600 hover:text-plum-700 font-medium underline underline-offset-2"
                  onClick={(e) => e.preventDefault()}
                >
                  Learn More
                </a>
              </div>
            </div>

            {/* Tier dropdown */}
            <div>
              <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Protection tier</label>
              <select
                value={selectedTier}
                onChange={(e) => handleTierChange(e.target.value as TierKey)}
                className="w-full h-10 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 appearance-none cursor-pointer"
              >
                {tierConfigs.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.name} — {t.alias}{t.key === "standard" ? " (Recommended)" : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Continue button */}
            <button
              onClick={handleTierConfirm}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* ===== DSP CONNECT (form-based) ===== */}
        {isBrandSafety && wizardPhase === "dsp-connect" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            {/* Collapsed tier summary */}
            <CollapsedSectionSummary
              icon={<ShieldCheck className="h-4 w-4 text-plum-600" />}
              title={`${activeTierConfig.name} Tier`}
              subtitle={activeTierConfig.alias}
              onEdit={() => setWizardPhase("tier-select")}
            />

            {/* Already-connected DSPs */}
            {connectedDsps.map((dsp, i) => {
              const platform = dspPlatforms.find(p => p.value === dsp.platform);
              return (
                <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-grass-100 bg-grass-50">
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center text-[12px] font-bold flex-shrink-0", platform?.color || "bg-neutral-100 text-cool-700")}>
                    {platform?.icon || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body3 font-medium text-cool-900">{dsp.platformLabel}</p>
                    <p className="text-label text-cool-500">{dsp.seatId}</p>
                  </div>
                  <Check className="h-4 w-4 text-grass-600 flex-shrink-0" />
                </div>
              );
            })}

            {/* Connect form */}
            {showDspForm && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                <p className="text-body3 font-semibold text-cool-900">
                  {connectedDsps.length > 0 ? "Connect Another DSP" : "Connect Your DSP"}
                </p>

                {/* Platform dropdown */}
                <div>
                  <label className="text-body3 font-medium text-cool-700 mb-1.5 block">DSP Platform</label>
                  <select
                    value={dspFormPlatform}
                    onChange={(e) => setDspFormPlatform(e.target.value)}
                    className="w-full h-10 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 appearance-none cursor-pointer"
                  >
                    <option value="">Select a platform...</option>
                    {dspPlatforms.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Seat ID input */}
                <div>
                  <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Seat ID</label>
                  <input
                    type="text"
                    value={dspFormSeatId}
                    onChange={(e) => setDspFormSeatId(e.target.value)}
                    placeholder="e.g., seat-3847"
                    className="w-full h-10 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 transition-all duration-200"
                  />
                </div>

                {/* Connect button */}
                <button
                  onClick={handleConnectDsp}
                  disabled={!dspFormPlatform || !dspFormSeatId.trim()}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-body3 font-medium transition-colors",
                    dspFormPlatform && dspFormSeatId.trim()
                      ? "bg-plum-600 text-white hover:bg-plum-700"
                      : "bg-neutral-200 text-cool-400 cursor-not-allowed"
                  )}
                >
                  Connect
                </button>
              </div>
            )}

            {/* After connecting at least one DSP */}
            {connectedDsps.length > 0 && !showDspForm && (
              <>
                <button
                  onClick={() => setShowDspForm(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-cool-700 text-body3 font-medium hover:bg-neutral-50 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Connect Another DSP
                </button>
                <button
                  onClick={handleDspSync}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
                >
                  Sync to {connectedDsps.length} Seat{connectedDsps.length !== 1 ? "s" : ""}
                </button>
              </>
            )}

            {/* Skip */}
            <button
              onClick={handleDspSkip}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-cool-600 text-body3 font-medium hover:bg-neutral-50 transition-colors"
            >
              Skip for Now
            </button>
          </div>
        )}

        {/* ===== SYNCING SPINNER ===== */}
        {isBrandSafety && wizardPhase === "syncing" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <CollapsedSectionSummary
              icon={<ShieldCheck className="h-4 w-4 text-plum-600" />}
              title={`${activeTierConfig.name} Tier`}
              subtitle={activeTierConfig.alias}
            />
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
              <span className="text-body3 text-cool-600">Syncing profile to {connectedDsps.length} DSP seat{connectedDsps.length !== 1 ? "s" : ""}...</span>
            </div>
          </div>
        )}

        {/* ===== COMPLETE WITH ADD-ONS ===== */}
        {isBrandSafety && wizardPhase === "complete" && (
          <div className={cn("self-start space-y-3", cardWidth)}>
            {/* Success banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-grass-200 bg-grass-50">
              <div className="w-6 h-6 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-body3 font-medium text-grass-700">
                  {syncedDspNames.length > 0
                    ? `Sync Complete! Your ${activeTierConfig.name} Tier is active.`
                    : `Profile Created! Your ${activeTierConfig.name} Tier is active.`}
                </p>
                {syncedDspNames.length > 0 && (
                  <p className="text-body3 text-cool-600 mt-0.5">
                    Synced to {syncedDspNames.length} seat{syncedDspNames.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Synced seats list */}
            {syncedDspNames.length > 0 && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-body3 font-semibold text-cool-900 mb-2">Synced DSP Seats</p>
                <div className="space-y-2">
                  {syncedDspNames.map((name) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-grass-50 border border-grass-200">
                      <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-body3 font-medium text-grass-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons prompt */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div>
                <p className="text-body3 font-semibold text-cool-900">Would you like to add any final touches?</p>
                <p className="text-label text-cool-500 mt-0.5">Optional</p>
              </div>

              {/* Add Keywords */}
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-25 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-plum-600" />
                </div>
                <div>
                  <p className="text-body3 font-medium text-cool-900">Add Keywords</p>
                  <p className="text-label text-cool-500">e.g., Competitor names, specific tragedies</p>
                </div>
              </button>

              {/* Upload Site Blocklist */}
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-25 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                  <Upload className="h-4 w-4 text-plum-600" />
                </div>
                <div>
                  <p className="text-body3 font-medium text-cool-900">Upload Site Blocklist</p>
                  <p className="text-label text-cool-500">Your CSV of 'Never-Buy' domains</p>
                </div>
              </button>

              {/* Set Inclusion List */}
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-25 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                  <FileText className="h-4 w-4 text-plum-600" />
                </div>
                <div>
                  <p className="text-body3 font-medium text-cool-900">Set Inclusion List</p>
                  <p className="text-label text-cool-500">Only run on these specific premium sites</p>
                </div>
              </button>
            </div>

            {/* Go to Dashboard CTA */}
            <button
              onClick={() => { window.location.href = "/"; }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              No, I'm all set — Go to Dashboard
            </button>

            {/* Create another profile */}
            <button
              onClick={handleStartOver}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-neutral-200 bg-white text-cool-600 text-body3 font-medium hover:bg-neutral-50 transition-colors"
            >
              Create another profile
            </button>
          </div>
        )}

        {/* ===== CAMPAIGN SETUP WIZARD ===== */}

        {/* Step 1: Creation Mode — compact approved state (only for "new" path; "existing" uses the "Based on" card instead) */}
        {isCampaignSetup && creationModeConfirmed && creationMode === "new" && setupPhase !== "creation-mode" && (
          <div className={cn("self-start space-y-2", cardWidth)}>
            <button
              onClick={() => setCreationModeExpanded(prev => !prev)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200 hover:bg-grass-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-body3 font-medium text-grass-700 flex-1 text-left">
                Creating new profile from scratch
              </span>
              {creationModeExpanded ? <ChevronDown className="h-3.5 w-3.5 text-grass-500" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </button>
          </div>
        )}
        {/* Step 1: Creation Mode — full view */}
        {isCampaignSetup && setupPhase === "creation-mode" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <div
              onClick={() => setCreationMode("existing")}
              className={cn(
                "rounded-xl border-2 p-4 cursor-pointer transition-all",
                creationMode === "existing" ? "border-plum-400 bg-plum-25" : "border-neutral-200 bg-white hover:border-plum-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                  <Copy className="h-4 w-4 text-plum-600" />
                </div>
                <div className="flex-1">
                  <p className="text-body3 font-medium text-cool-900">Start from an existing profile</p>
                  <p className="text-label text-cool-500 mt-0.5">Clone and customize one of your existing profiles</p>
                </div>
              </div>
              {creationMode === "existing" && (
                <div className="mt-3 pt-3 border-t border-plum-100" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <select
                      value={selectedExistingProfileId}
                      onChange={(e) => setSelectedExistingProfileId(e.target.value)}
                      className="w-full h-10 px-3 pr-8 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 appearance-none cursor-pointer"
                    >
                      {brandSafetyProfiles.filter(p => p.id !== "7").map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-cool-400 pointer-events-none" />
                  </div>
                </div>
              )}
            </div>
            <div
              onClick={() => setCreationMode("new")}
              className={cn(
                "rounded-xl border-2 p-4 cursor-pointer transition-all",
                creationMode === "new" ? "border-plum-400 bg-plum-25" : "border-neutral-200 bg-white hover:border-plum-200"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-plum-600" />
                </div>
                <div>
                  <p className="text-body3 font-medium text-cool-900">Create a new profile</p>
                  <p className="text-label text-cool-500 mt-0.5">Start fresh with a campaign brief or website crawl</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                if (!creationMode) return;
                if (creationMode === "existing") {
                  const pName = brandSafetyProfiles.find(p => p.id === selectedExistingProfileId)?.name ?? "selected profile";
                  setCreationModeConfirmed(true);
                  setExistingProfileConfirmed(true);
                  setProfileName(`${pName} — Copy`);
                  const msg: Message = { id: `mode-${Date.now()}`, role: "user", content: `Start from "${pName}".` };
                  setMessages(prev => [...prev, msg]);
                  setSetupPhase("brief-input");
                } else {
                  setCreationModeConfirmed(true);
                  const msg: Message = { id: `mode-${Date.now()}`, role: "user", content: "I'll create a new profile from scratch." };
                  const veraMsg: Message = { id: `vera-brief-${Date.now()}`, role: "vera", content: "Let's get started. Upload your campaign brief or I can crawl your brand's website to gather intelligence." };
                  setMessages(prev => [...prev, msg, veraMsg]);
                  setSetupPhase("brief-input");
                }
              }}
              disabled={!creationMode}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 1b: Existing Profile — Vera bubble with embedded confirmation (shown after creation-mode when existing was chosen) */}
        {isCampaignSetup && existingProfileConfirmed && setupPhase !== "creation-mode" && (
          <div className={cn("self-start", expanded ? "max-w-[70%]" : "max-w-[92%]")}>
            <div className="rounded-2xl rounded-bl-sm bg-neutral-50 text-cool-800 border border-neutral-100 px-4 py-3 text-body3 space-y-2.5">
              <p>I'll use "{brandSafetyProfiles.find(p => p.id === selectedExistingProfileId)?.name}" as your starting point. Now upload a brief or I can crawl your website.</p>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                  <Check className="h-3 w-3 text-white" />
                </div>
                <span className="text-body3 font-medium text-grass-700 flex-1">Based on: {brandSafetyProfiles.find(p => p.id === selectedExistingProfileId)?.name ?? "Selected profile"}</span>
                <button
                  onClick={() => {
                    setCreationModeConfirmed(false);
                    setExistingProfileConfirmed(false);
                    setSetupPhase("creation-mode");
                    setMessages(prev => prev.filter(m => !m.id.startsWith("mode-")));
                  }}
                  className="text-label font-medium text-plum-600 hover:text-plum-700 transition-colors"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Brief Input — compact approved state */}
        {isCampaignSetup && briefUploaded && setupPhase !== "brief-input" && setupPhase !== "brief-analyzing" && (
          <div className={cn("self-start space-y-2", cardWidth)}>
            <button
              onClick={() => setBriefExpanded(prev => !prev)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200 hover:bg-grass-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-body3 font-medium text-grass-700 flex-1 text-left">
                {briefInputMethod === "crawl" ? `Website crawled: ${websiteUrl}` : "Campaign brief uploaded"}
              </span>
              {briefExpanded ? <ChevronDown className="h-3.5 w-3.5 text-grass-500" /> : <ChevronRight className="h-3.5 w-3.5 text-grass-500" />}
            </button>
          </div>
        )}
        {/* Step 2: Brief Input — full view */}
        {isCampaignSetup && setupPhase === "brief-input" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            {/* Tab toggle */}
            <div className="flex gap-2">
              <button
                onClick={() => setBriefInputMethod("upload")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-body3 font-medium transition-colors",
                  briefInputMethod === "upload" ? "bg-plum-600 text-white" : "bg-white border border-neutral-200 text-cool-600 hover:bg-neutral-50"
                )}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload Brief
              </button>
              <button
                onClick={() => setBriefInputMethod("crawl")}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-body3 font-medium transition-colors",
                  briefInputMethod === "crawl" ? "bg-plum-600 text-white" : "bg-white border border-neutral-200 text-cool-600 hover:bg-neutral-50"
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                Crawl Website
              </button>
            </div>

            {briefInputMethod === "upload" && (
              <div
                className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-25 p-6 text-center hover:border-plum-300 hover:bg-plum-25 transition-colors cursor-pointer"
                onClick={() => {
                  setBriefUploaded(true);
                  const uploadMsg: Message = {
                    id: `upload-${Date.now()}`,
                    role: "user",
                    content: "Q1 2026 Harbor Brew Zero Campaign Brief.pdf",
                    type: "attachment",
                  };
                  setMessages(prev => [...prev, uploadMsg]);
                  setTimeout(() => {
                    setSetupPhase("brief-analyzing");
                  }, 600);
                }}
              >
                <div className="w-12 h-12 rounded-full bg-plum-50 flex items-center justify-center mx-auto mb-3">
                  <Upload className="h-5 w-5 text-plum-600" />
                </div>
                <p className="text-body3 font-medium text-cool-700">Upload Campaign Brief</p>
                <p className="text-caption text-cool-500 mt-1">PDF, DOCX, or TXT — up to 10 MB</p>
              </div>
            )}

            {briefInputMethod === "crawl" && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                <div>
                  <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Website URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 h-10 px-3 bg-white border border-neutral-200 rounded-lg focus-within:border-plum-300 focus-within:ring-2 focus-within:ring-plum-100">
                      <Globe className="h-3.5 w-3.5 text-cool-400 flex-shrink-0" />
                      <input
                        type="text"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="e.g., https://harborbrewzero.com"
                        className="flex-1 text-body3 outline-none bg-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-caption text-cool-500 mt-1.5">I'll analyze your website to understand your brand, products, and values.</p>
                </div>
                <button
                  onClick={() => {
                    setBriefUploaded(true);
                    const crawlMsg: Message = { id: `crawl-${Date.now()}`, role: "user", content: `Crawl: ${websiteUrl || "harborbrewzero.com"}` };
                    setMessages(prev => [...prev, crawlMsg]);
                    if (!websiteUrl) setWebsiteUrl("harborbrewzero.com");
                    setTimeout(() => {
                      setSetupPhase("brief-analyzing");
                    }, 600);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  Start Crawl
                </button>
              </div>
            )}
          </div>
        )}

        {/* Step 2b: Brief Analyzing — transient */}
        {isCampaignSetup && setupPhase === "brief-analyzing" && (
          <div className={cn("flex items-center gap-2 self-start px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100 rounded-bl-sm", cardWidth)}>
            <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
            <span className="text-body3 text-cool-600">
              {briefInputMethod === "crawl" ? `Crawling ${websiteUrl || "harborbrewzero.com"} and analyzing brand context...` : "Analyzing your campaign brief..."}
            </span>
          </div>
        )}

        {/* Inline Vera messages for brief analysis (rendered after compact cards) */}
        {isCampaignSetup && briefUploaded && setupPhase !== "brief-input" && setupPhase !== "brief-analyzing" && (
          <>
            <div className={cn("self-start", expanded ? "max-w-[70%]" : "max-w-[92%]")}>
              <div className="rounded-2xl rounded-bl-sm bg-neutral-50 text-cool-800 border border-neutral-100 px-4 py-3 text-body3">
                I've received your campaign brief. Let me analyze it and generate a Brand Intelligence Report...
              </div>
            </div>
            <div className={cn("self-start", expanded ? "max-w-[70%]" : "max-w-[92%]")}>
              <div className="rounded-2xl rounded-bl-sm bg-neutral-50 text-cool-800 border border-neutral-100 px-4 py-3 text-body3">
                I've completed my analysis. Here's your Brand Intelligence Report. Please review and approve.
              </div>
            </div>
          </>
        )}

        {/* Phase 2: Brand Intelligence Report — compact approved state */}
        {isCampaignSetup && biApproved && setupPhase !== "brand-intelligence" && (
          <div className={cn("self-start space-y-2", cardWidth)}>
            <button
              onClick={() => setBiExpanded(prev => !prev)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200 hover:bg-grass-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-body3 font-medium text-grass-700 flex-1 text-left">Brand Intelligence Report approved</span>
              {biExpanded ? <ChevronDown className="h-3.5 w-3.5 text-grass-500" /> : <ChevronRight className="h-3.5 w-3.5 text-grass-500" />}
            </button>
            {biExpanded && (
              <BrandIntelligenceReport expanded={expanded} />
            )}
          </div>
        )}
        {/* Phase 2: Brand Intelligence Report — full view */}
        {isCampaignSetup && setupPhase === "brand-intelligence" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <BrandIntelligenceReport expanded={expanded} />
            <button
              onClick={() => {
                setBiApproved(true);
                const approveMsg: Message = { id: `approve-bi-${Date.now()}`, role: "user", content: "Looks good, approve the Brand Intelligence Report." };
                const veraMsg: Message = { id: `vera-kpi-${Date.now()}`, role: "vera", content: "Great! Now let me validate your campaign KPIs against industry benchmarks for the CPG - Beverages sector." };
                setMessages(prev => [...prev, approveMsg, veraMsg]);
                setSetupPhase("kpi-validation");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              Approve Report
            </button>
            <button className="w-full text-body3 text-cool-500 hover:text-cool-700 underline underline-offset-2 py-1">
              Switch to manual configuration
            </button>
          </div>
        )}

        {/* Phase 3: KPI Validation — compact approved state */}
        {isCampaignSetup && kpisApproved && setupPhase !== "kpi-validation" && (
          <div className={cn("self-start space-y-2", cardWidth)}>
            <button
              onClick={() => setKpiExpanded(prev => !prev)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200 hover:bg-grass-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-body3 font-medium text-grass-700 flex-1 text-left">Campaign KPIs approved</span>
              {kpiExpanded ? <ChevronDown className="h-3.5 w-3.5 text-grass-500" /> : <ChevronRight className="h-3.5 w-3.5 text-grass-500" />}
            </button>
            {kpiExpanded && (
              <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4 bg-gradient-to-r from-turquoise-25 to-white border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-turquoise-700" />
                    <span className="text-body3 font-semibold text-cool-900">Campaign KPI Validation</span>
                  </div>
                  <p className="text-caption text-cool-500 mt-1">Industry: CPG — Beverages Sector</p>
                </div>
                <div className="divide-y divide-neutral-100">
                  {campaignKpis.map((kpi) => (
                    <div key={kpi.name} className="px-5 py-3 flex items-center justify-between">
                      <div>
                        <p className="text-body3 font-medium text-cool-800">{kpi.name}</p>
                        <p className="text-caption text-cool-500">Benchmark: {kpi.benchmark}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-body3 font-semibold text-cool-900">{kpi.value}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-label font-medium",
                          kpi.status === "aligned" ? "bg-grass-50 text-grass-700" : "bg-orange-50 text-orange-700"
                        )}>
                          {kpi.status === "aligned" ? "Aligned" : "Review"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {/* Phase 3: KPI Validation — full view */}
        {isCampaignSetup && setupPhase === "kpi-validation" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-turquoise-25 to-white border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-turquoise-700" />
                  <span className="text-body3 font-semibold text-cool-900">Campaign KPI Validation</span>
                </div>
                <p className="text-caption text-cool-500 mt-1">Industry: CPG — Beverages Sector</p>
              </div>
              <div className="divide-y divide-neutral-100">
                {campaignKpis.map((kpi) => (
                  <div key={kpi.name} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-body3 font-medium text-cool-800">{kpi.name}</p>
                      <p className="text-caption text-cool-500">Benchmark: {kpi.benchmark}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-body3 font-semibold text-cool-900">{kpi.value}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-label font-medium",
                        kpi.status === "aligned" ? "bg-grass-50 text-grass-700" : "bg-orange-50 text-orange-700"
                      )}>
                        {kpi.status === "aligned" ? "Aligned" : "Review"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={() => {
                setKpisApproved(true);
                const msg: Message = { id: `approve-kpi-${Date.now()}`, role: "user", content: "KPIs look aligned. Continue." };
                const veraMsg: Message = { id: `vera-inconsistency-${Date.now()}`, role: "vera", content: "I've reviewed your profile configuration and found some inconsistencies to address." };
                setMessages(prev => [...prev, msg, veraMsg]);
                setSetupPhase("inconsistency-check");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              Approve KPIs
            </button>
            <button className="w-full text-body3 text-cool-500 hover:text-cool-700 underline underline-offset-2 py-1">
              Switch to manual configuration
            </button>
          </div>
        )}

        {/* Inconsistency Check — compact resolved state */}
        {isCampaignSetup && inconsistenciesResolved && setupPhase !== "inconsistency-check" && (
          <div className={cn("self-start space-y-2", cardWidth)}>
            <button
              onClick={() => setInconsistenciesExpanded(prev => !prev)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200 hover:bg-grass-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-body3 font-medium text-grass-700 flex-1 text-left">
                Inconsistencies resolved ({acceptedInconsistencies.size} accepted)
              </span>
              {inconsistenciesExpanded ? <ChevronDown className="h-3.5 w-3.5 text-grass-500" /> : <ChevronRight className="h-3.5 w-3.5 text-grass-500" />}
            </button>
          </div>
        )}
        {/* Inconsistency Check — full view */}
        {isCampaignSetup && setupPhase === "inconsistency-check" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <div className="rounded-xl border border-orange-200 bg-orange-25 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <span className="text-body3 font-semibold text-cool-900">Profile Inconsistencies</span>
              </div>
              {profileInconsistencies.map((issue) => (
                <div key={issue.id} className={cn("rounded-lg border bg-white p-3", acceptedInconsistencies.has(issue.id) ? "border-grass-200" : "border-neutral-200")}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-label font-medium",
                      acceptedInconsistencies.has(issue.id) ? "bg-grass-50 text-grass-700" : issue.severity === "medium" ? "bg-orange-50 text-orange-700" : "bg-neutral-50 text-cool-600"
                    )}>
                      {acceptedInconsistencies.has(issue.id) ? "Accepted" : issue.severity === "medium" ? "Medium" : "Low"}
                    </span>
                  </div>
                  <p className="text-body3 text-cool-700 mb-1.5">{issue.description}</p>
                  <p className="text-caption text-plum-600 italic">Recommendation: {issue.recommendation}</p>
                  {!acceptedInconsistencies.has(issue.id) ? (
                    <button
                      onClick={() => setAcceptedInconsistencies(prev => new Set([...prev, issue.id]))}
                      className="mt-2 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-plum-50 text-plum-700 text-body3 font-medium hover:bg-plum-100 transition-colors"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Accept recommendation
                    </button>
                  ) : (
                    <div className="mt-2 flex items-center gap-1.5 text-body3 font-medium text-grass-600">
                      <Check className="h-3.5 w-3.5" />
                      Recommendation accepted
                    </div>
                  )}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setInconsistenciesResolved(true);
                const accepted = acceptedInconsistencies.size;
                const msg: Message = { id: `resolve-inc-${Date.now()}`, role: "user", content: `Resolved ${accepted} inconsistencies. Continue.` };
                const veraMsg: Message = { id: `vera-unblock-${Date.now()}`, role: "vera", content: "I've also identified some topics that could be safely unblocked based on industry benchmarks for CPG Beverages. This could help increase your campaign reach." };
                setMessages(prev => [...prev, msg, veraMsg]);
                setSetupPhase("unblock-recommendations");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Unblock Recommendations — compact resolved state */}
        {isCampaignSetup && unblockResolved && setupPhase !== "unblock-recommendations" && (
          <div className={cn("self-start space-y-2", cardWidth)}>
            <button
              onClick={() => setUnblockExpanded(prev => !prev)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200 hover:bg-grass-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-body3 font-medium text-grass-700 flex-1 text-left">
                {[...unblockDecisions.values()].filter(v => v === "unblock").length} topics unblocked via benchmarks
              </span>
              {unblockExpanded ? <ChevronDown className="h-3.5 w-3.5 text-grass-500" /> : <ChevronRight className="h-3.5 w-3.5 text-grass-500" />}
            </button>
          </div>
        )}

        {/* Unblock Recommendations — full view */}
        {isCampaignSetup && setupPhase === "unblock-recommendations" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <div className="rounded-xl border border-turquoise-100 bg-turquoise-25 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-turquoise-600" />
                <span className="text-body3 font-semibold text-cool-900">Topics to Consider Unblocking</span>
              </div>
              <p className="text-body3 text-cool-600">These topics were blocked on your previous profile but we recommend unblocking based on industry benchmarks.</p>
              {unblockRecommendationItems.map((item) => {
                const decision = unblockDecisions.get(item.id);
                return (
                  <div key={item.id} className={cn("rounded-lg border bg-white p-3", decision === "unblock" ? "border-grass-200" : decision === "keep" ? "border-neutral-200" : "border-neutral-200")}>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-body3 font-medium text-cool-900">{item.topic}</span>
                      {!decision && (
                        <span className="px-1.5 py-0.5 rounded bg-plum-50 text-plum-600 text-label font-medium">Currently Blocked</span>
                      )}
                      {decision === "unblock" && (
                        <span className="px-1.5 py-0.5 rounded bg-grass-50 text-grass-700 text-label font-medium">Unblocked</span>
                      )}
                      {decision === "keep" && (
                        <span className="px-1.5 py-0.5 rounded bg-neutral-100 text-cool-500 text-label font-medium">Kept Blocked</span>
                      )}
                    </div>
                    <p className="text-body3 text-cool-700 mb-1.5">{item.description}</p>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-caption text-cool-500">{item.industryBenchmark}</span>
                      <span className="text-caption font-medium text-grass-700">{item.reachImpact} estimated reach</span>
                    </div>
                    {!decision && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setUnblockDecisions(prev => new Map(prev).set(item.id, "unblock"))}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-grass-500 text-white text-body3 font-medium hover:bg-grass-600 transition-colors"
                        >
                          <Check className="h-3.5 w-3.5" />
                          Unblock
                        </button>
                        <button
                          onClick={() => setUnblockDecisions(prev => new Map(prev).set(item.id, "keep"))}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-neutral-200 bg-white text-cool-700 text-body3 font-medium hover:bg-neutral-50 transition-colors"
                        >
                          Keep Blocked
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => {
                setUnblockResolved(true);
                const unblocked = [...unblockDecisions.values()].filter(v => v === "unblock").length;
                const msg: Message = { id: `resolve-unblock-${Date.now()}`, role: "user", content: `${unblocked} topics unblocked. Continue.` };
                const veraMsg: Message = { id: `vera-naming-${Date.now()}`, role: "vera", content: "Now let's give your profile a name." };
                setMessages(prev => [...prev, msg, veraMsg]);
                setSetupPhase("profile-naming");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 6: Profile Naming — compact approved state */}
        {isCampaignSetup && profileNamed && setupPhase !== "profile-naming" && (
          <div className={cn("self-start space-y-2", cardWidth)}>
            <button
              onClick={() => setProfileNameExpanded(prev => !prev)}
              className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-grass-50 border border-grass-200 hover:bg-grass-100 transition-colors"
            >
              <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3 w-3 text-white" />
              </div>
              <span className="text-body3 font-medium text-grass-700 flex-1 text-left">Profile named: {profileName}</span>
              {profileNameExpanded ? <ChevronDown className="h-3.5 w-3.5 text-grass-500" /> : <ChevronRight className="h-3.5 w-3.5 text-grass-500" />}
            </button>
            {profileNameExpanded && (
              <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
                <div className="px-5 py-4">
                  <label className="block text-body3 text-cool-600 mb-1.5">Profile Name</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-body3 text-cool-900 focus:outline-none focus:ring-2 focus:ring-plum-300 focus:border-plum-400"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {/* Step 6: Profile Naming — full view */}
        {isCampaignSetup && setupPhase === "profile-naming" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-plum-50 to-white border-b border-neutral-100">
                <span className="text-body3 font-semibold text-cool-900">Name Your Profile</span>
                <p className="text-caption text-cool-500 mt-0.5">Give your brand safety profile a name</p>
              </div>
              <div className="px-5 py-4">
                <label className="block text-body3 text-cool-600 mb-1.5">Profile Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-neutral-300 text-body3 text-cool-900 focus:outline-none focus:ring-2 focus:ring-plum-300 focus:border-plum-400"
                />
              </div>
            </div>
            <button
              onClick={() => {
                if (!profileName.trim()) return;
                setProfileNamed(true);
                const msg: Message = { id: `name-profile-${Date.now()}`, role: "user", content: `Name: ${profileName}` };
                const veraMsg: Message = { id: `vera-review-${Date.now()}`, role: "vera", content: "Here's your final profile summary. Review and approve to proceed." };
                setMessages(prev => [...prev, msg, veraMsg]);
                setSetupPhase("profile-review");
              }}
              disabled={!profileName.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors disabled:bg-neutral-200 disabled:text-neutral-400"
            >
              Continue
            </button>
          </div>
        )}

        {/* Step 7: Profile Review */}
        {isCampaignSetup && setupPhase === "profile-review" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
              <div className="px-5 py-4 bg-gradient-to-r from-grass-50 to-white border-b border-neutral-100">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-grass-700" />
                  <span className="text-body3 font-semibold text-cool-900">Profile Summary</span>
                </div>
              </div>
              <div className="px-5 py-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body3 text-cool-600">Profile Name</span>
                  <span className="text-body3 font-medium text-cool-900">{profileName}</span>
                </div>
                {creationMode === "existing" && selectedExistingProfileId && (
                  <div className="flex items-center justify-between">
                    <span className="text-body3 text-cool-600">Based On</span>
                    <span className="text-body3 font-medium text-cool-900">{brandSafetyProfiles.find(p => p.id === selectedExistingProfileId)?.name ?? "—"}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-body3 text-cool-600">Campaign Brief</span>
                  <span className="text-body3 font-medium text-cool-900">{briefInputMethod === "crawl" ? `Crawled: ${websiteUrl}` : "Uploaded"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body3 text-cool-600">Topics Unblocked</span>
                  <span className="text-body3 font-medium text-cool-900">{[...unblockDecisions.values()].filter(v => v === "unblock").length} via benchmarks</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body3 text-cool-600">Inconsistencies</span>
                  <span className="text-body3 font-medium text-grass-700">Resolved ({acceptedInconsistencies.size} accepted)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body3 text-cool-600">KPIs</span>
                  <span className="text-body3 font-medium text-grass-700">Validated</span>
                </div>
                {connectedDsps.length > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-body3 text-cool-600">DSP Connected</span>
                    <span className="text-body3 font-medium text-cool-900">{connectedDsps[0].platformLabel}</span>
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                const msg: Message = { id: `approve-review-${Date.now()}`, role: "user", content: "Approved. Let's connect the DSP." };
                const veraMsg: Message = { id: `vera-dsp-${Date.now()}`, role: "vera", content: "Profile approved! Let's connect your DSP so the profile can start optimizing campaign performance." };
                setMessages(prev => [...prev, msg, veraMsg]);
                setSetupPhase("dsp-connect");
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              <Check className="h-4 w-4" />
              Approve & Connect DSP
            </button>
            <button className="w-full text-body3 text-cool-500 hover:text-cool-700 underline underline-offset-2 py-1">
              Switch to manual configuration
            </button>
          </div>
        )}

        {/* Phase 8: DSP Connect (reuse existing pattern) */}
        {isCampaignSetup && setupPhase === "dsp-connect" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            {/* Connected DSPs */}
            {connectedDsps.map((dsp) => (
              <div key={`${dsp.platform}-${dsp.seatId}`} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-grass-100 bg-grass-25">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-label font-bold", dspPlatforms.find(p => p.value === dsp.platform)?.color)}>
                  {dspPlatforms.find(p => p.value === dsp.platform)?.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body3 font-medium text-cool-900">{dsp.platformLabel}</p>
                  <p className="text-caption text-cool-500">{dsp.seatId}</p>
                </div>
                <Check className="h-4 w-4 text-grass-600 flex-shrink-0" />
              </div>
            ))}

            {/* DSP Form */}
            {(showDspForm || connectedDsps.length === 0) && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                <div>
                  <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Platform</label>
                  <select
                    value={dspFormPlatform}
                    onChange={(e) => setDspFormPlatform(e.target.value)}
                    className="w-full h-10 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 appearance-none cursor-pointer"
                  >
                    <option value="">Select platform...</option>
                    {dspPlatforms.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-body3 font-medium text-cool-700 mb-1.5 block">Seat ID</label>
                  <input
                    type="text"
                    value={dspFormSeatId}
                    onChange={(e) => setDspFormSeatId(e.target.value)}
                    placeholder="Enter seat ID..."
                    className="w-full h-10 px-3 text-body3 bg-white border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100"
                  />
                </div>
                <button
                  onClick={handleConnectDsp}
                  disabled={!dspFormPlatform || !dspFormSeatId.trim()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-plum-200 bg-plum-50 text-plum-700 text-body3 font-medium hover:bg-plum-100 transition-colors disabled:bg-neutral-50 disabled:text-neutral-400 disabled:border-neutral-200"
                >
                  <Globe className="h-4 w-4" />
                  Connect
                </button>
              </div>
            )}

            {connectedDsps.length > 0 && !showDspForm && (
              <button
                onClick={() => setShowDspForm(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-neutral-200 bg-white text-cool-600 text-body3 font-medium hover:bg-neutral-50 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Another DSP
              </button>
            )}

            {connectedDsps.length > 0 && (
              <button
                onClick={() => {
                  setSyncedDspNames(connectedDsps.map(d => `${d.platformLabel}: ${d.seatId}`));
                  setSetupPhase("syncing");
                  setTimeout(() => {
                    setSetupPhase("final-touches");
                    setProfileCreated(true);
                    const veraMsg: Message = { id: `vera-final-${Date.now()}`, role: "vera", content: "Your profile is live! Would you like to add any final customizations before we wrap up?" };
                    setMessages(prev => [...prev, veraMsg]);
                  }, 2500);
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
              >
                Sync {connectedDsps.length} DSP Seat{connectedDsps.length !== 1 ? "s" : ""}
              </button>
            )}

            <button
              onClick={() => {
                setSyncedDspNames([]);
                setSetupPhase("final-touches");
                setProfileCreated(true);
                const veraMsg: Message = { id: `vera-final-${Date.now()}`, role: "vera", content: "Your profile is live! Would you like to add any final customizations before we wrap up?" };
                setMessages(prev => [...prev, veraMsg]);
              }}
              className="text-body3 text-cool-500 hover:text-cool-700 underline underline-offset-2 py-1 w-full text-center"
            >
              Skip for Now
            </button>
          </div>
        )}

        {/* Step 8b: Syncing */}
        {isCampaignSetup && setupPhase === "syncing" && (
          <div className={cn("space-y-3 self-start", cardWidth)}>
            <CollapsedSectionSummary
              icon={<ShieldCheck className="h-4 w-4 text-plum-600" />}
              title="Profile Configuration"
              subtitle="Profile approved and ready"
            />
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-neutral-50 border border-neutral-100">
              <Loader2 className="h-4 w-4 text-plum-500 animate-spin" />
              <span className="text-body3 text-cool-600">Syncing profile to {connectedDsps.length} DSP seat{connectedDsps.length !== 1 ? "s" : ""}...</span>
            </div>
          </div>
        )}

        {/* Step 9: Final Touches */}
        {isCampaignSetup && setupPhase === "final-touches" && (
          <div className={cn("self-start space-y-3", cardWidth)}>
            {/* Success banner */}
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl border border-grass-200 bg-grass-50">
              <div className="w-6 h-6 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                <Check className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-body3 font-medium text-grass-700">
                  {syncedDspNames.length > 0 ? "Campaign Setup Complete! Profile synced." : "Campaign Setup Complete! Profile created."}
                </p>
                <p className="text-body3 text-cool-600 mt-0.5">
                  Brand safety profile is active for {profileName}
                </p>
              </div>
            </div>

            {syncedDspNames.length > 0 && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <p className="text-body3 font-semibold text-cool-900 mb-2">Synced DSP Seats</p>
                <div className="space-y-2">
                  {syncedDspNames.map((name) => (
                    <div key={name} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-grass-50 border border-grass-200">
                      <div className="w-5 h-5 rounded-full bg-grass-500 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-body3 font-medium text-grass-700">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add-ons */}
            <div className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
              <div>
                <p className="text-body3 font-semibold text-cool-900">Would you like to add any final touches?</p>
                <p className="text-label text-cool-500 mt-0.5">Optional</p>
              </div>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-25 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                  <Plus className="h-4 w-4 text-plum-600" />
                </div>
                <div>
                  <p className="text-body3 font-medium text-cool-900">Add Keywords</p>
                  <p className="text-label text-cool-500">e.g., Competitor names, specific tragedies</p>
                </div>
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-25 transition-colors text-left">
                <div className="w-8 h-8 rounded-lg bg-plum-50 flex items-center justify-center flex-shrink-0">
                  <Upload className="h-4 w-4 text-plum-600" />
                </div>
                <div>
                  <p className="text-body3 font-medium text-cool-900">Upload Site Blocklist</p>
                  <p className="text-label text-cool-500">Your CSV of 'Never-Buy' domains</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowFinalNav(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-plum-600 text-white text-body3 font-medium hover:bg-plum-700 transition-colors"
            >
              I'm all set
            </button>

            {showFinalNav && (
              <div className="space-y-2">
                <p className="text-body3 text-cool-600 text-center">Where would you like to go?</p>
                <button
                  onClick={() => { window.location.href = "/dv-pinnacle-v2/brand-safety"; }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-25 transition-colors text-left"
                >
                  <ShieldCheck className="h-4 w-4 text-plum-600 flex-shrink-0" />
                  <span className="text-body3 font-medium text-cool-900">Brand Safety Dashboard</span>
                </button>
                <button
                  onClick={() => { window.location.href = "/dv-pinnacle-v2/"; }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-25 transition-colors text-left"
                >
                  <BarChart3 className="h-4 w-4 text-plum-600 flex-shrink-0" />
                  <span className="text-body3 font-medium text-cool-900">Campaign Health Dashboard</span>
                </button>
              </div>
            )}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions (general only) */}
      {!isBrandSafety && !isAnalyze && !isCampaignSetup && messages.length <= 1 && (
        <div className={cn("px-5 pb-3 flex flex-wrap gap-2", minWidth)}>
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="px-3 py-1.5 text-body3 font-medium text-plum-600 bg-plum-50 border border-plum-100 rounded-full hover:bg-plum-100 transition-colors duration-200"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className={cn("p-4 border-t border-neutral-100 flex-shrink-0", minWidth)}>
        <div className={cn("flex items-center gap-2", expanded && "max-w-2xl mx-auto")}>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={isBrandSafety ? "Ask about brand safety..." : isAnalyze ? "Ask about this analysis..." : isCampaignSetup ? "Ask about this setup..." : "Ask Vera anything..."}
            className="flex-1 h-10 px-4 text-body3 bg-neutral-50 border border-neutral-200 rounded-lg outline-none focus:border-plum-300 focus:ring-2 focus:ring-plum-100 transition-all duration-200"
          />
          <Button
            variant="plum"
            onClick={handleSend}
            disabled={!input.trim()}
            className="h-10 w-10 p-0 disabled:bg-neutral-200 disabled:text-neutral-400 disabled:opacity-100"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-caption text-cool-600 text-center mt-2">Vera is AI and can make mistakes</p>
      </div>
    </div>
  );
}
