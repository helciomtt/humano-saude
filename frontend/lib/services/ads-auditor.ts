// =====================================================
// CAMADA 5 — Ads Auditor Service (Motor de Regras)
// Execução via Cron a cada 30 min
// SEM dependência de IA — 100% regras locais
// =====================================================

import { createServiceClient } from '@/lib/supabase';
import type {
  AuditResult,
  AuditRecommendation,
  AuditRule,
  UserSettings,
  AuditActionType,
} from '@/lib/types/ai-performance';
import { logger } from '@/lib/logger';

// =====================================================
// SETTINGS DEFAULT
// =====================================================

const DEFAULT_SETTINGS: UserSettings = {
  maxCpa: 40,
  minRoas: 2.0,
  maxFrequency: 3.0,
  minCtr: 0.5,
  maxSpendWithoutPurchase: 50,
  autoPauseBleeders: false,
  autoScaleWinners: false,
  scaleIncrementPercent: 20,
};

// =====================================================
// META API HELPER
// =====================================================

const META_API_VERSION = 'v21.0';

interface MetaCampaignInsight {
  campaign_id: string;
  campaign_name: string;
  spend: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  frequency: number;
  purchases: number;
  purchaseValue: number;
  roas: number;
}

async function fetchCampaignInsightsFromMeta(
  accessToken: string,
  adAccountId: string
): Promise<MetaCampaignInsight[]> {
  const fields = 'campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values';

  const url = `https://graph.facebook.com/${META_API_VERSION}/act_${adAccountId}/insights?fields=${fields}&level=campaign&date_preset=today&limit=100&access_token=${accessToken}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Meta API ${res.status}`);
    const data = await res.json();

    return (data.data || []).map((row: Record<string, unknown>) => {
      const actions = (row.actions || []) as Array<{ action_type: string; value: string }>;
      const actionValues = (row.action_values || []) as Array<{ action_type: string; value: string }>;

      const purchases = parseInt(
        actions.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0',
        10
      );
      const purchaseValue = parseFloat(
        actionValues.find(a => a.action_type === 'offsite_conversion.fb_pixel_purchase')?.value || '0'
      );
      const spend = parseFloat(row.spend as string) || 0;

      return {
        campaign_id: row.campaign_id as string,
        campaign_name: row.campaign_name as string,
        spend,
        impressions: parseInt(row.impressions as string, 10) || 0,
        clicks: parseInt(row.clicks as string, 10) || 0,
        ctr: parseFloat(row.ctr as string) || 0,
        cpc: parseFloat(row.cpc as string) || 0,
        cpm: parseFloat(row.cpm as string) || 0,
        reach: parseInt(row.reach as string, 10) || 0,
        frequency: parseFloat(row.frequency as string) || 0,
        purchases,
        purchaseValue,
        roas: spend > 0 ? purchaseValue / spend : 0,
      };
    });
  } catch (error) {
    logger.error('❌ Erro ao buscar insights da Meta:', error);
    return [];
  }
}

// =====================================================
// CLASSE PRINCIPAL — AdsAuditor
// =====================================================

export class AdsAuditor {
  private accessToken: string;
  private adAccountId: string;
  private supabase: ReturnType<typeof createServiceClient>;
  private settings: UserSettings = DEFAULT_SETTINGS;
  private rules: AuditRule[] = [];
  private auditRunId: string;

