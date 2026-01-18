import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthForm } from '@/components/ui/premium-auth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Zap } from 'lucide-react';

export default function Auth() {
  const { signIn, signUp, signInWithGoogle, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  const handleSuccess = () => {
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-8">
          {/* Branding */}
          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Zap className="h-7 w-7" />
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
