// =====================================================
// GOOGLE ANALYTICS 4 — Biblioteca Completa
// Blueprint 12 — Humano Saúde
// 14 funções GA4 (Reports + Realtime + Outbound + Video)
// =====================================================

import { BetaAnalyticsDataClient } from '@google-analytics/data';
import { logger } from '@/lib/logger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GA4Row = any;

// =====================================================
// CONFIGURAÇÃO & AUTENTICAÇÃO
// =====================================================

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID;

function getCredentials(): { client_email?: string; private_key?: string } | null {
  // Método 1: JSON completo (recomendado para Vercel)
  const rawJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (rawJson) {
    try {
      const creds = JSON.parse(rawJson);
      if (creds.private_key?.includes('\\n')) {
        creds.private_key = creds.private_key.replace(/\\n/g, '\n');
      }
      return creds;
    } catch {
      logger.error('❌ Erro ao parsear GOOGLE_APPLICATION_CREDENTIALS_JSON');
    }
  }

  // Método 2: Variáveis separadas
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL?.trim();
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (clientEmail && privateKey) {
    return { client_email: clientEmail, private_key: privateKey };
  }

  return null;
}

function getClient(): BetaAnalyticsDataClient | null {
  const creds = getCredentials();
  if (!creds || !GA4_PROPERTY_ID) return null;

  try {
    return new BetaAnalyticsDataClient({
      credentials: creds,
      projectId: process.env.GOOGLE_PROJECT_ID,
    });
  } catch (error) {
    logger.error('❌ Erro ao criar GA4 client:', error);
    return null;
  }
}

function getProperty(): string {
  return `properties/${GA4_PROPERTY_ID}`;
}

export function isGA4Available(): boolean {
  return !!GA4_PROPERTY_ID && getCredentials() !== null;
}

// =====================================================
// HELPERS
// =====================================================

function formatGA4Date(dateStr: string): string {
  if (dateStr.length === 8) {
    const day = dateStr.slice(6, 8);
    const month = dateStr.slice(4, 6);
    return `${day}/${month}`;
  }
  return dateStr;
}

function normalizeDate(input: string | null): string | null {
  if (!input) return null;
  // Accept ISO or "YYYY-MM-DD"
  if (/^\d{4}-\d{2}-\d{2}/.test(input)) return input.slice(0, 10);
  return input;
}

type DateRangeInput = { startDate: string; endDate: string };
function buildDateRanges(start: string | null, end: string | null, defaultRange: string = '7daysAgo'): DateRangeInput[] {
  if (start && end) return [{ startDate: start, endDate: end }];
  return [{ startDate: defaultRange, endDate: 'today' }];
}

const SOURCE_COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'];

// =====================================================
// 1. getKPIs — Totais gerais
// =====================================================

export async function getKPIs(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return null;

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
      { name: 'eventCount' },
      { name: 'sessions' },
    ],
  });

  const row = response.rows?.[0];
  return {
    totalUsers: parseInt(row?.metricValues?.[0]?.value ?? '0'),
    totalViews: parseInt(row?.metricValues?.[1]?.value ?? '0'),
    totalEvents: parseInt(row?.metricValues?.[2]?.value ?? '0'),
    totalSessions: parseInt(row?.metricValues?.[3]?.value ?? '0'),
  };
}

// =====================================================
// 2. getTrafficData — Tráfego diário (para gráfico)
// =====================================================

export async function getTrafficData(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'date' }],
    metrics: [
      { name: 'activeUsers' },
      { name: 'screenPageViews' },
    ],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
  });

  return (response.rows || []).map((row: GA4Row) => ({
    date: formatGA4Date(row.dimensionValues?.[0]?.value ?? ''),
    usuarios: parseInt(row.metricValues?.[0]?.value ?? '0'),
    visualizacoes: parseInt(row.metricValues?.[1]?.value ?? '0'),
  }));
}

// =====================================================
// 3. getTrafficSources — Fontes de tráfego (6 cores)
// =====================================================

export async function getTrafficSources(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'sessionDefaultChannelGroup' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  return (response.rows || []).map((row: GA4Row, i: number) => ({
    source: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    color: SOURCE_COLORS[i % SOURCE_COLORS.length],
  }));
}

// =====================================================
// 4. getTopPages — Top 10 páginas
// =====================================================

export async function getTopPages(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'pageTitle' }],
    metrics: [{ name: 'screenPageViews' }],
    orderBys: [{ metric: { metricName: 'screenPageViews' }, desc: true }],
    limit: 10,
  });

  return (response.rows || []).map((row: GA4Row) => ({
    title: row.dimensionValues?.[0]?.value ?? 'Sem título',
    views: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));
}

// =====================================================
// 5. getTopCountries — Top 5 países
// =====================================================

