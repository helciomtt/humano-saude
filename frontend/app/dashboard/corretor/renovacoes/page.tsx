'use client';

import RenovacoesPanel from '../components/RenovacoesPanel';
import { useCorretorId } from '../hooks/useCorretorToken';

export default function RenovacoesPage() {
  const corretorId = useCorretorId();

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <RenovacoesPanel corretorId={corretorId} />
    </div>
  );
}
