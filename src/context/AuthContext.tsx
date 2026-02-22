import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types';
import { supabase } from '../services/supabaseClient';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // FAILSAFE: Force stop loading after 3 seconds to prevent infinite "Iniciando..."
    const safetyTimer = setTimeout(() => {
      if (mounted) {
        console.warn('AuthContext: Safety timer triggered. Forcing isLoading=false');
        setIsLoading(false);
      }
    }, 3000);

    const fetchProfile = async (sessionUser: any) => {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', sessionUser.id)
          .single();

        if (!mounted) return null;

        if (error) {
          console.warn('AuthContext: Error fetching profile:', error);
          return null;
        }
        return profile;
      } catch (error) {
        console.error('AuthContext: Unexpected error fetching profile:', error);
        return null;
      }
    };

    let isUpdatingProfile = false;

    const handleUserUpdate = async (session: any) => {
      console.log('AuthContext: handleUserUpdate started. session exists?', !!session);

      // Prevent double execution race condition on hard refresh
      if (isUpdatingProfile) {
        console.log('AuthContext: handleUserUpdate is already running in parallel, skipping...');
        return;
      }
      isUpdatingProfile = true;

      try {
        if (!session?.user) {
          if (mounted) {
            console.log('AuthContext: No session user. Setting user=null, isLoading=false');
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        // 1. Optimistic set - UNBLOCK UI IMMEDIATELY
        const cachedRole = localStorage.getItem('userRole')?.toLowerCase();
        const metaRole = session.user.user_metadata?.role?.toLowerCase();
        // Priority: Cache (Correct/Latest) > Meta (Maybe Stale) > Default
        const effectiveRole = cachedRole || metaRole || 'partner';

        const initialUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
          role: effectiveRole,
          avatar: session.user.user_metadata?.avatar,
          has_completed_tour: true // Optimistically assume true until DB confirms it's false for new users
        };

        if (mounted) {
          console.log('AuthContext: Optimistic user set. Setting isLoading=false');
          setUser(initialUser);
          setIsLoading(false);
        }

        // 2. Background profile update
        console.log('AuthContext: Fetching profile in background...');
        fetchProfile(session.user).then(profile => {
          if (mounted && profile) {
            console.log('AuthContext: Profile fetched successfully', profile);
            const dbName = profile?.full_name || profile?.name || profile?.nombre || profile?.username;
            const rawDbRole = profile?.role;
            const dbRole = rawDbRole ? rawDbRole.toLowerCase() : null;

            // Always update cache if we get a valid role
            if (dbRole) localStorage.setItem('userRole', dbRole);

            setUser(prev => {
              if (!prev || prev.id !== session.user.id) return prev;

              // PROTECTION: Don't downgrade Super Admin to Partner based on ambiguous DB data
              if (prev.role === 'super_admin' && dbRole && dbRole !== 'super_admin') {
                console.warn('AuthContext: SAFETY BLOCKED - Prevented downgrading Super Admin to', dbRole);
                // Update other fields but KEEP role as super_admin
                return {
                  ...prev,
                  name: dbName || prev.name,
                  avatar: profile?.avatar_url || prev.avatar,
                  has_completed_tour: profile?.has_completed_tour ?? false
                };
              }

              return {
                ...prev,
                name: dbName || prev.name,
                role: dbRole || prev.role,
                avatar: profile?.avatar_url || prev.avatar,
                has_completed_tour: profile?.has_completed_tour ?? false
              };
            });
          }
        });

        if (mounted) setIsLoading(false);
      } finally {
        isUpdatingProfile = false;
      }
    };

    // Initialize Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(`AuthContext: Auth Event ${event}`, session?.user?.id);

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        clearTimeout(safetyTimer);
        await handleUserUpdate(session);
      } else if (event === 'SIGNED_OUT') {
        if (mounted) {
          clearTimeout(safetyTimer);
          setUser(null);
          setIsLoading(false);
        }
      }
    });

    // Check initial session manually in case event doesn't fire immediately
    console.log('AuthContext: Starting manual getSession check...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: getSession returned. session exists?', !!session);
      if (!mounted) return;

      if (!session) {
        console.log('AuthContext: No initial session. Setting isLoading=false');
        clearTimeout(safetyTimer);
        setIsLoading(false);
      } else {
        console.log('AuthContext: Initial session found. Calling handleUserUpdate...');
        clearTimeout(safetyTimer);
        handleUserUpdate(session);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(safetyTimer);
      subscription.unsubscribe();
    };
  }, []);

  const login = async (credentials: LoginCredentials): Promise<{ success: boolean; error?: string }> => {
    console.log('AuthContext: login started');

    if (!supabase) {
      console.log('AuthContext: No supabase client');
      return { success: false, error: 'Error interno: cliente de base de datos no disponible.' };
    }

    // FORCE CLEANUP: Ensure any previous session is cleared before attempting new login
    // This fixes the "hanging" issue when switching accounts or after a bad state
    try {
      const signOutTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('SignOut Timeout')), 2000));
      await Promise.race([
        supabase.auth.signOut(),
        signOutTimeout
      ]);
      console.log('AuthContext: Forced sign out before login');
    } catch (e) {
      console.warn('AuthContext: Error during forced sign out (ignoring):', e);
    }

    // Clear local state as well
    setUser(null);

    setIsLoading(true);

    try {
      // Create a timeout promise that rejects after 10 seconds
      const timeoutPromise = new Promise<{ data: any; error: any }>((_, reject) => {
        setTimeout(() => reject(new Error('Login request timed out')), 10000);
      });

      // Race between Supabase login and timeout
      const { data, error } = await Promise.race([
        supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password
        }),
        timeoutPromise
      ]);

      if (error) {
        console.error('AuthContext: Login error:', error);

        let errorMessage = 'Credenciales inválidas. Intenta de nuevo.';
        if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Debes confirmar tu email antes de iniciar sesión. Por favor revisa tu bandeja de entrada.';
        } else if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Credenciales inválidas. Intenta de nuevo.';
        } else if (error.message.includes('timed out')) {
          errorMessage = 'La solicitud tardó demasiado. Revisa tu conexión a internet.';
        }

        return { success: false, error: errorMessage };
      }

      console.log('AuthContext: Login successful, user:', data.user?.id);

      if (data.user) {
        // Fetch profile from DB with another race condition to prevent hanging
        const profileTimeoutPromise = new Promise<{ data: any; error: any }>((resolve) => {
          setTimeout(() => resolve({ data: null, error: new Error('Profile fetch timeout') }), 5000);
        });

        const { data: profile, error: profileError } = await Promise.race([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single(),
          profileTimeoutPromise
        ]);

        if (profileError) {
          console.warn('AuthContext: Error fetching profile during login:', profileError);
        } else {
          console.log('AuthContext: Profile fetched during login', profile);
        }

        const dbName = profile?.full_name || profile?.name || profile?.nombre || profile?.username;
        const dbRole = profile?.role;

        const userData: User = {
          id: data.user.id,
          email: data.user.email || '',
          name: dbName || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuario',
          role: dbRole || data.user.user_metadata?.role || 'partner',
          avatar: profile?.avatar_url || data.user.user_metadata?.avatar
        };

        if (dbRole) localStorage.setItem('userRole', dbRole);

        setUser(userData);
        console.log('AuthContext: User set after login');
        return { success: true };
      }

      return { success: false, error: 'No se pudo obtener la información del usuario.' };
    } catch (error: any) {
      console.error('AuthContext: Unexpected error in login:', error);
      return { success: false, error: error.message || 'Error inesperado al intentar iniciar sesión.' };
    } finally {
      console.log('AuthContext: login finally block - setIsLoading(false)');
      setIsLoading(false);
    }
  };

  const logout = async () => {
    // 1. Try to tell the server we are leaving
    if (supabase) {
      try {
        const signOutTimeout = new Promise((_, reject) => setTimeout(() => reject(new Error('SignOut Timeout')), 2000));
        await Promise.race([
          supabase.auth.signOut(),
          signOutTimeout
        ]);
      } catch (e) {
        console.error('Logout error/timeout (ignoring):', e);
      }
    }

    // 2. NUKE LOCAL STATE - This prevents "zombie sessions" on refresh
    localStorage.clear(); // Clear everything including 'userRole' and Supabase tokens

    // 3. Update App State
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
