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
    // Redirect to login only once if not authenticated
    if (!loading && !user && !redirectedRef.current) {
      redirectedRef.current = true;
      router.push('/login');
    } else if (user) {
      redirectedRef.current = false;
    }
  }, [user, loading]);

  // Always render children - pages handle their own loading skeletons.
  // The useEffect above handles redirect when no user.
  return <>{children}</>;
}
