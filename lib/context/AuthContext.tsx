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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        try {
          const biz = await getCurrentBusiness(session.user.email!);
          setBusiness(biz);
        } catch (error) {
          console.error('Failed to load business:', error);
        }
      } else {
        setUser(null);
        setBusiness(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        const biz = await getCurrentBusiness(currentUser.email!);
        setBusiness(biz);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
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
