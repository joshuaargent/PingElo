import Link from 'next/link';
import { siteConfig, footerNav } from '@/lib/constants';
import { Heart } from 'lucide-react';

// ============================================
// Footer Component
// ============================================

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-bg-secondary border-border border-t">
      <div className="container py-8 md:py-12">
        {/* Grid Layout - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4 md:gap-8">
          
          {/* Brand - Full width on mobile */}
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link
              href="/"
              className="text-text-primary hover:text-accent text-lg font-bold transition-colors flex items-center gap-2"
            >
              <svg className="h-7 w-7" viewBox="0 0 36 36" fill="none">
                <ellipse cx="12" cy="18" rx="8" ry="12" fill="currentColor" opacity="0.9"/>
                <ellipse cx="12" cy="18" rx="6" ry="10" fill="currentColor"/>
                <rect x="18" y="15" width="10" height="6" rx="1" fill="currentColor"/>
                <circle cx="28" cy="10" r="5" fill="#f97316"/>
                <circle cx="26.5" cy="8.5" r="1.5" fill="white" opacity="0.6"/>
              </svg>
              {siteConfig.name}
            </Link>
            <p className="text-text-secondary mt-2 text-xs sm:text-sm max-w-xs hidden sm:block">{siteConfig.description}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {siteConfig.links.github && (
                <a href={siteConfig.links.github} target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-primary rounded p-1.5 transition-colors" aria-label="GitHub">
                  <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                </a>
              )}
              {siteConfig.links.email && (
                <a href={siteConfig.links.email} className="text-text-secondary hover:text-text-primary rounded p-1.5 transition-colors" aria-label="Email">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Main Navigation */}
          <div>
            <h3 className="text-text-primary text-xs font-semibold tracking-wider uppercase mb-3">
              Explore
            </h3>
            <ul className="space-y-1.5">
              {footerNav.main.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-text-secondary hover:text-text-primary text-xs sm:text-sm transition-colors block py-0.5">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Content */}
          <div>
            <h3 className="text-text-primary text-xs font-semibold tracking-wider uppercase mb-3">
              Resources
            </h3>
            <ul className="space-y-1.5">
              {footerNav.content.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-text-secondary hover:text-text-primary text-xs sm:text-sm transition-colors block py-0.5">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-text-primary text-xs font-semibold tracking-wider uppercase mb-3">
              Account
            </h3>
            <ul className="space-y-1.5">
              {footerNav.legal.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="text-text-secondary hover:text-text-primary text-xs sm:text-sm transition-colors block py-0.5">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-border mt-8 border-t pt-6">
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row sm:justify-between">
            <p className="text-text-muted text-xs sm:text-sm">
              © {currentYear} {siteConfig.name}. All rights reserved.
            </p>
            <p className="text-text-muted flex items-center gap-1.5 text-xs sm:text-sm">
              Built with <Heart className="h-3.5 w-3.5 fill-red-500 text-red-500" /> using Next.js
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
