'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useTheme } from '@/lib/context/ThemeContext';
import Link from 'next/link';
import Image from 'next/image';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import {
  MessageSquare,
  Sparkles,
  Zap,
  Users,
  BarChart3,
  Instagram,
  Mail,
  MessageCircle,
  Check,
  ArrowRight,
  TrendingUp,
  Star,
  Music,
  Send,
  Lightbulb,
  Facebook
} from 'lucide-react';

// =============================================================================
// DEMO CONVERSATIONS - Add new conversations here!
// =============================================================================
type ChannelType = 'instagram' | 'whatsapp' | 'tiktok' | 'email' | 'facebook' | 'sms';

interface DemoMessage {
  from: 'customer' | 'support';
  text: string;
  time: string;
  isAiGenerated?: boolean;
}

interface DemoConversation {
  id: string;
  initials: string;
  name: string;
  channel: ChannelType;
  gradient: string;
  messages: DemoMessage[];
}

// Just add a new object to this array to add a conversation!
const demoConversations: DemoConversation[] = [
  {
    id: 'sarah',
    initials: 'SC',
    name: '@sarahcoffee',
    channel: 'instagram',
    gradient: 'from-purple-500 to-purple-700',
    messages: [
      { from: 'customer', text: 'Hi! Do you have any decaf coffee options? I love coffee but can\'t have caffeine 😊', time: '2m ago' },
      { from: 'support', text: 'Yes! We have 3 delicious decaf options: Swiss Water Decaf, French Vanilla Decaf, and Hazelnut Decaf ☕', time: '1m ago' },
      { from: 'customer', text: 'Perfect! Which one is most popular?', time: '30s ago' },
      { from: 'support', text: 'Our Swiss Water Decaf is definitely the customer favorite! It has a smooth, rich flavor 🌟', time: 'Just now', isAiGenerated: true },
    ],
  },
  {
    id: 'jr',
    initials: 'JR',
    name: '+1 415-555-0199',
    channel: 'whatsapp',
    gradient: 'from-emerald-400 to-teal-600',
    messages: [
      { from: 'customer', text: 'Hey! When do you open tomorrow?', time: '5m ago' },
      { from: 'support', text: 'Hi there! We open at 7am tomorrow. See you then! ☀️', time: '4m ago' },
      { from: 'customer', text: 'Great, do you have oat milk?', time: '3m ago' },
      { from: 'support', text: 'Yes! We have oat, almond, and coconut milk available 🥛', time: '2m ago' },
    ],
  },
  {
    id: 'latte',
    initials: 'LC',
    name: '@lattecreator',
    channel: 'tiktok',
    gradient: 'from-cyan-400 to-pink-600',
    messages: [
      { from: 'customer', text: 'Love your videos! Is this available for wholesale?', time: '10m ago' },
      { from: 'support', text: 'Thank you so much! 🙏 Yes, we do wholesale! What quantities are you looking for?', time: '8m ago' },
      { from: 'customer', text: 'Around 50 bags per month for my cafe', time: '5m ago' },
      { from: 'support', text: 'Perfect! I\'ll send you our wholesale pricing guide. You\'ll get 20% off at that volume! 📧', time: '3m ago' },
    ],
  },
  {
    id: 'mike',
    initials: 'MC',
    name: 'Mike Chen',
    channel: 'email',
    gradient: 'from-blue-400 to-indigo-600',
    messages: [
      { from: 'customer', text: 'Hi, I ordered last week but haven\'t received tracking info yet. Order #4521', time: '1h ago' },
      { from: 'support', text: 'Hi Mike! Let me check on that for you right away.', time: '45m ago' },
      { from: 'support', text: 'Found it! Your order shipped yesterday. Tracking: 1Z999AA10123456784. Should arrive Thursday! 📦', time: '40m ago' },
      { from: 'customer', text: 'Thanks for the quick response!', time: '30m ago' },
    ],
  },
  {
    id: 'alex',
    initials: 'AB',
    name: '@alexbrews',
    channel: 'instagram',
    gradient: 'from-orange-400 to-rose-600',
    messages: [
      { from: 'customer', text: 'Love your new blend! 🔥', time: '15m ago' },
      { from: 'support', text: 'Thanks Alex! So glad you\'re enjoying it! ❤️', time: '12m ago' },
      { from: 'customer', text: 'Can I get a discount code for my followers?', time: '10m ago' },
      { from: 'support', text: 'Absolutely! Use code ALEXBREWS15 for 15% off. Thanks for spreading the word! 🎉', time: '5m ago' },
    ],
  },
  {
    id: 'taylor',
    initials: 'TS',
    name: 'Taylor Smith',
    channel: 'whatsapp',
    gradient: 'from-violet-400 to-fuchsia-600',
    messages: [
      { from: 'customer', text: 'Hi! Just placed order #4892', time: '20m ago' },
      { from: 'support', text: 'Got it Taylor! We\'re packing it up now 📦', time: '18m ago' },
      { from: 'customer', text: 'Can you add a gift note? It\'s for my mom\'s birthday', time: '15m ago' },
      { from: 'support', text: 'Of course! What would you like it to say? 🎂', time: '12m ago' },
      { from: 'customer', text: '"Happy Birthday Mom! Love, Taylor" ', time: '10m ago' },
      { from: 'support', text: 'Perfect, added! She\'s going to love it ❤️', time: '8m ago' },
      { from: 'customer', text: 'Perfect, order received!', time: '5m ago' },
    ],
  },
];

