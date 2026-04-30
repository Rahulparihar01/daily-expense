import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Mail, Lock, Loader2, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain a special character');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});
const forgotSchema = z.object({ email: z.string().email('Please enter a valid email') });
const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type AuthView = 'login' | 'forgot' | 'verify-otp' | 'reset';

export default function Login() {
  const [view, setView] = useState<AuthView>('login');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Sign in — ExpenseTrack';
  }, []);

  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const forgotForm = useForm<z.infer<typeof forgotSchema>>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { email: '' },
  });
  const newPasswordForm = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onLogin = async (data: z.infer<typeof loginSchema>) => {
    setLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (error) {
        toast({
          title: 'Login failed',
          description: error.message === 'Invalid login credentials'
            ? 'Invalid email or password. Please try again.'
            : error.message,
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Welcome back!', description: 'You have successfully logged in.' });
        navigate('/app', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const onForgot = async (data: z.infer<typeof forgotSchema>) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('send-password-reset-otp', {
        body: { email: data.email },
      });
      if (error || res?.error) {
        toast({
          title: 'Error',
          description: error?.message || res?.error || 'Failed to send reset code.',
          variant: 'destructive',
        });
        return;
      }
      setResetEmail(data.email);
      setView('verify-otp');
      toast({ title: 'Code sent!', description: 'Check your email for the verification code.' });
    } finally {
      setLoading(false);
    }
  };

  const onVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast({ title: 'Invalid code', description: 'Enter the 6-digit code.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('verify-otp-reset-password', {
        body: { email: resetEmail, otp, action: 'verify' },
      });
      if (error || res?.error) {
        toast({ title: 'Invalid code', description: error?.message || res?.error, variant: 'destructive' });
        return;
      }
      setView('reset');
      toast({ title: 'Code verified!', description: 'Set your new password.' });
    } finally {
      setLoading(false);
    }
  };

  const onResetPassword = async (data: z.infer<typeof newPasswordSchema>) => {
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke('verify-otp-reset-password', {
        body: { email: resetEmail, otp, newPassword: data.password, action: 'reset' },
      });
      if (error || res?.error) {
        toast({ title: 'Error', description: error?.message || res?.error, variant: 'destructive' });
        return;
      }
      toast({ title: 'Password updated!', description: 'You can now login with your new password.' });
      setOtp('');
      setResetEmail('');
      forgotForm.reset();
      newPasswordForm.reset();
      setView('login');
    } finally {
      setLoading(false);
    }
  };

  const backToLogin = () => {
    setOtp('');
    setResetEmail('');
    forgotForm.reset();
    newPasswordForm.reset();
    setView('login');
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      {/* Left: brand panel */}
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-12 flex-col justify-between">
        <div
          aria-hidden
          className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl"
        />
        <div
          aria-hidden
          className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl"
        />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">ExpenseTrack</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Take control of every rupee you spend.
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            Track expenses, set budgets, and get AI-powered insights — built for couples and individuals.
          </p>
        </div>
        <p className="relative text-sm text-primary-foreground/70">© {new Date().getFullYear()} ExpenseTrack</p>
      </div>

      {/* Right: auth form */}
      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          {view === 'login' && (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Welcome back</h1>
                <p className="text-muted-foreground mt-2">
                  Sign in to your account to continue.
                </p>
              </div>
              <Form {...loginForm}>
                <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                  <FormField
                    control={loginForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="email" placeholder="you@example.com" className="pl-10 h-11" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={loginForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Password</FormLabel>
                          <button
                            type="button"
                            onClick={() => setView('forgot')}
                            className="text-xs font-medium text-primary hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showPassword ? 'text' : 'password'}
                              placeholder="••••••••"
                              className="pl-10 pr-10 h-11"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((v) => !v)}
                              className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                              aria-label={showPassword ? 'Hide password' : 'Show password'}
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
              </Form>
              <p className="mt-6 text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{' '}
                <Link to="/signup" className="font-medium text-primary hover:underline">
                  Sign up
                </Link>
              </p>
            </>
          )}

          {view === 'forgot' && (
            <>
              <button
                onClick={backToLogin}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Forgot password?</h1>
                <p className="text-muted-foreground mt-2">
                  Enter your email and we’ll send you a verification code.
                </p>
              </div>
              <Form {...forgotForm}>
                <form onSubmit={forgotForm.handleSubmit(onForgot)} className="space-y-4">
                  <FormField
                    control={forgotForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="email" placeholder="you@example.com" className="pl-10 h-11" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending code...
                      </>
                    ) : (
                      'Send Reset Code'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}

          {view === 'verify-otp' && (
            <>
              <button
                onClick={backToLogin}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Verify code</h1>
                <p className="text-muted-foreground mt-2">
                  Enter the 6-digit code sent to <strong className="text-foreground">{resetEmail}</strong>.
                </p>
              </div>
              <div className="flex justify-center mb-6">
                <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                  <InputOTPGroup>
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                      <InputOTPSlot key={i} index={i} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              <Button onClick={onVerifyOtp} className="w-full h-11" disabled={loading || otp.length !== 6}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  'Verify Code'
                )}
              </Button>
              <Button
                variant="link"
                className="w-full mt-2"
                onClick={() => onForgot({ email: resetEmail })}
                disabled={loading}
              >
                Resend code
              </Button>
            </>
          )}

          {view === 'reset' && (
            <>
              <button
                onClick={backToLogin}
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="h-4 w-4" /> Back to sign in
              </button>
              <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">Set new password</h1>
                <p className="text-muted-foreground mt-2">Create a new password for your account.</p>
              </div>
              <Form {...newPasswordForm}>
                <form onSubmit={newPasswordForm.handleSubmit(onResetPassword)} className="space-y-4">
                  <FormField
                    control={newPasswordForm.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" className="pl-10 h-11" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={newPasswordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input type="password" placeholder="••••••••" className="pl-10 h-11" {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full h-11" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...
                      </>
                    ) : (
                      'Update Password'
                    )}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}