'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/api/supabase';
import type { User } from '@supabase/supabase-js';
import type { BusinessWithRole } from '@/lib/api/supabase';

interface AuthContextType {
  user: User | null;
  businesses: BusinessWithRole[];
  currentBusiness: BusinessWithRole | null;
  loading: boolean;
  refreshBusinesses: () => Promise<void>;
  switchBusiness: (businessId: string) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  businesses: [],
  currentBusiness: null,
  loading: true,
  refreshBusinesses: async () => {},
  switchBusiness: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [businesses, setBusinesses] = useState<BusinessWithRole[]>([]);
  const [currentBusiness, setCurrentBusiness] = useState<BusinessWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const initializingRef = useRef(false);
  const router = useRouter();

  // Fetch all businesses for the current user
  const fetchBusinesses = useCallback(async (): Promise<BusinessWithRole[]> => {
    console.log('📡 [FETCH] Fetching businesses for user');

    try {
      const response = await fetch('/api/businesses', {
        credentials: 'include', // Include cookies
      });

      if (!response.ok) {
        console.error('❌ [FETCH] Failed to fetch businesses:', response.status, response.statusText);
        return [];
      }

      const { businesses: bizList } = await response.json();
      console.log('✅ [FETCH] Found', bizList?.length || 0, 'businesses:', bizList);
      return bizList || [];
    } catch (err: any) {
      console.error('❌ [FETCH] Exception:', err.message);
      return [];
    }
  }, []);

  // Load active business ID from localStorage
  const getActiveBusinessId = useCallback((userId: string): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`active_business_${userId}`);
  }, []);

  // Save active business ID to localStorage
  const saveActiveBusinessId = useCallback((userId: string, businessId: string) => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(`active_business_${userId}`, businessId);
  }, []);

  // Switch to a different business
  const switchBusiness = useCallback((businessId: string) => {
    const business = businesses.find(b => b.id === businessId);
    if (business && user) {
      console.log('🔄 Switching to business:', business.name);
      setCurrentBusiness(business);
      saveActiveBusinessId(user.id, businessId);
    }
  }, [businesses, user, saveActiveBusinessId]);

  // Load user and businesses
  const loadUserAndBusinesses = useCallback(async (currentUser: User) => {
    console.log('🔄 Loading businesses for user:', currentUser.email);

    // Fetch all businesses user belongs to
    const bizList = await fetchBusinesses();
    setBusinesses(bizList);

    if (bizList.length === 0) {
      console.warn('⚠️ User has no businesses');
      setCurrentBusiness(null);
      return;
    }

    // Try to load previously active business
    const activeBusinessId = getActiveBusinessId(currentUser.id);
    let activeBusiness = bizList.find(b => b.id === activeBusinessId);

    // If no saved preference or business not found, use first business
    if (!activeBusiness) {
      activeBusiness = bizList[0];
    }

    console.log('✅ Setting active business:', activeBusiness.name);
    setCurrentBusiness(activeBusiness);
    saveActiveBusinessId(currentUser.id, activeBusiness.id);
  }, [fetchBusinesses, getActiveBusinessId, saveActiveBusinessId]);

  // Refresh businesses (can be called manually)
  const refreshBusinesses = useCallback(async () => {
    if (user) {
      await loadUserAndBusinesses(user);
    }
  }, [user, loadUserAndBusinesses]);

  // Initialize auth state
  useEffect(() => {
    console.log('🔄 [AUTH] useEffect triggered. initializingRef:', initializingRef.current);

    // Prevent double initialization in strict mode
    if (initializingRef.current) {
      console.log('⏭️ [AUTH] Already initializing, skipping');
      return;
    }
    initializingRef.current = true;

    let mounted = true;

    const initializeAuth = async () => {
      console.log('🔍 [AUTH] Starting initialization...');

      try {
        console.log('📡 [AUTH] Fetching session from Supabase...');
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('📡 [AUTH] Session fetch complete:', { hasSession: !!session, error: !!error });

        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setUser(null);
            setBusinesses([]);
            setCurrentBusiness(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          console.log('👤 [AUTH] Found session for:', session.user.email);
          console.log('🔧 [AUTH] Setting user (mounted:', mounted, ')...');
          setUser(session.user);
          // Wait for businesses to load before setting loading=false
          console.log('🔧 [AUTH] Loading businesses...');
          await loadUserAndBusinesses(session.user);
          console.log('✅ [AUTH] Businesses loaded');
        } else {
          console.log('❌ [AUTH] No active session');
          setUser(null);
          setBusinesses([]);
          setCurrentBusiness(null);
        }
      } catch (error) {
        console.error('❌ [AUTH] Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setBusinesses([]);
          setCurrentBusiness(null);
        }
      } finally {
        if (mounted) {
          console.log('✅ [AUTH] Setting loading=false');
          setLoading(false);
        }
      }
    };

    console.log('🚀 [AUTH] Calling initializeAuth()...');
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, 'User:', session?.user?.email);

      if (!mounted) return;

      // Handle sign in
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ [AUTH] SIGNED_IN - Setting user:', session.user.email);
        setUser(session.user);
        // Load businesses before setting loading=false
        await loadUserAndBusinesses(session.user);
        setLoading(false);
      }
      // Handle sign out
      else if (event === 'SIGNED_OUT') {
        setUser(null);
        setBusinesses([]);
        setCurrentBusiness(null);
        setLoading(false);
      }
      // Handle token refresh - just update user, don't reload businesses
      else if (event === 'TOKEN_REFRESHED' && session?.user) {
        setUser(session.user);
      }
      // Initial session is handled by initializeAuth
      else if (event === 'INITIAL_SESSION') {
        // Already handled above
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserAndBusinesses]);

  // Timeout fallback to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth loading timeout - forcing complete');
        setLoading(false);
      }
    }, 3000); // 3 second timeout (reduced from 10)

    return () => clearTimeout(timeout);
  }, [loading]);

  return (
    <AuthContext.Provider value={{ user, businesses, currentBusiness, loading, refreshBusinesses, switchBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
