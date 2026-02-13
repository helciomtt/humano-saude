'use client';

import { useCallback } from 'react';
import { Building2 } from 'lucide-react';
import { PageHeader } from '../../components';
import { CompaniesTable } from '../components';
import { useCompaniesList } from '../hooks/useCrm';
import { createCompany, deleteCompany } from '@/app/actions/crm';
import { toast } from 'sonner';
import type { CrmCompanyFilters } from '@/lib/types/crm';

export default function CompaniesPage() {
  const companies = useCompaniesList();

  const handleNewCompany = useCallback(async () => {
    const res = await createCompany({
      nome: 'Nova Empresa',
      cnpj: null,
      razao_social: null,
      dominio: null,
      setor: null,
      porte: null,
      qtd_funcionarios: null,
      faturamento_anual: null,
      telefone: null,
      email: null,
      endereco: {},
      logo_url: null,
      tags: [],
      custom_fields: {},
      owner_corretor_id: null,
    });
    if (res.success) {
      toast.success('Empresa criada!');
      companies.refetch();
    } else {
      toast.error(res.error ?? 'Erro ao criar empresa');
    }
  }, [companies]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Remover esta empresa?')) return;
    const res = await deleteCompany(id);
    if (res.success) {
      toast.success('Empresa removida');
      companies.refetch();
    } else {
      toast.error(res.error ?? 'Erro ao remover');
    }
  }, [companies]);

  const handleFilterChange = useCallback((partial: Partial<CrmCompanyFilters>) => {
    for (const [key, value] of Object.entries(partial)) {
      companies.updateFilter(key as keyof CrmCompanyFilters, value);
    }
  }, [companies]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Empresas"
        description="Gestão de empresas e contas corporativas"
        actionLabel="Nova Empresa"
        actionIcon={Building2}
        onAction={handleNewCompany}
      />

      {companies.result && (
        <CompaniesTable
          companies={companies.result.data}
          loading={companies.loading}
          total={companies.result.total}
          page={companies.result.page}
          perPage={companies.result.perPage}
          filters={companies.filters}
          onFilterChange={handleFilterChange}
          onPageChange={(p) => companies.updateFilter('page', p)}
          onRowClick={() => {}}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
