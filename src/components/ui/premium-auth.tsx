import * as React from 'react';
import { useState, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { 
  Mail, 
  Lock, 
  User, 
  Eye, 
  EyeOff,  
  KeyRound,
  Loader2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type AuthMode = 'login' | 'signup' | 'reset';

interface AuthFormProps {
  onSignIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  onSignUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>;
  onSignInWithGoogle: () => Promise<{ error: Error | null }>;
  onSuccess?: () => void;
  initialMode?: AuthMode;
  className?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

interface PasswordStrength {
  score: number;
  feedback: string[];
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
    special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const feedback: string[] = [];

  if (!requirements.length) feedback.push('At least 8 characters');
  if (!requirements.uppercase) feedback.push('One uppercase letter');
  if (!requirements.lowercase) feedback.push('One lowercase letter');
  if (!requirements.number) feedback.push('One number');
  if (!requirements.special) feedback.push('One special character');

  return { score, feedback, requirements };
};

const PasswordStrengthIndicator: React.FC<{ password: string }> = ({ password }) => {
  const strength = calculatePasswordStrength(password);
  
  const getStrengthColor = (score: number) => {
    if (score <= 1) return 'text-destructive';
    if (score <= 2) return 'text-orange-500';
    if (score <= 3) return 'text-yellow-500';
    if (score <= 4) return 'text-blue-500';
    return 'text-primary';
  };

  const getStrengthBarColor = (score: number) => {
    if (score <= 1) return 'bg-destructive';
    if (score <= 2) return 'bg-orange-500';
    if (score <= 3) return 'bg-yellow-500';
    if (score <= 4) return 'bg-blue-500';
    return 'bg-primary';
  };

  const getStrengthText = (score: number) => {
    if (score <= 1) return 'Very Weak';
    if (score <= 2) return 'Weak';
    if (score <= 3) return 'Fair';
    if (score <= 4) return 'Good';
    return 'Strong';
  };

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex gap-1 flex-1 mr-2">
          {[1, 2, 3, 4, 5].map((level) => (
            <div
              key={level}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                level <= strength.score ? getStrengthBarColor(strength.score) : "bg-muted"
              )}
            />
          ))}
        </div>
        <span className={cn("text-xs font-medium", getStrengthColor(strength.score))}>
          {getStrengthText(strength.score)}
        </span>
      </div>

      {strength.feedback.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {strength.feedback.map((item, index) => (
            <span
              key={index}
              className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export function AuthForm({
  onSignIn,
  onSignUp,
  onSignInWithGoogle,
  onSuccess,
  initialMode = 'login',
  className,
}: AuthFormProps) {
  const [authMode, setAuthMode] = useState<AuthMode>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [fieldTouched, setFieldTouched] = useState<Record<string, boolean>>({});

  const validateField = useCallback((field: keyof FormData, value: string) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (authMode === 'signup' && !value.trim()) {
          error = 'Display name is required';
        }
        break;
        
      case 'email':
        if (!value.trim()) {
          error = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          error = 'Please enter a valid email address';
        }
        break;
        
      case 'password':
        if (!value) {
          error = 'Password is required';
        } else if (value.length < 6) {
          error = 'Password must be at least 6 characters';
        } else if (authMode === 'signup') {
          const strength = calculatePasswordStrength(value);
          if (strength.score < 3) {
            error = 'Password is too weak';
          }
        }
        break;
        
      case 'confirmPassword':
        if (authMode === 'signup' && value !== formData.password) {
          error = 'Passwords do not match';
        }
        break;
    }
    
    return error;
  }, [formData.password, authMode]);

  const handleInputChange = useCallback((field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (fieldTouched[field]) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error || undefined }));
    }
  }, [fieldTouched, validateField]);

  const handleFieldBlur = useCallback((field: keyof FormData) => {
    setFieldTouched(prev => ({ ...prev, [field]: true }));
    const value = formData[field];
    const error = validateField(field, value);
    setErrors(prev => ({ ...prev, [field]: error || undefined }));
  }, [formData, validateField]);

  const validateForm = useCallback(() => {
    const newErrors: FormErrors = {};
    const fieldsToValidate: (keyof FormData)[] = ['email', 'password'];
    
    if (authMode === 'signup') {
      fieldsToValidate.push('name', 'confirmPassword');
    }

    fieldsToValidate.forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) newErrors[field] = error;
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [authMode, formData, validateField]);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrors({});
    
    const { error } = await onSignInWithGoogle();
    
    if (error) {
      setErrors({ general: error.message });
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setIsLoading(true);
    setErrors({});
    
    try {
      if (authMode === 'login') {
        const { error } = await onSignIn(formData.email, formData.password);
        if (error) {
          setErrors({ general: error.message });
        } else {
          setSuccessMessage('Login successful!');
          onSuccess?.();
        }
      } else if (authMode === 'signup') {
        const { error } = await onSignUp(formData.email, formData.password, formData.name);
        if (error) {
          setErrors({ general: error.message });
        } else {
          setSuccessMessage('Account created successfully!');
          onSuccess?.();
        }
      } else if (authMode === 'reset') {
        setSuccessMessage('Password reset email sent!');
        setTimeout(() => setAuthMode('login'), 2000);
      }
    } catch {
      setErrors({ general: 'An unexpected error occurred. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const renderResetForm = () => (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <KeyRound className="w-12 h-12 mx-auto text-primary" />
        <h3 className="text-xl font-semibold text-foreground">Password Recovery</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
              errors.email ? "border-destructive" : "border-input"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            <Mail className="w-5 h-5" />
            Send Reset Link
          </>
        )}
      </button>

      <div className="text-center">
        <button
          type="button"
          onClick={() => setAuthMode('login')}
          className="text-primary hover:text-primary/80 text-sm transition-colors"
        >
          Back to Login
        </button>
      </div>
    </div>
  );

  const renderAuthForm = () => (
    <div className="space-y-4">
      {authMode === 'signup' && (
        <div className="space-y-1">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Display Name"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              onBlur={() => handleFieldBlur('name')}
              className={cn(
                "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.name ? "border-destructive" : "border-input"
              )}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.name}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-1">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="email"
            placeholder="Email Address"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            onBlur={() => handleFieldBlur('email')}
            className={cn(
              "w-full pl-10 pr-4 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
              errors.email ? "border-destructive" : "border-input"
            )}
          />
          {errors.email && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errors.email}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            value={formData.password}
            onChange={(e) => handleInputChange('password', e.target.value)}
            onBlur={() => handleFieldBlur('password')}
            className={cn(
              "w-full pl-10 pr-12 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
              errors.password ? "border-destructive" : "border-input"
            )}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
          {errors.password && (
            <p className="mt-1 text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {errors.password}
            </p>
          )}
        </div>
        {authMode === 'signup' && (
          <PasswordStrengthIndicator password={formData.password} />
        )}
      </div>

      {authMode === 'signup' && (
        <div className="space-y-1">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              onBlur={() => handleFieldBlur('confirmPassword')}
              className={cn(
                "w-full pl-10 pr-12 py-3 bg-muted/50 border rounded-xl placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all",
                errors.confirmPassword ? "border-destructive" : "border-input"
              )}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-destructive flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                {errors.confirmPassword}
              </p>
            )}
          </div>
        </div>
      )}

      {authMode === 'login' && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setAuthMode('reset')}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            Forgot password?
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 px-4 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          authMode === 'login' ? 'Sign In' : 'Create Account'
        )}
      </button>
    </div>
  );

  return (
    <div className={cn("w-full max-w-md mx-auto space-y-6", className)}>
      {successMessage && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          {errors.general}
        </div>
      )}

      {authMode !== 'reset' && (
        <div className="flex p-1 bg-muted rounded-xl">
          <button
            onClick={() => setAuthMode('login')}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              authMode === 'login'
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            Login
          </button>
          <button
            onClick={() => setAuthMode('signup')}
            className={cn(
              "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
              authMode === 'signup'
                ? "bg-background text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            )}
            type="button"
          >
            Sign Up
          </button>
        </div>
      )}

      {authMode !== 'reset' && (
        <>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full py-3 px-4 bg-background border border-input rounded-xl font-medium hover:bg-muted/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isGoogleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <GoogleIcon />
                <span className="text-foreground">Continue with Google</span>
              </>
            )}
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-input" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit}>
        {authMode === 'reset' ? renderResetForm() : renderAuthForm()}
      </form>

      {authMode !== 'reset' && (
        <div className="text-center pt-4 border-t border-input">
          <p className="text-sm text-muted-foreground">
            {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              {authMode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </p>
        </div>
      )}
    </div>
  );
}
