'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
} from 'lucide-react';
import { toast } from 'sonner';
import { apiService, type DocumentoExtractionContext, type PDFExtraido } from '@/app/services/api';
import { saveScannedLead } from '@/app/actions/leads';
import { getCorretoresList } from '@/app/actions/crm';

type ProposalCategory = '' | 'adesao' | 'pessoa_fisica' | 'pessoa_juridica';
type CompanyDataMode = '' | 'scanner' | 'manual';
type CivilStatus = 'solteiro' | 'casado' | 'uniao_estavel' | 'divorciado' | 'viuvo';
type MarriageProofMode = 'certidao' | 'declaracao';
type BeneficiaryRole = 'titular' | 'socio' | 'funcionario' | 'dependente';

type CompanyDocumentType =
  | 'contrato_social'
  | 'cartao_cnpj'
  | 'comprovante_endereco_empresa'
  | 'alteracao_contratual'
  | 'identidade_cpf_socios'
  | 'relacao_funcionarios';

type AdesaoDocumentType =
  | 'documento_elegibilidade'
  | 'formulario_associacao';

type BeneficiaryDocumentType =
  | 'identidade_cpf'
  | 'comprovante_residencia'
  | 'carteirinha_plano_atual'
  | 'carta_permanencia'
  | 'certidao_casamento'
  | 'declaracao_uniao_estavel'
  | 'certidao_nascimento';

type UploadTarget =
  | { scope: 'empresa'; docType: CompanyDocumentType; partnerId?: string }
  | { scope: 'adesao'; docType: AdesaoDocumentType }
  | { scope: 'beneficiario'; beneficiaryId: string; docType: BeneficiaryDocumentType };

interface ScannerDocumentosProps {
  onDadosExtraidos?: (dados: PDFExtraido) => void;
  corretorId?: string;
  registrarFilaProposta?: boolean;
  permitirLeadExistente?: boolean;
  onPropostaSalva?: () => void | Promise<void>;
}

interface CorretorAssignableOption {
  id: string;
  nome: string;
  foto_url: string | null;
}

interface UploadedDocument {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  uploadedAt: string;
  extracted: PDFExtraido;
  requirementLabel: string;
  previewUrl?: string | null;
  linkedEntityId?: string | null;
}

interface CompanyPartnerProfile {
  id: string;
  nome: string;
}

interface CompanyPartnerDocStatus {
  partner: CompanyPartnerProfile;
  done: boolean;
  filesCount: number;
}

interface BeneficiaryForm {
  id: string;
  role: BeneficiaryRole;
  nome: string;
  idade: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  estadoCivil: CivilStatus;
  comprovacaoConjugal: MarriageProofMode;
  documentos: Partial<Record<BeneficiaryDocumentType, UploadedDocument[]>>;
}

interface RequirementStatus {
  id: string;
  label: string;
  required: boolean;
  done: boolean;
  helper?: string;
}

interface StepDefinition {
  id: 'modalidade' | 'estrutura' | 'empresa' | 'beneficiarios' | 'resumo';
  label: string;
}

const CATEGORY_LABELS: Record<Exclude<ProposalCategory, ''>, string> = {
  adesao: 'Adesão',
  pessoa_fisica: 'Pessoa Física',
  pessoa_juridica: 'Pessoa Jurídica',
};

const CIVIL_STATUS_OPTIONS: Array<{ value: CivilStatus; label: string }> = [
  { value: 'solteiro', label: 'Solteiro(a)' },
  { value: 'casado', label: 'Casado(a)' },
  { value: 'uniao_estavel', label: 'União estável' },
  { value: 'divorciado', label: 'Divorciado(a)' },
  { value: 'viuvo', label: 'Viúvo(a)' },
];

const COMPANY_DOC_LABELS: Record<CompanyDocumentType, string> = {
  contrato_social: 'Contrato social',
  cartao_cnpj: 'Cartão CNPJ',
  comprovante_endereco_empresa: 'Comprovante de endereço da empresa',
  alteracao_contratual: 'Alteração contratual',
  identidade_cpf_socios: 'Identidade e CPF dos sócios',
  relacao_funcionarios: 'GFIP ou relação de funcionários',
};

const BENEFICIARY_DOC_LABELS: Record<BeneficiaryDocumentType, string> = {
  identidade_cpf: 'Identidade e CPF',
  comprovante_residencia: 'Comprovante de residência',
  carteirinha_plano_atual: 'Carteirinha do plano atual',
  carta_permanencia: 'Carta de permanência',
  certidao_casamento: 'Certidão de casamento',
  declaracao_uniao_estavel: 'Declaração marital/união estável',
  certidao_nascimento: 'Certidão de nascimento',
};

const ADESAO_DOC_LABELS: Record<AdesaoDocumentType, string> = {
  documento_elegibilidade: 'Documento de elegibilidade',
  formulario_associacao: 'Formulário de associação',
};

function getBeneficiaryDocTypeFromLabel(label: string): BeneficiaryDocumentType | null {
  const docType = (Object.keys(BENEFICIARY_DOC_LABELS) as BeneficiaryDocumentType[]).find(
    (value) => BENEFICIARY_DOC_LABELS[value] === label,
  );

  return docType || null;
}

const ALLOWED_DOCUMENT_EXTENSIONS = [
  '.pdf',
  '.png',
  '.jpg',
  '.jpeg',
  '.webp',
  '.bmp',
  '.tif',
  '.tiff',
  '.docx',
  '.txt',
  '.csv',
  '.json',
  '.xml',
  '.html',
  '.htm',
  '.md',
] as const;

const ALLOWED_DOCUMENT_EXTENSIONS_SET = new Set<string>(ALLOWED_DOCUMENT_EXTENSIONS);
const FILE_INPUT_ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS.join(',');

const BASE_STEPS: StepDefinition[] = [
  { id: 'modalidade', label: 'Modalidade' },
  { id: 'estrutura', label: 'Estrutura' },
  { id: 'beneficiarios', label: 'Beneficiários' },
  { id: 'resumo', label: 'Resumo' },
];

const DARK_SELECT_TRIGGER =
  'w-full border-white/20 bg-black/40 text-white data-[placeholder]:text-white/45 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/30';
const DARK_SELECT_CONTENT = 'border-white/20 bg-[#0a0a0a] text-white';
const DARK_SELECT_ITEM = 'text-white focus:bg-white/10 focus:text-white';
const DARK_INPUT =
  'border-white/20 bg-black/40 text-white placeholder:text-white/45 focus-visible:border-[#D4AF37] focus-visible:ring-[#D4AF37]/30';
const DARK_OUTLINE_BUTTON =
  'border-white/20 bg-black/30 text-white hover:bg-black/50 hover:text-white focus-visible:text-white';
const CHECKLIST_BADGE_DONE = 'border-green-400/35 bg-green-500/25 text-green-100';
const CHECKLIST_BADGE_PENDING = 'border-yellow-400/35 bg-yellow-500/25 text-yellow-100';
const CHECKLIST_BADGE_OPTIONAL = 'border-white/45 bg-white/10 text-white';

function getChecklistBadgeVariant(done: boolean, required: boolean): 'success' | 'warning' | 'outline' {
  if (done) return 'success';
  if (required) return 'warning';
  return 'outline';
}

function getChecklistBadgeClass(done: boolean, required: boolean): string {
  if (done) return CHECKLIST_BADGE_DONE;
  if (required) return CHECKLIST_BADGE_PENDING;
  return CHECKLIST_BADGE_OPTIONAL;
}

function isSameUploadTarget(a: UploadTarget | null, b: UploadTarget): boolean {
  if (!a || a.scope !== b.scope) return false;

  if (a.scope === 'empresa' && b.scope === 'empresa') {
    return a.docType === b.docType && (a.partnerId || null) === (b.partnerId || null);
  }

  if (a.scope === 'adesao' && b.scope === 'adesao') {
    return a.docType === b.docType;
  }

  if (a.scope === 'beneficiario' && b.scope === 'beneficiario') {
    return a.beneficiaryId === b.beneficiaryId && a.docType === b.docType;
  }

  return false;
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function uniqueNumbers(values: number[]): number[] {
  return Array.from(new Set(values.filter((value) => Number.isFinite(value))));
}

function toConfidenceNumber(value: string): number {
  const sanitized = value.replace('%', '').replace(',', '.').trim();
  const parsed = Number(sanitized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatRole(role: BeneficiaryRole): string {
  if (role === 'titular') return 'Titular';
  if (role === 'socio') return 'Sócio';
  if (role === 'funcionario') return 'Funcionário';
  return 'Dependente';
}

function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const precision = unitIndex === 0 ? 0 : 1;
  return `${size.toFixed(precision)} ${units[unitIndex]}`;
}

function getDocumentExtension(fileName: string): string {
  const extension = fileName.split('.').pop();
  return extension ? extension.toLowerCase() : '';
}

function isPreviewableDocument(document: UploadedDocument): boolean {
  const fileType = document.fileType?.toLowerCase() || '';
  if (fileType.startsWith('image/')) return true;
  if (fileType.startsWith('text/')) return true;
  if (fileType === 'application/pdf') return true;

  const extension = getDocumentExtension(document.fileName);
  return ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'bmp', 'tif', 'tiff', 'txt', 'md', 'csv', 'json', 'xml', 'html', 'htm'].includes(extension);
}

function normalizePhone(value: string): string {
  return value.replace(/\D/g, '');
}

function formatPhoneInput(value: string): string {
  const digits = normalizePhone(value).slice(0, 11);

  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function normalizeEmailInput(value: string): string {
  return value.trim().toLowerCase();
}

function formatCpfInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatRgInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, 14);
}

function formatDateInput(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function inferAgeFromBirthDate(dateValue: string): string {
  const parts = dateValue.split('/');
  if (parts.length !== 3) return '';
  const day = Number.parseInt(parts[0], 10);
  const month = Number.parseInt(parts[1], 10);
  const year = Number.parseInt(parts[2], 10);
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return '';
  if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) return '';

  const birthDate = new Date(year, month - 1, day);
  if (Number.isNaN(birthDate.getTime())) return '';

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const hasNotHadBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate());
  if (hasNotHadBirthday) age -= 1;

  if (!Number.isFinite(age) || age < 0 || age > 120) return '';
  return String(age);
}

function normalizeCivilStatusFromExtraction(value?: string | null): CivilStatus | null {
  if (!value) return null;
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('solteir')) return 'solteiro';
  if (normalized.includes('casad')) return 'casado';
  if (normalized.includes('uniao')) return 'uniao_estavel';
  if (normalized.includes('divorc')) return 'divorciado';
  if (normalized.includes('viuv')) return 'viuvo';
  return null;
}

function hasUploadedDocs(value?: UploadedDocument[]): boolean {
  return Boolean(value && value.length > 0);
}

function createCompanyPartner(index: number, name?: string): CompanyPartnerProfile {
  return {
    id: `company-partner-${Date.now()}-${index}-${Math.random().toString(16).slice(2, 8)}`,
    nome: name?.trim() || `Sócio ${index + 1}`,
  };
}

function getExtractedCompanyPartners(extracted: PDFExtraido): string[] {
  const extractedWithPartners = extracted as PDFExtraido & {
    socios_detectados?: string[];
  };

  const explicitPartners = Array.isArray(extractedWithPartners.socios_detectados)
    ? extractedWithPartners.socios_detectados
    : [];

  return uniqueStrings([...explicitPartners, ...extracted.nome_beneficiarios]);
}

function getExtractedCompanyPartnersTotal(extracted: PDFExtraido, names: string[]): number {
  const extractedWithPartners = extracted as PDFExtraido & {
    total_socios?: number | null;
  };

  const explicitTotal = extractedWithPartners.total_socios;
  if (typeof explicitTotal === 'number' && Number.isFinite(explicitTotal) && explicitTotal > 0) {
    return Math.trunc(explicitTotal);
  }

  return names.length;
}

