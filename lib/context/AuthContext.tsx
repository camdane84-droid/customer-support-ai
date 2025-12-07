'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/api/supabase';
import { getCurrentUser, getCurrentBusiness } from '@/lib/auth';
import type { User } from '@supabase/supabase-js';
import type { Business } from '@/lib/api/supabase';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  business: null,
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active session
    checkUser();

    // Fallback timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ Auth loading timeout - forcing loading to false');
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔐 Auth event:', event, 'User:', session?.user?.email);

      if (session?.user) {
        setUser(session.user);

        // Load business
        try {
          console.log('📡 Auth state change: Fetching business for:', session.user.email);
          const biz = await getCurrentBusiness(session.user.email!);
          console.log('🏢 Business result:', biz ? `Found: ${biz.name}` : 'Not found');

          // If no business exists, create one now
          if (!biz && session.user.email) {
            console.log('📝 No business found, creating one...');
            await createBusinessForUser(session.user.email, session.user.user_metadata?.business_name);
            // Reload business
            const newBiz = await getCurrentBusiness(session.user.email);
            console.log('🏢 New business created:', newBiz?.name);
            setBusiness(newBiz);
          } else {
            console.log('✅ Setting business from auth state:', biz?.name);
            setBusiness(biz);
          }
        } catch (error: any) {
          console.error('❌ Failed to load business:', {
            message: error?.message,
            code: error?.code,
            details: error?.details,
            hint: error?.hint,
            fullError: error
          });
          setBusiness(null);
        }
      } else {
        console.log('❌ No session/user in auth state change');
        setUser(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    console.log('🔍 Checking user...');
    try {
      const currentUser = await getCurrentUser();
      console.log('👤 Current user:', currentUser?.email);

      if (currentUser) {
        setUser(currentUser);

        try {
          console.log('📡 Fetching business for:', currentUser.email);
          const biz = await getCurrentBusiness(currentUser.email!);
          console.log('🏢 Business result:', biz ? `Found: ${biz.name}` : 'Not found');

          // If no business exists, create one
          if (!biz && currentUser.email) {
            console.log('📝 Creating business for existing user...');
            await createBusinessForUser(currentUser.email, currentUser.user_metadata?.business_name);
            const newBiz = await getCurrentBusiness(currentUser.email);
            console.log('🏢 New business created:', newBiz?.name);
            setBusiness(newBiz);
          } else {
            console.log('✅ Setting business:', biz?.name);
            setBusiness(biz);
          }
        } catch (bizError: any) {
          console.error('❌ Error fetching/creating business:', {
            message: bizError?.message,
            code: bizError?.code,
            details: bizError?.details,
            hint: bizError?.hint,
            fullError: bizError
          });
          // Set business to null but don't block loading
          setBusiness(null);
        }
      } else {
        console.log('❌ No user found');
        setUser(null);
        setBusiness(null);
      }
    } catch (error: any) {
      console.error('❌ Error checking user:', error?.message || error);
      setUser(null);
      setBusiness(null);
    } finally {
      console.log('✅ Setting loading to false');
      setLoading(false);
    }
  }

  return (
    <AuthContext.Provider value={{ user, business, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

// Helper function to create business if it doesn't exist
async function createBusinessForUser(email: string, businessName?: string) {
  const name = businessName || email.split('@')[0] + "'s Business";

  const { error } = await supabase
    .from('businesses')
    .insert({
      email: email,
      name: name,
    });

  if (error && error.code !== '23505') { // 23505 = unique constraint violation (already exists)
    console.error('Failed to create business:', error);
    throw error;
  }

  console.log('✅ Business created:', name);
}
