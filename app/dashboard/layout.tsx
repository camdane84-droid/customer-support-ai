'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

export default function DashboardLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const redirectedRef = useRef(false);

  useEffect(() => {
    console.log('📊 [DASHBOARD LAYOUT] State:', { loading, hasUser: !!user, userEmail: user?.email, redirected: redirectedRef.current });

    // Redirect to login only once if not authenticated
    if (!loading && !user && !redirectedRef.current) {
      console.log('🔒 No user, redirecting to login...');
      redirectedRef.current = true;
      router.push('/login');
    } else if (user) {
      // Reset redirect flag when user logs in
      console.log('✅ [DASHBOARD LAYOUT] User authenticated:', user.email);
      redirectedRef.current = false;
    }
  }, [user, loading]); // Remove router from dependencies - it's stable

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
