import { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { PlatformBadge } from '@/components/shared/PlatformBadge';
import { formatNumber, formatCompactCurrency, formatPercent } from '@/lib/formatters';
import { getAuthenticRateColor, getAdSetHealth, getAdHealth, getCampaignCreativeAverages } from '@/lib/authentic-ad-utils';
import type { Campaign, AdSet, Ad } from '@/types/goal';

interface CampaignTreeTableProps {
  campaigns: Campaign[];
  goalId: string;
  onNavigate: (path: string) => void;
}

export function CampaignTreeTable({ campaigns, goalId, onNavigate }: CampaignTreeTableProps) {
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());
  const [expandedAdSets, setExpandedAdSets] = useState<Set<string>>(new Set());

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAdSet = (id: string) => {
    setExpandedAdSets(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="overflow-x-auto max-w-full">
      <table className="w-full min-w-[900px]">
        <thead>
          <tr className="border-b border-neutral-100 bg-neutral-25">
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-left">Name</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">Authentic Ad Rate</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-left">Health</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-left">Platform</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">Spend</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">Impressions</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">Fraud-Free</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">Brand Suitable</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">Viewable</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">In-Geo</th>
            <th className="px-4 py-3 text-label font-semibold text-cool-600 text-right">Block Rate</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map(campaign => {
            const isExpanded = expandedCampaigns.has(campaign.id);
            return (
              <CampaignRow
                key={campaign.id}
                campaign={campaign}
                goalId={goalId}
                isExpanded={isExpanded}
                expandedAdSets={expandedAdSets}
                onToggle={() => toggleCampaign(campaign.id)}
                onToggleAdSet={toggleAdSet}
                onNavigate={onNavigate}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CampaignRow({
  campaign,
  goalId,
  isExpanded,
  expandedAdSets,
  onToggle,
  onToggleAdSet,
  onNavigate,
}: {
  campaign: Campaign;
  goalId: string;
  isExpanded: boolean;
  expandedAdSets: Set<string>;
  onToggle: () => void;
  onToggleAdSet: (id: string) => void;
  onNavigate: (path: string) => void;
}) {
  const Chevron = isExpanded ? ChevronDown : ChevronRight;

  return (
    <>
      <tr className="border-b border-neutral-100 transition-colors hover:bg-plum-25 cursor-pointer group">
        <td className="px-4 py-3 text-body3">
          <div className="flex items-center gap-1.5">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="p-0.5 rounded hover:bg-neutral-100 transition-colors text-cool-400 hover:text-cool-700"
            >
              <Chevron className="h-4 w-4" />
            </button>
            <span
              className="font-medium text-cool-900 hover:text-plum-700 transition-colors cursor-pointer"
              onClick={() => onNavigate(`/goals/${goalId}/campaigns/${campaign.id}`)}
            >
              {campaign.name}
            </span>
          </div>
        </td>
        <td className="px-4 py-3 text-body3 text-right">
          <span className={cn('font-semibold', getAuthenticRateColor(campaign.authenticAdRate))}>
            {formatPercent(campaign.authenticAdRate)}
          </span>
        </td>
        <td className="px-4 py-3"><StatusBadge healthStatus={campaign.healthStatus} /></td>
        <td className="px-4 py-3"><PlatformBadge platform={campaign.platform} size="sm" /></td>
        <td className="px-4 py-3 text-body3 text-cool-700 text-right">{formatCompactCurrency(campaign.spend)}</td>
        <td className="px-4 py-3 text-body3 text-cool-700 text-right">{formatNumber(campaign.impressions)}</td>
        <td className="px-4 py-3 text-body3 text-cool-700 text-right">{formatPercent(100 - campaign.fraudScore)}</td>
        <td className="px-4 py-3 text-body3 text-cool-700 text-right">{formatPercent(campaign.brandSuitabilityRate)}</td>
        <td className="px-4 py-3 text-body3 text-cool-700 text-right">{formatPercent(campaign.viewabilityRate)}</td>
        <td className="px-4 py-3 text-body3 text-cool-700 text-right">{formatPercent(campaign.inGeoRate)}</td>
        <td className="px-4 py-3 text-body3 text-cool-700 text-right">{formatPercent(campaign.blockRate)}</td>
      </tr>

      {isExpanded && campaign.adSets.map(adSet => {
        const adSetExpanded = expandedAdSets.has(adSet.id);
        return (
          <AdSetRow
            key={adSet.id}
            adSet={adSet}
            campaign={campaign}
            isExpanded={adSetExpanded}
            onToggle={() => onToggleAdSet(adSet.id)}
          />
        );
      })}
    </>
  );
}

function AdSetRow({
  adSet,
  campaign,
  isExpanded,
  onToggle,
}: {
  adSet: AdSet;
  campaign: Campaign;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const Chevron = isExpanded ? ChevronDown : ChevronRight;
  const adSetHealth = getAdSetHealth(adSet);
  const campaignAvgs = getCampaignCreativeAverages(campaign);

  return (
    <>
      <tr className="border-b border-neutral-50 bg-neutral-25/50 transition-colors hover:bg-plum-25/50">
        <td className="px-4 py-2.5 text-body3">
          <div className="flex items-center gap-1.5 pl-6">
            <button
              onClick={(e) => { e.stopPropagation(); onToggle(); }}
              className="p-0.5 rounded hover:bg-neutral-100 transition-colors text-cool-400 hover:text-cool-700"
            >
              <Chevron className="h-3.5 w-3.5" />
            </button>
            <span className="text-cool-700 font-medium">{adSet.platformAdSetName}</span>
          </div>
        </td>
        <td className="px-4 py-2.5 text-body3 text-right">
          <span className={cn('font-semibold', getAuthenticRateColor(adSet.authenticAdRate))}>
            {formatPercent(adSet.authenticAdRate)}
          </span>
        </td>
        <td className="px-4 py-2.5"><StatusBadge healthStatus={adSetHealth} /></td>
        <td className="px-4 py-2.5 text-body3 text-cool-500">&mdash;</td>
        <td className="px-4 py-2.5 text-body3 text-cool-600 text-right">{formatCompactCurrency(adSet.spend)}</td>
        <td className="px-4 py-2.5 text-body3 text-cool-600 text-right">{formatNumber(adSet.impressions)}</td>
        <td className="px-4 py-2.5 text-body3 text-cool-600 text-right">{formatPercent(100 - adSet.fraudScore)}</td>
        <td className="px-4 py-2.5 text-body3 text-cool-600 text-right">{formatPercent(adSet.brandSuitabilityRate)}</td>
        <td className="px-4 py-2.5 text-body3 text-cool-600 text-right">{formatPercent(adSet.viewableRate)}</td>
        <td className="px-4 py-2.5 text-body3 text-cool-600 text-right">{formatPercent(adSet.inGeoRate)}</td>
        <td className="px-4 py-2.5 text-body3 text-cool-400 text-right">&mdash;</td>
      </tr>

      {isExpanded && adSet.ads.map(ad => (
        <AdRow key={ad.id} ad={ad} campaignAvgs={campaignAvgs} />
      ))}
    </>
  );
}

function AdRow({ ad, campaignAvgs }: { ad: Ad; campaignAvgs: { avgAttention: number; avgViewability: number } }) {
  const adHealth = getAdHealth(ad, campaignAvgs.avgAttention, campaignAvgs.avgViewability);

  return (
    <tr className="border-b border-neutral-50 bg-neutral-50/50 transition-colors hover:bg-plum-25/30">
      <td className="px-4 py-2 text-body3">
        <div className="flex items-center gap-1.5 pl-14">
          <span className="px-1.5 py-px rounded text-label font-medium bg-neutral-100 text-cool-500 capitalize">{ad.format}</span>
          <span className="text-cool-600">{ad.platformAdName}</span>
        </div>
      </td>
      <td className="px-4 py-2 text-body3 text-right">
        <span className={cn('font-semibold', getAuthenticRateColor(ad.authenticAdRate))}>
          {formatPercent(ad.authenticAdRate)}
        </span>
      </td>
      <td className="px-4 py-2"><StatusBadge healthStatus={adHealth} /></td>
      <td className="px-4 py-2 text-body3 text-cool-500">&mdash;</td>
      <td className="px-4 py-2 text-body3 text-cool-500 text-right">{formatCompactCurrency(ad.spend)}</td>
      <td className="px-4 py-2 text-body3 text-cool-500 text-right">{formatNumber(ad.impressions)}</td>
      <td className="px-4 py-2 text-body3 text-cool-400 text-right">&mdash;</td>
      <td className="px-4 py-2 text-body3 text-cool-400 text-right">&mdash;</td>
      <td className="px-4 py-2 text-body3 text-cool-500 text-right">{formatPercent(ad.viewableRate)}</td>
      <td className="px-4 py-2 text-body3 text-cool-400 text-right">&mdash;</td>
      <td className="px-4 py-2 text-body3 text-cool-400 text-right">&mdash;</td>
    </tr>
  );
}
