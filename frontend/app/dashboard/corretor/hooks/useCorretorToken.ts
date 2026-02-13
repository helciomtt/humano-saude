'use client';

import { useState, useEffect } from 'react';
import { decodeTokenUnsafe } from '@/lib/auth-jwt';

interface TokenPayload {
  id?: string;
  corretor_id?: string;
  email: string;
  role: string;
  exp?: number;
}

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? match[2] : null;
}

/**
 * Decodifica token JWT no client-side.
 * Sem verificação de assinatura — middleware já validou.
 */
function decodeToken(token: string): TokenPayload | null {
  const payload = decodeTokenUnsafe(token);
  if (!payload) return null;
  return {
    id: payload.corretor_id,
    corretor_id: payload.corretor_id,
    email: payload.email,
    role: payload.role,
    exp: payload.exp,
  };
}

/**
 * Hook para extrair o corretor_id do cookie token.
 * Retorna o UUID do corretor (não o token bruto).
 */
export function useCorretorId(): string {
  const [corretorId, setCorretorId] = useState<string>('');

  useEffect(() => {
    const token = getCookie('corretor_token');
    if (!token) return;

    const decoded = decodeToken(token);
    if (decoded?.corretor_id) {
      setCorretorId(decoded.corretor_id);
    }
  }, []);

  return corretorId;
}

/**
 * Decode token JWT no lado do servidor (server component).
 */
export function decodeCorretorTokenServer(token: string): TokenPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return {
      id: payload.corretor_id,
      corretor_id: payload.corretor_id,
      email: payload.email,
      role: payload.role,
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}

/**
 * Extrai corretor_id do cookie no client-side (browser).
 */
export function getCorretorIdFromCookie(): string {
  const token = getCookie('corretor_token');
  if (!token) return '';
  const decoded = decodeToken(token);
  return decoded?.corretor_id || '';
}
