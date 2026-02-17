// ─── Platform & Inventory ───────────────────────────────────
export type Platform = 'open-web' | 'meta' | 'tiktok' | 'youtube' | 'ctv' | 'snapchat' | 'linkedin' | 'twitch';
export type InventoryType = 'open-market' | 'pmp' | 'pg' | 'all';

// ─── Media Type ────────────────────────────────────────────
export type MediaType = 'display' | 'social' | 'video' | 'ctv';

// ─── Goal Objective ─────────────────────────────────────────
export type GoalObjective = 'brand-awareness' | 'lead-generation' | 'conversions' | 'reach' | 'engagement' | 'video-views';

// ─── Status ─────────────────────────────────────────────────
export type EntityStatus = 'active' | 'paused' | 'draft';
export type HealthStatus = 'on-track' | 'at-risk' | 'needs-attention';

// ─── KPI ────────────────────────────────────────────────────
export type KpiType = 'cpl' | 'cpa' | 'cpm' | 'roas' | 'viewability' | 'ctr' | 'vcr' | 'brand-suitability';

export interface KpiConfig {
  type: KpiType;
  label: string;
  target: number;
  current: number;
  unit: string; // "$", "%", "x"
}

// ─── Ad (Creative) ──────────────────────────────────────────
export interface Ad {
  id: string;
  platformAdName: string;
  format: 'display' | 'video' | 'native' | 'carousel' | 'story';
  impressions: number;
  spend: number;
  firstSeen: string;
  lastSeen: string;
  viewableRate: number;
  attentionIndex: number;
  fraudScore: number;
  brandSuitabilityRate: number;
  inGeoRate: number;
  authenticAdRate: number;
  percentViewed: number;
  dwellTime: number;
}

// ─── Blocked / Authentic Sites (media context) ──────────────
export interface BlockedSite {
  domain: string;
  blockReason: string;
  blockDetail: string;
  impressionsBlocked: number;
  detectionMethod: string;
  sampleUrl: string;
  riskScore: number;
}

export interface AuthenticSite {
  domain: string;
  qualityScore: number;
  impressions: number;
  authenticRate: number;
}

// ─── Ad Set Diagnostics (synthetic, generated at runtime) ────
export interface AdSetDiagnosticData {
  offGeoRegions: Array<{ region: string; percentage: number }>;
  sivtCategories: Array<{ category: string; percentage: number; description: string }>;
  cpaiEfficiencyGap: { targetCpm: number; actualCpai: number; gapDollars: number };
  aarTrend: number[];
  blockedSites: BlockedSite[];
}

// ─── Ad Set (Placement) ─────────────────────────────────────
export interface AdSet {
  id: string;
  platformAdSetName: string;
  platform: Platform;
  impressions: number;
  spend: number;
  firstSeen: string;
  lastSeen: string;
  viewableRate: number;
  attentionIndex: number;
  fraudScore: number;
  brandSuitabilityRate: number;
  inGeoRate: number;
  authenticAdRate: number;
  ads: Ad[];
}

// ─── Campaign ───────────────────────────────────────────────
export interface Campaign {
  id: string;
  name: string;
  platform: Platform;
  objective: GoalObjective;
  status: EntityStatus;
  healthStatus: HealthStatus;
  impressions: number;
  spend: number;
  firstSeen: string;
  lastSeen: string;
  fraudScore: number;
  sustainabilityScore: number;
  viewabilityRate: number;
  attentionIndex: number;
  authenticAdRate: number;
  inGeoRate: number;
  brandSuitabilityRate: number;
  blockRate: number;
  adSets: AdSet[];
}

// ─── Brand Safety ──────────────────────────────────────────
export type SafetyTierKey = 'strict' | 'moderate' | 'loose';

// ─── Goal (Top-Level Entity) ────────────────────────────────
export interface Goal {
  id: string;
  name: string;
  objective: GoalObjective;
  inventoryType: InventoryType;
  status: EntityStatus;
  healthStatus: HealthStatus;
  kpis: KpiConfig[];
  dateRange: { start: string; end: string };
  campaigns: Campaign[];
  totalImpressions: number;
  totalSpend: number;
  brandSuitabilityRate: number;
  fraudRate: number;
  viewabilityRate: number;
  attentionIndex: number;
  authenticAdRate: number;
  inGeoRate: number;
  blockRate: number;
  platforms: Platform[];
  /** Single platform for new goals (post media-type refactor) */
  platform?: Platform;
  /** Media type for new goals */
  mediaType?: MediaType;
  safetyTier?: SafetyTierKey;
  connectedDsp?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Flat Campaign (for campaigns list view) ────────────────
export interface FlatCampaign extends Campaign {
  goalId?: string;
  goalName?: string;
}
