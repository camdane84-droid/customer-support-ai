'use client';

import { useAuth } from '@/lib/context/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/lib/api/supabase';
import { useState } from 'react';

export default function DebugPage() {
  const { user, business, loading } = useAuth();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loadingBusinesses, setLoadingBusinesses] = useState(false);

  async function loadAllBusinesses() {
    setLoadingBusinesses(true);
    const { data, error } = await supabase
      .from('businesses')
      .select('*');

    if (error) {
      console.error('Error loading businesses:', error);
    } else {
      setBusinesses(data || []);
    }
    setLoadingBusinesses(false);
  }

  if (loading) {
    return <DashboardLayout><div>Loading...</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="p-8 max-w-4xl">
        <h1 className="text-2xl font-bold mb-6">Debug Information</h1>

        <div className="space-y-6">
          {/* User Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">User Information</h2>
            <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
              {JSON.stringify({
                id: user?.id,
                email: user?.email,
                created_at: user?.created_at,
              }, null, 2)}
            </pre>
          </div>

          {/* Business Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Current Business</h2>
            {business ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(business, null, 2)}
              </pre>
            ) : (
              <p className="text-red-600">❌ No business found!</p>
            )}
          </div>

          {/* All Businesses */}
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">All Businesses in Database</h2>
              <button
                onClick={loadAllBusinesses}
                disabled={loadingBusinesses}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
              >
                {loadingBusinesses ? 'Loading...' : 'Load Businesses'}
              </button>
            </div>
            {businesses.length > 0 ? (
              <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(businesses, null, 2)}
              </pre>
            ) : (
              <p className="text-gray-500">Click button to load businesses</p>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">What to Check:</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>Is there a business with your email?</li>
              <li>Does the business have an 'id' field?</li>
              <li>Does the current business match one in the database?</li>
            </ul>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
