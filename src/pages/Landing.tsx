import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Wallet,
  PieChart,
  Bell,
  Users,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  Menu,
  X,
  Mail,
  Github,
  Twitter,
  MessageCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { LogOut, LayoutDashboard } from 'lucide-react';

const navItems = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'About', href: '#about' },
  { label: 'Testimonials', href: '#testimonials' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

const features = [
  {
    icon: Users,
    title: 'Dual Tracking',
    description: 'Track expenses for both partners with Husband & Wife roles in one shared view.',
  },
  {
    icon: PieChart,
    title: 'Smart Insights',
    description: 'Beautiful charts break down spending by category, day, and payment method.',
  },
  {
    icon: Bell,
    title: 'Spending Limits',
    description: 'Set monthly budgets and get instant alerts when you’re close to the cap.',
  },
  {
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Ask questions about your spending in plain English and get instant answers.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your data is encrypted and protected with strict row-level security.',
  },
  {
    icon: Wallet,
    title: 'Income & Balance',
    description: 'Log monthly income and see exactly what’s left after every expense.',
  },
];

const testimonials = [
  {
    name: 'Priya & Rahul',
    role: 'Couple, Bengaluru',
    quote: 'Finally we both see the same numbers. No more arguments about who spent what — it’s right there.',
  },
  {
    name: 'Aman Verma',
    role: 'Freelance Designer',
    quote: 'The AI chat is brilliant. I just type “how much on food this month?” and it answers instantly.',
  },
  {
    name: 'Sneha Kapoor',
    role: 'Product Manager',
    quote: 'Clean, fast, and the monthly limits actually changed how I spend. Love the green theme too.',
  },
];

const faqs = [
  {
    q: 'Is ExpenseTrack free to use?',
    a: 'Yes — the core tracker, dashboard, charts, and AI assistant are free for invited users.',
  },
  {
    q: 'How is my financial data protected?',
    a: 'All data is stored in an encrypted database with row-level security so only you can read your records.',
  },
  {
    q: 'Can two people share one account?',
    a: 'Yes. Every expense is tagged Husband or Wife so couples can track together while keeping things clear.',
  },
  {
    q: 'Can I export my data?',
    a: 'Yes — export your full expense history to CSV any time from the dashboard.',
  },
  {
    q: 'Do you have a mobile app?',
    a: 'Not yet, but the web app is fully optimized for phones and tablets.',
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.title = 'ExpenseTrack — Effortless expense tracking for couples & individuals';
    const desc =
      'Track expenses, set budgets, and get AI-powered insights. Built for couples and individuals who want clarity over their money.';
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', desc);
  }, []);

  const goToSignup = () => navigate(user ? '/app' : '/signup');
  const goToLogin = () => navigate(user ? '/app' : '/login');
  const handleSignOut = async () => {
    await signOut();
    toast({ title: 'Signed out', description: 'You have been signed out.' });
  };

  const handleContactSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    toast({
      title: 'Message sent',
      description: 'Thanks for reaching out — we’ll reply within 24 hours.',
    });
    (e.target as HTMLFormElement).reset();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* NAV */}
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all ${
          scrolled
            ? 'bg-background/85 backdrop-blur-md border-b border-border shadow-sm'
            : 'bg-transparent'
        }`}
      >
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <a href="#home" className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-soft">
              <Wallet className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg">ExpenseTrack</span>
          </a>

          <nav className="hidden md:flex items-center gap-7">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Button variant="ghost" onClick={() => navigate('/app')} className="gap-2">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Button>
                <Button variant="outline" onClick={handleSignOut} className="gap-2">
                  <LogOut className="h-4 w-4" /> Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={goToLogin}>
                  Sign In
                </Button>
                <Button onClick={goToSignup} className="gap-2">
                  Sign Up <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <button
            className="md:hidden p-2 rounded-md hover:bg-accent"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t border-border bg-background/95 backdrop-blur">
            <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-3 py-2 rounded-md text-sm font-medium hover:bg-accent transition-colors"
                >
                  {item.label}
                </a>
              ))}
              {user ? (
                <>
                  <Button onClick={() => { setMobileOpen(false); navigate('/app'); }} className="mt-2 gap-2">
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Button>
                  <Button variant="outline" onClick={() => { setMobileOpen(false); handleSignOut(); }} className="mt-2 gap-2">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => { setMobileOpen(false); goToLogin(); }} className="mt-2">
                    Sign In
                  </Button>
                  <Button onClick={() => { setMobileOpen(false); goToSignup(); }} className="mt-2 gap-2">
                    Sign Up <ArrowRight className="h-4 w-4" />
                  </Button>
                </>
              )}
            </nav>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section
          id="home"
          className="relative pt-32 pb-20 md:pt-40 md:pb-28 overflow-hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-b from-accent/40 via-background to-background"
          />
          <div
            aria-hidden
            className="absolute -z-10 top-20 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full bg-primary/10 blur-3xl"
          />

          <div className="container mx-auto px-4 text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Now with AI-powered expense insights
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
              Take control of every rupee you spend.
            </h1>
            <p className="mt-5 text-lg md:text-xl text-muted-foreground leading-relaxed">
              ExpenseTrack helps couples and individuals log expenses, set budgets,
              and understand their money with beautiful charts and AI insights.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" onClick={goToSignup} className="gap-2 h-12 px-7 text-base">
                {user ? 'Open Dashboard' : 'Get Started Free'} <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="h-12 px-7 text-base"
              >
                <a href="#features">See how it works</a>
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> No credit card</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Bank-grade security</div>
              <div className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Mobile friendly</div>
            </div>
          </div>

          {/* Trust strip */}
          <div className="container mx-auto px-4 mt-16">
            <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">
              Trusted by couples and freelancers
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto opacity-70">
              {['Northwind', 'Acme Co.', 'Globex', 'Initech'].map((b) => (
                <div
                  key={b}
                  className="text-center font-semibold text-muted-foreground tracking-wide"
                >
                  {b}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="py-20 md:py-28 bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Everything you need, nothing you don’t
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Simple tools that make tracking expenses fast, clear, and actually useful.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f) => (
                <div
                  key={f.title}
                  className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-soft hover:-translate-y-0.5"
                >
                  <div className="h-11 w-11 rounded-xl bg-accent flex items-center justify-center mb-4 transition-colors group-hover:bg-primary">
                    <f.icon className="h-5 w-5 text-accent-foreground transition-colors group-hover:text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-1.5">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="py-20 md:py-28">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 items-center">
            <div>
              <p className="text-sm font-semibold text-primary uppercase tracking-wider mb-3">
                About ExpenseTrack
              </p>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-5">
                Built for the people who actually pay the bills.
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-4">
                We started ExpenseTrack because every spreadsheet we tried turned into
                a chore. Couples needed a shared view. Individuals needed clarity.
                Everyone needed it to be fast.
              </p>
              <ul className="space-y-2.5 mt-6">
                {[
                  'Designed for two — track Husband & Wife in one place',
                  'Real-time budgets and limit alerts',
                  'AI assistant trained on your spending',
                  'CSV export, never locked in',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Button onClick={goToSignup} className="mt-8 gap-2">
                Start tracking now <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent rounded-3xl blur-2xl" />
              <div className="relative rounded-3xl border border-border bg-card p-6 shadow-soft">
                <div className="flex items-center gap-2 mb-5">
                  <div className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-warning/70" />
                  <div className="h-2.5 w-2.5 rounded-full bg-primary/70" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center p-4 rounded-xl bg-secondary">
                    <div>
                      <p className="text-xs text-muted-foreground">This month</p>
                      <p className="font-bold text-2xl">₹ 24,580</p>
                    </div>
                    <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <PieChart className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  {[
                    { c: 'Groceries', v: 8200, p: 70 },
                    { c: 'Dining', v: 4100, p: 45 },
                    { c: 'Transport', v: 2300, p: 30 },
                  ].map((row) => (
                    <div key={row.c} className="p-3 rounded-xl bg-secondary/50">
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-medium">{row.c}</span>
                        <span className="text-muted-foreground">₹ {row.v.toLocaleString()}</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-background overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${row.p}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* TESTIMONIALS */}
        <section id="testimonials" className="py-20 md:py-28 bg-secondary/40">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Loved by people who hate spreadsheets
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Honest words from real users.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-5">
              {testimonials.map((t) => (
                <div
                  key={t.name}
                  className="rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-soft"
                >
                  <div className="text-primary text-3xl leading-none mb-3">“</div>
                  <p className="text-sm leading-relaxed mb-5">{t.quote}</p>
                  <div className="flex items-center gap-3 pt-4 border-t border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center font-semibold text-primary">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-20 md:py-28">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
                Frequently asked questions
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Can’t find what you’re looking for?{' '}
                <a href="#contact" className="text-primary font-medium hover:underline">
                  Contact us
                </a>
                .
              </p>
            </div>
            <Accordion type="single" collapsible className="w-full space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="rounded-xl border border-border bg-card px-5"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* CONTACT / CTA */}
        <section id="contact" className="py-20 md:py-28 bg-secondary/40">
          <div className="container mx-auto px-4 grid md:grid-cols-2 gap-10 md:gap-16 max-w-5xl">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                Ready to take control?
              </h2>
              <p className="text-muted-foreground text-lg mb-6">
                Send us a message or jump straight in — your dashboard is one click away.
              </p>
              <div className="space-y-3">
                <a
                  href="mailto:hello@expensetrack.app"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-soft transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <Mail className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email us</p>
                    <p className="font-medium text-sm">hello@expensetrack.app</p>
                  </div>
                </a>
                <a
                  href="https://wa.me/919999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:shadow-soft transition-all"
                >
                  <div className="h-10 w-10 rounded-lg bg-accent flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Chat on WhatsApp</p>
                    <p className="font-medium text-sm">Usually reply within an hour</p>
                  </div>
                </a>
              </div>
            </div>
            <form
              onSubmit={handleContactSubmit}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4"
            >
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input required placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <Input required type="email" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Message</label>
                <Textarea required rows={4} placeholder="How can we help?" />
              </div>
              <Button type="submit" className="w-full gap-2">
                Send message <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-12 grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">ExpenseTrack</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
              Effortless expense tracking for couples and individuals. Clarity over your money,
              every single day.
            </p>
            <div className="flex items-center gap-2 mt-5">
              <a
                href="#"
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="mailto:hello@expensetrack.app"
                className="h-9 w-9 rounded-lg border border-border flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Product</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground">Features</a></li>
              <li><a href="#about" className="hover:text-foreground">About</a></li>
              <li><a href="#faq" className="hover:text-foreground">FAQ</a></li>
              <li><Link to="/app" className="hover:text-foreground">Open Dashboard</Link></li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-sm mb-3">Contact</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>hello@expensetrack.app</li>
              <li>+91 99999 99999</li>
              <li><a href="#contact" className="hover:text-foreground">Contact form</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border">
          <div className="container mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} ExpenseTrack. All rights reserved.</p>
            <div className="flex gap-5">
              <a href="#" className="hover:text-foreground">Privacy</a>
              <a href="#" className="hover:text-foreground">Terms</a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp */}
      <a
        href="https://wa.me/919999999999"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat on WhatsApp"
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
      >
        <MessageCircle className="h-6 w-6" />
      </a>
    </div>
  );
}