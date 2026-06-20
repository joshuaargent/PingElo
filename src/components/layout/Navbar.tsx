'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { mainNav } from '@/lib/constants';
import { siteConfig } from '@/lib/constants';
import { Menu, X, Sun, Moon, User, LogOut, LayoutDashboard, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Avatar } from '@/components/ui/Avatar';
import { useTheme } from '@/components/providers/ThemeProvider';

// ============================================
// Navbar Component
// ============================================

export function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const { theme, toggleTheme } = useTheme();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleSignOut = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <>
      <header
        className={cn(
          'fixed top-0 right-0 left-0 z-[50] transition-all duration-200',
          isScrolled ? 'bg-bg-primary/95 border-border border-b backdrop-blur-md' : 'bg-transparent'
        )}
        style={{ transform: 'translateZ(0)' }}
      >
        <nav className="container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="text-text-primary hover:text-accent text-xl font-semibold transition-colors flex items-center gap-2"
            >
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                <circle cx="12" cy="12" r="4" fill="currentColor" />
              </svg>
              {siteConfig.name}
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden items-center gap-1 md:flex">
              {mainNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'text-accent bg-accent-light'
                      : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                  )}
                >
                  {item.label}
                </Link>
              ))}
              
              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="ml-1"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-text-primary" />
                ) : (
                  <Moon className="h-5 w-5 text-text-primary" />
                )}
              </Button>

              {/* User Menu */}
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-bg-secondary animate-pulse ml-2" />
              ) : session?.user ? (
                <div className="relative ml-2">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-lg hover:bg-bg-secondary transition-colors"
                  >
                    <Avatar
                      src={session.user.image}
                      alt={session.user.name || 'User'}
                      fallback={session.user.name?.charAt(0) || 'U'}
                      size="sm"
                    />
                    <span className="text-sm font-medium text-text-primary hidden lg:block">
                      {session.user.name?.split(' ')[0]}
                    </span>
                    <ChevronDown className="h-4 w-4 text-text-secondary" />
                  </button>

                  <AnimatePresence>
                    {isUserMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-bg-card border border-border rounded-xl shadow-lg py-1"
                      >
                        <Link
                          href="/dashboard"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-secondary transition-colors"
                        >
                          <LayoutDashboard className="h-4 w-4" />
                          Dashboard
                        </Link>
                        <Link
                          href={`/profile/${session.user.id}`}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-bg-secondary transition-colors"
                        >
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                        <hr className="my-1 border-border" />
                        <button
                          onClick={handleSignOut}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-bg-secondary transition-colors w-full"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center gap-2 ml-2">
                  <Link href="/auth/signin">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-text-primary"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-bg-primary fixed inset-0 z-[45] pt-16 md:hidden"
            style={{ transform: 'translateZ(0)' }}
          >
            <nav className="container py-6">
              <div className="flex flex-col gap-1">
                {mainNav.map((item, index) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center rounded-lg px-4 py-3 text-base font-medium transition-colors',
                        pathname === item.href
                          ? 'text-accent bg-accent-light'
                          : 'text-text-secondary hover:text-text-primary hover:bg-bg-secondary'
                      )}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Mobile User Section */}
              <div className="border-border mt-8 border-t pt-6">
                {session?.user ? (
                  <div className="space-y-2">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-secondary transition-colors"
                    >
                      <Avatar
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        fallback={session.user.name?.charAt(0) || 'U'}
                        size="sm"
                      />
                      <div>
                        <p className="font-medium text-text-primary">{session.user.name}</p>
                        <p className="text-sm text-text-secondary">Dashboard</p>
                      </div>
                    </Link>
                    <Link
                      href={`/profile/${session.user.id}`}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-secondary transition-colors"
                    >
                      <User className="h-5 w-5 text-text-secondary" />
                      <span className="text-text-primary">Profile</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-bg-secondary transition-colors w-full text-left"
                    >
                      <LogOut className="h-5 w-5 text-red-500" />
                      <span className="text-red-500">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Link href="/auth/signin">
                      <Button variant="outline" className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/auth/signup">
                      <Button className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                )}

                {/* Theme Toggle for Mobile */}
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      toggleTheme();
                      setIsMobileMenuOpen(false);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 px-4 py-2 border border-border bg-bg-card text-text-primary hover:bg-bg-secondary"
                  >
                    {theme === 'dark' ? (
                      <>
                        <Sun className="h-4 w-4" />
                        <span>Light Mode</span>
                      </>
                    ) : (
                      <>
                        <Moon className="h-4 w-4" />
                        <span>Dark Mode</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div className="h-16" />
    </>
  );
}