  constructor(accessToken: string, adAccountId: string) {
    this.accessToken = accessToken;
    this.adAccountId = adAccountId;
    this.supabase = createServiceClient();
    this.auditRunId = `audit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * Executa auditoria completa
   */
  async runAudit(): Promise<AuditResult> {
    const startTime = Date.now();
    const recommendations: AuditRecommendation[] = [];
    let errorsCount = 0;

    try {
      // 1. Log inicio
      await this.logAuditStart();

      // 2. Carregar configurações do usuário
      await this.loadSettings();

      // 3. Carregar regras ativas
      await this.loadRules();

      // 4. Buscar insights de hoje da Meta
      const campaigns = await fetchCampaignInsightsFromMeta(this.accessToken, this.adAccountId);

      if (campaigns.length === 0) {
        await this.logAuditComplete(0, 0, 0, 0, Date.now() - startTime, 'NO_DATA');
        return { campaigns_analyzed: 0, alerts_generated: 0, opportunities_found: 0, errors_count: 0, recommendations: [], duration_ms: Date.now() - startTime };
      }

      // 5. Analisar cada campanha
      for (const campaign of campaigns) {
        try {
          // Salvar snapshot
          await this.saveInsightsSnapshot(campaign);

          // Aplicar regras embutidas
          const builtInRecs = this.applyBuiltInRules(campaign);
          recommendations.push(...builtInRecs);

          // Aplicar regras customizadas
          const customRecs = this.applyCustomRules(campaign);
          recommendations.push(...customRecs);
        } catch (error) {
          logger.error(`❌ Erro ao auditar ${campaign.campaign_name}:`, error);
          errorsCount++;
        }
      }

      // 6. Salvar recomendações no banco
      if (recommendations.length > 0) {
        await this.saveRecommendations(recommendations);
      }

      const alertsGenerated = recommendations.filter(r => r.type === 'ALERT' || r.type === 'WARNING').length;
      const opportunitiesFound = recommendations.filter(r => r.type === 'OPPORTUNITY').length;

      // 7. Log conclusão
      await this.logAuditComplete(
        campaigns.length,
        alertsGenerated,
        opportunitiesFound,
        errorsCount,
        Date.now() - startTime,
        'SUCCESS'
      );

      return {
        campaigns_analyzed: campaigns.length,
        alerts_generated: alertsGenerated,
        opportunities_found: opportunitiesFound,
        errors_count: errorsCount,
        recommendations,
        duration_ms: Date.now() - startTime,
      };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      await this.logAuditComplete(0, 0, 0, 1, Date.now() - startTime, 'ERROR', msg);
      throw error;
    }
  }

  // =====================================================
  // REGRAS EMBUTIDAS (Built-in)
  // =====================================================

  private applyBuiltInRules(campaign: MetaCampaignInsight): AuditRecommendation[] {
    const recs: AuditRecommendation[] = [];
    const snapshot = this.buildSnapshot(campaign);

    // Regra 1: SANGRIA — gasto sem compras
    if (campaign.spend >= this.settings.maxSpendWithoutPurchase && campaign.purchases === 0) {
      recs.push({
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name,
        type: 'ALERT',
        priority: 'CRITICAL',
        title: '🩸 Sangria Detectada',
        message: `Campanha gastou R$ ${campaign.spend.toFixed(2)} hoje sem nenhuma compra. ${this.settings.autoPauseBleeders ? 'Será pausada automaticamente.' : 'Considere pausar.'}`,
        actionType: this.settings.autoPauseBleeders ? 'PAUSE' : 'REVIEW',
        metricsSnapshot: snapshot,
      });
    }

    // Regra 2: CPA ALTO
    if (campaign.purchases > 0) {
      const cpa = campaign.spend / campaign.purchases;
      if (cpa > this.settings.maxCpa) {
        recs.push({
          campaignId: campaign.campaign_id,
          campaignName: campaign.campaign_name,
          type: 'WARNING',
          priority: 'HIGH',
          title: '📈 CPA Acima do Limite',
          message: `CPA de R$ ${cpa.toFixed(2)} excede o máximo de R$ ${this.settings.maxCpa.toFixed(2)}.`,
          actionType: 'REVIEW',
          metricsSnapshot: snapshot,
        });
      }
    }

    // Regra 3: ROAS BAIXO
    if (campaign.roas < this.settings.minRoas && campaign.spend >= 20) {
      const severity = campaign.roas < 1 ? 'HIGH' : 'MEDIUM';
      recs.push({
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name,
        type: 'WARNING',
        priority: severity,
        title: '📉 ROAS Abaixo do Mínimo',
        message: `ROAS de ${campaign.roas.toFixed(2)}x está abaixo do mínimo de ${this.settings.minRoas.toFixed(2)}x.`,
        actionType: campaign.roas < 1 ? 'PAUSE' : 'REVIEW',
        metricsSnapshot: snapshot,
      });
    }

    // Regra 4: OPORTUNIDADE DE ESCALA
    if (campaign.roas >= 3 && campaign.spend >= 30) {
      recs.push({
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name,
        type: 'OPPORTUNITY',
        priority: 'MEDIUM',
        title: '🚀 Oportunidade de Escala',
        message: `ROAS de ${campaign.roas.toFixed(2)}x com gasto de R$ ${campaign.spend.toFixed(2)}. ${this.settings.autoScaleWinners ? `Budget será aumentado em ${this.settings.scaleIncrementPercent}%.` : 'Considere escalar +20%.'}`,
        actionType: this.settings.autoScaleWinners ? 'SCALE' : 'REVIEW',
        actionParams: { scalePercent: this.settings.scaleIncrementPercent },
        metricsSnapshot: snapshot,
      });
    }

    // Regra 5: FADIGA DE AUDIÊNCIA
    if (campaign.frequency >= this.settings.maxFrequency && campaign.impressions >= 1000) {
      recs.push({
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name,
        type: 'WARNING',
        priority: 'MEDIUM',
        title: '😴 Fadiga de Audiência',
        message: `Frequência de ${campaign.frequency.toFixed(1)} excede o máximo de ${this.settings.maxFrequency}. Renove criativos ou expanda público.`,
        actionType: 'REVIEW',
        metricsSnapshot: snapshot,
      });
    }

    // Regra 6: CTR BAIXO
    if (campaign.ctr < this.settings.minCtr && campaign.impressions >= 1000) {
      recs.push({
        campaignId: campaign.campaign_id,
        campaignName: campaign.campaign_name,
        type: 'INFO',
        priority: 'LOW',
        title: '👆 CTR Abaixo do Mínimo',
        message: `CTR de ${campaign.ctr.toFixed(2)}% abaixo do mínimo de ${this.settings.minCtr}%. Revise criativos e copy.`,
        actionType: 'REVIEW',
        metricsSnapshot: snapshot,
      });
    }

    return recs;
  }

  // =====================================================
  // REGRAS CUSTOMIZADAS (do banco)
  // =====================================================

  private applyCustomRules(campaign: MetaCampaignInsight): AuditRecommendation[] {
    const recs: AuditRecommendation[] = [];

    for (const rule of this.rules) {
      // Se a regra é específica para certas campanhas
      if (rule.applyCampaigns && rule.applyCampaigns.length > 0) {
        if (!rule.applyCampaigns.includes(campaign.campaign_id)) continue;
      }

      const metricValue = this.getMetricValue(campaign, rule.metric);
      if (metricValue === null) continue;

      const triggered = this.evaluateCondition(metricValue, rule.operator, rule.threshold);

      if (triggered) {
        const actionMap: Record<string, AuditActionType> = {
          pause: 'PAUSE',
          alert: 'ALERT',
          scale: 'SCALE',
          notify: 'ALERT',
        };

        recs.push({
          campaignId: campaign.campaign_id,
          campaignName: campaign.campaign_name,
          type: rule.actionType === 'scale' ? 'OPPORTUNITY' : 'ALERT',
          priority: rule.priority === 'high' ? 'HIGH' : rule.priority === 'medium' ? 'MEDIUM' : 'LOW',
          title: `📋 ${rule.name}`,
          message: `Regra "${rule.name}" disparada: ${rule.metric} = ${metricValue.toFixed(2)} ${rule.operator} ${rule.threshold}`,
          actionType: actionMap[rule.actionType] ?? 'REVIEW',
          metricsSnapshot: this.buildSnapshot(campaign),
        });
      }
    }

    return recs;
  }

  private getMetricValue(campaign: MetaCampaignInsight, metric: string): number | null {
    switch (metric) {
      case 'cpa': return campaign.purchases > 0 ? campaign.spend / campaign.purchases : null;
      case 'roas': return campaign.roas;
      case 'spend': return campaign.spend;
      case 'ctr': return campaign.ctr;
      case 'cpc': return campaign.cpc;
      case 'purchases': return campaign.purchases;
      default: return null;
    }
  }

  private evaluateCondition(value: number, operator: string, threshold: number): boolean {
    switch (operator) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'gte': return value >= threshold;
      case 'lte': return value <= threshold;
      case 'eq': return Math.abs(value - threshold) < 0.01;
      default: return false;
    }
  }

  private buildSnapshot(campaign: MetaCampaignInsight) {
    return {
      spend: campaign.spend,
      roas: campaign.roas,
      cpa: campaign.purchases > 0 ? campaign.spend / campaign.purchases : 0,
      ctr: campaign.ctr,
      purchases: campaign.purchases,
      frequency: campaign.frequency,
    };
  }

  // =====================================================
  // BANCO DE DADOS — Load / Save
  // =====================================================

  private async loadSettings(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('ads_user_settings')
        .select('*')
        .limit(1)
        .single();

      if (data) {
        this.settings = {
          maxCpa: data.max_cpa ?? DEFAULT_SETTINGS.maxCpa,
          minRoas: data.min_roas ?? DEFAULT_SETTINGS.minRoas,
          maxFrequency: data.max_frequency ?? DEFAULT_SETTINGS.maxFrequency,
          minCtr: data.min_ctr ?? DEFAULT_SETTINGS.minCtr,
          maxSpendWithoutPurchase: data.max_spend_without_purchase ?? DEFAULT_SETTINGS.maxSpendWithoutPurchase,
          autoPauseBleeders: data.auto_pause_bleeders ?? DEFAULT_SETTINGS.autoPauseBleeders,
          autoScaleWinners: data.auto_scale_winners ?? DEFAULT_SETTINGS.autoScaleWinners,
          scaleIncrementPercent: data.scale_increment_percent ?? DEFAULT_SETTINGS.scaleIncrementPercent,
        };
      }
    } catch {
      logger.warn('⚠️ Usando settings padrão');
    }
  }

  private async loadRules(): Promise<void> {
    try {
      const { data } = await this.supabase
        .from('ads_alert_rules')
        .select('*')
        .eq('is_active', true);

      if (data) {
        this.rules = data.map((r: Record<string, unknown>) => ({
          id: r.id as string,
          name: r.rule_name as string,
          ruleType: r.rule_type as AuditRule['ruleType'],
          metric: r.metric as AuditRule['metric'],
          operator: r.operator as AuditRule['operator'],
          threshold: r.threshold as number,
          actionType: r.action_type as AuditRule['actionType'],
          priority: r.priority as AuditRule['priority'],
          isActive: true,
          applyCampaigns: r.apply_to_campaigns as string[] | undefined,
        }));
      }
    } catch {
      logger.warn('⚠️ Sem regras custom no banco');
    }
  }

  private async saveInsightsSnapshot(campaign: MetaCampaignInsight): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const hour = new Date().getHours();

      await this.supabase.from('ads_insights_snapshot').upsert({
        meta_campaign_id: campaign.campaign_id,
        date_start: today,
        date_stop: today,
        snapshot_hour: hour,
        impressions: campaign.impressions,
        reach: campaign.reach,
        clicks: campaign.clicks,
        spend: campaign.spend,
        cpm: campaign.cpm,
        cpc: campaign.cpc,
        ctr: campaign.ctr,
        purchases: campaign.purchases,
        purchase_value: campaign.purchaseValue,
        cpa: campaign.purchases > 0 ? campaign.spend / campaign.purchases : null,
        roas: campaign.roas,
        frequency: campaign.frequency,
      }, { onConflict: 'meta_campaign_id,date_start,date_stop,snapshot_hour' });
    } catch (error) {
      logger.error('❌ Erro ao salvar snapshot:', error);
    }
  }

  private async saveRecommendations(recs: AuditRecommendation[]): Promise<void> {
    try {
      const rows = recs.map(r => ({
        meta_campaign_id: r.campaignId,
        type: r.type,
        priority: r.priority,
        title: r.title,
        message: r.message,
        action_type: r.actionType,
        action_params: r.actionParams ?? null,
        triggered_by_rule: null,
        metrics_snapshot: r.metricsSnapshot,
        status: 'PENDING',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      }));

      await this.supabase.from('ads_recommendations').insert(rows);
    } catch (error) {
      logger.error('❌ Erro ao salvar recomendações:', error);
    }
  }

  private async logAuditStart(): Promise<void> {
    try {
      await this.supabase.from('ads_audit_log').insert({
        audit_run_id: this.auditRunId,
        started_at: new Date().toISOString(),
        status: 'RUNNING',
      });
    } catch { /* non-critical */ }
  }

  private async logAuditComplete(
    campaignsAnalyzed: number,
    alertsGenerated: number,
    opportunitiesFound: number,
    errorsCount: number,
    durationMs: number,
    status: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      await this.supabase.from('ads_audit_log').update({
        completed_at: new Date().toISOString(),
        campaigns_analyzed: campaignsAnalyzed,
        alerts_generated: alertsGenerated,
        opportunities_found: opportunitiesFound,
        errors_count: errorsCount,
        duration_ms: durationMs,
        status,
        error_message: errorMessage,
      }).eq('audit_run_id', this.auditRunId);
    } catch { /* non-critical */ }
  }
}

// =====================================================
// FUNÇÃO HELPER — executar auditoria
// =====================================================

export async function runCampaignAudit(): Promise<AuditResult> {
  const accessToken = process.env.META_ACCESS_TOKEN || process.env.FACEBOOK_ACCESS_TOKEN || '';
  let adAccountId = process.env.META_AD_ACCOUNT_ID || process.env.FACEBOOK_AD_ACCOUNT_ID || '';

  // Tentar buscar do banco
  try {
    const supabase = createServiceClient();
    const { data } = await supabase
      .from('integration_settings')
      .select('meta_ad_account_id')
      .eq('is_default', true)
      .limit(1)
      .single();
    if (data?.meta_ad_account_id) adAccountId = data.meta_ad_account_id;
  } catch { /* usa env */ }

  if (!accessToken || !adAccountId) {
    throw new Error('Meta Ads credentials not configured');
  }

  const auditor = new AdsAuditor(accessToken, adAccountId);
  return auditor.runAudit();
}
