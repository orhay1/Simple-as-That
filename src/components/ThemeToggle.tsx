import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'agentic-vibe-theme';

export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Sync theme across tabs via storage event
  React.useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        setTheme(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [setTheme]);

  if (!mounted) {
    return (
      <Button ref={ref} variant="ghost" size="icon" className="h-9 w-9" {...props}>
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  const handleToggle = () => {
    const newTheme = isDark ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={handleToggle}
      className="h-9 w-9 transition-transform hover:scale-110"
      {...props}
    >
      {isDark ? (
        <Sun className="h-4 w-4 text-amber-400 transition-all" />
      ) : (
        <Moon className="h-4 w-4 text-slate-700 transition-all" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
});

ThemeToggle.displayName = 'ThemeToggle';
