'use client';

import BannerGenerator from '../../components/BannerGenerator';
import { useCorretorId } from '../../hooks/useCorretorToken';

export default function BannersPage() {
  const corretorId = useCorretorId();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
      <BannerGenerator corretorId={corretorId} />
    </div>
  );
}
