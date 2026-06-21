'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface PageTemplateProps {
  children: ReactNode;
}

const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

export function PageTransition({ children }: PageTemplateProps) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Staggered List Animation
// ============================================

interface StaggeredListProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
}

export function StaggeredList({ 
  children, 
  className = '',
  delay = 0,
  staggerChildren = 0.05,
}: StaggeredListProps) {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren,
        delayChildren: delay,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.isArray(children) 
        ? children.map((child, index) => (
            <motion.div key={index} variants={itemVariants}>
              {child}
            </motion.div>
          ))
        : <motion.div variants={itemVariants}>{children}</motion.div>
      }
    </motion.div>
  );
}

// ============================================
// Fade In Animation
// ============================================

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
}

export function FadeIn({ 
  children, 
  className = '',
  delay = 0,
  duration = 0.4,
  direction = 'up',
}: FadeInProps) {
  const initial: Record<string, number> = { opacity: 0 };
  
  switch (direction) {
    case 'up': initial.y = 15; break;
    case 'down': initial.y = -15; break;
    case 'left': initial.x = 15; break;
    case 'right': initial.x = -15; break;
  }

  return (
    <motion.div
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Scale In Animation
// ============================================

interface ScaleInProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  scale?: number;
}

export function ScaleIn({ 
  children, 
  className = '',
  delay = 0,
  scale = 0.95,
}: ScaleInProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Animated Card
// ============================================

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export function AnimatedCard({ 
  children, 
  className = '',
  onClick,
  hover = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.15)' } : undefined}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
}