// Channel configuration - icons and colors
const channelConfig: Record<ChannelType, {
  icon: React.ReactNode;
  badgeColor: string;
  iconColor: string;
}> = {
  instagram: {
    icon: <Instagram className="w-3 h-3" />,
    badgeColor: 'bg-gradient-to-br from-pink-500 to-purple-600',
    iconColor: 'text-pink-400',
  },
  whatsapp: {
    icon: <MessageCircle className="w-3 h-3" />,
    badgeColor: 'bg-emerald-500',
    iconColor: 'text-emerald-400',
  },
  tiktok: {
    icon: (
      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
      </svg>
    ),
    badgeColor: 'bg-black',
    iconColor: 'text-current',
  },
  email: {
    icon: <Mail className="w-3 h-3" />,
    badgeColor: 'bg-blue-500',
    iconColor: 'text-slate-400',
  },
  facebook: {
    icon: <Facebook className="w-3 h-3" />,
    badgeColor: 'bg-blue-600',
    iconColor: 'text-blue-400',
  },
  sms: {
    icon: <MessageSquare className="w-3 h-3" />,
    badgeColor: 'bg-green-500',
    iconColor: 'text-green-400',
  },
};

// Helper to format phone numbers for narrow mode
const formatNameForNarrow = (name: string): string => {
  // If it's a phone number, remove country code
  if (name.startsWith('+')) {
    return name.replace(/^\+\d+\s*/, '');
  }
  return name;
};

// Check if name is a phone number (for marquee animation)
const isPhoneNumber = (name: string): boolean => {
  return name.startsWith('+') || /^\d{3}[-.\s]?\d{3}[-.\s]?\d{4}$/.test(name);
};

