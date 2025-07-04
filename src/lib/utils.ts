import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Auth utility functions
export function clearAuthStorage() {
  try {
    // Check if localStorage is available (not in SSR)
    if (typeof window !== "undefined" && window.localStorage) {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("supabase.auth") || key.includes("auth")) {
          localStorage.removeItem(key);
        }
      });
    }
  } catch (error) {
    // Silent error handling for auth storage cleanup
  }
}

export function isAuthError(error: unknown): boolean {
  if (!error) return false;

  const errorObj = error as { message?: string; status?: number };
  const message = errorObj.message?.toLowerCase() || "";
  const status = errorObj.status;

  return message.includes("refresh") || message.includes("token") || message.includes("unauthorized") || message.includes("invalid") || status === 400 || status === 401 || status === 403;
}

export function handleAuthError(error: unknown): void {
  if (isAuthError(error)) {
    clearAuthStorage();

    // Reload the page to reset the app state
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
}
