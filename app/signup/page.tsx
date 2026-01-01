'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signUp } from '@/lib/auth';
import { MessageSquare, Info } from 'lucide-react';
import Link from 'next/link';

function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [inviteInput, setInviteInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [businessNameError, setBusinessNameError] = useState('');
  const [checkingName, setCheckingName] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlInviteToken = searchParams.get('invite');

  // Extract invite token from URL parameter OR manual input
  const getInviteToken = () => {
    if (urlInviteToken) return urlInviteToken;
    if (!inviteInput.trim()) return null;

    // If user pasted a full URL, extract the token
    try {
      const url = new URL(inviteInput);
      return url.searchParams.get('invite');
    } catch {
      // Not a URL, treat as direct token
      return inviteInput.trim();
    }
  };

  const inviteToken = getInviteToken();

  // Check if business name is available
  const checkBusinessNameAvailability = async (name: string) => {
    if (!name.trim() || inviteToken) {
      setBusinessNameError('');
      return;
    }

    setCheckingName(true);
    try {
      const response = await fetch(`/api/businesses/check-name?name=${encodeURIComponent(name)}`);
      const data = await response.json();

      if (!data.available) {
        setBusinessNameError(
          `A business named "${data.existingName}" already exists. Please choose a different name, or if you want to join this team, please request an invitation link from the business owner and enter it below.`
        );
      } else {
        setBusinessNameError('');
      }
    } catch (error) {
      console.error('Error checking business name:', error);
      // Don't block signup on check error
      setBusinessNameError('');
    } finally {
      setCheckingName(false);
    }
  };

  // Debounced business name check
  useEffect(() => {
    const timer = setTimeout(() => {
      if (businessName) {
        checkBusinessNameAvailability(businessName);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [businessName, inviteToken]);

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Block signup if business name is taken and no invite provided
    if (businessNameError && !inviteToken) {
      setError('Please resolve the business name conflict before continuing.');
      return;
    }

    setLoading(true);

    console.log('Attempting signup with:', { email, businessName, hasInvite: !!inviteToken });

    try {
      await signUp(email, password, businessName, inviteToken || undefined);
      console.log('✅ Signup successful, redirecting...');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('❌ Signup error:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-500 rounded-2xl mb-4 shadow-lg">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">InboxForge</h1>
          <p className="text-gray-600 mt-2">
            {inviteToken ? 'Join your team' : 'Create your account'}
          </p>
        </div>

        {/* Signup Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSignup} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">
                {inviteToken ? 'Your Business Name' : 'Business Name'}
              </label>
              <input
                id="businessName"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                required
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                  businessNameError
                    ? 'border-red-300 focus:ring-red-500'
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Acme Coffee Shop"
              />
              {checkingName && (
                <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
              )}
              {businessNameError && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
                  <Info className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{businessNameError}</p>
                </div>
              )}
            </div>

            {/* Invite Link Input - Only show if no URL invite token */}
            {!urlInviteToken && (
              <div>
                <label htmlFor="inviteLink" className="block text-sm font-medium text-gray-700 mb-2">
                  Team Invitation Link <span className="text-gray-400 font-normal">(Optional)</span>
                </label>
                <input
                  id="inviteLink"
                  type="text"
                  value={inviteInput}
                  onChange={(e) => setInviteInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Paste your invitation link here..."
                />
                {!inviteToken && (
                  <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg flex gap-2">
                    <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700">
                      <strong>Creating a new business?</strong> Leave this field empty to set up your own workspace. <strong>Joining a team?</strong> Paste the invitation link your admin sent you.
                    </p>
                  </div>
                )}
                {inviteToken && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                    <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-700">
                      <strong>Invitation link accepted!</strong> You'll be added to your team's workspace after creating your account.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Show confirmation when invite comes from URL */}
            {urlInviteToken && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex gap-2">
                <Info className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-700">
                  <strong>Invitation link detected!</strong> You'll be added to your team's workspace after creating your account.
                </p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••••••"
              />
              <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters</p>
            </div>

            <button
              type="submit"
              disabled={loading || (businessNameError && !inviteToken) || checkingName}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading
                ? (inviteToken ? 'Joining team...' : 'Creating account...')
                : checkingName
                ? 'Checking...'
                : (inviteToken ? 'Join Team' : 'Create Account')
              }
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <SignupForm />
    </Suspense>
  );
}
