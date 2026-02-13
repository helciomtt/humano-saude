'use client';

import { useState, useEffect, useMemo } from 'react';
import { Receipt, Send, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { getCotacoes, getCotacaoStats } from '@/app/actions/cotacoes';
import type { CotacaoStatus } from '@/lib/types/database';
import { COTACAO_STATUS } from '@/lib/types/database';
import {
  PageHeader,
  StatsCard,
  StatsGrid,
  StatusBadge,
  FilterSelect,
  DataTable,
  PageLoading,
} from '../components';
import type { Column } from '../components';

const statusConfig: Record<CotacaoStatus, { label: string; color: string }> = {
  pendente: { label: 'Pendente', color: 'bg-yellow-500/20 text-yellow-400' },
  enviada: { label: 'Enviada', color: 'bg-blue-500/20 text-blue-400' },
  aceita: { label: 'Aceita', color: 'bg-green-500/20 text-green-400' },
  recusada: { label: 'Recusada', color: 'bg-red-500/20 text-red-400' },
  expirada: { label: 'Expirada', color: 'bg-gray-500/20 text-gray-400' },
};

const columns: Column<any>[] = [
  {
    key: 'numero_cotacao',
    header: 'Nº Cotação',
    sortable: true,
    render: (c) => <span className="font-mono text-[#D4AF37]">{c.numero_cotacao || '—'}</span>,
  },
  {
    key: 'nome_cliente',
    header: 'Cliente',
    sortable: true,
    render: (c) => (
      <div>
        <p className="font-medium text-white">{c.nome_cliente}</p>
        <p className="text-xs text-gray-500">{c.telefone_cliente}</p>
      </div>
    ),
  },
  {
    key: 'valor_total',
    header: 'Valor Total',
    hidden: 'md',
    sortable: true,
    render: (c) => (
      <span className="text-white">
        R$ {c.valor_total?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
      </span>
    ),
  },
  {
    key: 'economia_estimada',
    header: 'Economia',
    hidden: 'lg',
    sortable: true,
    render: (c) => (
      <span className="text-green-400">
        {c.economia_estimada
          ? `R$ ${c.economia_estimada.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
          : '—'}
      </span>
    ),
  },
  {
    key: 'status',
    header: 'Status',
    render: (c) => {
      const cfg = statusConfig[c.status as CotacaoStatus] || statusConfig.pendente;
      return <StatusBadge label={cfg.label} color={cfg.color} />;
    },
  },
  {
    key: 'created_at',
    header: 'Data',
    hidden: 'lg',
    sortable: true,
    render: (c) => (
      <span className="text-gray-500">
        {c.created_at ? new Date(c.created_at).toLocaleDateString('pt-BR') : '—'}
      </span>
    ),
  },
];

export default function CotacoesPage() {
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');

  async function loadData() {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      getCotacoes({ status: (filterStatus || undefined) as CotacaoStatus | undefined, limit: 100 }),
      getCotacaoStats(),
    ]);
    if (cRes.success) setCotacoes(cRes.data);
    if (sRes.success) setStats(sRes.data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, [filterStatus]);

  const statusOptions = COTACAO_STATUS.map((s) => ({
    value: s,
    label: statusConfig[s].label,
  }));

  if (loading && cotacoes.length === 0) return <PageLoading text="Carregando cotações..." />;

  return (
    <div className="space-y-6">
      <PageHeader title="COTAÇÕES" description="Gestão de cotações de planos de saúde" />

      {stats && (
        <StatsGrid cols={5}>
          <StatsCard label="Total" value={stats.total} icon={Receipt} />
          <StatsCard label="Pendentes" value={stats.pendentes} icon={Clock} color="text-yellow-400" />
          <StatsCard label="Enviadas" value={stats.enviadas} icon={Send} color="text-blue-400" />
          <StatsCard label="Aceitas" value={stats.aceitas} icon={CheckCircle} color="text-green-400" />
          <StatsCard label="Taxa Conversão" value={`${stats.taxa_conversao}%`} icon={Eye} color="text-cyan-400" />
        </StatsGrid>
      )}

      <div className="flex items-center gap-4">
        <FilterSelect
          value={filterStatus}
          onChange={setFilterStatus}
          options={statusOptions}
          placeholder="Todos os status"
        />
      </div>

      <DataTable
        data={cotacoes}
        columns={columns}
        loading={loading}
        rowKey={(row) => row.id}
        emptyIcon={Receipt}
        emptyTitle="Nenhuma cotação encontrada"
      />
    </div>
  );
}