function getCompanyPartnerDocStatuses(
  partners: CompanyPartnerProfile[],
  docs: UploadedDocument[],
): CompanyPartnerDocStatus[] {
  if (partners.length === 0) return [];

  const linkedDocsCount = new Map<string, number>();
  let unlinkedDocsCount = 0;

  docs.forEach((document) => {
    const linkedEntityId = document.linkedEntityId;
    if (linkedEntityId) {
      linkedDocsCount.set(linkedEntityId, (linkedDocsCount.get(linkedEntityId) || 0) + 1);
      return;
    }
    unlinkedDocsCount += 1;
  });

  return partners.map((partner) => {
    const directCount = linkedDocsCount.get(partner.id) || 0;
    if (directCount > 0) {
      return { partner, done: true, filesCount: directCount };
    }

    if (unlinkedDocsCount > 0) {
      unlinkedDocsCount -= 1;
      return { partner, done: true, filesCount: 1 };
    }

    return { partner, done: false, filesCount: 0 };
  });
}

function mapDocumentsForPayload<TDocumentType extends string>(
  docsByType: Partial<Record<TDocumentType, UploadedDocument[]>>,
) {
  const entries = Object.entries(docsByType) as Array<[TDocumentType, UploadedDocument[] | undefined]>;

  return entries.flatMap(([docType, docs]) =>
    (docs || []).map((document) => ({
      tipo_documento: docType,
      label: document.requirementLabel,
      arquivo: document.fileName,
      tamanho: document.fileSize,
      processado_em: document.uploadedAt,
      entidade_vinculada_id: document.linkedEntityId || null,
      dados_extraidos: {
        nome_completo: document.extracted.nome_completo || null,
        cpf: document.extracted.cpf || null,
        rg: document.extracted.rg || null,
        cnpj: document.extracted.cnpj || null,
        razao_social: document.extracted.razao_social || null,
        estado_civil: document.extracted.estado_civil || null,
        email: document.extracted.email || null,
        telefone: document.extracted.telefone || null,
        endereco: document.extracted.endereco || null,
        data_nascimento: document.extracted.data_nascimento || null,
        socios_detectados: document.extracted.socios_detectados || [],
        total_socios: document.extracted.total_socios ?? null,
      },
    })),
  );
}

function parsePositiveInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function parseNonNegativeInt(value: string): number {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : -1;
}

function isBeneficiaryMinor(age: string): boolean {
  const parsed = Number.parseInt(age, 10);
  return Number.isFinite(parsed) && parsed < 18;
}

function getCompanyRequirements(params: {
  enabled: boolean;
  hasEmployees: boolean;
  companyDocs: Partial<Record<CompanyDocumentType, UploadedDocument[]>>;
  partnerDocStatuses: CompanyPartnerDocStatus[];
  companyEmail: string;
  companyPhone: string;
}): RequirementStatus[] {
  if (!params.enabled) return [];

  const totalPartners = params.partnerDocStatuses.length;
  const donePartners = params.partnerDocStatuses.filter((status) => status.done).length;
  const hasPartnerIdentityDocs = hasUploadedDocs(params.companyDocs.identidade_cpf_socios);

  const requirements: RequirementStatus[] = [
    {
      id: 'contato_empresa',
      label: 'Telefone e e-mail do titular da empresa',
      required: true,
      done: params.companyEmail.trim().length > 0 && params.companyPhone.trim().length > 0,
    },
    {
      id: 'contrato_social',
      label: 'Contrato social',
      required: true,
      done: hasUploadedDocs(params.companyDocs.contrato_social),
    },
    {
      id: 'cartao_cnpj',
      label: 'Cartão CNPJ',
      required: true,
      done: hasUploadedDocs(params.companyDocs.cartao_cnpj),
    },
    {
      id: 'comprovante_endereco_empresa',
      label: 'Comprovante de endereço da empresa',
      required: true,
      done: hasUploadedDocs(params.companyDocs.comprovante_endereco_empresa),
    },
    {
      id: 'alteracao_contratual',
      label: 'Alteração contratual',
      required: false,
      done: hasUploadedDocs(params.companyDocs.alteracao_contratual),
      helper: 'Obrigatório apenas se houver alteração.',
    },
    {
      id: 'identidade_cpf_socios',
      label: 'Identidade e CPF de todos os sócios',
      required: true,
      done: totalPartners > 0 ? donePartners >= totalPartners : hasPartnerIdentityDocs,
      helper:
        totalPartners > 0
          ? `${donePartners}/${totalPartners} sócio(s) com documento vinculado.`
          : undefined,
    },
    {
      id: 'relacao_funcionarios',
      label: 'GFIP ou relação de funcionários',
      required: params.hasEmployees,
      done: hasUploadedDocs(params.companyDocs.relacao_funcionarios),
      helper: params.hasEmployees
        ? undefined
        : 'Ative "Empresa com funcionários" quando este documento for obrigatório.',
    },
  ];

  return requirements;
}

function getBeneficiaryRequirements(beneficiary: BeneficiaryForm): RequirementStatus[] {
  const isMarried = beneficiary.estadoCivil === 'casado' || beneficiary.estadoCivil === 'uniao_estavel';

  const requirements: RequirementStatus[] = [
    {
      id: `${beneficiary.id}-nome`,
      label: 'Nome completo',
      required: true,
      done: beneficiary.nome.trim().length > 0,
    },
    {
      id: `${beneficiary.id}-idade`,
      label: 'Idade',
      required: true,
      done: parseNonNegativeInt(beneficiary.idade) >= 0,
    },
    {
      id: `${beneficiary.id}-estado-civil`,
      label: 'Estado civil',
      required: true,
      done: Boolean(beneficiary.estadoCivil),
    },
    {
      id: `${beneficiary.id}-identidade`,
      label: 'Identidade e CPF',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.identidade_cpf),
    },
    {
      id: `${beneficiary.id}-residencia`,
      label: 'Comprovante de residência',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.comprovante_residencia),
    },
    {
      id: `${beneficiary.id}-carteirinha`,
      label: 'Carteirinha do plano atual',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.carteirinha_plano_atual),
    },
    {
      id: `${beneficiary.id}-permanencia`,
      label: 'Carta de permanência',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.carta_permanencia),
    },
  ];

  if (isMarried) {
    const requiresMarriageDoc = beneficiary.comprovacaoConjugal === 'certidao'
      ? 'certidao_casamento'
      : 'declaracao_uniao_estavel';

    requirements.push({
      id: `${beneficiary.id}-casamento`,
      label:
        beneficiary.comprovacaoConjugal === 'certidao'
          ? 'Certidão de casamento'
          : 'Declaração marital/união estável',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos[requiresMarriageDoc]),
    });
  }

  if (isBeneficiaryMinor(beneficiary.idade)) {
    requirements.push({
      id: `${beneficiary.id}-nascimento`,
      label: 'Certidão de nascimento',
      required: true,
      done: hasUploadedDocs(beneficiary.documentos.certidao_nascimento),
    });
  }

  return requirements;
}

function getAdesaoRequirements(params: {
  enabled: boolean;
  adesaoDocs: Partial<Record<AdesaoDocumentType, UploadedDocument[]>>;
}): RequirementStatus[] {
  if (!params.enabled) return [];

  return [
    {
      id: 'adesao-elegibilidade',
      label: ADESAO_DOC_LABELS.documento_elegibilidade,
      required: true,
      done: hasUploadedDocs(params.adesaoDocs.documento_elegibilidade),
    },
    {
      id: 'adesao-formulario',
      label: ADESAO_DOC_LABELS.formulario_associacao,
      required: true,
      done: hasUploadedDocs(params.adesaoDocs.formulario_associacao),
    },
  ];
}

function createBeneficiary(role: BeneficiaryRole, index: number, existing?: BeneficiaryForm): BeneficiaryForm {
  if (existing) {
    return {
      ...existing,
      role,
    };
  }

  return {
    id: `benef-${Date.now()}-${index}`,
    role,
    nome: '',
    idade: '',
    cpf: '',
    rg: '',
    dataNascimento: '',
    email: '',
    telefone: '',
    estadoCivil: 'solteiro',
    comprovacaoConjugal: 'certidao',
    documentos: {},
  };
}

