'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/context/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import Script from 'next/script';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import DemoInbox from '@/components/landing/DemoInbox';
import AutoReplyDemo from '@/components/landing/AutoReplyDemo';

const HeroBackground = dynamic(() => import('@/components/HeroBackground'), { ssr: false });
import {
  Sparkles,
  Zap,
  Users,
  Mail,
  MessageCircle,
  MessageSquare,
  Check,
  ArrowRight,
  Star,
  Moon,
} from 'lucide-react';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);

  const currentTheme = mounted ? theme : 'dark';

  const handleHeroVisibility = useCallback((visible: boolean) => {
    setIsHeroVisible(visible);
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (loading || user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-purple-100 dark:from-purple-900/60 dark:via-indigo-950/80 dark:to-slate-950">
      {/* Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-purple-600/10 backdrop-blur-md border-b border-purple-400/30 shadow-[0_4px_12px_-2px_rgba(139,92,246,0.15)]'
          : 'bg-transparent border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.svg" alt="InboxForge" width={32} height={32} className="w-8 h-8" />
              <span className={`text-xl font-bold transition-colors ${isScrolled ? 'text-primary dark:text-white' : ''}`}>InboxForge</span>
            </Link>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className={`text-sm transition-colors ${isScrolled ? 'text-primary hover:text-primary/80 dark:text-white/90 dark:hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                Features
              </a>
              <a href="#how-it-works" className={`text-sm transition-colors ${isScrolled ? 'text-primary hover:text-primary/80 dark:text-white/90 dark:hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                How It Works
              </a>
              <a href="#pricing" className={`text-sm transition-colors ${isScrolled ? 'text-primary hover:text-primary/80 dark:text-white/90 dark:hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}>
                Pricing
              </a>
            </div>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <Link
                href="/login"
                className={`text-sm transition-colors ${isScrolled ? 'text-primary hover:text-primary/80 dark:text-white/90 dark:hover:text-white' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isScrolled
                    ? 'bg-white text-purple-600 hover:bg-white/90'
                    : 'bg-primary text-primary-foreground hover:opacity-90'
                }`}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 to-primary/20 border border-primary/30 text-primary text-sm mb-6 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span className="font-semibold">The AI Front Desk for Your Business Email</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              Every Customer Email.
              <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mt-2 pb-1">Triaged, Prioritized, Answered.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Forward your business email to InboxForge in minutes. AI reads every message, alerts you to what&apos;s urgent, drafts on-brand replies, and answers customers after hours.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-border rounded-lg text-lg font-semibold hover:bg-accent transition-colors"
              >
                View Pricing
              </a>
            </div>
            <p className="text-sm text-muted-foreground mt-4">
              14-day free trial · No credit card required · Cancel anytime
            </p>
          </div>

          {/* Hero Image - Dashboard Preview */}
          <DemoInbox
            currentTheme={currentTheme}
            isVisible={isHeroVisible}
            onVisibilityChange={handleHeroVisibility}
            loading={loading}
            user={user}
          />
        </div>
      </section>

      {/* Social Proof / Stats */}
      <section className="py-16 border-b border-purple-200 dark:border-purple-400/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm dark:bg-slate-900/40 dark:border-purple-400/20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Zap className="w-8 h-8 text-primary" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">10x</div>
              <div className="text-slate-600 dark:text-muted-foreground font-medium">Faster Response Times</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm dark:bg-slate-900/40 dark:border-purple-400/20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Moon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">24/7</div>
              <div className="text-slate-600 dark:text-muted-foreground font-medium">After-Hours Coverage</div>
            </div>
            <div className="text-center p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm dark:bg-slate-900/40 dark:border-purple-400/20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Star className="w-8 h-8 text-primary fill-primary" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">95%</div>
              <div className="text-slate-600 dark:text-muted-foreground font-medium">Customer Satisfaction</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-purple-200 dark:border-purple-400/30 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.08)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Everything your inbox is missing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for small businesses drowning in customer email
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Smart Email Triage</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                AI reads and classifies every inbound email the moment it arrives — urgent, important, or routine — so you always know what to open first.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Urgent Alerts</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Get notified the moment something can&apos;t wait — an upset customer, a time-sensitive order, a payment issue. Everything else stays quiet.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Moon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">After-Hours Auto-Reply</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Set your business hours once. When you&apos;re closed, AI answers customers instantly with real, helpful replies — not &quot;we&apos;ll get back to you.&quot;
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Mail className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">All Your Addresses, One Inbox</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                support@, orders@, info@ — connect every address with simple email forwarding and handle them all from a single unified inbox.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Insights</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                AI builds notes on every customer automatically — past orders, preferences, open issues — so you never start a reply from zero.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Replies, Your Voice</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Drafts and auto-replies are powered by Claude and grounded in your knowledge base, FAQs, and brand voice — accurate, never generic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-purple-200 dark:border-purple-400/30 overflow-hidden">
        <HeroBackground />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get up and running in minutes, not days
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Forward Your Email</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Point your existing addresses at your unique InboxForge forwarding address. No migration, no DNS changes — verified and live in minutes.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">AI Triages Every Message</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Claude reads each email as it arrives — classifying it, alerting you to urgent issues, and building customer notes automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Reply Fast — or Let AI</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Answer with one-click AI drafts during the day, and let after-hours auto-reply cover your nights and weekends.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Channels/Integrations */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-purple-200 dark:border-purple-400/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Email First. More Channels Coming.
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We do business email exceptionally well today — and the same AI front desk will answer every channel you add next
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg text-center hover:shadow-xl hover:bg-white/90 transition-all group dark:border-purple-400/20 dark:bg-slate-900/40 dark:hover:bg-slate-900/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-sm text-slate-600 dark:text-muted-foreground">Connect unlimited addresses via forwarding — AI triage, alerts, and auto-reply built in</p>
              <div className="mt-4 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium inline-block">
                Active
              </div>
            </div>

            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg text-center hover:shadow-xl hover:bg-white/90 transition-all group dark:border-purple-400/20 dark:bg-slate-900/40 dark:hover:bg-slate-900/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Live Chat Widget</h3>
              <p className="text-sm text-slate-600 dark:text-muted-foreground">AI-powered chat on your website, answered from the same inbox</p>
              <div className="mt-4 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium inline-block">
                Active
              </div>
            </div>

            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg text-center hover:shadow-xl hover:bg-white/90 transition-all group dark:border-purple-400/20 dark:bg-slate-900/40 dark:hover:bg-slate-900/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
              <p className="text-sm text-slate-600 dark:text-muted-foreground">WhatsApp Business messaging through the same unified inbox</p>
              <div className="mt-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium inline-block">
                Coming Soon
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">On the roadmap:</span> Instagram DMs, Facebook Messenger, SMS
            </p>
          </div>
        </div>
      </section>

      {/* Auto-Reply Demo Section */}
      <AutoReplyDemo
        currentTheme={currentTheme}
        loading={loading}
        user={user}
      />

      {/* Pricing Section */}
      <section id="pricing" className="relative py-24 px-4 sm:px-6 lg:px-8 border-b border-purple-200 dark:border-purple-400/30 overflow-hidden">
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.08)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free, scale as you grow. No hidden fees.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free Tier */}
            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg shadow-sm flex flex-col dark:border-purple-400/20 dark:bg-slate-900/40">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Free</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-slate-600 dark:text-muted-foreground">Perfect for trying out InboxForge</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-700 dark:text-slate-200">50 conversations/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">1 email address</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">1 user</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">AI triage & reply drafts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Community support</span>
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 border-2 border-border rounded-lg font-semibold hover:bg-accent transition-colors"
              >
                Get Started
              </Link>
            </div>

            {/* Starter Tier */}
            <div className="p-8 rounded-xl border-2 border-purple-300 bg-white/70 backdrop-blur-lg shadow-md relative flex flex-col dark:border-purple-400/50 dark:bg-transparent">
              <div className="absolute inset-0 rounded-xl bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-100 via-purple-200 to-purple-300 opacity-40 pointer-events-none dark:from-purple-950 dark:via-purple-800 dark:to-purple-700 dark:opacity-60"></div>
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-semibold rounded-full z-10">
                Most Popular
              </div>

              <div className="relative z-10 flex flex-col flex-grow">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Starter</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-slate-600 dark:text-muted-foreground">For small teams getting started</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">500 conversations/month</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">3 email addresses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">3 team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">After-hours auto-reply</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Urgent email alerts</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Email support</span>
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
              >
                Upgrade to Starter
              </Link>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg shadow-sm flex flex-col dark:border-purple-400/20 dark:bg-slate-900/40">
              <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Pro</h3>
                <div className="mb-4">
                  <span className="text-4xl font-bold">$79</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-slate-600 dark:text-muted-foreground">For growing businesses</p>
              </div>

              <ul className="space-y-3 mb-8 flex-grow">
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited conversations</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited email addresses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">10 team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced AI features</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Advanced analytics + exports</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Priority support</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Website live chat widget</span>
                </li>
              </ul>

              <Link
                href="/signup"
                className="block w-full text-center px-6 py-3 border-2 border-border rounded-lg font-semibold hover:bg-accent transition-colors"
              >
                Upgrade to Pro
              </Link>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              All plans include a 14-day free trial. No credit card required.
            </p>
            <p className="text-sm text-muted-foreground">
              Need more? <a href="mailto:sales@inboxforge.com" className="text-primary hover:underline">Contact us</a> for Enterprise pricing
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Your inbox, on autopilot
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to stop drowning in email?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Give your business an AI front desk that triages every email, flags what matters, and answers customers — even at 2am.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity shadow-lg hover:shadow-xl"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-border rounded-lg text-lg font-semibold hover:bg-accent transition-colors"
            >
              Talk to Sales
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-purple-200 dark:border-purple-400/30 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.1)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(139,92,246,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.05)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_100%,#000_70%,transparent_110%)]" />
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><a href="#features" className="text-sm text-muted-foreground hover:text-foreground">Features</a></li>
                <li><a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground">Pricing</a></li>
                <li><a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground">How It Works</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link href="/contact" className="text-sm text-muted-foreground hover:text-foreground">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/data-deletion" className="text-sm text-muted-foreground hover:text-foreground">Data Deletion</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <ul className="space-y-2">
                <li><a href="mailto:inboxforgeapp@outlook.com" className="text-sm text-muted-foreground hover:text-foreground">Email Support</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-purple-200 dark:border-border pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Image src="/logo.svg" alt="InboxForge" width={24} height={24} className="w-6 h-6" />
              <span className="font-semibold">InboxForge</span>
            </div>
            <p className="text-sm text-muted-foreground">
              &copy; 2025 InboxForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Our own chat widget, eating our own dog food. The loader finds its
          tag via the data-key fallback since next/script injects dynamically. */}
      {process.env.NEXT_PUBLIC_WIDGET_KEY && (
        <Script
          src="/widget.js"
          data-key={process.env.NEXT_PUBLIC_WIDGET_KEY}
          strategy="afterInteractive"
        />
      )}
    </div>
  );
}
