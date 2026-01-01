import * as React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

export const ThemeToggle = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<typeof Button>
>((props, ref) => {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button ref={ref} variant="ghost" size="icon" className="h-9 w-9" {...props}>
        <div className="h-4 w-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  return (
    <Button
      ref={ref}
      variant="ghost"
      size="icon"
      onClick={() => {
        const newTheme = isDark ? 'light' : 'dark';
        console.log('Theme toggle clicked, switching to:', newTheme);
        setTheme(newTheme);
      }}
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
