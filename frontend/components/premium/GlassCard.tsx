'use client';

import { ReactNode, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  borderBeam?: boolean; // Ativa a animação de Border Beam dourado
  onLeadCaptured?: boolean; // Trigger para ativar o Border Beam
}

export function GlassCard({
  children,
  className = '',
  borderBeam = false,
  onLeadCaptured = false,
}: GlassCardProps) {
  const [isBeamActive, setIsBeamActive] = useState(false);

  // Ativar Border Beam quando lead é captado (via useEffect, não no render)
  useEffect(() => {
    if (onLeadCaptured && !isBeamActive) {
      setIsBeamActive(true);
      const timer = setTimeout(() => setIsBeamActive(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [onLeadCaptured]);

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      {/* Glassmorphism background */}
      <div className="relative backdrop-blur-xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8">
        
        {/* Gradient overlay sutil */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-3xl pointer-events-none" />
        
        {/* Border Beam Animation */}
        {(borderBeam || isBeamActive) && (
          <>
            {/* Beam circulando */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                background:
                  'linear-gradient(90deg, transparent, transparent, rgba(212, 175, 55, 0.8), transparent, transparent)',
                backgroundSize: '200% 100%',
              }}
              animate={{
                backgroundPosition: ['0% 0%', '200% 0%'],
              }}
              transition={{
                duration: 3,
                ease: 'linear',
                repeat: isBeamActive ? 1 : Infinity,
              }}
            />
            
            {/* Glow effect durante o beam */}
            <motion.div
              className="absolute inset-0 rounded-3xl"
              style={{
                boxShadow: '0 0 40px rgba(212, 175, 55, 0.6), inset 0 0 40px rgba(212, 175, 55, 0.2)',
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: isBeamActive ? [0, 1, 0] : 0 }}
              transition={{ duration: 3 }}
            />
          </>
        )}
        
        {/* Dot pattern sutil */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 2px 2px, rgba(212, 175, 55, 0.8) 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        />
        
        {/* Conteúdo */}
        <div className="relative z-10">{children}</div>
      </div>

      {/* Shadow glow externo */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#D4AF37]/0 via-[#D4AF37]/5 to-transparent rounded-3xl blur-2xl -z-10 transform scale-105" />
    </motion.div>
  );
}

// Variante específica para cards de benefícios
interface BenefitGlassCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onLeadCaptured?: boolean;
}

export function BenefitGlassCard({
  icon,
  title,
  description,
  onLeadCaptured = false,
}: BenefitGlassCardProps) {
  return (
    <GlassCard borderBeam onLeadCaptured={onLeadCaptured}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="space-y-4"
      >
        {/* Ícone */}
        <motion.div
          whileHover={{ rotateY: 360 }}
          transition={{ duration: 0.6 }}
          className="inline-block"
        >
          {icon}
        </motion.div>

        {/* Título */}
        <h3 className="text-2xl font-black text-white uppercase font-cinzel">
          {title}
        </h3>

        {/* Descrição */}
        <p className="text-white/70 leading-relaxed">{description}</p>

        {/* Divider decorativo */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />
      </motion.div>
    </GlassCard>
  );
}
