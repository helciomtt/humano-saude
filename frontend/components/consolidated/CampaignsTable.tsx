'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { type CockpitCampaign, type CampaignSortField, sortCampaigns, formatCurrency, formatNumber, formatPercent, formatRoas } from '@/lib/consolidator';

interface CampaignsTableProps {
  campaigns: CockpitCampaign[];
  maxRows?: number;
  onCampaignClick?: (campaign: CockpitCampaign) => void;
}

const COLUMNS: Array<{ key: CampaignSortField | 'status' | 'funnelStage'; label: string; align?: 'left' | 'right'; sortable?: boolean }> = [
  { key: 'name', label: 'Campanha', align: 'left', sortable: true },
  { key: 'status', label: 'Status', align: 'left' },
  { key: 'funnelStage', label: 'Funil', align: 'left' },
  { key: 'spend', label: 'Investimento', align: 'right', sortable: true },
  { key: 'impressions', label: 'Impressões', align: 'right', sortable: true },
  { key: 'clicks', label: 'Cliques', align: 'right', sortable: true },
  { key: 'ctr', label: 'CTR', align: 'right', sortable: true },
  { key: 'cpc', label: 'CPC', align: 'right', sortable: true },
  { key: 'cpm', label: 'CPM', align: 'right', sortable: true },
  { key: 'conversions', label: 'Conversões', align: 'right', sortable: true },
  { key: 'revenue', label: 'Receita', align: 'right', sortable: true },
  { key: 'roas', label: 'ROAS', align: 'right', sortable: true },
];

const FUNNEL_COLORS: Record<string, string> = {
  topo: 'bg-blue-500/20 text-blue-400',
  meio: 'bg-purple-500/20 text-purple-400',
  fundo: 'bg-[#D4AF37]/20 text-[#D4AF37]',
  retargeting: 'bg-green-500/20 text-green-400',
  indefinido: 'bg-gray-500/20 text-gray-400',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-500/20 text-green-400',
  PAUSED: 'bg-yellow-500/20 text-yellow-400',
  ARCHIVED: 'bg-gray-500/20 text-gray-400',
};

export default function CampaignsTable({ campaigns, maxRows, onCampaignClick }: CampaignsTableProps) {
  const [sortField, setSortField] = useState<CampaignSortField>('spend');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expanded, setExpanded] = useState(false);

  const sorted = useMemo(
    () => sortCampaigns(campaigns, sortField, sortDir),
    [campaigns, sortField, sortDir]
  );

  const displayed = expanded || !maxRows ? sorted : sorted.slice(0, maxRows);

  const handleSort = (field: string) => {
    if (!['spend', 'impressions', 'clicks', 'ctr', 'cpc', 'cpm', 'conversions', 'revenue', 'roas', 'name'].includes(field)) return;
    const f = field as CampaignSortField;
    if (sortField === f) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(f);
      setSortDir('desc');
    }
  };

  const formatCell = (key: string, campaign: CockpitCampaign) => {
    switch (key) {
      case 'name':
        return (
          <div className="min-w-[200px]">
            <p className="text-sm font-medium text-white truncate max-w-[250px]">{campaign.name}</p>
            <p className="text-xs text-gray-500">{campaign.objective} • {campaign.platform}</p>
          </div>
        );
      case 'status':
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_COLORS[campaign.status] || STATUS_COLORS.ARCHIVED}`}>
            {campaign.status === 'ACTIVE' ? 'Ativa' : campaign.status === 'PAUSED' ? 'Pausada' : 'Arquivada'}
          </span>
        );
      case 'funnelStage':
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${FUNNEL_COLORS[campaign.funnelStage] || FUNNEL_COLORS.indefinido}`}>
            {campaign.funnelStage}
          </span>
        );
      case 'spend': return <span className="text-white font-medium">{formatCurrency(campaign.spend)}</span>;
      case 'impressions': return <span className="text-gray-400">{formatNumber(campaign.impressions)}</span>;
      case 'clicks': return <span className="text-gray-400">{formatNumber(campaign.clicks)}</span>;
      case 'ctr': return <span className={campaign.ctr >= 1.5 ? 'text-green-400' : 'text-gray-400'}>{formatPercent(campaign.ctr)}</span>;
      case 'cpc': return <span className={campaign.cpc <= 2 ? 'text-green-400' : 'text-yellow-400'}>{formatCurrency(campaign.cpc)}</span>;
      case 'cpm': return <span className="text-gray-400">{formatCurrency(campaign.cpm)}</span>;
      case 'conversions': return <span className="text-[#D4AF37] font-semibold">{campaign.conversions}</span>;
      case 'revenue': return <span className="text-white font-medium">{formatCurrency(campaign.revenue)}</span>;
      case 'roas':
        return (
          <span className={`font-bold ${campaign.roas >= 3 ? 'text-green-400' : campaign.roas >= 1 ? 'text-[#D4AF37]' : 'text-red-400'}`}>
            {formatRoas(campaign.roas)}
          </span>
        );
      default: return null;
    }
  };

  return (
    <div className="rounded-xl border border-[#D4AF37]/20 bg-[#0a0a0a] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="border-b border-[#D4AF37]/10 bg-[#151515]">
            <tr>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className={`px-3 py-3 text-xs font-semibold text-[#D4AF37] whitespace-nowrap ${col.align === 'right' ? 'text-right' : 'text-left'} ${col.sortable ? 'cursor-pointer hover:text-white transition-colors' : ''}`}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {col.sortable && sortField === col.key && (
                      sortDir === 'desc' ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />
                    )}
                    {col.sortable && sortField !== col.key && <ArrowUpDown className="h-3 w-3 opacity-30" />}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {displayed.length === 0 ? (
              <tr>
                <td colSpan={COLUMNS.length} className="px-4 py-12 text-center text-gray-500">
                  Nenhuma campanha encontrada
                </td>
              </tr>
            ) : (
              displayed.map(campaign => (
                <tr
                  key={campaign.id}
                  className="hover:bg-[#151515] transition-colors cursor-pointer"
                  onClick={() => onCampaignClick?.(campaign)}
                >
                  {COLUMNS.map(col => (
                    <td key={col.key} className={`px-3 py-3 text-sm ${col.align === 'right' ? 'text-right' : 'text-left'}`}>
                      {formatCell(col.key, campaign)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {maxRows && sorted.length > maxRows && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="w-full border-t border-white/5 px-4 py-3 text-sm text-[#D4AF37] hover:bg-[#151515] transition-colors flex items-center justify-center gap-2"
        >
          {expanded ? (
            <><ChevronUp className="h-4 w-4" /> Mostrar menos</>
          ) : (
            <><ChevronDown className="h-4 w-4" /> Ver todas ({sorted.length} campanhas)</>
          )}
        </button>
      )}
    </div>
  );
}
