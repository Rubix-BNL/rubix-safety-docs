"use client";

import { useState } from "react";
import { useAuth } from "./auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { signIn, createUser } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Vul alle velden in");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (mode === "login") {
        await signIn(email, password);
      } else {
        await createUser(email, password);
        setMode("login");
        setError("Account aangemaakt! Je kunt nu inloggen.");
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (mode === "login") {
        setError("Onjuiste email of wachtwoord");
      } else {
        setError(err.message || "Fout bij aanmaken account");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img
            src="/RUBIX_logo_blue.svg"
            alt="Rubix"
            className="h-[40px] w-auto mx-auto mb-4"
          />
          <h2 className="text-3xl font-bold text-[#051e50]">Admin Dashboard</h2>
          <p className="mt-2 text-sm text-gray-600">
            {mode === "login"
              ? "Log in om toegang te krijgen"
              : "Maak een nieuw admin account"}
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@rubix.com"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Wachtwoord
              </label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={loading}
                minLength={6}
              />
            </div>

            {error && (
              <div
                className={`text-sm p-3 rounded-md ${
                  error === "Account aangemaakt! Je kunt nu inloggen."
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {error}
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#051e50] hover:bg-[#051e50]/90 text-white font-medium"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {mode === "login"
                    ? "Bezig met inloggen..."
                    : "Account aanmaken..."}
                </div>
              ) : mode === "login" ? (
                "Inloggen"
              ) : (
                "Account Aanmaken"
              )}
            </Button>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Alleen geautoriseerde gebruikers hebben toegang tot dit admin
            dashboard
          </p>
        </div>
      </div>
    </div>
  );
}
