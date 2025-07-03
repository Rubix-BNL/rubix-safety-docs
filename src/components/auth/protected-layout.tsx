"use client";

import { ReactNode } from "react";
import { useAuth } from "./auth-provider";
import LoginForm from "./login-form";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface ProtectedLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  showAdminLink?: boolean;
}

export default function ProtectedLayout({
  children,
  title,
  subtitle,
  showAdminLink = false,
}: ProtectedLayoutProps) {
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
      {/* Header */}
      <div className="bg-[#ffd700] border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-[#051e50] flex items-center">
                <img
                  src="/RUBIX_logo_blue.svg"
                  alt="Rubix"
                  className="h-[30px] w-[106px] mr-3"
                />
                {title}
              </h1>
              {subtitle && <p className="text-[#051e50] mt-1">{subtitle}</p>}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-[#051e50] text-sm font-medium">
                  Ingelogd als:
                </p>
                <p className="text-[#051e50] text-xs">{user.email}</p>
              </div>
              {showAdminLink && (
                <Button
                  asChild
                  className="bg-[#051e50] hover:bg-[#051e50]/90 text-white font-medium"
                >
                  <Link href="/admin">Admin Dashboard</Link>
                </Button>
              )}
              <Button
                onClick={signOut}
                variant="outline"
                className="border-[#051e50] text-[#051e50] hover:bg-[#051e50] hover:text-white"
              >
                Uitloggen
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
