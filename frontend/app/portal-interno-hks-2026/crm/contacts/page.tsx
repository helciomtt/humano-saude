'use client';

import { useCallback } from 'react';
import { UserPlus } from 'lucide-react';
import { PageHeader } from '../../components';
import { ContactsTable } from '../components';
import { useContactsList } from '../hooks/useCrm';
import { createContact, deleteContact } from '@/app/actions/crm';
import { toast } from 'sonner';
import type { CrmContactFilters } from '@/lib/types/crm';

export default function ContactsPage() {
  const contacts = useContactsList();

  const handleNewContact = useCallback(async () => {
    const res = await createContact({
      company_id: null,
      lead_id: null,
      owner_corretor_id: null,
      nome: 'Novo Contato',
      sobrenome: null,
      email: null,
      telefone: null,
      whatsapp: null,
      cpf: null,
      data_nascimento: null,
      cargo: null,
      lifecycle_stage: 'lead',
      lead_source: null,
      score: 0,
      score_motivo: null,
      ultimo_contato: null,
      total_atividades: 0,
      avatar_url: null,
      tags: [],
      custom_fields: {},
    });
    if (res.success) {
      toast.success('Contato criado!');
      contacts.refetch();
    } else {
      toast.error(res.error ?? 'Erro ao criar contato');
    }
  }, [contacts]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Remover este contato?')) return;
    const res = await deleteContact(id);
    if (res.success) {
      toast.success('Contato removido');
      contacts.refetch();
    } else {
      toast.error(res.error ?? 'Erro ao remover');
    }
  }, [contacts]);

  const handleFilterChange = useCallback((partial: Partial<CrmContactFilters>) => {
    for (const [key, value] of Object.entries(partial)) {
      contacts.updateFilter(key as keyof CrmContactFilters, value);
    }
  }, [contacts]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contatos"
        description="Gestão completa de contatos do CRM"
        actionLabel="Novo Contato"
        actionIcon={UserPlus}
        onAction={handleNewContact}
      />

      {contacts.result && (
        <ContactsTable
          contacts={contacts.result.data}
          loading={contacts.loading}
          total={contacts.result.total}
          page={contacts.result.page}
          perPage={contacts.result.perPage}
          filters={contacts.filters}
          onFilterChange={handleFilterChange}
          onPageChange={(p) => contacts.updateFilter('page', p)}
          onRowClick={() => {}}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
