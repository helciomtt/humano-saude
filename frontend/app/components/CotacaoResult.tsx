'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, DollarSign, Percent } from 'lucide-react';
import { CotacaoOutput } from '../services/api';

interface CotacaoResultProps {
  resultado: CotacaoOutput;
}

export default function CotacaoResult({ resultado }: CotacaoResultProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      {/* Card Principal */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Resultado da Cotação</span>
            <Badge variant="secondary">{resultado.operadora}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informações Gerais */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Beneficiários:</span>
              <span className="font-semibold">{resultado.quantidade_beneficiarios}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tipo:</span>
              <span className="font-semibold ml-2">{resultado.tipo_contratacao}</span>
            </div>
          </div>

          <Separator />

          {/* Valores Individuais */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Valores por Beneficiário:</h4>
            {resultado.valores_individuais.map((valor, index) => (
              <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                <div>
                  <span className="font-medium">{valor.idade} anos</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({valor.faixa_etaria})
                  </span>
                </div>
                <span className="font-semibold">{formatCurrency(valor.valor)}</span>
              </div>
            ))}
          </div>

          <Separator />

          {/* Valores Totais */}
          <div className="space-y-3">
            <div className="flex justify-between text-muted-foreground">
              <span>Subtotal:</span>
              <span>{formatCurrency(resultado.valor_total)}</span>
            </div>

            {resultado.desconto_aplicado > 0 && (
              <div className="flex justify-between text-green-600">
                <span className="flex items-center gap-1">
                  <Percent className="h-4 w-4" />
                  Desconto:
                </span>
                <span>-{formatCurrency(resultado.desconto_aplicado)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between items-center text-lg font-bold">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Valor Final:
              </span>
              <span className="text-primary">{formatCurrency(resultado.valor_final)}</span>
            </div>
          </div>

          {/* Observações */}
          {resultado.observacoes && resultado.observacoes.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Observações:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  {resultado.observacoes.map((obs, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
