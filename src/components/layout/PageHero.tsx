import { LucideIcon } from 'lucide-react';

interface PageHeroProps {
  title: string;
  description?: string;
  badge?: {
    icon: LucideIcon;
    label: string;
  };
}

export function PageHero({ title, description, badge }: PageHeroProps) {
  const BadgeIcon = badge?.icon;
  
  return (
    <section className="relative overflow-hidden py-12 md:py-16 lg:py-20">
      <div className="container">
        <div className="mx-auto max-w-4xl text-center">
          {badge && BadgeIcon && (
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent-light px-4 py-1.5 text-sm font-medium text-accent">
              <BadgeIcon className="h-4 w-4" />
              <span>{badge.label}</span>
            </div>
          )}
          
          <h1 className="text-text-primary text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            {title}
          </h1>
          
          {description && (
            <p className="text-text-secondary mx-auto mt-4 max-w-2xl text-lg md:text-xl">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
