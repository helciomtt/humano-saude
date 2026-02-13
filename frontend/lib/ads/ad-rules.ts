// =====================================================
// AD RULES — Regras Automáticas na Meta API
// Cria regras diretamente no Ad Rules Library da conta
// =====================================================

import { getMetaConfig } from './meta-client';

const META_API_VERSION = 'v21.0';
const META_API_BASE = `https://graph.facebook.com/${META_API_VERSION}`;

// =====================================================
// TIPOS
// =====================================================

interface AdRuleParams {
  name: string;
  evaluation_spec: {
    evaluation_type: string;
    filters: Array<{
      field: string;
      value: string | number;
      operator: string;
    }>;
    trigger: {
      type: string;
      field?: string;
      value?: number;
      operator?: string;
    };
  };
  execution_spec: {
    execution_type: string;
    execution_options?: Array<{
      field: string;
      value: number;
      operator: string;
    }>;
  };
  schedule_spec?: {
    schedule_type: string;
  };
}

// =====================================================
// CRUD DE REGRAS
// =====================================================

export async function createAdRule(
  accountId: string,
  params: AdRuleParams,
  accessToken: string
): Promise<{ id: string }> {
  const response = await fetch(`${META_API_BASE}/act_${accountId}/adrules_library`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...params,
      access_token: accessToken,
    }),
  });

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || `Erro ao criar regra: ${response.status}`);
  }

  return { id: data.id };
}

export async function listAdRules(
  accountId: string,
  accessToken: string
): Promise<Array<{ id: string; name: string; status: string }>> {
  const response = await fetch(
    `${META_API_BASE}/act_${accountId}/adrules_library?fields=id,name,status&access_token=${accessToken}`
  );

  const data = await response.json();
  if (!response.ok || data.error) {
    throw new Error(data.error?.message || 'Erro ao listar regras');
  }

  return data.data || [];
}

export async function deleteAdRule(
  ruleId: string,
  accessToken: string
): Promise<void> {
  const response = await fetch(`${META_API_BASE}/${ruleId}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error?.message || 'Erro ao deletar regra');
  }
}

// =====================================================
// REGRAS PADRÃO HSA
// =====================================================

export async function createDefaultRules(
  accountId?: string,
  accessToken?: string
): Promise<{ created: string[]; errors: string[] }> {
  const config = getMetaConfig();
  const acctId = accountId || config.adAccountId;
  const token = accessToken || config.accessToken;

  const created: string[] = [];
  const errors: string[] = [];

  const rules: Array<{ name: string; params: AdRuleParams }> = [
    {
      name: 'HSA - Pausar CPA Alto',
      params: {
        name: '[HSA] Pausar se CPA > R$100 (7d)',
        evaluation_spec: {
          evaluation_type: 'SCHEDULE',
          filters: [
            { field: 'entity_type', value: 'AD', operator: 'EQUAL' },
            { field: 'time_preset', value: 'LAST_7_DAYS', operator: 'EQUAL' },
          ],
          trigger: {
            type: 'STATS_CHANGE',
            field: 'cost_per_action_type:offsite_conversion.fb_pixel_lead',
            value: 10000, // R$100 em centavos
            operator: 'GREATER_THAN',
          },
        },
        execution_spec: {
          execution_type: 'PAUSE',
        },
        schedule_spec: {
          schedule_type: 'DAILY',
        },
      },
    },
    {
      name: 'HSA - Pausar ROAS Baixo',
      params: {
        name: '[HSA] Pausar se ROAS < 1.0 (7d, spend > R$30)',
        evaluation_spec: {
          evaluation_type: 'SCHEDULE',
          filters: [
            { field: 'entity_type', value: 'AD', operator: 'EQUAL' },
            { field: 'time_preset', value: 'LAST_7_DAYS', operator: 'EQUAL' },
            { field: 'spent', value: 3000, operator: 'GREATER_THAN' },
          ],
          trigger: {
            type: 'STATS_CHANGE',
            field: 'purchase_roas:offsite_conversion.fb_pixel_purchase',
            value: 1,
            operator: 'LESS_THAN',
          },
        },
        execution_spec: {
          execution_type: 'PAUSE',
        },
        schedule_spec: {
          schedule_type: 'DAILY',
        },
      },
    },
    {
      name: 'HSA - Sem Conversão',
      params: {
        name: '[HSA] Pausar se R$50 gastos sem conversão (7d)',
        evaluation_spec: {
          evaluation_type: 'SCHEDULE',
          filters: [
            { field: 'entity_type', value: 'AD', operator: 'EQUAL' },
            { field: 'time_preset', value: 'LAST_7_DAYS', operator: 'EQUAL' },
            { field: 'spent', value: 5000, operator: 'GREATER_THAN' },
          ],
          trigger: {
            type: 'STATS_CHANGE',
            field: 'actions:offsite_conversion.fb_pixel_lead',
            value: 0,
            operator: 'EQUAL',
          },
        },
        execution_spec: {
          execution_type: 'PAUSE',
        },
        schedule_spec: {
          schedule_type: 'DAILY',
        },
      },
    },
  ];

  for (const rule of rules) {
    try {
      const result = await createAdRule(acctId, rule.params, token);
      created.push(`${rule.name} (${result.id})`);
    } catch (error) {
      errors.push(`${rule.name}: ${error instanceof Error ? error.message : 'erro'}`);
    }
  }

  return { created, errors };
}
