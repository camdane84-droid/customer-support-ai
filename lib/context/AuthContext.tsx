'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/api/supabase';
import type { User } from '@supabase/supabase-js';
import type { Business } from '@/lib/api/supabase';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  loading: boolean;
  refreshBusiness: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  business: null,
  loading: true,
  refreshBusiness: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const initializingRef = useRef(false);
  const router = useRouter();

  // Fetch business for a user email - optimized with caching
  const fetchBusiness = useCallback(async (email: string, useCache: boolean = true): Promise<Business | null> => {
    console.log('📡 [FETCH] Fetching business for:', email);

    // Try cache first for instant loads
    if (useCache && typeof window !== 'undefined') {
      const cacheKey = `business_${email}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const cachedBusiness = JSON.parse(cached);
          console.log('⚡ [CACHE] Using cached business:', cachedBusiness.name);
          // Refresh in background to keep cache fresh
          setTimeout(() => fetchBusiness(email, false), 100);
          return cachedBusiness;
        } catch (e) {
          console.error('❌ [CACHE] Failed to parse cached business');
        }
      }
    }

    try {
      const { data, error } = await supabase
        .from('businesses')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (error) {
        console.error('❌ [FETCH] Error:', error.message, error.code);
        return null;
      }

      if (data) {
        console.log('✅ [FETCH] Business found:', data.name, 'ID:', data.id);
        // Cache for next time
        if (typeof window !== 'undefined') {
          localStorage.setItem(`business_${email}`, JSON.stringify(data));
        }
        return data;
      } else {
        console.log('⚠️ [FETCH] No business found for email:', email);
        return null;
      }
    } catch (err: any) {
      console.error('❌ [FETCH] Exception:', err.message);
      return null;
    }
  }, []);

  // Create business for user - with duplicate handling
  const createBusiness = useCallback(async (email: string, businessName?: string): Promise<Business | null> => {
    const name = businessName || `${email.split('@')[0]}'s Business`;
    console.log('📝 Creating business:', name, 'for:', email);

    try {
      const { data, error } = await supabase
        .from('businesses')
        .insert({
          email: email,
          name: name,
        })
        .select()
        .single();

      if (error) {
        // Check if it's a duplicate - if so, fetch the existing one
        if (error.code === '23505') {
          console.log('⚠️ Business already exists, fetching...');
          return fetchBusiness(email);
        }
        console.error('❌ Failed to create business:', error);
        return null;
      }

      console.log('✅ Business created:', data.name);
      return data;
    } catch (err) {
      console.error('❌ Exception creating business:', err);
      return null;
    }
  }, [fetchBusiness]);

  // Load user and business - optimized for speed
  const loadUserAndBusiness = useCallback(async (currentUser: User) => {
    console.log('🔄 Loading business for user:', currentUser.email);

    if (!currentUser.email) {
      console.error('❌ User has no email');
      setBusiness(null);
      return;
    }

    // First try to fetch existing business (no artificial delay)
    let biz = await fetchBusiness(currentUser.email);

    // If no business exists, create one
    if (!biz) {
      console.log('📝 No business found, creating one...');
      const businessName = currentUser.user_metadata?.business_name;
      biz = await createBusiness(currentUser.email, businessName);

      // If creation failed, try fetching one more time (race condition handling)
      if (!biz) {
        console.log('🔄 Creation may have raced, trying fetch again...');
        biz = await fetchBusiness(currentUser.email);
      }
    }

    if (biz) {
      console.log('✅ Setting business:', biz.name);
      setBusiness(biz);
    } else {
      console.error('❌ Could not fetch or create business');
      setBusiness(null);
    }
  }, [fetchBusiness, createBusiness]);

  // Refresh business (can be called manually) - clears cache
  const refreshBusiness = useCallback(async () => {
    if (user?.email) {
      // Clear cache to force fresh fetch
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`business_${user.email}`);
      }
      await loadUserAndBusiness(user);
    }
  }, [user, loadUserAndBusiness]);

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
            setBusiness(null);
            setLoading(false);
          }
          return;
        }

        if (session?.user) {
          console.log('👤 [AUTH] Found session for:', session.user.email);
          console.log('🔧 [AUTH] Setting user (mounted:', mounted, ')...');
          setUser(session.user);
          // Load business in background, don't block on it (regardless of mounted state)
          console.log('🔧 [AUTH] Loading business in background...');
          loadUserAndBusiness(session.user).catch(err => {
            console.error('❌ [AUTH] Background business load failed:', err);
          });
        } else {
          console.log('❌ [AUTH] No active session');
          setUser(null);
          setBusiness(null);
        }
      } catch (error) {
        console.error('❌ [AUTH] Auth initialization error:', error);
        if (mounted) {
          setUser(null);
          setBusiness(null);
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
        setLoading(false);
        // Load business in background, don't block
        loadUserAndBusiness(session.user).catch(err => {
          console.error('❌ [AUTH] Background business load failed:', err);
        });
      }
      // Handle sign out
      else if (event === 'SIGNED_OUT') {
        setUser(null);
        setBusiness(null);
        setLoading(false);
      }
      // Handle token refresh - just update user, don't reload business
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
  }, [loadUserAndBusiness]);

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
    <AuthContext.Provider value={{ user, business, loading, refreshBusiness }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