export async function getTopCountries(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'country' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 5,
  });

  return (response.rows || [])
    .map((row: GA4Row) => ({
      country: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((c: { country: string }) => c.country !== '(not set)');
}

// =====================================================
// 6. getTopCities — Top 10 cidades
// =====================================================

export async function getTopCities(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'city' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 12,
  });

  return (response.rows || [])
    .map((row: GA4Row) => ({
      city: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((c: { city: string }) => c.city !== '(not set)')
    .slice(0, 10);
}

// =====================================================
// 7. getDevices — desktop/mobile/tablet
// =====================================================

export async function getDevices(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'deviceCategory' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
  });

  return (response.rows || []).map((row: GA4Row) => ({
    device: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));
}

// =====================================================
// 8. getBrowsers — Chrome, Safari, etc.
// =====================================================

export async function getBrowsers(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'browser' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
    limit: 6,
  });

  return (response.rows || []).map((row: GA4Row) => ({
    browser: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));
}

// =====================================================
// 9. getAgeGroups — Faixas etárias
// =====================================================

export async function getAgeGroups(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return [];

  const dateRanges = buildDateRanges(start ?? null, end ?? null);

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'userAgeBracket' }],
    metrics: [{ name: 'activeUsers' }],
    orderBys: [{ dimension: { dimensionName: 'userAgeBracket' }, desc: false }],
  });

  return (response.rows || [])
    .map((row: GA4Row) => ({
      age: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((a: { age: string }) => a.age !== '(not set)');
}

// =====================================================
// 10. getRealtimeData — Usuários ativos agora
// =====================================================

export async function getRealtimeData() {
  const client = getClient();
  if (!client) return null;

  const [response] = await client.runRealtimeReport({
    property: getProperty(),
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
    pages: rows.map((row: GA4Row) => ({
      page: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    })),
  };
}

// =====================================================
// 11. getRealtimeDetailed — Realtime com cidade + device + country
// =====================================================

export async function getRealtimeDetailed() {
  const client = getClient();
  if (!client) return null;

  const [citiesRes, devicesRes, countriesRes] = await Promise.all([
    client.runRealtimeReport({
      property: getProperty(),
      dimensions: [{ name: 'city' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 10,
    }),
    client.runRealtimeReport({
      property: getProperty(),
      dimensions: [{ name: 'deviceCategory' }],
      metrics: [{ name: 'activeUsers' }],
    }),
    client.runRealtimeReport({
      property: getProperty(),
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      limit: 5,
    }),
  ]);

  const cities = (citiesRes[0].rows || [])
    .map((row: GA4Row) => ({
      city: row.dimensionValues?.[0]?.value ?? 'Unknown',
      users: parseInt(row.metricValues?.[0]?.value ?? '0'),
    }))
    .filter((c: { city: string }) => c.city !== '(not set)');

  const devices = (devicesRes[0].rows || []).map((row: GA4Row) => ({
    device: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));

  const countries = (countriesRes[0].rows || []).map((row: GA4Row) => ({
    country: row.dimensionValues?.[0]?.value ?? 'Unknown',
    users: parseInt(row.metricValues?.[0]?.value ?? '0'),
  }));

  const totalActive = cities.reduce((s: number, c: { users: number }) => s + c.users, 0) ||
    devices.reduce((s: number, d: { users: number }) => s + d.users, 0);

  return { activeUsers: totalActive, cities, devices, countries };
}

// =====================================================
// 12. getOutboundClicks — Links de saída
// =====================================================

export async function getOutboundClicks(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return null;

  const dateRanges = buildDateRanges(start ?? null, end ?? null, '30daysAgo');

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'linkUrl' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'click', matchType: 'EXACT' as const },
      },
    },
    orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
    limit: 50,
  });

  const summary = { whatsapp: 0, appstore: 0, playstore: 0, external: 0, total: 0 };

  const clicks = (response.rows || [])
    .map((row: GA4Row) => {
      const url = (row.dimensionValues?.[0]?.value ?? '').toLowerCase();
      const count = parseInt(row.metricValues?.[0]?.value ?? '0');

      let category: 'whatsapp' | 'appstore' | 'playstore' | 'external' = 'external';
      if (url.includes('wa.me') || url.includes('whatsapp')) category = 'whatsapp';
      else if (url.includes('apps.apple.com')) category = 'appstore';
      else if (url.includes('play.google.com')) category = 'playstore';

      summary[category] += count;
      summary.total += count;

      return {
        url: row.dimensionValues?.[0]?.value ?? '',
        clicks: count,
        category,
      };
    })
    .filter((c: { url: string }) => {
      const u = c.url.toLowerCase();
      return !u.includes(process.env.NEXT_PUBLIC_SITE_URL || 'humanosaude.com');
    });

  return { clicks, summary };
}

// =====================================================
// 13. getVideoEvents — Eventos de vídeo
// =====================================================

export async function getVideoEvents(start?: string | null, end?: string | null) {
  const client = getClient();
  if (!client) return null;

  const dateRanges = buildDateRanges(start ?? null, end ?? null, '30daysAgo');

  const [response] = await client.runReport({
    property: getProperty(),
    dateRanges,
    dimensions: [{ name: 'eventName' }],
    metrics: [{ name: 'eventCount' }],
    dimensionFilter: {
      filter: {
        fieldName: 'eventName',
        stringFilter: { value: 'video', matchType: 'BEGINS_WITH' as const },
      },
    },
  });

  let videoStart = 0;
  let videoProgress = 0;
  let videoComplete = 0;

  (response.rows || []).forEach((row: GA4Row) => {
    const event = row.dimensionValues?.[0]?.value ?? '';
    const count = parseInt(row.metricValues?.[0]?.value ?? '0');
    if (event === 'video_start') videoStart += count;
    else if (event === 'video_progress') videoProgress += count;
    else if (event === 'video_complete') videoComplete += count;
  });

  return { videoStart, videoProgress, videoComplete };
}

// =====================================================
// EXPORT — normalizeDate para uso nos endpoints
// =====================================================

export { normalizeDate };
