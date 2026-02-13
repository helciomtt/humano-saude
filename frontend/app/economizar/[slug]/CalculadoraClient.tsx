'use client';

import CalculadoraEconomia from '../components/CalculadoraEconomia';
import type { CorretorPublico } from '@/app/actions/leads-indicacao';

export default function CalculadoraClient({
  corretor,
}: {
  corretor: CorretorPublico;
}) {
  return <CalculadoraEconomia corretor={corretor} />;
}
