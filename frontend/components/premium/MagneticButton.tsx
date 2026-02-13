'use client';

import { useRef, useState, MouseEvent, ReactNode } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface MagneticButtonProps {
  children: ReactNode;
  className?: string;
  strength?: number; // Força do magnetismo (0-1)
  range?: number; // Distância de ativação em pixels
  onClick?: () => void;
  href?: string;
}

export function MagneticButton({
  children,
  className = '',
  strength = 0.3,
  range = 100,
  onClick,
  href,
}: MagneticButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Springs para movimento suave
  const x = useSpring(0, { stiffness: 300, damping: 30 });
  const y = useSpring(0, { stiffness: 300, damping: 30 });

  // Transformações para efeito de profundidade
  const rotateX = useTransform(y, [-range / 2, range / 2], [15, -15]);
  const rotateY = useTransform(x, [-range / 2, range / 2], [-15, 15]);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!buttonRef.current) return;

    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = e.clientX - centerX;
    const deltaY = e.clientY - centerY;

    const distance = Math.sqrt(deltaX ** 2 + deltaY ** 2);

    if (distance < range) {
      // Aplicar magnetismo apenas se estiver dentro do range
      const force = 1 - distance / range;
      x.set(deltaX * strength * force);
      y.set(deltaY * strength * force);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    x.set(0);
    y.set(0);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const content = (
    <motion.div
      ref={buttonRef}
      className={`relative inline-block cursor-pointer ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      onClick={onClick}
      style={{
        x,
        y,
        rotateX: isHovered ? rotateX : 0,
        rotateY: isHovered ? rotateY : 0,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {/* Efeito de brilho seguindo o cursor */}
      <motion.div
        className="absolute inset-0 rounded-full opacity-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.4), transparent 70%)',
          filter: 'blur(20px)',
        }}
        animate={{
          opacity: isHovered ? 1 : 0,
          scale: isHovered ? 1.5 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      {/* Conteúdo do botão */}
      <div
        style={{
          transform: 'translateZ(20px)',
          transformStyle: 'preserve-3d',
        }}
      >
        {children}
      </div>

      {/* Sombra dinâmica */}
      <motion.div
        className="absolute inset-0 rounded-full bg-[#D4AF37] opacity-0 blur-xl -z-10"
        animate={{
          opacity: isHovered ? 0.3 : 0,
          scale: isHovered ? 1.2 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );

  if (href) {
    return (
      <a href={href} className="inline-block">
        {content}
      </a>
    );
  }

  return content;
}

// Variante específica para ícones
interface MagneticIconProps {
  children: ReactNode;
  className?: string;
}

export function MagneticIcon({ children, className = '' }: MagneticIconProps) {
  return (
    <MagneticButton strength={0.5} range={80} className={className}>
      <motion.div
        whileHover={{ rotateZ: 360 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </MagneticButton>
  );
}
