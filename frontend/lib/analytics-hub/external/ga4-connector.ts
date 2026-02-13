import { logger } from '@/lib/logger';

// =====================================================
// GA4 CONNECTOR — Google Analytics 4 Data API
// Busca métricas de tráfego, realtime, fontes, geo
// =====================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GA4Row = any;

// =====================================================
// AUTENTICAÇÃO GA4
// =====================================================

function getGA4Credentials(): { clientEmail: string; privateKey: string; propertyId: string } | null {
  const propertyId = process.env.GA4_PROPERTY_ID;
  if (!propertyId) return null;

  // Opção 1: JSON completo
  const jsonCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (jsonCreds) {
    try {
      const creds = JSON.parse(jsonCreds);
      return {
        clientEmail: creds.client_email,
        privateKey: creds.private_key,
        propertyId,
      };
    } catch { /* fallback */ }
  }

  // Opção 2: Variáveis separadas
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (clientEmail && privateKey) {
    return { clientEmail, privateKey, propertyId };
  }

  return null;
}

// =====================================================
// FETCH HELPERS — REST API (sem SDK pesado)
// =====================================================

async function getAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  // Para produção, use a lib @google-analytics/data
  // Este é um placeholder que indica que GA4 precisa de auth
  // Em produção real, isso usaria JWT para gerar o token
  try {
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    // O SDK gerencia auth automaticamente
    return 'sdk-managed';
  } catch {
    logger.warn('⚠️ @google-analytics/data não instalado. GA4 indisponível.');
    return '';
  }
}

// =====================================================
// FUNÇÕES DE DADOS GA4
// =====================================================

export interface GA4TrafficData {
  totalUsers: number;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  dailyData: Array<{ date: string; sessions: number; users: number; pageViews: number }>;
}

export interface GA4SourceData {
  source: string;
  users: number;
  sessions: number;
  color: string;
}

export interface GA4RealtimeData {
  activeUsers: number;
  topPages: Array<{ page: string; users: number }>;
}

const SOURCE_COLORS: Record<string, string> = {
  'Organic Search': '#22c55e',
  'Direct': '#3b82f6',
  'Paid Search': '#f59e0b',
  'Organic Social': '#8b5cf6',
  'Paid Social': '#ec4899',
  'Email': '#14b8a6',
  'Referral': '#f97316',
  'Display': '#6366f1',
};

/**
 * Busca dados de tráfego do GA4
 */
export async function fetchGA4TrafficData(
  startDate: string,
  endDate: string
): Promise<GA4TrafficData | null> {
  const creds = getGA4Credentials();
  if (!creds) return null;

  try {
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');

    const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const clientOptions = credJson
      ? { credentials: JSON.parse(credJson) }
      : {
          credentials: {
            client_email: creds.clientEmail,
            private_key: creds.privateKey,
          },
        };

    const client = new BetaAnalyticsDataClient(clientOptions);

    const [response] = await client.runReport({
      property: `properties/${creds.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'date' }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
      ],
    });

    const rows = response.rows || [];
    let totalUsers = 0;
    let totalSessions = 0;
    let totalPageViews = 0;
    let totalDuration = 0;
    let totalBounce = 0;

    const dailyData = rows.map((row: GA4Row) => {
      const date = row.dimensionValues?.[0]?.value ?? '';
      const users = parseInt(row.metricValues?.[0]?.value ?? '0');
      const sessions = parseInt(row.metricValues?.[1]?.value ?? '0');
      const pageViews = parseInt(row.metricValues?.[2]?.value ?? '0');
      const duration = parseFloat(row.metricValues?.[3]?.value ?? '0');
      const bounce = parseFloat(row.metricValues?.[4]?.value ?? '0');

      totalUsers += users;
      totalSessions += sessions;
      totalPageViews += pageViews;
      totalDuration += duration;
      totalBounce += bounce;

      return { date, sessions, users, pageViews };
    });

    return {
      totalUsers,
      totalSessions,
      totalPageViews,
      avgSessionDuration: rows.length > 0 ? totalDuration / rows.length : 0,
      bounceRate: rows.length > 0 ? totalBounce / rows.length : 0,
      dailyData,
    };
  } catch (error) {
    logger.error('❌ GA4 Traffic Error:', error);
    return null;
  }
}

/**
 * Busca fontes de tráfego
 */
export async function fetchGA4Sources(
  startDate: string,
  endDate: string
): Promise<GA4SourceData[]> {
  const creds = getGA4Credentials();
  if (!creds) return [];

  try {
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const clientOptions = credJson
      ? { credentials: JSON.parse(credJson) }
      : { credentials: { client_email: creds.clientEmail, private_key: creds.privateKey } };

    const client = new BetaAnalyticsDataClient(clientOptions);

    const [response] = await client.runReport({
      property: `properties/${creds.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      limit: 8,
    });

    return (response.rows || []).map((row: GA4Row) => {
      const source = row.dimensionValues?.[0]?.value ?? 'Unknown';
      return {
        source,
        users: parseInt(row.metricValues?.[0]?.value ?? '0'),
        sessions: parseInt(row.metricValues?.[1]?.value ?? '0'),
        color: SOURCE_COLORS[source] || '#94a3b8',
      };
    });
  } catch (error) {
    logger.error('❌ GA4 Sources Error:', error);
    return [];
  }
}

/**
 * Busca dados realtime
 */
export async function fetchGA4Realtime(): Promise<GA4RealtimeData | null> {
  const creds = getGA4Credentials();
  if (!creds) return null;

  try {
    const { BetaAnalyticsDataClient } = await import('@google-analytics/data');
    const credJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
    const clientOptions = credJson
      ? { credentials: JSON.parse(credJson) }
      : { credentials: { client_email: creds.clientEmail, private_key: creds.privateKey } };

    const client = new BetaAnalyticsDataClient(clientOptions);

    const [response] = await client.runRealtimeReport({
      property: `properties/${creds.propertyId}`,
      dimensions: [{ name: 'unifiedScreenName' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 10,
    });

    const rows = response.rows || [];
    const totalActive = rows.reduce(
      (sum: number, row: GA4Row) => sum + parseInt(row.metricValues?.[0]?.value ?? '0'),
      0
    );

    return {
      activeUsers: totalActive,
      topPages: rows.map((row: GA4Row) => ({
        page: row.dimensionValues?.[0]?.value ?? 'Unknown',
        users: parseInt(row.metricValues?.[0]?.value ?? '0'),
      })),
    };
  } catch (error) {
    logger.error('❌ GA4 Realtime Error:', error);
    return null;
  }
}

/**
 * Verifica se GA4 está configurado
 */
export function isGA4Configured(): boolean {
  return getGA4Credentials() !== null;
}
