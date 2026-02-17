import type { PDFExtraido } from '@/app/services/api';

interface ExtractionQuickSummary {
  entityLabel: string;
  entityValue: string;
  peopleLabel: string;
  peopleValue: string;
  ageLabel: string;
  ageValue: string;
  documentValue: string;
  confidenceValue: string;
}

function formatCpf(cpf?: string | null): string {
  if (!cpf) return '';
  const digits = cpf.replace(/\D/g, '').slice(0, 11);
  if (digits.length !== 11) return '';
  return digits
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3}\.\d{3}\.\d{3})(\d)/, '$1-$2');
}

function formatCnpj(cnpj?: string | null): string {
  if (!cnpj) return '';
  const digits = cnpj.replace(/\D/g, '').slice(0, 14);
  if (digits.length !== 14) return '';
  return digits
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

function firstNonEmpty(values: Array<string | null | undefined>): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }
  return '—';
}

export function getExtractionQuickSummary(extraction: PDFExtraido | null): ExtractionQuickSummary {
  if (!extraction) {
    return {
      entityLabel: 'Operadora/Empresa',
      entityValue: '—',
      peopleLabel: 'Beneficiários/Sócios',
      peopleValue: '—',
      ageLabel: 'Idades/Data nascimento',
      ageValue: '—',
      documentValue: '—',
      confidenceValue: '—',
    };
  }

  const formattedCnpj = formatCnpj(extraction.cnpj);
  const formattedCpf = formatCpf(extraction.cpf);
  const socios = extraction.socios_detectados?.filter(Boolean) || [];
  const beneficiaries = extraction.nome_beneficiarios?.filter(Boolean) || [];

  const entityValue = firstNonEmpty([
    extraction.operadora || null,
    extraction.razao_social || null,
    extraction.nome_completo || null,
    formattedCnpj,
    formattedCpf,
  ]);

  const peopleValue = beneficiaries.length
    ? beneficiaries.join(', ')
    : socios.length
      ? socios.join(', ')
      : extraction.nome_completo?.trim() || '—';

  const ageValue = extraction.idades?.length
    ? extraction.idades.join(', ')
    : extraction.data_nascimento?.trim() || '—';

  const documentValue = firstNonEmpty([
    formattedCnpj ? `CNPJ ${formattedCnpj}` : null,
    formattedCpf ? `CPF ${formattedCpf}` : null,
    extraction.rg ? `RG ${extraction.rg}` : null,
  ]);

  return {
    entityLabel: extraction.operadora ? 'Operadora' : extraction.razao_social ? 'Empresa' : 'Identificação',
    entityValue,
    peopleLabel: beneficiaries.length ? 'Beneficiários' : socios.length ? 'Sócios' : 'Nome identificado',
    peopleValue,
    ageLabel: extraction.idades?.length ? 'Idades' : extraction.data_nascimento ? 'Data nascimento' : 'Idades',
    ageValue,
    documentValue,
    confidenceValue: extraction.confianca || '—',
  };
}
