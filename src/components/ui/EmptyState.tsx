'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: ReactNode;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  variant?: 'default' | 'compact' | 'centered';
}

// ============================================
// Empty State Component
// ============================================

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
  variant = 'default',
}: EmptyStateProps) {
  if (variant === 'compact') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-4 p-6 bg-bg-secondary/30 rounded-xl border border-border ${className}`}
      >
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-bg-secondary flex items-center justify-center text-text-muted">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-text-primary truncate">{title}</h3>
          <p className="text-sm text-text-secondary truncate">{description}</p>
        </div>
        {action && (
          <Button size="sm" onClick={action.onClick} leftIcon={action.icon}>
            {action.label}
          </Button>
        )}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`flex flex-col items-center justify-center text-center ${
        variant === 'centered' ? 'py-16' : 'p-8'
      } ${className}`}
    >
      {/* Animated Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="relative mb-6"
      >
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-bg-secondary to-border flex items-center justify-center">
          <motion.div
            animate={{ 
              y: [0, -4, 0],
            }}
            transition={{ 
              duration: 2, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="text-text-muted"
          >
            {icon}
          </motion.div>
        </div>
        
        {/* Decorative ring */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ delay: 0.3 }}
          className="absolute -inset-2 rounded-2xl border-2 border-dashed border-border"
        />
      </motion.div>

      {/* Content */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-xl font-semibold text-text-primary mb-2"
      >
        {title}
      </motion.h3>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-text-secondary max-w-sm mb-6"
      >
        {description}
      </motion.p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="flex items-center gap-3"
        >
          {action && (
            <Button onClick={action.onClick} leftIcon={action.icon}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// ============================================
// Preset Empty States
// ============================================

export function NoPlayersEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      title="No Players Yet"
      description="Be the first to log a match and start the rankings!"
      action={onAction ? { label: 'Log First Match', onClick: onAction, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> } : undefined}
    />
  );
}

export function NoMatchesEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      }
      title="No Matches Yet"
      description="Time to show off your ping pong skills! Log your first match now."
      action={onAction ? { label: 'Log Match', onClick: onAction, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> } : undefined}
    />
  );
}

export function NoTournamentsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      }
      title="No Tournaments"
      description="Create a tournament to compete with other players for glory and prizes!"
      action={onAction ? { label: 'Create Tournament', onClick: onAction, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg> } : undefined}
    />
  );
}

export function NoTeamsEmpty({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      }
      title="No Teams Yet"
      description="Form a doubles team and dominate the competition together!"
      action={onAction ? { label: 'Find a Partner', onClick: onAction, icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg> } : undefined}
    />
  );
}

export function NoSearchResultsEmpty({ query, onClear }: { query?: string; onClear?: () => void }) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      }
      title="No Results Found"
      description={query ? `We couldn't find anything matching "${query}"` : "We couldn't find anything matching your search"}
      action={onClear ? { label: 'Clear Search', onClick: onClear } : undefined}
    />
  );
}

// ============================================
// Error State
// ============================================

export function ErrorState({ 
  message = "Something went wrong",
  onRetry 
}: { 
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <EmptyState
      icon={
        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      }
      title="Oops! Something went wrong"
      description={message}
      action={onRetry ? { label: 'Try Again', onClick: onRetry } : undefined}
    />
  );
}
