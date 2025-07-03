"use client";

import { ReactNode } from "react";
import { useAuth } from "./auth-provider";
import LoginForm from "./login-form";
import { Button } from "@/components/ui/button";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#051e50] mr-3"></div>
          <span className="text-[#051e50]">Laden...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-[#051e50] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img
                src="/RUBIX_logo_white.svg"
                alt="Rubix"
                className="h-[30px] w-auto mr-3"
              />
              <div>
                <h1 className="text-xl font-bold text-white">
                  Admin Dashboard
                </h1>
                <p className="text-gray-300 text-sm">
                  Ingelogd als: {user.email}
                </p>
              </div>
            </div>
            <Button
              onClick={signOut}
              variant="outline"
              className="bg-transparent border-white text-white hover:bg-white hover:text-[#051e50]"
            >
              Uitloggen
            </Button>
          </div>
        </div>
      </div>

      {/* Admin Content */}
      {children}
    </div>
  );
}
