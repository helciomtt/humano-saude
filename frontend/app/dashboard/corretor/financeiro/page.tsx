'use client';

import ProducoesPanel from '../components/ProducoesPanel';
import { useCorretorId } from '../hooks/useCorretorToken';

export default function ProducoesPage() {
  const corretorId = useCorretorId();

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <ProducoesPanel corretorId={corretorId} />
    </div>
  );
}
