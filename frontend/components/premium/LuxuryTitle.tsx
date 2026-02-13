'use client';

import { motion } from 'framer-motion';

interface LuxuryTitleProps {
  children: React.ReactNode;
  as?: 'h1' | 'h2' | 'h3' | 'h4';
  className?: string;
  animated?: boolean;
}

export function LuxuryTitle({ 
  children, 
  as = 'h2', 
  className = '', 
  animated = true 
}: LuxuryTitleProps) {
  const Component = motion[as];

  const gradientStyle = {
    background: 'linear-gradient(135deg, #AA8A2E 0%, #D4AF37 25%, #F6E05E 50%, #D4AF37 75%, #AA8A2E 100%)',
    backgroundSize: '200% 200%',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as any, // Easing personalizado luxury
      }
    },
  };

  if (!animated) {
    return (
      <Component
        className={`font-black uppercase tracking-tight ${className}`}
        style={{
          ...gradientStyle,
          fontFamily: 'var(--font-perpetua), serif',
        }}
      >
        {children}
      </Component>
    );
  }

  return (
    <Component
      className={`font-black uppercase tracking-tight ${className}`}
      style={{
        ...gradientStyle,
        fontFamily: 'var(--font-perpetua), serif',
      }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-100px' }}
      variants={animationVariants}
    >
      <motion.span
        animate={{
          backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        }}
        transition={{
          duration: 8,
          ease: 'linear',
          repeat: Infinity,
        }}
        style={{ display: 'inline-block', ...gradientStyle }}
      >
        {children}
      </motion.span>
    </Component>
  );
}
