'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/api/supabase';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

type Status = 'verifying' | 'ready' | 'invalid' | 'done';

function ResetPasswordForm() {
  const [status, setStatus] = useState<Status>('verifying');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const tokenHash = searchParams.get('token_hash');
  const verifyStarted = useRef(false);

  useEffect(() => {
    // The token is single-use — make sure StrictMode's double effect
    // doesn't consume it twice and wrongly report the link as invalid
    if (verifyStarted.current) return;
    verifyStarted.current = true;

    if (!tokenHash) {
      setStatus('invalid');
      return;
    }

    supabase.auth
      .verifyOtp({ type: 'recovery', token_hash: tokenHash })
      .then(({ error }) => {
        setStatus(error ? 'invalid' : 'ready');
      });
  }, [tokenHash]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setError(updateError.message || 'Failed to update password. Please try again.');
      setLoading(false);
      return;
    }

    setStatus('done');
    setTimeout(() => router.push('/dashboard'), 2000);
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-amber-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-600 to-violet-500 rounded-2xl mb-4 shadow-lg">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Choose a new password</h1>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {status === 'verifying' && (
            <p className="text-center text-sm text-gray-600 py-4">Checking your reset link...</p>
          )}

          {status === 'invalid' && (
            <div className="text-center py-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">
                This link is invalid or has expired
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                Reset links can only be used once and expire after 60 minutes.
              </p>
              <Link
                href="/forgot-password"
                className="inline-block bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 px-6 rounded-lg font-medium hover:from-indigo-700 hover:to-amber-600 transition-all shadow-md hover:shadow-lg"
              >
                Request a new link
              </Link>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mb-4">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Password updated</h2>
              <p className="text-sm text-gray-600">Taking you to your dashboard...</p>
            </div>
          )}

          {status === 'ready' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  autoFocus
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="At least 8 characters"
                />
              </div>

              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm new password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-violet-500 text-white py-3 rounded-lg font-medium hover:from-indigo-700 hover:to-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
              >
                {loading ? 'Updating...' : 'Update password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
