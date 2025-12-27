'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Check, Loader2, ExternalLink, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import UsageDisplay from './UsageDisplay';

interface BillingSectionProps {
  businessId: string;
  currentTier: 'free' | 'starter' | 'pro';
  stripeCustomerId?: string | null;
}

export default function BillingSection({
  businessId,
  currentTier,
  stripeCustomerId,
}: BillingSectionProps) {
  const searchParams = useSearchParams();
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    // Check if user just completed checkout
    if (searchParams?.get('success') === 'true') {
      setShowSuccess(true);
      // Remove the success parameter from URL
      window.history.replaceState({}, '', '/dashboard/settings');
      setTimeout(() => setShowSuccess(false), 10000);
    }
  }, [searchParams]);

  async function handleManageBilling() {
    if (!stripeCustomerId) {
      alert('No billing account found. Please upgrade to a paid plan first.');
      return;
    }

    setLoading('portal');

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: stripeCustomerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to create portal session');
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (error: any) {
      console.error('Portal error:', error);
      alert('Failed to open billing portal. Please try again.');
      setLoading(null);
    }
  }

  const planInfo = {
    free: {
      name: 'Free Plan',
      price: '$0',
      color: 'text-gray-700 dark:text-gray-300',
      bgColor: 'bg-gray-100 dark:bg-gray-800',
    },
    starter: {
      name: 'Starter Plan',
      price: '$29/month',
      color: 'text-blue-700 dark:text-blue-300',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    pro: {
      name: 'Pro Plan',
      price: '$79/month',
      color: 'text-purple-700 dark:text-purple-300',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20',
    },
  };

  const current = planInfo[currentTier];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <CreditCard className="w-5 h-5 text-gray-500 dark:text-slate-400" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Billing & Subscription</h2>
      </div>

      {/* Success message */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-3">
          <Check className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-900 dark:text-green-100 font-semibold">
              Subscription activated!
            </p>
            <p className="text-sm text-green-700 dark:text-green-300 mt-1">
              Your plan has been upgraded. You now have access to all features.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan */}
      <div className="mb-6">
        <p className="text-sm text-gray-600 dark:text-slate-300 mb-3">
          Current Plan
        </p>
        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg ${current.bgColor}`}>
          <span className={`text-lg font-semibold ${current.color}`}>
            {current.name}
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {current.price}
          </span>
        </div>
      </div>

      {/* Usage Display */}
      <div className="mb-6">
        <UsageDisplay businessId={businessId} />
      </div>

      {/* Plan Management Actions */}
      <div className="space-y-3">
        {currentTier === 'free' && (
          <>
            <Link
              href="/pricing"
              className="block w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
            >
              Upgrade Plan
            </Link>
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="text-blue-900 dark:text-blue-100 font-medium">
                    Running low on credits?
                  </p>
                  <p className="text-blue-700 dark:text-blue-300 mt-1">
                    Upgrade to Starter ($29/mo) or Pro ($79/mo) for higher limits and more features.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {currentTier !== 'free' && (
          <>
            <div className="grid grid-cols-2 gap-3">
              {currentTier !== 'pro' && (
                <Link
                  href="/pricing"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-center"
                >
                  Upgrade
                </Link>
              )}
              <button
                onClick={handleManageBilling}
                disabled={loading === 'portal'}
                className="px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading === 'portal' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    Manage Billing
                    <ExternalLink className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Manage your subscription, payment methods, and billing history in the Stripe portal
            </p>
          </>
        )}
      </div>

      {/* Billing Info */}
      {currentTier !== 'free' && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Next billing date</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
