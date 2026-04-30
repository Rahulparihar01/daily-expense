import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet, Mail, Lock, User as UserIcon, Loader2, ArrowLeft, Eye, EyeOff, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const passwordSchema = z.string()
  .min(8, 'At least 8 characters')
  .regex(/[a-z]/, 'Must contain a lowercase letter')
  .regex(/[A-Z]/, 'Must contain an uppercase letter')
  .regex(/[0-9]/, 'Must contain a number')
  .regex(/[^a-zA-Z0-9]/, 'Must contain a special character');

const signupSchema = z.object({
  name: z.string().min(2, 'Please enter your name').max(50),
  email: z.string().email('Please enter a valid email'),
  password: passwordSchema,
  role: z.enum(['husband', 'wife']),
});

type FormData = z.infer<typeof signupSchema>;

export default function Signup() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = 'Create account — ExpenseTrack';
  }, []);

  useEffect(() => {
    if (user) navigate('/app', { replace: true });
  }, [user, navigate]);

  const form = useForm<FormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '', role: 'husband' },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const { error } = await signUp(data.email, data.password, data.name, data.role);
      if (error) {
        toast({
          title: 'Sign up failed',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Account created!',
          description: 'Please check your email to confirm your account.',
        });
        navigate('/login', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  const password = form.watch('password') || '';
  const checks = [
    { label: '8+ characters', valid: password.length >= 8 },
    { label: 'Uppercase & lowercase', valid: /[a-z]/.test(password) && /[A-Z]/.test(password) },
    { label: 'Number', valid: /[0-9]/.test(password) },
    { label: 'Special character', valid: /[^a-zA-Z0-9]/.test(password) },
  ];

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-background">
      <div className="hidden lg:flex relative overflow-hidden bg-gradient-to-br from-primary via-primary to-primary/80 text-primary-foreground p-12 flex-col justify-between">
        <div aria-hidden className="absolute -top-32 -right-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div aria-hidden className="absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <Link to="/" className="relative flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
            <Wallet className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">ExpenseTrack</span>
        </Link>
        <div className="relative">
          <h2 className="text-4xl font-bold leading-tight mb-4">
            Start tracking smarter, today.
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md mb-6">
            Join couples and individuals who use ExpenseTrack to gain real clarity over their money.
          </p>
          <ul className="space-y-2 text-primary-foreground/90">
            {['Free to use', 'Bank-grade security', 'Beautiful insights & charts'].map((b) => (
              <li key={b} className="flex items-center gap-2">
                <Check className="h-4 w-4" /> {b}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-foreground/70">© {new Date().getFullYear()} ExpenseTrack</p>
      </div>

      <div className="flex flex-col justify-center p-6 sm:p-10">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Create your account</h1>
            <p className="text-muted-foreground mt-2">It only takes a minute to get started.</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Jane Doe" className="pl-10 h-11" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
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
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
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
                    <div className="grid grid-cols-2 gap-1.5 mt-2">
                      {checks.map((c) => (
                        <div
                          key={c.label}
                          className={`flex items-center gap-1.5 text-xs ${
                            c.valid ? 'text-primary' : 'text-muted-foreground'
                          }`}
                        >
                          <Check className={`h-3 w-3 ${c.valid ? 'opacity-100' : 'opacity-40'}`} />
                          {c.label}
                        </div>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am the</FormLabel>
                    <FormControl>
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-2 gap-3"
                      >
                        {(['husband', 'wife'] as const).map((r) => (
                          <label
                            key={r}
                            htmlFor={`role-${r}`}
                            className={`flex items-center gap-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                              field.value === r
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-accent'
                            }`}
                          >
                            <RadioGroupItem value={r} id={`role-${r}`} />
                            <span className="text-sm font-medium capitalize">{r}</span>
                          </label>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full h-11 text-base" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>
          </Form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}