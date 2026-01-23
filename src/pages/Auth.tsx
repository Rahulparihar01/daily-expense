import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

// Strong password schema with complexity requirements
const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'Password must contain at least one special character');

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

const newPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
type NewPasswordFormData = z.infer<typeof newPasswordSchema>;

type AuthView = 'login' | 'forgot-password' | 'verify-otp' | 'reset-password';

export default function Auth() {
  const [isLoading, setIsLoading] = useState(false);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [resetEmail, setResetEmail] = useState('');
  const [otp, setOtp] = useState('');
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const forgotPasswordForm = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const newPasswordForm = useForm<NewPasswordFormData>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleLogin = async (data: LoginFormData) => {
    setIsLoading(true);
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
        toast({
          title: 'Welcome back!',
          description: 'You have successfully logged in.',
        });
        navigate('/');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (data: ForgotPasswordFormData) => {
    setIsLoading(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('send-password-reset-otp', {
        body: { email: data.email },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to send reset code. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (responseData?.error) {
        toast({
          title: 'Error',
          description: responseData.error,
          variant: 'destructive',
        });
        return;
      }

      setResetEmail(data.email);
      setAuthView('verify-otp');
      toast({
        title: 'Code sent!',
        description: 'Please check your email for the verification code.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid code',
        description: 'Please enter the 6-digit code from your email.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('verify-otp-reset-password', {
        body: { email: resetEmail, otp, action: 'verify' },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to verify code. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (responseData?.error) {
        toast({
          title: 'Invalid code',
          description: responseData.error,
          variant: 'destructive',
        });
        return;
      }

      setAuthView('reset-password');
      toast({
        title: 'Code verified!',
        description: 'You can now set your new password.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: NewPasswordFormData) => {
    setIsLoading(true);
    try {
      const { data: responseData, error } = await supabase.functions.invoke('verify-otp-reset-password', {
        body: { email: resetEmail, otp, newPassword: data.password, action: 'reset' },
      });

      if (error) {
        toast({
          title: 'Error',
          description: error.message || 'Failed to reset password. Please try again.',
          variant: 'destructive',
        });
        return;
      }

      if (responseData?.error) {
        toast({
          title: 'Error',
          description: responseData.error,
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Password updated!',
        description: 'You can now login with your new password.',
      });
      
      // Reset all forms and state
      setOtp('');
      setResetEmail('');
      forgotPasswordForm.reset();
      newPasswordForm.reset();
      setAuthView('login');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setOtp('');
    setResetEmail('');
    forgotPasswordForm.reset();
    newPasswordForm.reset();
    setAuthView('login');
  };

  const renderForgotPasswordView = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBackToLogin}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to login
      </Button>
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Forgot Password</h3>
        <p className="text-sm text-muted-foreground">
          Enter your email address and we'll send you a verification code.
        </p>
      </div>

      <Form {...forgotPasswordForm}>
        <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
          <FormField
            control={forgotPasswordForm.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending code...
              </>
            ) : (
              'Send Reset Code'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );

  const renderVerifyOTPView = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBackToLogin}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to login
      </Button>
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Verify Code</h3>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code sent to <strong>{resetEmail}</strong>
        </p>
      </div>

      <div className="flex justify-center mb-6">
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(value) => setOtp(value)}
        >
          <InputOTPGroup>
            <InputOTPSlot index={0} />
            <InputOTPSlot index={1} />
            <InputOTPSlot index={2} />
            <InputOTPSlot index={3} />
            <InputOTPSlot index={4} />
            <InputOTPSlot index={5} />
          </InputOTPGroup>
        </InputOTP>
      </div>

      <Button 
        onClick={handleVerifyOTP} 
        className="w-full" 
        disabled={isLoading || otp.length !== 6}
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Verifying...
          </>
        ) : (
          'Verify Code'
        )}
      </Button>

      <Button
        variant="link"
        className="w-full"
        onClick={() => handleForgotPassword({ email: resetEmail })}
        disabled={isLoading}
      >
        Resend code
      </Button>
    </div>
  );

  const renderResetPasswordView = () => (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBackToLogin}
        className="mb-2 -ml-2"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to login
      </Button>
      
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold">Set New Password</h3>
        <p className="text-sm text-muted-foreground">
          Create a new password for your account.
        </p>
      </div>

      <Form {...newPasswordForm}>
        <form onSubmit={newPasswordForm.handleSubmit(handleResetPassword)} className="space-y-4">
          <FormField
            control={newPasswordForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...field}
                    />
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
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );

  const renderLoginView = () => (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
        <FormField
          control={loginForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    className="pl-10"
                    {...field}
                  />
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
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="text-right">
          <Button
            type="button"
            variant="link"
            className="p-0 h-auto text-sm"
            onClick={() => setAuthView('forgot-password')}
          >
            Forgot password?
          </Button>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            'Login'
          )}
        </Button>
      </form>
    </Form>
  );

  const renderAuthContent = () => {
    switch (authView) {
      case 'forgot-password':
        return renderForgotPasswordView();
      case 'verify-otp':
        return renderVerifyOTPView();
      case 'reset-password':
        return renderResetPasswordView();
      default:
        return renderLoginView();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <Card className="w-full max-w-md shadow-soft">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center mb-2">
            <Wallet className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Expense Tracker</CardTitle>
          <CardDescription>
            Login to manage your expenses
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderAuthContent()}
        </CardContent>
      </Card>
    </div>
  );
}
