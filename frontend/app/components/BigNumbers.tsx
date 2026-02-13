'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BigNumberProps {
  title: string;
  value: string | number;
  change?: number;
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
  prefix?: string;
  suffix?: string;
}

export function BigNumber({ 
  title, 
  value, 
  change, 
  icon: Icon, 
  loading = false,
  prefix = '',
  suffix = ''
}: BigNumberProps) {
  const getTrendIcon = () => {
    if (!change || change === 0) return <Minus className="h-3 w-3" />;
    return change > 0 
      ? <TrendingUp className="h-3 w-3" />
      : <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (!change || change === 0) return 'text-muted-foreground';
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <Card className="bg-[#050505]/80 border-white/10 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white/70">
          {title}
        </CardTitle>
        {Icon && <Icon className="h-4 w-4 text-white/50" />}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
            <div className="h-3 w-16 bg-white/10 rounded animate-pulse" />
          </div>
        ) : (
          <>
            <div className="text-2xl font-bold text-white">
              {prefix}{value}{suffix}
            </div>
            {change !== undefined && (
              <p className={`text-xs flex items-center gap-1 mt-1 ${getTrendColor()}`}>
                {getTrendIcon()}
                <span>{Math.abs(change)}%</span>
                <span className="text-white/50">vs mês anterior</span>
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

interface VisitantesOnlineProps {
  count?: number;
  loading?: boolean;
}

export function VisitantesOnline({ count = 0, loading = false }: VisitantesOnlineProps) {
  const [visitors, setVisitors] = useState(count);

  useEffect(() => {
    if (!loading) {
      setVisitors(count);
    }
  }, [count, loading]);

  return (
    <Card className="bg-[#050505]/80 border-white/10 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-white/70">
          Visitantes Online
        </CardTitle>
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs text-white/50">GA4</span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-8 w-16 bg-white/10 rounded animate-pulse" />
        ) : (
          <div className="text-2xl font-bold text-white">
            {visitors}
          </div>
        )}
        <p className="text-xs text-white/50 mt-1">
          agora
        </p>
      </CardContent>
    </Card>
  );
}
