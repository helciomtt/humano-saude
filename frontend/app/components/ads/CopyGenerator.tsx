'use client';

// =====================================================
// COMPONENT: CopyGenerator — Gerador de Copy com IA
// Interface para /api/ads/copy
// =====================================================

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Sparkles, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface GeneratedCopy {
  primaryText: string[];
  headlines: string[];
  imageUrl: string;
  metadata?: Record<string, unknown>;
}

const OBJECTIVES = [
  { value: 'CONVERSAO', label: 'Conversão' },
  { value: 'LEADS', label: 'Leads' },
  { value: 'TRAFEGO', label: 'Tráfego' },
  { value: 'ENGAJAMENTO', label: 'Engajamento' },
  { value: 'ALCANCE', label: 'Alcance' },
];

const AUDIENCES = [
  { value: 'Empresas PME', label: 'Empresas PME' },
  { value: 'Plano Familiar', label: 'Famílias' },
  { value: 'Profissionais Autônomos', label: 'Autônomos / MEI' },
  { value: 'Médicos e Dentistas', label: 'Médicos e Dentistas' },
];

export default function CopyGenerator() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeneratedCopy | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [userPrompt, setUserPrompt] = useState('');
  const [objective, setObjective] = useState('CONVERSAO');
  const [audience, setAudience] = useState('Empresas PME');

  async function handleGenerate() {
    setLoading(true);
    setResult(null);

    try {
      const body: Record<string, string> = { objective, audience };
      if (userPrompt.trim()) body.userPrompt = userPrompt.trim();

      const res = await fetch('/api/ads/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao gerar copy');

      setResult(data.copy || data.data);
      toast.success('Copy gerada com sucesso!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro');
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, index: number) {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    toast.success('Copiado!');
    setTimeout(() => setCopiedIndex(null), 2000);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-500" />
          Gerador de Copy IA
        </CardTitle>
        <CardDescription>
          GPT-4o gera textos otimizados para seus anúncios
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt livre */}
        <div className="space-y-1.5">
          <Label htmlFor="user-prompt">
            Descreva o que precisa (opcional)
          </Label>
          <Textarea
            id="user-prompt"
            rows={3}
            placeholder='Ex: "Quero anúncio focado em economia para empresas com 10 a 50 funcionários..."'
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
          />
        </div>

        {/* Objetivo + Público */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Objetivo</Label>
            <Select value={objective} onValueChange={setObjective}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {OBJECTIVES.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Público</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => (
                  <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleGenerate} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando copy...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Gerar Copy
            </>
          )}
        </Button>

        {/* Resultados */}
        {result && (
          <div className="space-y-4 border-t pt-4">
            {/* Textos principais */}
            {result.primaryText?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Textos Principais</p>
                {result.primaryText.map((text, i) => (
                  <div key={i} className="group relative rounded-md border bg-muted/50 p-3">
                    <p className="whitespace-pre-wrap text-sm pr-8">{text}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(text, i)}
                    >
                      {copiedIndex === i ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Headlines */}
            {result.headlines?.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Títulos</p>
                {result.headlines.map((headline, i) => (
                  <div key={i} className="group relative flex items-center rounded-md border bg-muted/50 p-2">
                    <p className="flex-1 text-sm font-medium pr-8">{headline}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => copyToClipboard(headline, 100 + i)}
                    >
                      {copiedIndex === 100 + i ? (
                        <Check className="h-3.5 w-3.5 text-green-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
