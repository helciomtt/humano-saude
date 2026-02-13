'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { SidebarItem, SubItem } from '@/lib/sidebar-config';
import { sidebarItems } from '@/lib/sidebar-config';

// ═══════════════════════════════════════════
// Hook: Sidebar navigation state
// ═══════════════════════════════════════════

export function useSidebarNav() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [userToggles, setUserToggles] = useState<Record<string, boolean>>({});
  const pathname = usePathname();
  const router = useRouter();
  const prevPathname = useRef(pathname);

  // Limpar toggles manuais ao navegar
  useEffect(() => {
    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      setUserToggles({});
    }
  }, [pathname]);

  const isActive = useCallback(
    (href: string) => pathname === href,
    [pathname],
  );

  const isHrefMatch = useCallback(
    (href: string) => pathname === href || pathname.startsWith(href + '/'),
    [pathname],
  );

  const isChildActiveHref = useCallback(
    (href: string, siblings: SubItem[]) => {
      if (pathname === href) return true;
      if (!pathname.startsWith(href + '/')) return false;
      const longerMatch = siblings.some(
        (s) =>
          s.href !== href &&
          s.href.length > href.length &&
          (pathname === s.href || pathname.startsWith(s.href + '/')),
      );
      return !longerMatch;
    },
    [pathname],
  );

  const isChildActive = useCallback(
    (item: SidebarItem) => item.children?.some((c) => isHrefMatch(c.href)) ?? false,
    [isHrefMatch],
  );

  const isMenuOpen = useCallback(
    (item: SidebarItem) => {
      if (userToggles[item.id] !== undefined) return userToggles[item.id];
      return isChildActive(item);
    },
    [userToggles, isChildActive],
  );

  const toggleMenu = useCallback(
    (id: string) => {
      setUserToggles((prev) => ({
        ...prev,
        [id]: !isMenuOpen(sidebarItems.find((i) => i.id === id)!),
      }));
    },
    [isMenuOpen],
  );

  const handleLogout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      /* redirect anyway */
    }
    router.push('/admin-login');
  }, [router]);

  return {
    isExpanded,
    setIsExpanded,
    isMobileOpen,
    setIsMobileOpen,
    isActive,
    isChildActiveHref,
    isChildActive,
    isMenuOpen,
    toggleMenu,
    handleLogout,
  };
}

// ═══════════════════════════════════════════
// Hook: Convite corretor modal
// ═══════════════════════════════════════════

export function useSidebarConvite() {
  const [showConvite, setShowConvite] = useState(false);
  const [conviteEmail, setConviteEmail] = useState('');
  const [conviteLoading, setConviteLoading] = useState(false);
  const [conviteStatus, setConviteStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [conviteMsg, setConviteMsg] = useState('');

  const handleEnviarConvite = useCallback(async () => {
    if (!conviteEmail.trim()) return;
    setConviteLoading(true);
    setConviteStatus('idle');
    try {
      const res = await fetch('/api/corretor/convite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: conviteEmail.trim(), nomeConvidante: 'Humano Saúde' }),
      });
      const data = await res.json();
      if (data.success) {
        setConviteStatus('success');
        setConviteMsg('Convite enviado com sucesso!');
        setConviteEmail('');
        setTimeout(() => {
          setShowConvite(false);
          setConviteStatus('idle');
        }, 2500);
      } else {
        setConviteStatus('error');
        setConviteMsg(data.error || 'Erro ao enviar convite');
      }
    } catch {
      setConviteStatus('error');
      setConviteMsg('Erro de conexão');
    } finally {
      setConviteLoading(false);
    }
  }, [conviteEmail]);

  const closeConvite = useCallback(() => {
    setShowConvite(false);
    setConviteStatus('idle');
  }, []);

  return {
    showConvite,
    setShowConvite,
    conviteEmail,
    setConviteEmail,
    conviteLoading,
    conviteStatus,
    conviteMsg,
    handleEnviarConvite,
    closeConvite,
  };
}
