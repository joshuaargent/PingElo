# Next.js Template

![Next.js](https://img.shields.io/badge/Next.js-16.2-black)
![React](https://img.shields.io/badge/React-19.2-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)
![Tailwind_CSS](https://img.shields.io/badge/Tailwind_CSS-4.2-38bdf8)
![License](https://img.shields.io/badge/License-MIT-green)

> A reusable Next.js template for any website project. Built with Next.js, React, and Tailwind CSS.

## Features

- **Responsive** - Mobile-first design
- **Dark Mode** - Light/dark theme toggle
- **SEO Optimized** - Metadata, sitemap, robots.txt
- **Type-Safe** - Full TypeScript support
- **Prose Styling** - Beautiful blog/article styling
- **Animations** - Smooth fade, slide, scale animations
- **Fast** - Static generation ready

## Tech Stack

| Category | Technology |
|----------|-------------|
| Framework | Next.js 16.2 (App Router) |
| Language | TypeScript 6.0 |
| UI Library | React 19.2 |
| Styling | Tailwind CSS 4.2 |
| Animations | Framer Motion |
| Icons | Lucide React |
| Markdown | Marked + MDX Remote |
| Syntax Highlighting | Shiki + Rehype Pretty Code |
| State Management | Zustand |
| Analytics | Vercel Analytics + Speed Insights |
| Date Utilities | date-fns |
| Class Utilities | clsx + tailwind-merge |

## Project Structure

```
nextjs-template/
├── src/
│   ├── app/             # Next.js App Router pages
│   │   ├── globals.css  # Global styles & design tokens
│   │   ├── layout.tsx  # Root layout
│   │   ├── page.tsx     # Homepage
│   │   ├── error.tsx   # Error boundary
│   │   ├── loading.tsx  # Loading state
│   │   ├── not-found.tsx # 404 page
│   │   ├── robots.ts   # robots.txt
│   │   └── sitemap.ts # sitemap.xml
│   ├── components/       # React components
│   │   ├── layout/     # Layout components
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Container.tsx
│   │   │   └── PageHeader.tsx
│   │   ├── providers/  # Context providers
│   │   │   └── ThemeProvider.tsx
│   │   └── ui/         # UI components
│   │       ├── Button.tsx
│   │       ├── Badge.tsx
│   │       ├── Card.tsx
│   │       ├── Input.tsx
│   │       ├── Textarea.tsx
│   │       ├── Avatar.tsx
│   │       ├── Divider.tsx
│   │       ├── Icon.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Tag.tsx
│   │       └── Toaster.tsx
│   ├── data/            # Static data
│   │   └── site.ts      # Site configuration
│   ├── lib/            # Utility functions
│   │   ├── constants.ts  # Site constants
│   │   ├── fonts.ts   # Font configuration
│   │   └── utils.ts  # General utilities
│   └── types/           # TypeScript types
│       └── index.ts    # Type definitions
├── .env.example        # Environment variables template
├── next.config.ts       # Next.js configuration
├── postcss.config.mjs  # PostCSS configuration
├── tsconfig.json     # TypeScript configuration
├── package.json    # Dependencies and scripts
└── vitest.config.ts # Vitest configuration
```

## Getting Started

### Prerequisites

- Node.js 20.0.0+
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/nextjs-template.git
cd nextjs-template

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
```

### Development

```bash
# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm run start
```

## Customization

### Site Configuration

Edit `src/lib/constants.ts` to configure your site:

```typescript
export const siteConfig = {
  name: 'Your Site Name',
  description: 'Your site description',
  url: 'https://your-domain.com',
  author: {
    name: 'Your Name',
    bio: 'About you',
  },
};

export const mainNav = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
  { label: 'Contact', href: '/contact' },
];
```

### Adding Pages

Create new pages in `src/app/`:

```typescript
// src/app/about/page.tsx
import { Container } from '@/components/layout/Container';

export default function AboutPage() {
  return (
    <Container>
      <h1>About Me</h1>
      <p>Your content here...</p>
    </Container>
  );
}
```

### Adding Components

Use existing UI components or create new ones:

```typescript
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export function MyComponent() {
  return (
    <Card>
      <h2>Title</h2>
      <p>Content</p>
      <Button>Click Me</Button>
    </Card>
  );
}
```

## Design System

### Colors

| Role | Color |
|------|-------|
| Primary | `#0D9488` (teal) |
| Background | `#FAFAF9` |
| Card | `#FFFFFF` |
| Text | `#1C1917` |
| Muted | `#A8A29E` |

### Typography

| Element | Font |
|---------|------|
| Headings | Inter |
| Body | Inter |
| Blog/Prose | Lora |
| Code | JetBrains Mono |

### CSS Variables

The template uses CSS custom properties via Tailwind CSS v4:

```css
@theme {
  --color-accent: #0d9488;
  --color-background: #fafaf9;
  --color-foreground: #1c1917;
  --font-sans: var(--font-inter), system-ui, sans-serif;
  --font-serif: var(--font-lora), Georgia, serif;
  --font-mono: var(--font-jetbrains-mono), monospace;
}
```

### Prose Styling

Use the `.prose` class for beautiful article content:

```typescript
<article className="prose">
  <h2>Heading</h2>
  <p>Paragraph with serif font...</p>
  <blockquote>Quote</blockquote>
  <code>Inline code</code>
  <pre>Code block</pre>
</article>
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Fix ESLint errors |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm run test` | Run Vitest in watch mode |
| `npm run test:run` | Run Vitest once |

## Pages

| Route | Description |
|-------|------------|
| `/` | Homepage |
| `/about` | About page |
| `/contact` | Contact page |

## Project Stats

- **29** TypeScript/TSX files
- **11** UI components
- **4** Layout components
- **3** Utility libraries
- **4** Configuration files

## Favicons

Generate favicons at [https://realfavicongenerator.net/](https://realfavicongenerator.net/) and add them to `public/`:

```bash
/public/
├── favicon.ico
├── apple-icon.png
├── android-chrome-192x192.png
├── android-chrome-512x512.png
└── og-image.png
```

Update `src/app/layout.tsx` to include the favicon references.

## License

MIT License - feel free to use this template for any project.

## Acknowledgments

Built with [Next.js](https://nextjs.org), [Tailwind CSS](https://tailwindcss.com), and [Vercel](https://vercel.com).

---

<p align="center">
  Built with ❤️ by <a href="https://joshuaargent.vercel.app">Joshua Argent</a>
</p>