export default function ScannerDocumentos({
  onDadosExtraidos,
  corretorId,
  registrarFilaProposta,
  permitirLeadExistente,
  onPropostaSalva,
}: ScannerDocumentosProps) {
  const [category, setCategory] = useState<ProposalCategory>('');
  const [totalLives, setTotalLives] = useState('1');
  const [partnerCount, setPartnerCount] = useState('1');
  const [employeeCount, setEmployeeCount] = useState('0');
  const [hasEmployees, setHasEmployees] = useState(false);
  const [isStructureReady, setIsStructureReady] = useState(false);

  const [primaryEmail, setPrimaryEmail] = useState('');
  const [primaryPhone, setPrimaryPhone] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');
  const [companyPhone, setCompanyPhone] = useState('');
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyLegalName, setCompanyLegalName] = useState('');
  const [companyEmailTouched, setCompanyEmailTouched] = useState(false);
  const [companyPhoneTouched, setCompanyPhoneTouched] = useState(false);
  const [companyPartners, setCompanyPartners] = useState<CompanyPartnerProfile[]>([]);

  const [beneficiaries, setBeneficiaries] = useState<BeneficiaryForm[]>([]);
  const [companyDocs, setCompanyDocs] = useState<Partial<Record<CompanyDocumentType, UploadedDocument[]>>>({});
  const [adesaoDocs, setAdesaoDocs] = useState<Partial<Record<AdesaoDocumentType, UploadedDocument[]>>>({});
  const [companyDataMode, setCompanyDataMode] = useState<CompanyDataMode>('');

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedAdesaoDocType, setSelectedAdesaoDocType] = useState<AdesaoDocumentType>('documento_elegibilidade');
  const [selectedAdesaoManageDocType, setSelectedAdesaoManageDocType] = useState<AdesaoDocumentType>('documento_elegibilidade');
  const [selectedBeneficiaryId, setSelectedBeneficiaryId] = useState<string>('');
  const [selectedBeneficiaryDocType, setSelectedBeneficiaryDocType] = useState<BeneficiaryDocumentType>('identidade_cpf');
  const [selectedBeneficiaryManageDocType, setSelectedBeneficiaryManageDocType] = useState<BeneficiaryDocumentType>('identidade_cpf');
  const [expandedCompanyDocPanels, setExpandedCompanyDocPanels] = useState<Partial<Record<CompanyDocumentType, boolean>>>({});
  const [previewDialogDocument, setPreviewDialogDocument] = useState<UploadedDocument | null>(null);
  const [corretorOptions, setCorretorOptions] = useState<CorretorAssignableOption[]>([]);
  const [selectedCorretorId, setSelectedCorretorId] = useState('');
  const [loadingCorretorOptions, setLoadingCorretorOptions] = useState(false);

  const [pendingUploadTarget, setPendingUploadTarget] = useState<UploadTarget | null>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<UploadTarget | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingLabel, setProcessingLabel] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadedDocumentsRef = useRef<UploadedDocument[]>([]);

  const visibleSteps = useMemo<StepDefinition[]>(() => {
    if (category === 'pessoa_juridica') {
      return [
        { id: 'modalidade', label: 'Modalidade' },
        { id: 'estrutura', label: 'Estrutura' },
        { id: 'empresa', label: 'Documentos da Empresa' },
        { id: 'beneficiarios', label: 'Beneficiários' },
        { id: 'resumo', label: 'Resumo' },
      ];
    }

    return BASE_STEPS;
  }, [category]);

  useEffect(() => {
    if (currentStepIndex >= visibleSteps.length) {
      setCurrentStepIndex(visibleSteps.length - 1);
    }
  }, [currentStepIndex, visibleSteps.length]);

  useEffect(() => {
    if (!corretorId) return;
    setSelectedCorretorId(corretorId);
  }, [corretorId]);

  useEffect(() => {
    if (corretorId) return;

    let active = true;
    setLoadingCorretorOptions(true);

    void (async () => {
      const result = await getCorretoresList();
      if (!active) return;

      if (result.success && result.data) {
        setCorretorOptions(result.data);
      } else {
        setCorretorOptions([]);
        if (result.error) {
          toast.error('Não foi possível carregar a lista de corretores.', {
            description: result.error,
          });
        }
      }

      setLoadingCorretorOptions(false);
    })();

    return () => {
      active = false;
    };
  }, [corretorId]);

  useEffect(() => {
    if (corretorId || !selectedCorretorId) return;
    const exists = corretorOptions.some((option) => option.id === selectedCorretorId);
    if (!exists) {
      setSelectedCorretorId('');
    }
  }, [corretorId, corretorOptions, selectedCorretorId]);

  useEffect(() => {
    if (category !== 'pessoa_juridica') return;

    if (!companyEmailTouched) {
      setCompanyEmail(primaryEmail);
    }

    if (!companyPhoneTouched) {
      setCompanyPhone(primaryPhone);
    }
  }, [category, primaryEmail, primaryPhone, companyEmailTouched, companyPhoneTouched]);

  useEffect(() => {
    if (category !== 'pessoa_juridica') {
      setCompanyPartners([]);
      return;
    }

    const totalPartners = parsePositiveInt(partnerCount);
    if (totalPartners <= 0) {
      setCompanyPartners([]);
      return;
    }

    setCompanyPartners((prev) =>
      Array.from({ length: totalPartners }, (_, index) => {
        const existing = prev[index];
        if (existing) {
          return {
            ...existing,
            nome: existing.nome.trim() || `Sócio ${index + 1}`,
          };
        }

        return createCompanyPartner(index);
      }),
    );
  }, [category, partnerCount]);

  const companyPartnerDocStatuses = useMemo(
    () => getCompanyPartnerDocStatuses(companyPartners, companyDocs.identidade_cpf_socios || []),
    [companyDocs.identidade_cpf_socios, companyPartners],
  );
  const pendingCompanyPartnerDocStatuses = useMemo(
    () => companyPartnerDocStatuses.filter((status) => !status.done),
    [companyPartnerDocStatuses],
  );

  const companyRequirements = useMemo(
    () =>
      getCompanyRequirements({
        enabled: category === 'pessoa_juridica',
        hasEmployees,
        companyDocs,
        partnerDocStatuses: companyPartnerDocStatuses,
        companyEmail,
        companyPhone,
      }),
    [category, hasEmployees, companyDocs, companyEmail, companyPartnerDocStatuses, companyPhone],
  );

  const adesaoRequirements = useMemo(
    () =>
      getAdesaoRequirements({
        enabled: category === 'adesao',
        adesaoDocs,
      }),
    [adesaoDocs, category],
  );

  const beneficiaryRequirementsMap = useMemo(
    () =>
      new Map(
        beneficiaries.map((beneficiary) => [beneficiary.id, getBeneficiaryRequirements(beneficiary)]),
      ),
    [beneficiaries],
  );

  const allUploadedDocuments = useMemo(() => {
    const companyUploaded = Object.values(companyDocs).flatMap((docs) => docs || []);
    const adesaoUploaded = Object.values(adesaoDocs).flatMap((docs) => docs || []);
    const beneficiaryUploaded = beneficiaries.flatMap((beneficiary) =>
      Object.values(beneficiary.documentos).flatMap((docs) => docs || []),
    );

    return [...companyUploaded, ...adesaoUploaded, ...beneficiaryUploaded];
  }, [adesaoDocs, beneficiaries, companyDocs]);

  const extractedSummary = useMemo(() => {
    const extracted = allUploadedDocuments.map((document) => document.extracted);

    const names = uniqueStrings(extracted.flatMap((item) => item.nome_beneficiarios));
    const ages = uniqueNumbers(extracted.flatMap((item) => item.idades)).sort((a, b) => a - b);

    const operator = extracted.find((item) => item.operadora)?.operadora ?? null;
    const planType = extracted.find((item) => item.tipo_plano)?.tipo_plano ?? null;
    const currentValue = extracted.find((item) => item.valor_atual != null)?.valor_atual ?? null;

    const confidenceValues = extracted
      .map((item) => toConfidenceNumber(item.confianca))
      .filter((value) => value > 0);

    const averageConfidence = confidenceValues.length
      ? confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length
      : null;

    return {
      names,
      ages,
      operator,
      planType,
      currentValue,
      averageConfidence,
      totalDocuments: allUploadedDocuments.length,
      totalCharacters: extracted.reduce((sum, item) => sum + (item.total_caracteres || 0), 0),
    };
  }, [allUploadedDocuments]);

  const resolvedCorretorId = (corretorId || selectedCorretorId || '').trim();
  const assignedCorretorLabel = useMemo(() => {
    if (corretorId) return 'Corretor autenticado';
    if (!selectedCorretorId) return 'Sem responsável';
    return (
      corretorOptions.find((option) => option.id === selectedCorretorId)?.nome ||
      'Responsável selecionado'
    );
  }, [corretorId, corretorOptions, selectedCorretorId]);

  const categoryComplete = category !== '';

  const totalLivesNumber = parsePositiveInt(totalLives);
  const partnerCountNumber = parsePositiveInt(partnerCount);
  const employeeCountNumber =
    category === 'pessoa_juridica' && hasEmployees ? parsePositiveInt(employeeCount) : 0;
  const dependentsCountNumber =
    category === 'pessoa_juridica'
      ? Math.max(totalLivesNumber - partnerCountNumber - employeeCountNumber, 0)
      : Math.max(totalLivesNumber - 1, 0);

  const structureComplete =
    isStructureReady &&
    totalLivesNumber > 0 &&
    beneficiaries.length === totalLivesNumber &&
    normalizePhone(primaryPhone).length >= 10 &&
    primaryEmail.trim().length > 0;

  const companyComplete =
    category !== 'pessoa_juridica' ||
    companyRequirements.filter((item) => item.required && !item.done).length === 0;

  const adesaoComplete =
    category !== 'adesao' ||
    adesaoRequirements.filter((item) => item.required && !item.done).length === 0;

  const beneficiariesComplete =
    beneficiaries.length > 0 &&
    beneficiaries.every((beneficiary) => {
      const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
      return requirements.every((requirement) => !requirement.required || requirement.done);
    });

  const stepCompletion: Record<StepDefinition['id'], boolean> = {
    modalidade: categoryComplete,
    estrutura: structureComplete,
    empresa: companyComplete,
    beneficiarios: beneficiariesComplete && adesaoComplete,
    resumo: categoryComplete && structureComplete && companyComplete && beneficiariesComplete && adesaoComplete,
  };

  const currentStep = visibleSteps[currentStepIndex];

  const selectedBeneficiary = useMemo(
    () => beneficiaries.find((beneficiary) => beneficiary.id === selectedBeneficiaryId) || null,
    [beneficiaries, selectedBeneficiaryId],
  );

  const adesaoPendingUploadOptions = useMemo(
    () =>
      (Object.keys(ADESAO_DOC_LABELS) as AdesaoDocumentType[])
        .filter((docType) => !hasUploadedDocs(adesaoDocs[docType]))
        .map((docType) => ({
          value: docType,
          label: ADESAO_DOC_LABELS[docType],
        })),
    [adesaoDocs],
  );

  const adesaoManageDocOptions = useMemo(
    () =>
      (Object.keys(ADESAO_DOC_LABELS) as AdesaoDocumentType[])
        .filter((docType) => hasUploadedDocs(adesaoDocs[docType]))
        .map((docType) => ({
          value: docType,
          label: ADESAO_DOC_LABELS[docType],
        })),
    [adesaoDocs],
  );

  const selectedAdesaoDocs = useMemo(
    () => adesaoDocs[selectedAdesaoManageDocType] || [],
    [adesaoDocs, selectedAdesaoManageDocType],
  );

  const beneficiaryUploadOptions = useMemo(() => {
    if (!selectedBeneficiary) {
      return [] as Array<{ value: BeneficiaryDocumentType; label: string }>;
    }

    const requirements = beneficiaryRequirementsMap.get(selectedBeneficiary.id) || [];
    const pendingDocTypes = requirements
      .filter((requirement) => requirement.required && !requirement.done)
      .map((requirement) => getBeneficiaryDocTypeFromLabel(requirement.label))
      .filter((docType): docType is BeneficiaryDocumentType => docType != null);

    return Array.from(new Set(pendingDocTypes)).map((docType) => ({
      value: docType,
      label: BENEFICIARY_DOC_LABELS[docType],
    }));
  }, [beneficiaryRequirementsMap, selectedBeneficiary]);

  const beneficiaryManageDocOptions = useMemo(() => {
    if (!selectedBeneficiary) return [] as Array<{ value: BeneficiaryDocumentType; label: string }>;

    return (Object.keys(BENEFICIARY_DOC_LABELS) as BeneficiaryDocumentType[])
      .filter((docType) => hasUploadedDocs(selectedBeneficiary.documentos[docType]))
      .map((docType) => ({
        value: docType,
        label: BENEFICIARY_DOC_LABELS[docType],
      }));
  }, [selectedBeneficiary]);

  const selectedBeneficiaryDocs = useMemo(() => {
    if (!selectedBeneficiary) return [];
    return selectedBeneficiary.documentos[selectedBeneficiaryManageDocType] || [];
  }, [selectedBeneficiary, selectedBeneficiaryManageDocType]);

  const revokeDocumentPreview = useCallback((document: UploadedDocument) => {
    if (!document.previewUrl) return;
    URL.revokeObjectURL(document.previewUrl);
  }, []);

  const revokeDocumentPreviews = useCallback(
    (documents: UploadedDocument[]) => {
      documents.forEach((document) => {
        revokeDocumentPreview(document);
      });
    },
    [revokeDocumentPreview],
  );

  useEffect(() => {
    uploadedDocumentsRef.current = allUploadedDocuments;
  }, [allUploadedDocuments]);

  useEffect(
    () => () => {
      revokeDocumentPreviews(uploadedDocumentsRef.current);
    },
    [revokeDocumentPreviews],
  );

  useEffect(() => {
    if (adesaoPendingUploadOptions.length === 0) return;
    const hasSelected = adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType);
    if (!hasSelected) {
      setSelectedAdesaoDocType(adesaoPendingUploadOptions[0].value);
    }
  }, [adesaoPendingUploadOptions, selectedAdesaoDocType]);

  useEffect(() => {
    if (adesaoManageDocOptions.length === 0) return;
    const hasSelected = adesaoManageDocOptions.some((option) => option.value === selectedAdesaoManageDocType);
    if (!hasSelected) {
      setSelectedAdesaoManageDocType(adesaoManageDocOptions[0].value);
    }
  }, [adesaoManageDocOptions, selectedAdesaoManageDocType]);

  useEffect(() => {
    if (beneficiaryUploadOptions.length === 0) return;
    const hasSelected = beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType);
    if (!hasSelected) {
      setSelectedBeneficiaryDocType(beneficiaryUploadOptions[0].value);
    }
  }, [beneficiaryUploadOptions, selectedBeneficiaryDocType]);

  useEffect(() => {
    if (beneficiaryManageDocOptions.length === 0) return;
    const hasSelected = beneficiaryManageDocOptions.some(
      (option) => option.value === selectedBeneficiaryManageDocType,
    );
    if (!hasSelected) {
      setSelectedBeneficiaryManageDocType(beneficiaryManageDocOptions[0].value);
    }
  }, [beneficiaryManageDocOptions, selectedBeneficiaryManageDocType]);

  const validateFile = (file: File): string | null => {
    const extension = `.${file.name.split('.').pop()?.toLowerCase() || ''}`;
    if (!ALLOWED_DOCUMENT_EXTENSIONS_SET.has(extension)) {
      return 'Formato não suportado. Envie PDF, imagem, DOCX ou arquivo textual.';
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return 'Arquivo muito grande. Limite de 10MB por documento.';
    }

    return null;
  };

  const updateCompanyPartnerName = useCallback((partnerId: string, value: string) => {
    setCompanyPartners((prev) =>
      prev.map((partner) =>
        partner.id === partnerId
          ? {
              ...partner,
              nome: value,
            }
          : partner,
      ),
    );
  }, []);

  const toggleCompanyDocPanel = useCallback((docType: CompanyDocumentType) => {
    setExpandedCompanyDocPanels((prev) => ({
      ...prev,
      [docType]: !(prev[docType] ?? true),
    }));
  }, []);

  const removeCompanyPartner = useCallback(
    (partnerId: string) => {
      const partner = companyPartners.find((item) => item.id === partnerId);
      if (!partner) return;

      const linkedDocs = (companyDocs.identidade_cpf_socios || []).filter(
        (document) => document.linkedEntityId === partnerId,
      );

      if (linkedDocs.length > 0) {
        revokeDocumentPreviews(linkedDocs);
      }

      setCompanyDocs((prev) => ({
        ...prev,
        identidade_cpf_socios: (prev.identidade_cpf_socios || []).filter(
          (document) => document.linkedEntityId !== partnerId,
        ),
      }));

      setCompanyPartners((prev) => prev.filter((item) => item.id !== partnerId));

      toast.success('Sócio removido da lista de validação.', {
        description:
          linkedDocs.length > 0
            ? `${linkedDocs.length} arquivo(s) vinculado(s) também foram removidos.`
            : 'Você pode ajustar os nomes restantes livremente.',
      });
    },
    [companyDocs.identidade_cpf_socios, companyPartners, revokeDocumentPreviews],
  );

  const applyCompanyPartnerHints = useCallback(
    (extracted: PDFExtraido) => {
      if (category !== 'pessoa_juridica') return;

      const inferredNames = getExtractedCompanyPartners(extracted);
      const inferredTotal = getExtractedCompanyPartnersTotal(extracted, inferredNames);

      if (inferredTotal <= 0) return;

      setCompanyPartners((prev) =>
        Array.from({ length: Math.max(prev.length, inferredTotal) }, (_, index) => {
          const existing = prev[index];
          return {
            id: existing?.id || createCompanyPartner(index).id,
            nome: inferredNames[index] || existing?.nome || `Sócio ${index + 1}`,
          };
        }),
      );

      toast.info('Contrato social analisado', {
        description: `${inferredTotal} sócio(s) identificado(s). Revise a lista e remova quem não for sócio.`,
      });
    },
    [category],
  );

  const applyExtractedHints = useCallback(
    (target: UploadTarget, extracted: PDFExtraido) => {
      if (target.scope === 'empresa') {
        const cnpjDigits = extracted.cnpj?.replace(/\D/g, '') || '';

        if (cnpjDigits.length > 0) {
          const formattedCnpj = cnpjDigits
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .slice(0, 18);
          setCompanyCnpj((prev) => (prev.trim().length > 0 ? prev : formattedCnpj));
        }

        if (extracted.razao_social && extracted.razao_social.trim().length > 0) {
          setCompanyLegalName((prev) => (prev.trim().length > 0 ? prev : extracted.razao_social || ''));
        }

        if (extracted.email && !companyEmailTouched) {
          setCompanyEmail((prev) => (prev.trim().length > 0 ? prev : normalizeEmailInput(extracted.email || '')));
        }

        if (extracted.telefone && !companyPhoneTouched) {
          setCompanyPhone((prev) =>
            normalizePhone(prev).length >= 10 ? prev : formatPhoneInput(extracted.telefone || ''),
          );
        }

        const extractedPartnerName = extracted.nome_completo || extracted.nome_beneficiarios[0] || '';
        if (target.docType === 'identidade_cpf_socios' && target.partnerId && extractedPartnerName) {
          setCompanyPartners((prev) =>
            prev.map((partner) =>
              partner.id === target.partnerId
                ? {
                    ...partner,
                    nome: extractedPartnerName || partner.nome,
                  }
                : partner,
            ),
          );
        }

        return;
      }

      if (target.scope !== 'beneficiario') return;

      const normalizedCivilStatus = normalizeCivilStatusFromExtraction(extracted.estado_civil);
      const hintedBirthDate = extracted.data_nascimento ? formatDateInput(extracted.data_nascimento) : '';
      const hintedAgeFromDate = hintedBirthDate ? inferAgeFromBirthDate(hintedBirthDate) : '';

      setBeneficiaries((prev) =>
        prev.map((beneficiary) => {
          if (beneficiary.id !== target.beneficiaryId) return beneficiary;

          const hintedName =
            beneficiary.nome ||
            extracted.nome_completo ||
            extracted.nome_beneficiarios[0] ||
            '';
          const hintedAge =
            beneficiary.idade ||
            hintedAgeFromDate ||
            (extracted.idades[0] != null ? String(extracted.idades[0]) : '');
          const hintedCpf = beneficiary.cpf || formatCpfInput(extracted.cpf || '');
          const hintedRg = beneficiary.rg || formatRgInput(extracted.rg || '');
          const hintedEmail = beneficiary.email || normalizeEmailInput(extracted.email || '');
          const hintedPhone = beneficiary.telefone || formatPhoneInput(extracted.telefone || '');

          return {
            ...beneficiary,
            nome: hintedName,
            idade: hintedAge,
            cpf: hintedCpf,
            rg: hintedRg,
            dataNascimento: beneficiary.dataNascimento || hintedBirthDate,
            email: hintedEmail,
            telefone: hintedPhone,
            estadoCivil: normalizedCivilStatus || beneficiary.estadoCivil,
          };
        }),
      );

      const beneficiary = beneficiaries.find((item) => item.id === target.beneficiaryId);
      if (beneficiary?.role === 'titular') {
        if (extracted.email && primaryEmail.trim().length === 0) {
          setPrimaryEmail(normalizeEmailInput(extracted.email));
        }
        if (extracted.telefone && normalizePhone(primaryPhone).length < 10) {
          setPrimaryPhone(formatPhoneInput(extracted.telefone));
        }
      }
    },
    [beneficiaries, companyEmailTouched, companyPhoneTouched, primaryEmail, primaryPhone],
  );

  const processFilesUpload = useCallback(
    async (files: File[], target: UploadTarget) => {
      const validFiles: File[] = [];
      const validationErrors: string[] = [];

      files.forEach((file) => {
        const validationError = validateFile(file);
        if (validationError) {
          validationErrors.push(`${file.name}: ${validationError}`);
          return;
        }
        validFiles.push(file);
      });

      if (validFiles.length === 0) {
        setActiveUploadTarget(null);
        setError(validationErrors[0] || 'Nenhum arquivo válido foi selecionado.');
        return;
      }

      setError('');
      setActiveUploadTarget(target);
      setIsProcessing(true);
      setProcessingProgress(0);

      const requirementLabel =
        target.scope === 'empresa'
          ? COMPANY_DOC_LABELS[target.docType]
          : target.scope === 'adesao'
            ? ADESAO_DOC_LABELS[target.docType]
            : BENEFICIARY_DOC_LABELS[target.docType];

      const uploadedFiles: string[] = [];
      const failedFiles: string[] = [];

      for (let index = 0; index < validFiles.length; index += 1) {
        const file = validFiles[index];
        const progress = Math.round((index / validFiles.length) * 100);
        setProcessingProgress(progress);
        setProcessingLabel(`${requirementLabel} (${index + 1}/${validFiles.length})`);

        try {
          const beneficiaryContext =
            target.scope === 'beneficiario'
              ? beneficiaries.find((beneficiary) => beneficiary.id === target.beneficiaryId) || null
              : null;
          const extractionContext: DocumentoExtractionContext = {
            scope: target.scope,
            doc_type: target.docType,
            proposal_category: category || undefined,
            beneficiary_id: beneficiaryContext?.id,
            beneficiary_name: beneficiaryContext?.nome || undefined,
            beneficiary_role: beneficiaryContext?.role || undefined,
            partner_id: target.scope === 'empresa' ? target.partnerId || null : null,
          };

          const extracted = await apiService.extrairDocumentoProxy(file, extractionContext);
          const previewUrl = URL.createObjectURL(file);
          const uploaded: UploadedDocument = {
            id: `${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            fileSize: file.size,
            uploadedAt: new Date().toISOString(),
            extracted,
            requirementLabel,
            previewUrl,
            linkedEntityId:
              target.scope === 'empresa' && target.docType === 'identidade_cpf_socios'
                ? target.partnerId || null
                : null,
          };

          if (target.scope === 'empresa') {
            setCompanyDocs((prev) => ({
              ...prev,
              [target.docType]: [...(prev[target.docType] || []), uploaded],
            }));
          } else if (target.scope === 'adesao') {
            setAdesaoDocs((prev) => ({
              ...prev,
              [target.docType]: [...(prev[target.docType] || []), uploaded],
            }));
            setSelectedAdesaoManageDocType(target.docType);
          } else {
            setBeneficiaries((prev) =>
              prev.map((beneficiary) =>
                beneficiary.id === target.beneficiaryId
                  ? {
                      ...beneficiary,
                      documentos: {
                        ...beneficiary.documentos,
                        [target.docType]: [...(beneficiary.documentos[target.docType] || []), uploaded],
                      },
                    }
                  : beneficiary,
              ),
            );
            setSelectedBeneficiaryManageDocType(target.docType);
          }

          if (target.scope === 'empresa' && target.docType === 'contrato_social') {
            applyCompanyPartnerHints(extracted);
          }

          applyExtractedHints(target, extracted);
          onDadosExtraidos?.(extracted);
          uploadedFiles.push(file.name);
        } catch (uploadError: unknown) {
          const message = uploadError instanceof Error ? uploadError.message : 'Erro ao processar documento';
          failedFiles.push(`${file.name} (${message})`);
        }
      }

      setProcessingProgress(100);

      if (uploadedFiles.length > 0) {
        toast.success('Documentos processados com IA', {
          description: `${uploadedFiles.length} arquivo(s) enviados para ${requirementLabel}.`,
        });
      }

      const allErrors = [...validationErrors, ...failedFiles];
      if (allErrors.length > 0) {
        const description = allErrors.slice(0, 2).join(' · ');
        setError(description);
        toast.error('Alguns arquivos não foram processados', {
          description,
        });
      }

      setPendingUploadTarget(null);
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingLabel('');
        setProcessingProgress(0);
        setActiveUploadTarget(null);
      }, 250);
    },
    [applyCompanyPartnerHints, applyExtractedHints, beneficiaries, category, onDadosExtraidos],
  );

  const triggerUpload = (target: UploadTarget) => {
    setPendingUploadTarget(target);
    setActiveUploadTarget(target);
    fileInputRef.current?.click();
  };

  const renderInlineUploadProgress = (target: UploadTarget) => {
    if (!isSameUploadTarget(activeUploadTarget, target) || !isProcessing) {
      return null;
    }

    return (
      <div className="mt-2 space-y-2 rounded-md border border-[#D4AF37]/30 bg-[#D4AF37]/5 p-2">
        <div className="flex items-center justify-between text-[11px] text-white/75">
          <span>Processando: {processingLabel || 'documento'}</span>
          <span>{processingProgress}%</span>
        </div>
        <Progress value={processingProgress} className="h-2" />
      </div>
    );
  };

  const handleFileInput = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    if (files.length === 0 || !pendingUploadTarget) {
      if (files.length === 0) {
        setActiveUploadTarget(null);
      }
      event.target.value = '';
      return;
    }

    await processFilesUpload(files, pendingUploadTarget);
    event.target.value = '';
  };

  const buildBeneficiaryStructure = (): boolean => {
    if (!category) {
      setError('Escolha a modalidade antes de configurar as vidas da proposta.');
      return false;
    }

    const total = parsePositiveInt(totalLives);
    if (total <= 0) {
      setError('Informe um total de vidas válido.');
      return false;
    }

    if (category === 'pessoa_juridica') {
      const socios = parsePositiveInt(partnerCount);
      if (socios <= 0 || socios > total) {
        setError('Quantidade de sócios inválida para o total de vidas informado.');
        return false;
      }

      const funcionarios = hasEmployees ? parsePositiveInt(employeeCount) : 0;
      if (hasEmployees && funcionarios <= 0) {
        setError('Informe a quantidade de funcionários quando a empresa possuir funcionários.');
        return false;
      }

      if (socios + funcionarios > total) {
        setError('A soma de sócios e funcionários não pode ser maior que o total de vidas.');
        return false;
      }

      setBeneficiaries((prev) =>
        Array.from({ length: total }, (_, index) =>
          createBeneficiary(
            index < socios ? 'socio' : index < socios + funcionarios ? 'funcionario' : 'dependente',
            index,
            prev[index],
          ),
        ),
      );
    } else {
      setBeneficiaries((prev) =>
        Array.from({ length: total }, (_, index) =>
          createBeneficiary(index === 0 ? 'titular' : 'dependente', index, prev[index]),
        ),
      );
    }

    setIsStructureReady(true);
    setError('');
    return true;
  };

  useEffect(() => {
    setIsStructureReady(false);
  }, [category, totalLives, partnerCount, hasEmployees, employeeCount]);

  useEffect(() => {
    if (beneficiaries.length > 0 && !selectedBeneficiaryId) {
      setSelectedBeneficiaryId(beneficiaries[0].id);
      return;
    }

    if (selectedBeneficiaryId) {
      const exists = beneficiaries.some((beneficiary) => beneficiary.id === selectedBeneficiaryId);
      if (!exists) {
        setSelectedBeneficiaryId(beneficiaries[0]?.id || '');
      }
    }
  }, [beneficiaries, selectedBeneficiaryId]);

  const updateBeneficiary = <K extends keyof BeneficiaryForm>(
    beneficiaryId: string,
    field: K,
    value: BeneficiaryForm[K],
  ) => {
    setBeneficiaries((prev) =>
      prev.map((beneficiary) => {
        if (beneficiary.id !== beneficiaryId) return beneficiary;

        const next = { ...beneficiary, [field]: value };

        if (field === 'estadoCivil' && value !== 'casado' && value !== 'uniao_estavel') {
          next.comprovacaoConjugal = 'certidao';
          const docs = { ...next.documentos };
          delete docs.certidao_casamento;
          delete docs.declaracao_uniao_estavel;
          next.documentos = docs;
        }

        if (field === 'idade' && !isBeneficiaryMinor(String(value))) {
          const docs = { ...next.documentos };
          delete docs.certidao_nascimento;
          next.documentos = docs;
        }

        return next;
      }),
    );
  };

  const previewUploadedDocument = useCallback((document: UploadedDocument) => {
    if (!document.previewUrl) {
      toast.error('Pré-visualização indisponível para este arquivo.');
      return;
    }
    setPreviewDialogDocument(document);
  }, []);

  const downloadUploadedDocument = useCallback((document: UploadedDocument | null) => {
    if (!document?.previewUrl) {
      toast.error('Download indisponível para este arquivo.');
      return;
    }

    const link = window.document.createElement('a');
    link.href = document.previewUrl;
    link.download = document.fileName;
    link.rel = 'noopener noreferrer';
    link.target = '_blank';
    link.click();
  }, []);

  const removeCompanyUploadedDocument = useCallback(
    (docType: CompanyDocumentType, documentId: string) => {
      const document = (companyDocs[docType] || []).find((item) => item.id === documentId);
      if (!document) return;

      setCompanyDocs((prev) => {
        const nextDocs = (prev[docType] || []).filter((item) => item.id !== documentId);
        return {
          ...prev,
          [docType]: nextDocs,
        };
      });

      revokeDocumentPreview(document);
      toast.success('Documento removido com sucesso.');
    },
    [companyDocs, revokeDocumentPreview],
  );

  const removeAdesaoUploadedDocument = useCallback(
    (docType: AdesaoDocumentType, documentId: string) => {
      const document = (adesaoDocs[docType] || []).find((item) => item.id === documentId);
      if (!document) return;

      setAdesaoDocs((prev) => {
        const nextDocs = (prev[docType] || []).filter((item) => item.id !== documentId);
        return {
          ...prev,
          [docType]: nextDocs,
        };
      });

      revokeDocumentPreview(document);
      toast.success('Documento removido com sucesso.');
    },
    [adesaoDocs, revokeDocumentPreview],
  );

  const removeBeneficiaryUploadedDocument = useCallback(
    (
      beneficiaryId: string,
      docType: BeneficiaryDocumentType,
      documentId: string,
    ) => {
      const beneficiary = beneficiaries.find((item) => item.id === beneficiaryId);
      const document = beneficiary?.documentos[docType]?.find((item) => item.id === documentId);
      if (!document) return;

      setBeneficiaries((prev) =>
        prev.map((item) => {
          if (item.id !== beneficiaryId) return item;

          return {
            ...item,
            documentos: {
              ...item.documentos,
              [docType]: (item.documentos[docType] || []).filter((doc) => doc.id !== documentId),
            },
          };
        }),
      );

      revokeDocumentPreview(document);
      toast.success('Documento removido com sucesso.');
    },
    [beneficiaries, revokeDocumentPreview],
  );

  const goNextStep = () => {
    if (!currentStep) return;

    if (currentStep.id === 'estrutura') {
      const hasPrimaryContact =
        primaryEmail.trim().length > 0 && normalizePhone(primaryPhone).length >= 10;
      if (!hasPrimaryContact) {
        setError('Preencha e-mail e telefone principal antes de avançar.');
        toast.error('Preencha e-mail e telefone principal antes de avançar.');
        return;
      }

      const structureBuilt = buildBeneficiaryStructure();
      if (!structureBuilt) {
        toast.error('Revise os dados da estrutura antes de avançar.');
        return;
      }

      setCurrentStepIndex((prev) => Math.min(prev + 1, visibleSteps.length - 1));
      return;
    }

    const canProceed = stepCompletion[currentStep.id];

    if (!canProceed) {
      toast.error('Complete os requisitos desta etapa antes de avançar.');
      return;
    }

    setCurrentStepIndex((prev) => Math.min(prev + 1, visibleSteps.length - 1));
  };

  const goPreviousStep = () => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  };

  const buildMissingChecklist = () => {
    const missing: string[] = [];

    if (!categoryComplete) {
      missing.push('Selecione a modalidade da proposta.');
    }

    if (!structureComplete) {
      missing.push('Conclua a estrutura da proposta (vidas + contato principal).');
    }

    if (!companyComplete) {
      companyRequirements
        .filter((item) => item.required && !item.done)
        .forEach((item) => {
          missing.push(`Empresa: ${item.label}`);
        });
    }

    if (!adesaoComplete) {
      adesaoRequirements
        .filter((item) => item.required && !item.done)
        .forEach((item) => {
          missing.push(`Adesão: ${item.label}`);
        });
    }

    if (!beneficiariesComplete) {
      beneficiaries.forEach((beneficiary, index) => {
        const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
        requirements
          .filter((item) => item.required && !item.done)
          .forEach((item) => {
            missing.push(`Beneficiário ${index + 1} (${beneficiary.nome || formatRole(beneficiary.role)}): ${item.label}`);
          });
      });
    }

    return missing;
  };

  const resetFlow = () => {
    revokeDocumentPreviews(allUploadedDocuments);
    setCategory('');
    setTotalLives('1');
    setPartnerCount('1');
    setEmployeeCount('0');
    setHasEmployees(false);
    setIsStructureReady(false);
    setPrimaryEmail('');
    setPrimaryPhone('');
    setCompanyEmail('');
    setCompanyPhone('');
    setCompanyCnpj('');
    setCompanyLegalName('');
    setCompanyEmailTouched(false);
    setCompanyPhoneTouched(false);
    setCompanyPartners([]);
    setBeneficiaries([]);
    setCompanyDocs({});
    setAdesaoDocs({});
    setCompanyDataMode('');
    setSelectedAdesaoDocType('documento_elegibilidade');
    setSelectedAdesaoManageDocType('documento_elegibilidade');
    setSelectedBeneficiaryId('');
    setSelectedBeneficiaryDocType('identidade_cpf');
    setSelectedBeneficiaryManageDocType('identidade_cpf');
    setExpandedCompanyDocPanels({});
    setPreviewDialogDocument(null);
    setCurrentStepIndex(0);
    setError('');
    setPendingUploadTarget(null);
  };

  const saveProposal = async () => {
    const missingChecklist = buildMissingChecklist();
    if (missingChecklist.length > 0) {
      toast.error('Existem pendências obrigatórias no checklist.', {
        description: `${missingChecklist.length} pendência(s) encontrada(s).`,
      });
      return;
    }

    const normalizedPhone = normalizePhone(primaryPhone);
    if (!normalizedPhone) {
      toast.error('Telefone principal é obrigatório para salvar a proposta.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const leadName = beneficiaries[0]?.nome || `Proposta ${category ? CATEGORY_LABELS[category] : ''}`;
      const ages = beneficiaries
        .map((beneficiary) => Number.parseInt(beneficiary.idade, 10))
        .filter((value) => Number.isFinite(value));

      const tipoContratacao =
        category === 'pessoa_juridica' ? 'PME' : category === 'adesao' ? 'ADESAO' : 'INDIVIDUAL';

      const companyDocumentsPayload = mapDocumentsForPayload(companyDocs);
      const adesaoDocumentsPayload = mapDocumentsForPayload(adesaoDocs);
      const companyPartnersPayload = companyPartnerDocStatuses.map((status) => ({
        id: status.partner.id,
        nome: status.partner.nome.trim() || null,
        documento_identidade_cpf_anexado: status.done,
        total_arquivos_vinculados: status.filesCount,
      }));

      const beneficiaryPayload = beneficiaries.map((beneficiary) => {
        const documentsPayload = mapDocumentsForPayload(beneficiary.documentos);

        return {
          id: beneficiary.id,
          tipo: beneficiary.role,
          nome: beneficiary.nome,
          idade: Number.parseInt(beneficiary.idade, 10) || null,
          cpf: beneficiary.cpf || null,
          rg: beneficiary.rg || null,
          data_nascimento: beneficiary.dataNascimento || null,
          email: beneficiary.email || null,
          telefone: normalizePhone(beneficiary.telefone) || null,
          estado_civil: beneficiary.estadoCivil,
          comprovacao_conjugal: beneficiary.comprovacaoConjugal,
          documentos: documentsPayload,
        };
      });

      const result = await saveScannedLead({
        nome: leadName,
        whatsapp: normalizedPhone,
        email: primaryEmail || undefined,
        operadora_atual: extractedSummary.operator || undefined,
        valor_atual: extractedSummary.currentValue || undefined,
        idades: ages,
        tipo_contratacao: tipoContratacao,
        dados_pdf: {
          categoria: category,
          stepper: visibleSteps,
          estrutura: {
            total_vidas: totalLivesNumber,
            total_socios: category === 'pessoa_juridica' ? partnerCountNumber : 0,
            total_funcionarios: category === 'pessoa_juridica' ? employeeCountNumber : 0,
            total_dependentes: dependentsCountNumber,
            empresa_com_funcionarios: category === 'pessoa_juridica' ? hasEmployees : false,
            socios_empresa: category === 'pessoa_juridica' ? companyPartnersPayload : [],
            empresa: category === 'pessoa_juridica'
              ? {
                  razao_social: companyLegalName || null,
                  cnpj: companyCnpj.replace(/\D/g, '') || null,
                }
              : null,
          },
          contato_principal: {
            email: primaryEmail,
            telefone: primaryPhone,
          },
          contato_empresa:
            category === 'pessoa_juridica'
              ? {
                  email: companyEmail,
                  telefone: companyPhone,
                  razao_social: companyLegalName || null,
                  cnpj: companyCnpj.replace(/\D/g, '') || null,
                }
              : null,
          documentos_empresa: companyDocumentsPayload,
          documentos_adesao: adesaoDocumentsPayload,
          beneficiarios: beneficiaryPayload,
          checklist: {
            empresa: companyRequirements,
            socios_empresa: companyPartnersPayload,
            adesao: adesaoRequirements,
            beneficiarios: beneficiaries.map((beneficiary) => ({
              id: beneficiary.id,
              nome: beneficiary.nome,
              requisitos: beneficiaryRequirementsMap.get(beneficiary.id) || [],
            })),
          },
          resumo_extracao: {
            nomes_beneficiarios: extractedSummary.names,
            idades: extractedSummary.ages,
            operadora: extractedSummary.operator,
            tipo_plano: extractedSummary.planType,
            valor_atual: extractedSummary.currentValue,
            confianca_media: extractedSummary.averageConfidence,
            documentos_processados: extractedSummary.totalDocuments,
            caracteres_extraidos: extractedSummary.totalCharacters,
          },
          timestamp: new Date().toISOString(),
        },
        observacoes: `Proposta iniciada por stepper inteligente (${category ? CATEGORY_LABELS[category] : ''}).`,
        corretor_id: resolvedCorretorId || undefined,
        registrar_fila_proposta: registrarFilaProposta ?? Boolean(resolvedCorretorId),
        permitir_lead_existente: permitirLeadExistente ?? Boolean(resolvedCorretorId),
        status_inicial_fila: 'enviada',
      });

      if (!result.success) {
        toast.error('Não foi possível salvar a proposta.', {
          description: result.message || result.error || 'Erro desconhecido.',
        });
        return;
      }

      toast.success('Proposta salva com sucesso!', {
        description:
          result.message ||
          `Lead ${result.lead_id} criado com checklist inteligente.`,
      });

      if (onPropostaSalva) {
        try {
          await onPropostaSalva();
        } catch {
          // Evita falhar o fluxo principal caso apenas o refresh da lista tenha erro.
        }
      }

      resetFlow();
    } catch (saveError: unknown) {
      const message = saveError instanceof Error ? saveError.message : 'Erro ao salvar proposta';
      setError(message);
      toast.error('Erro ao salvar proposta', { description: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border-[#D4AF37]/20 bg-[#0a0a0a]/90 backdrop-blur-sm">
      <CardHeader data-tour="admin-scanner" className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-white">
              <Sparkles className="h-5 w-5 text-[#D4AF37]" />
              Scanner Inteligente · Proposta Step-by-Step
            </CardTitle>
            <CardDescription className="mt-1 text-white/60">
              Modalidade, estrutura de vidas, documentos por etapa e checklist segmentado por beneficiário.
            </CardDescription>
          </div>

          <Badge variant="info">Etapa {currentStepIndex + 1} de {visibleSteps.length}</Badge>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {visibleSteps.map((step, index) => {
            const active = index === currentStepIndex;
            const completed = stepCompletion[step.id];

            return (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  const blocked = visibleSteps
                    .slice(0, index)
                    .some((previousStep) => !stepCompletion[previousStep.id]);

                  if (blocked) {
                    toast.error('Conclua as etapas anteriores antes de avançar.');
                    return;
                  }

                  setCurrentStepIndex(index);
                }}
                className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                  active
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F0D67C]'
                    : completed
                      ? 'border-green-500/30 bg-green-500/10 text-green-300'
                      : 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20'
                }`}
              >
                <p className="text-[11px] uppercase tracking-wide">Passo {index + 1}</p>
                <p className="text-sm font-medium">{step.label}</p>
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {currentStep.id === 'modalidade' && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <Label className="text-white/80">Escolha a modalidade da proposta</Label>
            <Select
              value={category}
              onValueChange={(value) => {
                revokeDocumentPreviews(allUploadedDocuments);
                setCategory(value as ProposalCategory);
                setCompanyDocs({});
                setAdesaoDocs({});
                setBeneficiaries([]);
                setCompanyPartners([]);
                setHasEmployees(false);
                setEmployeeCount('0');
                setCompanyEmail('');
                setCompanyPhone('');
                setCompanyCnpj('');
                setCompanyLegalName('');
                setCompanyEmailTouched(false);
                setCompanyPhoneTouched(false);
                setCompanyDataMode('');
                setSelectedAdesaoDocType('documento_elegibilidade');
                setSelectedAdesaoManageDocType('documento_elegibilidade');
                setSelectedBeneficiaryId('');
                setSelectedBeneficiaryDocType('identidade_cpf');
                setSelectedBeneficiaryManageDocType('identidade_cpf');
                setExpandedCompanyDocPanels({});
                setPreviewDialogDocument(null);
                setError('');
                setCurrentStepIndex(0);
              }}
            >
              <SelectTrigger className={DARK_SELECT_TRIGGER}>
                <SelectValue placeholder="Selecione Adesão, Pessoa Física ou Pessoa Jurídica" />
              </SelectTrigger>
              <SelectContent className={DARK_SELECT_CONTENT}>
                <SelectItem className={DARK_SELECT_ITEM} value="adesao">Adesão</SelectItem>
                <SelectItem className={DARK_SELECT_ITEM} value="pessoa_fisica">Pessoa Física</SelectItem>
                <SelectItem className={DARK_SELECT_ITEM} value="pessoa_juridica">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {currentStep.id === 'estrutura' && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/80">Total de vidas da proposta</Label>
                <Input
                  className={DARK_INPUT}
                  type="number"
                  min={1}
                  value={totalLives}
                  onChange={(event) => setTotalLives(event.target.value)}
                />
              </div>

              {category === 'pessoa_juridica' ? (
                <div className="space-y-2">
                  <Label className="text-white/80">Quantidade de sócios</Label>
                  <Input
                    className={DARK_INPUT}
                    type="number"
                    min={1}
                    max={totalLivesNumber || 1}
                    value={partnerCount}
                    onChange={(event) => setPartnerCount(event.target.value)}
                  />
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                  <p>Titulares: 1</p>
                  <p>Dependentes: {dependentsCountNumber}</p>
                </div>
              )}
            </div>

            {category === 'pessoa_juridica' && (
              <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={hasEmployees}
                    onCheckedChange={(checked) => {
                      setHasEmployees(checked);
                      if (!checked) {
                        setEmployeeCount('0');
                        return;
                      }
                      if (parsePositiveInt(employeeCount) <= 0) {
                        setEmployeeCount('1');
                      }
                    }}
                    size="sm"
                  />
                  <span className="text-sm text-white/80">Empresa com funcionários</span>
                </div>

                {hasEmployees && (
                  <div className="space-y-2">
                    <Label className="text-white/80">Quantidade de funcionários</Label>
                    <Input
                      className={DARK_INPUT}
                      type="number"
                      min={1}
                      max={Math.max(totalLivesNumber - partnerCountNumber, 1)}
                      value={employeeCount}
                      onChange={(event) => setEmployeeCount(event.target.value)}
                    />
                  </div>
                )}
              </div>
            )}

            {category === 'pessoa_juridica' && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-white/75">
                <p>
                  Distribuição automática: <span className="text-white">Sócios {partnerCountNumber}</span> ·{' '}
                  <span className="text-white">Funcionários {employeeCountNumber}</span> ·{' '}
                  <span className="text-white">Dependentes {dependentsCountNumber}</span>
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/80">E-mail de contato principal</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    className={`${DARK_INPUT} pl-9`}
                    value={primaryEmail}
                    onChange={(event) => setPrimaryEmail(normalizeEmailInput(event.target.value))}
                    placeholder="contato@cliente.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Telefone de contato principal</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                  <Input
                    className={`${DARK_INPUT} pl-9`}
                    value={primaryPhone}
                    onChange={(event) => setPrimaryPhone(formatPhoneInput(event.target.value))}
                    placeholder="(11) 99999-9999"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 rounded-lg border border-white/10 bg-black/20 p-3">
              <Label className="text-white/80">Responsável no CRM (corretor/usuário)</Label>
              {corretorId ? (
                <div className="space-y-1">
                  <Badge variant="info">Atribuído ao seu usuário</Badge>
                  <p className="text-xs text-white/55">
                    As propostas enviadas neste painel ficam vinculadas ao corretor autenticado.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Select
                    value={selectedCorretorId || '__none__'}
                    onValueChange={(value) => setSelectedCorretorId(value === '__none__' ? '' : value)}
                    disabled={loadingCorretorOptions}
                  >
                    <SelectTrigger className={DARK_SELECT_TRIGGER}>
                      <SelectValue placeholder="Selecione o responsável" />
                    </SelectTrigger>
                    <SelectContent className={DARK_SELECT_CONTENT}>
                      <SelectItem className={DARK_SELECT_ITEM} value="__none__">
                        Sem responsável
                      </SelectItem>
                      {corretorOptions.map((option) => (
                        <SelectItem className={DARK_SELECT_ITEM} key={option.id} value={option.id}>
                          {option.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-white/55">
                    Você pode deixar sem responsável agora e editar depois no CRM.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs text-white/65">
                A estrutura dos beneficiários será gerada automaticamente ao clicar em Avançar.
              </p>
              {isStructureReady && (
                <Badge variant="success">
                  Estrutura pronta: {totalLivesNumber} vida(s)
                </Badge>
              )}
            </div>
          </div>
        )}

        {currentStep.id === 'empresa' && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-white/80">E-mail da empresa</Label>
                <Input
                  className={DARK_INPUT}
                  value={companyEmail}
                  onChange={(event) => {
                    setCompanyEmailTouched(true);
                    setCompanyEmail(normalizeEmailInput(event.target.value));
                  }}
                  placeholder="contato@empresa.com"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Telefone da empresa</Label>
                <Input
                  className={DARK_INPUT}
                  value={companyPhone}
                  onChange={(event) => {
                    setCompanyPhoneTouched(true);
                    setCompanyPhone(formatPhoneInput(event.target.value));
                  }}
                  placeholder="(11) 3333-4444"
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-white">Como deseja preencher os dados da empresa?</p>
                <p className="text-xs text-white/60">
                  Escolha um modo para liberar os campos desta etapa.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                <button
                  type="button"
                  onClick={() => setCompanyDataMode('scanner')}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    companyDataMode === 'scanner'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F0D67C]'
                      : 'border-white/15 bg-black/20 text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">Scanner Inteligente</p>
                  <p className="text-xs text-current/80">Anexa documentos e extrai os dados automaticamente.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCompanyDataMode('manual')}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    companyDataMode === 'manual'
                      ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-[#F0D67C]'
                      : 'border-white/15 bg-black/20 text-white/80 hover:border-white/30'
                  }`}
                >
                  <p className="text-sm font-semibold">Digitar manualmente</p>
                  <p className="text-xs text-current/80">Preenche CNPJ e razão social manualmente.</p>
                </button>
              </div>

              {!companyDataMode && (
                <p className="text-xs text-white/55">
                  Selecione uma opção para continuar.
                </p>
              )}
            </div>

            {companyDataMode === 'scanner' && (
              <>
                <div className="space-y-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">1. Anexe os documentos da empresa</p>
                    <p className="text-xs text-white/65">
                      Envie os arquivos por categoria para preencher CNPJ, razão social e sócios automaticamente.
                    </p>
                    <p className="text-xs text-white/55">
                      Você pode selecionar múltiplos arquivos de uma vez para o mesmo tipo de documento.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {(Object.keys(COMPANY_DOC_LABELS) as CompanyDocumentType[])
                      .filter((docType) => docType !== 'identidade_cpf_socios')
                      .map((docType) => {
                        const requirement = companyRequirements.find((item) => item.id === docType);
                        const isRequired = requirement?.required ?? true;
                        const isDone = requirement?.done ?? hasUploadedDocs(companyDocs[docType]);
                        const docsForType = companyDocs[docType] || [];
                        const filesCount = docsForType.length;
                        const uploadTarget: UploadTarget = { scope: 'empresa', docType };
                        const isExpanded = expandedCompanyDocPanels[docType] ?? true;

                        return (
                          <div key={docType} className="rounded-lg border border-white/10 bg-black/25 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-sm text-white/90">{COMPANY_DOC_LABELS[docType]}</p>
                                <p className="text-xs text-white/55">
                                  {filesCount > 0
                                    ? `${filesCount} arquivo(s) anexado(s).`
                                    : 'Nenhum arquivo anexado.'}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={getChecklistBadgeVariant(isDone, isRequired)}
                                  className={getChecklistBadgeClass(isDone, isRequired)}
                                >
                                  {isDone ? 'OK' : isRequired ? 'Pendente' : 'Opcional'}
                                </Badge>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-white/80 hover:bg-white/10 hover:text-white"
                                  onClick={() => toggleCompanyDocPanel(docType)}
                                >
                                  <ChevronDown
                                    className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </Button>
                              </div>
                            </div>

                            {isExpanded && (
                              <div className="mt-2 space-y-2">
                                {requirement?.helper && (
                                  <p className="text-xs text-white/45">{requirement.helper}</p>
                                )}

                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    type="button"
                                    size="sm"
                                    onClick={() => triggerUpload(uploadTarget)}
                                    disabled={isProcessing}
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Anexar documento(s)
                                  </Button>

                                  {docType === 'cartao_cnpj' && (
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className={`${DARK_OUTLINE_BUTTON} border-[#D4AF37]/40`}
                                    >
                                      <a
                                        href="https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-white hover:text-white"
                                      >
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Gerar Cartão CNPJ
                                      </a>
                                    </Button>
                                  )}
                                </div>
                                {renderInlineUploadProgress(uploadTarget)}

                                {docsForType.length > 0 && (
                                  <div className="space-y-2 rounded-lg border border-white/10 bg-black/35 p-2.5">
                                    <p className="text-xs font-medium text-white/80">Arquivos anexados</p>
                                    {docsForType.map((document) => (
                                      <div
                                        key={document.id}
                                        className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 md:flex-row md:items-center md:justify-between"
                                      >
                                        <div className="min-w-0">
                                          <p className="truncate text-sm text-white/90">{document.fileName}</p>
                                          <p className="text-xs text-white/55">
                                            {formatFileSize(document.fileSize)} ·{' '}
                                            {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                                          </p>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2">
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className={DARK_OUTLINE_BUTTON}
                                            onClick={() => previewUploadedDocument(document)}
                                          >
                                            <Eye className="mr-1.5 h-4 w-4" />
                                            Abrir
                                          </Button>
                                          <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                                            onClick={() => removeCompanyUploadedDocument(docType, document.id)}
                                          >
                                            <Trash2 className="mr-1.5 h-4 w-4" />
                                            Remover
                                          </Button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                  {companyRequirements.every((item) => !item.required || item.done) && (
                    <p className="text-xs text-green-200/80">
                      Todos os documentos obrigatórios da empresa já foram enviados.
                    </p>
                  )}
                </div>

                {companyPartnerDocStatuses.length > 0 && (
                  <div className="space-y-2 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-white">Guia de pendências · ID e CPF dos sócios</p>
                      <Badge
                        variant={pendingCompanyPartnerDocStatuses.length === 0 ? 'success' : 'warning'}
                        className={
                          pendingCompanyPartnerDocStatuses.length === 0
                            ? CHECKLIST_BADGE_DONE
                            : CHECKLIST_BADGE_PENDING
                        }
                      >
                        {pendingCompanyPartnerDocStatuses.length === 0
                          ? 'Concluído'
                          : `${pendingCompanyPartnerDocStatuses.length} pendente(s)`}
                      </Badge>
                    </div>

                    <p className="text-xs text-white/65">
                      Esta área mostra apenas os sócios que ainda precisam de documento vinculado.
                    </p>

                    {pendingCompanyPartnerDocStatuses.length === 0 ? (
                      <p className="rounded-lg border border-green-500/30 bg-green-500/10 p-2 text-xs text-green-100">
                        Todos os sócios já possuem documento de ID/CPF anexado.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
                        {pendingCompanyPartnerDocStatuses.map((status, index) => (
                          <div key={status.partner.id} className="rounded-lg border border-white/10 bg-black/25 p-2.5">
                            <div className="mb-2 flex items-start justify-between gap-2">
                              <p className="text-xs text-white/55">Pendente {index + 1}</p>
                              <Badge variant="warning" className={CHECKLIST_BADGE_PENDING}>
                                Pendente
                              </Badge>
                            </div>

                            <div className="space-y-2">
                              <Input
                                className={DARK_INPUT}
                                value={status.partner.nome}
                                onChange={(event) => updateCompanyPartnerName(status.partner.id, event.target.value)}
                                placeholder={`Nome do sócio ${index + 1}`}
                              />

                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() =>
                                    triggerUpload({
                                      scope: 'empresa',
                                      docType: 'identidade_cpf_socios',
                                      partnerId: status.partner.id,
                                    })
                                  }
                                  disabled={isProcessing}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Anexar ID/CPF deste sócio
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                                  onClick={() => removeCompanyPartner(status.partner.id)}
                                  disabled={isProcessing || companyPartners.length <= 1}
                                >
                                  <Trash2 className="mr-1.5 h-4 w-4" />
                                  Remover sócio
                                </Button>
                              </div>
                              {renderInlineUploadProgress({
                                scope: 'empresa',
                                docType: 'identidade_cpf_socios',
                                partnerId: status.partner.id,
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {companyDataMode === 'manual' && (
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/25 p-3">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-white">Preenchimento manual</p>
                  <p className="text-xs text-white/60">
                    Use esta opção quando preferir informar os dados sem extração por IA.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-white/80">Razão social</Label>
                    <Input
                      className={DARK_INPUT}
                      value={companyLegalName}
                      onChange={(event) => setCompanyLegalName(event.target.value)}
                      placeholder="Razão social da empresa"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-white/80">CNPJ</Label>
                    <Input
                      className={DARK_INPUT}
                      value={companyCnpj}
                      onChange={(event) => {
                        const digits = event.target.value.replace(/\D/g, '').slice(0, 14);
                        const formatted = digits
                          .replace(/^(\d{2})(\d)/, '$1.$2')
                          .replace(/^(\d{2}\.\d{3})(\d)/, '$1.$2')
                          .replace(/\.(\d{3})(\d)/, '.$1/$2')
                          .replace(/(\d{4})(\d)/, '$1-$2');
                        setCompanyCnpj(formatted);
                      }}
                      placeholder="00.000.000/0000-00"
                    />
                  </div>
                </div>

                <p className="text-xs text-white/55">
                  Para anexar documentos obrigatórios da empresa, troque para o modo Scanner Inteligente.
                </p>
              </div>
            )}
          </div>
        )}

        {currentStep.id === 'beneficiarios' && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-white">Documentação individual dos beneficiários</h3>
              <Badge variant="info">{beneficiaries.length} beneficiário(s)</Badge>
            </div>

            {category === 'adesao' && (
              <div className="space-y-3 rounded-xl border border-[#D4AF37]/20 bg-[#D4AF37]/5 p-3">
                <p className="text-sm font-semibold text-white">Documentos obrigatórios de Adesão</p>
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={
                      adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType)
                        ? selectedAdesaoDocType
                        : undefined
                    }
                    onValueChange={(value) => setSelectedAdesaoDocType(value as AdesaoDocumentType)}
                    disabled={adesaoPendingUploadOptions.length === 0}
                  >
                    <SelectTrigger className={`${DARK_SELECT_TRIGGER} sm:w-[360px]`}>
                      <SelectValue placeholder="Sem pendências de upload" />
                    </SelectTrigger>
                    <SelectContent className={DARK_SELECT_CONTENT}>
                      {adesaoPendingUploadOptions.map((option) => (
                        <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Button
                    type="button"
                    disabled={isProcessing || adesaoPendingUploadOptions.length === 0}
                    onClick={() => {
                      if (!adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType)) {
                        return;
                      }
                      triggerUpload({ scope: 'adesao', docType: selectedAdesaoDocType });
                    }}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar documentos de adesão
                  </Button>
                </div>
                {adesaoPendingUploadOptions.some((option) => option.value === selectedAdesaoDocType) &&
                  renderInlineUploadProgress({
                    scope: 'adesao',
                    docType: selectedAdesaoDocType,
                  })}
                {adesaoPendingUploadOptions.length === 0 && (
                  <p className="text-xs text-green-200/80">
                    Todos os documentos de adesão já foram enviados.
                  </p>
                )}
                <p className="text-xs text-white/55">
                  Você pode anexar vários arquivos em um único envio.
                </p>

                <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      Anexos enviados de Adesão
                    </p>
                    <Badge variant="info">{selectedAdesaoDocs.length} arquivo(s)</Badge>
                  </div>

                  {adesaoManageDocOptions.length > 0 && (
                    <Select
                      value={selectedAdesaoManageDocType}
                      onValueChange={(value) => setSelectedAdesaoManageDocType(value as AdesaoDocumentType)}
                    >
                      <SelectTrigger className={`${DARK_SELECT_TRIGGER} sm:w-[360px]`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={DARK_SELECT_CONTENT}>
                        {adesaoManageDocOptions.map((option) => (
                          <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedAdesaoDocs.length === 0 ? (
                    <p className="text-xs text-white/55">
                      Nenhum arquivo anexado para gerenciamento.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedAdesaoDocs.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/90">{document.fileName}</p>
                            <p className="text-xs text-white/55">
                              {formatFileSize(document.fileSize)} · {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className={DARK_OUTLINE_BUTTON}
                              onClick={() => previewUploadedDocument(document)}
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              Pré-visualizar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                              onClick={() => removeAdesaoUploadedDocument(selectedAdesaoManageDocType, document.id)}
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  {adesaoRequirements.map((requirement) => (
                    <div key={requirement.id} className="rounded-lg border border-white/10 bg-black/20 p-2">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-white/90">{requirement.label}</p>
                        <Badge
                          variant={getChecklistBadgeVariant(requirement.done, true)}
                          className={getChecklistBadgeClass(requirement.done, true)}
                        >
                          {requirement.done ? 'OK' : 'Pendente'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="space-y-3 rounded-xl border border-white/10 bg-black/20 p-3">
                <Label className="text-white/80">Upload segmentado</Label>
                <Select value={selectedBeneficiaryId} onValueChange={setSelectedBeneficiaryId}>
                  <SelectTrigger className={DARK_SELECT_TRIGGER}>
                    <SelectValue placeholder="Selecione o beneficiário" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {beneficiaries.map((beneficiary, index) => (
                      <SelectItem className={DARK_SELECT_ITEM} key={beneficiary.id} value={beneficiary.id}>
                        {index + 1}. {beneficiary.nome || formatRole(beneficiary.role)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={
                    beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType)
                      ? selectedBeneficiaryDocType
                      : undefined
                  }
                  onValueChange={(value) => setSelectedBeneficiaryDocType(value as BeneficiaryDocumentType)}
                  disabled={!selectedBeneficiary || beneficiaryUploadOptions.length === 0}
                >
                  <SelectTrigger className={DARK_SELECT_TRIGGER}>
                    <SelectValue placeholder="Sem pendências para upload" />
                  </SelectTrigger>
                  <SelectContent className={DARK_SELECT_CONTENT}>
                    {beneficiaryUploadOptions.map((option) => (
                      <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  type="button"
                  disabled={!selectedBeneficiary || isProcessing || beneficiaryUploadOptions.length === 0}
                  onClick={() => {
                    if (!selectedBeneficiary) return;
                    if (!beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType)) {
                      return;
                    }
                    triggerUpload({
                      scope: 'beneficiario',
                      beneficiaryId: selectedBeneficiary.id,
                      docType: selectedBeneficiaryDocType,
                    });
                  }}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Enviar documentos do beneficiário
                </Button>
                {selectedBeneficiary &&
                  beneficiaryUploadOptions.some((option) => option.value === selectedBeneficiaryDocType) &&
                  renderInlineUploadProgress({
                    scope: 'beneficiario',
                    beneficiaryId: selectedBeneficiary.id,
                    docType: selectedBeneficiaryDocType,
                  })}
                {beneficiaryUploadOptions.length === 0 && (
                  <p className="text-xs text-green-200/80">
                    Beneficiário sem pendências obrigatórias de upload.
                  </p>
                )}

                <div className="space-y-2 rounded-xl border border-white/10 bg-black/25 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">
                      Anexos enviados do beneficiário
                    </p>
                    <Badge variant="info">{selectedBeneficiaryDocs.length} arquivo(s)</Badge>
                  </div>

                  {beneficiaryManageDocOptions.length > 0 && (
                    <Select
                      value={selectedBeneficiaryManageDocType}
                      onValueChange={(value) => setSelectedBeneficiaryManageDocType(value as BeneficiaryDocumentType)}
                    >
                      <SelectTrigger className={DARK_SELECT_TRIGGER}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className={DARK_SELECT_CONTENT}>
                        {beneficiaryManageDocOptions.map((option) => (
                          <SelectItem className={DARK_SELECT_ITEM} key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {selectedBeneficiaryDocs.length === 0 ? (
                    <p className="text-xs text-white/55">
                      Nenhum arquivo anexado para gerenciamento deste beneficiário.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedBeneficiaryDocs.map((document) => (
                        <div
                          key={document.id}
                          className="flex flex-col gap-2 rounded-lg border border-white/10 bg-black/30 px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm text-white/90">{document.fileName}</p>
                            <p className="text-xs text-white/55">
                              {formatFileSize(document.fileSize)} · {new Date(document.uploadedAt).toLocaleString('pt-BR')}
                            </p>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className={DARK_OUTLINE_BUTTON}
                              onClick={() => previewUploadedDocument(document)}
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              Pré-visualizar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-red-500/40 bg-red-500/10 text-red-100 hover:bg-red-500/20 hover:text-red-50"
                              onClick={() => {
                                if (!selectedBeneficiary) return;
                                removeBeneficiaryUploadedDocument(
                                  selectedBeneficiary.id,
                                  selectedBeneficiaryManageDocType,
                                  document.id,
                                );
                              }}
                            >
                              <Trash2 className="mr-1.5 h-4 w-4" />
                              Remover
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/70">
                <p className="font-medium text-white">Como funciona a validação inteligente</p>
                <p className="mt-1">1. Nome, idade e estado civil são obrigatórios por beneficiário.</p>
                <p>2. O checklist ajusta automaticamente casamento e certidão de nascimento.</p>
                <p>3. Cada upload fica vinculado ao beneficiário selecionado.</p>
                <p>4. Você pode selecionar e enviar vários arquivos de uma vez.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {beneficiaries.map((beneficiary, index) => {
                const requirements = beneficiaryRequirementsMap.get(beneficiary.id) || [];
                const requiredTotal = requirements.filter((item) => item.required).length;
                const requiredDone = requirements.filter((item) => item.required && item.done).length;

                return (
                  <div key={beneficiary.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <UserRound className="h-4 w-4 text-[#D4AF37]" />
                        <p className="text-sm font-semibold text-white">
                          Beneficiário {index + 1} · {formatRole(beneficiary.role)}
                        </p>
                      </div>
                      <Badge
                        variant={requiredDone === requiredTotal ? 'success' : 'warning'}
                        className={requiredDone === requiredTotal ? CHECKLIST_BADGE_DONE : CHECKLIST_BADGE_PENDING}
                      >
                        {requiredDone}/{requiredTotal}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
                      <div className="space-y-1">
                        <Label className="text-white/70">Nome</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.nome}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'nome', event.target.value)}
                          placeholder="Nome completo"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-white/70">Idade</Label>
                        <Input
                          className={DARK_INPUT}
                          type="number"
                          min={0}
                          max={120}
                          value={beneficiary.idade}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'idade', event.target.value)}
                          placeholder="Idade"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-white/70">Estado civil</Label>
                        <Select
                          value={beneficiary.estadoCivil}
                          onValueChange={(value) => updateBeneficiary(beneficiary.id, 'estadoCivil', value as CivilStatus)}
                        >
                          <SelectTrigger className={DARK_SELECT_TRIGGER}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className={DARK_SELECT_CONTENT}>
                            {CIVIL_STATUS_OPTIONS.map((status) => (
                              <SelectItem className={DARK_SELECT_ITEM} key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {(beneficiary.estadoCivil === 'casado' || beneficiary.estadoCivil === 'uniao_estavel') && (
                        <div className="space-y-1">
                          <Label className="text-white/70">Prova marital</Label>
                          <Select
                            value={beneficiary.comprovacaoConjugal}
                            onValueChange={(value) =>
                              updateBeneficiary(beneficiary.id, 'comprovacaoConjugal', value as MarriageProofMode)
                            }
                          >
                            <SelectTrigger className={DARK_SELECT_TRIGGER}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className={DARK_SELECT_CONTENT}>
                              <SelectItem className={DARK_SELECT_ITEM} value="certidao">Certidão</SelectItem>
                              <SelectItem className={DARK_SELECT_ITEM} value="declaracao">Declaração</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                      <div className="space-y-1">
                        <Label className="text-white/70">CPF</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.cpf}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'cpf', formatCpfInput(event.target.value))}
                          placeholder="000.000.000-00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">RG</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.rg}
                          onChange={(event) => updateBeneficiary(beneficiary.id, 'rg', formatRgInput(event.target.value))}
                          placeholder="RG"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">Data de nascimento</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.dataNascimento}
                          onChange={(event) => {
                            const formattedDate = formatDateInput(event.target.value);
                            updateBeneficiary(beneficiary.id, 'dataNascimento', formattedDate);
                            if (!beneficiary.idade) {
                              const inferredAge = inferAgeFromBirthDate(formattedDate);
                              if (inferredAge) {
                                updateBeneficiary(beneficiary.id, 'idade', inferredAge);
                              }
                            }
                          }}
                          placeholder="DD/MM/AAAA"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">E-mail</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.email}
                          onChange={(event) =>
                            updateBeneficiary(beneficiary.id, 'email', normalizeEmailInput(event.target.value))
                          }
                          placeholder="email@exemplo.com"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-white/70">Telefone</Label>
                        <Input
                          className={DARK_INPUT}
                          value={beneficiary.telefone}
                          onChange={(event) =>
                            updateBeneficiary(beneficiary.id, 'telefone', formatPhoneInput(event.target.value))
                          }
                          placeholder="(11) 99999-9999"
                        />
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                      {requirements.map((requirement) => (
                        <div key={requirement.id} className="rounded-lg border border-white/10 bg-black/30 px-3 py-2">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm text-white/90">{requirement.label}</p>
                            <Badge
                              variant={getChecklistBadgeVariant(requirement.done, requirement.required)}
                              className={getChecklistBadgeClass(requirement.done, requirement.required)}
                            >
                              {requirement.done ? 'OK' : requirement.required ? 'Pendente' : 'Opcional'}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {currentStep.id === 'resumo' && (
          <div className="space-y-4 rounded-xl border border-white/10 bg-white/[0.02] p-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                <p><span className="text-white/50">Modalidade:</span> {category ? CATEGORY_LABELS[category] : '—'}</p>
                <p><span className="text-white/50">Vidas:</span> {totalLivesNumber}</p>
                {category === 'pessoa_juridica' && (
                  <p>
                    <span className="text-white/50">Sócios/Funcionários/Dependentes:</span>{' '}
                    {partnerCountNumber}/{employeeCountNumber}/{dependentsCountNumber}
                  </p>
                )}
                <p><span className="text-white/50">Contato principal:</span> {primaryEmail || '—'} · {primaryPhone || '—'}</p>
                <p><span className="text-white/50">Responsável CRM:</span> {assignedCorretorLabel}</p>
                <p><span className="text-white/50">Documentos processados:</span> {extractedSummary.totalDocuments}</p>
              </div>

              <div className="rounded-xl border border-white/10 bg-black/20 p-3 text-sm text-white/80">
                <p><span className="text-white/50">Operadora identificada:</span> {extractedSummary.operator || '—'}</p>
                <p><span className="text-white/50">Tipo de plano:</span> {extractedSummary.planType || '—'}</p>
                <p>
                  <span className="text-white/50">Valor atual:</span>{' '}
                  {extractedSummary.currentValue != null
                    ? `R$ ${extractedSummary.currentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                    : '—'}
                </p>
                <p>
                  <span className="text-white/50">Confiança média:</span>{' '}
                  {extractedSummary.averageConfidence != null
                    ? `${extractedSummary.averageConfidence.toFixed(1)}%`
                    : '—'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-white">Pendências atuais</p>
              {buildMissingChecklist().length === 0 ? (
                <Alert className="border-green-500/30 bg-green-500/10">
                  <CheckCircle2 className="h-4 w-4 text-green-400" />
                  <AlertDescription className="text-green-100">
                    Checklist completo. Proposta pronta para salvar no CRM.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-sm text-yellow-100">
                  {buildMissingChecklist().slice(0, 8).map((item) => (
                    <p key={item}>• {item}</p>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="button"
                onClick={() => void saveProposal()}
                disabled={isSaving || buildMissingChecklist().length > 0 || allUploadedDocuments.length === 0}
                className="bg-[#D4AF37] text-white hover:bg-[#E8C25B]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando proposta...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Salvar proposta no CRM
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={resetFlow}
                disabled={isSaving || isProcessing}
                className={DARK_OUTLINE_BUTTON}
              >
                <Upload className="mr-2 h-4 w-4" />
                Reiniciar fluxo
              </Button>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={FILE_INPUT_ACCEPT}
          onChange={(event) => {
            void handleFileInput(event);
          }}
          className="hidden"
        />

        <Dialog
          open={Boolean(previewDialogDocument)}
          onOpenChange={(open) => {
            if (!open) {
              setPreviewDialogDocument(null);
            }
          }}
        >
          <DialogContent
            className="max-h-[90vh] w-[96vw] max-w-[1100px] overflow-hidden border-white/15 bg-[#0a0a0a] p-0 text-white"
            showCloseButton
          >
            <DialogHeader className="border-b border-white/10 px-4 py-3">
              <DialogTitle className="truncate text-sm text-white">
                {previewDialogDocument?.fileName || 'Pré-visualização'}
              </DialogTitle>
              {previewDialogDocument && (
                <p className="text-xs text-white/55">
                  {previewDialogDocument.requirementLabel} · {formatFileSize(previewDialogDocument.fileSize)}
                </p>
              )}
            </DialogHeader>

            <div className="flex h-[68vh] items-center justify-center bg-black px-3 py-3">
              {previewDialogDocument && isPreviewableDocument(previewDialogDocument) ? (
                <iframe
                  title={`preview-${previewDialogDocument.id}`}
                  src={previewDialogDocument.previewUrl || undefined}
                  className="h-full w-full rounded-md border border-white/10 bg-black"
                />
              ) : (
                <div className="space-y-2 text-center">
                  <p className="text-sm text-white/80">Pré-visualização não disponível para este formato.</p>
                  <p className="text-xs text-white/55">Use o botão abaixo para baixar e abrir localmente.</p>
                </div>
              )}
            </div>

            <DialogFooter className="border-t border-white/10 px-4 py-3 sm:justify-between">
              <p className="text-xs text-white/55">
                {previewDialogDocument ? new Date(previewDialogDocument.uploadedAt).toLocaleString('pt-BR') : ''}
              </p>
              <Button
                type="button"
                variant="outline"
                className={DARK_OUTLINE_BUTTON}
                onClick={() => downloadUploadedDocument(previewDialogDocument)}
                disabled={!previewDialogDocument}
              >
                <Download className="mr-2 h-4 w-4" />
                Baixar arquivo
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goPreviousStep}
            disabled={currentStepIndex === 0}
            className={DARK_OUTLINE_BUTTON}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>

          <Button
            type="button"
            onClick={goNextStep}
            disabled={currentStepIndex >= visibleSteps.length - 1}
          >
            Avançar
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
