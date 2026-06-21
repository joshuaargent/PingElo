'use client';

import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

// ============================================
// Page Transition Wrapper
// ============================================

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
      ease: 'easeOut',
    },
  },
};

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ============================================
// Fade In Animation
// ============================================

export function FadeIn({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: ReactNode; 
  delay?: number; 
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Stagger Container
// ============================================

export function StaggerContainer({ 
  children, 
  className = '',
  staggerDelay = 0.05 
}: { 
  children: ReactNode; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Stagger Item (use inside StaggerContainer)
// ============================================

export function StaggerItem({ 
  children, 
  className = '' 
}: { 
  children: ReactNode; 
  className?: string 
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 15 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: 'easeOut',
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Scale In Animation
// ============================================

export function ScaleIn({ 
  children, 
  delay = 0, 
  className = '' 
}: { 
  children: ReactNode; 
  delay?: number; 
  className?: string 
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Slide In from Direction
// ============================================

export function SlideIn({ 
  children, 
  direction = 'right', 
  delay = 0, 
  className = '' 
}: { 
  children: ReactNode; 
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string 
}) {
  const directions = {
    left: { x: -20, y: 0 },
    right: { x: 20, y: 0 },
    up: { x: 0, y: -20 },
    down: { x: 0, y: 20 },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Card Hover Effect
// ============================================

export function AnimatedCard({ 
  children, 
  className = '',
  onClick,
}: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
}) {
  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 30px -12px rgba(0, 0, 0, 0.15)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      className={className}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Button Press Effect
// ============================================

export function AnimatedButton({ 
  children, 
  className = '',
  onClick,
  disabled = false,
}: { 
  children: ReactNode; 
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      transition={{ duration: 0.1 }}
      className={className}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}

// ============================================
// Number Counter Animation
// ============================================

export function AnimatedNumber({ 
  value, 
  className = '',
  duration = 1,
}: { 
  value: number; 
  className?: string;
  duration?: number;
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={className}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
      </motion.span>
    </motion.span>
  );
}

// ============================================
// Success Check Animation
// ============================================

export function SuccessCheck({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          className="flex items-center justify-center"
        >
          <motion.svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            className="text-green-500"
          >
            <motion.path
              d="M20 6L9 17L4 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            />
          </motion.svg>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ============================================
// Pulse Animation (for notifications)
// ============================================

export function Pulse({ 
  children, 
  color = 'bg-accent',
}: { 
  children: ReactNode;
  color?: string;
}) {
  return (
    <motion.div
      animate={{
        scale: [1, 1.05, 1],
        boxShadow: [
          '0 0 0 0 rgba(239, 68, 68, 0.4)',
          '0 0 0 8px rgba(239, 68, 68, 0)',
          '0 0 0 0 rgba(239, 68, 68, 0)',
        ],
      }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Shimmer Effect
// ============================================

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-bg-secondary via-border to-bg-secondary bg-[length:200%_100%] ${className}`}
      animate={{
        backgroundPosition: ['200% 0', '-200% 0'],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );
}

// ============================================
// Typing Effect
// ============================================

export function TypingEffect({ 
  text, 
  className = '',
  speed = 50,
}: { 
  text: string; 
  className?: string;
  speed?: number;
}) {
  return (
    <motion.span
      className={className}
      initial={{}}
    >
      {text.split('').map((char, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: i * speed / 1000, duration: 0 }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

// ============================================
// Floating Animation
// ============================================

export function Float({ 
  children, 
  className = '',
  intensity = 10,
}: { 
  children: ReactNode; 
  className?: string;
  intensity?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [-intensity, intensity, -intensity],
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Reveal on Scroll
// ============================================

export function RevealOnScroll({ 
  children, 
  className = '',
}: { 
  children: ReactNode; 
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// List Item Animation
// ============================================

export function ListItem({ 
  children, 
  index = 0,
  className = '',
}: { 
  children: ReactNode; 
  index?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.3, 
        delay: index * 0.05,
        ease: 'easeOut',
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Confetti Burst (for achievements/wins)
// ============================================

export function ConfettiBurst({ 
  active,
  origin = { x: 0.5, y: 0.5 },
}: { 
  active: boolean;
  origin?: { x: number; y: number };
}) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 pointer-events-none z-50"
        />
      )}
    </AnimatePresence>
  );
}
