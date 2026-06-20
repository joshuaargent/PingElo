# PingElo - Ping Pong ELO Rating Tracker

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)
![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

> A full-stack ping pong ELO rating tracker with OAuth authentication, match logging, tournaments, and seasonal rankings.

## Features

- **ELO Rating System** - Dynamic K-factor based on experience level
- **Score Margin Bonus** - Get extra ELO for dominating wins
- **OAuth + Email Auth** - Google OAuth and email/password login
- **Paid Tournaments** - Enter tournaments with ELO-based entry fees
- **Seasonal Rankings** - Monthly seasons with fresh starts
- **Activity Tracking** - Earn bonuses for playing regularly
- **Responsive Design** - Works on desktop and mobile

## Tech Stack

| Category | Technology |
|----------|-------------|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 6.0 |
| UI Library | React 19.2 |
| Styling | Tailwind CSS 4.2 |
| Database | PostgreSQL with Prisma ORM |
| Auth | NextAuth.js |
| State Management | Zustand |

## Quick Start

### Prerequisites

- Node.js 20.0.0+
- PostgreSQL 14+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/joshuaargent/PingElo.git
cd PingElo

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

### Configure Environment

Edit `.env` with your settings:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pingelo"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
```

### Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:push
```

### Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## ELO System

### Starting ELO
Every player starts at **1000 ELO**.

### Dynamic K-Factor
| Games Played | K-Factor | Description |
|--------------|----------|-------------|
| 0-10 | 64 | Rapid adjustment for new players |
| 11-30 | 48 | Still adjusting quickly |
| 31-100 | 32 | Established, stable players |
| 100+ | 24 | Veterans - slow to change |

### Score Margin Bonus (Casual Matches)
| Point Difference | Multiplier |
|------------------|------------|
| 1-4 points | 1.0x |
| 5-9 points | 1.25x |
| 10+ points | 1.5x |

### Tournament Entry Fees
| Your ELO | Entry Fee |
|----------|-----------|
| Below 800 | Free! |
| 800-999 | 10 ELO |
| 1000-1199 | 20 ELO |
| 1200+ | 50 ELO |

## Project Structure

```
PingElo/
в”œв”€в”¬в”€в”€в”€в”€в”€в”€ prisma/
в”‚   в””в”€в”¬в”€в”€в”€в”€в”€в”€ schema.prisma    # Database schema
в”œв”€в”¬в”€в”€в”€в”€в”€в”€ src/
в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ app/              # Pages
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ api/         # API routes
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ leaderboard/ # Leaderboard page
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ tournaments/ # Tournaments page
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ help/        # Help page
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ how-it-works/ # ELO explanation
в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ components/
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ elo/         # ELO components
в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ lib/
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ elo.ts       # ELO calculations
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ auth.ts     # NextAuth config
в”‚   в”‚   в”œв”€в”¬в”€в”€в”€в”€в”€в”€ prisma.ts   # DB client
в”œв”€в”¬в”€в”€в”€в”€в”€в”€в”€ .env.example
в”œв”€в”¬в”€в”€в”€в”€в”€в”€ package.json
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production (includes Prisma generate) |
| `npm run start` | Start production server |
| `npm run db:push` | Push schema changes to database |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:migrate` | Create migration |
| `npm run test` | Run tests |

## Deployment

### Vercel (Recommended)

1. Fork this repository
2. Create a new project on [Vercel](https://vercel.com)
3. Import your forked repository
4. Add environment variables in Vercel dashboard:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_URL` - Your Vercel deployment URL
   - `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`
   - `GOOGLE_CLIENT_ID` (optional)
   - `GOOGLE_CLIENT_SECRET` (optional)
5. Deploy!

### Database Options

| Provider | Free Tier |
|----------|-----------|
| [Neon](https://neon.tech) | 0.5GB storage, 1 project |
| [Supabase](https://supabase.com) | 500MB database |
| [Railway](https://railway.app) | $5 credit/month |

## License

MIT License
