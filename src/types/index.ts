// ============================================
// Core Types for any website
// ============================================

// ----- Site Configuration -----
export interface SiteConfig {
  name: string;
  description: string;
  url: string;
  ogImage: string;
  location?: string;
  links: {
    youtube: string;
    github: string;
    instagram: string;
    facebook: string;
    strava: string;
    email: string;
  };
  author: {
    name: string;
    bio: string;
    avatar?: string;
  };
}

// ----- Navigation -----
export interface NavItem {
  label: string;
  href: string;
}

// ----- Component Props -----
export interface BaseProps {
  className?: string;
  children?: React.ReactNode;
}

export interface SectionProps extends BaseProps {
  id?: string;
  title?: string;
}

// ----- Form Types -----
export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// ============================================
// PingElo Types - ELO System
// ============================================

export type Role = "PLAYER" | "ADMIN";

export type TournamentFormat = 
  | "SINGLE_ELIMINATION" 
  | "DOUBLE_ELIMINATION" 
  | "ROUND_ROBIN" 
  | "SWISS";

export type TournamentStatus = 
  | "DRAFT" 
  | "REGISTRATION_OPEN" 
  | "IN_PROGRESS" 
  | "COMPLETED" 
  | "CANCELLED";

// ----- User Types -----
export interface User {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  role: Role;
  isBanned: boolean;
  banReason?: string | null;
  foreverElo: number;
  seasonElo: number;
  matchesPlayed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithStats extends User {
  lastMatchDate?: Date | null;
  isRusty: boolean;
  isActive: boolean;
  kFactorLabel: string;
  eloTier: string;
  percentile?: number;
}

// ----- Match Types -----
export interface Match {
  id: string;
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  winnerId: string;
  player1EloBefore: number;
  player2EloBefore: number;
  player1EloChange: number;
  player2EloChange: number;
  seasonId?: string | null;
  isTournamentMatch: boolean;
  tournamentId?: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

export interface MatchWithPlayers extends Match {
  player1: User;
  player2: User;
  creator?: User;
}

export interface MatchResult {
  player1Score: number;
  player2Score: number;
  winnerId: "player1" | "player2";
}

export interface CreateMatchInput {
  player1Id: string;
  player2Id: string;
  player1Score: number;
  player2Score: number;
  isTournamentMatch?: boolean;
  tournamentId?: string;
}

// ----- Tournament Types -----
export interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  creatorId: string;
  entryFee: number;
  prizePool: number;
  maxScore: number;
  format: TournamentFormat;
  maxParticipants: number;
  status: TournamentStatus;
  startsAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface TournamentWithParticipants extends Tournament {
  creator: User;
  participants: TournamentParticipant[];
  matches?: Match[];
}

export interface TournamentParticipant {
  id: string;
  tournamentId: string;
  userId: string;
  eloAtEntry: number;
  paidEntry: boolean;
  paidOut: boolean;
  finalPlacement?: number | null;
  createdAt: Date;
}

export interface TournamentParticipantWithUser extends TournamentParticipant {
  user: User;
}

export interface CreateTournamentInput {
  name: string;
  description?: string;
  entryFee?: number;
  prizePool?: number;
  maxScore?: number;
  format?: TournamentFormat;
  maxParticipants?: number;
  startsAt?: Date;
}

// ----- Season Types -----
export interface Season {
  id: string;
  name: string;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  winnerId?: string | null;
  winnerElo?: number | null;
  createdAt: Date;
}

export interface SeasonWithWinner extends Season {
  winner?: User | null;
}

// ----- Leaderboard Types -----
export interface LeaderboardEntry {
  rank: number;
  user: User;
  foreverElo: number;
  seasonElo: number;
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  lastMatchDate?: Date | null;
  isRusty: boolean;
  isActive: boolean;
}

// ----- ELO Change Explanation -----
export interface EloChangeExplanation {
  kFactor: number;
  kFactorLabel: string;
  expectedScore: number;
  actualScore: number;
  marginMultiplier: number;
  marginLabel: string;
  isTournament: boolean;
  calculation: string;
  rawChange: number;
  finalChange: number;
}
