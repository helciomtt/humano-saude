'use client';

import { CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type StageStep = {
  id: string;
  nome: string;
  cor: string;
  posicao: number;
  probabilidade: number;
  is_current: boolean;
  is_completed: boolean;
};

export default function StageProgress({
  stages,
  onStageClick,
}: {
  stages: StageStep[];
  onStageClick?: (stageId: string) => void;
}) {
  if (!stages.length) return null;

  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto py-2 px-1">
      {stages.map((stage, idx) => {
        const isLast = idx === stages.length - 1;

        return (
          <div key={stage.id} className="flex items-center flex-shrink-0">
            {/* Stage dot */}
            <button
              onClick={() => onStageClick?.(stage.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all whitespace-nowrap',
                'border',
                stage.is_current
                  ? 'border-current shadow-lg scale-105'
                  : stage.is_completed
                    ? 'border-transparent opacity-80'
                    : 'border-transparent opacity-40',
                onStageClick && 'cursor-pointer hover:opacity-100',
              )}
              style={{
                backgroundColor: stage.is_current || stage.is_completed
                  ? `${stage.cor}20`
                  : 'transparent',
                color: stage.cor,
                borderColor: stage.is_current ? stage.cor : undefined,
              }}
            >
              {stage.is_completed ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <div
                  className={cn('h-2.5 w-2.5 rounded-full', stage.is_current && 'animate-pulse')}
                  style={{ backgroundColor: stage.cor }}
                />
              )}
              {stage.nome}
              <span className="text-[9px] opacity-60">{stage.probabilidade}%</span>
            </button>

            {/* Connector */}
            {!isLast && (
              <div
                className={cn(
                  'h-px w-4 flex-shrink-0 mx-0.5',
                  stage.is_completed ? 'opacity-60' : 'opacity-20',
                )}
                style={{ backgroundColor: stage.cor }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
