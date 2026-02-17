import type { Platform, MediaType } from './goal';

export interface PlatformConfig {
  id: Platform;
  label: string;
  color: string;
  bgColor: string;
  iconColor: string;
}

export const platformConfigs: Record<Platform, PlatformConfig> = {
  'open-web': { id: 'open-web', label: 'Open Web', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
  'meta': { id: 'meta', label: 'Meta', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
  'tiktok': { id: 'tiktok', label: 'TikTok', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
  'youtube': { id: 'youtube', label: 'YouTube', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
  'ctv': { id: 'ctv', label: 'CTV', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
  'snapchat': { id: 'snapchat', label: 'Snapchat', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
  'linkedin': { id: 'linkedin', label: 'LinkedIn', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
  'twitch': { id: 'twitch', label: 'Twitch', color: 'text-cool-600', bgColor: 'bg-neutral-100', iconColor: '#5a5e78' },
};

// ─── Media Type → Platform Mapping ──────────────────────────
export interface MediaTypeConfig {
  id: MediaType;
  label: string;
  desc: string;
  metricFocus: string;
  platforms: Platform[];
}

export const mediaTypeConfigs: Record<MediaType, MediaTypeConfig> = {
  display: {
    id: 'display',
    label: 'Display',
    desc: 'Banner and native ads across the open web',
    metricFocus: 'Block Rate & URL verification',
    platforms: ['open-web'],
  },
  social: {
    id: 'social',
    label: 'Social',
    desc: 'Walled garden platforms',
    metricFocus: 'Feed-level Brand Safety analysis',
    platforms: ['meta', 'tiktok', 'snapchat'],
  },
  video: {
    id: 'video',
    label: 'Video',
    desc: 'Pre-roll, mid-roll, and outstream video',
    metricFocus: 'Viewability & Attention metrics',
    platforms: ['youtube'],
  },
  ctv: {
    id: 'ctv',
    label: 'CTV',
    desc: 'Connected TV streaming environments',
    metricFocus: 'Fraud (SIVT) & app-level verification',
    platforms: ['ctv'],
  },
};
