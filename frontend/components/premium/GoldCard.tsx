'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

interface GoldCardProps {
  children: React.ReactNode;
  className?: string;
  glowIntensity?: 'subtle' | 'medium' | 'strong';
}

export function GoldCard({ children, className = '', glowIntensity = 'medium' }: GoldCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setMousePosition({ x, y });
    };

    card.addEventListener('mousemove', handleMouseMove);
    return () => card.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const glowSizes = {
    subtle: 'blur-3xl opacity-20',
    medium: 'blur-2xl opacity-30',
    strong: 'blur-xl opacity-40',
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-white via-white to-gray-50 ${className}`}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ scale: 1.02 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Border Beam Effect */}
      <div className="absolute inset-0 rounded-2xl overflow-hidden">
        <div
          className="absolute w-full h-full"
          style={{
            background: `radial-gradient(circle 150px at ${mousePosition.x}% ${mousePosition.y}%, rgba(212, 175, 55, 0.15), transparent 100%)`,
          }}
        />
      </div>

      {/* Gold Glow que segue o mouse */}
      {isHovered && (
        <motion.div
          className={`absolute w-96 h-96 bg-gradient-to-r from-[#D4AF37] via-[#F6E05E] to-[#D4AF37] rounded-full ${glowSizes[glowIntensity]} pointer-events-none`}
          style={{
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
          }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0 }}
          transition={{ duration: 0.3 }}
        />
      )}

      {/* Border sutil dourado */}
      <div className="absolute inset-0 rounded-2xl border border-[#D4AF37]/20" />

      {/* Conteúdo */}
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
