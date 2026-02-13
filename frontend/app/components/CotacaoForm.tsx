'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, Plus, X } from 'lucide-react';
import { apiService, CotacaoInput } from '../services/api';

interface CotacaoFormProps {
  onCalculate: (result: any) => void;
  onLoading: (loading: boolean) => void;
  idadesIniciais?: number[];
  operadoraInicial?: string;
  tipoInicial?: string;
}

export default function CotacaoForm({ 
  onCalculate, 
  onLoading,
  idadesIniciais = [],
  operadoraInicial = '',
  tipoInicial = 'ADESAO'
}: CotacaoFormProps) {
  const [idades, setIdades] = useState<string[]>(['']);
  const [tipo, setTipo] = useState(tipoInicial);
  const [operadora, setOperadora] = useState('');
  const [operadoras, setOperadoras] = useState<string[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    // Carregar operadoras disponíveis via proxy
    apiService.listarOperadorasProxy().then(setOperadoras).catch(console.error);
  }, []);

  // Atualizar quando receber idades do PDF
  useEffect(() => {
    if (idadesIniciais && idadesIniciais.length > 0) {
      setIdades(idadesIniciais.map(String));
    }
  }, [idadesIniciais]);

  // Atualizar quando receber operadora do PDF
  useEffect(() => {
    if (operadoraInicial) {
      setOperadora(operadoraInicial);
    }
  }, [operadoraInicial]);

  // Atualizar quando receber tipo do PDF
  useEffect(() => {
    if (tipoInicial) {
      setTipo(tipoInicial);
    }
  }, [tipoInicial]);

  const adicionarIdade = () => {
    setIdades([...idades, '']);
  };

  const removerIdade = (index: number) => {
    setIdades(idades.filter((_, i) => i !== index));
  };

  const atualizarIdade = (index: number, value: string) => {
    const newIdades = [...idades];
    newIdades[index] = value;
    setIdades(newIdades);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validações
    const idadesValidas = idades.filter((i) => i.trim() !== '').map(Number);

    if (idadesValidas.length === 0) {
      setError('Adicione pelo menos uma idade');
      return;
    }

    if (idadesValidas.some((i) => isNaN(i) || i < 0 || i > 120)) {
      setError('Idades devem ser números entre 0 e 120');
      return;
    }

    if (!operadora) {
      setError('Selecione uma operadora');
      return;
    }

    const input: CotacaoInput = {
      idades: idadesValidas,
      tipo,
      operadora,
    };

    try {
      onLoading(true);
      const resultado = await apiService.calcularCotacaoProxy(input);
      onCalculate(resultado);
    } catch (err: any) {
      setError(err.message || 'Erro ao calcular cotação');
    } finally {
      onLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Nova Cotação
        </CardTitle>
        <CardDescription>Preencha os dados para calcular a cotação</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Idades */}
          <div className="space-y-3">
            <Label>Idades dos Beneficiários</Label>
            {idades.map((idade, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  type="number"
                  placeholder="Digite a idade"
                  value={idade}
                  onChange={(e) => atualizarIdade(index, e.target.value)}
                  min="0"
                  max="120"
                />
                {idades.length > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => removerIdade(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={adicionarIdade}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Beneficiário
            </Button>
          </div>

          {/* Tipo de Contratação */}
          <div className="space-y-2">
            <Label>Tipo de Contratação</Label>
            <Select value={tipo} onValueChange={setTipo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ADESAO">Adesão</SelectItem>
                <SelectItem value="PME">PME</SelectItem>
                <SelectItem value="EMPRESARIAL">Empresarial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Operadora */}
          <div className="space-y-2">
            <Label>Operadora</Label>
            <Select value={operadora} onValueChange={setOperadora}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a operadora" />
              </SelectTrigger>
              <SelectContent>
                {operadoras.map((op) => (
                  <SelectItem key={op} value={op}>
                    {op}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm">{error}</div>
          )}

          {/* Submit */}
          <Button type="submit" className="w-full">
            <Calculator className="mr-2 h-4 w-4" />
            Calcular Cotação
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
