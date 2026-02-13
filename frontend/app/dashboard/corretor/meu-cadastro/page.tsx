'use client';

import { useCorretorId } from '../hooks/useCorretorToken';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import CadastroPanel from '../components/CadastroPanel';

export default function MeuCadastroPage() {
  const corretorId = useCorretorId();
  const router = useRouter();

  useEffect(() => {
    if (corretorId === null) {
      router.replace('/admin-login');
    }
  }, [corretorId, router]);

  if (!corretorId) return null;

  return <CadastroPanel corretorId={corretorId} />;
}
