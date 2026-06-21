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
  { label: 'Leaderboard', href: '/leaderboard', icon: 'trophy' },
  { label: 'Challenges', href: '/challenges', icon: 'swords' },
  { label: 'Tournaments', href: '/tournaments', icon: 'flag' },
  { label: 'Teams', href: '/teams', icon: 'users' },
  { label: 'Log Match', href: '/matches/new', icon: 'plus' },
  { label: 'How It Works', href: '/how-it-works', icon: 'help' },
];

export const footerNav = {
  main: [
    { label: 'Home', href: '/' },
    { label: 'Leaderboard', href: '/leaderboard' },
    { label: 'Tournaments', href: '/tournaments' },
    { label: 'Teams', href: '/teams' },
    { label: 'Log Match', href: '/matches/new' },
    { label: 'Match History', href: '/matches/history' },
  ],
  content: [
    { label: 'How It Works', href: '/how-it-works' },
    { label: 'Help & FAQ', href: '/help' },
    { label: 'Contact Us', href: '/contact' },
  ],
  legal: [
    { label: 'Settings', href: '/settings' },
    { label: 'Season Reset', href: '/season-reset' },
  ],
  social: [
    { label: 'GitHub', href: siteConfig.links.github },
    { label: 'Contact', href: siteConfig.links.email },
  ],
};
