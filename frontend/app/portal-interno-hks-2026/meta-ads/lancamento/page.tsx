'use client';

// =====================================================
// PAGE: /portal-interno-hks-2026/meta-ads/lancamento
// Formulário de lançamento de campanhas + gerador de copy
// =====================================================

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CampaignLauncher from '@/app/components/ads/CampaignLauncher';
import CopyGenerator from '@/app/components/ads/CopyGenerator';
import AdsHealthStatus from '@/app/components/ads/AdsHealthStatus';

export default function MetaAdsLancamentoPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1
          className="text-4xl font-bold text-[#D4AF37]"
          style={{ fontFamily: 'Perpetua Titling MT, serif' }}
        >
          META ADS — LANÇAMENTO
        </h1>
        <p className="mt-2 text-gray-400">
          Crie campanhas e gere copy com inteligência artificial
        </p>
      </div>

      {/* Status de conexão */}
      <AdsHealthStatus />

      {/* Tabs: Lançar / Copy */}
      <Tabs defaultValue="lancamento" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lancamento">🚀 Lançar Campanha</TabsTrigger>
          <TabsTrigger value="copy">✨ Gerar Copy IA</TabsTrigger>
        </TabsList>

        <TabsContent value="lancamento" className="mt-4">
          <CampaignLauncher />
        </TabsContent>

        <TabsContent value="copy" className="mt-4">
          <CopyGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
