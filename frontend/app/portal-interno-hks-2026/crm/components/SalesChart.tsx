'use client';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from 'recharts';

const sampleData = [
  { month: 'Jan', receita: 45000, deals: 12 },
  { month: 'Fev', receita: 52000, deals: 15 },
  { month: 'Mar', receita: 48000, deals: 13 },
  { month: 'Abr', receita: 61000, deals: 18 },
  { month: 'Mai', receita: 55000, deals: 14 },
  { month: 'Jun', receita: 67000, deals: 20 },
  { month: 'Jul', receita: 72000, deals: 22 },
  { month: 'Ago', receita: 68000, deals: 19 },
  { month: 'Set', receita: 79000, deals: 24 },
  { month: 'Out', receita: 83000, deals: 26 },
  { month: 'Nov', receita: 91000, deals: 28 },
  { month: 'Dez', receita: 95000, deals: 30 },
];

interface SalesChartProps {
  data?: { month: string; receita: number; deals?: number }[];
}

export default function SalesChart({ data = sampleData }: SalesChartProps) {
  const fmt = (v: number) =>
    new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      notation: 'compact',
    }).format(v);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis
          dataKey="month"
          stroke="rgba(255,255,255,0.3)"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
        />
        <YAxis
          stroke="rgba(255,255,255,0.3)"
          tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
          axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
          tickFormatter={fmt}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid rgba(212,175,55,0.2)',
            borderRadius: '12px',
            color: '#fff',
            fontSize: 12,
          }}
          formatter={(value) => [fmt(Number(value ?? 0)), 'Receita']}
          labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
        />
        <Area
          type="monotone"
          dataKey="receita"
          stroke="#D4AF37"
          strokeWidth={2}
          fill="url(#goldGrad)"
          dot={{ fill: '#D4AF37', strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: '#D4AF37', stroke: '#1a1a1a', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
