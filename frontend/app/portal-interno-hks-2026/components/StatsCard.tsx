'use client';

interface StatsCardProps {
  label: string;
  value: string | number;
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
  border?: string;
  loading?: boolean;
  onClick?: () => void;
  active?: boolean;
  change?: number;
}

export function StatsCard({
  label,
  value,
  icon: Icon,
  color = 'text-[#D4AF37]',
  border = 'border-white/10',
  loading = false,
  onClick,
  active = false,
  change,
}: StatsCardProps) {
  const Wrapper = onClick ? 'button' : 'div';

  return (
    <Wrapper
      onClick={onClick}
      className={`rounded-lg border p-5 text-left transition-all ${
        active
          ? 'border-[#D4AF37] bg-[#D4AF37]/10'
          : `${border} bg-[#0a0a0a] ${onClick ? 'hover:border-[#D4AF37]/30 cursor-pointer' : ''}`
      }`}
    >
      {loading ? (
        <div className="space-y-2">
          <div className="h-5 w-5 rounded bg-white/10 animate-pulse" />
          <div className="h-7 w-20 rounded bg-white/10 animate-pulse" />
          <div className="h-4 w-16 rounded bg-white/10 animate-pulse" />
        </div>
      ) : (
        <>
          {Icon && <Icon className={`h-5 w-5 ${color} mb-2`} />}
          <p className="text-2xl font-bold text-white">{value}</p>
          <div className="flex items-center gap-2">
            <p className="text-xs text-gray-400">{label}</p>
            {change !== undefined && (
              <span
                className={`text-[10px] font-semibold ${
                  change > 0 ? 'text-green-400' : change < 0 ? 'text-red-400' : 'text-gray-500'
                }`}
              >
                {change > 0 ? '+' : ''}
                {change}%
              </span>
            )}
          </div>
        </>
      )}
    </Wrapper>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  cols?: 3 | 4 | 5 | 6;
}

export function StatsGrid({ children, cols = 4 }: StatsGridProps) {
  const gridCols = {
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    5: 'md:grid-cols-5',
    6: 'md:grid-cols-3 lg:grid-cols-6',
  };

  return <div className={`grid gap-4 ${gridCols[cols]}`}>{children}</div>;
}
