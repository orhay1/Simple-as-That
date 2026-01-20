import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/ui/premium-auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { DottedSurface } from '@/components/ui/dotted-surface';
import logoDark from '@/assets/logo-dark.png';
import logoLight from '@/assets/logo-light.png';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const logoSrc = mounted && resolvedTheme === 'dark' ? logoDark : logoLight;

  const handleSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated Background */}
      <DottedSurface />

      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md space-y-8">
          {/* Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto h-20 w-20">
              <img 
                src={logoSrc} 
                alt="Simple as That" 
                className="h-full w-full object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Simple as That</h1>
            <p className="text-muted-foreground">Content Studio for LinkedIn</p>
          </div>

          {/* Auth Form */}
          <AuthForm
            onSignIn={signIn}
            onSignUp={signUp}
            onSignInWithGoogle={signInWithGoogle}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
}
