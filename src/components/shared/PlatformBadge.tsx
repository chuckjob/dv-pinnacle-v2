import { Globe, Tv, Music, Facebook, Youtube, Ghost, Linkedin, Twitch } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Platform } from '@/types/goal';
import { platformConfigs } from '@/types/platform';

const platformIcons: Record<Platform, React.ElementType> = {
  'open-web': Globe,
  'ctv': Tv,
  'tiktok': Music,
  'meta': Facebook,
  'youtube': Youtube,
  'snapchat': Ghost,
  'linkedin': Linkedin,
  'twitch': Twitch,
};

const sizeStyles = {
  sm: { badge: 'px-1.5 py-px text-label', icon: 'h-2.5 w-2.5' },
  md: { badge: 'px-2 py-0.5 text-body3', icon: 'h-3.5 w-3.5' },
};

interface PlatformBadgeProps {
  platform: Platform;
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export function PlatformBadge({ platform, className, showLabel = true, size = 'sm' }: PlatformBadgeProps) {
  const config = platformConfigs[platform];
  const Icon = platformIcons[platform];
  const s = sizeStyles[size];

  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full font-medium', s.badge, config.bgColor, config.color, className)}>
      {Icon && <Icon className={s.icon} />}
      {showLabel && config.label}
    </span>
  );
}
