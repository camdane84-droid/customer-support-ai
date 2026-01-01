'use client';

import { useState } from 'react';
import { Check, Zap, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const plans = [
  {
    name: 'Free',
    price: 0,
    priceId: null,
    tier: 'free' as const,
    description: 'Perfect for trying out InboxForge',
    features: [
      '20 AI suggestions per day',
      '50 conversations per month',
      '2 channel integrations',
      '1 team member',
      'Basic analytics',
      'Email support',
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Starter',
    price: 29,
    priceId: 'starter',
    tier: 'starter' as const,
    description: 'Great for growing businesses',
    features: [
      '500 AI suggestions per day',
      '500 conversations per month',
      'All channel integrations',
      '3 team members',
      'Advanced analytics',
      'Priority email support',
      'Knowledge base',
      'Canned responses',
    ],
    cta: 'Upgrade to Starter',
    highlighted: true,
    badge: 'MOST POPULAR',
  },
  {
    name: 'Pro',
    price: 79,
    priceId: 'pro',
    tier: 'pro' as const,
    description: 'For teams that need unlimited power',
    features: [
      'Unlimited AI suggestions',
      'Unlimited conversations',
      'All channel integrations',
      '10 team members',
      'Advanced analytics & insights',
      'Priority support + Slack',
      'Custom integrations',
      'API access',
      'Advanced automation',
    ],
    cta: 'Upgrade to Pro',
    highlighted: false,
    badge: 'BEST VALUE',
  },
];

export default function PricingPage() {
  const { user, currentBusiness: business } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const currentTier = business?.subscription_tier || 'free';

  async function handleUpgrade(tier: 'starter' | 'pro') {
    if (!user || !business) {
      router.push('/login?redirect=/pricing');
      return;
    }

    setLoading(tier);

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessId: business.id,
          tier,
          successUrl: `${window.location.origin}/dashboard/settings?success=true`,
          cancelUrl: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create checkout session');
      }

      const { url } = await response.json();

      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      alert(error.message || 'Failed to start checkout');
      setLoading(null);
    }
  }

  function getPlanButton(plan: typeof plans[0]) {
    const isCurrentPlan = currentTier === plan.tier;
    const isDowngrade =
      (currentTier === 'pro' && (plan.tier === 'starter' || plan.tier === 'free')) ||
      (currentTier === 'starter' && plan.tier === 'free');
    const isUpgrade =
      (currentTier === 'free' && (plan.tier === 'starter' || plan.tier === 'pro')) ||
      (currentTier === 'starter' && plan.tier === 'pro');

    if (plan.tier === 'free') {
      if (isCurrentPlan) {
        return (
          <button
            disabled
            className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-semibold cursor-not-allowed"
          >
            Current Plan
          </button>
        );
      }
      return (
        <Link
          href="/dashboard/settings"
          className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold text-center block"
        >
          Downgrade to Free
        </Link>
      );
    }

    if (isCurrentPlan) {
      return (
        <Link
          href="/dashboard/settings"
          className="w-full px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold text-center block"
        >
          Manage Subscription
        </Link>
      );
    }

    if (isDowngrade) {
      return (
        <Link
          href="/dashboard/settings"
          className="w-full px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold text-center block"
        >
          Contact Support
        </Link>
      );
    }

    return (
      <button
        onClick={() => handleUpgrade(plan.tier as 'starter' | 'pro')}
        disabled={loading === plan.tier}
        className={`
          w-full px-6 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2
          ${plan.highlighted
            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
            : plan.tier === 'pro'
            ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 shadow-lg'
            : 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100'
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {loading === plan.tier ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {plan.cta}
            <ArrowRight className="w-5 h-5" />
          </>
        )}
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">InboxForge</span>
            </Link>
            <div className="flex items-center gap-4">
              {user ? (
                <Link
                  href="/dashboard"
                  className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  Go to Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Pricing Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Choose the plan that's right for your business
          </p>
          {business && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <span className="text-sm text-blue-900 dark:text-blue-300">
                Current plan: <span className="font-semibold capitalize">{currentTier}</span>
              </span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`
                relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden
                ${plan.highlighted ? 'ring-2 ring-blue-500 scale-105' : 'border border-gray-200 dark:border-gray-700'}
              `}
            >
              {plan.badge && (
                <div className={`absolute top-0 left-0 right-0 text-white text-center py-2 text-sm font-semibold ${
                  plan.highlighted ? 'bg-blue-600' : 'bg-purple-600'
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className={`p-8 ${plan.badge ? 'pt-14' : ''}`}>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  {plan.name}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {plan.description}
                </p>

                <div className="mb-6">
                  <span className="text-5xl font-bold text-gray-900 dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-gray-600 dark:text-gray-400">/month</span>
                </div>

                {getPlanButton(plan)}

                <ul className="mt-8 space-y-4">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ or additional info */}
        <div className="mt-16 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            Need a custom plan or have questions?{' '}
            <a href="mailto:inboxforgeapp@outlook.com" className="text-blue-600 hover:text-blue-700 font-semibold">
              Contact us
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
