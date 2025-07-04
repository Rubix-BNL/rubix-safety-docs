import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Auth utility functions
export function clearAuthStorage() {
  try {
    // Clear all auth-related items from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith("supabase.auth") || key.includes("auth")) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error("Error clearing auth storage:", error);
  }
}

export function isAuthError(error: any): boolean {
  if (!error) return false;

  const message = error.message?.toLowerCase() || "";
  const status = error.status;

  return (
    message.includes("refresh") ||
    message.includes("token") ||
    message.includes("unauthorized") ||
    message.includes("invalid") ||
    status === 400 ||
    status === 401 ||
    status === 403
  );
}

export function handleAuthError(error: any): void {
  if (isAuthError(error)) {
    console.error("Authentication error detected:", error);
    clearAuthStorage();

    // Reload the page to reset the app state
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }
}
