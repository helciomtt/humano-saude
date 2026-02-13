import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ========================================
// FORMAT HELPERS
// ========================================

/**
 * Formata número como moeda brasileira (ou outra).
 * @example formatCurrency(1500) → "R$ 1.500,00"
 */
export function formatCurrency(value: number, currency: string = 'BRL') {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency,
  }).format(value)
}

/**
 * Formata data em diferentes formatos.
 * - 'short': "13/02/2026"
 * - 'long': "13 de fevereiro de 2026 14:30"
 * - 'relative': "Hoje", "Ontem", "3 dias atrás", "2 semanas atrás"
 */
export function formatDate(date: string | Date, format: 'short' | 'long' | 'relative' = 'short') {
  const d = new Date(date)

  if (format === 'relative') {
    const now = new Date()
    const diffInMs = now.getTime() - d.getTime()
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return 'Hoje'
    if (diffInDays === 1) return 'Ontem'
    if (diffInDays < 7) return `${diffInDays} dias atrás`
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} semanas atrás`
    return `${Math.floor(diffInDays / 30)} meses atrás`
  }

  if (format === 'long') {
    return new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'long',
      timeStyle: 'short',
    }).format(d)
  }

  return new Intl.DateTimeFormat('pt-BR').format(d)
}

/**
 * Extrai iniciais de um nome (máximo 2 caracteres).
 * @example getInitials("Helcio Mattos") → "HM"
 */
export function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Trunca string com reticências.
 * @example truncate("Um texto longo", 10) → "Um texto l..."
 */
export function truncate(str: string, length: number) {
  if (str.length <= length) return str
  return str.slice(0, length) + '...'
}

/**
 * Debounce genérico — atrasa a execução até `wait` ms após a última chamada.
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}
