"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";
import { supabase } from "@/lib/supabase";
import { User, AuthState } from "@/lib/types";
import { isAuthError, clearAuthStorage } from "@/lib/utils";

interface AuthContextType extends AuthState {
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  createUser: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const clearAuthState = () => {
    setUser(null);
    setLoading(false);
  };

  const handleAuthError = useCallback((error: unknown) => {
    console.error("Auth error:", error);

    // Check for auth-related errors using utility function
    if (isAuthError(error)) {
      // Clear invalid session data
      clearAuthState();

      // Clear auth storage
      clearAuthStorage();

      // Force sign out to clear any stored tokens
      supabase.auth.signOut().catch(console.error);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Get initial session with error handling and timeout
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent hanging
        const timeout = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Auth timeout")), 5000),
        );

        const sessionPromise = supabase.auth.getSession();

        const {
          data: { session },
          error,
        } = await Promise.race([sessionPromise, timeout]);

        if (error) {
          console.error("Session error:", error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(
            session?.user
              ? {
                  id: session.user.id,
                  email: session.user.email!,
                  role: "admin", // Default role for now
                  created_at: session.user.created_at,
                }
              : null,
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        // Force loading to false even on timeout/error
        if (mounted) {
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      // Handle different auth events
      if (event === "TOKEN_REFRESHED") {
        console.log("Token refreshed successfully");
      } else if (event === "SIGNED_OUT") {
        console.log("User signed out");
        clearAuthState();
        return;
      }

      setUser(
        session?.user
          ? {
              id: session.user.id,
              email: session.user.email!,
              role: "admin", // Default role for now
              created_at: session.user.created_at,
            }
          : null,
      );
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthError]);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      // Clear user state immediately
      clearAuthState();

      // Sign out from Supabase
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        // Don't throw here - user state is already cleared
      }
    } catch (error) {
      console.error("Error during sign out:", error);
      // Ensure user state is cleared even if sign out fails
      clearAuthState();
    }
  };

  const createUser = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
    } catch (error) {
      handleAuthError(error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signOut,
        createUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
