import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { cn } from '@/lib/utils';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className={cn(
      "flex flex-col md:flex-row min-h-screen w-full bg-background"
    )}>
      <AppSidebar />
      <main className="flex-1 overflow-auto">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <ThemeToggle />
        </header>
        <div className="p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
