'use client';

import { useEffect } from 'react';

export function useSmoothScroll() {
  useEffect(() => {
    // Smooth scroll behavior (Lenis-inspired)
    let rafId: number;
    let currentScroll = window.scrollY;
    let targetScroll = window.scrollY;
    const ease = 0.075; // Quanto menor, mais suave (0.05 - 0.15)

    const smoothScroll = () => {
      targetScroll = window.scrollY;
      currentScroll += (targetScroll - currentScroll) * ease;

      if (Math.abs(targetScroll - currentScroll) < 0.5) {
        currentScroll = targetScroll;
      }

      window.scrollTo(0, currentScroll);

      rafId = requestAnimationFrame(smoothScroll);
    };

    // Inicia apenas em desktop (evita problemas em mobile)
    if (window.innerWidth >= 1024) {
      rafId = requestAnimationFrame(smoothScroll);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);
}

// Hook para scroll reveal elements
export function useScrollReveal() {
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-revealed');
        }
      });
    }, observerOptions);

    const elements = document.querySelectorAll('.scroll-reveal');
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

// Provider para aplicar smooth scroll globalmente
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useSmoothScroll();
  useScrollReveal();
  
  return <>{children}</>;
}
