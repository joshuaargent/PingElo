// ============================================
// Site Configuration - PingElo
// ============================================

export const siteConfig = {
  name: 'PingElo',
  description: 'Track your ping pong skills with ELO ratings, compete in tournaments, and climb the leaderboard.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://pingelo.app',
  ogImage: '/og-image.png',
  location: 'Your Ping Pong Venue',
  links: {
    youtube: '',
    github: 'https://github.com',
    instagram: '',
    facebook: '',
    strava: '',
    email: 'mailto:hello@pingelo.app',
  },
  author: {
    name: 'PingElo',
    bio: 'Ping pong ELO tracking platform',
  },
};

// ============================================
// Metadata
// ============================================

export const meta = {
  title: 'PingElo - Ping Pong ELO Tracking',
  description: 'Track your ping pong skills with ELO ratings, compete in tournaments, and climb the leaderboard.',
  keywords: ['ping pong', 'elo', 'rating', 'tournament', 'leaderboard', 'table tennis'] as string[],
  siteName: 'PingElo',
  twitter: '@pingelo',
  instagramHandle: '@pingelo',
};

// ============================================
// Navigation
// ============================================

export const mainNav = [
  { label: 'Leaderboard', href: '/leaderboard' },
  { label: 'Tournaments', href: '/tournaments' },
  { label: 'How It Works', href: '/how-it-works' },
];

export const footerNav = {
  main: [
    { label: 'Home', href: '/' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Tournaments', href: '/tournaments' },
  ],
  content: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Help', href: '/help' },
  ],
  social: [
    { label: 'GitHub', href: siteConfig.links.github },
    { label: 'Contact', href: siteConfig.links.email },
  ],
};

// ============================================
// Design Tokens
// ============================================

export const colors = {
  primary: '#0D9488',
  primaryHover: '#0F766E',
} as const;

// ============================================
// Animation
// ============================================

export const transitions = {
  fast: '150ms ease',
  base: '200ms ease',
  slow: '300ms ease',
  slower: '500ms ease',
} as const;

export const animations = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.4 },
  },
  slideUp: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  slideDown: {
    initial: { opacity: 0, y: -20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4 },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4 },
  },
} as const;
