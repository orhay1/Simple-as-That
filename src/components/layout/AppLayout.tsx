import { ReactNode } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { BackgroundPaths } from '@/components/ui/background-paths';

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { isRTL } = useLanguage();

  return (
    <SidebarProvider>
      <BackgroundPaths />
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            {isRTL ? (
              <>
                <ThemeToggle />
                <SidebarTrigger />
              </>
            ) : (
              <>
                <SidebarTrigger />
                <ThemeToggle />
              </>
            )}
          </header>
          <div className="p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
