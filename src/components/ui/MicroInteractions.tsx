'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useState } from 'react';

// ============================================
// Animated Card Component
// ============================================

interface AnimatedCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
  press?: boolean;
}

export function AnimatedCard({ 
  children, 
  className = '',
  onClick,
  hover = true,
  press = true,
}: AnimatedCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -2, boxShadow: '0 12px 40px -12px rgba(0, 0, 0, 0.15)' } : undefined}
      whileTap={press ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={className}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      {children}
    </motion.div>
  );
}

// ============================================
// Interactive Button
// ============================================

interface InteractiveButtonProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
  variant?: 'default' | 'success' | 'danger';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export function InteractiveButton({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'default',
  icon,
  iconPosition = 'left',
  isLoading = false,
}: InteractiveButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  
  const variantStyles = {
    default: '',
    success: 'ring-green-500/50',
    danger: 'ring-red-500/50',
  };

  return (
    <motion.button
      whileHover={!disabled ? { scale: 1.02 } : undefined}
      whileTap={!disabled ? { scale: 0.97 } : undefined}
      animate={isPressed && !disabled ? { scale: [1, 0.97, 1] } : {}}
      transition={{ duration: 0.15 }}
      onClick={onClick}
      disabled={disabled}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      className={`
        relative overflow-hidden
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2
        ${className}
      `}
    >
      {isLoading ? (
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
        />
      ) : (
        <span className="flex items-center justify-center gap-2">
          {icon && iconPosition === 'left' && <span className="flex-shrink-0">{icon}</span>}
          {children}
          {icon && iconPosition === 'right' && <span className="flex-shrink-0">{icon}</span>}
        </span>
      )}
    </motion.button>
  );
}

// ============================================
// Success Checkmark Button
// ============================================

interface SuccessButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  successDuration?: number;
}

export function SuccessButton({
  children,
  onClick,
  className = '',
  successDuration = 2000,
}: SuccessButtonProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [wasClicked, setWasClicked] = useState(false);

  const handleClick = () => {
    if (wasClicked) return;
    setWasClicked(true);
    onClick();
    setShowSuccess(true);
    
    setTimeout(() => {
      setShowSuccess(false);
      setWasClicked(false);
    }, successDuration);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={handleClick}
      disabled={wasClicked}
      className={`
        relative overflow-hidden rounded-lg px-4 py-2 font-medium transition-colors
        ${wasClicked ? 'bg-green-500 text-white' : 'bg-accent text-white hover:bg-accent-hover'}
        ${className}
      `}
    >
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            className="flex items-center justify-center gap-2"
          >
            <motion.svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <motion.path
                d="M20 6L9 17L4 12"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
              />
            </motion.svg>
            Done!
          </motion.div>
        ) : (
          <motion.span
            key="text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================
// Like/Heart Animation Button
// ============================================

interface LikeButtonProps {
  isLiked: boolean;
  onToggle: () => void;
  count?: number;
  className?: string;
}

export function LikeButton({ isLiked, onToggle, count, className = '' }: LikeButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.85 }}
      onClick={onToggle}
      className={`flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-bg-secondary transition-colors ${className}`}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill={isLiked ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
          className={isLiked ? 'text-red-500' : 'text-text-secondary'}
        >
          <motion.path
            d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
            initial={false}
            animate={isLiked ? { scale: [1, 1.2, 1] } : { scale: 1 }}
          />
        </motion.svg>
      </motion.div>
      {count !== undefined && (
        <span className="text-sm text-text-secondary">{count}</span>
      )}
    </motion.button>
  );
}

// ============================================
// Toast Notification
// ============================================

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  onClose: () => void;
}

export function Toast({ message, type = 'info', onClose }: ToastProps) {
  const typeStyles = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-accent',
  };

  const icons = {
    success: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`
        flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg
        ${typeStyles[type]}
      `}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="hover:opacity-80">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </motion.div>
  );
}

// ============================================
// ELO Change Indicator
// ============================================

interface EloChangeProps {
  change: number;
  className?: string;
}