export default function LandingPage() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);
  const [isHeroVisible, setIsHeroVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedConvoId, setSelectedConvoId] = useState('sarah');
  const [mounted, setMounted] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Use dark theme as default for SSR
  const currentTheme = mounted ? theme : 'dark';

  // Determine display mode based on sidebar width
  const isCompact = sidebarWidth !== null && sidebarWidth < 140;
  const isNarrow = sidebarWidth !== null && sidebarWidth < 200;

  // Get responsive constraints based on container width
  const getConstraints = () => {
    if (!containerRef.current) return { min: 100, max: 200, initial: 150 };
    const containerWidth = containerRef.current.offsetWidth;
    // On mobile/small screens, use percentage-based constraints
    const minWidth = Math.max(80, containerWidth * 0.2);  // 20% min, at least 80px
    const maxWidth = Math.min(400, containerWidth * 0.5); // 50% max, at most 400px
    const initialWidth = Math.min(280, containerWidth * 0.35); // 35% initial, at most 280px
    return { min: minWidth, max: maxWidth, initial: initialWidth };
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Set initial sidebar width based on container size
  useEffect(() => {
    if (mounted && containerRef.current && sidebarWidth === null) {
      const { initial } = getConstraints();
      setSidebarWidth(initial);
    }
  }, [mounted, sidebarWidth]);

  // Update sidebar width on window resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current && sidebarWidth !== null) {
        const { min, max } = getConstraints();
        // Constrain current width to new bounds
        setSidebarWidth(prev => Math.min(Math.max(prev || min, min), max));
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarWidth]);

  // Handle resizable sidebar drag (mouse + touch)
  useEffect(() => {
    const handleMove = (clientX: number) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newWidth = clientX - containerRect.left;

      const { min, max } = getConstraints();
      const constrainedWidth = Math.min(Math.max(newWidth, min), max);
      setSidebarWidth(constrainedWidth);
    };

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX);
      }
    };

    const handleEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleEnd);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging]);

  useEffect(() => {
    // If user is logged in, redirect to dashboard (Supabase-style)
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Detect scroll for navbar blur effect
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Don't set up observer until loading is complete and we're showing the landing page
    if (loading || user) return;

    const currentRef = heroRef.current;
    if (!currentRef) return;

    // Observer for triggering/pausing animations based on visibility
    const isSmallScreen = window.innerWidth < 1024;
    const animationObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          // Start animations when visible, pause when scrolled away
          setIsHeroVisible(entry.isIntersecting);
        });
      },
      {
        threshold: isSmallScreen ? 0.1 : 0.2,
        rootMargin: '100px'
      }
    );

    // Check if hero is sufficiently visible on mount
    requestAnimationFrame(() => {
      const rect = currentRef.getBoundingClientRect();
      const visibleHeight = Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0);
      const visibleRatio = visibleHeight / rect.height;
      const shouldTrigger = visibleRatio >= (isSmallScreen ? 0.3 : 0.5);

      if (shouldTrigger) {
        setIsHeroVisible(true);
      }
    });

    animationObserver.observe(currentRef);

    return () => {
      animationObserver.unobserve(currentRef);
    };
  }, [loading, user]);


  // Show loading while checking auth or if user is logged in (redirecting)
  if (loading || user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  // Show landing page only for logged-out users
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
              <span className="font-semibold">AI-Powered Customer Support</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              All Your Customer Conversations.
              <span className="block bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mt-2 pb-1">One Intelligent Inbox.</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Unify email, Instagram DMs, and SMS into one powerful inbox. Respond 10x faster with AI-powered suggestions from Claude.
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
          <div ref={heroRef} className={`mt-16 rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden shadow-2xl relative hero-demo-container ${isHeroVisible ? 'hero-visible' : ''}`}>
            <div className="aspect-video flex items-center md:items-stretch justify-center p-4">
              {/* Mockup Browser Window */}
              <div
                ref={containerRef}
                className={`w-full md:h-full rounded-lg border shadow-xl overflow-hidden flex ${
                currentTheme === 'dark'
                  ? 'bg-[#1a2332] border-slate-700'
                  : 'bg-white border-gray-200'
              }`}>
                {/* Left Sidebar - Conversations List */}
                <div
                  style={sidebarWidth ? { width: `${sidebarWidth}px`, minWidth: `${sidebarWidth}px` } : undefined}
                  className={`border-r flex-col flex-shrink-0 flex ${
                    !sidebarWidth ? 'w-[35%] min-w-[80px] max-w-[280px]' : ''
                  } ${
                  currentTheme === 'dark'
                    ? 'bg-[#0f1621] border-slate-700'
                    : 'bg-gray-50 border-gray-200'
                }`}>
                  {/* Inbox Header */}
                  <div className={`p-4 border-b transition-all ${
                    isCompact ? 'p-2 flex justify-center' : ''
                  } ${
                    currentTheme === 'dark' ? 'border-slate-700' : 'border-gray-200'
                  }`}>
                    {isCompact ? (
                      <MessageSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <>
                        <h2 className={`font-semibold text-sm flex items-center gap-2 ${
                          currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                        }`}>
                          <MessageSquare className="w-4 h-4 text-primary" />
                          {!isNarrow && 'Inbox'}
                        </h2>
                        {!isNarrow && (
                          <p className={`text-xs mt-0.5 ${
                            currentTheme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                          }`}>{demoConversations.length} conversations</p>
                        )}
                      </>
                    )}
                  </div>

                  {/* Conversation List */}
                  <div className="flex-1 overflow-hidden">
                    <div className={`p-2 space-y-1 ${isCompact ? 'flex flex-col items-center' : ''}`}>
                      {demoConversations.map((convo) => {
                        const channel = channelConfig[convo.channel];
                        const isPhone = isPhoneNumber(convo.name);
                        const isSelected = selectedConvoId === convo.id;
                        const lastMessage = convo.messages[convo.messages.length - 1];

                        return (
                          <div
                            key={convo.id}
                            onClick={() => setSelectedConvoId(convo.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg animate-slide-up-fade-in animation-delay-sidebar transition-all cursor-pointer ${
                              isCompact ? 'p-1.5 justify-center w-fit' : ''
                            } ${
                              isSelected
                                ? currentTheme === 'dark'
                                  ? 'bg-slate-800/50 border border-primary/20'
                                  : 'bg-white border border-gray-200 shadow-sm'
                                : currentTheme === 'dark'
                                  ? 'hover:bg-slate-800/30'
                                  : 'hover:bg-gray-100'
                            }`}
                          >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${convo.gradient} flex items-center justify-center text-white text-xs font-bold`}>
                                {convo.initials}
                              </div>
                              {isCompact && (
                                <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full ${channel.badgeColor} flex items-center justify-center border-2 ${
                                  currentTheme === 'dark' ? 'border-slate-800' : 'border-gray-100'
                                }`}>
                                  <span className="w-2 h-2 text-white flex items-center justify-center [&>svg]:w-2 [&>svg]:h-2">
                                    {channel.icon}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Content */}
                            {!isCompact && (
                              <>
                                <div className={`flex-1 min-w-0 ${isPhone ? 'overflow-hidden' : ''}`}>
                                  <div className="flex items-center gap-2">
                                    <span className={`text-xs truncate ${
                                      isPhone && isNarrow ? 'whitespace-nowrap animate-marquee' : ''
                                    } ${
                                      isSelected
                                        ? currentTheme === 'dark' ? 'text-white font-medium' : 'text-gray-900 font-medium'
                                        : currentTheme === 'dark' ? 'text-slate-300' : 'text-gray-700'
                                    }`}>
                                      {isNarrow ? formatNameForNarrow(convo.name) : convo.name}
                                    </span>
                                    <span className={`flex-shrink-0 ${channel.iconColor}`}>
                                      {channel.icon}
                                    </span>
                                  </div>
                                  {!isNarrow && (
                                    <p className={`text-xs truncate ${
                                      currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                                    }`}>{lastMessage.text}</p>
                                  )}
                                </div>
                                {!isNarrow && <span className="text-[10px] text-green-500 font-medium">open</span>}
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Resizable Divider */}
                <div
                  onMouseDown={() => setIsDragging(true)}
                  onTouchStart={() => setIsDragging(true)}
                  className={`w-2 sm:w-1.5 cursor-col-resize flex-shrink-0 group relative transition-colors touch-none ${
                    isDragging
                      ? 'bg-primary'
                      : currentTheme === 'dark'
                        ? 'bg-slate-700 hover:bg-primary/60 active:bg-primary'
                        : 'bg-gray-200 hover:bg-primary/40 active:bg-primary/60'
                  }`}
                >
                  {/* Larger touch target area (invisible) */}
                  <div className="absolute inset-y-0 -left-2 -right-2 sm:-left-1 sm:-right-1" />
                  {/* Visual grip indicator */}
                  <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-0.5 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-60 sm:opacity-0 sm:group-hover:opacity-100'}`}>
                    <div className="w-1 h-1 sm:w-0.5 sm:h-0.5 rounded-full bg-white/80"></div>
                    <div className="w-1 h-1 sm:w-0.5 sm:h-0.5 rounded-full bg-white/80"></div>
                    <div className="w-1 h-1 sm:w-0.5 sm:h-0.5 rounded-full bg-white/80"></div>
                  </div>
                </div>

                {/* Main Chat Area */}
                <div className="flex-1 flex flex-col relative min-h-0">
                  {(() => {
                    const selectedConvo = demoConversations.find(c => c.id === selectedConvoId) || demoConversations[0];
                    const channel = channelConfig[selectedConvo.channel];
                    const channelName = selectedConvo.channel.charAt(0).toUpperCase() + selectedConvo.channel.slice(1);
                    const isSarahDemo = selectedConvoId === 'sarah';

                    return (
                      <>
                        {/* Chat Header */}
                        <div className={`h-16 border-b flex items-center px-6 animate-slide-up-fade-in animation-delay-sidebar ${
                          currentTheme === 'dark'
                            ? 'bg-[#0f1621] border-slate-700'
                            : 'bg-gray-50 border-gray-200'
                        }`}>
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-sm font-bold`}>
                              {selectedConvo.initials}
                            </div>
                            <div>
                              <h3 className={`text-sm font-semibold ${
                                currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                              }`}>{selectedConvo.name}</h3>
                              <p className={`text-xs flex items-center gap-1 ${
                                currentTheme === 'dark' ? 'text-slate-400' : 'text-gray-500'
                              }`}>
                                <span className={channel.iconColor}>{channel.icon}</span>
                                via {channelName}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                          {isSarahDemo ? (
                            <>
                              {/* ANIMATED DEMO for Sarah - typing effects, AI panel, etc. */}
                              {/* Message 1: Customer asks about decaf */}
                              <div className="flex gap-3 animate-slide-up-fade-in animation-delay-600">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  SC
                                </div>
                                <div className="flex-1">
                                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-xs ${
                                    currentTheme === 'dark'
                                      ? 'bg-slate-700/50 text-slate-100'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    <span className="typing-text">Hi! Do you have any decaf coffee options? I love coffee but can&apos;t have caffeine 😊</span>
                                  </div>
                                  <span className={`text-[10px] mt-1 block ${
                                    currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                                  }`}>2m ago</span>
                                </div>
                              </div>

                              {/* Reply 1: Human response */}
                              <div className="flex gap-3 justify-end animate-slide-up-fade-in animation-delay-1000">
                                <div className="flex-1 flex flex-col items-end">
                                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 max-w-[80%] text-xs text-white">
                                    <span className="typing-text">Yes! We have 3 delicious decaf options: Swiss Water Decaf, French Vanilla Decaf, and Hazelnut Decaf ☕</span>
                                  </div>
                                  <span className={`text-[10px] mt-1 ${
                                    currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                                  }`}>1m ago • Support Team</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  ST
                                </div>
                              </div>

                              {/* Message 2: Follow-up question */}
                              <div className="flex gap-3 animate-slide-up-fade-in animation-delay-1400">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  SC
                                </div>
                                <div className="flex-1">
                                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-xs ${
                                    currentTheme === 'dark'
                                      ? 'bg-slate-700/50 text-slate-100'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    <span className="typing-text">Perfect! Which one is most popular?</span>
                                  </div>
                                  <span className={`text-[10px] mt-1 block ${
                                    currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                                  }`}>30s ago</span>
                                </div>
                              </div>

                              {/* Generate AI Response button */}
                              <div className="absolute bottom-24 right-6 animate-slide-up-fade-in animation-delay-1500" style={{ animationFillMode: 'forwards' }}>
                                <button className="flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white px-2.5 py-1.5 rounded-md text-[10px] font-semibold shadow-lg animate-button-click animation-delay-1800">
                                  <Sparkles className="w-2.5 h-2.5" />
                                  Generate AI Response
                                </button>
                              </div>

                              {/* AI Suggestion Panel */}
                              <div className="absolute bottom-20 left-6 right-6 animate-ai-panel animation-delay-2000" style={{ animationFillMode: 'forwards' }}>
                                <div className={`border-2 border-purple-500 rounded-lg p-4 shadow-2xl ${
                                  currentTheme === 'dark' ? 'bg-slate-800' : 'bg-white'
                                }`}>
                                  <div className="flex items-center gap-2 mb-3">
                                    <Sparkles className="w-4 h-4 text-purple-400" />
                                    <span className={`text-xs font-semibold ${
                                      currentTheme === 'dark' ? 'text-white' : 'text-gray-900'
                                    }`}>AI Suggested Response</span>
                                  </div>
                                  <div className={`rounded-lg p-3 mb-3 ${
                                    currentTheme === 'dark' ? 'bg-slate-700/50' : 'bg-gray-50'
                                  }`}>
                                    <p className={`text-xs leading-relaxed ${
                                      currentTheme === 'dark' ? 'text-slate-200' : 'text-gray-700'
                                    }`}>
                                      Our Swiss Water Decaf is definitely the customer favorite! It has a smooth, rich flavor and is processed without chemicals. Many customers say they can&apos;t even tell it&apos;s decaf 🌟
                                    </p>
                                  </div>
                                  <button className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xs font-semibold py-2 rounded-lg hover:opacity-90 transition-opacity animate-button-click animation-delay-2400">
                                    Use This Response
                                  </button>
                                </div>
                              </div>

                              {/* Reply 2: AI-assisted response */}
                              <div className="flex gap-3 justify-end animate-slide-up-fade-in animation-delay-2600">
                                <div className="flex-1 flex flex-col items-end">
                                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 max-w-[80%] text-xs text-white">
                                    <span className="no-typing">Our Swiss Water Decaf is definitely the customer favorite! It has a smooth, rich flavor 🌟</span>
                                  </div>
                                  <span className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                                    Just now • Support Team
                                    <Sparkles className="w-3 h-3 text-purple-400" />
                                  </span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  ST
                                </div>
                              </div>

                              {/* Message 3: Customer thanks */}
                              <div className="flex gap-3 animate-slide-up-fade-in animation-delay-3200">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  SC
                                </div>
                                <div className="flex-1">
                                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-xs ${
                                    currentTheme === 'dark'
                                      ? 'bg-slate-700/50 text-slate-100'
                                      : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    <span className="typing-text">Awesome! I&apos;ll order that one. Thanks so much! 💜</span>
                                  </div>
                                  <span className={`text-[10px] mt-1 block ${
                                    currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                                  }`}>Just now</span>
                                </div>
                              </div>

                              {/* Reply 3: Human closing */}
                              <div className="flex gap-3 justify-end animate-slide-up-fade-in animation-delay-3800">
                                <div className="flex-1 flex flex-col items-end">
                                  <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-lg px-3 py-2 max-w-[80%] text-xs text-white">
                                    <span className="typing-text">You&apos;re so welcome! Enjoy your coffee, and feel free to reach out anytime ☕✨</span>
                                  </div>
                                  <span className={`text-[10px] mt-1 ${
                                    currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                                  }`}>Just now • Support Team</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                  ST
                                </div>
                              </div>
                            </>
                          ) : (
                            /* Simple message list for other conversations */
                            selectedConvo.messages.map((msg, idx) => (
                              <div
                                key={idx}
                                className={`flex gap-3 ${msg.from === 'support' ? 'justify-end' : ''} animate-message-in`}
                                style={{ animationDelay: `${idx * 100}ms` }}
                              >
                                {msg.from === 'customer' && (
                                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${selectedConvo.gradient} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                                    {selectedConvo.initials}
                                  </div>
                                )}
                                <div className={`flex-1 ${msg.from === 'support' ? 'flex flex-col items-end' : ''}`}>
                                  <div className={`rounded-lg px-3 py-2 max-w-[80%] text-xs ${
                                    msg.from === 'support'
                                      ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                                      : currentTheme === 'dark'
                                        ? 'bg-slate-700/50 text-slate-100'
                                        : 'bg-gray-100 text-gray-900'
                                  }`}>
                                    {msg.text}
                                  </div>
                                  <span className={`text-[10px] mt-1 flex items-center gap-1 ${
                                    currentTheme === 'dark' ? 'text-slate-500' : 'text-gray-500'
                                  }`}>
                                    {msg.time}
                                    {msg.from === 'support' && ' • Support Team'}
                                    {msg.isAiGenerated && <Sparkles className="w-3 h-3 text-purple-400" />}
                                  </span>
                                </div>
                                {msg.from === 'support' && (
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                                    ST
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Chat Input Area */}
                        <div className={`border-t p-4 ${
                          currentTheme === 'dark' ? 'border-slate-700 bg-[#0f1621]' : 'border-gray-200 bg-gray-50'
                        }`}>
                          {/* Input Row */}
                          <div className="flex gap-2 items-center">
                            <div className={`flex-1 rounded-lg px-3 py-2 text-xs ${
                              currentTheme === 'dark'
                                ? 'bg-slate-800 text-slate-400'
                                : 'bg-white border border-gray-300 text-gray-400'
                            }`}>
                              Type your reply...
                            </div>
                            <button className="bg-gradient-to-r from-purple-600 to-purple-500 text-white px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-1.5">
                              <Send className="w-3 h-3" />
                              Send
                            </button>
                          </div>
                          {/* Quick Replies & Tip */}
                          <div className="flex items-center justify-between mt-2">
                            <button className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] border ${
                              currentTheme === 'dark'
                                ? 'border-slate-600 text-slate-300 bg-slate-800'
                                : 'border-gray-300 text-gray-600 bg-white'
                            }`}>
                              <MessageSquare className="w-3 h-3" />
                              Quick Replies
                            </button>
                            <div className={`flex items-center gap-1 text-[8px] ${
                              currentTheme === 'dark' ? 'text-slate-500/70' : 'text-gray-400/70'
                            }`}>
                              <Lightbulb className="w-2.5 h-2.5 text-yellow-500/70" />
                              Enter to send, Shift+Enter for new line
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
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
                <MessageSquare className="w-8 h-8 text-primary" />
              </div>
              <div className="text-5xl font-bold text-primary mb-2">5+</div>
              <div className="text-slate-600 dark:text-muted-foreground font-medium">Channels Unified</div>
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
              Everything you need to scale support
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for modern businesses who care about customer experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Responses</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Get intelligent response suggestions powered by Claude AI. Context-aware replies that understand your brand voice.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Unified Inbox</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Manage email, Instagram DMs, and SMS from one place. No more switching between apps.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Zap className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Real-Time Updates</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                See new messages instantly with real-time synchronization. Never miss a customer inquiry.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Customer Insights</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Automatically generated notes and insights about each customer. Know who you're talking to.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <BarChart3 className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analytics Dashboard</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Track response times, conversation volume, and customer satisfaction with detailed analytics.
              </p>
            </div>

            <div className="p-6 rounded-xl bg-white/70 backdrop-blur-lg border border-purple-200 shadow-sm hover:shadow-lg hover:bg-white/90 transition-all dark:bg-slate-900/40 dark:border-purple-400/20 dark:hover:bg-slate-900/50">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Knowledge Base</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Build a library of canned responses and FAQs. AI pulls from your knowledge base for accurate answers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 border-b border-purple-200 dark:border-purple-400/30">
        <div className="max-w-7xl mx-auto">
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
              <h3 className="text-xl font-semibold mb-2">Connect Your Channels</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Link your email, Instagram, and SMS accounts in seconds with our simple setup wizard.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Configure AI Assistant</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Add your business info and knowledge base. Train the AI to understand your brand voice.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Start Responding</h3>
              <p className="text-slate-600 dark:text-muted-foreground">
                Watch messages flow in. Use AI suggestions to respond faster and more accurately than ever.
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
              All Your Channels, One Platform
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Connect the communication channels your customers actually use
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg text-center hover:shadow-xl hover:bg-white/90 transition-all group dark:border-purple-400/20 dark:bg-slate-900/40 dark:hover:bg-slate-900/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-sm text-slate-600 dark:text-muted-foreground">Full email support with automatic parsing and threading</p>
              <div className="mt-4 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium inline-block">
                Active
              </div>
            </div>

            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg text-center hover:shadow-xl hover:bg-white/90 transition-all group dark:border-purple-400/20 dark:bg-slate-900/40 dark:hover:bg-slate-900/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Instagram className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Instagram DMs</h3>
              <p className="text-sm text-slate-600 dark:text-muted-foreground">Two-way messaging with Meta Business integration</p>
              <div className="mt-4 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium inline-block">
                Active
              </div>
            </div>

            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg text-center hover:shadow-xl hover:bg-white/90 transition-all group dark:border-purple-400/20 dark:bg-slate-900/40 dark:hover:bg-slate-900/50">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">WhatsApp</h3>
              <p className="text-sm text-slate-600 dark:text-muted-foreground">WhatsApp Business messaging integration</p>
              <div className="mt-4 px-3 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-xs font-medium inline-block">
                Active
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <p className="text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">Coming Soon:</span> SMS, TikTok, Facebook Messenger, Live Chat Widget
            </p>
          </div>
        </div>
      </section>

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
                  <span className="text-sm">2 channels (Email + Instagram)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">1 user</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Basic AI suggestions</span>
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
                  <span className="text-sm">All channels (Email, Instagram, SMS)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">3 team members</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Unlimited AI suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm">Basic analytics</span>
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
                  <span className="text-sm">All channels + Live Chat widget</span>
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
                  <span className="text-sm">Integrations (Coming Soon)</span>
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

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 border-b border-purple-200 dark:border-purple-400/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Loved by Support Teams
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what businesses are saying about InboxForge
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg shadow-sm dark:border-purple-400/20 dark:bg-slate-900/40">
              <div className="flex gap-1 mb-4">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
              </div>
              <p className="text-slate-600 dark:text-muted-foreground mb-6 italic">
                "InboxForge has completely transformed how we handle customer support. The AI suggestions are incredibly accurate and have cut our response time in half."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                  SJ
                </div>
                <div>
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-sm text-muted-foreground">CEO, TechStart</div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg shadow-sm dark:border-purple-400/20 dark:bg-slate-900/40">
              <div className="flex gap-1 mb-4">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
              </div>
              <p className="text-slate-600 dark:text-muted-foreground mb-6 italic">
                "Managing Instagram DMs and emails separately was a nightmare. Now everything's in one place with smart AI assistance. Game changer!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                  MC
                </div>
                <div>
                  <div className="font-semibold">Michael Chen</div>
                  <div className="text-sm text-muted-foreground">Founder, StyleBox</div>
                </div>
              </div>
            </div>

            <div className="p-8 rounded-xl border-2 border-purple-200 bg-white/70 backdrop-blur-lg shadow-sm dark:border-purple-400/20 dark:bg-slate-900/40">
              <div className="flex gap-1 mb-4">
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
                <Star className="w-5 h-5 text-primary fill-primary" />
              </div>
              <p className="text-slate-600 dark:text-muted-foreground mb-6 italic">
                "The analytics dashboard gives us incredible insights into our customer service performance. We've improved our resolution rate by 40%."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                  EP
                </div>
                <div>
                  <div className="font-semibold">Emily Parker</div>
                  <div className="text-sm text-muted-foreground">Support Lead, GrowthCo</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6 border border-primary/20">
            <Sparkles className="w-4 h-4" />
            Join 1,000+ growing businesses
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your customer support?
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join businesses using InboxForge to deliver exceptional customer experiences with AI-powered support.
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
              © 2025 InboxForge. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
