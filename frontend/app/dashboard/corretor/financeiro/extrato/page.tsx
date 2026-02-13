'use client';

import FinanceiroPanel from '../../components/FinanceiroPanel';
import { useCorretorId } from '../../hooks/useCorretorToken';

export default function ExtratoPage() {
  const corretorId = useCorretorId();

  if (!corretorId) return null;

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <FinanceiroPanel corretorId={corretorId} />
    </div>
  );
}
