'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { supabase } from '@/lib/api/supabase';

export default function DebugAuthPage() {
  const { user, currentBusiness: business, loading } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    checkAuth();
  }, [user]);

  async function checkAuth() {
    setChecking(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      authLoading: loading,
      hasUser: !!user,
      hasBusiness: !!business,
      userEmail: user?.email,
      userId: user?.id,
      businessId: business?.id,
      businessName: business?.name,
      autoGenerateNotes: (business as any)?.auto_generate_notes,
    };

    // Check session
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      info.hasSession = !!session;
      info.sessionError = sessionError?.message;
    } catch (err: any) {
      info.sessionCheckFailed = err.message;
    }

    // Try to fetch business manually
    if (user?.email) {
      try {
        const { data: businesses, error: bizError } = await supabase
          .from('businesses')
          .select('*')
          .eq('email', user.email);

        info.manualBusinessFetch = {
          found: businesses?.length || 0,
          error: bizError?.message,
          data: businesses,
        };
      } catch (err: any) {
        info.manualBusinessFetchFailed = err.message;
      }
    }

    setDebugInfo(info);
    setChecking(false);
  }

  async function handleCreateBusiness() {
    if (!user?.email) {
      alert('No user email found');
      return;
    }

    setChecking(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          email: user.email,
          name: `${user.email.split('@')[0]}'s Business`,
          auto_generate_notes: false,
        })
        .select()
        .single();

      if (error) {
        alert(`Error creating business: ${error.message}`);
      } else {
        alert('Business created! Refreshing page...');
        window.location.reload();
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setChecking(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Debug</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${loading ? 'bg-yellow-500' : 'bg-green-500'}`}></span>
              <span>Auth Loading: {loading ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${user ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>User: {user ? user.email : 'Not logged in'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-3 h-3 rounded-full ${business ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span>Business: {business ? business.name : 'Not found'}</span>
            </div>
          </div>
        </div>

        {debugInfo && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
            <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Actions</h2>
          <div className="space-y-3">
            <button
              onClick={checkAuth}
              disabled={checking}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300"
            >
              {checking ? 'Checking...' : 'Re-check Auth State'}
            </button>

            {user && !business && (
              <button
                onClick={handleCreateBusiness}
                disabled={checking}
                className="ml-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300"
              >
                Create Business Manually
              </button>
            )}

            <button
              onClick={() => window.location.href = '/dashboard'}
              className="ml-3 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">Console Logs</h3>
          <p className="text-sm text-yellow-800">
            Open your browser console (F12) to see detailed authentication logs with [AUTH] prefix.
          </p>
        </div>
      </div>
    </div>
  );
}
