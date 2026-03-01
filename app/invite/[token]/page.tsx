'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { Loader2, CheckCircle, XCircle, AlertCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { signOut } from '@/lib/auth';

interface InvitationDetails {
  email: string | null;
  businessName: string;
  role: string;
  expired: boolean;
}

export default function InvitePage() {
  const { token } = useParams();
  const { user, refreshBusinesses } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'checking' | 'wrong-account' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [inviteDetails, setInviteDetails] = useState<InvitationDetails | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  // Check invitation details first
  useEffect(() => {
    if (token) {
      checkInvitation();
    }
  }, [token]);

  // Auto-accept if user is logged in with correct email (or no email required)
  useEffect(() => {
    if (user && inviteDetails && !inviteDetails.expired) {
      // If invitation has no email (generic link), accept for any logged-in user
      if (!inviteDetails.email) {
        acceptInvitation();
      } else if (user.email?.toLowerCase() === inviteDetails.email.toLowerCase()) {
        acceptInvitation();
      } else {
        setStatus('wrong-account');
      }
    }
  }, [user, inviteDetails]);

  async function checkInvitation() {
    try {
      setStatus('checking');
      const response = await fetch(`/api/team/invitations/${token}`);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Invalid invitation');
      }

      const details = await response.json();
      setInviteDetails(details);

      // If not logged in, show sign-in options
      if (!user) {
        setStatus('loading');
      }
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to load invitation');
    }
  }

  async function acceptInvitation() {
    try {
      setStatus('loading');
      const response = await fetch('/api/team/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (!response.ok) {
        const error = await response.json();

        // If already a member, that's actually success!
        if (error.error?.includes('already a member')) {
          setStatus('success');
          setMessage('You\'re already a member of this team!');
          await refreshBusinesses();
          router.push('/dashboard');
          return;
        }

        throw new Error(error.error || 'Failed to accept invitation');
      }

      const { businessId } = await response.json();

      // Refresh businesses to include the new one
      await refreshBusinesses();

      setStatus('success');
      setMessage('Successfully joined the team!');

      // Redirect immediately
      router.push('/dashboard');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message || 'Failed to accept invitation');
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      // Reload page to show sign-in options
      window.location.reload();
    } catch (error) {
      console.error('Sign out failed:', error);
      setSigningOut(false);
    }
  }

  // Wrong account signed in
  if (status === 'wrong-account' && user && inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-start gap-3 mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-900 mb-1">Wrong Account</h3>
              <p className="text-sm text-amber-800">
                This invitation is for <strong>{inviteDetails.email}</strong>, but you're signed in as <strong>{user.email}</strong>.
              </p>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
          <p className="text-gray-600 mb-6">
            You've been invited to join <strong>{inviteDetails.businessName}</strong> as a <strong>{inviteDetails.role}</strong>.
          </p>

          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {signingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing Out...
                </>
              ) : (
                <>
                  <LogOut className="w-4 h-4" />
                  Sign Out & Use Correct Account
                </>
              )}
            </button>
            <Link
              href="/dashboard"
              className="block w-full px-4 py-2 bg-gray-100 text-gray-900 text-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!user && inviteDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Team Invitation</h1>
          <p className="text-gray-600 mb-6">
            You've been invited to join <strong>{inviteDetails.businessName}</strong> as a <strong>{inviteDetails.role}</strong>.
          </p>
          {inviteDetails.email && (
            <p className="text-sm text-gray-500 mb-6">
              Invitation for: <strong>{inviteDetails.email}</strong>
            </p>
          )}
          <div className="space-y-3">
            <a
              href={`/login?redirect=/invite/${token}`}
              className="block w-full px-4 py-2 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In
            </a>
            <a
              href={`/signup?invite=${token}`}
              className="block w-full px-4 py-2 bg-gray-100 text-gray-900 text-center rounded-lg hover:bg-gray-200 transition-colors"
            >
              Create Account
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4 bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {(status === 'loading' || status === 'checking') && (
            <>
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {status === 'checking' ? 'Loading Invitation...' : 'Accepting Invitation...'}
              </h1>
              <p className="text-gray-600">
                {status === 'checking' ? 'Please wait...' : 'Adding you to the team...'}
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome to the Team!</h1>
              <p className="text-gray-600 mb-2">{message}</p>
              <p className="text-sm text-gray-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Redirecting to dashboard...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Something Went Wrong</h1>
              <p className="text-gray-600 mb-6">{message}</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
                <Link
                  href="/dashboard"
                  className="block w-full px-4 py-2 bg-gray-100 text-gray-900 text-center rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Go to Dashboard
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
