import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendIndicator } from './TrendIndicator';

interface MetricCardProps {
  label: string;
  value: string;
  description?: string;
  trend?: number;
  trendDirection?: 'up' | 'down';
  isPositive?: boolean;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  valueClassName?: string;
  variant?: 'default' | 'warning';
}

export function MetricCard({ label, value, description, trend, trendDirection, isPositive, selected, onClick, className, valueClassName, variant = 'default' }: MetricCardProps) {
  const isWarning = variant === 'warning';

  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border p-4 transition-all overflow-hidden',
        isWarning ? 'bg-orange-25 border-orange-200' : 'bg-white',
        onClick && 'cursor-pointer hover:shadow-elevation-raised',
        selected && 'border-plum-300 bg-plum-25 shadow-elevation-raised',
        !selected && !isWarning && 'border-neutral-200',
        className
      )}
    >
      <div className="flex items-center gap-1 mb-1 min-w-0">
        <p className={cn('text-label truncate', isWarning ? 'text-orange-600' : 'text-cool-500')}>{label}</p>
        {isWarning && <AlertTriangle className="h-3 w-3 text-orange-500 flex-shrink-0" />}
      </div>
      <div className="flex items-end gap-2 min-w-0">
        <span className={cn('text-h5 font-bold truncate', isWarning ? 'text-orange-700' : 'text-cool-900', valueClassName)}>{value}</span>
        {trend !== undefined && trendDirection && isPositive !== undefined && (
          <span className="flex-shrink-0">
            <TrendIndicator value={trend} direction={trendDirection} isPositive={isPositive} />
          </span>
        )}
      </div>
      {description && <p className="text-label text-cool-400 mt-0.5 truncate">{description}</p>}
    </div>
  );
}
