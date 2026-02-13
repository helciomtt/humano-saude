'use client';

import { useEffect, useState } from 'react';
import { useCorretorId } from '../hooks/useCorretorToken';
import { useRouter } from 'next/navigation';
import IndicacoesPanel from '../components/IndicacoesPanel';
import { getCorretorBySlug } from '@/app/actions/leads-indicacao';

export default function IndicacoesPage() {
  const corretorId = useCorretorId();
  const router = useRouter();
  const [slug, setSlug] = useState<string | undefined>();

  useEffect(() => {
    if (corretorId === null) {
      router.replace('/admin-login');
      return;
    }

    // Buscar slug do corretor
    async function fetchSlug() {
      if (!corretorId) return;
      const res = await fetch('/api/corretor/perfil');
      const data = await res.json();
      if (data?.corretor?.slug) {
        setSlug(data.corretor.slug);
      }
    }
    fetchSlug();
  }, [corretorId, router]);

  if (!corretorId) return null;

  return <IndicacoesPanel corretorId={corretorId} slug={slug} />;
}
