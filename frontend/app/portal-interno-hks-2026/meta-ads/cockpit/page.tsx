'use client';

// =====================================================
// PAGE: /portal-interno-hks-2026/meta-ads/cockpit
// Dashboard completo Meta Ads com dados da Marketing API
// =====================================================

import CockpitDashboard from '@/app/components/ads/CockpitDashboard';

export default function MetaAdsCockpitPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-[#D4AF37]/20 pb-6">
        <h1
          className="text-4xl font-bold text-[#D4AF37]"
          style={{ fontFamily: 'Perpetua Titling MT, serif' }}
        >
          META ADS — COCKPIT
        </h1>
        <p className="mt-2 text-gray-400">
          Performance em tempo real das campanhas Facebook &amp; Instagram
        </p>
      </div>

      <CockpitDashboard />
    </div>
  );
}