export function EloChange({ change, className = '' }: EloChangeProps) {
  const isPositive = change > 0;
  const isZero = change === 0;

  return (
    <motion.span
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-sm font-medium
        ${isZero ? 'bg-bg-secondary text-text-secondary' : ''}
        ${isPositive ? 'bg-green-500/10 text-green-500' : ''}
        ${!isZero && !isPositive ? 'bg-red-500/10 text-red-500' : ''}
        ${className}
      `}
    >
      {isPositive && (
        <motion.svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          initial={{ y: 5 }}
          animate={{ y: 0 }}
        >
          <path d="M12 19V5M5 12l7-7 7 7" />
        </motion.svg>
      )}
      {!isPositive && !isZero && (
        <motion.svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          initial={{ y: -5 }}
          animate={{ y: 0 }}
        >
          <path d="M12 5v14M5 12l7 7 7-7" />
        </motion.svg>
      )}
      {isPositive ? '+' : ''}{change}
    </motion.span>
  );
}

// ============================================
// Rank Badge with Animation
// ============================================

interface RankBadgeProps {
  rank: number;
  className?: string;
}

export function RankBadge({ rank, className = '' }: RankBadgeProps) {
  const getRankStyle = () => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white';
      case 3:
        return 'bg-gradient-to-br from-amber-600 to-amber-800 text-white';
      default:
        return 'bg-bg-secondary text-text-secondary';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: rank * 0.05 }}
      whileHover={{ scale: 1.1 }}
      className={`
        w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
        ${getRankStyle()}
        ${className}
      `}
    >
      {rank <= 3 ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ) : (
        rank
      )}
    </motion.div>
  );
}

// ============================================
// Progress Bar Animation
// ============================================

interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  color?: 'accent' | 'green' | 'yellow' | 'red';
}

export function ProgressBar({ 
  progress, 
  className = '', 
  showLabel = false,
  color = 'accent',
}: ProgressBarProps) {
  const colors = {
    accent: 'bg-accent',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    red: 'bg-red-500',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className="h-2 bg-bg-secondary rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className={`h-full rounded-full ${colors[color]}`}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-text-secondary mt-1">{Math.round(progress)}%</span>
      )}
    </div>
  );
}

// ============================================
// Ripple Effect
// ============================================

interface RippleButtonProps {
  children: ReactNode;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function RippleButton({ children, onClick, className = '', disabled }: RippleButtonProps) {
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples((prev) => [...prev, { x, y, id }]);
    
    setTimeout(() => {
      setRipples((prev) => prev.filter((r) => r.id !== id));
    }, 600);

    onClick();
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={disabled}
      className={`
        relative overflow-hidden rounded-lg px-4 py-2 font-medium
        bg-accent text-white hover:bg-accent-hover
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {children}
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full"
          style={{ left: ripple.x, top: ripple.y }}
          initial={{ width: 0, height: 0, opacity: 0.5 }}
          animate={{ width: 200, height: 200, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </motion.button>
  );
}

// ============================================
// Skeleton Shimmer
// ============================================

export function SkeletonShimmer({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
}

// ============================================
// Notification Dot
// ============================================

interface NotificationDotProps {
  count?: number;
  className?: string;
}

export function NotificationDot({ count, className = '' }: NotificationDotProps) {
  return (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className={`relative inline-flex ${className}`}
    >
      <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
        {count && count > 99 ? '99+' : count}
      </span>
      <motion.span
        className="absolute -top-1 -right-1 flex h-3 w-3"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
      </motion.span>
    </motion.span>
  );
}

// ============================================
// Tab Switch Animation
// ============================================

interface TabSwitchProps {
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}

export function TabSwitch({ tabs, activeTab, onChange, className = '' }: TabSwitchProps) {
  const activeIndex = tabs.indexOf(activeTab);

  return (
    <div className={`relative flex bg-bg-secondary rounded-lg p-1 ${className}`}>
      <motion.div
        className="absolute top-1 bottom-1 bg-bg-primary rounded-md shadow-sm"
        initial={false}
        animate={{ left: `${activeIndex * (100 / tabs.length)}%`, width: `${100 / tabs.length}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
      {tabs.map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`
            flex-1 relative z-10 px-4 py-2 text-sm font-medium rounded-md transition-colors
            ${activeTab === tab ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}
          `}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
