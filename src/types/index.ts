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
